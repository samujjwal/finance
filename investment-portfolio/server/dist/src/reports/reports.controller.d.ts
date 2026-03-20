import { ReportsService } from "./reports.service";
export declare class ReportsController {
    private reportsService;
    constructor(reportsService: ReportsService);
    getMonthly(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getPerformance(): Promise<{
        success: boolean;
        data: {
            month: string;
            purchases: number;
            sales: number;
            net: number;
        }[];
    }>;
    generatePortfolioReport(body: {
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{
        success: boolean;
        data: {
            summary: {
                totalPurchases: number;
                totalSales: number;
                totalInvestment: number;
                totalCompanies: number;
                transactionCount: number;
            };
            holdings: ({
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
            transactions: ({
                company: {
                    symbol: string;
                    companyName: string;
                    sector: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                salesQuantity: number;
                purchaseQuantity: number;
                billNo: string | null;
                transactionDate: string;
                transactionType: string;
                purchasePricePerUnit: number | null;
                totalPurchaseAmount: number | null;
                salesPricePerUnit: number | null;
                totalSalesAmount: number | null;
                principalCostNfrs: number | null;
                transactionCostNfrs: number | null;
                unitSum: number | null;
                waccNfrs: number | null;
                profitLossNfrs: number | null;
                purchaseCommission: number | null;
                purchaseDpCharges: number | null;
                totalPurchaseCommission: number | null;
                totalInvestmentCost: number | null;
                salesCommission: number | null;
                salesDpCharges: number | null;
                totalSalesCommission: number | null;
                capitalGainTax: number | null;
                netReceivables: number | null;
                principalAmountTax: number | null;
                tcTax: number | null;
                waccTax: number | null;
                profitLossTax: number | null;
                companySymbol: string;
            })[];
        };
    }>;
    generateSectorAnalysis(body: {
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{
        success: boolean;
        data: {
            sector: string;
            value: number;
            companies: number;
            percentage: number;
        }[];
    }>;
    exportData(body: {
        format?: string;
        type?: string;
    }): Promise<{
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
        })[] | ({
            company: {
                symbol: string;
                companyName: string;
                sector: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            salesQuantity: number;
            purchaseQuantity: number;
            billNo: string | null;
            transactionDate: string;
            transactionType: string;
            purchasePricePerUnit: number | null;
            totalPurchaseAmount: number | null;
            salesPricePerUnit: number | null;
            totalSalesAmount: number | null;
            principalCostNfrs: number | null;
            transactionCostNfrs: number | null;
            unitSum: number | null;
            waccNfrs: number | null;
            profitLossNfrs: number | null;
            purchaseCommission: number | null;
            purchaseDpCharges: number | null;
            totalPurchaseCommission: number | null;
            totalInvestmentCost: number | null;
            salesCommission: number | null;
            salesDpCharges: number | null;
            totalSalesCommission: number | null;
            capitalGainTax: number | null;
            netReceivables: number | null;
            principalAmountTax: number | null;
            tcTax: number | null;
            waccTax: number | null;
            profitLossTax: number | null;
            companySymbol: string;
        })[];
    }>;
}
