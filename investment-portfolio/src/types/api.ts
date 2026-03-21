// API types that work for both Tauri desktop and SaaS web versions

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  success: boolean;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: "ROOT" | "ADMIN" | "EDITOR" | "VIEWER" | "READ_ONLY" | "USER";
  organizationId?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface TransactionCharges {
  brokerage: number;
  dpCharges: number;
  sebonFee: number;
  totalCharges: number;
}

export interface CapitalGainsCalculation {
  capitalGains: number;
  holdingPeriodDays: number;
  isLongTerm: boolean;
  applicableTaxRate: number;
  taxAmount: number;
  netReceivables: number;
}

export interface TaxRates {
  SHORT_TERM_CAPITAL_GAINS: number;
  LONG_TERM_CAPITAL_GAINS: number;
  BROKERAGE_RATE: number;
  DP_CHARGE_RATE: number;
  SEBON_FEE_RATE: number;
}

export interface PortfolioCalculation {
  totalInvestment: number;
  currentValue: number;
  unrealizedPnL: number;
  totalReturnPercent: number;
  holdings: PortfolioHolding[];
}

export interface PortfolioHolding {
  symbol: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: string;
}

export interface Company {
  id: string;
  serialNumber?: number;
  symbol: string;
  companyName: string;
  symbol2?: string;
  sector?: string;
  symbol3?: string;
  instrumentType?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  companySymbol: string;
  billNo?: string;
  transactionDate: string;
  transactionType: "BUY" | "SELL";
  purchaseQuantity: number;
  purchasePricePerUnit?: number;
  totalPurchaseAmount?: number;
  salesQuantity: number;
  salesPricePerUnit?: number;
  totalSalesAmount?: number;
  principalCostNfrs?: number;
  transactionCostNfrs?: number;
  unitSum?: number;
  waccNfrs?: number;
  profitLossNfrs?: number;
  purchaseCommission?: number;
  purchaseDpCharges?: number;
  totalPurchaseCommission?: number;
  totalInvestmentCost?: number;
  salesCommission?: number;
  salesDpCharges?: number;
  totalSalesCommission?: number;
  capitalGainTax?: number;
  netReceivables?: number;
  principalAmountTax?: number;
  tcTax?: number;
  waccTax?: number;
  profitLossTax?: number;
  // Enhanced fields from Excel analysis
  closingUnit?: number;
  investmentCostWithCommission?: number;
  holdingPeriodDays?: number;
  realizedGainLoss?: number;
  unrealizedGainLoss?: number;
  totalGainLoss?: number;
  brokerageRate?: number;
  dpChargeRate?: number;
  taxRate?: number;
  createdAt: string;
  updatedAt?: string;
  company?: {
    symbol: string;
    companyName: string;
    sector?: string;
  };
}

export interface PortfolioHolding {
  id: string;
  companySymbol: string;
  totalQuantity: number;
  weightedAverageCost: number;
  totalCost: number;
  lastUpdated: string;
  company?: {
    symbol: string;
    companyName: string;
    sector?: string;
  };
}

export interface PortfolioSummary {
  totalInvestment: number;
  currentValue: number;
  totalCompanies: number;
  totalUnits: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
}

export interface PortfolioStats {
  totalTransactions: number;
  buyTransactions: number;
  sellTransactions: number;
  topHoldings: PortfolioHolding[];
  sectorDistribution: Array<{
    sector: string;
    value: number;
    percentage: number;
  }>;
  averageHoldingValue: number;
}

export interface MonthlySummary {
  id: string;
  monthName?: string;
  serialNo?: number;
  companySymbol: string;
  sector?: string;
  purchaseQuantity?: number;
  totalPurchaseAmount?: number;
  salesQuantity?: number;
  salesAmount?: number;
  tcNfrs?: number;
  closingUnits?: number;
  waccNfrs?: number;
  profitLossNfrs?: number;
  purchaseCommission?: number;
  purchaseDpCharges?: number;
  totalPurchaseCommission?: number;
  investmentCostWithCommission?: number;
  salesCommission?: number;
  salesDpCharges?: number;
  totalSalesCommission?: number;
  capitalGainTax?: number;
  netReceivables?: number;
  tcTax?: number;
  waccTax?: number;
  profitLossTax?: number;
}

export interface MonthlyPerformance {
  month: string;
  purchases: number;
  sales: number;
  net: number;
}

export interface SectorAnalysis {
  sector: string;
  value: number;
  companies: number;
  percentage: number;
}

export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  companySymbol?: string;
  sector?: string;
  transactionType?: string;
}

export interface DetailedPortfolioSummary {
  symbol: string;
  companyName: string;
  sector: string;
  currentQuantity: number;
  totalInvested: number;
  totalSold: number;
  netInvestment: number;
}

export interface AdvancedAnalytics {
  xirr?: number;
  totalReturn?: number;
  annualizedReturn?: number;
  volatility?: number;
  sharpeRatio?: number;
  beta?: number;
  alpha?: number;
  maxDrawdown?: number;
  var95?: number; // Value at Risk 95%
  holdingPeriodReturn?: number;
  winRate?: number;
  profitFactor?: number;
}

export interface CompanyStatement {
  companySymbol: string;
  companyName: string;
  sector: string;
  transactions: Transaction[];
  currentHoldings: number;
  totalInvestment: number;
  currentValue: number;
  realizedPnL: number;
  unrealizedPnL: number;
  totalPnL: number;
  averageHoldingPeriod: number;
  xirr: number;
  lastUpdated: string;
}

export interface TaxReport {
  id: string;
  fiscalYear: string;
  totalCapitalGains: number;
  totalCapitalLosses: number;
  netCapitalGains: number;
  capitalGainsTax: number;
  shortTermGains: number;
  longTermGains: number;
  shortTermTax: number;
  longTermTax: number;
  totalTax: number;
  companies: Array<{
    symbol: string;
    shortTermGains: number;
    longTermGains: number;
    tax: number;
  }>;
}

export interface MarketData {
  symbol: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  marketCap: number;
  pe?: number;
  pb?: number;
  dividend?: number;
  lastUpdated: string;
}
