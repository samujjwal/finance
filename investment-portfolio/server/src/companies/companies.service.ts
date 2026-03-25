import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateCompanyDto, UpdateCompanyDto } from "./dto/company.dto";

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { symbol: "asc" },
    });
  }

  async findOne(symbol: string) {
    const company = await this.prisma.company.findUnique({
      where: { symbol },
    });

    if (!company) {
      throw new NotFoundException("Company not found");
    }

    return company;
  }

  async create(createCompanyDto: CreateCompanyDto) {
    // Check if company already exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { symbol: createCompanyDto.symbol },
    });

    if (existingCompany) {
      throw new ConflictException("Company with this symbol already exists");
    }

    return this.prisma.company.create({
      data: createCompanyDto,
    });
  }

  /** Upsert: create if not exists, update if exists. Used by bulk import. */
  async upsert(createCompanyDto: CreateCompanyDto) {
    return this.prisma.company.upsert({
      where: { symbol: createCompanyDto.symbol },
      update: {
        companyName: createCompanyDto.companyName,
        symbol2: createCompanyDto.symbol2,
        sector: createCompanyDto.sector,
        symbol3: createCompanyDto.symbol3,
        instrumentType: createCompanyDto.instrumentType,
      },
      create: createCompanyDto,
    });
  }

  /** Bulk upsert companies – returns { imported, updated } counts. */
  async upsertBulk(dtos: CreateCompanyDto[]) {
    let created = 0;
    let updated = 0;
    for (const dto of dtos) {
      const existing = await this.prisma.company.findUnique({
        where: { symbol: dto.symbol },
      });
      if (existing) {
        await this.prisma.company.update({
          where: { symbol: dto.symbol },
          data: dto,
        });
        updated++;
      } else {
        await this.prisma.company.create({ data: dto });
        created++;
      }
    }
    return { created, updated };
  }

  async update(symbol: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.findOne(symbol);

    return this.prisma.company.update({
      where: { symbol },
      data: updateCompanyDto,
    });
  }

  async remove(symbol: string) {
    const company = await this.findOne(symbol);

    // Check if company has transactions
    const transactionCount = await this.prisma.transaction.count({
      where: { companySymbol: symbol },
    });

    if (transactionCount > 0) {
      throw new ConflictException(
        "Cannot delete company with existing transactions",
      );
    }

    // Delete portfolio holdings (FK constraint — no cascade in schema)
    await this.prisma.portfolioHolding.deleteMany({
      where: { companySymbol: symbol },
    });

    return this.prisma.company.delete({
      where: { symbol },
    });
  }

  /**
   * Check for potential duplicate companies
   */
  async checkForDuplicates(symbol: string, companyName?: string) {
    const duplicates: Array<{
      symbol: string;
      companyName: string;
      reason: string;
    }> = [];

    // Check exact symbol match
    const existingBySymbol = await this.prisma.company.findUnique({
      where: { symbol },
    });
    if (existingBySymbol) {
      duplicates.push({
        symbol: existingBySymbol.symbol,
        companyName: existingBySymbol.companyName,
        reason: "Exact symbol match",
      });
    }

    // Check symbol2 and symbol3 variations
    const symbolVariations = await this.prisma.company.findMany({
      where: {
        OR: [{ symbol2: symbol }, { symbol3: symbol }],
      },
    });
    symbolVariations.forEach((c) => {
      duplicates.push({
        symbol: c.symbol,
        companyName: c.companyName,
        reason: `Symbol variation (symbol2/symbol3 matches)`,
      });
    });

    // Check company name similarity (if provided)
    if (companyName) {
      const normalizedName = companyName.toLowerCase().trim();
      const nameMatches = await this.prisma.company.findMany({
        where: {
          companyName: {
            contains: normalizedName,
          },
        },
      });
      nameMatches.forEach((c) => {
        if (c.symbol !== symbol) {
          duplicates.push({
            symbol: c.symbol,
            companyName: c.companyName,
            reason: "Similar company name",
          });
        }
      });
    }

    return {
      hasDuplicates: duplicates.length > 0,
      duplicates,
      totalDuplicates: duplicates.length,
    };
  }

  /**
   * Bulk import with duplicate detection
   */
  async upsertBulkWithDuplicateDetection(dtos: CreateCompanyDto[]) {
    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      duplicates: [] as Array<{
        input: CreateCompanyDto;
        duplicates: Array<{
          symbol: string;
          companyName: string;
          reason: string;
        }>;
      }>,
    };

    for (const dto of dtos) {
      // Check for duplicates
      const duplicateCheck = await this.checkForDuplicates(
        dto.symbol,
        dto.companyName,
      );

      if (duplicateCheck.hasDuplicates && !dto.forceImport) {
        results.skipped++;
        results.duplicates.push({
          input: dto,
          duplicates: duplicateCheck.duplicates,
        });
        continue;
      }

      const existing = await this.prisma.company.findUnique({
        where: { symbol: dto.symbol },
      });
      if (existing) {
        await this.prisma.company.update({
          where: { symbol: dto.symbol },
          data: dto,
        });
        results.updated++;
      } else {
        await this.prisma.company.create({ data: dto });
        results.created++;
      }
    }

    return results;
  }
}
