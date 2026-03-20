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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const reports_service_1 = require("./reports.service");
let ReportsController = class ReportsController {
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getMonthly() {
        return { success: true, data: await this.reportsService.getMonthly() };
    }
    async getPerformance() {
        return { success: true, data: await this.reportsService.getPerformance() };
    }
    async generatePortfolioReport(body) {
        return {
            success: true,
            data: await this.reportsService.generatePortfolioReport(body),
        };
    }
    async generateSectorAnalysis(body) {
        return {
            success: true,
            data: await this.reportsService.generateSectorAnalysis(body),
        };
    }
    async exportData(body) {
        return { success: true, data: await this.reportsService.exportData(body) };
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)("monthly"),
    (0, swagger_1.ApiOperation)({ summary: "Get monthly summary" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getMonthly", null);
__decorate([
    (0, common_1.Get)("performance"),
    (0, swagger_1.ApiOperation)({ summary: "Get monthly performance" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getPerformance", null);
__decorate([
    (0, common_1.Post)("portfolio"),
    (0, swagger_1.ApiOperation)({ summary: "Generate portfolio report" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generatePortfolioReport", null);
__decorate([
    (0, common_1.Post)("sectors"),
    (0, swagger_1.ApiOperation)({ summary: "Generate sector analysis" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generateSectorAnalysis", null);
__decorate([
    (0, common_1.Post)("export"),
    (0, swagger_1.ApiOperation)({ summary: "Export data" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "exportData", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)("reports"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)("reports"),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map