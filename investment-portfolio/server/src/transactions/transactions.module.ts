import { Module } from "@nestjs/common";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { PrismaModule } from "../prisma/prisma.module";
import { FeeRatesModule } from "../fee-rates/fee-rates.module";
import { ApprovalModule } from "../approval/approval.module";
import { AuditModule } from "../audit/audit.module";

@Module({
  imports: [PrismaModule, FeeRatesModule, ApprovalModule, AuditModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
