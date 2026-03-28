import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { BsCalendarService } from "./bs-calendar.service";
import { VatService } from "./vat.service";
import { TdsService } from "./tds.service";
import { IrdExportService } from "./ird-export.service";
import { NepseConnectorService } from "./nepse/nepse-connector.service";
import { PriceSyncJob } from "./nepse/price-sync.job";
import {
  CalendarController,
  VatController,
  TdsController,
  IrdController,
  NepseController,
} from "./nepal.controller";

@Module({
  imports: [PrismaModule],
  providers: [
    BsCalendarService,
    VatService,
    TdsService,
    IrdExportService,
    NepseConnectorService,
    PriceSyncJob,
  ],
  controllers: [
    CalendarController,
    VatController,
    TdsController,
    IrdController,
    NepseController,
  ],
  exports: [
    BsCalendarService,
    VatService,
    TdsService,
    IrdExportService,
    NepseConnectorService,
    PriceSyncJob,
  ],
})
export class NepalModule {}
