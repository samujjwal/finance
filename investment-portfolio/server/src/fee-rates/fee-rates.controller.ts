import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FeeRatesService } from "./fee-rates.service";

@ApiTags("fee-rates")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("fee-rates")
export class FeeRatesController {
  constructor(private feeRatesService: FeeRatesService) {}

  @Get()
  @ApiOperation({ summary: "Get all active fee/tax rates" })
  async findAll() {
    return {
      success: true,
      data: await this.feeRatesService.findAll(),
    };
  }

  @Get("grouped")
  @ApiOperation({
    summary: "Get fee/tax rates grouped by instrument and category",
  })
  async findGrouped() {
    return {
      success: true,
      data: await this.feeRatesService.findGrouped(),
    };
  }

  @Get("summary")
  @ApiOperation({
    summary:
      "Get structured summary of tax rates (replaces hard-coded constants)",
  })
  async getSummary() {
    return {
      success: true,
      data: await this.feeRatesService.getTaxRatesSummary(),
    };
  }
}
