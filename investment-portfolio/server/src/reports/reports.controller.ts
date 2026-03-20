import { Controller, Get, Post, UseGuards, Body } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { ReportsService } from "./reports.service";

@ApiTags("reports")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("reports")
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get("monthly")
  @ApiOperation({ summary: "Get monthly summary" })
  async getMonthly() {
    return { success: true, data: await this.reportsService.getMonthly() };
  }

  @Get("performance")
  @ApiOperation({ summary: "Get monthly performance" })
  async getPerformance() {
    return { success: true, data: await this.reportsService.getPerformance() };
  }

  @Post("portfolio")
  @ApiOperation({ summary: "Generate portfolio report" })
  async generatePortfolioReport(
    @Body() body: { dateFrom?: string; dateTo?: string },
  ) {
    return {
      success: true,
      data: await this.reportsService.generatePortfolioReport(body),
    };
  }

  @Post("sectors")
  @ApiOperation({ summary: "Generate sector analysis" })
  async generateSectorAnalysis(
    @Body() body: { dateFrom?: string; dateTo?: string },
  ) {
    return {
      success: true,
      data: await this.reportsService.generateSectorAnalysis(body),
    };
  }

  @Post("export")
  @ApiOperation({ summary: "Export data" })
  async exportData(@Body() body: { format?: string; type?: string }) {
    return { success: true, data: await this.reportsService.exportData(body) };
  }
}
