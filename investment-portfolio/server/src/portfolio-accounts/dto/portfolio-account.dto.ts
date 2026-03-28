import { IsString, IsOptional, IsBoolean } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePortfolioAccountDto {
  @ApiProperty() @IsString() organizationId: string;
  @ApiPropertyOptional() @IsOptional() @IsString() accountNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() boId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dpCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() investorType?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
}

export class UpdatePortfolioAccountDto {
  @ApiPropertyOptional() @IsOptional() @IsString() accountNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() boId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() dpCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() investorType?: string;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isDefault?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
}
