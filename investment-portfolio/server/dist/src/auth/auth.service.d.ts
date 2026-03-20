import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    validateUser(username: string, password: string): Promise<any>;
    login(username: string, password: string): Promise<{
        user: any;
        token: string;
        expiresIn: string;
    }>;
    register(userData: {
        username: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<{
        user: {
            id: string;
            username: string;
            email: string;
            role: string;
            organizationId: string | null;
            createdAt: Date;
            lastLogin: Date | null;
            updatedAt: Date;
        };
        token: string;
        expiresIn: string;
    }>;
    getCurrentUser(userId: string): Promise<{
        id: string;
        username: string;
        email: string;
        role: string;
        organizationId: string;
        createdAt: Date;
        lastLogin: Date;
    }>;
}
