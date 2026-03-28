import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateJournalEntryDto } from "./dto/accounting.dto";

@Injectable()
export class JournalsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    filters?: {
      status?: string;
      fiscalYearId?: string;
      from?: string;
      to?: string;
    },
  ) {
    return this.prisma.journalEntry.findMany({
      where: {
        organizationId,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.fiscalYearId && { fiscalYearId: filters.fiscalYearId }),
        ...(filters?.from &&
          filters?.to && {
            entryDate: {
              gte: new Date(filters.from),
              lte: new Date(filters.to),
            },
          }),
      },
      include: { lines: { include: { ledgerAccount: true } } },
      orderBy: { entryDate: "desc" },
    });
  }

  async findOne(id: string) {
    const entry = await this.prisma.journalEntry.findUnique({
      where: { id },
      include: { lines: { include: { ledgerAccount: true } } },
    });
    if (!entry) throw new NotFoundException("Journal entry not found");
    return entry;
  }

  private validateBalance(lines: { debit: number; credit: number }[]) {
    const totalDebit = lines.reduce((s, l) => s + l.debit, 0);
    const totalCredit = lines.reduce((s, l) => s + l.credit, 0);
    if (Math.abs(totalDebit - totalCredit) > 0.005) {
      throw new BadRequestException(
        `Journal entry is unbalanced: debits (${totalDebit}) ≠ credits (${totalCredit})`,
      );
    }
    return { totalDebit, totalCredit };
  }

  async create(dto: CreateJournalEntryDto, createdBy: string) {
    if (!dto.lines || dto.lines.length < 2) {
      throw new BadRequestException("Journal entry must have at least 2 lines");
    }
    const { totalDebit, totalCredit } = this.validateBalance(dto.lines);

    // Validate all ledger accounts belong to the organization
    const accountIds = dto.lines.map((l) => l.ledgerAccountId);
    const accounts = await this.prisma.ledgerAccount.findMany({
      where: { id: { in: accountIds }, organizationId: dto.organizationId },
    });
    if (accounts.length !== new Set(accountIds).size) {
      throw new BadRequestException("One or more ledger accounts are invalid");
    }

    return this.prisma.journalEntry.create({
      data: {
        organizationId: dto.organizationId,
        fiscalYearId: dto.fiscalYearId,
        entryDate: new Date(dto.entryDate),
        reference: dto.reference,
        narration: dto.narration,
        totalDebit,
        totalCredit,
        status: "DRAFT",
        sourceType: dto.sourceType,
        sourceId: dto.sourceId,
        createdBy,
        lines: {
          create: dto.lines.map((l) => ({
            ledgerAccountId: l.ledgerAccountId,
            debit: l.debit,
            credit: l.credit,
            narration: l.narration,
          })),
        },
      },
      include: { lines: true },
    });
  }

  /** Post a journal entry — immutable once posted. Updates ledger account balances. */
  async post(id: string, postedBy: string) {
    const entry = await this.findOne(id);
    if (entry.status !== "DRAFT") {
      throw new BadRequestException(
        `Cannot post entry with status "${entry.status}"`,
      );
    }

    // Check fiscal year is not closed
    if (entry.fiscalYearId) {
      const fy = await this.prisma.fiscalYear.findUnique({
        where: { id: entry.fiscalYearId },
      });
      if (fy?.isClosed) {
        throw new BadRequestException(
          "Fiscal year is closed — cannot post to a closed period",
        );
      }
    }

    await this.prisma.$transaction(async (tx) => {
      // Update journal entry status
      await tx.journalEntry.update({
        where: { id },
        data: { status: "POSTED", postedBy, postedAt: new Date() },
      });

      // Update ledger account balances
      for (const line of entry.lines) {
        const acct = line.ledgerAccount;
        const isDebitNormal = ["ASSET", "EXPENSE"].includes(acct.accountType);
        const delta = isDebitNormal
          ? line.debit - line.credit
          : line.credit - line.debit;
        await tx.ledgerAccount.update({
          where: { id: line.ledgerAccountId },
          data: { currentBalance: { increment: delta } },
        });
      }
    });

    return this.findOne(id);
  }

  /** Create a reversing journal entry (mirror of the original). */
  async reverse(id: string, reason: string, createdBy: string) {
    const original = await this.findOne(id);
    if (original.status !== "POSTED") {
      throw new BadRequestException("Only posted entries can be reversed");
    }

    // Mirror lines: swap debit/credit
    const reversedLines = original.lines.map((l) => ({
      ledgerAccountId: l.ledgerAccountId,
      debit: l.credit,
      credit: l.debit,
      narration: `Reversal: ${l.narration ?? ""}`,
    }));

    const reversed = await this.create(
      {
        organizationId: original.organizationId,
        entryDate: new Date().toISOString(),
        reference: `REV-${original.reference ?? original.id}`,
        narration: `Reversal of JE ${id}: ${reason}`,
        fiscalYearId: original.fiscalYearId ?? undefined,
        lines: reversedLines,
      },
      createdBy,
    );

    // Auto-post the reversal
    return this.post(reversed.id, createdBy);
  }
}
