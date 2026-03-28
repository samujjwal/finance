import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePartyDto, UpdatePartyDto } from "./dto/commercial.dto";

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters?: { isActive?: boolean }) {
    return this.prisma.customer.findMany({
      where: {
        organizationId,
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const c = await this.prisma.customer.findUnique({ where: { id } });
    if (!c) throw new NotFoundException("Customer not found");
    return c;
  }

  async create(dto: CreatePartyDto) {
    const existing = await this.prisma.customer.findUnique({
      where: {
        organizationId_code: {
          organizationId: dto.organizationId,
          code: dto.code,
        },
      },
    });
    if (existing) throw new ConflictException("Customer code already exists");
    return this.prisma.customer.create({ data: dto });
  }

  async update(id: string, dto: UpdatePartyDto) {
    await this.findOne(id);
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  /** Returns outstanding balance (sum of unpaid invoice amounts). */
  async getBalance(customerId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: { customerId, status: { in: ["POSTED", "PARTIALLY_PAID"] } },
    });
    const balance = invoices.reduce(
      (s, inv) => s + (inv.total - inv.paidAmount),
      0,
    );
    return { customerId, balance, invoiceCount: invoices.length };
  }

  async getStatement(customerId: string, from: Date, to: Date) {
    return this.prisma.invoice.findMany({
      where: {
        customerId,
        invoiceDate: { gte: from, lte: to },
      },
      include: { lines: true },
      orderBy: { invoiceDate: "asc" },
    });
  }
}

@Injectable()
export class VendorsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, filters?: { isActive?: boolean }) {
    return this.prisma.vendor.findMany({
      where: {
        organizationId,
        ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    const v = await this.prisma.vendor.findUnique({ where: { id } });
    if (!v) throw new NotFoundException("Vendor not found");
    return v;
  }

  async create(dto: CreatePartyDto) {
    const existing = await this.prisma.vendor.findUnique({
      where: {
        organizationId_code: {
          organizationId: dto.organizationId,
          code: dto.code,
        },
      },
    });
    if (existing) throw new ConflictException("Vendor code already exists");
    return this.prisma.vendor.create({ data: dto });
  }

  async update(id: string, dto: UpdatePartyDto) {
    await this.findOne(id);
    return this.prisma.vendor.update({ where: { id }, data: dto });
  }

  async getBalance(vendorId: string) {
    const bills = await this.prisma.bill.findMany({
      where: { vendorId, status: { in: ["POSTED", "PARTIALLY_PAID"] } },
    });
    const balance = bills.reduce((s, b) => s + (b.total - b.paidAmount), 0);
    return { vendorId, balance, billCount: bills.length };
  }
}
