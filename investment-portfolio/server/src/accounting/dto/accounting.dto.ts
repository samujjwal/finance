import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

const ACCOUNT_TYPES = [
  "ASSET",
  "LIABILITY",
  "EQUITY",
  "INCOME",
  "EXPENSE",
] as const;

// ---- AccountGroup DTOs ----

export class CreateAccountGroupDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ACCOUNT_TYPES })
  @IsIn(ACCOUNT_TYPES)
  groupType: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateAccountGroupDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

// ---- LedgerAccount DTOs ----

export class CreateLedgerAccountDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  accountGroupId: string;

  @ApiProperty()
  @IsString()
  code: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: ACCOUNT_TYPES })
  @IsIn(ACCOUNT_TYPES)
  accountType: string;

  @ApiProperty({ default: 0 })
  @IsOptional()
  @IsNumber()
  openingBalance?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateLedgerAccountDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// ---- JournalEntry DTOs ----

export class JournalLineDto {
  @ApiProperty()
  @IsString()
  ledgerAccountId: string;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  debit: number;

  @ApiProperty({ default: 0 })
  @IsNumber()
  @Min(0)
  credit: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  narration?: string;
}

export class CreateJournalEntryDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  entryDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fiscalYearId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sourceType?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiProperty({ type: [JournalLineDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines: JournalLineDto[];
}

// ---- Voucher DTOs ----

export class CreateVoucherDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty({ enum: ["PAYMENT", "RECEIPT", "JOURNAL", "CONTRA"] })
  @IsIn(["PAYMENT", "RECEIPT", "JOURNAL", "CONTRA"])
  voucherType: string;

  @ApiProperty()
  @IsString()
  voucherDate: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  narration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fiscalYearId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  totalAmount?: number;
}
