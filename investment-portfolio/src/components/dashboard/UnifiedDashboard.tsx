import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { apiService } from '@/services/api';
import { marketDataService } from '@/services/marketDataService';
import { calculatePortfolioXIRR } from '@/utils/portfolioAnalytics';
import type { PortfolioSummary, PortfolioStats, PortfolioHolding, MarketData } from '@/types/api';

type AppTab = 'dashboard' | 'portfolio' | 'transactions' | 'reports' | 'companies';

interface UnifiedPortfolioData {
  totalValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
  xirr: number;
}

interface TopPerformer {
  symbol: string;
  value: number;
  change: number;
  changePercent: number;
  quantity: number;
}

interface UnifiedDashboardProps {
  onNavigate?: (tab: AppTab) => void;
}

export function UnifiedDashboard({ onNavigate }: UnifiedDashboardProps) {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [portfolioData, setPortfolioData] = useState<UnifiedPortfolioData | null>(null);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const autoRefreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load initial data and start 60-second auto-refresh
  useEffect(() => {
    loadInitialData();
    autoRefreshRef.current = setInterval(() => {
      loadInitialData();
    }, 60000);
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);

      // Load basic portfolio data
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

        // Calculate portfolio metrics using actual weighted average cost from database
        const portfolioValue = marketDataService.calculatePortfolioValue(
          holdingsList.map(h => ({
            symbol: h.companySymbol,
            quantity: h.totalQuantity,
            weightedAverageCost: h.weightedAverageCost,
          })),
          marketDataMap
        );

        // Calculate XIRR
        const transactions = await getTransactionsForXIRR();
        const xirr = calculatePortfolioXIRR(transactions, portfolioValue.totalValue) || 0;

        setPortfolioData({
          totalValue: portfolioValue.totalValue,
          totalCost: portfolioValue.totalCost,
          unrealizedPnL: portfolioValue.unrealizedPnL,
          unrealizedPnLPercent: portfolioValue.unrealizedPnLPercent,
          dayChange: portfolioValue.holdings.reduce((sum: number, h: any) => sum + (h.dayChange * h.quantity), 0),
          dayChangePercent: 0,
          xirr,
        });

        // Calculate top performers
        const performers = portfolioValue.holdings
          .map((h: any) => ({
            symbol: h.symbol,
            value: h.value,
            change: h.dayChange * h.quantity,
            changePercent: h.dayChangePercent,
            quantity: h.quantity,
          }))
          .sort((a: any, b: any) => b.changePercent - a.changePercent)
          .slice(0, 5);

        setTopPerformers(performers);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTransactionsForXIRR = async () => {
    try {
      const response = await apiService.getTransactions();
      if (response.success && response.data) {
        return response.data as any[];
      }
      return [];
    } catch (error) {
      console.error('Failed to get transactions for XIRR:', error);
      return [];
    }
  };

  // Subscribe to market data updates
  useEffect(() => {
    if (holdings.length === 0) return;

    const symbols = holdings.map(h => h.companySymbol);

    // Subscribe to market data updates
    symbols.forEach(symbol => {
      marketDataService.subscribe(symbol, (data: MarketData) => {
        setMarketData(prev => {
          const newMap = new Map(prev);
          newMap.set(symbol, data);
          return newMap;
        });
      });
    });

    return () => {
      symbols.forEach(symbol => {
        marketDataService.unsubscribe(symbol);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdings]);

  // Update portfolio value when market data changes
  useEffect(() => {
    if (holdings.length === 0 || marketData.size === 0) return;

    const portfolioValue = marketDataService.calculatePortfolioValue(
      holdings.map(h => ({
        symbol: h.companySymbol,
        quantity: h.totalQuantity,
        weightedAverageCost: h.weightedAverageCost,
      })),
      marketData
    );

    setPortfolioData(prev => prev ? {
      ...prev,
      totalValue: portfolioValue.totalValue,
      unrealizedPnL: portfolioValue.unrealizedPnL,
      unrealizedPnLPercent: portfolioValue.unrealizedPnLPercent,
      dayChange: portfolioValue.holdings.reduce((sum: number, h: any) => sum + (h.dayChange * h.quantity), 0),
    } : null);

    setLastUpdate(new Date());
  }, [marketData, holdings]);

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

  const handleDrillDown = (type: string, _value?: string) => {
    switch (type) {
      case 'company':
      case 'portfolio':
        onNavigate?.('portfolio');
        break;
      case 'sector':
        onNavigate?.('reports');
        break;
      case 'transaction':
        onNavigate?.('transactions');
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h2>
          <p className="text-gray-600">Real-time portfolio performance and insights</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-sm text-gray-600">Live</span>
          </div>
          <span className="text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()} · auto-refreshes every minute
          </span>
          <Button size="sm" onClick={loadInitialData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleDrillDown('portfolio')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {portfolioData ? formatCurrency(portfolioData.totalValue) : 'N/A'}
            </div>
            <div className={`text-sm font-medium ${portfolioData?.dayChange && portfolioData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData ? formatPercent(portfolioData.dayChangePercent) : '0.00%'}
              ({portfolioData ? formatCurrency(portfolioData.dayChange) : '₹0'})
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleDrillDown('transaction')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {portfolioData ? formatCurrency(portfolioData.totalCost) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              {summary ? formatNumber(summary.totalUnits) : 0} units
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleDrillDown('portfolio')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Unrealized P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${portfolioData?.unrealizedPnL && portfolioData.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData ? formatCurrency(portfolioData.unrealizedPnL) : 'N/A'}
            </div>
            <div className={`text-sm font-medium ${portfolioData?.unrealizedPnLPercent && portfolioData.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {portfolioData ? formatPercent(portfolioData.unrealizedPnLPercent) : '0.00%'}
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-lg transition-shadow"
          onClick={() => handleDrillDown('portfolio')}
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">XIRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {portfolioData ? formatPercent(portfolioData.xirr * 100) : 'N/A'}
            </div>
            <div className="text-sm text-gray-600">
              Annualized return
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Transaction Activity
            <Button variant="outline" size="sm" onClick={() => handleDrillDown('transaction')}>
              View All
            </Button>
          </CardTitle>
          <CardDescription>
            Recent transaction summary and statistics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">
                {stats?.totalTransactions ?? 0}
              </div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {stats?.buyTransactions ?? 0}
              </div>
              <div className="text-sm text-gray-600">Buy Transactions</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {stats?.sellTransactions ?? 0}
              </div>
              <div className="text-sm text-gray-600">Sell Transactions</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Holdings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Holdings
              <Button variant="outline" size="sm" onClick={() => handleDrillDown('portfolio')}>
                View All
              </Button>
            </CardTitle>
            <CardDescription>
              Your largest portfolio positions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.topHoldings?.slice(0, 5).map((holding, index) => {
                const marketInfo = marketData.get(holding.companySymbol);
                const currentPrice = marketInfo?.currentPrice || 0;
                const currentValue = holding.totalQuantity * currentPrice;
                const dayChange = marketInfo?.dayChange || 0;
                const dayChangePercent = marketInfo?.dayChangePercent || 0;

                return (
                  <div
                    key={holding.companySymbol}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => handleDrillDown('company', holding.companySymbol)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                        <span className="text-indigo-600 font-semibold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{holding.companySymbol}</div>
                        <div className="text-sm text-gray-500">{formatNumber(holding.totalQuantity)} units</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-gray-900">{formatCurrency(currentValue)}</div>
                      <div className={`text-sm ${dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPercent(dayChangePercent)}
                      </div>
                    </div>
                  </div>
                );
              }) || <div className="text-center py-8 text-gray-500">No holdings yet</div>}
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Top Performers
              <Button variant="outline" size="sm" onClick={() => handleDrillDown('portfolio')}>
                View Analysis
              </Button>
            </CardTitle>
            <CardDescription>
              Best performing stocks today
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPerformers.map((performer, index) => (
                <div
                  key={performer.symbol}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleDrillDown('company', performer.symbol)}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${performer.changePercent >= 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                      <span className={`font-semibold text-sm ${performer.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{performer.symbol}</div>
                      <div className="text-sm text-gray-500">{formatNumber(performer.quantity)} units</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatCurrency(performer.value)}</div>
                    <div className={`text-sm font-medium ${performer.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      {formatPercent(performer.changePercent)}
                    </div>
                  </div>
                </div>
              ))}
              {topPerformers.length === 0 && (
                <div className="text-center py-8 text-gray-500">No performance data available</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sector Distribution */}
      {stats && stats.sectorDistribution.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Sector Distribution
              <Button variant="outline" size="sm" onClick={() => handleDrillDown('sector')}>
                View Analysis
              </Button>
            </CardTitle>
            <CardDescription>
              Portfolio allocation by sector
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.sectorDistribution.slice(0, 6).map((sector) => (
                <div
                  key={sector.sector}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleDrillDown('sector', sector.sector)}
                >
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
