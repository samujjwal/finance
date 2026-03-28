import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { FiscalYearService } from "./fiscal-year.service";
import { CreateFiscalYearDto } from "./dto/fiscal-year.dto";

@ApiTags("Accounting - Fiscal Years")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/fiscal-years")
export class FiscalYearController {
  constructor(private readonly fy: FiscalYearService) {}

  @Get()
  @ApiOperation({ summary: "List all fiscal years for an organization" })
  findAll(@Query("organizationId") organizationId: string) {
    return this.fy.findAll(organizationId);
  }

  @Get("current")
  @ApiOperation({ summary: "Get current open fiscal year" })
  getCurrent(@Query("organizationId") organizationId: string) {
    return this.fy.getCurrent(organizationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.fy.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateFiscalYearDto) {
    return this.fy.create(dto);
  }

  @Put(":id/close")
  close(@Param("id") id: string, @Body() body: { closedBy?: string }) {
    return this.fy.close(id, body?.closedBy ?? "SYSTEM");
  }

  @Put(":id/reopen")
  reopen(@Param("id") id: string, @Body() body: { reopenedBy?: string }) {
    return this.fy.reopen(id, body?.reopenedBy ?? "SYSTEM");
  }
}
