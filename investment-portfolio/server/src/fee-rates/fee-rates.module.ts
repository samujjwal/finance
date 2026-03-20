import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { FeeRatesService } from "./fee-rates.service";
import { FeeRatesController } from "./fee-rates.controller";

@Module({
  imports: [PrismaModule],
  controllers: [FeeRatesController],
  providers: [FeeRatesService],
  exports: [FeeRatesService],
})
export class FeeRatesModule {}
