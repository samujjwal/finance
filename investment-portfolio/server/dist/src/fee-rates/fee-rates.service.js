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
var FeeRatesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeeRatesService = exports.DEFAULT_FEE_RATES = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
exports.DEFAULT_FEE_RATES = [
    {
        instrument: "Equity",
        category: "Brokerage",
        description: "Up to Rs. 2,500",
        minAmount: 0,
        maxAmount: 2500,
        rate: 0.0036,
        remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
    },
    {
        instrument: "Equity",
        category: "Brokerage",
        description: "Rs. 2,501 to Rs. 50,000",
        minAmount: 2501,
        maxAmount: 50000,
        rate: 0.0033,
        remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
    },
    {
        instrument: "Equity",
        category: "Brokerage",
        description: "Rs. 50,001 to Rs. 5,00,000",
        minAmount: 50001,
        maxAmount: 500000,
        rate: 0.0031,
        remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
    },
    {
        instrument: "Equity",
        category: "Brokerage",
        description: "Rs. 5,00,001 to Rs. 20,00,000",
        minAmount: 500001,
        maxAmount: 2000000,
        rate: 0.0027,
        remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
    },
    {
        instrument: "Equity",
        category: "Brokerage",
        description: "Rs. 20,00,001 to Rs. 1,00,00,000",
        minAmount: 2000001,
        maxAmount: 10000000,
        rate: 0.0024,
        remarks: "Broker: 79.4%, NEPSE: 20%, SEBON: 0.6%",
    },
    {
        instrument: "Equity",
        category: "SEBONFee",
        description: "SEBON Transaction Fee",
        rate: 0.00015,
        remarks: "0.015% of transaction amount",
    },
    {
        instrument: "Equity",
        category: "DPCharge",
        description: "DP Transaction Charge",
        fixedAmount: 25,
        remarks: "Rs. 25 per stock per day",
    },
    {
        instrument: "Bond_Debenture",
        category: "Brokerage",
        description: "Rs. 5,00,000 or less",
        minAmount: 0,
        maxAmount: 500000,
        rate: 0.001,
        minFixed: 10,
        remarks: "0.10% or Rs. 10 (whichever is higher)",
    },
    {
        instrument: "Bond_Debenture",
        category: "Brokerage",
        description: "Rs. 5,00,001 to Rs. 50,00,000",
        minAmount: 500001,
        maxAmount: 5000000,
        rate: 0.0005,
    },
    {
        instrument: "Bond_Debenture",
        category: "Brokerage",
        description: "Above Rs. 50,00,000",
        minAmount: 5000001,
        rate: 0.0002,
    },
    {
        instrument: "Bond_Debenture",
        category: "SEBONFee",
        description: "SEBON Transaction Fee",
        rate: 0.0001,
        remarks: "Corporate Debenture – 0.010%",
    },
    {
        instrument: "Bond_Debenture",
        category: "DPCharge",
        description: "DP Transaction Charge",
        fixedAmount: 25,
        remarks: "Rs. 25 per stock per transfer day",
    },
    {
        instrument: "Bond_Other",
        category: "Brokerage",
        description: "Rs. 5,00,000 or less",
        minAmount: 0,
        maxAmount: 500000,
        rate: 0.0015,
        minFixed: 10,
        remarks: "0.15% or Rs. 10 (whichever is higher)",
    },
    {
        instrument: "Bond_Other",
        category: "Brokerage",
        description: "Rs. 5,00,001 to Rs. 50,00,000",
        minAmount: 500001,
        maxAmount: 5000000,
        rate: 0.0012,
    },
    {
        instrument: "Bond_Other",
        category: "Brokerage",
        description: "Above Rs. 50,00,000",
        minAmount: 5000001,
        rate: 0.001,
    },
    {
        instrument: "Bond_Other",
        category: "SEBONFee",
        description: "SEBON Transaction Fee",
        rate: 0.00005,
        remarks: "Other Securities – 0.005%",
    },
    {
        instrument: "Bond_Other",
        category: "DPCharge",
        description: "DP Transaction Charge",
        fixedAmount: 25,
        remarks: "Rs. 25 per stock per transfer day",
    },
    {
        instrument: "MeroShare",
        category: "Maintenance",
        description: "DP Annual Maintenance Fee",
        fixedAmount: 100,
        remarks: "Per Annum",
    },
    {
        instrument: "MeroShare",
        category: "Opening",
        description: "Demat Opening Fee",
        fixedAmount: 50,
        remarks: "One time",
    },
    {
        instrument: "MeroShare",
        category: "PledgeFee",
        description: "Pledge / Unpledge Fee",
        fixedAmount: 50,
        remarks: "Per Transaction",
    },
    {
        instrument: "Government",
        category: "CGT",
        description: "Individual – Long-term (holding >= 1 year)",
        rate: 0.05,
        investorType: "Individual",
        termType: "LongTerm",
        remarks: "5%",
    },
    {
        instrument: "Government",
        category: "CGT",
        description: "Individual – Short-term (holding < 1 year)",
        rate: 0.075,
        investorType: "Individual",
        termType: "ShortTerm",
        remarks: "7.5%",
    },
    {
        instrument: "Government",
        category: "CGT",
        description: "Institutional – Long-term (holding >= 1 year)",
        rate: 0.1,
        investorType: "Institutional",
        termType: "LongTerm",
        remarks: "10%",
    },
    {
        instrument: "MutualFund",
        category: "Brokerage",
        description: "Up to Rs. 5,00,000",
        minAmount: 0,
        maxAmount: 500000,
        rate: 0.0015,
    },
    {
        instrument: "MutualFund",
        category: "Brokerage",
        description: "Rs. 5,00,001 to Rs. 50,00,000",
        minAmount: 500001,
        maxAmount: 5000000,
        rate: 0.0012,
    },
    {
        instrument: "MutualFund",
        category: "Brokerage",
        description: "Above Rs. 50,00,000",
        minAmount: 5000001,
        rate: 0.001,
    },
];
function resolveInstrument(instrumentType) {
    if (!instrumentType)
        return "Equity";
    const t = instrumentType.toLowerCase();
    if (t.includes("mutual") || t.includes("fund"))
        return "MutualFund";
    if (t.includes("debenture"))
        return "Bond_Debenture";
    if (t.includes("bond") || t.includes("note"))
        return "Bond_Other";
    return "Equity";
}
let FeeRatesService = FeeRatesService_1 = class FeeRatesService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(FeeRatesService_1.name);
    }
    async onModuleInit() {
        await this.seedIfEmpty();
    }
    async seedIfEmpty() {
        const count = await this.prisma.feeRate.count();
        if (count === 0) {
            await this.prisma.feeRate.createMany({ data: exports.DEFAULT_FEE_RATES });
            this.logger.log(`Seeded ${exports.DEFAULT_FEE_RATES.length} fee rate rows`);
        }
    }
    async findAll() {
        return this.prisma.feeRate.findMany({
            where: { isActive: true },
            orderBy: [
                { instrument: "asc" },
                { category: "asc" },
                { minAmount: "asc" },
            ],
        });
    }
    async findGrouped() {
        const rows = await this.findAll();
        const grouped = {};
        for (const r of rows) {
            grouped[r.instrument] ??= {};
            grouped[r.instrument][r.category] ??= [];
            grouped[r.instrument][r.category].push(r);
        }
        return grouped;
    }
    async calculateCharges(amount, isSell = false, instrumentType) {
        const instrument = resolveInstrument(instrumentType);
        const [brokerageRows, sebonRows, dpRows] = await Promise.all([
            this.prisma.feeRate.findMany({
                where: { instrument, category: "Brokerage", isActive: true },
                orderBy: { minAmount: "asc" },
            }),
            this.prisma.feeRate.findMany({
                where: { instrument, category: "SEBONFee", isActive: true },
            }),
            this.prisma.feeRate.findMany({
                where: { instrument, category: "DPCharge", isActive: true },
            }),
        ]);
        let brokerage = 0;
        const bracket = brokerageRows.find((r) => amount >= (r.minAmount ?? 0) &&
            (r.maxAmount === null || amount <= r.maxAmount));
        if (bracket?.rate != null) {
            const computed = amount * bracket.rate;
            brokerage =
                bracket.minFixed != null
                    ? Math.max(computed, bracket.minFixed)
                    : computed;
        }
        else {
            const last = brokerageRows[brokerageRows.length - 1];
            brokerage = last?.rate != null ? amount * last.rate : amount * 0.0024;
        }
        const sebonRow = sebonRows[0];
        const sebonFee = sebonRow?.rate != null ? amount * sebonRow.rate : amount * 0.00015;
        const dpRow = dpRows[0];
        const dpCharge = dpRow?.fixedAmount ?? 25;
        const total = brokerage + sebonFee + dpCharge;
        const netAmount = isSell ? amount - total : amount + total;
        return { brokerage, sebonFee, dpCharge, total, netAmount };
    }
    async getCGTRate(holdingDays, investorType = "Individual") {
        const termType = holdingDays < 365 ? "ShortTerm" : "LongTerm";
        const row = await this.prisma.feeRate.findFirst({
            where: {
                instrument: "Government",
                category: "CGT",
                investorType,
                termType,
                isActive: true,
            },
        });
        if (row?.rate != null)
            return row.rate;
        if (investorType === "Individual") {
            return termType === "ShortTerm" ? 0.075 : 0.05;
        }
        return 0.1;
    }
    async getTaxRatesSummary() {
        const rows = await this.findAll();
        const equityBrokerage = rows
            .filter((r) => r.instrument === "Equity" && r.category === "Brokerage")
            .map((r) => ({
            description: r.description,
            rate: r.rate,
            minFixed: r.minFixed,
        }));
        const sebonRow = rows.find((r) => r.instrument === "Equity" && r.category === "SEBONFee");
        const dpRow = rows.find((r) => r.instrument === "Equity" && r.category === "DPCharge");
        const cgtRows = rows.filter((r) => r.instrument === "Government" && r.category === "CGT");
        return {
            equityBrokerage,
            SEBON_RATE: sebonRow?.rate ?? 0.00015,
            DP_CHARGE_FIXED: dpRow?.fixedAmount ?? 25,
            CGT: {
                INDIVIDUAL_SHORT_TERM: cgtRows.find((r) => r.investorType === "Individual" && r.termType === "ShortTerm")?.rate ?? 0.075,
                INDIVIDUAL_LONG_TERM: cgtRows.find((r) => r.investorType === "Individual" && r.termType === "LongTerm")?.rate ?? 0.05,
                INSTITUTIONAL: cgtRows.find((r) => r.investorType === "Institutional")?.rate ?? 0.1,
            },
        };
    }
};
exports.FeeRatesService = FeeRatesService;
exports.FeeRatesService = FeeRatesService = FeeRatesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FeeRatesService);
//# sourceMappingURL=fee-rates.service.js.map