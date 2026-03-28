import { Module } from "@nestjs/common";
import { CompaniesController } from "./companies.controller";
import { InstrumentsController } from "./instruments.controller";
import { CompaniesService } from "./companies.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [CompaniesController, InstrumentsController],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
