import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { PrismaService } from "../prisma/prisma.service";
export declare class AuthController {
    private authService;
    private prisma;
    constructor(authService: AuthService, prisma: PrismaService);
    getSetupStatus(): Promise<{
        success: boolean;
        data: {
            firstRun: boolean;
            userCount: number;
        };
    }>;
    login(loginDto: LoginDto): Promise<{
        success: boolean;
        data: {
            user: any;
            token: string;
            expiresIn: string;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getCurrentUser(req: any): Promise<{
        success: boolean;
        data: {
            id: string;
            username: string;
            email: string;
            role: string;
            organizationId: string;
            createdAt: Date;
            lastLogin: Date;
        };
    }>;
    logout(): Promise<{
        success: boolean;
        message: string;
    }>;
}
