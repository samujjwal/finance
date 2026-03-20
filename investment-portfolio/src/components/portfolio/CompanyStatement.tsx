import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { marketDataService } from '@/services/marketDataService';
import { calculateWACC, calculateCapitalGainsTax, calculateAverageHoldingPeriod } from '@/utils/taxCalculations';
import { calculatePortfolioXIRR } from '@/utils/portfolioAnalytics';
import type { Transaction, CompanyStatement, MarketData } from '@/types/api';

interface CompanyStatementProps {
  companySymbol: string;
  onClose?: () => void;
}

export function CompanyStatement({ companySymbol, onClose }: CompanyStatementProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [marketData, setMarketData] = useState<MarketData | null>(null);
  const [statement, setStatement] = useState<CompanyStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [fiscalYear, setFiscalYear] = useState('2082-83');

  useEffect(() => {
    loadCompanyData();
  }, [companySymbol, fiscalYear]);

  useEffect(() => {
    // Subscribe to market data updates
    if (companySymbol) {
      marketDataService.subscribe(companySymbol, (data) => {
        setMarketData(data);
      });

      return () => {
        marketDataService.unsubscribe(companySymbol);
      };
    }
  }, [companySymbol]);

  const loadCompanyData = useCallback(async () => {
    try {
      setLoading(true);

      // Load company transactions
      const transactionsResponse = await apiService.getTransactions({ companySymbol });
      if (transactionsResponse.success && transactionsResponse.data) {
        const txns = transactionsResponse.data as Transaction[];
        setTransactions(txns);

        // Load market data
        const marketInfo = await marketDataService.getMarketData(companySymbol);
        setMarketData(marketInfo);

        // Generate company statement
        const statementData = generateCompanyStatement(txns, marketInfo);
        setStatement(statementData);
      }
    } catch (error) {
      console.error('Failed to load company data:', error);
    } finally {
      setLoading(false);
    }
  }, [companySymbol, fiscalYear]);

  const generateCompanyStatement = (
    txns: Transaction[],
    marketInfo: MarketData | null
  ): CompanyStatement => {
    const buys = txns.filter(t => t.transactionType === 'BUY');
    const sells = txns.filter(t => t.transactionType === 'SELL');

    // Calculate total investment
    const totalInvestment = buys.reduce((sum, t) =>
      sum + (t.totalInvestmentCost || t.totalPurchaseAmount || 0) + (t.totalPurchaseCommission || 0), 0
    );

    // Calculate total sales proceeds
    const totalSales = sells.reduce((sum, t) =>
      sum + (t.totalSalesAmount || 0) - (t.totalSalesCommission || 0) - (t.capitalGainTax || 0), 0
    );

    // Calculate current holdings
    const totalBuys = buys.reduce((sum, t) => sum + (t.purchaseQuantity || 0), 0);
    const totalSells = sells.reduce((sum, t) => sum + (t.salesQuantity || 0), 0);
    const currentHoldings = totalBuys - totalSells;

    // Calculate realized P&L
    const realizedPnL = sells.reduce((sum, t) => {
      const cost = t.totalInvestmentCost || 0;
      const proceeds = (t.totalSalesAmount || 0) - (t.totalSalesCommission || 0) - (t.capitalGainTax || 0);
      return sum + (proceeds - cost);
    }, 0);

    // Calculate current value and unrealized P&L
    const currentPrice = marketInfo?.currentPrice || 0;
    const currentValue = currentHoldings * currentPrice;
    const waccResult = calculateWACC(txns);
    const unrealizedPnL = currentValue - (currentHoldings * waccResult.averageCost);

    // Calculate XIRR
    const xirr = calculatePortfolioXIRR(txns, currentValue + totalSales) || 0;

    // Calculate average holding period
    const avgHoldingPeriod = calculateAverageHoldingPeriod(txns);

    return {
      companySymbol,
      companyName: txns[0]?.company?.companyName || companySymbol,
      sector: txns[0]?.company?.sector || 'Unknown',
      transactions: txns,
      currentHoldings,
      totalInvestment,
      currentValue,
      realizedPnL,
      unrealizedPnL,
      totalPnL: realizedPnL + unrealizedPnL,
      averageHoldingPeriod: avgHoldingPeriod,
      xirr,
      lastUpdated: new Date().toISOString(),
    };
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
    return `${value.toFixed(2)}%`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading company statement...</div>
      </div>
    );
  }

  if (!statement) {
    return (
      <div className="text-center py-8 text-gray-500">
        No data available for {companySymbol}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {statement.companyName} ({statement.companySymbol})
          </h2>
          <p className="text-gray-600">
            {statement.sector} • Portfolio Statement FY {fiscalYear}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={loadCompanyData}>
            Refresh
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Market Data Card */}
      {marketData && (
        <Card>
          <CardHeader>
            <CardTitle>Market Information</CardTitle>
            <CardDescription>Live market data and price movements</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Current Price</div>
                <div className="text-lg font-bold">{formatCurrency(marketData.currentPrice)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Day Change</div>
                <div className={`text-lg font-bold ${marketData.dayChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(marketData.dayChange)} ({formatPercent(marketData.dayChangePercent)})
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Volume</div>
                <div className="text-lg font-bold">{formatNumber(marketData.volume)}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Market Cap</div>
                <div className="text-lg font-bold">{formatCurrency(marketData.marketCap)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Portfolio Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Holdings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatNumber(statement.currentHoldings)}
            </div>
            <div className="text-sm text-gray-600">units</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(statement.totalInvestment)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Current Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(statement.currentValue)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total P&L</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statement.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(statement.totalPnL)}
            </div>
            <div className="text-sm text-gray-600">
              Realized: {formatCurrency(statement.realizedPnL)} •
              Unrealized: {formatCurrency(statement.unrealizedPnL)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">XIRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatPercent(statement.xirr * 100)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Holding Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {Math.round(statement.averageHoldingPeriod)} days
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Return on Investment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${statement.totalPnL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {statement.totalInvestment > 0 ? formatPercent((statement.totalPnL / statement.totalInvestment) * 100) : '0.00%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>Complete transaction history for this company</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bill No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price/Unit</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commission</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tax</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {statement.transactions
                  .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
                  .map((transaction) => {
                    const isBuy = transaction.transactionType === 'BUY';
                    const quantity = isBuy ? transaction.purchaseQuantity : transaction.salesQuantity;
                    const pricePerUnit = isBuy ? transaction.purchasePricePerUnit : transaction.salesPricePerUnit;
                    const totalAmount = isBuy ? transaction.totalPurchaseAmount : transaction.totalSalesAmount;
                    const commission = isBuy ? transaction.totalPurchaseCommission : transaction.totalSalesCommission;
                    const tax = transaction.capitalGainTax || 0;
                    const netAmount = isBuy
                      ? (totalAmount || 0) + (commission || 0)
                      : (totalAmount || 0) - (commission || 0) - tax;

                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatDate(transaction.transactionDate)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${isBuy ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                            {transaction.transactionType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {transaction.billNo || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatNumber(quantity || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(pricePerUnit || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(totalAmount || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(commission || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {formatCurrency(tax)}
                        </td>
                        <td className={`px-6 py-4 text-sm font-medium ${isBuy ? 'text-red-600' : 'text-green-600'}`}>
                          {formatCurrency(netAmount)}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tax Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Tax Summary</CardTitle>
          <CardDescription>Capital gains tax calculations for fiscal year {fiscalYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-4">Capital Gains Breakdown</h4>
              <div className="space-y-3">
                {statement.transactions
                  .filter(t => t.transactionType === 'SELL')
                  .map(transaction => {
                    const taxCalc = calculateCapitalGainsTax(transaction, marketData?.currentPrice);
                    return (
                      <div key={transaction.id} className="border-b border-gray-200 pb-3">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Date: {formatDate(transaction.transactionDate)}</span>
                          <span className="text-gray-600">Holding: {taxCalc.holdingPeriodDays} days</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Capital Gains:</span>
                          <span className="font-medium">{formatCurrency(taxCalc.capitalGains)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax Rate:</span>
                          <span className="font-medium">{formatPercent(taxCalc.applicableTaxRate * 100)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Tax Amount:</span>
                          <span className="font-medium">{formatCurrency(taxCalc.taxAmount)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Summary</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Capital Gains:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      statement.transactions
                        .filter(t => t.transactionType === 'SELL')
                        .reduce((sum, t) => {
                          const taxCalc = calculateCapitalGainsTax(t, marketData?.currentPrice);
                          return sum + taxCalc.capitalGains;
                        }, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Tax Paid:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      statement.transactions
                        .filter(t => t.transactionType === 'SELL')
                        .reduce((sum, t) => sum + (t.capitalGainTax || 0), 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Net Receivables:</span>
                  <span className="font-medium">
                    {formatCurrency(
                      statement.transactions
                        .filter(t => t.transactionType === 'SELL')
                        .reduce((sum, t) => {
                          const net = (t.totalSalesAmount || 0) - (t.totalSalesCommission || 0) - (t.capitalGainTax || 0);
                          return sum + net;
                        }, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
