import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  ValidateNested,
  Min,
  IsDateString,
  IsIn,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

// ---- Customer / Vendor DTOs ----

export class CreatePartyDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  creditLimit?: number;

  @ApiProperty({ required: false, description: "Payment terms in days" })
  @IsOptional()
  @IsNumber()
  paymentTerms?: number;
}

export class UpdatePartyDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ---- Invoice DTOs ----

export class InvoiceLineDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  taxAmount?: number;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  vatAmount?: number;
}

export class CreateInvoiceDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  customerId: string;

  @ApiProperty()
  @IsDateString()
  invoiceDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiProperty({ type: [InvoiceLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];
}

// ---- Bill DTOs ----

export class BillLineDto {
  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ default: 1 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  tdsSection?: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  tdsAmount?: number;
}

export class CreateBillDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  vendorId: string;

  @ApiProperty()
  @IsDateString()
  billDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiProperty({ type: [BillLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BillLineDto)
  lines: BillLineDto[];
}

// ---- Bank Account DTOs ----

export class CreateBankAccountDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  accountName: string;

  @ApiProperty()
  @IsString()
  accountNumber: string;

  @ApiProperty()
  @IsString()
  bankName: string;

  @ApiProperty()
  @IsString()
  ledgerAccountId: string;
}

// ---- Reconciliation DTOs ----

export class StartReconciliationDto {
  @ApiProperty()
  @IsString()
  bankAccountId: string;

  @ApiProperty()
  @IsDateString()
  statementDate: string;

  @ApiProperty()
  @IsNumber()
  statementBalance: number;

  @ApiProperty()
  @IsString()
  createdBy: string;
}

export class AddBankTransactionDto {
  @ApiProperty()
  @IsDateString()
  transactionDate: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsNumber()
  amount: number;
}
