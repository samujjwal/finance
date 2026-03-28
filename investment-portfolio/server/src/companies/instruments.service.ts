import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompanyDto, UpdateCompanyDto } from "./dto/company.dto";

// Type aliases for semantic clarity
type CreateInstrumentDto = CreateCompanyDto;
type UpdateInstrumentDto = UpdateCompanyDto;

/**
 * Instruments Service (formerly Companies)
 * Manages NEPSE-listed securities and investment instruments.
 * Phase 2: Investment Enhancement - provides data access for portfolio management
 */
@Injectable()
export class InstrumentsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get all instruments with optional filtering
   */
  async findAll(filters?: {
    sector?: string;
    instrumentType?: string;
    symbol?: string;
  }) {
    return this.prisma.instrument.findMany({
      where: {
        ...(filters?.sector && { sector: filters.sector }),
        ...(filters?.instrumentType && {
          instrumentType: filters.instrumentType,
        }),
        ...(filters?.symbol && {
          symbol: { contains: filters.symbol },
        }),
      },
      orderBy: { symbol: "asc" },
    });
  }

  /**
   * Get a single instrument by ID
   */
  async findOne(id: string) {
    const instrument = await this.prisma.instrument.findUnique({
      where: { id },
      include: {
        transactions: {
          orderBy: { transactionDate: "desc" },
          take: 10,
        },
        monthlySummaries: { orderBy: { monthName: "desc" }, take: 12 },
        portfolioHoldings: true,
      },
    });

    if (!instrument) {
      throw new NotFoundException(`Instrument with ID ${id} not found`);
    }

    return instrument;
  }

  /**
   * Get instrument by symbol (NEPSE-listed symbol)
   */
  async findBySymbol(symbol: string) {
    const instrument = await this.prisma.instrument.findUnique({
      where: { symbol },
      include: {
        transactions: { orderBy: { transactionDate: "desc" }, take: 5 },
        monthlySummaries: { orderBy: { monthName: "desc" }, take: 12 },
        portfolioHoldings: true,
      },
    });

    if (!instrument) {
      throw new NotFoundException(`Instrument with symbol ${symbol} not found`);
    }

    return instrument;
  }

  /**
   * Create a new instrument (typically from NEPSE sync)
   */
  async create(dto: CreateInstrumentDto) {
    const existing = await this.prisma.instrument.findUnique({
      where: { symbol: dto.symbol },
    });

    if (existing) {
      throw new ConflictException(
        `Instrument with symbol ${dto.symbol} already exists`,
      );
    }

    return this.prisma.instrument.create({ data: dto });
  }

  /**
   * Batch create instruments (used for NEPSE data sync)
   */
  async createBatch(dtos: CreateInstrumentDto[]) {
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const dto of dtos) {
      try {
        await this.create(dto);
        results.created++;
      } catch (err) {
        if (err instanceof ConflictException) {
          results.skipped++;
        } else {
          results.errors.push(`${dto.symbol}: ${err.message}`);
        }
      }
    }

    return results;
  }

  /**
   * Update instrument details
   * Note: Symbol is immutable (unique key)
   */
  async update(id: string, dto: UpdateInstrumentDto) {
    const instrument = await this.findOne(id);

    return this.prisma.instrument.update({
      where: { id },
      data: dto,
    });
  }

  /**
   * Get instruments by sector
   */
  async findBySector(sector: string) {
    return this.prisma.instrument.findMany({
      where: { sector },
      orderBy: { symbol: "asc" },
    });
  }

  /**
   * Get distinct sectors for grouping/filtering
   */
  async getSectors() {
    const results = await this.prisma.instrument.findMany({
      where: { sector: { not: null } },
      select: { sector: true },
      distinct: ["sector"],
      orderBy: { sector: "asc" },
    });

    return results.map((r) => r.sector).filter(Boolean);
  }

  /**
   * Get instrument types available in NEPSE
   */
  async getInstrumentTypes() {
    const results = await this.prisma.instrument.findMany({
      where: { instrumentType: { not: null } },
      select: { instrumentType: true },
      distinct: ["instrumentType"],
      orderBy: { instrumentType: "asc" },
    });

    return results.map((r) => r.instrumentType).filter(Boolean);
  }

  /**
   * Get total count of instruments
   */
  async count() {
    return this.prisma.instrument.count();
  }

  /**
   * Search instruments by name or symbol
   */
  async search(query: string) {
    const searchQuery = query.toLowerCase().trim();

    return this.prisma.instrument.findMany({
      where: {
        OR: [
          { symbol: { contains: searchQuery } },
          { companyName: { contains: searchQuery } },
        ],
      },
      orderBy: [{ symbol: "asc" }, { companyName: "asc" }],
      take: 20,
    });
  }

  /**
   * Get instruments with recent portfolio activity
   */
  async getActive(limit = 10) {
    const today = new Date();
    const last30Days = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.prisma.instrument.findMany({
      where: {
        transactions: {
          some: {
            transactionDate: {
              gte: last30Days.toISOString().split("T")[0],
            },
          },
        },
      },
      include: {
        transactions: {
          where: { transactionDate: { gte: last30Days.toISOString() } },
          orderBy: { transactionDate: "desc" },
        },
        monthlySummaries: { take: 1, orderBy: { monthName: "desc" } },
      },
      orderBy: {
        transactions: {
          _count: "desc",
        },
      },
      take: limit,
    });
  }

  /**
   * Sync instruments from NEPSE data source
   * Called by NEPSE connector service
   */
  async syncFromNepse(nepseData: CreateInstrumentDto[]) {
    const results = await this.createBatch(nepseData);
    return results;
  }

  /**
   * Get monthly performance summary for an instrument
   */
  async getMonthlyPerformance(instrumentId: string) {
    const instrument = await this.findOne(instrumentId);

    return this.prisma.monthlySummary.findMany({
      where: { companySymbol: instrument.symbol },
      orderBy: { monthName: "desc" },
    });
  }

  /**
   * Get portfolio holding summary for an instrument
   */
  async getHoldingSummary(instrumentId: string) {
    const instrument = await this.findOne(instrumentId);

    return this.prisma.portfolioHolding.findUnique({
      where: { companySymbol: instrument.symbol },
    });
  }
}
