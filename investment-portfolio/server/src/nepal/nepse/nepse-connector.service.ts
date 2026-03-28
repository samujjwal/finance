import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class NepseConnectorService {
  private readonly logger = new Logger(NepseConnectorService.name);

  constructor(private readonly prisma: PrismaService) {}

  async syncInstruments() {
    // Placeholder list until NEPSE API credential/config is wired.
    const symbols = ["NABIL", "NIFRA", "NTC", "HRL", "NRIC"];
    let upserted = 0;

    for (const symbol of symbols) {
      await this.prisma.instrument.upsert({
        where: { symbol },
        update: {},
        create: {
          symbol,
          companyName: `${symbol} Listed Security`,
          sector: "Unknown",
          instrumentType: "EQUITY",
        },
      });
      upserted++;
    }

    return { synced: upserted };
  }

  async syncPrices() {
    // Price sync hook (placeholder): current schema stores market values on holdings.
    const holdings = await this.prisma.portfolioHolding.findMany();
    let updated = 0;

    for (const holding of holdings) {
      const currentPrice = await this.getCurrentPrice(holding.companySymbol);
      const marketValue = holding.totalQuantity * currentPrice;
      await this.prisma.portfolioHolding.update({
        where: { companySymbol: holding.companySymbol },
        data: { marketValue, lastUpdated: new Date() },
      });
      updated++;
    }

    return { updated };
  }

  async getCurrentPrice(symbol: string): Promise<number> {
    // Deterministic fallback for environments without live market feed.
    const base = symbol
      .split("")
      .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
    return 100 + (base % 900);
  }

  async verifyBoId(boId: string): Promise<{ valid: boolean; reason?: string }> {
    const normalized = boId.trim();
    if (!/^\d{16}$/.test(normalized)) {
      return { valid: false, reason: "BO ID must be 16 digits" };
    }
    return { valid: true };
  }
}
