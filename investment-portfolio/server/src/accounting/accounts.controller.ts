import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { AccountsService } from "./accounts.service";
import {
  CreateAccountGroupDto,
  UpdateAccountGroupDto,
  CreateLedgerAccountDto,
  UpdateLedgerAccountDto,
} from "./dto/accounting.dto";

@ApiTags("Accounting - Chart of Accounts")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("accounting")
export class AccountsController {
  constructor(private readonly accounts: AccountsService) {}

  // ---- Account Groups ----
  @Get("groups")
  @ApiOperation({ summary: "List all account groups for an organization" })
  getGroups(@Query("organizationId") organizationId: string) {
    return this.accounts.getGroups(organizationId);
  }

  @Get("groups/tree")
  @ApiOperation({ summary: "Get account group hierarchy tree" })
  getGroupTree(@Query("organizationId") organizationId: string) {
    return this.accounts.getGroupTree(organizationId);
  }

  @Post("groups")
  createGroup(@Body() dto: CreateAccountGroupDto) {
    return this.accounts.createGroup(dto);
  }

  @Put("groups/:id")
  updateGroup(@Param("id") id: string, @Body() dto: UpdateAccountGroupDto) {
    return this.accounts.updateGroup(id, dto);
  }

  // ---- Ledger Accounts ----
  @Get("ledger-accounts")
  @ApiOperation({ summary: "List ledger accounts for an organization" })
  getLedgerAccounts(
    @Query("organizationId") organizationId: string,
    @Query("groupId") groupId?: string,
  ) {
    return this.accounts.getLedgerAccounts(
      organizationId,
      groupId ? { accountGroupId: groupId } : undefined,
    );
  }

  @Get("ledger-accounts/:id")
  getLedgerAccount(@Param("id") id: string) {
    return this.accounts.getLedgerAccount(id);
  }

  @Get("ledger-accounts/:id/balance")
  getBalance(@Param("id") id: string, @Query("asOfDate") asOfDate?: string) {
    return this.accounts.getLedgerAccountBalance(
      id,
      asOfDate ? new Date(asOfDate) : undefined,
    );
  }

  @Post("ledger-accounts")
  createLedgerAccount(@Body() dto: CreateLedgerAccountDto) {
    return this.accounts.createLedgerAccount(dto);
  }

  @Put("ledger-accounts/:id")
  updateLedgerAccount(
    @Param("id") id: string,
    @Body() dto: UpdateLedgerAccountDto,
  ) {
    return this.accounts.updateLedgerAccount(id, dto);
  }

  @Delete("ledger-accounts/:id")
  deleteLedgerAccount(@Param("id") id: string) {
    return this.accounts.deleteLedgerAccount(id);
  }

  @Post("ledger-accounts/auto-create-investment")
  @ApiOperation({ summary: "Auto-create standard investment GL accounts" })
  autoCreateInvestmentAccounts(@Body() body: { organizationId: string }) {
    return this.accounts.autoCreateInvestmentAccounts(body.organizationId);
  }
}
