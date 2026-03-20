export declare enum TransactionType {
    BUY = "BUY",
    SELL = "SELL"
}
export declare class CreateTransactionDto {
    companySymbol: string;
    transactionDate: string;
    transactionType: TransactionType;
    billNo?: string;
    purchaseQuantity?: number;
    purchasePricePerUnit?: number;
    totalPurchaseAmount?: number;
    salesQuantity?: number;
    salesPricePerUnit?: number;
    totalSalesAmount?: number;
    purchaseCommission?: number;
    purchaseDpCharges?: number;
    totalPurchaseCommission?: number;
    totalInvestmentCost?: number;
    salesCommission?: number;
    salesDpCharges?: number;
    totalSalesCommission?: number;
    capitalGainTax?: number;
    netReceivables?: number;
}
export declare class UpdateTransactionDto {
    companySymbol?: string;
    transactionDate?: string;
    transactionType?: TransactionType;
    billNo?: string;
    purchaseQuantity?: number;
    purchasePricePerUnit?: number;
    totalPurchaseAmount?: number;
    salesQuantity?: number;
    salesPricePerUnit?: number;
    totalSalesAmount?: number;
    purchaseCommission?: number;
    purchaseDpCharges?: number;
    totalPurchaseCommission?: number;
    totalInvestmentCost?: number;
    salesCommission?: number;
    salesDpCharges?: number;
    totalSalesCommission?: number;
    capitalGainTax?: number;
    netReceivables?: number;
}
export declare class TransactionFilterDto {
    companySymbol?: string;
    transactionType?: TransactionType;
    dateFrom?: string;
    dateTo?: string;
}
