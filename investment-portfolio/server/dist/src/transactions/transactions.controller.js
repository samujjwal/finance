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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const transactions_service_1 = require("./transactions.service");
const fee_rates_service_1 = require("../fee-rates/fee-rates.service");
const transaction_dto_1 = require("./dto/transaction.dto");
let TransactionsController = class TransactionsController {
    constructor(transactionsService, feeRatesService) {
        this.transactionsService = transactionsService;
        this.feeRatesService = feeRatesService;
    }
    async getTaxRates() {
        return {
            success: true,
            data: await this.feeRatesService.getTaxRatesSummary(),
        };
    }
    async calculateCharges(body) {
        const { transactionType, amount, instrumentType } = body;
        if (!transactionType || !["BUY", "SELL"].includes(transactionType)) {
            throw new common_1.BadRequestException("transactionType must be BUY or SELL");
        }
        if (!amount || amount <= 0) {
            throw new common_1.BadRequestException("amount must be a positive number");
        }
        const charges = await this.feeRatesService.calculateCharges(amount, transactionType === "SELL", instrumentType);
        return {
            success: true,
            data: {
                brokerage: charges.brokerage,
                dpCharges: charges.dpCharge,
                sebonFee: charges.sebonFee,
                totalCharges: charges.total,
                netAmount: charges.netAmount,
            },
        };
    }
    async calculateCapitalGains(body) {
        const { sellAmount, costBasis, purchaseDate, sellDate, investorType } = body;
        if (!sellAmount || !costBasis || !purchaseDate || !sellDate) {
            throw new common_1.BadRequestException("sellAmount, costBasis, purchaseDate and sellDate are required");
        }
        const buyDate = new Date(purchaseDate);
        const saleDate = new Date(sellDate);
        const holdingPeriodDays = Math.floor((saleDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24));
        const isLongTerm = holdingPeriodDays >= 365;
        const applicableTaxRate = await this.feeRatesService.getCGTRate(holdingPeriodDays, investorType ?? "Individual");
        const capitalGains = Math.max(0, sellAmount - costBasis);
        const capitalLoss = costBasis > sellAmount ? costBasis - sellAmount : 0;
        const taxAmount = capitalGains * applicableTaxRate;
        return {
            success: true,
            data: {
                capitalGains,
                capitalLoss,
                holdingPeriodDays,
                isLongTerm,
                applicableTaxRate,
                taxAmount,
            },
        };
    }
    async findAll(filters) {
        return {
            success: true,
            data: await this.transactionsService.findAll(filters),
        };
    }
    async create(createDto) {
        return {
            success: true,
            data: await this.transactionsService.create(createDto),
        };
    }
    async createBulk(createDtos) {
        const results = [];
        for (const dto of createDtos) {
            results.push(await this.transactionsService.create(dto));
        }
        return {
            success: true,
            data: results,
        };
    }
    async findOne(id) {
        return {
            success: true,
            data: await this.transactionsService.findOne(id),
        };
    }
    async update(id, updateDto) {
        return {
            success: true,
            data: await this.transactionsService.update(id, updateDto),
        };
    }
    async remove(id) {
        await this.transactionsService.remove(id);
        return {
            success: true,
            message: "Transaction deleted successfully",
        };
    }
};
exports.TransactionsController = TransactionsController;
__decorate([
    (0, common_1.Get)("tax-rates"),
    (0, swagger_1.ApiOperation)({ summary: "Get Nepal NEPSE tax rates (from DB)" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "getTaxRates", null);
__decorate([
    (0, common_1.Post)("calculate-charges"),
    (0, swagger_1.ApiOperation)({
        summary: "Calculate brokerage, DP charges and SEBON fee for a transaction",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "calculateCharges", null);
__decorate([
    (0, common_1.Post)("calculate-capital-gains"),
    (0, swagger_1.ApiOperation)({
        summary: "Calculate capital gains tax for a SELL transaction",
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "calculateCapitalGains", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all transactions" }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.TransactionFilterDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create new transaction" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [transaction_dto_1.CreateTransactionDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("bulk"),
    (0, swagger_1.ApiOperation)({ summary: "Create multiple transactions" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Array]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "createBulk", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get transaction by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update transaction" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, transaction_dto_1.UpdateTransactionDto]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete transaction" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TransactionsController.prototype, "remove", null);
exports.TransactionsController = TransactionsController = __decorate([
    (0, swagger_1.ApiTags)("transactions"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("transactions"),
    __metadata("design:paramtypes", [transactions_service_1.TransactionsService,
        fee_rates_service_1.FeeRatesService])
], TransactionsController);
//# sourceMappingURL=transactions.controller.js.map