import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { generateTaxReport, calculatePortfolioMetrics } from '@/utils/taxCalculations';
import { generateAdvancedAnalytics } from '@/utils/portfolioAnalytics';
import type {
  Transaction,
  TaxReport,
  CompanyStatement,
  AdvancedAnalytics,
  ReportFilters
} from '@/types/api';

type ReportType =
  | 'performance'
  | 'sectors'
  | 'monthly'
  | 'tax'
  | 'company-statement'
  | 'analytics'
  | 'risk-analysis'
  | 'pivot-summary';

interface PivotConfig {
  groupBy: 'company' | 'sector' | 'month' | 'quarter' | 'year';
  metrics: ('total' | 'count' | 'avg' | 'min' | 'max')[];
  filters: ReportFilters;
}

export function ComprehensiveReports() {
  const [activeReport, setActiveReport] = useState<ReportType>('performance');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [taxReport, setTaxReport] = useState<TaxReport | null>(null);
  const [companyStatements, setCompanyStatements] = useState<CompanyStatement[]>([]);
  const [analytics, setAnalytics] = useState<AdvancedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [fiscalYear, setFiscalYear] = useState<string>('2082-83');
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    groupBy: 'company',
    metrics: ['total'],
    filters: {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [transactionsResponse] = await Promise.all([
        apiService.getTransactions(),
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        const txns = transactionsResponse.data as Transaction[];
        setTransactions(txns);

        // Generate reports
        const taxData = generateTaxReport(txns, fiscalYear);
        setTaxReport(taxData);

        // Generate company statements
        const statements = generateCompanyStatements(txns);
        setCompanyStatements(statements);

        // Generate analytics
        const analyticsData = generateAdvancedAnalytics(txns, 0);
        setAnalytics(analyticsData);
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  }, [fiscalYear]);

  const generateCompanyStatements = (txns: Transaction[]): CompanyStatement[] => {
    const companyMap = new Map<string, Transaction[]>();

    // Group transactions by company
    txns.forEach(txn => {
      const existing = companyMap.get(txn.companySymbol) || [];
      existing.push(txn);
      companyMap.set(txn.companySymbol, existing);
    });

    const statements: CompanyStatement[] = [];

    for (const [symbol, companyTxns] of companyMap) {
      const buys = companyTxns.filter(t => t.transactionType === 'BUY');
      const sells = companyTxns.filter(t => t.transactionType === 'SELL');

      const totalInvestment = buys.reduce((sum, t) =>
        sum + (t.totalInvestmentCost || t.totalPurchaseAmount || 0) + (t.totalPurchaseCommission || 0), 0
      );

      const totalSales = sells.reduce((sum, t) =>
        sum + (t.totalSalesAmount || 0) - (t.totalSalesCommission || 0) - (t.capitalGainTax || 0), 0
      );

      const currentHoldings = buys.reduce((sum, t) => sum + (t.purchaseQuantity || 0), 0) -
        sells.reduce((sum, t) => sum + (t.salesQuantity || 0), 0);

      const realizedPnL = sells.reduce((sum, t) => {
        const cost = t.totalInvestmentCost || 0;
        const proceeds = (t.totalSalesAmount || 0) - (t.totalSalesCommission || 0) - (t.capitalGainTax || 0);
        return sum + (proceeds - cost);
      }, 0);

      statements.push({
        companySymbol: symbol,
        companyName: companyTxns[0]?.company?.companyName || symbol,
        sector: companyTxns[0]?.company?.sector || 'Unknown',
        transactions: companyTxns,
        currentHoldings,
        totalInvestment,
        currentValue: currentHoldings * 1000, // Placeholder - should use market price
        realizedPnL,
        unrealizedPnL: 0, // Placeholder - needs market data
        totalPnL: realizedPnL,
        averageHoldingPeriod: 0, // Calculate based on actual holding periods
        xirr: 0, // Calculate XIRR for this company
        lastUpdated: new Date().toISOString(),
      });
    }

    return statements.sort((a, b) => b.totalInvestment - a.totalInvestment);
  };

  const generatePivotReport = useCallback(() => {
    const filtered = transactions.filter(t => {
      if (pivotConfig.filters.companySymbol && t.companySymbol !== pivotConfig.filters.companySymbol) return false;
      if (pivotConfig.filters.sector && t.company?.sector !== pivotConfig.filters.sector) return false;
      if (pivotConfig.filters.dateFrom && new Date(t.transactionDate) < new Date(pivotConfig.filters.dateFrom)) return false;
      if (pivotConfig.filters.dateTo && new Date(t.transactionDate) > new Date(pivotConfig.filters.dateTo)) return false;
      return true;
    });

    const grouped = new Map<string, Transaction[]>();

    filtered.forEach(t => {
      let key = '';
      const date = new Date(t.transactionDate);

      switch (pivotConfig.groupBy) {
        case 'company':
          key = t.companySymbol;
          break;
        case 'sector':
          key = t.company?.sector || 'Unknown';
          break;
        case 'month':
          key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3) + 1;
          key = `${date.getFullYear()}-Q${quarter}`;
          break;
        case 'year':
          key = date.getFullYear().toString();
          break;
      }

      const existing = grouped.get(key) || [];
      existing.push(t);
      grouped.set(key, existing);
    });

    const pivotData = Array.from(grouped.entries()).map(([key, txns]) => {
      const buys = txns.filter(t => t.transactionType === 'BUY');
      const sells = txns.filter(t => t.transactionType === 'SELL');

      const result: any = { key };

      pivotConfig.metrics.forEach(metric => {
        switch (metric) {
          case 'total':
            result.totalBuys = buys.reduce((sum, t) => sum + (t.totalPurchaseAmount || 0), 0);
            result.totalSells = sells.reduce((sum, t) => sum + (t.totalSalesAmount || 0), 0);
            result.netTotal = result.totalBuys - result.totalSells;
            break;
          case 'count':
            result.buyCount = buys.length;
            result.sellCount = sells.length;
            result.totalCount = txns.length;
            break;
          case 'avg':
            result.avgBuyPrice = buys.length > 0 ? buys.reduce((sum, t) => sum + (t.purchasePricePerUnit || 0), 0) / buys.length : 0;
            result.avgSellPrice = sells.length > 0 ? sells.reduce((sum, t) => sum + (t.salesPricePerUnit || 0), 0) / sells.length : 0;
            break;
          case 'min':
            result.minBuyPrice = Math.min(...buys.map(t => t.purchasePricePerUnit || 0));
            result.minSellPrice = Math.min(...sells.map(t => t.salesPricePerUnit || 0));
            break;
          case 'max':
            result.maxBuyPrice = Math.max(...buys.map(t => t.purchasePricePerUnit || 0));
            result.maxSellPrice = Math.max(...sells.map(t => t.salesPricePerUnit || 0));
            break;
        }
      });

      return result;
    });

    return pivotData;
  }, [transactions, pivotConfig]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading comprehensive reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comprehensive Reports</h2>
          <p className="text-gray-600">Advanced portfolio analytics and reporting</p>
        </div>
        <div className="flex items-end space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
            <select
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="2082-83">2082-83</option>
              <option value="2081-82">2081-82</option>
              <option value="2080-81">2080-81</option>
            </select>
          </div>
          <Button onClick={loadData}>Refresh</Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {([
          { id: 'performance', name: 'Performance' },
          { id: 'sectors', name: 'Sector Analysis' },
          { id: 'monthly', name: 'Monthly Summary' },
          { id: 'tax', name: 'Tax Report' },
          { id: 'company-statement', name: 'Company Statements' },
          { id: 'analytics', name: 'Advanced Analytics' },
          { id: 'risk-analysis', name: 'Risk Analysis' },
          { id: 'pivot-summary', name: 'Pivot Reports' },
        ] as const).map((tab) => (
          <Button
            key={tab.id}
            variant={activeReport === tab.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveReport(tab.id as ReportType)}
          >
            {tab.name}
          </Button>
        ))}
      </div>

      {/* Tax Report */}
      {activeReport === 'tax' && taxReport && (
        <Card>
          <CardHeader>
            <CardTitle>Tax Report - FY {fiscalYear}</CardTitle>
            <CardDescription>Capital gains tax calculation and breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 font-medium">Total Capital Gains</div>
                <div className="text-2xl font-bold text-green-800">{formatCurrency(taxReport.totalCapitalGains)}</div>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="text-sm text-red-600 font-medium">Total Capital Losses</div>
                <div className="text-2xl font-bold text-red-800">{formatCurrency(taxReport.totalCapitalLosses)}</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 font-medium">Net Capital Gains</div>
                <div className="text-2xl font-bold text-blue-800">{formatCurrency(taxReport.netCapitalGains)}</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-sm text-purple-600 font-medium">Total Tax</div>
                <div className="text-2xl font-bold text-purple-800">{formatCurrency(taxReport.totalTax)}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h4 className="font-medium text-gray-900 mb-4">Short-term vs Long-term</h4>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Short-term Gains</span>
                    <span className="font-medium">{formatCurrency(taxReport.shortTermGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Long-term Gains</span>
                    <span className="font-medium">{formatCurrency(taxReport.longTermGains)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Short-term Tax (10%)</span>
                    <span className="font-medium">{formatCurrency(taxReport.shortTermTax)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Long-term Tax (5%)</span>
                    <span className="font-medium">{formatCurrency(taxReport.longTermTax)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Company-wise Tax Breakdown</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Short-term Gains</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Long-term Gains</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax Amount</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {taxReport.companies.map((company) => (
                      <tr key={company.symbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{company.symbol}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(company.shortTermGains)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(company.longTermGains)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(company.tax)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Company Statements */}
      {activeReport === 'company-statement' && (
        <Card>
          <CardHeader>
            <CardTitle>Company-wise Portfolio Statements</CardTitle>
            <CardDescription>Detailed portfolio statements for each company</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <select
                value={selectedCompany}
                onChange={(e) => setSelectedCompany(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">All Companies</option>
                {companyStatements.map(stmt => (
                  <option key={stmt.companySymbol} value={stmt.companySymbol}>
                    {stmt.companySymbol} - {stmt.companyName}
                  </option>
                ))}
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Holdings</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Investment</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Realized P&L</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total P&L</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {companyStatements
                    .filter(stmt => !selectedCompany || stmt.companySymbol === selectedCompany)
                    .map((stmt) => (
                      <tr key={stmt.companySymbol} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm">
                          <div>
                            <div className="font-medium">{stmt.companySymbol}</div>
                            <div className="text-gray-500">{stmt.companyName}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{stmt.sector}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{stmt.currentHoldings}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(stmt.totalInvestment)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(stmt.currentValue)}</td>
                        <td className={`px-6 py-4 text-sm font-medium ${stmt.realizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stmt.realizedPnL)}
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium ${stmt.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(stmt.totalPnL)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Analytics */}
      {activeReport === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Return Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">XIRR</span>
                  <span className="font-medium">{formatPercent(analytics.xirr ? analytics.xirr * 100 : 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Return</span>
                  <span className="font-medium">{formatCurrency(analytics.totalReturn || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Annualized Return</span>
                  <span className="font-medium">{formatPercent(analytics.annualizedReturn || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Holding Period Return</span>
                  <span className="font-medium">{formatPercent(analytics.holdingPeriodReturn || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Risk Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Volatility</span>
                  <span className="font-medium">{formatPercent(analytics.volatility || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sharpe Ratio</span>
                  <span className="font-medium">{(analytics.sharpeRatio || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Max Drawdown</span>
                  <span className="font-medium">{formatPercent((analytics.maxDrawdown || 0) * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VaR (95%)</span>
                  <span className="font-medium">{formatPercent(analytics.var95 || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Performance Ratios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Win Rate</span>
                  <span className="font-medium">{formatPercent(analytics.winRate || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Profit Factor</span>
                  <span className="font-medium">{(analytics.profitFactor || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Beta</span>
                  <span className="font-medium">{(analytics.beta || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Alpha</span>
                  <span className="font-medium">{formatPercent(analytics.alpha || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pivot Reports */}
      {activeReport === 'pivot-summary' && (
        <Card>
          <CardHeader>
            <CardTitle>Pivot Analysis</CardTitle>
            <CardDescription>Customizable pivot table analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group By</label>
                <select
                  value={pivotConfig.groupBy}
                  onChange={(e) => setPivotConfig(prev => ({ ...prev, groupBy: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="company">Company</option>
                  <option value="sector">Sector</option>
                  <option value="month">Month</option>
                  <option value="quarter">Quarter</option>
                  <option value="year">Year</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Metrics</label>
                <select
                  multiple
                  value={pivotConfig.metrics}
                  onChange={(e) => {
                    const selected = Array.from(e.target.selectedOptions, option => option.value as any);
                    setPivotConfig(prev => ({ ...prev, metrics: selected }));
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="total">Total Amount</option>
                  <option value="count">Transaction Count</option>
                  <option value="avg">Average Price</option>
                  <option value="min">Minimum Price</option>
                  <option value="max">Maximum Price</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Filter</label>
                <select
                  value={pivotConfig.filters.companySymbol || ''}
                  onChange={(e) => setPivotConfig(prev => ({
                    ...prev,
                    filters: { ...prev.filters, companySymbol: e.target.value || undefined }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Companies</option>
                  {Array.from(new Set(transactions.map(t => t.companySymbol))).map(symbol => (
                    <option key={symbol} value={symbol}>{symbol}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {pivotConfig.groupBy.charAt(0).toUpperCase() + pivotConfig.groupBy.slice(1)}
                    </th>
                    {pivotConfig.metrics.includes('total') && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Buys</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sells</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Total</th>
                      </>
                    )}
                    {pivotConfig.metrics.includes('count') && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buy Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sell Count</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Count</th>
                      </>
                    )}
                    {pivotConfig.metrics.includes('avg') && (
                      <>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Buy Price</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Sell Price</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {generatePivotReport().map((row, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.key}</td>
                      {pivotConfig.metrics.includes('total') && (
                        <>
                          <td className="px-6 py-4 text-sm text-green-600">{formatCurrency(row.totalBuys || 0)}</td>
                          <td className="px-6 py-4 text-sm text-red-600">{formatCurrency(row.totalSells || 0)}</td>
                          <td className={`px-6 py-4 text-sm font-medium ${row.netTotal >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                            {formatCurrency(row.netTotal || 0)}
                          </td>
                        </>
                      )}
                      {pivotConfig.metrics.includes('count') && (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900">{row.buyCount || 0}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{row.sellCount || 0}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{row.totalCount || 0}</td>
                        </>
                      )}
                      {pivotConfig.metrics.includes('avg') && (
                        <>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(row.avgBuyPrice || 0)}</td>
                          <td className="px-6 py-4 text-sm text-gray-900">{formatCurrency(row.avgSellPrice || 0)}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
