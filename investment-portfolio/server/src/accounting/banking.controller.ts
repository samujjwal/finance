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
import { BankingService } from "./banking.service";
import {
  CreateBankAccountDto,
  StartReconciliationDto,
  AddBankTransactionDto,
} from "./dto/commercial.dto";

@ApiTags("Accounting - Banking")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting/banking")
export class BankingController {
  constructor(private readonly banking: BankingService) {}

  // Bank Accounts
  @Get("accounts")
  getBankAccounts(@Query("organizationId") organizationId: string) {
    return this.banking.getBankAccounts(organizationId);
  }

  @Post("accounts")
  createBankAccount(@Body() dto: CreateBankAccountDto) {
    return this.banking.createBankAccount(dto);
  }

  @Get("accounts/:id/balance")
  getBankBalance(
    @Param("id") id: string,
    @Query("asOfDate") asOfDate?: string,
  ) {
    return this.banking.getBankBalance(
      id,
      asOfDate ? new Date(asOfDate) : undefined,
    );
  }

  // Reconciliation
  @Post("reconciliations")
  @ApiOperation({ summary: "Start a new bank reconciliation" })
  startReconciliation(@Body() dto: StartReconciliationDto) {
    return this.banking.startReconciliation(dto);
  }

  @Get("reconciliations/:id")
  getReconciliation(@Param("id") id: string) {
    return this.banking.getReconciliation(id);
  }

  @Post("reconciliations/:id/transactions")
  @ApiOperation({ summary: "Add a bank statement transaction" })
  addBankTransaction(
    @Param("id") id: string,
    @Body() dto: AddBankTransactionDto,
  ) {
    return this.banking.addBankTransaction(id, dto);
  }

  @Put("reconciliations/:id/transactions/:txId/match")
  @ApiOperation({ summary: "Match a bank transaction to a journal line" })
  matchTransaction(
    @Param("id") id: string,
    @Param("txId") txId: string,
    @Body() body: { journalLineId: string },
  ) {
    return this.banking.matchTransaction(id, txId, body.journalLineId);
  }

  @Put("reconciliations/:id/transactions/:txId/unmatch")
  unmatchTransaction(@Param("id") id: string, @Param("txId") txId: string) {
    return this.banking.unmatchTransaction(txId);
  }

  @Post("reconciliations/:id/auto-match")
  @ApiOperation({ summary: "Auto-match unmatched transactions by amount" })
  autoMatch(@Param("id") id: string) {
    return this.banking.autoMatch(id);
  }

  @Put("reconciliations/:id/complete")
  @ApiOperation({ summary: "Complete a reconciliation" })
  complete(@Param("id") id: string) {
    return this.banking.completeReconciliation(id);
  }
}
