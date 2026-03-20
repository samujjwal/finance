"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const fee_rates_service_1 = require("../fee-rates/fee-rates.service");
let TransactionsService = class TransactionsService {
    constructor(prisma, feeRates) {
        this.prisma = prisma;
        this.feeRates = feeRates;
    }
    async findAll(filters) {
        const where = {};
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
    async findOne(id) {
        const transaction = await this.prisma.transaction.findUnique({
            where: { id },
            include: {
                company: true,
            },
        });
        if (!transaction) {
            throw new common_1.NotFoundException("Transaction not found");
        }
        return transaction;
    }
    async create(createDto) {
        const company = await this.prisma.company.findUnique({
            where: { symbol: createDto.companySymbol },
        });
        if (!company) {
            throw new common_1.NotFoundException(`Company '${createDto.companySymbol}' not found`);
        }
        const data = { ...createDto };
        if (createDto.transactionType === "BUY") {
            data.purchaseQuantity = createDto.purchaseQuantity || 0;
            data.salesQuantity = 0;
            if (!data.totalPurchaseAmount &&
                data.purchaseQuantity &&
                data.purchasePricePerUnit) {
                data.totalPurchaseAmount =
                    data.purchaseQuantity * data.purchasePricePerUnit;
            }
            if (data.totalPurchaseAmount && !data.totalInvestmentCost) {
                const charges = await this.feeRates.calculateCharges(data.totalPurchaseAmount, false, company.instrumentType);
                data.purchaseCommission = data.purchaseCommission ?? charges.brokerage;
                data.purchaseDpCharges = data.purchaseDpCharges ?? charges.dpCharge;
                data.totalPurchaseCommission =
                    data.totalPurchaseCommission ?? charges.total;
                data.totalInvestmentCost =
                    data.totalPurchaseAmount +
                        (data.totalPurchaseCommission ?? charges.total);
            }
        }
        else {
            data.salesQuantity = createDto.salesQuantity || 0;
            data.purchaseQuantity = 0;
            if (!data.totalSalesAmount &&
                data.salesQuantity &&
                data.salesPricePerUnit) {
                data.totalSalesAmount = data.salesQuantity * data.salesPricePerUnit;
            }
            if (data.totalSalesAmount && !data.totalSalesCommission) {
                const charges = await this.feeRates.calculateCharges(data.totalSalesAmount, true, company.instrumentType);
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
    async update(id, updateDto) {
        const transaction = await this.findOne(id);
        if (updateDto.companySymbol &&
            updateDto.companySymbol !== transaction.companySymbol) {
            const company = await this.prisma.company.findUnique({
                where: { symbol: updateDto.companySymbol },
            });
            if (!company) {
                throw new common_1.NotFoundException(`Company '${updateDto.companySymbol}' not found`);
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
    async remove(id) {
        await this.findOne(id);
        return this.prisma.transaction.delete({
            where: { id },
        });
    }
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fee_rates_service_1.FeeRatesService])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map