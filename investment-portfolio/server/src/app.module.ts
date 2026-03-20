import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CompaniesModule } from "./companies/companies.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { ReportsModule } from "./reports/reports.module";
import { FeeRatesModule } from "./fee-rates/fee-rates.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env",
    }),
    PrismaModule,
    AuthModule,
    FeeRatesModule,
    CompaniesModule,
    TransactionsModule,
    PortfolioModule,
    ReportsModule,
  ],
})
export class AppModule {}
