import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}

  async getHoldings() {
    // Calculate holdings from transactions
    const transactions = await this.prisma.transaction.findMany({
      include: {
        instrument: {
          select: {
            symbol: true,
            companyName: true,
            sector: true,
          },
        },
      },
      orderBy: { transactionDate: "asc" },
    });

    // Group by company symbol and calculate holdings
    const holdingsMap = new Map<string, any>();

    transactions.forEach((transaction) => {
      const symbol = transaction.companySymbol;

      if (!holdingsMap.has(symbol)) {
        holdingsMap.set(symbol, {
          id: "", // Will be set when updating/creating
          companySymbol: symbol,
          totalQuantity: 0,
          totalCost: 0,
          weightedAverageCost: 0,
          instrument: transaction.instrument,
          lastUpdated: new Date(),
        });
      }

      const holding = holdingsMap.get(symbol);

      if (transaction.transactionType === "BUY") {
        const qty = transaction.purchaseQuantity || 0;
        // Prefer totalPurchaseCost (includes commissions) over raw purchase amount
        const cost =
          transaction.totalPurchaseCost || transaction.totalPurchaseAmount || 0;
        holding.totalQuantity += qty;
        holding.totalCost += cost;
      } else if (transaction.transactionType === "SELL") {
        const soldQty = transaction.salesQuantity || 0;
        const prevQty = holding.totalQuantity;
        holding.totalQuantity -= soldQty;

        if (prevQty > 0) {
          // Reduce cost proportionally using WAC method
          const costPerUnit = holding.totalCost / prevQty;
          holding.totalCost = Math.max(
            0,
            costPerUnit * Math.max(0, holding.totalQuantity),
          );
        }

        if (holding.totalQuantity <= 0) {
          holding.totalQuantity = 0;
          holding.totalCost = 0;
        }
      }

      // Calculate weighted average cost
      holding.weightedAverageCost =
        holding.totalQuantity > 0
          ? holding.totalCost / holding.totalQuantity
          : 0;
    });

    // Filter out holdings with zero quantity
    const holdings = Array.from(holdingsMap.values()).filter(
      (h) => h.totalQuantity > 0,
    );

    // Collect all symbols that should exist
    const activeSymbols = new Set(holdings.map((h) => h.companySymbol));

    // Update or create portfolio holdings in database
    for (const holding of holdings) {
      await this.prisma.portfolioHolding.upsert({
        where: { companySymbol: holding.companySymbol },
        update: {
          totalQuantity: holding.totalQuantity,
          totalCost: holding.totalCost,
          weightedAverageCost: holding.weightedAverageCost,
          lastUpdated: new Date(),
        },
        create: {
          companySymbol: holding.companySymbol,
          totalQuantity: holding.totalQuantity,
          totalCost: holding.totalCost,
          weightedAverageCost: holding.weightedAverageCost,
        },
      });
    }

    // Clean up stale holdings (zero or negative quantity)
    await this.prisma.portfolioHolding.deleteMany({
      where: {
        companySymbol: { notIn: Array.from(activeSymbols) },
      },
    });

    // Get the final holdings from database
    return this.prisma.portfolioHolding.findMany({
      include: {
        instrument: {
          select: {
            symbol: true,
            companyName: true,
            sector: true,
          },
        },
      },
      orderBy: { totalCost: "desc" },
    });
  }

  async getSummary() {
    const holdings = await this.getHoldings();

    const totalInvestment = holdings.reduce(
      (sum, holding) => sum + (holding.totalCost || 0),
      0,
    );
    const totalCompanies = holdings.length;
    const totalUnits = holdings.reduce(
      (sum, holding) => sum + (holding.totalQuantity || 0),
      0,
    );

    // Calculate current value (would need current prices - using cost for now)
    const currentValue = totalInvestment; // In real app, fetch current market prices

    return {
      totalInvestment,
      currentValue,
      totalCompanies,
      totalUnits,
      unrealizedGainLoss: currentValue - totalInvestment,
      unrealizedGainLossPercent:
        totalInvestment > 0
          ? ((currentValue - totalInvestment) / totalInvestment) * 100
          : 0,
    };
  }

  async getStats() {
    const holdings = await this.getHoldings();
    const transactions = await this.prisma.transaction.findMany();

    // Calculate various statistics
    const totalTransactions = transactions.length;
    const buyTransactions = transactions.filter(
      (t) => t.transactionType === "BUY",
    ).length;
    const sellTransactions = transactions.filter(
      (t) => t.transactionType === "SELL",
    ).length;

    // Top holdings by value
    const topHoldings = holdings
      .sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0))
      .slice(0, 10);

    // Sector distribution
    const sectorMap = new Map<string, number>();
    holdings.forEach((holding) => {
      const sector = holding.instrument?.sector || "Unknown";
      sectorMap.set(
        sector,
        (sectorMap.get(sector) || 0) + (holding.totalCost || 0),
      );
    });

    const sectorDistribution = Array.from(sectorMap.entries()).map(
      ([sector, value]) => ({
        sector,
        value,
        percentage:
          holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0) > 0
            ? (value /
                holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0)) *
              100
            : 0,
      }),
    );

    return {
      totalTransactions,
      buyTransactions,
      sellTransactions,
      topHoldings,
      sectorDistribution,
      averageHoldingValue:
        holdings.length > 0
          ? holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0) /
            holdings.length
          : 0,
    };
  }

  async recalculate() {
    // Force recalculation of all holdings
    await this.getHoldings();

    // Clear and recalculate monthly summaries
    await this.prisma.monthlySummary.deleteMany({});

    // Generate monthly summaries from transactions
    const transactions = await this.prisma.transaction.findMany({
      include: { instrument: true },
      orderBy: { transactionDate: "asc" },
    });

    // Group transactions by month and company
    const monthlyData = new Map<string, any>();

    transactions.forEach((transaction) => {
      const date = new Date(transaction.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const symbol = transaction.companySymbol;
      const key = `${monthKey}-${symbol}`;

      if (!monthlyData.has(key)) {
        monthlyData.set(key, {
          monthName: date.toLocaleString("default", {
            month: "long",
            year: "numeric",
          }),
          companySymbol: symbol,
          sector: transaction.instrument?.sector,
          purchaseQuantity: 0,
          totalPurchaseAmount: 0,
          salesQuantity: 0,
          salesAmount: 0,
        });
      }

      const data = monthlyData.get(key);

      if (transaction.transactionType === "BUY") {
        data.purchaseQuantity += transaction.purchaseQuantity || 0;
        data.totalPurchaseAmount += transaction.totalPurchaseAmount || 0;
      } else if (transaction.transactionType === "SELL") {
        data.salesQuantity += transaction.salesQuantity || 0;
        data.salesAmount += transaction.totalSalesAmount || 0;
      }
    });

    // Create monthly summary records
    for (const data of monthlyData.values()) {
      await this.prisma.monthlySummary.create({
        data: {
          monthName: data.monthName,
          companySymbol: data.companySymbol,
          sector: data.sector,
          purchaseQuantity: data.purchaseQuantity,
          totalPurchaseAmount: data.totalPurchaseAmount,
          salesQuantity: data.salesQuantity,
          salesAmount: data.salesAmount,
        },
      });
    }

    return { message: "Portfolio recalculated successfully" };
  }
}
