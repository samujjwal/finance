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
exports.FeeRatesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const fee_rates_service_1 = require("./fee-rates.service");
let FeeRatesController = class FeeRatesController {
    constructor(feeRatesService) {
        this.feeRatesService = feeRatesService;
    }
    async findAll() {
        return {
            success: true,
            data: await this.feeRatesService.findAll(),
        };
    }
    async findGrouped() {
        return {
            success: true,
            data: await this.feeRatesService.findGrouped(),
        };
    }
    async getSummary() {
        return {
            success: true,
            data: await this.feeRatesService.getTaxRatesSummary(),
        };
    }
};
exports.FeeRatesController = FeeRatesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all active fee/tax rates" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeeRatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("grouped"),
    (0, swagger_1.ApiOperation)({
        summary: "Get fee/tax rates grouped by instrument and category",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeeRatesController.prototype, "findGrouped", null);
__decorate([
    (0, common_1.Get)("summary"),
    (0, swagger_1.ApiOperation)({
        summary: "Get structured summary of tax rates (replaces hard-coded constants)",
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FeeRatesController.prototype, "getSummary", null);
exports.FeeRatesController = FeeRatesController = __decorate([
    (0, swagger_1.ApiTags)("fee-rates"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)("fee-rates"),
    __metadata("design:paramtypes", [fee_rates_service_1.FeeRatesService])
], FeeRatesController);
//# sourceMappingURL=fee-rates.controller.js.map