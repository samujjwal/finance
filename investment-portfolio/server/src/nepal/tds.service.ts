import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/** TDS sections for Nepal — Income Tax Act 2058 */
export const NEPAL_TDS_SECTIONS = {
  "87": { description: "Contract payments", rate: 1.5 },
  "87A": { description: "Service fees (companies)", rate: 15 },
  "88": { description: "Service fees (individuals)", rate: 15 },
  "88KHA": { description: "Royalties", rate: 15 },
  "92_1": { description: "Rent (individuals)", rate: 10 },
  "92_2": { description: "Investment income (interest)", rate: 5 },
  "92_3": { description: "Dividend", rate: 5 },
} as const;

@Injectable()
export class TdsService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(organizationId: string) {
    return this.prisma.tdsConfig.findMany({
      where: { organizationId, isActive: true },
    });
  }

  async configureTdsSection(dto: {
    organizationId: string;
    section: string;
    description: string;
    rate: number;
    effectiveFrom: string;
  }) {
    return this.prisma.tdsConfig.create({
      data: {
        organizationId: dto.organizationId,
        section: dto.section,
        description: dto.description,
        rate: dto.rate,
        effectiveFrom: new Date(dto.effectiveFrom),
        isActive: true,
      },
    });
  }

  calculateTds(
    amount: number,
    section: string,
  ): { tdsAmount: number; netAmount: number; rate: number } {
    const knownSection =
      NEPAL_TDS_SECTIONS[section as keyof typeof NEPAL_TDS_SECTIONS];
    const rate = knownSection?.rate ?? 0;
    const tdsAmount = Math.round(amount * rate) / 100;
    return { tdsAmount, netAmount: amount - tdsAmount, rate };
  }

  async recordTdsDeduction(dto: {
    organizationId: string;
    vendorId: string;
    tdsConfigId: string;
    section: string;
    paymentAmount: number;
    tdsAmount: number;
    certificateNo?: string;
    paymentDate: string;
    fiscalYear: string;
    createdBy: string;
  }) {
    return this.prisma.tdsDeduction.create({
      data: {
        organizationId: dto.organizationId,
        vendorId: dto.vendorId,
        tdsConfigId: dto.tdsConfigId,
        section: dto.section,
        paymentAmount: dto.paymentAmount,
        tdsAmount: dto.tdsAmount,
        certificateNo: dto.certificateNo,
        paymentDate: new Date(dto.paymentDate),
        fiscalYear: dto.fiscalYear,
        createdBy: dto.createdBy,
      },
    });
  }

  async getDeductions(organizationId: string, fiscalYear?: string) {
    return this.prisma.tdsDeduction.findMany({
      where: { organizationId, ...(fiscalYear && { fiscalYear }) },
      include: { vendor: true },
      orderBy: { paymentDate: "desc" },
    });
  }

  async getSummaryBySections(organizationId: string, fiscalYear: string) {
    const deductions = await this.prisma.tdsDeduction.findMany({
      where: { organizationId, fiscalYear },
    });

    const bySection = deductions.reduce(
      (
        acc: Record<string, { total: number; tds: number; count: number }>,
        d,
      ) => {
        if (!acc[d.section]) acc[d.section] = { total: 0, tds: 0, count: 0 };
        acc[d.section].total += d.paymentAmount;
        acc[d.section].tds += d.tdsAmount;
        acc[d.section].count++;
        return acc;
      },
      {},
    );
    return bySection;
  }

  async generateTdsCertificate(deductionId: string) {
    const deduction = await this.prisma.tdsDeduction.findUnique({
      where: { id: deductionId },
      include: { vendor: true },
    });
    if (!deduction) throw new NotFoundException("TDS deduction not found");

    return {
      certificateNumber:
        deduction.certificateNo ??
        `TDS-${deductionId.slice(0, 8).toUpperCase()}`,
      deduction,
      generatedAt: new Date(),
    };
  }
}
