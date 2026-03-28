import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class VatService {
  constructor(private readonly prisma: PrismaService) {}

  async getConfig(organizationId: string) {
    return this.prisma.vatConfig.findFirst({
      where: { organizationId },
    });
  }

  async configureVat(dto: {
    organizationId: string;
    registrationNo?: string;
    defaultRate?: number;
    isRegistered?: boolean;
    effectiveFrom?: string;
  }) {
    const existing = await this.prisma.vatConfig.findFirst({
      where: { organizationId: dto.organizationId },
    });
    if (existing) {
      return this.prisma.vatConfig.update({
        where: { id: existing.id },
        data: {
          ...(dto.registrationNo !== undefined && {
            registrationNo: dto.registrationNo,
          }),
          ...(dto.defaultRate !== undefined && {
            defaultRate: dto.defaultRate,
          }),
          ...(dto.isRegistered !== undefined && {
            isRegistered: dto.isRegistered,
          }),
          ...(dto.effectiveFrom && {
            effectiveFrom: new Date(dto.effectiveFrom),
          }),
        },
      });
    }
    return this.prisma.vatConfig.create({
      data: {
        organizationId: dto.organizationId,
        registrationNo: dto.registrationNo,
        defaultRate: dto.defaultRate ?? 0.13,
        isRegistered: dto.isRegistered ?? false,
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
      },
    });
  }

  calculateVat(
    amount: number,
    vatRate?: number,
  ): { taxableAmount: number; vatAmount: number; total: number } {
    const rate = vatRate ?? 0.13;
    const vatAmount = Math.round(amount * rate * 100) / 100;
    return { taxableAmount: amount, vatAmount, total: amount + vatAmount };
  }

  async generateVatReturn(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
  ) {
    const vatConfig = await this.prisma.vatConfig.findFirst({
      where: { organizationId },
    });
    if (!vatConfig)
      throw new BadRequestException(
        "VAT configuration not found for organization",
      );

    // Collect all posted invoices in period
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        status: "POSTED",
        invoiceDate: { gte: periodStart, lte: periodEnd },
      },
    });

    // Collect all posted bills in period
    const bills = await this.prisma.bill.findMany({
      where: {
        organizationId,
        status: "POSTED",
        billDate: { gte: periodStart, lte: periodEnd },
      },
    });

    const salesAmount = invoices.reduce((s, inv) => s + inv.subtotal, 0);
    const vatCollected = invoices.reduce((s, inv) => s + inv.vatAmount, 0);
    const purchaseAmount = bills.reduce((s, b) => s + b.subtotal, 0);
    const vatPaid = bills.reduce((s, b) => s + b.taxAmount, 0);
    const netVat = vatCollected - vatPaid;

    const vatReturn = await this.prisma.vatReturn.create({
      data: {
        vatConfigId: vatConfig.id,
        periodStart,
        periodEnd,
        salesAmount,
        vatCollected,
        purchaseAmount,
        vatPaid,
        netVat,
        status: "DRAFT",
      },
    });
    return {
      ...vatReturn,
      invoiceCount: invoices.length,
      billCount: bills.length,
    };
  }

  async getVatReturns(organizationId: string) {
    const vatConfig = await this.prisma.vatConfig.findFirst({
      where: { organizationId },
    });
    if (!vatConfig) return [];
    return this.prisma.vatReturn.findMany({
      where: { vatConfigId: vatConfig.id },
      orderBy: { periodEnd: "desc" },
    });
  }

  async submitVatReturn(vatReturnId: string) {
    const vr = await this.prisma.vatReturn.findUnique({
      where: { id: vatReturnId },
    });
    if (!vr) throw new NotFoundException("VAT return not found");
    if (vr.status !== "DRAFT")
      throw new BadRequestException("Only draft returns can be submitted");
    return this.prisma.vatReturn.update({
      where: { id: vatReturnId },
      data: { status: "FILED", filedAt: new Date() },
    });
  }
}
