import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { CompaniesModule } from "./companies/companies.module";
import { TransactionsModule } from "./transactions/transactions.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { ReportsModule } from "./reports/reports.module";
import { FeeRatesModule } from "./fee-rates/fee-rates.module";
import { AuditModule } from "./audit/audit.module";
import { ApprovalModule } from "./approval/approval.module";
import { UsersModule } from "./users/users.module";
import { RolesModule } from "./roles/roles.module";

import { PermissionModule } from "./permissions/permission.module";

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
    AuditModule,
    ApprovalModule,
    UsersModule,
    RolesModule,
    PermissionModule,
  ],
})
export class AppModule {}
