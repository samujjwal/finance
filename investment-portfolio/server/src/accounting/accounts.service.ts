import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateAccountGroupDto,
  UpdateAccountGroupDto,
  CreateLedgerAccountDto,
  UpdateLedgerAccountDto,
} from "./dto/accounting.dto";

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  // ======== Account Groups ========

  async createGroup(dto: CreateAccountGroupDto) {
    const existing = await this.prisma.accountGroup.findUnique({
      where: {
        organizationId_code: {
          organizationId: dto.organizationId,
          code: dto.code,
        },
      },
    });
    if (existing)
      throw new ConflictException("Account group code already exists");

    if (dto.parentId) {
      const parent = await this.prisma.accountGroup.findUnique({
        where: { id: dto.parentId },
      });
      if (!parent)
        throw new NotFoundException("Parent account group not found");
      if (parent.groupType !== dto.groupType) {
        throw new BadRequestException(
          "Child group must have the same groupType as parent",
        );
      }
    }

    return this.prisma.accountGroup.create({ data: dto });
  }

  async getGroups(organizationId: string) {
    return this.prisma.accountGroup.findMany({
      where: { organizationId },
      orderBy: [{ groupType: "asc" }, { code: "asc" }],
    });
  }

  /** Returns a tree structure of account groups. */
  async getGroupTree(organizationId: string) {
    const groups = await this.getGroups(organizationId);
    const map = new Map<string | null, any[]>();
    for (const g of groups) {
      const key = g.parentId ?? null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ ...g, children: [] });
    }
    const buildTree = (parentId: string | null): any[] => {
      return (map.get(parentId) ?? []).map((g) => ({
        ...g,
        children: buildTree(g.id),
      }));
    };
    return buildTree(null);
  }

  async updateGroup(id: string, dto: UpdateAccountGroupDto) {
    const group = await this.prisma.accountGroup.findUnique({ where: { id } });
    if (!group) throw new NotFoundException("Account group not found");
    return this.prisma.accountGroup.update({ where: { id }, data: dto });
  }

  // ======== Ledger Accounts ========

  async createLedgerAccount(dto: CreateLedgerAccountDto) {
    const existing = await this.prisma.ledgerAccount.findUnique({
      where: {
        organizationId_code: {
          organizationId: dto.organizationId,
          code: dto.code,
        },
      },
    });
    if (existing)
      throw new ConflictException("Ledger account code already exists");

    const group = await this.prisma.accountGroup.findUnique({
      where: { id: dto.accountGroupId },
    });
    if (!group) throw new NotFoundException("Account group not found");

    return this.prisma.ledgerAccount.create({
      data: {
        ...dto,
        currentBalance: dto.openingBalance ?? 0,
      },
    });
  }

  async getLedgerAccounts(
    organizationId: string,
    filters?: {
      accountType?: string;
      isActive?: boolean;
      accountGroupId?: string;
    },
  ) {
    return this.prisma.ledgerAccount.findMany({
      where: {
        organizationId,
        ...(filters?.accountType && { accountType: filters.accountType }),
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
        ...(filters?.accountGroupId && {
          accountGroupId: filters.accountGroupId,
        }),
      },
      include: { accountGroup: true },
      orderBy: { code: "asc" },
    });
  }

  async getLedgerAccount(id: string) {
    const account = await this.prisma.ledgerAccount.findUnique({
      where: { id },
      include: { accountGroup: true },
    });
    if (!account) throw new NotFoundException("Ledger account not found");
    return account;
  }

  async updateLedgerAccount(id: string, dto: UpdateLedgerAccountDto) {
    await this.getLedgerAccount(id);
    return this.prisma.ledgerAccount.update({ where: { id }, data: dto });
  }

  async deleteLedgerAccount(id: string) {
    await this.getLedgerAccount(id);
    const hasJournalLines = await this.prisma.journalEntryLine.count({
      where: { ledgerAccountId: id },
    });
    if (hasJournalLines > 0) {
      throw new BadRequestException(
        "Cannot delete ledger account with existing journal lines",
      );
    }
    return this.prisma.ledgerAccount.delete({ where: { id } });
  }

  async getLedgerAccountBalance(id: string, asOfDate?: Date) {
    const account = await this.getLedgerAccount(id);
    if (!asOfDate) return { balance: account.currentBalance };

    // Compute balance as of a specific date from journal lines
    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        ledgerAccountId: id,
        journalEntry: {
          status: "POSTED",
          entryDate: { lte: asOfDate },
        },
      },
    });
    const debits = lines.reduce((s, l) => s + l.debit, 0);
    const credits = lines.reduce((s, l) => s + l.credit, 0);
    const openingBalance = account.openingBalance;
    const isDebitNormal = ["ASSET", "EXPENSE"].includes(account.accountType);
    const balance = isDebitNormal
      ? openingBalance + debits - credits
      : openingBalance + credits - debits;
    return { balance };
  }

  /** Auto-creates the standard investment ledger accounts if they don't exist. */
  async autoCreateInvestmentAccounts(organizationId: string) {
    const investmentGroupCode = "INVEST";
    let group = await this.prisma.accountGroup.findUnique({
      where: {
        organizationId_code: { organizationId, code: investmentGroupCode },
      },
    });
    if (!group) {
      group = await this.prisma.accountGroup.create({
        data: {
          organizationId,
          code: investmentGroupCode,
          name: "Investment Accounts",
          groupType: "ASSET",
          isSystem: true,
        },
      });
    }

    const accounts = [
      {
        code: "INV-ASSET",
        name: "Investment in Securities",
        accountType: "ASSET",
      },
      { code: "BROK-EXP", name: "Brokerage Expense", accountType: "EXPENSE" },
      { code: "SEBON-EXP", name: "SEBON Fee Expense", accountType: "EXPENSE" },
      { code: "DP-EXP", name: "DP Charge Expense", accountType: "EXPENSE" },
      {
        code: "CGT-PAY",
        name: "Capital Gain Tax Payable",
        accountType: "LIABILITY",
      },
      { code: "REAL-GL", name: "Realized Gain / Loss", accountType: "INCOME" },
    ];

    const created: string[] = [];
    for (const acc of accounts) {
      const existing = await this.prisma.ledgerAccount.findUnique({
        where: { organizationId_code: { organizationId, code: acc.code } },
      });
      if (!existing) {
        await this.prisma.ledgerAccount.create({
          data: {
            organizationId,
            accountGroupId: group.id,
            isSystem: true,
            ...acc,
          },
        });
        created.push(acc.code);
      }
    }
    return { created };
  }
}
