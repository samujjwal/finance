import { FeeRatesService } from "./fee-rates.service";
export declare class FeeRatesController {
    private feeRatesService;
    constructor(feeRatesService: FeeRatesService);
    findAll(): Promise<{
        success: boolean;
        data: {
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
        }[];
    }>;
    findGrouped(): Promise<{
        success: boolean;
        data: Record<string, Record<string, {
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
        }[]>>;
    }>;
    getSummary(): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
}
