import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";
import * as bcrypt from "bcrypt";
import { RegisterDto } from "./dto/auth.dto";

// Security configuration per SRS
const SECURITY_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  passwordMinLength: 6,
  passwordMaxLength: 10,
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Validate password format per SRS: 6-10 chars with uppercase, lowercase, number
   */
  private validatePasswordFormat(password: string): void {
    if (
      !password ||
      password.length < SECURITY_CONFIG.passwordMinLength ||
      password.length > SECURITY_CONFIG.passwordMaxLength
    ) {
      throw new BadRequestException(
        `Password must be between ${SECURITY_CONFIG.passwordMinLength}-${SECURITY_CONFIG.passwordMaxLength} characters`,
      );
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      throw new BadRequestException(
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      );
    }
  }

  /**
   * Check if account is locked and handle auto-unlock
   */
  private async checkAccountLockout(
    userId: string,
  ): Promise<{ locked: boolean; message?: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        lockedUntil: true,
        failedLoginAttempts: true,
        lockReason: true,
      },
    });

    if (!user) return { locked: false };

    // Check if lock has expired
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: null,
          lockReason: null,
          failedLoginAttempts: 0,
          isActive: true,
        },
      });
      return { locked: false };
    }

    // Account is still locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return {
        locked: true,
        message: `Account is locked until ${user.lockedUntil.toLocaleString()}${user.lockReason ? `. Reason: ${user.lockReason}` : ""}`,
      };
    }

    return { locked: false };
  }

  /**
   * Increment failed login attempts and lock account if threshold reached
   */
  private async handleFailedLogin(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { failedLoginAttempts: true },
    });

    const newAttempts = (user?.failedLoginAttempts || 0) + 1;
    const shouldLock = newAttempts >= SECURITY_CONFIG.maxFailedAttempts;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: newAttempts,
        ...(shouldLock && {
          lockedUntil: new Date(
            Date.now() + SECURITY_CONFIG.lockoutDurationMinutes * 60 * 1000,
          ),
          lockReason: `Account locked after ${SECURITY_CONFIG.maxFailedAttempts} failed login attempts`,
          isActive: false,
        }),
      },
    });
  }

  /**
   * Reset failed login attempts on successful login
   */
  private async resetFailedAttempts(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lockReason: null,
      },
    });
  }

  /**
   * Validate user credentials with full security checks
   */
  async validateUser(
    username: string,
    password: string,
    ipAddress?: string,
  ): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return null;
    }

    // Check account lockout status
    const lockoutCheck = await this.checkAccountLockout(user.id);
    if (lockoutCheck.locked) {
      throw new ForbiddenException(lockoutCheck.message);
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      await this.handleFailedLogin(user.id);
      const remainingAttempts =
        SECURITY_CONFIG.maxFailedAttempts -
        ((user.failedLoginAttempts || 0) + 1);
      if (remainingAttempts > 0) {
        throw new UnauthorizedException(
          `Invalid credentials. ${remainingAttempts} attempts remaining before account lockout.`,
        );
      } else {
        throw new ForbiddenException(
          `Account locked due to too many failed attempts. Try again after ${SECURITY_CONFIG.lockoutDurationMinutes} minutes.`,
        );
      }
    }

    // Check user approval status
    if (user.status === "PENDING_APPROVAL") {
      throw new ForbiddenException(
        "Your account is pending approval. Please contact an administrator.",
      );
    }

    if (user.status === "REJECTED") {
      throw new ForbiddenException(
        "Your account registration has been rejected. Please contact an administrator.",
      );
    }

    if (user.status === "SUSPENDED") {
      throw new ForbiddenException(
        `Your account has been suspended. ${user.suspensionReason || "Please contact an administrator."}`,
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new ForbiddenException(
        "Your account is inactive. Please contact an administrator.",
      );
    }

    // Reset failed attempts on successful validation
    await this.resetFailedAttempts(user.id);

    const { passwordHash, ...result } = user;
    return result;
  }

  async login(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    // Validate credentials with full security checks
    const validatedUser = await this.validateUser(
      username,
      password,
      ipAddress,
    );
    if (!validatedUser) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: validatedUser.id },
      data: {
        lastLogin: new Date(),
        lastPasswordChange: validatedUser.lastPasswordChange || new Date(),
      },
    });

    const payload = {
      username: validatedUser.username,
      sub: validatedUser.id,
      userType: validatedUser.userTypeId,
    };

    return {
      user: validatedUser,
      token: this.jwtService.sign(payload),
      expiresIn: "24h",
    };
  }

  async register(userData: RegisterDto) {
    // Validate password format
    this.validatePasswordFormat(userData.password);

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { username: userData.username },
          { email: userData.email },
          { userId: userData.userId },
        ],
      },
    });

    if (existingUser) {
      throw new UnauthorizedException(
        "Username, email or userId already exists",
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = await this.prisma.user.create({
      data: {
        userId: userData.userId,
        username: userData.username,
        email: userData.email,
        passwordHash: hashedPassword,
        firstName: userData.firstName,
        surname: userData.surname,
        branchId: userData.branchId || "BRANCH_MAIN",
        userTypeId: userData.userTypeId || "VIEW",
        status: "PENDING_APPROVAL",
        lastPasswordChange: new Date(),
      },
    });

    const { passwordHash, ...result } = user;

    const payload = {
      username: result.username,
      sub: result.id,
      userType: result.userTypeId,
    };

    return {
      user: result,
      token: this.jwtService.sign(payload),
      expiresIn: "24h",
      message: "Registration successful. Your account is pending approval.",
    };
  }

  async getCurrentUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
        userType: true,
        userRoles: {
          where: { status: "ACTIVE" },
          include: {
            role: {
              include: {
                roleFunctions: {
                  where: { status: "ACTIVE" },
                  include: { function: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    return user;
  }

  /**
   * Get user permissions/functions
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const userRoles = await this.prisma.userRole.findMany({
      where: {
        userId,
        status: "ACTIVE",
        effectiveFrom: { lte: new Date() },
        OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
      },
      include: {
        role: {
          include: {
            roleFunctions: {
              where: { status: "ACTIVE" },
              include: { function: true },
            },
          },
        },
      },
    });

    const functionNames = new Set<string>();
    userRoles.forEach((ur) => {
      ur.role.roleFunctions.forEach((rf) => {
        functionNames.add(rf.function.name);
      });
    });

    return Array.from(functionNames);
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Validate new password format
    this.validatePasswordFormat(newPassword);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(
      currentPassword,
      user.passwordHash,
    );
    if (!passwordValid) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    // Hash and update new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        lastPasswordChange: new Date(),
      },
    });
  }
}
