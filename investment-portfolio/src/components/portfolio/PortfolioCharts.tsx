import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface PortfolioChartsProps {
  stats: any;
  holdings: any[];
}

export function PortfolioCharts({ stats, holdings }: PortfolioChartsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  // Calculate max value for scaling
  const maxSectorValue = Math.max(...stats.sectorDistribution.map((s: any) => s.value));
  const maxHoldingValue = Math.max(...holdings.map((h: any) => h.totalCost || 0));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Sector Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Sector Distribution</CardTitle>
          <CardDescription>Portfolio allocation by industry sector</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.sectorDistribution.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No sector data available
            </div>
          ) : (
            <div className="space-y-4">
              {stats.sectorDistribution.map((sector: any, index: number) => {
                const percentage = (sector.value / maxSectorValue) * 100;
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-red-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-indigo-500',
                  'bg-gray-500',
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={sector.sector} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-900">
                        {sector.sector}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(sector.value)}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({formatPercentage(sector.percentage)})
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className={`${color} h-6 rounded-full flex items-center justify-center text-white text-xs font-medium`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 10 && formatPercentage(sector.percentage)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Holdings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top Holdings</CardTitle>
          <CardDescription>Your largest investments by value</CardDescription>
        </CardHeader>
        <CardContent>
          {holdings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No holdings data available
            </div>
          ) : (
            <div className="space-y-4">
              {holdings.slice(0, 10).map((holding, index) => {
                const percentage = ((holding.totalCost || 0) / maxHoldingValue) * 100;
                const colors = [
                  'bg-blue-500',
                  'bg-green-500',
                  'bg-yellow-500',
                  'bg-red-500',
                  'bg-purple-500',
                  'bg-pink-500',
                  'bg-indigo-500',
                  'bg-gray-500',
                  'bg-orange-500',
                  'bg-teal-500',
                ];
                const color = colors[index % colors.length];

                return (
                  <div key={holding.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-sm font-medium text-gray-900">
                          {holding.companySymbol}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          ({holding.company?.companyName})
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-900">
                          {formatCurrency(holding.totalCost || 0)}
                        </span>
                        <span className="text-sm text-gray-500 ml-2">
                          {holding.totalQuantity} units
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-6">
                      <div
                        className={`${color} h-6 rounded-full flex items-center justify-center text-white text-xs font-medium`}
                        style={{ width: `${percentage}%` }}
                      >
                        {percentage > 10 && formatCurrency(holding.totalCost || 0)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Volume */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction Activity</CardTitle>
          <CardDescription>Buy vs Sell transaction breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Buy Transactions</span>
              <span className="text-sm font-medium text-green-600">
                {stats.buyTransactions} ({((stats.buyTransactions / stats.totalTransactions) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-green-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(stats.buyTransactions / stats.totalTransactions) * 100}%` }}
              >
                {stats.buyTransactions}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-900">Sell Transactions</span>
              <span className="text-sm font-medium text-red-600">
                {stats.sellTransactions} ({((stats.sellTransactions / stats.totalTransactions) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-red-500 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ width: `${(stats.sellTransactions / stats.totalTransactions) * 100}%` }}
              >
                {stats.sellTransactions}
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-900">Total Transactions</span>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalTransactions}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Portfolio Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Portfolio Metrics</CardTitle>
          <CardDescription>Key performance indicators</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {holdings.length}
                </div>
                <div className="text-sm text-gray-600">Companies</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(stats.averageHoldingValue)}
                </div>
                <div className="text-sm text-gray-600">Avg Holding</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {stats.totalTransactions}
                </div>
                <div className="text-sm text-gray-600">Total Trades</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats.sectorDistribution.length}
                </div>
                <div className="text-sm text-gray-600">Sectors</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                <div className="flex justify-between mb-2">
                  <span>Diversification Score:</span>
                  <span className="font-medium">
                    {Math.min(100, (holdings.length * 10) + (stats.sectorDistribution.length * 5)).toFixed(0)}/100
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (holdings.length * 10) + (stats.sectorDistribution.length * 5))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
