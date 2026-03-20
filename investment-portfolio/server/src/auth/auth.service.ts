import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result;
    }
    return null;
  }

  async login(username: string, password: string) {
    // Validate credentials against existing users only
    const validatedUser = await this.validateUser(username, password);
    if (!validatedUser) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Update last login
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

  async register(userData: {
    username: string;
    email: string;
    password: string;
    role?: string;
  }) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: userData.username }, { email: userData.email }],
      },
    });

    if (existingUser) {
      throw new UnauthorizedException("Username or email already exists");
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

  async getCurrentUser(userId: string) {
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
      throw new UnauthorizedException("User not found");
    }

    return user;
  }
}
