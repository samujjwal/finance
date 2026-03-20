"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PortfolioService = class PortfolioService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getHoldings() {
        const transactions = await this.prisma.transaction.findMany({
            include: {
                company: {
                    select: {
                        symbol: true,
                        companyName: true,
                        sector: true,
                    },
                },
            },
            orderBy: { transactionDate: "asc" },
        });
        const holdingsMap = new Map();
        transactions.forEach((transaction) => {
            const symbol = transaction.companySymbol;
            if (!holdingsMap.has(symbol)) {
                holdingsMap.set(symbol, {
                    id: "",
                    companySymbol: symbol,
                    totalQuantity: 0,
                    totalCost: 0,
                    weightedAverageCost: 0,
                    company: transaction.company,
                    lastUpdated: new Date(),
                });
            }
            const holding = holdingsMap.get(symbol);
            if (transaction.transactionType === "BUY") {
                const qty = transaction.purchaseQuantity || 0;
                const cost = transaction.totalInvestmentCost ||
                    transaction.totalPurchaseAmount ||
                    0;
                holding.totalQuantity += qty;
                holding.totalCost += cost;
            }
            else if (transaction.transactionType === "SELL") {
                const soldQty = transaction.salesQuantity || 0;
                const prevQty = holding.totalQuantity;
                holding.totalQuantity -= soldQty;
                if (prevQty > 0) {
                    const costPerUnit = holding.totalCost / prevQty;
                    holding.totalCost = Math.max(0, costPerUnit * Math.max(0, holding.totalQuantity));
                }
                if (holding.totalQuantity <= 0) {
                    holding.totalQuantity = 0;
                    holding.totalCost = 0;
                }
            }
            holding.weightedAverageCost =
                holding.totalQuantity > 0
                    ? holding.totalCost / holding.totalQuantity
                    : 0;
        });
        const holdings = Array.from(holdingsMap.values()).filter((h) => h.totalQuantity > 0);
        const activeSymbols = new Set(holdings.map((h) => h.companySymbol));
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
        await this.prisma.portfolioHolding.deleteMany({
            where: {
                companySymbol: { notIn: Array.from(activeSymbols) },
            },
        });
        return this.prisma.portfolioHolding.findMany({
            include: {
                company: {
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
        const totalInvestment = holdings.reduce((sum, holding) => sum + (holding.totalCost || 0), 0);
        const totalCompanies = holdings.length;
        const totalUnits = holdings.reduce((sum, holding) => sum + (holding.totalQuantity || 0), 0);
        const currentValue = totalInvestment;
        return {
            totalInvestment,
            currentValue,
            totalCompanies,
            totalUnits,
            unrealizedGainLoss: currentValue - totalInvestment,
            unrealizedGainLossPercent: totalInvestment > 0
                ? ((currentValue - totalInvestment) / totalInvestment) * 100
                : 0,
        };
    }
    async getStats() {
        const holdings = await this.getHoldings();
        const transactions = await this.prisma.transaction.findMany();
        const totalTransactions = transactions.length;
        const buyTransactions = transactions.filter((t) => t.transactionType === "BUY").length;
        const sellTransactions = transactions.filter((t) => t.transactionType === "SELL").length;
        const topHoldings = holdings
            .sort((a, b) => (b.totalCost || 0) - (a.totalCost || 0))
            .slice(0, 10);
        const sectorMap = new Map();
        holdings.forEach((holding) => {
            const sector = holding.company?.sector || "Unknown";
            sectorMap.set(sector, (sectorMap.get(sector) || 0) + (holding.totalCost || 0));
        });
        const sectorDistribution = Array.from(sectorMap.entries()).map(([sector, value]) => ({
            sector,
            value,
            percentage: holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0) > 0
                ? (value /
                    holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0)) *
                    100
                : 0,
        }));
        return {
            totalTransactions,
            buyTransactions,
            sellTransactions,
            topHoldings,
            sectorDistribution,
            averageHoldingValue: holdings.length > 0
                ? holdings.reduce((sum, h) => sum + (h.totalCost || 0), 0) /
                    holdings.length
                : 0,
        };
    }
    async recalculate() {
        await this.getHoldings();
        await this.prisma.monthlySummary.deleteMany({});
        const transactions = await this.prisma.transaction.findMany({
            include: { company: true },
            orderBy: { transactionDate: "asc" },
        });
        const monthlyData = new Map();
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
                    sector: transaction.company?.sector,
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
            }
            else if (transaction.transactionType === "SELL") {
                data.salesQuantity += transaction.salesQuantity || 0;
                data.salesAmount += transaction.totalSalesAmount || 0;
            }
        });
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
};
exports.PortfolioService = PortfolioService;
exports.PortfolioService = PortfolioService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PortfolioService);
//# sourceMappingURL=portfolio.service.js.map