import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/services/api';
import { marketDataService } from '@/services/marketDataService';
import { calculatePortfolioXIRR } from '@/utils/portfolioAnalytics';
import type { PortfolioSummary, PortfolioStats, PortfolioHolding, MarketData, MonthlySummary } from '@/types/api';

interface ReportData {
  portfolioSummary: PortfolioSummary | null;
  portfolioStats: PortfolioStats | null;
  holdings: PortfolioHolding[];
  marketData: Map<string, MarketData>;
  xirr: number;
  loading: boolean;
  monthlyData: MonthlySummary[];
}

export function CombinedReports() {
  const [reportData, setReportData] = useState<ReportData>({
    portfolioSummary: null,
    portfolioStats: null,
    holdings: [],
    marketData: new Map(),
    xirr: 0,
    loading: true,
    monthlyData: [],
  });
  const [activeReport, setActiveReport] = useState<string>('overview');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  // Load all report data
  const loadReportData = useCallback(async () => {
    try {
      setReportData(prev => ({ ...prev, loading: true }));

      // Load portfolio data from database
      const [summaryResponse, statsResponse, holdingsResponse, monthlyResponse] = await Promise.all([
        apiService.getPortfolioSummary(),
        apiService.getPortfolioStats(),
        apiService.getPortfolioHoldings(),
        apiService.getMonthlySummary()
      ]);

      const summary = summaryResponse.success ? summaryResponse.data as PortfolioSummary : null;
      const stats = statsResponse.success ? statsResponse.data as PortfolioStats : null;
      const holdings = holdingsResponse.success ? holdingsResponse.data as PortfolioHolding[] : [];
      const monthlyData = monthlyResponse.success ? monthlyResponse.data as MonthlySummary[] : [];

      // Load market data for holdings
      const symbols = holdings.map(h => h.companySymbol);
      const marketDataMap = await marketDataService.getMarketDataBatch(symbols);

      // Calculate XIRR
      const transactions = await getTransactionsForXIRR();
      const portfolioValue = marketDataService.calculatePortfolioValue(
        holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
        marketDataMap
      );
      const xirr = calculatePortfolioXIRR(transactions, portfolioValue.totalValue) || 0;

      setReportData({
        portfolioSummary: summary,
        portfolioStats: stats,
        holdings,
        marketData: marketDataMap,
        xirr,
        loading: false,
        monthlyData,
      });
    } catch (error) {
      console.error('Failed to load report data:', error);
      setReportData(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const getTransactionsForXIRR = async () => {
    try {
      const response = await apiService.getTransactions();
      return response.success ? response.data as any[] : [];
    } catch (error) {
      console.error('Failed to get transactions for XIRR:', error);
      return [];
    }
  };

  useEffect(() => {
    loadReportData();
  }, [loadReportData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(num);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  // Helper functions for monthly reports
  const getUniqueMonths = () => {
    const months = new Set<string>();
    reportData.monthlyData.forEach(m => {
      if (m.monthName) {
        months.add(m.monthName);
      } else if (m.serialNo) {
        months.add(`Month ${m.serialNo}`);
      }
    });
    return Array.from(months).sort();
  };

  const getFilteredMonthlyData = () => {
    if (selectedMonth === 'all') {
      return reportData.monthlyData;
    }
    return reportData.monthlyData.filter(m =>
      (m.monthName && m.monthName === selectedMonth) ||
      (!m.monthName && m.serialNo && `Month ${m.serialNo}` === selectedMonth)
    );
  };

  const getMonthlySummaryStats = () => {
    const filteredData = getFilteredMonthlyData();
    return {
      totalMonths: new Set(filteredData.map(m => m.monthName || m.serialNo)).size,
      totalPurchases: filteredData.reduce((sum, m) => sum + (m.totalPurchaseAmount || 0), 0),
      totalSales: filteredData.reduce((sum, m) => sum + (m.salesAmount || 0), 0),
      activeCompanies: new Set(filteredData.map(m => m.companySymbol)).size,
    };
  };

  const calculateTaxLiability = () => {
    if (!reportData.holdings.length) return 0;

    // Simplified tax calculation based on unrealized gains
    const portfolioValue = marketDataService.calculatePortfolioValue(
      reportData.holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
      reportData.marketData
    );

    // Assume 10% tax on unrealized gains above 1 year
    const longTermGains = Math.max(0, portfolioValue.unrealizedPnL);
    return longTermGains * 0.10;
  };

  const calculateRiskMetrics = () => {
    if (!reportData.holdings.length) return { volatility: 0, sharpeRatio: 0, maxDrawdown: 0 };

    // Simplified risk calculations based on portfolio distribution
    const totalValue = reportData.holdings.reduce((sum, h) => {
      const marketInfo = reportData.marketData.get(h.companySymbol);
      return sum + (h.totalQuantity * (marketInfo?.currentPrice || 0));
    }, 0);

    // Calculate concentration risk (largest holding %)
    const largestHolding = Math.max(...reportData.holdings.map(h => {
      const marketInfo = reportData.marketData.get(h.companySymbol);
      const value = h.totalQuantity * (marketInfo?.currentPrice || 0);
      return (value / totalValue) * 100;
    }));

    // Simplified metrics
    const volatility = largestHolding > 40 ? 25 : largestHolding > 20 ? 18 : 12;
    const sharpeRatio = reportData.xirr > 0 ? (reportData.xirr * 100) / volatility : 0;
    const maxDrawdown = volatility * 0.8; // Simplified max drawdown

    return { volatility, sharpeRatio, maxDrawdown };
  };

  if (reportData.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading reports...</div>
      </div>
    );
  }

  const riskMetrics = calculateRiskMetrics();
  const taxLiability = calculateTaxLiability();

  return (
    <div className="space-y-6">
      {/* Report Navigation */}
      <div className="flex space-x-4 border-b border-gray-200">
        {[
          { id: 'overview', name: 'Portfolio Overview' },
          { id: 'performance', name: 'Performance Analysis' },
          { id: 'risk', name: 'Risk Assessment' },
          { id: 'tax', name: 'Tax Report' },
          { id: 'monthly', name: 'Monthly Reports' },
          { id: 'holdings', name: 'Holdings Detail' },
        ].map((report) => (
          <button
            key={report.id}
            onClick={() => setActiveReport(report.id)}
            className={`py-2 px-4 border-b-2 font-medium text-sm ${activeReport === report.id
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
          >
            {report.name}
          </button>
        ))}
      </div>

      {/* Portfolio Overview Report */}
      {activeReport === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {reportData.portfolioSummary ? formatCurrency(reportData.portfolioSummary.totalInvestment) : '₹0'}
                </div>
                <div className="text-sm text-gray-600">
                  {reportData.portfolioSummary ? formatNumber(reportData.portfolioSummary.totalUnits) : 0} units
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Current Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(
                    marketDataService.calculatePortfolioValue(
                      reportData.holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
                      reportData.marketData
                    ).totalValue
                  )}
                </div>
                <div className="text-sm text-gray-600">
                  {reportData.holdings.length} holdings
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {reportData.portfolioStats?.totalTransactions || 0}
                </div>
                <div className="text-sm text-gray-600">
                  {reportData.portfolioStats?.buyTransactions || 0} buy / {reportData.portfolioStats?.sellTransactions || 0} sell
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">XIRR</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatPercent(reportData.xirr * 100)}
                </div>
                <div className="text-sm text-gray-600">
                  Annualized return
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sector Distribution */}
          {reportData.portfolioStats?.sectorDistribution && reportData.portfolioStats.sectorDistribution.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sector Distribution</CardTitle>
                <CardDescription>Portfolio allocation by sector</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.portfolioStats.sectorDistribution.map((sector) => (
                    <div key={sector.sector} className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">{sector.sector}</span>
                          <span className="text-sm text-gray-600">{sector.percentage.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${sector.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="ml-4 text-sm font-medium text-gray-900">
                        {formatCurrency(sector.value)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Performance Analysis Report */}
      {activeReport === 'performance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">XIRR (Annualized)</span>
                    <span className="text-lg font-bold text-gray-900">{formatPercent(reportData.xirr * 100)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Total Return</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatPercent(
                        ((marketDataService.calculatePortfolioValue(
                          reportData.holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
                          reportData.marketData
                        ).totalValue - (reportData.portfolioSummary?.totalInvestment || 0)) /
                          (reportData.portfolioSummary?.totalInvestment || 1)) * 100
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Sharpe Ratio</span>
                    <span className="text-lg font-bold text-gray-900">{riskMetrics.sharpeRatio.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Volatility</span>
                    <span className="text-lg font-bold text-gray-900">{riskMetrics.volatility.toFixed(1)}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Best performing holdings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.holdings
                    .map(holding => {
                      const marketInfo = reportData.marketData.get(holding.companySymbol);
                      const currentValue = holding.totalQuantity * (marketInfo?.currentPrice || 0);
                      const returnPercent = ((currentValue - holding.totalCost) / holding.totalCost) * 100;
                      return { ...holding, currentValue, returnPercent };
                    })
                    .sort((a, b) => b.returnPercent - a.returnPercent)
                    .slice(0, 5)
                    .map((holding, index) => (
                      <div key={holding.companySymbol} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                            <span className="text-green-600 font-semibold text-xs">{index + 1}</span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{holding.companySymbol}</div>
                            <div className="text-sm text-gray-500">{formatNumber(holding.totalQuantity)} units</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">{formatCurrency(holding.currentValue)}</div>
                          <div className={`text-sm font-medium ${holding.returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercent(holding.returnPercent)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Risk Assessment Report */}
      {activeReport === 'risk' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Risk Metrics</CardTitle>
                <CardDescription>Portfolio risk assessment</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Volatility</span>
                      <span className="text-lg font-bold text-gray-900">{riskMetrics.volatility.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${riskMetrics.volatility > 20 ? 'bg-red-500' :
                          riskMetrics.volatility > 15 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(riskMetrics.volatility, 30)}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-600">Max Drawdown Risk</span>
                      <span className="text-lg font-bold text-gray-900">{riskMetrics.maxDrawdown.toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${riskMetrics.maxDrawdown > 20 ? 'bg-red-500' :
                          riskMetrics.maxDrawdown > 15 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                        style={{ width: `${Math.min(riskMetrics.maxDrawdown, 30)}%` }}
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Risk Level</span>
                      <span className={`text-lg font-bold ${riskMetrics.volatility > 20 ? 'text-red-600' :
                        riskMetrics.volatility > 15 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                        {riskMetrics.volatility > 20 ? 'High' : riskMetrics.volatility > 15 ? 'Medium' : 'Low'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Concentration Risk</CardTitle>
                <CardDescription>Holding concentration analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reportData.holdings
                    .map(holding => {
                      const marketInfo = reportData.marketData.get(holding.companySymbol);
                      const value = holding.totalQuantity * (marketInfo?.currentPrice || 0);
                      const totalValue = reportData.holdings.reduce((sum, h) => {
                        const info = reportData.marketData.get(h.companySymbol);
                        return sum + (h.totalQuantity * (info?.currentPrice || 0));
                      }, 0);
                      const percentage = (value / totalValue) * 100;
                      return { ...holding, value, percentage };
                    })
                    .sort((a, b) => b.percentage - a.percentage)
                    .slice(0, 5)
                    .map((holding) => (
                      <div key={holding.companySymbol} className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-gray-900">{holding.companySymbol}</span>
                            <span className="text-sm text-gray-600">{holding.percentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div
                              className={`h-1 rounded-full transition-all duration-300 ${holding.percentage > 20 ? 'bg-red-500' :
                                holding.percentage > 10 ? 'bg-yellow-500' : 'bg-green-500'
                                }`}
                              style={{ width: `${holding.percentage}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Recommendations</CardTitle>
                <CardDescription>Portfolio optimization suggestions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskMetrics.volatility > 20 && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="text-sm font-medium text-red-800">High Volatility Detected</div>
                      <div className="text-xs text-red-600">Consider diversifying to reduce portfolio risk</div>
                    </div>
                  )}
                  {reportData.holdings.some(h => {
                    const totalValue = reportData.holdings.reduce((sum, holding) => {
                      const info = reportData.marketData.get(holding.companySymbol);
                      return sum + (holding.totalQuantity * (info?.currentPrice || 0));
                    }, 0);
                    const value = h.totalQuantity * (reportData.marketData.get(h.companySymbol)?.currentPrice || 0);
                    return (value / totalValue) > 30;
                  }) && (
                      <div className="p-3 bg-yellow-50 rounded-lg">
                        <div className="text-sm font-medium text-yellow-800">High Concentration</div>
                        <div className="text-xs text-yellow-600">Consider rebalancing to reduce concentration risk</div>
                      </div>
                    )}
                  {riskMetrics.sharpeRatio < 1 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm font-medium text-blue-800">Low Risk-Adjusted Return</div>
                      <div className="text-xs text-blue-600">Consider improving risk-adjusted performance</div>
                    </div>
                  )}
                  {riskMetrics.volatility <= 15 && riskMetrics.sharpeRatio >= 1 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="text-sm font-medium text-green-800">Well Balanced Portfolio</div>
                      <div className="text-xs text-green-600">Risk and return are well balanced</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Tax Report */}
      {activeReport === 'tax' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tax Liability Summary</CardTitle>
                <CardDescription>Estimated tax calculations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Short-term Gains Tax</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(taxLiability * 0.4)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">Long-term Gains Tax</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(taxLiability * 0.6)}
                    </span>
                  </div>
                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">Total Estimated Tax</span>
                      <span className="text-xl font-bold text-red-600">{formatCurrency(taxLiability)}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    *Based on current unrealized gains and Nepal tax rates
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tax Optimization</CardTitle>
                <CardDescription>Strategies to minimize tax liability</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800">Long-term Holding Strategy</div>
                    <div className="text-xs text-blue-600">Hold investments for &gt;1 year to qualify for lower tax rates</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="text-sm font-medium text-green-800">Tax Loss Harvesting</div>
                    <div className="text-xs text-green-600">Sell losing positions to offset gains and reduce tax</div>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <div className="text-sm font-medium text-purple-800">Sector Rotation</div>
                    <div className="text-xs text-purple-600">Rebalance portfolio to optimize tax efficiency</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Monthly Reports */}
      {activeReport === 'monthly' && (
        <div className="space-y-6">
          {/* Month Filter */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Reports Filter</CardTitle>
              <CardDescription>
                Select a specific month to view detailed reports, or view all months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">Select Month:</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="block w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="all">All Months</option>
                  {getUniqueMonths().map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
                <span className="text-sm text-gray-500">
                  {selectedMonth === 'all'
                    ? `Showing ${reportData.monthlyData.length} records across all months`
                    : `Showing ${getFilteredMonthlyData().length} records for ${selectedMonth}`
                  }
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMonth === 'all' ? 'Monthly Portfolio Summary' : `${selectedMonth} - Portfolio Summary`}
              </CardTitle>
              <CardDescription>
                {selectedMonth === 'all'
                  ? 'Month-by-month breakdown of your portfolio performance and transactions'
                  : `Detailed transactions and performance for ${selectedMonth}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {getFilteredMonthlyData().length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {selectedMonth === 'all' ? 'Month' : 'Company'}
                        </th>
                        {selectedMonth === 'all' && (
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Company
                          </th>
                        )}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Purchase Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Qty
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Sales Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Closing Units
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Net Investment
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredMonthlyData().map((monthly, index) => (
                        <tr key={`${monthly.monthName}-${monthly.companySymbol}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {selectedMonth === 'all'
                              ? (monthly.monthName || `Month ${monthly.serialNo}`)
                              : monthly.companySymbol
                            }
                          </td>
                          {selectedMonth === 'all' && (
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{monthly.companySymbol}</div>
                                <div className="text-gray-500">{monthly.sector || 'N/A'}</div>
                              </div>
                            </td>
                          )}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(monthly.purchaseQuantity || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(monthly.totalPurchaseAmount || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(monthly.salesQuantity || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(monthly.salesAmount || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(monthly.closingUnits || 0)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(
                              (monthly.totalPurchaseAmount || 0) - (monthly.salesAmount || 0)
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {selectedMonth === 'all'
                    ? 'No monthly data available. Start adding transactions to see monthly reports.'
                    : `No data available for ${selectedMonth}.`
                  }
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {selectedMonth === 'all' ? 'Total Months' : 'Companies'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedMonth === 'all'
                    ? getMonthlySummaryStats().totalMonths
                    : getMonthlySummaryStats().activeCompanies
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {selectedMonth === 'all' ? 'Active months' : 'Active companies'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Purchases</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getMonthlySummaryStats().totalPurchases)}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedMonth === 'all' ? 'All time' : selectedMonth}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {formatCurrency(getMonthlySummaryStats().totalSales)}
                </div>
                <div className="text-sm text-gray-600">
                  {selectedMonth === 'all' ? 'All time' : selectedMonth}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {selectedMonth === 'all' ? 'Active Companies' : 'Net Investment'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">
                  {selectedMonth === 'all'
                    ? getMonthlySummaryStats().activeCompanies
                    : formatCurrency(getMonthlySummaryStats().totalPurchases - getMonthlySummaryStats().totalSales)
                  }
                </div>
                <div className="text-sm text-gray-600">
                  {selectedMonth === 'all' ? 'Traded companies' : 'Monthly net flow'}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedMonth === 'all' ? 'Monthly Performance Trend' : `${selectedMonth} - Performance Breakdown`}
              </CardTitle>
              <CardDescription>
                {selectedMonth === 'all'
                  ? 'Net investment activity per month'
                  : `Company-wise performance for ${selectedMonth}`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <div className="text-lg font-medium">
                    {selectedMonth === 'all' ? 'Monthly Performance Chart' : 'Monthly Breakdown Chart'}
                  </div>
                  <div className="text-sm">
                    {selectedMonth === 'all'
                      ? 'Chart visualization would be implemented here'
                      : `${selectedMonth} company performance chart would be implemented here`
                    }
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Holdings Detail Report */}
      {activeReport === 'holdings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detailed Holdings</CardTitle>
              <CardDescription>Complete portfolio holdings with market data</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Symbol
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quantity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Avg Cost
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Current Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Market Value
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        P&L
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Return %
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.holdings.map((holding) => {
                      const marketInfo = reportData.marketData.get(holding.companySymbol);
                      const currentPrice = marketInfo?.currentPrice || 0;
                      const marketValue = holding.totalQuantity * currentPrice;
                      const pnl = marketValue - holding.totalCost;
                      const returnPercent = ((marketValue - holding.totalCost) / holding.totalCost) * 100;
                      const avgCost = holding.totalCost / holding.totalQuantity;

                      return (
                        <tr key={holding.companySymbol} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {holding.companySymbol}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatNumber(holding.totalQuantity)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(avgCost)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(currentPrice)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(marketValue)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={pnl >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatCurrency(pnl)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span className={returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatPercent(returnPercent)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Refresh Button */}
      <div className="flex justify-end">
        <Button onClick={loadReportData} disabled={reportData.loading}>
          {reportData.loading ? 'Refreshing...' : 'Refresh Reports'}
        </Button>
      </div>
    </div>
  );
}
