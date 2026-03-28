import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MigrationService } from "./migration.service";
import { MigrationController } from "./migration.controller";

@Module({
  imports: [PrismaModule],
  providers: [MigrationService],
  controllers: [MigrationController],
  exports: [MigrationService],
})
export class MigrationModule {}
