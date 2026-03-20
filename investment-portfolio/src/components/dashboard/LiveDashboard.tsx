import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { marketDataService } from '@/services/marketDataService';
import { apiService } from '@/services/api';
import { MarketData, PortfolioHolding } from '@/types/api';

interface LivePortfolioData {
  totalValue: number;
  totalCost: number;
  unrealizedPnL: number;
  unrealizedPnLPercent: number;
  dayChange: number;
  dayChangePercent: number;
}

interface MarketIndices {
  nepse: { index: number; change: number; changePercent: number };
  sensitive: { index: number; change: number; changePercent: number };
  float: { index: number; change: number; changePercent: number };
}

interface MarketNews {
  id: string;
  title: string;
  summary: string;
  source: string;
  timestamp: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  symbols: string[];
}

export function LiveDashboard() {
  const [holdings, setHoldings] = useState<PortfolioHolding[]>([]);
  const [marketData, setMarketData] = useState<Map<string, MarketData>>(new Map());
  const [portfolioData, setPortfolioData] = useState<LivePortfolioData | null>(null);
  const [indices, setIndices] = useState<MarketIndices | null>(null);
  const [news, setNews] = useState<MarketNews[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load portfolio holdings
      const holdingsResponse = await apiService.getPortfolioHoldings();
      if (holdingsResponse.success && holdingsResponse.data) {
        setHoldings(holdingsResponse.data as PortfolioHolding[]);
      }

      // Load market indices
      const indicesData = await marketDataService.getMarketIndices();
      setIndices(indicesData);

      // Load market news
      const newsData = await marketDataService.getMarketNews();
      setNews(newsData);

      // Load market data for holdings
      if (holdingsResponse.success && holdingsResponse.data) {
        const holdingsList = holdingsResponse.data as PortfolioHolding[];
        const symbols = holdingsList.map(h => h.companySymbol);
        const marketDataMap = await marketDataService.getMarketDataBatch(symbols);
        setMarketData(marketDataMap);
        
        // Calculate portfolio value
        const portfolioValue = marketDataService.calculatePortfolioValue(
          holdingsList.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity })),
          marketDataMap
        );
        
        setPortfolioData({
          totalValue: portfolioValue.totalValue,
          totalCost: portfolioValue.totalCost,
          unrealizedPnL: portfolioValue.unrealizedPnL,
          unrealizedPnLPercent: portfolioValue.unrealizedPnLPercent,
          dayChange: portfolioValue.holdings.reduce((sum, h) => sum + (h.dayChange * h.quantity), 0),
          dayChangePercent: 0, // Calculate based on previous close
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to real-time market data updates
  useEffect(() => {
    if (!isLive || holdings.length === 0) return;

    const symbols = holdings.map(h => h.companySymbol);
    
    // Subscribe to market data updates
    symbols.forEach(symbol => {
      marketDataService.subscribe(symbol, (data) => {
        setMarketData(prev => {
          const newMap = new Map(prev);
          newMap.set(symbol, data);
          return newMap;
        });
      });
    });

    // Update portfolio value when market data changes
    const updatePortfolioValue = () => {
      if (marketData.size === 0) return;
      
      const portfolioValue = marketDataService.calculatePortfolioValue(
        holdings.map(h => ({ symbol: h.companySymbol, quantity: h.totalQuantity })),
        marketData
      );
      
      setPortfolioData({
        totalValue: portfolioValue.totalValue,
        totalCost: portfolioValue.totalCost,
        unrealizedPnL: portfolioValue.unrealizedPnL,
        unrealizedPnLPercent: portfolioValue.unrealizedPnLPercent,
        dayChange: portfolioValue.holdings.reduce((sum, h) => sum + (h.dayChange * h.quantity), 0),
        dayChangePercent: 0,
      });
      
      setLastUpdate(new Date());
    };

    const interval = setInterval(updatePortfolioValue, 1000);
    
    return () => {
      clearInterval(interval);
      symbols.forEach(symbol => {
        marketDataService.unsubscribe(symbol);
      });
    };
  }, [isLive, holdings, marketData]);

  // Update market indices periodically
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(async () => {
      try {
        const indicesData = await marketDataService.getMarketIndices();
        setIndices(indicesData);
      } catch (error) {
        console.error('Failed to update indices:', error);
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isLive]);

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

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50';
      case 'negative': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading live dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Live Status */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Live Portfolio Dashboard</h2>
          <p className="text-gray-600">Real-time portfolio performance and market data</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
            <span className="text-sm text-gray-600">
              {isLive ? 'Live' : 'Paused'}
            </span>
          </div>
          <span className="text-xs text-gray-500">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </span>
          <Button
            variant={isLive ? 'outline' : 'default'}
            size="sm"
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? 'Pause' : 'Resume'}
          </Button>
          <Button size="sm" onClick={loadInitialData}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Market Indices */}
      {indices && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">NEPSE Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(indices.nepse.index)}
              </div>
              <div className={`text-sm font-medium ${indices.nepse.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(indices.nepse.changePercent)} ({formatNumber(indices.nepse.change)})
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Sensitive Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(indices.sensitive.index)}
              </div>
              <div className={`text-sm font-medium ${indices.sensitive.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(indices.sensitive.changePercent)} ({formatNumber(indices.sensitive.change)})
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Float Index</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatNumber(indices.float.index)}
              </div>
              <div className={`text-sm font-medium ${indices.float.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(indices.float.changePercent)} ({formatNumber(indices.float.change)})
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Portfolio Summary */}
      {portfolioData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Portfolio Value</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(portfolioData.totalValue)}
              </div>
              <div className={`text-sm font-medium ${portfolioData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(portfolioData.dayChangePercent)} ({formatCurrency(portfolioData.dayChange)})
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Cost</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(portfolioData.totalCost)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Unrealized P&L</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${portfolioData.unrealizedPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(portfolioData.unrealizedPnL)}
              </div>
              <div className={`text-sm font-medium ${portfolioData.unrealizedPnLPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercent(portfolioData.unrealizedPnLPercent)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Holdings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {holdings.length}
              </div>
              <div className="text-sm text-gray-600">
                {formatNumber(holdings.reduce((sum, h) => sum + h.totalQuantity, 0))} units
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Holdings Table */}
        <Card>
          <CardHeader>
            <CardTitle>Live Holdings</CardTitle>
            <CardDescription>Real-time portfolio holdings with current prices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day Change</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {holdings.map((holding) => {
                    const marketInfo = marketData.get(holding.companySymbol);
                    const currentPrice = marketInfo?.currentPrice || 0;
                    const value = holding.totalQuantity * currentPrice;
                    const dayChange = marketInfo?.dayChange || 0;
                    const dayChangePercent = marketInfo?.dayChangePercent || 0;

                    return (
                      <tr key={holding.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {holding.companySymbol}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatNumber(holding.totalQuantity)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatCurrency(currentPrice)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {formatCurrency(value)}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className={dayChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {formatCurrency(dayChange)} ({formatPercent(dayChangePercent)})
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Market News */}
        <Card>
          <CardHeader>
            <CardTitle>Market News</CardTitle>
            <CardDescription>Latest market updates and analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {news.map((item) => (
                <div key={item.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">
                        {item.title}
                      </h4>
                      <p className="text-xs text-gray-600 mb-2">
                        {item.summary}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs text-gray-500">{item.source}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${getSentimentColor(item.sentiment)}`}>
                            {item.sentiment}
                          </span>
                          {item.symbols.length > 0 && (
                            <span className="text-xs text-gray-500">
                              {item.symbols.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
