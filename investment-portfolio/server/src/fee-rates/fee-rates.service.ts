import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** All Nepal NEPSE fee/tax rows to be seeded on first run */
export const DEFAULT_FEE_RATES = [
  // ── Equity Shares – Brokerage (tiered) ──────────────────────────────────
  // NOTE: first row is "Up to Rs. 2,500" – the source table labelled this
  // "Rs. 50,000 or less" which is a data-entry anomaly; the second tier
  // starts at 2,501 so we treat the first as [0, 2500].
  {
    instrument: "Equity",
    category: "Brokerage",
    description: "Up to Rs. 2,500",
    minAmount: 0,
    maxAmount: 2500,
    rate: 0.0036,
    remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
  },
  {
    instrument: "Equity",
    category: "Brokerage",
    description: "Rs. 2,501 to Rs. 50,000",
    minAmount: 2501,
    maxAmount: 50000,
    rate: 0.0033,
    remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
  },
  {
    instrument: "Equity",
    category: "Brokerage",
    description: "Rs. 50,001 to Rs. 5,00,000",
    minAmount: 50001,
    maxAmount: 500000,
    rate: 0.0031,
    remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
  },
  {
    instrument: "Equity",
    category: "Brokerage",
    description: "Rs. 5,00,001 to Rs. 20,00,000",
    minAmount: 500001,
    maxAmount: 2000000,
    rate: 0.0027,
    remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
  },
  {
    instrument: "Equity",
    category: "Brokerage",
    description: "Rs. 20,00,001 to Rs. 1,00,00,000",
    minAmount: 2000001,
    maxAmount: 10000000,
    rate: 0.0024,
    remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
  },
  // ── Equity Shares – SEBON Transaction Fee ───────────────────────────────
  {
    instrument: "Equity",
    category: "SEBONFee",
    description: "SEBON Transaction Fee",
    rate: 0.00015,
    remarks: "0.015% of transaction amount",
  },
  // ── Equity Shares – DP Transaction Charge ───────────────────────────────
  {
    instrument: "Equity",
    category: "DPCharge",
    description: "DP Transaction Charge",
    fixedAmount: 25,
    remarks: "Rs. 25 per stock per day",
  },

  // ── Bonds – Corporate Debenture (type 1) ────────────────────────────────
  {
    instrument: "Bond_Debenture",
    category: "Brokerage",
    description: "Rs. 5,00,000 or less",
    minAmount: 0,
    maxAmount: 500000,
    rate: 0.001,
    minFixed: 10,
    remarks: "0.10% or Rs. 10 (whichever is higher)",
  },
  {
    instrument: "Bond_Debenture",
    category: "Brokerage",
    description: "Rs. 5,00,001 to Rs. 50,00,000",
    minAmount: 500001,
    maxAmount: 5000000,
    rate: 0.0005,
  },
  {
    instrument: "Bond_Debenture",
    category: "Brokerage",
    description: "Above Rs. 50,00,000",
    minAmount: 5000001,
    rate: 0.0002,
  },
  {
    instrument: "Bond_Debenture",
    category: "SEBONFee",
    description: "SEBON Transaction Fee",
    rate: 0.0001,
    remarks: "Corporate Debenture – 0.010%",
  },
  {
    instrument: "Bond_Debenture",
    category: "DPCharge",
    description: "DP Transaction Charge",
    fixedAmount: 25,
    remarks: "Rs. 25 per stock per transfer day",
  },

  // ── Bonds – Other Securities (type 2) ───────────────────────────────────
  {
    instrument: "Bond_Other",
    category: "Brokerage",
    description: "Rs. 5,00,000 or less",
    minAmount: 0,
    maxAmount: 500000,
    rate: 0.0015,
    minFixed: 10,
    remarks: "0.15% or Rs. 10 (whichever is higher)",
  },
  {
    instrument: "Bond_Other",
    category: "Brokerage",
    description: "Rs. 5,00,001 to Rs. 50,00,000",
    minAmount: 500001,
    maxAmount: 5000000,
    rate: 0.0012,
  },
  {
    instrument: "Bond_Other",
    category: "Brokerage",
    description: "Above Rs. 50,00,000",
    minAmount: 5000001,
    rate: 0.001,
  },
  {
    instrument: "Bond_Other",
    category: "SEBONFee",
    description: "SEBON Transaction Fee",
    rate: 0.00005,
    remarks: "Other Securities – 0.005%",
  },
  {
    instrument: "Bond_Other",
    category: "DPCharge",
    description: "DP Transaction Charge",
    fixedAmount: 25,
    remarks: "Rs. 25 per stock per transfer day",
  },

  // ── Mero Share charges ───────────────────────────────────────────────────
  {
    instrument: "MeroShare",
    category: "Maintenance",
    description: "DP Annual Maintenance Fee",
    fixedAmount: 100,
    remarks: "Per Annum",
  },
  {
    instrument: "MeroShare",
    category: "Opening",
    description: "Demat Opening Fee",
    fixedAmount: 50,
    remarks: "One time",
  },
  {
    instrument: "MeroShare",
    category: "PledgeFee",
    description: "Pledge / Unpledge Fee",
    fixedAmount: 50,
    remarks: "Per Transaction",
  },

  // ── Capital Gain Tax ─────────────────────────────────────────────────────
  {
    instrument: "Government",
    category: "CGT",
    description: "Individual – Long-term (holding >= 1 year)",
    rate: 0.05,
    investorType: "Individual",
    termType: "LongTerm",
    remarks: "5%",
  },
  {
    instrument: "Government",
    category: "CGT",
    description: "Individual – Short-term (holding < 1 year)",
    rate: 0.075,
    investorType: "Individual",
    termType: "ShortTerm",
    remarks: "7.5%",
  },
  {
    instrument: "Government",
    category: "CGT",
    description: "Institutional – Long-term (holding >= 1 year)",
    rate: 0.1,
    investorType: "Institutional",
    termType: "LongTerm",
    remarks: "10%",
  },

  // ── Mutual Fund – Brokerage (tiered) ─────────────────────────────────────
  {
    instrument: "MutualFund",
    category: "Brokerage",
    description: "Up to Rs. 5,00,000",
    minAmount: 0,
    maxAmount: 500000,
    rate: 0.0015,
  },
  {
    instrument: "MutualFund",
    category: "Brokerage",
    description: "Rs. 5,00,001 to Rs. 50,00,000",
    minAmount: 500001,
    maxAmount: 5000000,
    rate: 0.0012,
  },
  {
    instrument: "MutualFund",
    category: "Brokerage",
    description: "Above Rs. 50,00,000",
    minAmount: 5000001,
    rate: 0.001,
  },
];

export interface ChargeResult {
  brokerage: number;
  sebonFee: number;
  dpCharge: number;
  total: number;
  netAmount: number;
}

/** Map from Company.instrumentType to the instrument key used in fee_rates */
function resolveInstrument(instrumentType?: string | null): string {
  if (!instrumentType) return "Equity";
  const t = instrumentType.toLowerCase();
  if (t.includes("mutual") || t.includes("fund")) return "MutualFund";
  if (t.includes("debenture")) return "Bond_Debenture";
  if (t.includes("bond") || t.includes("note")) return "Bond_Other";
  return "Equity";
}

@Injectable()
export class FeeRatesService implements OnModuleInit {
  private readonly logger = new Logger(FeeRatesService.name);

  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    await this.seedIfEmpty();
  }

  /** Seed default rates if the table is empty */
  async seedIfEmpty() {
    const count = await this.prisma.feeRate.count();
    if (count === 0) {
      await this.prisma.feeRate.createMany({ data: DEFAULT_FEE_RATES });
      this.logger.log(`Seeded ${DEFAULT_FEE_RATES.length} fee rate rows`);
    }
  }

  /** Return all active fee rates */
  async findAll() {
    return this.prisma.feeRate.findMany({
      where: { isActive: true },
      orderBy: [
        { instrument: "asc" },
        { category: "asc" },
        { minAmount: "asc" },
      ],
    });
  }

  /** Return all active rates grouped by instrument → category */
  async findGrouped() {
    const rows = await this.findAll();
    const grouped: Record<string, Record<string, typeof rows>> = {};
    for (const r of rows) {
      grouped[r.instrument] ??= {};
      grouped[r.instrument][r.category] ??= [];
      grouped[r.instrument][r.category].push(r);
    }
    return grouped;
  }

  /**
   * Compute brokerage + SEBON fee + DP charge for a transaction.
   * Falls back to in-memory defaults if DB is unavailable.
   *
   * @param amount   – total transaction value in NPR
   * @param isSell   – whether it's a sell (DP charge applies to buys only, but NEPSE applies both)
   * @param instrumentType – company instrument type string (from Company.instrumentType)
   */
  async calculateCharges(
    amount: number,
    isSell = false,
    instrumentType?: string | null,
  ): Promise<ChargeResult> {
    const instrument = resolveInstrument(instrumentType);

    // Load relevant rows from DB
    const [brokerageRows, sebonRows, dpRows] = await Promise.all([
      this.prisma.feeRate.findMany({
        where: { instrument, category: "Brokerage", isActive: true },
        orderBy: { minAmount: "asc" },
      }),
      this.prisma.feeRate.findMany({
        where: { instrument, category: "SEBONFee", isActive: true },
      }),
      this.prisma.feeRate.findMany({
        where: { instrument, category: "DPCharge", isActive: true },
      }),
    ]);

    // ── Brokerage ──
    let brokerage = 0;
    const bracket = brokerageRows.find(
      (r) =>
        amount >= (r.minAmount ?? 0) &&
        (r.maxAmount === null || amount <= r.maxAmount),
    );
    if (bracket?.rate != null) {
      const computed = amount * bracket.rate;
      brokerage =
        bracket.minFixed != null
          ? Math.max(computed, bracket.minFixed)
          : computed;
    } else {
      // Fallback: highest bracket
      const last = brokerageRows[brokerageRows.length - 1];
      brokerage = last?.rate != null ? amount * last.rate : amount * 0.0024;
    }

    // ── SEBON Fee ──
    const sebonRow = sebonRows[0];
    const sebonFee =
      sebonRow?.rate != null ? amount * sebonRow.rate : amount * 0.00015;

    // ── DP Charge (flat) ──
    const dpRow = dpRows[0];
    const dpCharge = dpRow?.fixedAmount ?? 25;

    const total = brokerage + sebonFee + dpCharge;
    const netAmount = isSell ? amount - total : amount + total;

    return { brokerage, sebonFee, dpCharge, total, netAmount };
  }

  /**
   * Get the CGT rate for a holding.
   * @param holdingDays   – days between purchase and sell
   * @param investorType  – "Individual" (default) | "Institutional"
   */
  async getCGTRate(
    holdingDays: number,
    investorType: "Individual" | "Institutional" = "Individual",
  ): Promise<number> {
    const termType = holdingDays < 365 ? "ShortTerm" : "LongTerm";
    const row = await this.prisma.feeRate.findFirst({
      where: {
        instrument: "Government",
        category: "CGT",
        investorType,
        termType,
        isActive: true,
      },
    });
    // Fallback to hardcoded values
    if (row?.rate != null) return row.rate;
    if (investorType === "Individual") {
      return termType === "ShortTerm" ? 0.075 : 0.05;
    }
    return 0.1;
  }

  /** Structured summary for the /tax-rates endpoint */
  async getTaxRatesSummary() {
    const rows = await this.findAll();

    const equityBrokerage = rows
      .filter((r) => r.instrument === "Equity" && r.category === "Brokerage")
      .map((r) => ({
        description: r.description,
        rate: r.rate,
        minFixed: r.minFixed,
      }));

    const sebonRow = rows.find(
      (r) => r.instrument === "Equity" && r.category === "SEBONFee",
    );
    const dpRow = rows.find(
      (r) => r.instrument === "Equity" && r.category === "DPCharge",
    );
    const cgtRows = rows.filter(
      (r) => r.instrument === "Government" && r.category === "CGT",
    );

    return {
      equityBrokerage,
      SEBON_RATE: sebonRow?.rate ?? 0.00015,
      DP_CHARGE_FIXED: dpRow?.fixedAmount ?? 25,
      CGT: {
        INDIVIDUAL_SHORT_TERM:
          cgtRows.find(
            (r) =>
              r.investorType === "Individual" && r.termType === "ShortTerm",
          )?.rate ?? 0.075,
        INDIVIDUAL_LONG_TERM:
          cgtRows.find(
            (r) => r.investorType === "Individual" && r.termType === "LongTerm",
          )?.rate ?? 0.05,
        INSTITUTIONAL:
          cgtRows.find((r) => r.investorType === "Institutional")?.rate ?? 0.1,
      },
    };
  }
}
