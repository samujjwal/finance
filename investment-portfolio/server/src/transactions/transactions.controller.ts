import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { TransactionsService } from "./transactions.service";
import { FeeRatesService } from "../fee-rates/fee-rates.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilterDto,
} from "./dto/transaction.dto";

@ApiTags("transactions")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("transactions")
export class TransactionsController {
  constructor(
    private transactionsService: TransactionsService,
    private feeRatesService: FeeRatesService,
  ) {}

  // ── Static / named routes first (must precede parameterised :id routes) ──────

  /** @deprecated – use GET /fee-rates/summary instead */
  @Get("tax-rates")
  @ApiOperation({ summary: "Get Nepal NEPSE tax rates (from DB)" })
  async getTaxRates() {
    return {
      success: true,
      data: await this.feeRatesService.getTaxRatesSummary(),
    };
  }

  @Post("calculate-charges")
  @ApiOperation({
    summary: "Calculate brokerage, DP charges and SEBON fee for a transaction",
  })
  async calculateCharges(
    @Body()
    body: {
      transactionType: "BUY" | "SELL";
      amount: number;
      instrumentType?: string;
    },
  ) {
    const { transactionType, amount, instrumentType } = body;
    if (!transactionType || !["BUY", "SELL"].includes(transactionType)) {
      throw new BadRequestException("transactionType must be BUY or SELL");
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException("amount must be a positive number");
    }

    const charges = await this.feeRatesService.calculateCharges(
      amount,
      transactionType === "SELL",
      instrumentType,
    );

    return {
      success: true,
      data: {
        brokerage: charges.brokerage,
        dpCharges: charges.dpCharge,
        sebonFee: charges.sebonFee,
        totalCharges: charges.total,
        netAmount: charges.netAmount,
      },
    };
  }

  @Post("calculate-capital-gains")
  @ApiOperation({
    summary: "Calculate capital gains tax for a SELL transaction",
  })
  async calculateCapitalGains(
    @Body()
    body: {
      sellAmount: number;
      costBasis: number;
      purchaseDate: string;
      sellDate: string;
      investorType?: "Individual" | "Institutional";
    },
  ) {
    const { sellAmount, costBasis, purchaseDate, sellDate, investorType } =
      body;
    if (!sellAmount || !costBasis || !purchaseDate || !sellDate) {
      throw new BadRequestException(
        "sellAmount, costBasis, purchaseDate and sellDate are required",
      );
    }

    const buyDate = new Date(purchaseDate);
    const saleDate = new Date(sellDate);
    const holdingPeriodDays = Math.floor(
      (saleDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const isLongTerm = holdingPeriodDays >= 365;
    const applicableTaxRate = await this.feeRatesService.getCGTRate(
      holdingPeriodDays,
      investorType ?? "Individual",
    );

    const capitalGains = Math.max(0, sellAmount - costBasis);
    const capitalLoss = costBasis > sellAmount ? costBasis - sellAmount : 0;
    const taxAmount = capitalGains * applicableTaxRate;

    return {
      success: true,
      data: {
        capitalGains,
        capitalLoss,
        holdingPeriodDays,
        isLongTerm,
        applicableTaxRate,
        taxAmount,
      },
    };
  }

  // ── CRUD routes (parameterised :id must come after all named routes) ───────

  @Get()
  @ApiOperation({ summary: "Get all transactions" })
  async findAll(@Query() filters: TransactionFilterDto) {
    return {
      success: true,
      data: await this.transactionsService.findAll(filters),
    };
  }

  @Post()
  @ApiOperation({ summary: "Create new transaction" })
  async create(@Body() createDto: CreateTransactionDto) {
    return {
      success: true,
      data: await this.transactionsService.create(createDto),
    };
  }

  @Post("bulk")
  @ApiOperation({ summary: "Create multiple transactions; returns per-item results" })
  async createBulk(@Body() createDtos: CreateTransactionDto[]) {
    if (!Array.isArray(createDtos)) {
      throw new BadRequestException("Request body must be an array of transactions");
    }
    const results: any[] = [];
    for (const dto of createDtos) {
      try {
        const created = await this.transactionsService.create(dto);
        results.push({ success: true, data: created });
      } catch (err: any) {
        results.push({ success: false, error: err?.message || String(err), dto });
      }
    }
    const succeeded = results.filter(r => r.success);
    return {
      success: true,
      data: succeeded.map(r => r.data),
      summary: { total: results.length, imported: succeeded.length, failed: results.length - succeeded.length },
      errors: results.filter(r => !r.success).map(r => ({ error: r.error, symbol: r.dto?.companySymbol })),
    };
  }

  @Get(":id")
  @ApiOperation({ summary: "Get transaction by ID" })
  async findOne(@Param("id") id: string) {
    return {
      success: true,
      data: await this.transactionsService.findOne(id),
    };
  }

  @Put(":id")
  @ApiOperation({ summary: "Update transaction" })
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdateTransactionDto,
  ) {
    return {
      success: true,
      data: await this.transactionsService.update(id, updateDto),
    };
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete transaction" })
  async remove(@Param("id") id: string) {
    await this.transactionsService.remove(id);
    return {
      success: true,
      message: "Transaction deleted successfully",
    };
  }
}
