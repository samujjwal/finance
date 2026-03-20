import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getMonthly() {
    // Compute live from transactions so reports are always fresh after any transaction change.
    const transactions = await this.prisma.transaction.findMany({
      include: {
        company: { select: { symbol: true, companyName: true, sector: true } },
      },
      orderBy: { transactionDate: "asc" },
    });

    // Monthly per-company aggregation with running WAC and closing-units
    const monthlyMap = new Map<string, any>();
    const companyState = new Map<string, { qty: number; totalCost: number }>();

    for (const t of transactions) {
      const date = new Date(t.transactionDate);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const mapKey = `${monthKey}-${t.companySymbol}`;
      const monthLabel = date.toLocaleString("default", {
        month: "long",
        year: "numeric",
      });

      if (!monthlyMap.has(mapKey)) {
        monthlyMap.set(mapKey, {
          monthName: monthLabel,
          monthKey,
          companySymbol: t.companySymbol,
          sector: t.company?.sector,
          company: t.company,
          purchaseQuantity: 0,
          totalPurchaseAmount: 0,
          salesQuantity: 0,
          salesAmount: 0,
          purchaseCommission: 0,
          purchaseDpCharges: 0,
          totalPurchaseCommission: 0,
          investmentCostWithCommission: 0,
          salesCommission: 0,
          salesDpCharges: 0,
          totalSalesCommission: 0,
          capitalGainTax: 0,
          netReceivables: 0,
          closingUnits: 0,
          waccNfrs: 0,
          profitLossNfrs: 0,
        });
      }

      const entry = monthlyMap.get(mapKey)!;

      if (!companyState.has(t.companySymbol)) {
        companyState.set(t.companySymbol, { qty: 0, totalCost: 0 });
      }
      const state = companyState.get(t.companySymbol)!;

      if (t.transactionType === "BUY") {
        const qty = t.purchaseQuantity || 0;
        const cost = t.totalInvestmentCost || t.totalPurchaseAmount || 0;
        entry.purchaseQuantity += qty;
        entry.totalPurchaseAmount += t.totalPurchaseAmount || 0;
        entry.purchaseCommission += t.purchaseCommission || 0;
        entry.purchaseDpCharges += t.purchaseDpCharges || 0;
        entry.totalPurchaseCommission += t.totalPurchaseCommission || 0;
        entry.investmentCostWithCommission += cost;
        state.qty += qty;
        state.totalCost += cost;
      } else if (t.transactionType === "SELL") {
        const qty = t.salesQuantity || 0;
        const prevCostPerUnit = state.qty > 0 ? state.totalCost / state.qty : 0;
        const costOfSold = prevCostPerUnit * qty;
        const saleProceeds =
          (t.totalSalesAmount || 0) -
          (t.totalSalesCommission || 0) -
          (t.capitalGainTax || 0);
        entry.salesQuantity += qty;
        entry.salesAmount += t.totalSalesAmount || 0;
        entry.salesCommission += t.salesCommission || 0;
        entry.salesDpCharges += t.salesDpCharges || 0;
        entry.totalSalesCommission += t.totalSalesCommission || 0;
        entry.capitalGainTax += t.capitalGainTax || 0;
        entry.netReceivables += t.netReceivables || saleProceeds;
        entry.profitLossNfrs += saleProceeds - costOfSold;
        state.qty = Math.max(0, state.qty - qty);
        state.totalCost = Math.max(0, state.totalCost - costOfSold);
      }

      // Update running totals for this (month, company) entry
      entry.closingUnits = state.qty;
      entry.waccNfrs = state.qty > 0 ? state.totalCost / state.qty : 0;
    }

    return Array.from(monthlyMap.values()).sort((a: any, b: any) =>
      a.monthKey.localeCompare(b.monthKey),
    );
  }

  async getPerformance() {
    // Aggregate monthly buy/sell totals
    const transactions = await this.prisma.transaction.findMany({
      orderBy: { transactionDate: "asc" },
    });

    const monthMap = new Map<
      string,
      { month: string; purchases: number; sales: number; net: number }
    >();

    for (const t of transactions) {
      const d = new Date(t.transactionDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });

      if (!monthMap.has(key)) {
        monthMap.set(key, { month: label, purchases: 0, sales: 0, net: 0 });
      }
      const entry = monthMap.get(key)!;
      if (t.transactionType === "BUY") {
        entry.purchases += t.totalPurchaseAmount || 0;
      } else {
        entry.sales += t.totalSalesAmount || 0;
      }
      entry.net = entry.purchases - entry.sales;
    }

    return Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);
  }

  async generatePortfolioReport(filters: {
    dateFrom?: string;
    dateTo?: string;
  }) {
    const where: any = {};
    if (filters?.dateFrom || filters?.dateTo) {
      where.transactionDate = {};
      if (filters.dateFrom) where.transactionDate.gte = filters.dateFrom;
      if (filters.dateTo) where.transactionDate.lte = filters.dateTo;
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      include: {
        company: { select: { symbol: true, companyName: true, sector: true } },
      },
      orderBy: { transactionDate: "asc" },
    });

    const holdings = await this.prisma.portfolioHolding.findMany({
      include: {
        company: { select: { symbol: true, companyName: true, sector: true } },
      },
    });

    const totalPurchases = transactions
      .filter((t) => t.transactionType === "BUY")
      .reduce((sum, t) => sum + (t.totalPurchaseAmount || 0), 0);

    const totalSales = transactions
      .filter((t) => t.transactionType === "SELL")
      .reduce((sum, t) => sum + (t.totalSalesAmount || 0), 0);

    const totalInvestment = holdings.reduce(
      (sum, h) => sum + (h.totalCost || 0),
      0,
    );
    const totalCompanies = holdings.filter((h) => h.totalQuantity > 0).length;

    return {
      summary: {
        totalPurchases,
        totalSales,
        totalInvestment,
        totalCompanies,
        transactionCount: transactions.length,
      },
      holdings,
      transactions,
    };
  }

  async generateSectorAnalysis(filters: {
    dateFrom?: string;
    dateTo?: string;
  }) {
    const holdings = await this.prisma.portfolioHolding.findMany({
      where: { totalQuantity: { gt: 0 } },
      include: {
        company: { select: { symbol: true, companyName: true, sector: true } },
      },
    });

    const totalCost = holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0);

    const sectorMap = new Map<
      string,
      { sector: string; value: number; companies: number; percentage: number }
    >();

    for (const h of holdings) {
      const sector = h.company?.sector || "Unknown";
      if (!sectorMap.has(sector)) {
        sectorMap.set(sector, {
          sector,
          value: 0,
          companies: 0,
          percentage: 0,
        });
      }
      const entry = sectorMap.get(sector)!;
      entry.value += h.totalCost || 0;
      entry.companies += 1;
    }

    for (const entry of sectorMap.values()) {
      entry.percentage = totalCost > 0 ? (entry.value / totalCost) * 100 : 0;
    }

    return Array.from(sectorMap.values()).sort((a, b) => b.value - a.value);
  }

  async exportData(options: { format?: string; type?: string }) {
    const type = options?.type || "transactions";

    if (type === "holdings") {
      return this.prisma.portfolioHolding.findMany({
        include: {
          company: {
            select: { symbol: true, companyName: true, sector: true },
          },
        },
        orderBy: { totalCost: "desc" },
      });
    }

    return this.prisma.transaction.findMany({
      include: {
        company: { select: { symbol: true, companyName: true, sector: true } },
      },
      orderBy: { transactionDate: "desc" },
    });
  }
}
