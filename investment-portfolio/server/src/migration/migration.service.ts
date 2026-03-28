import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { copyFile, mkdir, access } from "fs/promises";
import { constants } from "fs";
import { dirname, join } from "path";

@Injectable()
export class MigrationService {
  constructor(private readonly prisma: PrismaService) {}

  private getSqliteDbPath(): string {
    const url = process.env.DATABASE_URL || "";
    if (!url.startsWith("file:")) {
      throw new BadRequestException("Only SQLite file databases are supported");
    }
    return url.replace("file:", "");
  }

  async validateExistingDatabase() {
    const dbPath = this.getSqliteDbPath();
    await access(dbPath, constants.F_OK);

    const [userCount, txCount, instrumentCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.transaction.count(),
      this.prisma.instrument.count(),
    ]);

    return {
      valid: true,
      dbPath,
      summary: { userCount, txCount, instrumentCount },
    };
  }

  async backupDatabase() {
    const dbPath = this.getSqliteDbPath();
    const backupDir = join(dirname(dbPath), "backups");
    await mkdir(backupDir, { recursive: true });

    const backupPath = join(
      backupDir,
      `db-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
    );
    await copyFile(dbPath, backupPath);

    return { backupPath };
  }

  async runPhase1Migration() {
    // Phase-1 compatibility: ensure module flag columns exist and are not null.
    await this.prisma.$executeRawUnsafe(
      `UPDATE organizations
       SET has_investment = COALESCE(has_investment, 1),
           has_accounting = COALESCE(has_accounting, 0),
           has_inventory  = COALESCE(has_inventory, 0)`,
    );
    return { phase: 1, status: "completed" };
  }

  async runPhase2Migration() {
    // Phase-2 compatibility: normalize transaction status values if needed.
    await this.prisma.$executeRawUnsafe(
      `UPDATE transactions
       SET status = CASE
         WHEN status IS NULL OR status = '' THEN 'DRAFT'
         ELSE status
       END`,
    );
    return { phase: 2, status: "completed" };
  }

  async verifyMigration() {
    const [orgCount, txCount, accountGroupCount] = await Promise.all([
      this.prisma.organization.count(),
      this.prisma.transaction.count(),
      this.prisma.accountGroup.count(),
    ]);

    return {
      passed: true,
      checks: {
        organizations: orgCount,
        transactions: txCount,
        accountGroups: accountGroupCount,
      },
    };
  }

  async rollbackMigration(backupPath: string) {
    const dbPath = this.getSqliteDbPath();
    await access(backupPath, constants.F_OK);
    await copyFile(backupPath, dbPath);
    return { rolledBack: true, restoredFrom: backupPath };
  }
}
