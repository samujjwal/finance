import { IsString, IsOptional, IsNumber, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateCompanyDto {
  @ApiProperty({ description: "Company symbol (unique)" })
  @IsString()
  symbol: string;

  @ApiProperty({ description: "Company name" })
  @IsString()
  companyName: string;

  @ApiProperty({ description: "Serial number", required: false })
  @IsOptional()
  @IsNumber()
  serialNumber?: number;

  @ApiProperty({ description: "Alternative symbol", required: false })
  @IsOptional()
  @IsString()
  symbol2?: string;

  @ApiProperty({ description: "Sector", required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ description: "Alternative symbol 3", required: false })
  @IsOptional()
  @IsString()
  symbol3?: string;

  @ApiProperty({ description: "Instrument type", required: false })
  @IsOptional()
  @IsString()
  instrumentType?: string;

  @ApiProperty({
    description: "Force import even if duplicates found",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  forceImport?: boolean;
}

export class UpdateCompanyDto {
  @ApiProperty({ description: "Company name", required: false })
  @IsOptional()
  @IsString()
  companyName?: string;

  @ApiProperty({ description: "Serial number", required: false })
  @IsOptional()
  @IsNumber()
  serialNumber?: number;

  @ApiProperty({ description: "Alternative symbol", required: false })
  @IsOptional()
  @IsString()
  symbol2?: string;

  @ApiProperty({ description: "Sector", required: false })
  @IsOptional()
  @IsString()
  sector?: string;

  @ApiProperty({ description: "Alternative symbol 3", required: false })
  @IsOptional()
  @IsString()
  symbol3?: string;

  @ApiProperty({ description: "Instrument type", required: false })
  @IsOptional()
  @IsString()
  instrumentType?: string;
}
