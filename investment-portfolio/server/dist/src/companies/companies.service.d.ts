import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto, UpdateCompanyDto } from './dto/company.dto';
export declare class CompaniesService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(): Promise<{
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
    }[]>;
    findOne(symbol: string): Promise<{
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
    }>;
    create(createCompanyDto: CreateCompanyDto): Promise<{
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
    }>;
    update(symbol: string, updateCompanyDto: UpdateCompanyDto): Promise<{
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
    }>;
    remove(symbol: string): Promise<{
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
    }>;
}
