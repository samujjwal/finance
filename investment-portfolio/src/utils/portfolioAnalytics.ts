import { Transaction, AdvancedAnalytics, MarketData } from "@/types/api";

export interface CashFlow {
  date: Date;
  amount: number;
  type: "inflow" | "outflow";
}

export interface PerformanceMetric {
  date: Date;
  portfolioValue: number;
  return: number;
  cumulativeReturn: number;
}

/**
 * Calculate XIRR (Extended Internal Rate of Return) for a series of cash flows
 * Uses Newton-Raphson method for iterative calculation
 */
export function calculateXIRR(cashFlows: CashFlow[]): number | null {
  if (cashFlows.length < 2) return null;

  // Sort cash flows by date
  const sortedFlows = [...cashFlows].sort(
    (a, b) => a.date.getTime() - b.date.getTime(),
  );

  // Initial guess - use a reasonable rate like 10%
  let rate = 0.1;
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let iteration = 0; iteration < maxIterations; iteration++) {
    let npv = 0;
    let dnpv = 0;

    for (let i = 0; i < sortedFlows.length; i++) {
      const flow = sortedFlows[i];
      const daysDiff =
        (flow.date.getTime() - sortedFlows[0].date.getTime()) /
        (1000 * 60 * 60 * 24);
      const factor = Math.pow(1 + rate, daysDiff / 365);

      npv += flow.amount / factor;
      dnpv -= ((daysDiff / 365) * flow.amount) / (factor * (1 + rate));
    }

    if (Math.abs(npv) < tolerance) {
      return rate;
    }

    if (Math.abs(dnpv) < tolerance) {
      break; // Avoid division by very small numbers
    }

    rate = rate - npv / dnpv;

    // Prevent rate from becoming too extreme
    if (Math.abs(rate) > 10) {
      break;
    }
  }

  return rate;
}

/**
 * Calculate portfolio XIRR from transactions and current value
 */
export function calculatePortfolioXIRR(
  transactions: Transaction[],
  currentValue: number,
): number | null {
  const cashFlows: CashFlow[] = [];

  // Add all buy transactions as outflows
  transactions
    .filter((t) => t.transactionType === "BUY")
    .forEach((transaction) => {
      const totalCost =
        (transaction.totalInvestmentCost ||
          transaction.totalPurchaseAmount ||
          0) + (transaction.totalPurchaseCommission || 0);

      cashFlows.push({
        date: new Date(transaction.transactionDate),
        amount: -totalCost,
        type: "outflow",
      });
    });

  // Add all sell transactions as inflows
  transactions
    .filter((t) => t.transactionType === "SELL")
    .forEach((transaction) => {
      const netProceeds =
        (transaction.totalSalesAmount || 0) -
        (transaction.totalSalesCommission || 0) -
        (transaction.capitalGainTax || 0);

      cashFlows.push({
        date: new Date(transaction.transactionDate),
        amount: netProceeds,
        type: "inflow",
      });
    });

  // Add current value as final inflow
  if (currentValue > 0 && transactions.length > 0) {
    cashFlows.push({
      date: new Date(),
      amount: currentValue,
      type: "inflow",
    });
  }

  return calculateXIRR(cashFlows);
}

/**
 * Calculate portfolio volatility (standard deviation of returns)
 */
export function calculateVolatility(returns: number[]): number {
  if (returns.length < 2) return 0;

  const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const squaredDiffs = returns.map((ret) => Math.pow(ret - mean, 2));
  const variance =
    squaredDiffs.reduce((sum, diff) => sum + diff, 0) / (returns.length - 1);

  return Math.sqrt(variance) * Math.sqrt(252); // Annualized volatility (252 trading days)
}

/**
 * Calculate Sharpe Ratio
 */
export function calculateSharpeRatio(
  returns: number[],
  riskFreeRate: number = 0.06, // 6% risk-free rate (Nepal government bonds)
): number {
  const volatility = calculateVolatility(returns);
  const meanReturn =
    returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
  const excessReturn = meanReturn - riskFreeRate;

  return volatility > 0 ? excessReturn / volatility : 0;
}

/**
 * Calculate maximum drawdown
 */
export function calculateMaxDrawdown(portfolioValues: number[]): number {
  if (portfolioValues.length < 2) return 0;

  let maxDrawdown = 0;
  let peak = portfolioValues[0];

  for (let i = 1; i < portfolioValues.length; i++) {
    const value = portfolioValues[i];

    if (value > peak) {
      peak = value;
    } else {
      const drawdown = (peak - value) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }

  return maxDrawdown;
}

/**
 * Calculate Value at Risk (VaR) at 95% confidence level
 */
export function calculateVaR95(returns: number[]): number {
  if (returns.length < 10) return 0;

  const sortedReturns = [...returns].sort((a, b) => a - b);
  const percentile = Math.floor(returns.length * 0.05); // 5th percentile

  return sortedReturns[percentile] || 0;
}

/**
 * Calculate beta relative to market
 */
export function calculateBeta(
  portfolioReturns: number[],
  marketReturns: number[],
): number {
  if (
    portfolioReturns.length !== marketReturns.length ||
    portfolioReturns.length < 10
  ) {
    return 1; // Default to market beta
  }

  const portfolioMean =
    portfolioReturns.reduce((sum, ret) => sum + ret, 0) /
    portfolioReturns.length;
  const marketMean =
    marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;

  let covariance = 0;
  let marketVariance = 0;

  for (let i = 0; i < portfolioReturns.length; i++) {
    const portfolioDiff = portfolioReturns[i] - portfolioMean;
    const marketDiff = marketReturns[i] - marketMean;

    covariance += portfolioDiff * marketDiff;
    marketVariance += marketDiff * marketDiff;
  }

  return marketVariance > 0 ? covariance / marketVariance : 1;
}

/**
 * Calculate alpha (excess return over expected return based on beta)
 */
export function calculateAlpha(
  portfolioReturn: number,
  marketReturn: number,
  beta: number,
  riskFreeRate: number = 0.06,
): number {
  const expectedReturn = riskFreeRate + beta * (marketReturn - riskFreeRate);
  return portfolioReturn - expectedReturn;
}

/**
 * Calculate holding period return for each transaction
 */
export function calculateHoldingPeriodReturn(
  transaction: Transaction,
  currentPrice?: number,
): number {
  if (transaction.transactionType !== "SELL" && !currentPrice) {
    return 0;
  }

  const totalCost =
    (transaction.totalInvestmentCost || transaction.totalPurchaseAmount || 0) +
    (transaction.totalPurchaseCommission || 0);

  if (totalCost <= 0) return 0;

  let proceeds = 0;
  if (transaction.transactionType === "SELL") {
    proceeds =
      (transaction.totalSalesAmount || 0) -
      (transaction.totalSalesCommission || 0) -
      (transaction.capitalGainTax || 0);
  } else if (currentPrice) {
    proceeds = (transaction.purchaseQuantity || 0) * currentPrice;
  }

  return ((proceeds - totalCost) / totalCost) * 100;
}

/**
 * Calculate win rate (percentage of profitable trades)
 */
export function calculateWinRate(transactions: Transaction[]): number {
  const sellTransactions = transactions.filter(
    (t) => t.transactionType === "SELL",
  );
  if (sellTransactions.length === 0) return 0;

  let winningTrades = 0;
  for (const transaction of sellTransactions) {
    const totalCost = transaction.totalInvestmentCost || 0;
    const proceeds =
      (transaction.totalSalesAmount || 0) -
      (transaction.totalSalesCommission || 0) -
      (transaction.capitalGainTax || 0);

    if (proceeds > totalCost) {
      winningTrades++;
    }
  }

  return (winningTrades / sellTransactions.length) * 100;
}

/**
 * Calculate profit factor (total profits / total losses)
 */
export function calculateProfitFactor(transactions: Transaction[]): number {
  const sellTransactions = transactions.filter(
    (t) => t.transactionType === "SELL",
  );
  if (sellTransactions.length === 0) return 0;

  let totalProfits = 0;
  let totalLosses = 0;

  for (const transaction of sellTransactions) {
    const totalCost = transaction.totalInvestmentCost || 0;
    const proceeds =
      (transaction.totalSalesAmount || 0) -
      (transaction.totalSalesCommission || 0) -
      (transaction.capitalGainTax || 0);

    const profit = proceeds - totalCost;

    if (profit > 0) {
      totalProfits += profit;
    } else {
      totalLosses += Math.abs(profit);
    }
  }

  return totalLosses > 0
    ? totalProfits / totalLosses
    : totalProfits > 0
      ? Infinity
      : 0;
}

/**
 * Generate comprehensive analytics for a portfolio
 */
export function generateAdvancedAnalytics(
  transactions: Transaction[],
  currentValue: number,
  historicalValues?: number[],
  marketReturns?: number[],
): AdvancedAnalytics {
  const portfolioXIRR = calculatePortfolioXIRR(transactions, currentValue);

  let totalReturn = 0;
  let totalInvestment = 0;

  // Calculate total investment and returns
  for (const transaction of transactions) {
    if (transaction.transactionType === "BUY") {
      totalInvestment +=
        (transaction.totalInvestmentCost ||
          transaction.totalPurchaseAmount ||
          0) + (transaction.totalPurchaseCommission || 0);
    } else {
      const proceeds =
        (transaction.totalSalesAmount || 0) -
        (transaction.totalSalesCommission || 0) -
        (transaction.capitalGainTax || 0);
      const cost = transaction.totalInvestmentCost || 0;
      totalReturn += proceeds - cost;
    }
  }

  // Add unrealized P&L
  totalReturn += currentValue - totalInvestment;

  const totalReturnPercent =
    totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
  const annualizedReturn = portfolioXIRR ? portfolioXIRR * 100 : 0;

  // Calculate risk metrics if historical data available
  let volatility = 0;
  let sharpeRatio = 0;
  let maxDrawdown = 0;
  let var95 = 0;
  let beta = 1;
  let alpha = 0;

  if (historicalValues && historicalValues.length > 1) {
    const returns = [];
    for (let i = 1; i < historicalValues.length; i++) {
      const dailyReturn =
        (historicalValues[i] - historicalValues[i - 1]) /
        historicalValues[i - 1];
      returns.push(dailyReturn);
    }

    volatility = calculateVolatility(returns);
    sharpeRatio = calculateSharpeRatio(returns);
    maxDrawdown = calculateMaxDrawdown(historicalValues);
    var95 = calculateVaR95(returns);

    if (marketReturns && marketReturns.length === returns.length) {
      beta = calculateBeta(returns, marketReturns);
      const portfolioMeanReturn =
        returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const marketMeanReturn =
        marketReturns.reduce((sum, ret) => sum + ret, 0) / marketReturns.length;
      alpha = calculateAlpha(portfolioMeanReturn, marketMeanReturn, beta);
    }
  }

  const holdingPeriodReturn = totalReturnPercent;
  const winRate = calculateWinRate(transactions);
  const profitFactor = calculateProfitFactor(transactions);

  return {
    xirr: portfolioXIRR || undefined,
    totalReturn,
    annualizedReturn,
    volatility,
    sharpeRatio,
    beta,
    alpha,
    maxDrawdown,
    var95,
    holdingPeriodReturn,
    winRate,
    profitFactor,
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
