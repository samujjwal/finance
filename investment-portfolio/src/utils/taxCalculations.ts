import { Transaction, TaxReport } from "@/types/api";

// Nepal Tax Rates (as of current fiscal year)
export const TAX_RATES = {
  SHORT_TERM_CAPITAL_GAINS: 0.1, // 10% for holdings < 1 year
  LONG_TERM_CAPITAL_GAINS: 0.05, // 5% for holdings >= 1 year
  BROKERAGE_RATE: 0.0025, // 0.25% of transaction value
  DP_CHARGE_RATE: 0.00025, // 0.025% of transaction value
  SEBON_FEE_RATE: 0.000067, // 0.0067% of transaction value
};

export interface TaxCalculationResult {
  capitalGains: number;
  holdingPeriodDays: number;
  isLongTerm: boolean;
  applicableTaxRate: number;
  taxAmount: number;
  netReceivables: number;
}

export interface WACCResult {
  wacc: number;
  totalInvestment: number;
  totalQuantity: number;
  averageCost: number;
}

/**
 * Calculate capital gains tax for a transaction.
 * If the transaction already has holdingPeriodDays stored (set by backend), it is used directly.
 * If a purchaseDate is supplied, holdingPeriod is computed as (sellDate - purchaseDate).
 * When neither is available the function conservatively classifies as short-term.
 */
export function calculateCapitalGainsTax(
  transaction: Transaction,
  currentPrice?: number,
  purchaseDate?: Date,
): TaxCalculationResult {
  if (transaction.transactionType !== "SELL") {
    return {
      capitalGains: 0,
      holdingPeriodDays: 0,
      isLongTerm: false,
      applicableTaxRate: 0,
      taxAmount: 0,
      netReceivables: 0,
    };
  }

  // Prefer pre-computed holdingPeriodDays stored on the transaction (set by backend)
  let holdingPeriodDays: number;
  if (
    transaction.holdingPeriodDays != null &&
    transaction.holdingPeriodDays >= 0
  ) {
    holdingPeriodDays = transaction.holdingPeriodDays;
  } else if (purchaseDate) {
    const sellDate = new Date(transaction.transactionDate);
    holdingPeriodDays = Math.floor(
      (sellDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24),
    );
  } else {
    // No reliable purchase date available – default to short-term (conservative)
    holdingPeriodDays = 0;
  }

  const isLongTerm = holdingPeriodDays >= 365;
  const applicableTaxRate = isLongTerm
    ? TAX_RATES.LONG_TERM_CAPITAL_GAINS
    : TAX_RATES.SHORT_TERM_CAPITAL_GAINS;

  // Calculate capital gains
  const totalSalesAmount = transaction.totalSalesAmount || 0;
  const totalInvestmentCost = transaction.totalInvestmentCost || 0;
  const capitalGains = Math.max(0, totalSalesAmount - totalInvestmentCost);

  // Calculate tax
  const taxAmount = capitalGains * applicableTaxRate;
  const netReceivables =
    totalSalesAmount - taxAmount - (transaction.totalSalesCommission || 0);

  return {
    capitalGains,
    holdingPeriodDays,
    isLongTerm,
    applicableTaxRate,
    taxAmount,
    netReceivables,
  };
}

/**
 * Calculate Weighted Average Cost of Capital (WACC) for a company
 */
export function calculateWACC(transactions: Transaction[]): WACCResult {
  const buyTransactions = transactions.filter(
    (t) => t.transactionType === "BUY",
  );

  if (buyTransactions.length === 0) {
    return {
      wacc: 0,
      totalInvestment: 0,
      totalQuantity: 0,
      averageCost: 0,
    };
  }

  let totalQuantity = 0;
  let totalInvestment = 0;

  for (const transaction of buyTransactions) {
    const quantity = transaction.purchaseQuantity || 0;
    const totalCost =
      (transaction.totalInvestmentCost ||
        transaction.totalPurchaseAmount ||
        0) + (transaction.totalPurchaseCommission || 0);

    totalQuantity += quantity;
    totalInvestment += totalCost;
  }

  const averageCost = totalQuantity > 0 ? totalInvestment / totalQuantity : 0;

  return {
    wacc: averageCost,
    totalInvestment,
    totalQuantity,
    averageCost,
  };
}

/**
 * Calculate commission and charges for a transaction
 */
export function calculateTransactionCharges(
  transactionType: "BUY" | "SELL",
  amount: number,
): {
  brokerage: number;
  dpCharges: number;
  sebonFee: number;
  totalCharges: number;
} {
  const brokerage = amount * TAX_RATES.BROKERAGE_RATE;
  const dpCharges = amount * TAX_RATES.DP_CHARGE_RATE;
  const sebonFee = amount * TAX_RATES.SEBON_FEE_RATE;
  const totalCharges = brokerage + dpCharges + sebonFee;

  return {
    brokerage,
    dpCharges,
    sebonFee,
    totalCharges,
  };
}

/**
 * Generate comprehensive tax report for fiscal year
 */
export function generateTaxReport(
  transactions: Transaction[],
  fiscalYear: string,
): TaxReport {
  const sellTransactions = transactions.filter(
    (t) =>
      t.transactionType === "SELL" &&
      t.transactionDate.startsWith(fiscalYear.split("-")[0]),
  );

  let totalCapitalGains = 0;
  let totalCapitalLosses = 0;
  let shortTermGains = 0;
  let longTermGains = 0;
  let shortTermTax = 0;
  let longTermTax = 0;

  const companyBreakdown = new Map<
    string,
    {
      shortTermGains: number;
      longTermGains: number;
      tax: number;
    }
  >();

  for (const transaction of sellTransactions) {
    const taxCalc = calculateCapitalGainsTax(transaction);

    if (taxCalc.capitalGains > 0) {
      totalCapitalGains += taxCalc.capitalGains;

      if (taxCalc.isLongTerm) {
        longTermGains += taxCalc.capitalGains;
        longTermTax += taxCalc.taxAmount;
      } else {
        shortTermGains += taxCalc.capitalGains;
        shortTermTax += taxCalc.taxAmount;
      }

      // Update company breakdown
      const existing = companyBreakdown.get(transaction.companySymbol) || {
        shortTermGains: 0,
        longTermGains: 0,
        tax: 0,
      };

      if (taxCalc.isLongTerm) {
        existing.longTermGains += taxCalc.capitalGains;
      } else {
        existing.shortTermGains += taxCalc.capitalGains;
      }

      existing.tax += taxCalc.taxAmount;
      companyBreakdown.set(transaction.companySymbol, existing);
    } else {
      totalCapitalLosses += Math.abs(taxCalc.capitalGains);
    }
  }

  const netCapitalGains = totalCapitalGains - totalCapitalLosses;
  const capitalGainsTax = shortTermTax + longTermTax;
  const totalTax = capitalGainsTax;

  return {
    id: `tax-${fiscalYear}-${Date.now()}`,
    fiscalYear,
    totalCapitalGains,
    totalCapitalLosses,
    netCapitalGains,
    capitalGainsTax,
    shortTermGains,
    longTermGains,
    shortTermTax,
    longTermTax,
    totalTax,
    companies: Array.from(companyBreakdown.entries()).map(([symbol, data]) => ({
      symbol,
      ...data,
    })),
  };
}

/**
 * Calculate realized P&L for completed transactions
 */
export function calculateRealizedPnL(transactions: Transaction[]): {
  totalRealizedPnL: number;
  companyBreakdown: Map<string, number>;
} {
  const companyTransactions = new Map<string, Transaction[]>();

  // Group transactions by company
  for (const transaction of transactions) {
    const existing = companyTransactions.get(transaction.companySymbol) || [];
    existing.push(transaction);
    companyTransactions.set(transaction.companySymbol, existing);
  }

  const companyBreakdown = new Map<string, number>();
  let totalRealizedPnL = 0;

  for (const [symbol, companyTxns] of companyTransactions) {
    const buys = companyTxns.filter((t) => t.transactionType === "BUY");
    const sells = companyTxns.filter((t) => t.transactionType === "SELL");

    let totalBuyCost = 0;
    let totalBuyQuantity = 0;
    let totalSellRevenue = 0;
    let totalSellQuantity = 0;

    for (const buy of buys) {
      totalBuyCost +=
        (buy.totalInvestmentCost || buy.totalPurchaseAmount || 0) +
        (buy.totalPurchaseCommission || 0);
      totalBuyQuantity += buy.purchaseQuantity || 0;
    }

    for (const sell of sells) {
      totalSellRevenue +=
        (sell.totalSalesAmount || 0) -
        (sell.totalSalesCommission || 0) -
        (sell.capitalGainTax || 0);
      totalSellQuantity += sell.salesQuantity || 0;
    }

    // Calculate P&L for sold quantity
    const soldQuantity = Math.min(totalBuyQuantity, totalSellQuantity);
    const avgBuyCost =
      totalBuyQuantity > 0 ? totalBuyCost / totalBuyQuantity : 0;
    const realizedPnL = totalSellRevenue - soldQuantity * avgBuyCost;

    companyBreakdown.set(symbol, realizedPnL);
    totalRealizedPnL += realizedPnL;
  }

  return {
    totalRealizedPnL,
    companyBreakdown,
  };
}

/**
 * Calculate average holding period for transactions
 */
export function calculateAverageHoldingPeriod(
  transactions: Transaction[],
): number {
  const sellTransactions = transactions.filter(
    (t) => t.transactionType === "SELL",
  );
  if (sellTransactions.length === 0) return 0;

  let totalHoldingDays = 0;
  let completedTrades = 0;

  for (const sellTransaction of sellTransactions) {
    // Find corresponding buy transactions (FIFO - First In, First Out)
    const buyTransactions = transactions
      .filter(
        (t) =>
          t.transactionType === "BUY" &&
          t.companySymbol === sellTransaction.companySymbol &&
          new Date(t.transactionDate) <=
            new Date(sellTransaction.transactionDate),
      )
      .sort(
        (a, b) =>
          new Date(a.transactionDate).getTime() -
          new Date(b.transactionDate).getTime(),
      );

    if (buyTransactions.length > 0) {
      const buyDate = new Date(buyTransactions[0].transactionDate);
      const sellDate = new Date(sellTransaction.transactionDate);
      const holdingDays = Math.floor(
        (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      totalHoldingDays += holdingDays;
      completedTrades++;
    }
  }

  return completedTrades > 0 ? totalHoldingDays / completedTrades : 0;
}
/**
 * Calculate portfolio level metrics
 */
export function calculatePortfolioMetrics(
  transactions: Transaction[],
  currentPrices: Map<string, number>,
): {
  totalInvestment: number;
  currentValue: number;
  unrealizedPnL: number;
  totalValue: number;
  totalReturn: number;
  totalReturnPercent: number;
} {
  const realizedResult = calculateRealizedPnL(transactions);
  const waccByCompany = new Map<string, WACCResult>();

  // Calculate WACC for each company
  const companyTransactions = new Map<string, Transaction[]>();
  for (const transaction of transactions) {
    const existing = companyTransactions.get(transaction.companySymbol) || [];
    existing.push(transaction);
    companyTransactions.set(transaction.companySymbol, existing);
  }

  for (const [symbol, txns] of companyTransactions) {
    waccByCompany.set(symbol, calculateWACC(txns));
  }

  let totalInvestment = 0;
  let currentValue = 0;

  for (const [symbol, wacc] of waccByCompany) {
    totalInvestment += wacc.totalInvestment;
    const currentPrice = currentPrices.get(symbol) || wacc.averageCost;
    currentValue += wacc.totalQuantity * currentPrice;
  }

  const unrealizedPnL = currentValue - totalInvestment;
  const totalValue = currentValue;
  const totalReturn = realizedResult.totalRealizedPnL + unrealizedPnL;
  const totalReturnPercent =
    totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;

  return {
    totalInvestment,
    currentValue,
    unrealizedPnL,
    totalValue,
    totalReturn,
    totalReturnPercent,
  };
}
