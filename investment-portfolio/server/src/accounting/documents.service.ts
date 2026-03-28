import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInvoiceDto, CreateBillDto } from "./dto/commercial.dto";
import { JournalsService } from "./journals.service";

function computeInvoiceTotals(
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    taxAmount?: number;
    vatAmount?: number;
  }[],
) {
  let subtotal = 0,
    taxAmount = 0,
    vatAmount = 0;
  const computed = lines.map((l) => {
    const amount = l.quantity * l.unitPrice;
    subtotal += amount;
    taxAmount += l.taxAmount ?? 0;
    vatAmount += l.vatAmount ?? 0;
    return { ...l, amount };
  });
  return {
    computed,
    subtotal,
    taxAmount,
    vatAmount,
    total: subtotal + taxAmount + vatAmount,
  };
}

function computeBillTotals(
  lines: {
    description: string;
    quantity: number;
    unitPrice: number;
    tdsSection?: string;
    tdsAmount?: number;
  }[],
) {
  let subtotal = 0,
    tdsAmount = 0;
  const computed = lines.map((l) => {
    const amount = l.quantity * l.unitPrice;
    subtotal += amount;
    tdsAmount += l.tdsAmount ?? 0;
    return { ...l, amount };
  });
  return { computed, subtotal, tdsAmount, total: subtotal };
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journals: JournalsService,
  ) {}

  private async getNextInvoiceNumber(organizationId: string): Promise<string> {
    const prefix = "INV-";
    const last = await this.prisma.invoice.findFirst({
      where: { organizationId, invoiceNumber: { startsWith: prefix } },
      orderBy: { invoiceNumber: "desc" },
    });
    const seq = last ? parseInt(last.invoiceNumber.replace(prefix, "")) + 1 : 1;
    return `${prefix}${String(seq).padStart(6, "0")}`;
  }

  async findAll(
    organizationId: string,
    filters?: {
      customerId?: string;
      status?: string;
      from?: string;
      to?: string;
    },
  ) {
    return this.prisma.invoice.findMany({
      where: {
        organizationId,
        ...(filters?.customerId && { customerId: filters.customerId }),
        ...(filters?.status && { status: filters.status }),
        ...(filters?.from &&
          filters?.to && {
            invoiceDate: {
              gte: new Date(filters.from),
              lte: new Date(filters.to),
            },
          }),
      },
      include: { customer: true, lines: true },
      orderBy: { invoiceDate: "desc" },
    });
  }

  async findOne(id: string) {
    const inv = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, lines: true },
    });
    if (!inv) throw new NotFoundException("Invoice not found");
    return inv;
  }

  async create(dto: CreateInvoiceDto, createdBy: string) {
    const invoiceNumber = await this.getNextInvoiceNumber(dto.organizationId);
    const { computed, subtotal, taxAmount, vatAmount, total } =
      computeInvoiceTotals(dto.lines);

    return this.prisma.invoice.create({
      data: {
        organizationId: dto.organizationId,
        customerId: dto.customerId,
        invoiceNumber,
        invoiceDate: new Date(dto.invoiceDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        subtotal,
        taxAmount,
        vatAmount,
        total,
        narration: dto.narration,
        status: "DRAFT",
        createdBy,
        lines: {
          create: computed.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
            taxAmount: l.taxAmount ?? 0,
            vatAmount: l.vatAmount ?? 0,
          })),
        },
      },
      include: { lines: true },
    });
  }

  /** Post an invoice — creates the corresponding journal entry. */
  async post(id: string, postedBy: string) {
    const inv = await this.findOne(id);
    if (inv.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT invoices can be posted");

    // Look up AR and Sales ledger accounts (must exist)
    const arAccount = await this.prisma.ledgerAccount.findFirst({
      where: { organizationId: inv.organizationId, code: "AR" },
    });
    const salesAccount = await this.prisma.ledgerAccount.findFirst({
      where: { organizationId: inv.organizationId, code: "SALES" },
    });

    let journalEntryId: string | undefined;
    if (arAccount && salesAccount) {
      const je = await this.journals.create(
        {
          organizationId: inv.organizationId,
          entryDate: inv.invoiceDate.toISOString(),
          reference: inv.invoiceNumber,
          narration: `Invoice ${inv.invoiceNumber}`,
          lines: [
            { ledgerAccountId: arAccount.id, debit: inv.total, credit: 0 },
            {
              ledgerAccountId: salesAccount.id,
              debit: 0,
              credit: inv.subtotal,
            },
            ...(inv.vatAmount > 0
              ? [
                  {
                    ledgerAccountId:
                      (
                        await this.prisma.ledgerAccount.findFirst({
                          where: {
                            organizationId: inv.organizationId,
                            code: "VAT-PAY",
                          },
                        })
                      )?.id ?? salesAccount.id,
                    debit: 0,
                    credit: inv.vatAmount,
                    narration: "VAT on sales",
                  },
                ]
              : []),
          ],
        },
        postedBy,
      );
      await this.journals.post(je.id, postedBy);
      journalEntryId = je.id;
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: "POSTED",
        postedBy,
        postedAt: new Date(),
        journalEntryId,
      },
    });
  }

  async applyPayment(invoiceId: string, paymentAmount: number) {
    const inv = await this.findOne(invoiceId);
    if (!["POSTED", "PARTIALLY_PAID"].includes(inv.status)) {
      throw new BadRequestException(
        "Payment can only be applied to posted invoices",
      );
    }
    const newPaid = inv.paidAmount + paymentAmount;
    if (newPaid > inv.total)
      throw new BadRequestException("Payment exceeds invoice total");

    const status = newPaid >= inv.total ? "PAID" : "PARTIALLY_PAID";
    return this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { paidAmount: newPaid, status },
    });
  }
}

@Injectable()
export class BillsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly journals: JournalsService,
  ) {}

  private async getNextBillNumber(organizationId: string): Promise<string> {
    const prefix = "BILL-";
    const last = await this.prisma.bill.findFirst({
      where: { organizationId, billNumber: { startsWith: prefix } },
      orderBy: { billNumber: "desc" },
    });
    const seq = last ? parseInt(last.billNumber.replace(prefix, "")) + 1 : 1;
    return `${prefix}${String(seq).padStart(6, "0")}`;
  }

  async findAll(
    organizationId: string,
    filters?: { vendorId?: string; status?: string },
  ) {
    return this.prisma.bill.findMany({
      where: {
        organizationId,
        ...(filters?.vendorId && { vendorId: filters.vendorId }),
        ...(filters?.status && { status: filters.status }),
      },
      include: { vendor: true, lines: true },
      orderBy: { billDate: "desc" },
    });
  }

  async findOne(id: string) {
    const bill = await this.prisma.bill.findUnique({
      where: { id },
      include: { vendor: true, lines: true },
    });
    if (!bill) throw new NotFoundException("Bill not found");
    return bill;
  }

  async create(dto: CreateBillDto, createdBy: string) {
    const billNumber = await this.getNextBillNumber(dto.organizationId);
    const { computed, subtotal, tdsAmount, total } = computeBillTotals(
      dto.lines,
    );

    return this.prisma.bill.create({
      data: {
        organizationId: dto.organizationId,
        vendorId: dto.vendorId,
        billNumber,
        billDate: new Date(dto.billDate),
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        subtotal,
        tdsAmount,
        total,
        narration: dto.narration,
        status: "DRAFT",
        createdBy,
        lines: {
          create: computed.map((l) => ({
            description: l.description,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            amount: l.amount,
            tdsSection: l.tdsSection,
            tdsAmount: l.tdsAmount ?? 0,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async post(id: string, postedBy: string) {
    const bill = await this.findOne(id);
    if (bill.status !== "DRAFT")
      throw new BadRequestException("Only DRAFT bills can be posted");

    // Look up AP and Expense ledger accounts (must exist)
    const apAccount = await this.prisma.ledgerAccount.findFirst({
      where: { organizationId: bill.organizationId, code: "AP" },
    });
    const expenseAccount = await this.prisma.ledgerAccount.findFirst({
      where: { organizationId: bill.organizationId, code: "EXPENSE" },
    });

    let journalEntryId: string | undefined;
    if (apAccount && expenseAccount) {
      const je = await this.journals.create(
        {
          organizationId: bill.organizationId,
          entryDate: bill.billDate.toISOString(),
          reference: bill.billNumber,
          narration: `Bill ${bill.billNumber}`,
          lines: [
            {
              ledgerAccountId: expenseAccount.id,
              debit: bill.subtotal,
              credit: 0,
            },
            ...(bill.tdsAmount > 0
              ? [
                  {
                    ledgerAccountId:
                      (
                        await this.prisma.ledgerAccount.findFirst({
                          where: {
                            organizationId: bill.organizationId,
                            code: "TDS-REC",
                          },
                        })
                      )?.id ?? expenseAccount.id,
                    debit: bill.tdsAmount,
                    credit: 0,
                    narration: "TDS receivable on purchase",
                  },
                ]
              : []),
            {
              ledgerAccountId: apAccount.id,
              debit: 0,
              credit: bill.total,
            },
          ],
        },
        postedBy,
      );
      await this.journals.post(je.id, postedBy);
      journalEntryId = je.id;
    }

    return this.prisma.bill.update({
      where: { id },
      data: {
        status: "POSTED",
        journalEntryId,
      },
    });
  }
}
