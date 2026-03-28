import { IsString, IsDateString, IsOptional } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateFiscalYearDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty({ description: "e.g. FY 2080/81" })
  @IsString()
  name: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;
}
