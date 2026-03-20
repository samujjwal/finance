import { PrismaService } from "../prisma/prisma.service";
export declare class PortfolioService {
    private prisma;
    constructor(prisma: PrismaService);
    getHoldings(): Promise<({
        company: {
            symbol: string;
            companyName: string;
            sector: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companySymbol: string;
        totalQuantity: number;
        weightedAverageCost: number | null;
        totalCost: number | null;
        lastUpdated: Date;
    })[]>;
    getSummary(): Promise<{
        totalInvestment: number;
        currentValue: number;
        totalCompanies: number;
        totalUnits: number;
        unrealizedGainLoss: number;
        unrealizedGainLossPercent: number;
    }>;
    getStats(): Promise<{
        totalTransactions: number;
        buyTransactions: number;
        sellTransactions: number;
        topHoldings: ({
            company: {
                symbol: string;
                companyName: string;
                sector: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companySymbol: string;
            totalQuantity: number;
            weightedAverageCost: number | null;
            totalCost: number | null;
            lastUpdated: Date;
        })[];
        sectorDistribution: {
            sector: string;
            value: number;
            percentage: number;
        }[];
        averageHoldingValue: number;
    }>;
    recalculate(): Promise<{
        message: string;
    }>;
}
