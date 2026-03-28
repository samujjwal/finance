import { Injectable, Logger } from "@nestjs/common";
import { NepseConnectorService } from "./nepse-connector.service";

@Injectable()
export class PriceSyncJob {
  private readonly logger = new Logger(PriceSyncJob.name);

  constructor(private readonly nepse: NepseConnectorService) {}

  /**
   * Scheduled intent: run daily at 18:00 NPT after market close.
   * Hook into @nestjs/schedule Cron when scheduler module is enabled.
   */
  async runDailyPriceSync() {
    const result = await this.nepse.syncPrices();
    this.logger.log(
      `NEPSE price sync completed: ${result.updated} holdings updated`,
    );
    return result;
  }
}
