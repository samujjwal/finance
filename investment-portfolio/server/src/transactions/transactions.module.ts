import { Module } from "@nestjs/common";
import { TransactionsController } from "./transactions.controller";
import { TransactionsService } from "./transactions.service";
import { PrismaModule } from "../prisma/prisma.module";
import { FeeRatesModule } from "../fee-rates/fee-rates.module";

@Module({
  imports: [PrismaModule, FeeRatesModule],
  controllers: [TransactionsController],
  providers: [TransactionsService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
