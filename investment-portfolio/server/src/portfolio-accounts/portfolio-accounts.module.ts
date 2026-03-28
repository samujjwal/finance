import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { PortfolioAccountsService } from "./portfolio-accounts.service";
import { PortfolioAccountsController } from "./portfolio-accounts.controller";

@Module({
  imports: [PrismaModule],
  providers: [PortfolioAccountsService],
  controllers: [PortfolioAccountsController],
  exports: [PortfolioAccountsService],
})
export class PortfolioAccountsModule {}
