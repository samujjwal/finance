import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { AccountsService } from "../accounting/accounts.service";
import { JournalsService } from "../accounting/journals.service";
import { FiscalYearService } from "../accounting/fiscal-year.service";

export type TransactionType = "BUY" | "SELL" | "DIVIDEND" | "BONUS" | "RIGHTS";

export interface BridgeTransactionDto {
  organizationId: string;
  transactionId: string;
  instrumentSymbol: string;
  transactionType: TransactionType;
  quantity: number;
  pricePerUnit: number;
  totalAmount: number;
  brokerageCommission: number;
  sebonFee: number;
  dpCharge: number;
  capitalGainsTax?: number;
  transactionDate: Date;
  createdById: string;
}

@Injectable()
export class InvestmentAccountingBridgeService {
  private readonly logger = new Logger(InvestmentAccountingBridgeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly accounts: AccountsService,
    private readonly journals: JournalsService,
    private readonly fiscalYear: FiscalYearService,
  ) {}

  /**
   * Create automatic journal entries for an investment transaction.
   * Called after a transaction is saved. Silently skips if GL accounts are not configured.
   */
  async createJournalForTransaction(dto: BridgeTransactionDto): Promise<void> {
    try {
      // Get current fiscal year
      const fy = await this.fiscalYear.getCurrent(dto.organizationId);
      if (!fy) {
        this.logger.warn(
          `No open fiscal year for org ${dto.organizationId} — skipping journal`,
        );
        return;
      }

      // Load required GL accounts by code
      const glCodes = [
        "INV-ASSET",
        "CASH-BANK",
        "BROK-EXP",
        "SEBON-EXP",
        "DP-EXP",
        "CGT-PAY",
        "REAL-GL",
      ];
      const glAccounts = await this.prisma.ledgerAccount.findMany({
        where: {
          organizationId: dto.organizationId,
          code: { in: glCodes },
          isActive: true,
        },
      });

      const glMap = Object.fromEntries(glAccounts.map((a) => [a.code, a]));

      // Must have minimum accounts: INV-ASSET and CASH-BANK
      if (!glMap["INV-ASSET"] || !glMap["CASH-BANK"]) {
        this.logger.warn(
          `GL accounts INV-ASSET or CASH-BANK not found for org ${dto.organizationId} — skipping auto-journal`,
        );
        return;
      }

      const lines = this.buildJournalLines(dto, glMap);
      if (!lines.length) return;

      await this.journals.create(
        {
          organizationId: dto.organizationId,
          fiscalYearId: fy.id,
          entryDate: dto.transactionDate.toISOString(),
          narration: this.buildDescription(dto),
          reference: `TXN-${dto.transactionId}`,
          sourceType: "TRANSACTION",
          sourceId: String(dto.transactionId),
          lines,
        },
        String(dto.createdById),
      );

      this.logger.log(
        `Auto-journal created for txn ${dto.transactionId} (${dto.transactionType} ${dto.instrumentSymbol})`,
      );
    } catch (err) {
      // Journal creation is best-effort — do not fail the investment transaction
      this.logger.error(
        `Bridge journal failed for txn ${dto.transactionId}: ${err.message}`,
      );
    }
  }

  private buildJournalLines(
    dto: BridgeTransactionDto,
    glMap: Record<string, { id: string }>,
  ): {
    ledgerAccountId: string;
    debit: number;
    credit: number;
    description: string;
  }[] {
    const lines: {
      ledgerAccountId: string;
      debit: number;
      credit: number;
      description: string;
    }[] = [];
    const {
      transactionType: type,
      totalAmount,
      brokerageCommission,
      sebonFee,
      dpCharge,
      capitalGainsTax = 0,
    } = dto;

    const totalCost = totalAmount + brokerageCommission + sebonFee + dpCharge;

    if (type === "BUY") {
      // DR Investment Asset   CR Cash/Bank
      if (glMap["INV-ASSET"])
        lines.push({
          ledgerAccountId: glMap["INV-ASSET"].id,
          debit: totalAmount,
          credit: 0,
          description: `Buy ${dto.instrumentSymbol}`,
        });
      if (glMap["BROK-EXP"] && brokerageCommission)
        lines.push({
          ledgerAccountId: glMap["BROK-EXP"].id,
          debit: brokerageCommission,
          credit: 0,
          description: "Brokerage",
        });
      if (glMap["SEBON-EXP"] && sebonFee)
        lines.push({
          ledgerAccountId: glMap["SEBON-EXP"].id,
          debit: sebonFee,
          credit: 0,
          description: "SEBON fee",
        });
      if (glMap["DP-EXP"] && dpCharge)
        lines.push({
          ledgerAccountId: glMap["DP-EXP"].id,
          debit: dpCharge,
          credit: 0,
          description: "DP charge",
        });
      if (glMap["CASH-BANK"])
        lines.push({
          ledgerAccountId: glMap["CASH-BANK"].id,
          debit: 0,
          credit: totalCost,
          description: "Payment",
        });
    } else if (type === "SELL") {
      // DR Cash/Bank   CR Investment Asset
      // DR/CR Realized Gain/Loss
      const proceeds =
        totalAmount -
        brokerageCommission -
        sebonFee -
        dpCharge -
        capitalGainsTax;
      if (glMap["CASH-BANK"])
        lines.push({
          ledgerAccountId: glMap["CASH-BANK"].id,
          debit: proceeds,
          credit: 0,
          description: "Proceeds",
        });
      if (glMap["BROK-EXP"] && brokerageCommission)
        lines.push({
          ledgerAccountId: glMap["BROK-EXP"].id,
          debit: brokerageCommission,
          credit: 0,
          description: "Brokerage",
        });
      if (glMap["SEBON-EXP"] && sebonFee)
        lines.push({
          ledgerAccountId: glMap["SEBON-EXP"].id,
          debit: sebonFee,
          credit: 0,
          description: "SEBON fee",
        });
      if (glMap["DP-EXP"] && dpCharge)
        lines.push({
          ledgerAccountId: glMap["DP-EXP"].id,
          debit: dpCharge,
          credit: 0,
          description: "DP charge",
        });
      if (glMap["CGT-PAY"] && capitalGainsTax)
        lines.push({
          ledgerAccountId: glMap["CGT-PAY"].id,
          debit: 0,
          credit: capitalGainsTax,
          description: "CGT payable",
        });
      if (glMap["INV-ASSET"])
        lines.push({
          ledgerAccountId: glMap["INV-ASSET"].id,
          debit: 0,
          credit: totalAmount,
          description: `Sell ${dto.instrumentSymbol}`,
        });
      // Realized gain line (may be zero)
      const gain =
        totalAmount - (totalAmount + brokerageCommission + sebonFee + dpCharge);
      if (glMap["REAL-GL"] && Math.abs(gain) > 0.01) {
        lines.push({
          ledgerAccountId: glMap["REAL-GL"].id,
          debit: gain < 0 ? Math.abs(gain) : 0,
          credit: gain > 0 ? gain : 0,
          description: "Realized G/L",
        });
      }
    } else if (type === "DIVIDEND") {
      // DR Cash/Bank   CR Dividend Income
      if (glMap["CASH-BANK"])
        lines.push({
          ledgerAccountId: glMap["CASH-BANK"].id,
          debit: totalAmount,
          credit: 0,
          description: "Dividend received",
        });
      if (glMap["REAL-GL"])
        lines.push({
          ledgerAccountId: glMap["REAL-GL"].id,
          debit: 0,
          credit: totalAmount,
          description: `Dividend ${dto.instrumentSymbol}`,
        });
    } else if (type === "BONUS") {
      // Bonus shares: no cash movement, increase investment cost if tracked
      // Journal is informational only
      if (glMap["INV-ASSET"]) {
        // Zero-value informational entry
        lines.push({
          ledgerAccountId: glMap["INV-ASSET"].id,
          debit: 0,
          credit: 0,
          description: `Bonus shares ${dto.instrumentSymbol} qty=${dto.quantity}`,
        });
      }
    }

    return lines.filter((l) => l.debit > 0 || l.credit > 0);
  }

  private buildDescription(dto: BridgeTransactionDto): string {
    const typeLabels: Record<TransactionType, string> = {
      BUY: "Purchase",
      SELL: "Sale",
      DIVIDEND: "Dividend",
      BONUS: "Bonus shares",
      RIGHTS: "Rights issue",
    };
    return `${typeLabels[dto.transactionType] ?? dto.transactionType} — ${dto.instrumentSymbol} × ${dto.quantity} @ ${dto.pricePerUnit}`;
  }

  /** Return journal entries that were auto-created for a given transaction. */
  async getJournalsForTransaction(
    transactionId: string,
    organizationId: string,
  ) {
    return this.prisma.journalEntry.findMany({
      where: {
        organizationId,
        sourceType: "TRANSACTION",
        sourceId: String(transactionId),
      },
      include: { lines: { include: { ledgerAccount: true } } },
    });
  }
}
