import { CompaniesService } from './companies.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
export declare class CompaniesController {
    private companiesService;
    constructor(companiesService: CompaniesService);
    findAll(): Promise<{
        success: boolean;
        data: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            serialNumber: number | null;
            companyName: string;
            symbol2: string | null;
            sector: string | null;
            symbol3: string | null;
            instrumentType: string | null;
        }[];
    }>;
    findOne(symbol: string): Promise<{
        success: boolean;
        data: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            serialNumber: number | null;
            companyName: string;
            symbol2: string | null;
            sector: string | null;
            symbol3: string | null;
            instrumentType: string | null;
        };
    }>;
    create(createCompanyDto: CreateCompanyDto): Promise<{
        success: boolean;
        data: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            serialNumber: number | null;
            companyName: string;
            symbol2: string | null;
            sector: string | null;
            symbol3: string | null;
            instrumentType: string | null;
        };
    }>;
    update(symbol: string, updateCompanyDto: UpdateCompanyDto): Promise<{
        success: boolean;
        data: {
            symbol: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            serialNumber: number | null;
            companyName: string;
            symbol2: string | null;
            sector: string | null;
            symbol3: string | null;
            instrumentType: string | null;
        };
    }>;
    remove(symbol: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
