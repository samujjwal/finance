import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrganizationDto {
  @ApiProperty({ description: "Organization name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Unique short code" })
  @IsString()
  code: string;

  @ApiProperty({ description: "PAN number", required: false })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiProperty({ description: "VAT number", required: false })
  @IsOptional()
  @IsString()
  vatNumber?: string;

  @ApiProperty({ description: "Address", required: false })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ description: "Phone", required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ description: "Email", required: false })
  @IsOptional()
  @IsString()
  email?: string;
}

export class UpdateOrganizationDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  panNumber?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  vatNumber?: string;

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
}

export class UpdateModuleAccessDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasInvestment?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasAccounting?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  hasInventory?: boolean;
}
