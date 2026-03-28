import { Body, Controller, Get, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { MigrationService } from "./migration.service";

@ApiTags("migration")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller("migration")
export class MigrationController {
  constructor(private readonly migration: MigrationService) {}

  @Post("validate")
  @ApiOperation({ summary: "Validate database before migration" })
  validate() {
    return this.migration.validateExistingDatabase();
  }

  @Post("backup")
  @ApiOperation({ summary: "Create a database backup" })
  backup() {
    return this.migration.backupDatabase();
  }

  @Post("run/:phase")
  @ApiOperation({ summary: "Run migration phase" })
  runPhase(@Param("phase") phase: string) {
    if (phase === "1") return this.migration.runPhase1Migration();
    if (phase === "2") return this.migration.runPhase2Migration();
    return { phase, status: "skipped", reason: "Unsupported phase" };
  }

  @Get("verify")
  @ApiOperation({ summary: "Verify migration integrity checks" })
  verify() {
    return this.migration.verifyMigration();
  }

  @Post("rollback")
  @ApiOperation({ summary: "Rollback migration using backup file" })
  rollback(@Body() body: { backupPath: string }) {
    return this.migration.rollbackMigration(body.backupPath);
  }
}
