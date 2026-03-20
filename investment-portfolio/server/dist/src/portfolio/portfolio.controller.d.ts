import { PortfolioService } from './portfolio.service';
export declare class PortfolioController {
    private portfolioService;
    constructor(portfolioService: PortfolioService);
    getHoldings(): Promise<{
        success: boolean;
        data: ({
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
    }>;
    getSummary(): Promise<{
        success: boolean;
        data: {
            totalInvestment: number;
            currentValue: number;
            totalCompanies: number;
            totalUnits: number;
            unrealizedGainLoss: number;
            unrealizedGainLossPercent: number;
        };
    }>;
    getStats(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    recalculate(): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
