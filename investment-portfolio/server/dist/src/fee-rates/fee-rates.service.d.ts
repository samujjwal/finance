import { OnModuleInit } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
export declare const DEFAULT_FEE_RATES: ({
    instrument: string;
    category: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    rate: number;
    remarks: string;
    fixedAmount?: undefined;
    minFixed?: undefined;
    investorType?: undefined;
    termType?: undefined;
} | {
    instrument: string;
    category: string;
    description: string;
    rate: number;
    remarks: string;
    minAmount?: undefined;
    maxAmount?: undefined;
    fixedAmount?: undefined;
    minFixed?: undefined;
    investorType?: undefined;
    termType?: undefined;
} | {
    instrument: string;
    category: string;
    description: string;
    fixedAmount: number;
    remarks: string;
    minAmount?: undefined;
    maxAmount?: undefined;
    rate?: undefined;
    minFixed?: undefined;
    investorType?: undefined;
    termType?: undefined;
} | {
    instrument: string;
    category: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    rate: number;
    minFixed: number;
    remarks: string;
    fixedAmount?: undefined;
    investorType?: undefined;
    termType?: undefined;
} | {
    instrument: string;
    category: string;
    description: string;
    minAmount: number;
    maxAmount: number;
    rate: number;
    remarks?: undefined;
    fixedAmount?: undefined;
    minFixed?: undefined;
    investorType?: undefined;
    termType?: undefined;
} | {
    instrument: string;
    category: string;
    description: string;
    minAmount: number;
    rate: number;
    maxAmount?: undefined;
    remarks?: undefined;
    fixedAmount?: undefined;
    minFixed?: undefined;
    investorType?: undefined;
    termType?: undefined;
} | {
    instrument: string;
    category: string;
    description: string;
    rate: number;
    investorType: string;
    termType: string;
    remarks: string;
    minAmount?: undefined;
    maxAmount?: undefined;
    fixedAmount?: undefined;
    minFixed?: undefined;
})[];
export interface ChargeResult {
    brokerage: number;
    sebonFee: number;
    dpCharge: number;
    total: number;
    netAmount: number;
}
export declare class FeeRatesService implements OnModuleInit {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    onModuleInit(): Promise<void>;
    seedIfEmpty(): Promise<void>;
    findAll(): Promise<{
        minAmount: number | null;
        investorType: string | null;
        rate: number | null;
        fixedAmount: number | null;
        minFixed: number | null;
        maxAmount: number | null;
        remarks: string | null;
        id: string;
        instrument: string;
        category: string;
        description: string;
        termType: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findGrouped(): Promise<Record<string, Record<string, {
        minAmount: number | null;
        investorType: string | null;
        rate: number | null;
        fixedAmount: number | null;
        minFixed: number | null;
        maxAmount: number | null;
        remarks: string | null;
        id: string;
        instrument: string;
        category: string;
        description: string;
        termType: string | null;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
    }[]>>>;
    calculateCharges(amount: number, isSell?: boolean, instrumentType?: string | null): Promise<ChargeResult>;
    getCGTRate(holdingDays: number, investorType?: "Individual" | "Institutional"): Promise<number>;
    getTaxRatesSummary(): Promise<{
        equityBrokerage: {
            description: string;
            rate: number;
            minFixed: number;
        }[];
        SEBON_RATE: number;
        DP_CHARGE_FIXED: number;
        CGT: {
            INDIVIDUAL_SHORT_TERM: number;
            INDIVIDUAL_LONG_TERM: number;
            INSTITUTIONAL: number;
        };
    }>;
}
