import { TransactionsService } from "./transactions.service";
import { FeeRatesService } from "../fee-rates/fee-rates.service";
import { CreateTransactionDto, UpdateTransactionDto, TransactionFilterDto } from "./dto/transaction.dto";
export declare class TransactionsController {
    private transactionsService;
    private feeRatesService;
    constructor(transactionsService: TransactionsService, feeRatesService: FeeRatesService);
    getTaxRates(): Promise<{
        success: boolean;
        data: {
            equityBrokerage: {
                description: string;
                rate: number;
                minFixed: number;
            }[];
            SEBON_RATE: number;
            DP_CHARGE_FIXED: number;
            CGT: {
                INDIVIDUAL_SHORT_TERM: number;
                INDIVIDUAL_LONG_TERM: number;
                INSTITUTIONAL: number;
            };
        };
    }>;
    calculateCharges(body: {
        transactionType: "BUY" | "SELL";
        amount: number;
        instrumentType?: string;
    }): Promise<{
        success: boolean;
        data: {
            brokerage: number;
            dpCharges: number;
            sebonFee: number;
            totalCharges: number;
            netAmount: number;
        };
    }>;
    calculateCapitalGains(body: {
        sellAmount: number;
        costBasis: number;
        purchaseDate: string;
        sellDate: string;
        investorType?: "Individual" | "Institutional";
    }): Promise<{
        success: boolean;
        data: {
            capitalGains: number;
            capitalLoss: number;
            holdingPeriodDays: number;
            isLongTerm: boolean;
            applicableTaxRate: number;
            taxAmount: number;
        };
    }>;
    findAll(filters: TransactionFilterDto): Promise<{
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
            billNo: string | null;
            transactionDate: string;
            transactionType: string;
            purchaseQuantity: number;
            purchasePricePerUnit: number | null;
            totalPurchaseAmount: number | null;
            salesQuantity: number;
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
        })[];
    }>;
    create(createDto: CreateTransactionDto): Promise<{
        success: boolean;
        data: {
            company: {
                symbol: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                serialNumber: number | null;
                companyName: string;
                symbol2: string | null;
                sector: string | null;
                symbol3: string | null;
                instrumentType: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companySymbol: string;
            billNo: string | null;
            transactionDate: string;
            transactionType: string;
            purchaseQuantity: number;
            purchasePricePerUnit: number | null;
            totalPurchaseAmount: number | null;
            salesQuantity: number;
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
        };
    }>;
    createBulk(createDtos: CreateTransactionDto[]): Promise<{
        success: boolean;
        data: any[];
    }>;
    findOne(id: string): Promise<{
        success: boolean;
        data: {
            company: {
                symbol: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                serialNumber: number | null;
                companyName: string;
                symbol2: string | null;
                sector: string | null;
                symbol3: string | null;
                instrumentType: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companySymbol: string;
            billNo: string | null;
            transactionDate: string;
            transactionType: string;
            purchaseQuantity: number;
            purchasePricePerUnit: number | null;
            totalPurchaseAmount: number | null;
            salesQuantity: number;
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
        };
    }>;
    update(id: string, updateDto: UpdateTransactionDto): Promise<{
        success: boolean;
        data: {
            company: {
                symbol: string;
                id: string;
                createdAt: Date;
                updatedAt: Date;
                serialNumber: number | null;
                companyName: string;
                symbol2: string | null;
                sector: string | null;
                symbol3: string | null;
                instrumentType: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            companySymbol: string;
            billNo: string | null;
            transactionDate: string;
            transactionType: string;
            purchaseQuantity: number;
            purchasePricePerUnit: number | null;
            totalPurchaseAmount: number | null;
            salesQuantity: number;
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
        };
    }>;
    remove(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
