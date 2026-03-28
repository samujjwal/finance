import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { AccountingModule } from "../accounting/accounting.module";
import { InvestmentAccountingBridgeService } from "./investment-accounting-bridge.service";

@Module({
  imports: [PrismaModule, AccountingModule],
  providers: [InvestmentAccountingBridgeService],
  exports: [InvestmentAccountingBridgeService],
})
export class IntegrationModule {}
