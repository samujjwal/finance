import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.company.findMany({
      orderBy: { symbol: 'asc' },
    });
  }

  async findOne(symbol: string) {
    const company = await this.prisma.company.findUnique({
      where: { symbol },
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    return company;
  }

  async create(createCompanyDto: CreateCompanyDto) {
    // Check if company already exists
    const existingCompany = await this.prisma.company.findUnique({
      where: { symbol: createCompanyDto.symbol },
    });

    if (existingCompany) {
      throw new ConflictException('Company with this symbol already exists');
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
      const existing = await this.prisma.company.findUnique({ where: { symbol: dto.symbol } });
      if (existing) {
        await this.prisma.company.update({ where: { symbol: dto.symbol }, data: dto });
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
      throw new ConflictException('Cannot delete company with existing transactions');
    }

    // Delete portfolio holdings (FK constraint — no cascade in schema)
    await this.prisma.portfolioHolding.deleteMany({ where: { companySymbol: symbol } });

    return this.prisma.company.delete({
      where: { symbol },
    });
  }
}
