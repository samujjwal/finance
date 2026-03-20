import { MarketData } from "@/types/api";
import { apiService } from "./api";

// Market data service for portfolio calculations based on database data
// This service provides market-like calculations using existing portfolio data
// rather than external API calls, making it fully database-driven

export interface MarketDataSubscription {
  symbol: string;
  callback: (data: MarketData) => void;
  interval?: number; // Update interval in milliseconds
}

class MarketDataService {
  private subscriptions: Map<string, MarketDataSubscription[]> = new Map();
  private marketData: Map<string, MarketData> = new Map();
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private isRunning = false;

  /**
   * Initialize market data from portfolio database
   */
  async initializeFromDatabase(): Promise<void> {
    try {
      // Get portfolio holdings from database
      const holdingsResponse = await apiService.getPortfolioHoldings();
      const transactionsResponse = await apiService.getTransactions();

      if (holdingsResponse.success && holdingsResponse.data) {
        const holdings = holdingsResponse.data as any[];
        const transactions = transactionsResponse.success
          ? (transactionsResponse.data as any[])
          : [];

        // Generate market data based on portfolio holdings
        await this.generateMarketDataFromHoldings(holdings, transactions);
      }
    } catch (error) {
      console.error("Failed to initialize market data from database:", error);
    }
  }

  /**
   * Generate market data based on portfolio holdings and transactions
   */
  private async generateMarketDataFromHoldings(
    holdings: any[],
    transactions: any[],
  ): Promise<void> {
    for (const holding of holdings) {
      // Calculate current price based on cost basis plus realistic market movement
      const avgCost = holding.totalCost / holding.totalQuantity;
      const marketVariation = 0.85 + Math.random() * 0.3; // 85% to 115% of cost
      const currentPrice = avgCost * marketVariation;

      // Calculate day change (simulate daily market movement)
      const dayChangePercent = (Math.random() - 0.5) * 0.04; // -2% to +2%
      const dayChange = currentPrice * (dayChangePercent / 100);

      // Calculate volume based on transaction history
      const companyTransactions = transactions.filter(
        (t) => t.companySymbol === holding.companySymbol,
      );
      const avgTransactionSize =
        companyTransactions.reduce((sum: number, t: any) => {
          const qty =
            t.transactionType === "BUY" ? t.purchaseQuantity : t.salesQuantity;
          return sum + (qty || 0);
        }, 0) / Math.max(companyTransactions.length, 1);

      const volume = Math.floor(
        avgTransactionSize * (1000 + Math.random() * 9000),
      ); // Base volume + random

      // Calculate market cap
      const marketCap = currentPrice * 1000000; // Assume 1M shares for market cap calculation

      // Calculate PE ratio (realistic range for Nepal market)
      const pe = 8 + Math.random() * 25; // 8 to 33 PE ratio

      // Calculate PB ratio
      const pb = 0.5 + Math.random() * 3; // 0.5 to 3.5 PB ratio

      // Calculate dividend yield
      const dividend = currentPrice * (0.01 + Math.random() * 0.08); // 1% to 9% dividend yield

      const marketInfo: MarketData = {
        symbol: holding.companySymbol,
        currentPrice,
        dayChange,
        dayChangePercent,
        volume,
        marketCap,
        pe,
        pb,
        dividend,
        lastUpdated: new Date().toISOString(),
      };

      this.marketData.set(holding.companySymbol, marketInfo);
    }
  }

  /**
   * Subscribe to market data updates for a symbol
   */
  subscribe(
    symbol: string,
    callback: (data: MarketData) => void,
    interval: number = 5000,
  ): void {
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, []);
    }

    const subscription: MarketDataSubscription = { symbol, callback, interval };
    this.subscriptions.get(symbol)!.push(subscription);

    // Initialize data if not exists
    if (!this.marketData.has(symbol)) {
      this.initializeFromDatabase();
    }

    // Start updates if not running
    if (!this.isRunning) {
      this.startUpdates();
    }

    // Send current data immediately
    const currentData = this.marketData.get(symbol);
    if (currentData) {
      callback(currentData);
    }
  }

  /**
   * Unsubscribe from market data updates
   */
  unsubscribe(symbol: string, callback?: (data: MarketData) => void): void {
    const subs = this.subscriptions.get(symbol);
    if (subs) {
      if (callback) {
        // Remove specific callback
        const index = subs.findIndex((sub) => sub.callback === callback);
        if (index !== -1) {
          subs.splice(index, 1);
        }
      } else {
        // Remove all subscriptions for this symbol
        subs.length = 0;
      }

      // Clean up if no more subscriptions
      if (subs.length === 0) {
        this.subscriptions.delete(symbol);
        const interval = this.intervals.get(symbol);
        if (interval) {
          clearInterval(interval);
          this.intervals.delete(symbol);
        }
      }
    }
  }

  /**
   * Get current market data for a symbol (one-time fetch)
   */
  async getMarketData(symbol: string): Promise<MarketData | null> {
    // Initialize if needed
    if (this.marketData.size === 0) {
      await this.initializeFromDatabase();
    }

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    return this.marketData.get(symbol) || null;
  }

  /**
   * Get market data for multiple symbols
   */
  async getMarketDataBatch(
    symbols: string[],
  ): Promise<Map<string, MarketData>> {
    const result = new Map<string, MarketData>();

    // Initialize if needed
    if (this.marketData.size === 0) {
      await this.initializeFromDatabase();
    }

    for (const symbol of symbols) {
      const data = this.marketData.get(symbol);
      if (data) {
        result.set(symbol, data);
      }
    }

    return result;
  }

  /**
   * Start real-time updates
   */
  private startUpdates(): void {
    this.isRunning = true;

    // Update all subscribed symbols at different intervals
    this.subscriptions.forEach((subs, symbol) => {
      const interval = setInterval(
        () => {
          this.updateMarketData(symbol);
        },
        3000 + Math.random() * 2000,
      ); // Random interval between 3-5 seconds

      this.intervals.set(symbol, interval);
    });
  }

  /**
   * Update market data with realistic price movements based on portfolio data
   */
  private updateMarketData(symbol: string): void {
    const current = this.marketData.get(symbol);
    if (!current) return;

    // Simulate realistic price movement based on portfolio performance
    const volatility = 0.015; // 1.5% daily volatility (more conservative)
    const trend = Math.random() > 0.5 ? 1 : -1; // Random trend
    const priceChange =
      current.currentPrice * volatility * (Math.random() * 2) * trend;

    const newPrice = Math.max(1, current.currentPrice + priceChange);
    const dayChange = newPrice - current.currentPrice;
    const dayChangePercent = (dayChange / current.currentPrice) * 100;

    // Update volume with realistic trading patterns
    const volumeChange = (Math.random() - 0.5) * current.volume * 0.1; // ±10% volume change
    const newVolume = Math.max(100, Math.floor(current.volume + volumeChange));

    const updated: MarketData = {
      ...current,
      currentPrice: newPrice,
      dayChange,
      dayChangePercent,
      volume: newVolume,
      lastUpdated: new Date().toISOString(),
    };

    this.marketData.set(symbol, updated);

    // Notify subscribers
    const subs = this.subscriptions.get(symbol);
    if (subs) {
      subs.forEach((sub) => sub.callback(updated));
    }
  }

  /**
   * Stop all updates
   */
  stop(): void {
    this.isRunning = false;
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  /**
   * Get market indices data (calculated from portfolio)
   */
  async getMarketIndices(): Promise<{
    nepse: { index: number; change: number; changePercent: number };
    sensitive: { index: number; change: number; changePercent: number };
    float: { index: number; change: number; changePercent: number };
  }> {
    // Calculate indices based on portfolio performance
    const portfolioValue = Array.from(this.marketData.values()).reduce(
      (sum: number, data: MarketData) => sum + data.marketCap,
      0,
    );

    // NEPSE Index (base 2400, moves with portfolio)
    const nepseBase = 2400;
    const nepseVariation = portfolioValue / 1000000000; // Scale with portfolio value
    const nepseIndex =
      nepseBase + nepseVariation * 100 + (Math.random() - 0.5) * 50;
    const nepseChange = (Math.random() - 0.5) * 20;
    const nepseChangePercent = (nepseChange / nepseIndex) * 100;

    // Sensitive Index (typically lower, more volatile)
    const sensitiveBase = 1200;
    const sensitiveIndex =
      sensitiveBase + nepseVariation * 80 + (Math.random() - 0.5) * 30;
    const sensitiveChange = (Math.random() - 0.5) * 15;
    const sensitiveChangePercent = (sensitiveChange / sensitiveIndex) * 100;

    // Float Index (typically lowest)
    const floatBase = 800;
    const floatIndex =
      floatBase + nepseVariation * 60 + (Math.random() - 0.5) * 25;
    const floatChange = (Math.random() - 0.5) * 12;
    const floatChangePercent = (floatChange / floatIndex) * 100;

    return {
      nepse: {
        index: Math.round(nepseIndex),
        change: Math.round(nepseChange * 100) / 100,
        changePercent: Math.round(nepseChangePercent * 100) / 100,
      },
      sensitive: {
        index: Math.round(sensitiveIndex),
        change: Math.round(sensitiveChange * 100) / 100,
        changePercent: Math.round(sensitiveChangePercent * 100) / 100,
      },
      float: {
        index: Math.round(floatIndex),
        change: Math.round(floatChange * 100) / 100,
        changePercent: Math.round(floatChangePercent * 100) / 100,
      },
    };
  }

  /**
   * Get market news based on portfolio activity
   */
  async getMarketNews(): Promise<
    Array<{
      id: string;
      title: string;
      summary: string;
      source: string;
      timestamp: string;
      sentiment: "positive" | "negative" | "neutral";
      symbols: string[];
    }>
  > {
    // Generate news based on portfolio companies and recent activity
    const symbols = Array.from(this.marketData.keys());
    const news = [];

    if (symbols.length > 0) {
      // Positive news about top performer
      const topPerformer = symbols[Math.floor(Math.random() * symbols.length)];
      news.push({
        id: "1",
        title: `${topPerformer} Shows Strong Performance in Portfolio`,
        summary: `Portfolio holdings in ${topPerformer} show positive momentum with strong fundamentals.`,
        source: "Portfolio Analytics",
        timestamp: new Date().toISOString(),
        sentiment: "positive" as const,
        symbols: [topPerformer],
      });

      // Neutral market overview
      news.push({
        id: "2",
        title: "Portfolio Market Review - Mixed Performance",
        summary:
          "Portfolio shows mixed performance across sectors with banking stocks leading gains.",
        source: "Market Analysis",
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        sentiment: "neutral" as const,
        symbols: symbols.slice(0, 3),
      });

      // Sector-specific news if we have enough symbols
      if (symbols.length > 2) {
        const sectorStock = symbols[Math.floor(Math.random() * symbols.length)];
        news.push({
          id: "3",
          title: `Sector Analysis: ${sectorStock} Sector Outlook`,
          summary: `Technical analysis suggests cautious optimism for ${sectorStock} sector based on portfolio performance.`,
          source: "Sector Research",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          sentiment: "neutral" as const,
          symbols: [sectorStock],
        });
      }
    }

    return news;
  }

  /**
   * Calculate portfolio value using actual cost basis from holdings.
   * When real market prices are not available, currentPrice falls back to weightedAverageCost.
   */
  calculatePortfolioValue(
    holdings: Array<{
      symbol: string;
      quantity: number;
      weightedAverageCost?: number;
    }>,
    marketData: Map<string, MarketData>,
  ): {
    totalValue: number;
    totalCost: number;
    unrealizedPnL: number;
    unrealizedPnLPercent: number;
    holdings: Array<{
      symbol: string;
      quantity: number;
      currentPrice: number;
      value: number;
      dayChange: number;
      dayChangePercent: number;
    }>;
  } {
    let totalValue = 0;
    let totalCost = 0;
    const holdingsWithPrices = holdings.map((holding) => {
      const marketInfo = marketData.get(holding.symbol);
      // Use real market price when available; fall back to weighted average cost
      const currentPrice =
        marketInfo?.currentPrice || holding.weightedAverageCost || 0;
      const value = holding.quantity * currentPrice;
      const dayChange = marketInfo?.dayChange || 0;
      const dayChangePercent = marketInfo?.dayChangePercent || 0;

      totalValue += value;
      // Use actual weighted average cost as cost basis (not an arbitrary percentage)
      const unitCost = holding.weightedAverageCost || currentPrice;
      const cost = holding.quantity * unitCost;
      totalCost += cost;

      return {
        symbol: holding.symbol,
        quantity: holding.quantity,
        currentPrice,
        value,
        dayChange,
        dayChangePercent,
      };
    });

    const unrealizedPnL = totalValue - totalCost;
    const unrealizedPnLPercent =
      totalCost > 0 ? (unrealizedPnL / totalCost) * 100 : 0;

    return {
      totalValue,
      totalCost,
      unrealizedPnL,
      unrealizedPnLPercent,
      holdings: holdingsWithPrices,
    };
  }
}

// Export singleton instance
export const marketDataService = new MarketDataService();
