import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { Response } from "express";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { BsCalendarService } from "./bs-calendar.service";
import { VatService } from "./vat.service";
import { TdsService } from "./tds.service";
import { IrdExportService } from "./ird-export.service";
import { NepseConnectorService } from "./nepse/nepse-connector.service";
import { PriceSyncJob } from "./nepse/price-sync.job";

@ApiTags("Nepal - BS Calendar")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("nepal/calendar")
export class CalendarController {
  constructor(private readonly cal: BsCalendarService) {}

  @Get("convert/ad-to-bs")
  @ApiOperation({ summary: "Convert AD date to BS date" })
  adToBS(@Query("date") date: string) {
    return this.cal.convertADToBS(new Date(date));
  }

  @Get("convert/bs-to-ad")
  @ApiOperation({ summary: "Convert BS date to AD date" })
  bsToAD(
    @Query("year") year: string,
    @Query("month") month: string,
    @Query("day") day: string,
  ) {
    return { adDate: this.cal.convertBSToAD(+year, +month, +day) };
  }

  @Get("fiscal-year")
  @ApiOperation({ summary: "Get Nepal fiscal year for a given AD date" })
  getFiscalYear(@Query("date") date?: string) {
    return this.cal.getCurrentFiscalYear(date ? new Date(date) : new Date());
  }

  @Get(":year/:month")
  @ApiOperation({ summary: "Get BS calendar month with holidays" })
  getMonth(@Param("year") year: string, @Param("month") month: string) {
    return this.cal.getCalendarMonth(+year, +month);
  }

  @Get("holidays/check")
  async isHoliday(@Query("date") date: string) {
    return { isHoliday: await this.cal.isHoliday(new Date(date)) };
  }
}

@ApiTags("Nepal - VAT")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("nepal/vat")
export class VatController {
  constructor(private readonly vat: VatService) {}

  @Get("config")
  getConfig(@Query("organizationId") organizationId: string) {
    return this.vat.getConfig(organizationId);
  }

  @Post("config")
  configure(@Body() dto: any) {
    return this.vat.configureVat(dto);
  }

  @Post("calculate")
  calculate(@Body() body: { amount: number; vatRate: number }) {
    return this.vat.calculateVat(body.amount, body.vatRate);
  }

  @Post("returns")
  generateReturn(
    @Body()
    body: {
      organizationId: string;
      periodStart: string;
      periodEnd: string;
    },
  ) {
    return this.vat.generateVatReturn(
      body.organizationId,
      new Date(body.periodStart),
      new Date(body.periodEnd),
    );
  }

  @Get("returns")
  getReturns(@Query("organizationId") organizationId: string) {
    return this.vat.getVatReturns(organizationId);
  }

  @Put("returns/:id/submit")
  submit(@Param("id") id: string) {
    return this.vat.submitVatReturn(id);
  }
}

@ApiTags("Nepal - TDS")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("nepal/tds")
export class TdsController {
  constructor(private readonly tds: TdsService) {}

  @Get("sections")
  @ApiOperation({ summary: "List standard Nepal TDS sections" })
  getSections() {
    const { NEPAL_TDS_SECTIONS } = require("./tds.service");
    return NEPAL_TDS_SECTIONS;
  }

  @Get("config")
  getConfig(@Query("organizationId") organizationId: string) {
    return this.tds.getConfig(organizationId);
  }

  @Post("config")
  configure(@Body() dto: any) {
    return this.tds.configureTdsSection(dto);
  }

  @Post("calculate")
  calculate(
    @Body() body: { amount: number; section: string; organizationId: string },
  ) {
    return this.tds.calculateTds(body.amount, body.section);
  }

  @Post("deductions")
  record(@Body() dto: any) {
    return this.tds.recordTdsDeduction(dto);
  }

  @Get("deductions")
  getDeductions(
    @Query("organizationId") organizationId: string,
    @Query("fiscalYearId") fiscalYearId?: string,
  ) {
    return this.tds.getDeductions(organizationId, fiscalYearId);
  }

  @Get("deductions/summary")
  getSummary(
    @Query("organizationId") organizationId: string,
    @Query("fiscalYearId") fiscalYearId: string,
  ) {
    return this.tds.getSummaryBySections(organizationId, fiscalYearId);
  }

  @Get("deductions/:id/certificate")
  getCertificate(@Param("id") id: string) {
    return this.tds.generateTdsCertificate(id);
  }
}

@ApiTags("Nepal - IRD Export")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("nepal/ird")
export class IrdController {
  constructor(private readonly ird: IrdExportService) {}

  @Get("sales-register")
  @ApiOperation({ summary: "Export sales register as CSV" })
  async salesRegister(
    @Query("organizationId") organizationId: string,
    @Query("from") from: string,
    @Query("to") to: string,
    @Res() res: Response,
  ) {
    const csv = await this.ird.exportSalesRegister(
      organizationId,
      new Date(from),
      new Date(to),
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="sales-register-${from}-${to}.csv"`,
    );
    res.send(csv);
  }

  @Get("purchase-register")
  @ApiOperation({ summary: "Export purchase register as CSV" })
  async purchaseRegister(
    @Query("organizationId") organizationId: string,
    @Query("from") from: string,
    @Query("to") to: string,
    @Res() res: Response,
  ) {
    const csv = await this.ird.exportPurchaseRegister(
      organizationId,
      new Date(from),
      new Date(to),
    );
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="purchase-register-${from}-${to}.csv"`,
    );
    res.send(csv);
  }

  @Get("tds-register")
  @ApiOperation({ summary: "Export TDS register as CSV" })
  async tdsRegister(
    @Query("organizationId") organizationId: string,
    @Query("fiscalYearId") fiscalYearId: string,
    @Res() res: Response,
  ) {
    const csv = await this.ird.exportTdsRegister(organizationId, fiscalYearId);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="tds-register-${fiscalYearId}.csv"`,
    );
    res.send(csv);
  }
}

@ApiTags("Nepal - NEPSE")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("nepal/nepse")
export class NepseController {
  constructor(
    private readonly nepse: NepseConnectorService,
    private readonly priceJob: PriceSyncJob,
  ) {}

  @Post("sync/instruments")
  @ApiOperation({ summary: "Sync instruments from NEPSE" })
  syncInstruments() {
    return this.nepse.syncInstruments();
  }

  @Post("sync/prices")
  @ApiOperation({ summary: "Sync latest market prices" })
  syncPrices() {
    return this.nepse.syncPrices();
  }

  @Get("price/:symbol")
  @ApiOperation({ summary: "Get current price for an instrument" })
  async getCurrentPrice(@Param("symbol") symbol: string) {
    return { symbol, price: await this.nepse.getCurrentPrice(symbol) };
  }

  @Post("verify-bo-id")
  @ApiOperation({ summary: "Validate BO ID format" })
  verifyBoId(@Body() body: { boId: string }) {
    return this.nepse.verifyBoId(body.boId);
  }

  @Post("jobs/daily-price-sync")
  @ApiOperation({ summary: "Manually trigger daily price sync job" })
  runDailyPriceSync() {
    return this.priceJob.runDailyPriceSync();
  }
}
