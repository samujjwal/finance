import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { FiscalYearService } from "./fiscal-year.service";
import { AccountsService } from "./accounts.service";
import { JournalsService } from "./journals.service";
import { VouchersService } from "./vouchers.service";
import { CustomersService, VendorsService } from "./parties.service";
import { InvoicesService, BillsService } from "./documents.service";
import { BankingService } from "./banking.service";
import { FiscalYearController } from "./fiscal-year.controller";
import { AccountsController } from "./accounts.controller";
import { JournalsController } from "./journals.controller";
import { VouchersController } from "./vouchers.controller";
import { CustomersController, VendorsController } from "./parties.controller";
import { InvoicesController, BillsController } from "./documents.controller";
import { BankingController } from "./banking.controller";

@Module({
  imports: [PrismaModule],
  providers: [
    FiscalYearService,
    AccountsService,
    JournalsService,
    VouchersService,
    CustomersService,
    VendorsService,
    InvoicesService,
    BillsService,
    BankingService,
  ],
  controllers: [
    FiscalYearController,
    AccountsController,
    JournalsController,
    VouchersController,
    CustomersController,
    VendorsController,
    InvoicesController,
    BillsController,
    BankingController,
  ],
  exports: [
    FiscalYearService,
    AccountsService,
    JournalsService,
    VouchersService,
    CustomersService,
    VendorsService,
    InvoicesService,
    BillsService,
    BankingService,
  ],
})
export class AccountingModule {}
