import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateFiscalYearDto } from "./dto/fiscal-year.dto";

@Injectable()
export class FiscalYearService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.fiscalYear.findMany({
      where: { organizationId },
      orderBy: { startDate: "desc" },
    });
  }

  async findOne(id: string) {
    const fy = await this.prisma.fiscalYear.findUnique({ where: { id } });
    if (!fy) throw new NotFoundException("Fiscal year not found");
    return fy;
  }

  async getCurrent(organizationId: string) {
    const now = new Date();
    return this.prisma.fiscalYear.findFirst({
      where: {
        organizationId,
        startDate: { lte: now },
        endDate: { gte: now },
        isClosed: false,
      },
    });
  }

  async create(dto: CreateFiscalYearDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (start >= end) {
      throw new BadRequestException("startDate must be before endDate");
    }

    // Check overlap with existing fiscal years
    const overlap = await this.prisma.fiscalYear.findFirst({
      where: {
        organizationId: dto.organizationId,
        OR: [{ startDate: { lte: end }, endDate: { gte: start } }],
      },
    });
    if (overlap) {
      throw new BadRequestException(
        `Fiscal year overlaps with existing year "${overlap.name}"`,
      );
    }

    return this.prisma.fiscalYear.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        startDate: start,
        endDate: end,
      },
    });
  }

  /** Close a fiscal year — locks it and prevents new postings. Admin only. */
  async close(id: string, closedBy: string) {
    const fy = await this.findOne(id);
    if (fy.isClosed)
      throw new BadRequestException("Fiscal year is already closed");

    // Ensure no DRAFT journal entries remain in this period
    const draftEntries = await this.prisma.journalEntry.count({
      where: { fiscalYearId: id, status: "DRAFT" },
    });
    if (draftEntries > 0) {
      throw new BadRequestException(
        `Cannot close: ${draftEntries} draft journal entries exist in this period`,
      );
    }

    return this.prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: true, closedBy, closedAt: new Date() },
    });
  }

  /** Reopen a fiscal year — Admin only, creates audit record. */
  async reopen(id: string, reopenedBy: string) {
    const fy = await this.findOne(id);
    if (!fy.isClosed)
      throw new BadRequestException("Fiscal year is not closed");

    return this.prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: false, closedBy: null, closedAt: null },
    });
  }
}
