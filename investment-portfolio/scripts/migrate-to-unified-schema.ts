import { PrismaClient } from "@prisma/client";
import { copyFile, mkdir } from "fs/promises";
import { dirname, join } from "path";

const prisma = new PrismaClient();

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv
    .find((arg) => arg.startsWith(prefix))
    ?.slice(prefix.length);
}

function getDbPath(): string {
  const url = process.env.DATABASE_URL || "";
  if (!url.startsWith("file:")) {
    throw new Error(
      "This migration script currently supports only SQLite DATABASE_URL=file:...",
    );
  }
  return url.replace("file:", "");
}

async function backupDatabase(): Promise<string> {
  const dbPath = getDbPath();
  const backupDir = join(dirname(dbPath), "backups");
  await mkdir(backupDir, { recursive: true });
  const backupPath = join(
    backupDir,
    `cli-backup-${new Date().toISOString().replace(/[:.]/g, "-")}.sqlite`,
  );
  await copyFile(dbPath, backupPath);
  return backupPath;
}

async function runPhase1() {
  await prisma.$executeRawUnsafe(
    `UPDATE organizations
     SET has_investment = COALESCE(has_investment, 1),
         has_accounting = COALESCE(has_accounting, 0),
         has_inventory  = COALESCE(has_inventory, 0)`,
  );
}

async function runPhase2() {
  await prisma.$executeRawUnsafe(
    `UPDATE transactions
     SET status = CASE
       WHEN status IS NULL OR status = '' THEN 'DRAFT'
       ELSE status
     END`,
  );
}

async function main() {
  const phase = getArg("phase") || "all";
  const doBackup = getArg("backup") === "true";

  if (doBackup) {
    const backupPath = await backupDatabase();
    console.log(`Backup created: ${backupPath}`);
  }

  if (phase === "1" || phase === "all") {
    await runPhase1();
    console.log("Phase 1 completed");
  }

  if (phase === "2" || phase === "all") {
    await runPhase2();
    console.log("Phase 2 completed");
  }

  const [orgCount, txCount] = await Promise.all([
    prisma.organization.count(),
    prisma.transaction.count(),
  ]);
  console.log(
    `Verification: organizations=${orgCount}, transactions=${txCount}`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
