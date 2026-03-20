import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FeeRatesService } from "../fee-rates/fee-rates.service";
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionFilterDto,
} from "./dto/transaction.dto";

@Injectable()
export class TransactionsService {
  constructor(
    private prisma: PrismaService,
    private feeRates: FeeRatesService,
  ) {}

  async findAll(filters?: TransactionFilterDto) {
    const where: any = {};

    if (filters?.companySymbol) {
      where.companySymbol = filters.companySymbol;
    }

    if (filters?.transactionType) {
      where.transactionType = filters.transactionType;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.transactionDate = {};
      if (filters.dateFrom) {
        where.transactionDate.gte = filters.dateFrom;
      }
      if (filters.dateTo) {
        where.transactionDate.lte = filters.dateTo;
      }
    }

    return this.prisma.transaction.findMany({
      where,
      orderBy: { transactionDate: "desc" },
      include: {
        company: {
          select: {
            symbol: true,
            companyName: true,
            sector: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        company: true,
      },
    });

    if (!transaction) {
      throw new NotFoundException("Transaction not found");
    }

    return transaction;
  }

  async create(createDto: CreateTransactionDto) {
    // Validate that the company exists
    const company = await this.prisma.company.findUnique({
      where: { symbol: createDto.companySymbol },
    });

    if (!company) {
      throw new NotFoundException(
        `Company '${createDto.companySymbol}' not found`,
      );
    }

    // Auto-calculate totals if not provided
    const data: any = { ...createDto };
    if (createDto.transactionType === "BUY") {
      data.purchaseQuantity = createDto.purchaseQuantity || 0;
      data.salesQuantity = 0;
      if (
        !data.totalPurchaseAmount &&
        data.purchaseQuantity &&
        data.purchasePricePerUnit
      ) {
        data.totalPurchaseAmount =
          data.purchaseQuantity * data.purchasePricePerUnit;
      }
      // Auto-fill commission/charge fields when not provided by the client
      if (data.totalPurchaseAmount && !data.totalInvestmentCost) {
        const charges = await this.feeRates.calculateCharges(
          data.totalPurchaseAmount,
          false,
          company.instrumentType,
        );
        data.purchaseCommission = data.purchaseCommission ?? charges.brokerage;
        data.purchaseDpCharges = data.purchaseDpCharges ?? charges.dpCharge;
        data.totalPurchaseCommission =
          data.totalPurchaseCommission ?? charges.total;
        data.totalInvestmentCost =
          data.totalPurchaseAmount +
          (data.totalPurchaseCommission ?? charges.total);
      }
    } else {
      data.salesQuantity = createDto.salesQuantity || 0;
      data.purchaseQuantity = 0;
      if (
        !data.totalSalesAmount &&
        data.salesQuantity &&
        data.salesPricePerUnit
      ) {
        data.totalSalesAmount = data.salesQuantity * data.salesPricePerUnit;
      }
      // Auto-fill sales charge fields when not provided
      if (data.totalSalesAmount && !data.totalSalesCommission) {
        const charges = await this.feeRates.calculateCharges(
          data.totalSalesAmount,
          true,
          company.instrumentType,
        );
        data.salesCommission = data.salesCommission ?? charges.brokerage;
        data.salesDpCharges = data.salesDpCharges ?? charges.dpCharge;
        data.totalSalesCommission = data.totalSalesCommission ?? charges.total;
        if (!data.netReceivables) {
          data.netReceivables =
            data.totalSalesAmount -
            (data.totalSalesCommission ?? charges.total);
        }
      }
    }

    return this.prisma.transaction.create({
      data,
      include: {
        company: true,
      },
    });
  }

  async update(id: string, updateDto: UpdateTransactionDto) {
    const transaction = await this.findOne(id);

    // If updating company symbol, validate it exists
    if (
      updateDto.companySymbol &&
      updateDto.companySymbol !== transaction.companySymbol
    ) {
      const company = await this.prisma.company.findUnique({
        where: { symbol: updateDto.companySymbol },
      });

      if (!company) {
        throw new NotFoundException(
          `Company '${updateDto.companySymbol}' not found`,
        );
      }
    }

    return this.prisma.transaction.update({
      where: { id },
      data: updateDto,
      include: {
        company: true,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    return this.prisma.transaction.delete({
      where: { id },
    });
  }
}
