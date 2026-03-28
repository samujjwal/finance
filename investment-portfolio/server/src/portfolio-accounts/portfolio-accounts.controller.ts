import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PortfolioAccountsService } from "./portfolio-accounts.service";
import {
  CreatePortfolioAccountDto,
  UpdatePortfolioAccountDto,
} from "./dto/portfolio-account.dto";

@ApiTags("Portfolio Accounts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("portfolio-accounts")
export class PortfolioAccountsController {
  constructor(private readonly service: PortfolioAccountsService) {}

  @Get()
  @ApiOperation({ summary: "List all portfolio accounts for an organization" })
  findAll(@Query("organizationId") organizationId: string) {
    return this.service.findAll(organizationId);
  }

  @Get("summary")
  @ApiOperation({ summary: "Portfolio summary with holdings per account" })
  getSummary(@Query("organizationId") organizationId: string) {
    return this.service.getSummary(organizationId);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.service.findOne(id);
  }

  @Get(":id/holdings")
  @ApiOperation({ summary: "Get current holdings for a portfolio account" })
  getHoldings(@Param("id") id: string) {
    return this.service.getHoldings(id);
  }

  @Post()
  create(@Body() dto: CreatePortfolioAccountDto) {
    return this.service.create(dto);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdatePortfolioAccountDto) {
    return this.service.update(id, dto);
  }
}
