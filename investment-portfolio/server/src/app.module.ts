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
import { OrganizationsModule } from "./organizations/organizations.module";
import { AccountingModule } from "./accounting/accounting.module";
import { PortfolioAccountsModule } from "./portfolio-accounts/portfolio-accounts.module";
import { NepalModule } from "./nepal/nepal.module";
import { IntegrationModule } from "./integration/integration.module";
import { MigrationModule } from "./migration/migration.module";

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
    OrganizationsModule,
    AccountingModule,
    PortfolioAccountsModule,
    NepalModule,
    IntegrationModule,
    MigrationModule,
  ],
})
export class AppModule {}
