import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { PortfolioCharts } from './PortfolioCharts';
import { apiService } from '@/services/api';
import { marketDataService } from '@/services/marketDataService';
import { calculatePortfolioXIRR } from '@/utils/portfolioAnalytics';
import type { PortfolioHolding, PortfolioSummary, PortfolioStats, MarketData } from '@/types/api';

export function PortfolioView() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [xirr, setXirr] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load portfolio data from database
      const [summaryResponse, statsResponse, holdingsResponse] = await Promise.all([
        apiService.getPortfolioSummary(),
        apiService.getPortfolioStats(),
        apiService.getPortfolioHoldings(),
      ]);

      if (summaryResponse.success && summaryResponse.data) {
        setSummary(summaryResponse.data as PortfolioSummary);
      }

      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data as PortfolioStats);
      }

      if (holdingsResponse.success && holdingsResponse.data) {
        const holdingsList = holdingsResponse.data as PortfolioHolding[];
        setHoldings(holdingsList);

        // Load market data for holdings
        const symbols = holdingsList.map(h => h.companySymbol);
        const marketDataMap = await marketDataService.getMarketDataBatch(symbols);
        setMarketData(marketDataMap);

        // Calculate XIRR
        const transactions = await getTransactionsForXIRR();
        const portfolioValue = marketDataService.calculatePortfolioValue(
          holdingsList.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
          marketDataMap
        );
        const xirrValue = calculatePortfolioXIRR(transactions, portfolioValue.totalValue) || 0;
        setXirr(xirrValue);
      }
    } catch (err) {
      setError('Failed to load portfolio data');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionsForXIRR = async () => {
    try {
      const response = await apiService.getTransactions();
      return response.success ? response.data as any[] : [];
    } catch (error) {
      console.error('Failed to get transactions for XIRR:', error);
      return [];
    }
  };

  const handleRecalculate = async () => {
    try {
      await apiService.recalculatePortfolio();
      await loadPortfolioData();
    } catch (err) {
      setError('Failed to recalculate portfolio');
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading portfolio data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Overview</h2>
          <p className="text-gray-600">Your investment portfolio summary and holdings</p>
        </div>
        <Button onClick={handleRecalculate}>
          Recalculate Portfolio
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Portfolio Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Investment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.totalInvestment)}
              </div>
              <div className="text-sm text-gray-600">
                {formatNumber(summary.totalUnits)} units
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
                    holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
                    marketData
                  ).totalValue
                )}
              </div>
              <div className="text-sm text-gray-600">
                {holdings.length} holdings
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unrealized P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${(marketDataService.calculatePortfolioValue(
                holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
                marketData
              ).unrealizedPnL || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {formatCurrency(
                  marketDataService.calculatePortfolioValue(
                    holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
                    marketData
                  ).unrealizedPnL || 0
                )}
              </div>
              <div className={`text-sm ${(marketDataService.calculatePortfolioValue(
                holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
                marketData
              ).unrealizedPnLPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                {formatPercent(
                  marketDataService.calculatePortfolioValue(
                    holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity, weightedAverageCost: h.weightedAverageCost })),
                    marketData
                  ).unrealizedPnLPercent || 0
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">XIRR</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatPercent(xirr * 100)}
              </div>
              <div className="text-sm text-gray-600">
                Annualized return
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Charts */}
      <PortfolioCharts
        holdings={holdings}
        stats={stats}
      />

      {/* Holdings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Holdings</CardTitle>
          <CardDescription>Detailed view of your current holdings</CardDescription>
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
                    Company Name
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
                {holdings.map((holding) => {
                  const marketInfo = marketData.get(holding.companySymbol);
                  const currentPrice = marketInfo?.currentPrice || 0;
                  const marketValue = holding.totalQuantity * currentPrice;
                  const pnl = marketValue - holding.totalCost;
                  const returnPercent = ((marketValue - holding.totalCost) / holding.totalCost) * 100;
                  const avgCost = holding.totalCost / holding.totalQuantity;

                  return (
                    <tr key={holding.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {holding.companySymbol}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {holding.company?.companyName || '-'}
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

      {/* Sector Distribution */}
      {stats && stats.sectorDistribution && stats.sectorDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Sector Distribution</CardTitle>
            <CardDescription>Portfolio allocation by sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.sectorDistribution.map((sector) => (
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
  );
}
