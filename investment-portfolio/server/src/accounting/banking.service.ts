import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateBankAccountDto,
  StartReconciliationDto,
  AddBankTransactionDto,
} from "./dto/commercial.dto";

@Injectable()
export class BankingService {
  constructor(private readonly prisma: PrismaService) {}

  // ======== Bank Accounts ========

  async getBankAccounts(organizationId: string) {
    return this.prisma.bankAccount.findMany({
      where: { organizationId, isActive: true },
      include: { ledgerAccount: true },
      orderBy: { accountName: "asc" },
    });
  }

  async createBankAccount(dto: CreateBankAccountDto) {
    // Verify ledger account exists and belongs to the org
    const ledgerAccount = await this.prisma.ledgerAccount.findFirst({
      where: { id: dto.ledgerAccountId, organizationId: dto.organizationId },
    });
    if (!ledgerAccount) throw new NotFoundException("Ledger account not found");

    return this.prisma.bankAccount.create({ data: dto });
  }

  async getBankBalance(bankAccountId: string, asOfDate?: Date) {
    const ba = await this.prisma.bankAccount.findUnique({
      where: { id: bankAccountId },
    });
    if (!ba) throw new NotFoundException("Bank account not found");
    if (!asOfDate) return { balance: ba.currentBalance };

    const lines = await this.prisma.journalEntryLine.findMany({
      where: {
        ledgerAccountId: ba.ledgerAccountId,
        journalEntry: {
          status: "POSTED",
          entryDate: { lte: asOfDate },
        },
      },
    });
    const balance = lines.reduce((s, l) => s + l.debit - l.credit, 0);
    return { balance };
  }

  // ======== Reconciliation ========

  async startReconciliation(dto: StartReconciliationDto) {
    // Ensure no open reconciliation for this account
    const open = await this.prisma.reconciliation.findFirst({
      where: { bankAccountId: dto.bankAccountId, status: "OPEN" },
    });
    if (open)
      throw new BadRequestException(
        "A reconciliation is already open for this account",
      );

    // Compute current book balance from journal lines
    const ba = await this.prisma.bankAccount.findUnique({
      where: { id: dto.bankAccountId },
    });
    if (!ba) throw new NotFoundException("Bank account not found");

    return this.prisma.reconciliation.create({
      data: {
        bankAccountId: dto.bankAccountId,
        statementDate: new Date(dto.statementDate),
        statementBalance: dto.statementBalance,
        bookBalance: ba.currentBalance,
        status: "OPEN",
        createdBy: dto.createdBy,
      },
    });
  }

  async addBankTransaction(
    reconciliationId: string,
    dto: AddBankTransactionDto,
  ) {
    const rec = await this.prisma.reconciliation.findUnique({
      where: { id: reconciliationId },
    });
    if (!rec) throw new NotFoundException("Reconciliation not found");
    if (rec.status === "COMPLETED")
      throw new BadRequestException("Reconciliation is already completed");

    return this.prisma.bankTransaction.create({
      data: {
        reconciliationId,
        transactionDate: new Date(dto.transactionDate),
        description: dto.description,
        amount: dto.amount,
      },
    });
  }

  async matchTransaction(
    reconciliationId: string,
    bankTxId: string,
    journalLineId: string,
  ) {
    const bankTx = await this.prisma.bankTransaction.findFirst({
      where: { id: bankTxId, reconciliationId },
    });
    if (!bankTx) throw new NotFoundException("Bank transaction not found");

    return this.prisma.bankTransaction.update({
      where: { id: bankTxId },
      data: { matchedJournalLineId: journalLineId, isMatched: true },
    });
  }

  async unmatchTransaction(bankTxId: string) {
    return this.prisma.bankTransaction.update({
      where: { id: bankTxId },
      data: { matchedJournalLineId: null, isMatched: false },
    });
  }

  /** Auto-match bank transactions to journal lines by amount. */
  async autoMatch(reconciliationId: string) {
    const rec = await this.prisma.reconciliation.findUnique({
      where: { id: reconciliationId },
      include: { bankAccount: true, transactions: true },
    });
    if (!rec) throw new NotFoundException("Reconciliation not found");

    const unmatchedBankTxs = rec.transactions.filter((t) => !t.isMatched);
    let matched = 0;

    for (const bankTx of unmatchedBankTxs) {
      const matchingLine = await this.prisma.journalEntryLine.findFirst({
        where: {
          ledgerAccountId: rec.bankAccount.ledgerAccountId,
          debit: bankTx.amount > 0 ? bankTx.amount : 0,
          credit: bankTx.amount < 0 ? Math.abs(bankTx.amount) : 0,
          matchedBankTransactions: { none: {} },
        },
      });
      if (matchingLine) {
        await this.matchTransaction(
          reconciliationId,
          bankTx.id,
          matchingLine.id,
        );
        matched++;
      }
    }
    return { matched };
  }

  async completeReconciliation(reconciliationId: string) {
    const rec = await this.prisma.reconciliation.findUnique({
      where: { id: reconciliationId },
      include: { transactions: true },
    });
    if (!rec) throw new NotFoundException("Reconciliation not found");

    const unmatchedCount = rec.transactions.filter((t) => !t.isMatched).length;
    const difference = rec.statementBalance - rec.bookBalance;

    return this.prisma.reconciliation.update({
      where: { id: reconciliationId },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
  }

  async getReconciliation(id: string) {
    const rec = await this.prisma.reconciliation.findUnique({
      where: { id },
      include: {
        transactions: true,
        bankAccount: { include: { ledgerAccount: true } },
      },
    });
    if (!rec) throw new NotFoundException("Reconciliation not found");
    return rec;
  }
}
