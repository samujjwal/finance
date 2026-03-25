import {
  IsString,
  IsOptional,
  IsNumber,
  IsEnum,
  IsNotEmpty,
  Min,
} from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export enum TransactionType {
  BUY = "BUY",
  SELL = "SELL",
}

export class CreateTransactionDto {
  @ApiProperty({ description: "Company symbol" })
  @IsString()
  @IsNotEmpty()
  companySymbol: string;

  @ApiProperty({ description: "Transaction date (YYYY-MM-DD)" })
  @IsString()
  @IsNotEmpty()
  transactionDate: string;

  @ApiProperty({ description: "Transaction type", enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty({ description: "Bill number", required: false })
  @IsOptional()
  @IsString()
  billNo?: string;

  @ApiProperty({ description: "Purchase quantity", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseQuantity?: number;

  @ApiProperty({ description: "Purchase price per unit", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePricePerUnit?: number;

  @ApiProperty({ description: "Total purchase amount", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPurchaseAmount?: number;

  @ApiProperty({ description: "Sales quantity", default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesQuantity?: number;

  @ApiProperty({ description: "Sales price per unit", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesPricePerUnit?: number;

  @ApiProperty({ description: "Total sales amount", required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalSalesAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  purchaseCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  purchaseDpCharges?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalPurchaseCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalPurchaseCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  salesCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  salesDpCharges?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalSalesCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  capitalGainTax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  netReceivables?: number;

  // NFRS / Tax fields from NEPSE Excel statement
  @ApiProperty({
    description: "Total cost as per NFRS (running accumulated cost)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  principalCostNfrs?: number;

  @ApiProperty({
    description: "Closing unit sum (total units held)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  unitSum?: number;

  @ApiProperty({
    description: "Weighted average cost as per NFRS",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  waccNfrs?: number;

  @ApiProperty({ description: "Profit/Loss as per NFRS", required: false })
  @IsOptional()
  @IsNumber()
  profitLossNfrs?: number;

  @ApiProperty({
    description: "Total cost as per tax (AP TAX)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  tcTax?: number;

  @ApiProperty({
    description: "Weighted average cost as per tax",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  waccTax?: number;

  @ApiProperty({ description: "Profit/Loss as per tax", required: false })
  @IsOptional()
  @IsNumber()
  profitLossTax?: number;

  @ApiProperty({
    description: "Principal amount as per tax (sales unit cost)",
    required: false,
  })
  @IsOptional()
  @IsNumber()
  principalAmountTax?: number;
}

export class UpdateTransactionDto {
  @ApiProperty({ description: "Company symbol", required: false })
  @IsOptional()
  @IsString()
  companySymbol?: string;

  @ApiProperty({ description: "Transaction date", required: false })
  @IsOptional()
  @IsString()
  transactionDate?: string;

  @ApiProperty({
    description: "Transaction type",
    enum: TransactionType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  billNo?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchaseQuantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  purchasePricePerUnit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalPurchaseAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesQuantity?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  salesPricePerUnit?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalSalesAmount?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  purchaseCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  purchaseDpCharges?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalPurchaseCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalPurchaseCost?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  salesCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  salesDpCharges?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalSalesCommission?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  capitalGainTax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  netReceivables?: number;

  // NFRS / Tax fields
  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  principalCostNfrs?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  unitSum?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  waccNfrs?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  profitLossNfrs?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  tcTax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  waccTax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  profitLossTax?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  principalAmountTax?: number;
}

export class TransactionFilterDto {
  @ApiProperty({ description: "Filter by company symbol", required: false })
  @IsOptional()
  @IsString()
  companySymbol?: string;

  @ApiProperty({
    description: "Filter by transaction type",
    enum: TransactionType,
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiProperty({ description: "Start date", required: false })
  @IsOptional()
  @IsString()
  dateFrom?: string;

  @ApiProperty({ description: "End date", required: false })
  @IsOptional()
  @IsString()
  dateTo?: string;

  @ApiProperty({ description: "Filter by approval status", required: false })
  @IsOptional()
  @IsString()
  approvalStatus?: string;
}

export class ApproveTransactionDto {
  @ApiProperty({
    description: "Rejection reason (if rejecting)",
    required: false,
  })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class SubmitForApprovalDto {
  @ApiProperty({ description: "Notes for approver", required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}
