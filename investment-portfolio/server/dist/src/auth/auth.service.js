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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const bcrypt = require("bcrypt");
let AuthService = class AuthService {
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async validateUser(username, password) {
        const user = await this.prisma.user.findUnique({
            where: { username },
        });
        if (user && (await bcrypt.compare(password, user.passwordHash))) {
            const { passwordHash, ...result } = user;
            return result;
        }
        return null;
    }
    async login(username, password) {
        const validatedUser = await this.validateUser(username, password);
        if (!validatedUser) {
            throw new common_1.UnauthorizedException("Invalid credentials");
        }
        await this.prisma.user.update({
            where: { id: validatedUser.id },
            data: { lastLogin: new Date() },
        });
        const payload = {
            username: validatedUser.username,
            sub: validatedUser.id,
            role: validatedUser.role,
        };
        return {
            user: validatedUser,
            token: this.jwtService.sign(payload),
            expiresIn: "24h",
        };
    }
    async register(userData) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ username: userData.username }, { email: userData.email }],
            },
        });
        if (existingUser) {
            throw new common_1.UnauthorizedException("Username or email already exists");
        }
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = await this.prisma.user.create({
            data: {
                username: userData.username,
                email: userData.email,
                passwordHash: hashedPassword,
                role: userData.role || "USER",
            },
        });
        const { passwordHash, ...result } = user;
        const payload = {
            username: result.username,
            sub: result.id,
            role: result.role,
        };
        return {
            user: result,
            token: this.jwtService.sign(payload),
            expiresIn: "24h",
        };
    }
    async getCurrentUser(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                organizationId: true,
                createdAt: true,
                lastLogin: true,
            },
        });
        if (!user) {
            throw new common_1.UnauthorizedException("User not found");
        }
        return user;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map