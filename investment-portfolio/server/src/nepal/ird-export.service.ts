import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class IrdExportService {
  constructor(private readonly prisma: PrismaService) {}

  /** Sales Register — IRD format for VAT annex */
  async exportSalesRegister(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<string> {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        status: "POSTED",
        invoiceDate: { gte: periodStart, lte: periodEnd },
      },
      include: { customer: true },
      orderBy: { invoiceDate: "asc" },
    });

    const header =
      "InvoiceNo,InvoiceDate,CustomerName,CustomerPAN,TaxableAmount,VATAmount,TotalAmount";
    const lines = invoices.map((inv) =>
      [
        inv.invoiceNumber,
        inv.invoiceDate.toISOString().split("T")[0],
        `"${inv.customer?.name ?? ""}"`,
        inv.customer?.panNumber ?? "",
        inv.subtotal,
        inv.vatAmount,
        inv.total,
      ].join(","),
    );
    return [header, ...lines].join("\n");
  }

  /** Purchase Register — IRD format for input VAT */
  async exportPurchaseRegister(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<string> {
    const bills = await this.prisma.bill.findMany({
      where: {
        organizationId,
        status: "POSTED",
        billDate: { gte: periodStart, lte: periodEnd },
      },
      include: { vendor: true },
      orderBy: { billDate: "asc" },
    });

    const header =
      "BillNo,BillDate,VendorName,VendorPAN,TaxableAmount,VATAmount,TotalAmount";
    const lines = bills.map((b) =>
      [
        b.billNumber,
        b.billDate.toISOString().split("T")[0],
        `"${b.vendor?.name ?? ""}"`,
        b.vendor?.panNumber ?? "",
        b.subtotal,
        b.taxAmount,
        b.total,
      ].join(","),
    );
    return [header, ...lines].join("\n");
  }

  /** TDS Register — for annual filing. fiscalYear is a string like "2080/81" */
  async exportTdsRegister(
    organizationId: string,
    fiscalYear: string,
  ): Promise<string> {
    const deductions = await this.prisma.tdsDeduction.findMany({
      where: { organizationId, fiscalYear },
      include: { vendor: true },
      orderBy: { paymentDate: "asc" },
    });

    const header =
      "Section,PaymentDate,VendorName,VendorPAN,PaymentAmount,TDSAmount,NetAmount";
    const lines = deductions.map((d) =>
      [
        d.section,
        d.paymentDate.toISOString().split("T")[0],
        `"${d.vendor?.name ?? ""}"`,
        d.vendor?.panNumber ?? "",
        d.paymentAmount,
        d.tdsAmount,
        d.paymentAmount - d.tdsAmount,
      ].join(","),
    );
    return [header, ...lines].join("\n");
  }
}
