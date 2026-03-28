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
import { createHmac, randomUUID } from "crypto";

// Security configuration per SRS
const SECURITY_CONFIG = {
  maxFailedAttempts: 5,
  lockoutDurationMinutes: 30,
  passwordMinLength: 6,
  passwordMaxLength: 10,
  ipAttemptWindowMs: 60_000,
  ipAttemptLimit: 5,
  sessionIdleTimeoutMinutes: 30,
};

@Injectable()
export class AuthService {
  private readonly ipAttemptTracker = new Map<string, number[]>();

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  private enforceIpRateLimit(ipAddress?: string): void {
    if (!ipAddress) return;
    const now = Date.now();
    const attempts = this.ipAttemptTracker.get(ipAddress) ?? [];
    const recentAttempts = attempts.filter(
      (ts) => now - ts <= SECURITY_CONFIG.ipAttemptWindowMs,
    );
    this.ipAttemptTracker.set(ipAddress, recentAttempts);

    if (recentAttempts.length >= SECURITY_CONFIG.ipAttemptLimit) {
      throw new ForbiddenException(
        "Too many login attempts from this IP. Please retry in a minute.",
      );
    }
  }

  private recordIpFailedAttempt(ipAddress?: string): void {
    if (!ipAddress) return;
    const attempts = this.ipAttemptTracker.get(ipAddress) ?? [];
    attempts.push(Date.now());
    this.ipAttemptTracker.set(ipAddress, attempts);
  }

  private clearIpAttempts(ipAddress?: string): void {
    if (!ipAddress) return;
    this.ipAttemptTracker.delete(ipAddress);
  }

  private generateTotp(
    secret: string,
    timeStepSec: number,
    stepOffset = 0,
  ): string {
    const step = Math.floor(Date.now() / 1000 / timeStepSec) + stepOffset;
    const stepBuffer = Buffer.alloc(8);
    stepBuffer.writeUInt32BE(Math.floor(step / 2 ** 32), 0);
    stepBuffer.writeUInt32BE(step & 0xffffffff, 4);

    const hmac = createHmac("sha1", secret).update(stepBuffer).digest();
    const offset = hmac[hmac.length - 1] & 0x0f;
    const code =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    return String(code % 1_000_000).padStart(6, "0");
  }

  private validateTotpCodeOrThrow(totpCode?: string): void {
    const secret = process.env.TWO_FACTOR_SHARED_SECRET;
    if (!secret) return;

    if (!totpCode) {
      throw new ForbiddenException("Two-factor code is required");
    }

    // Accept current and previous window to tolerate clock skew.
    const current = this.generateTotp(secret, 30, 0);
    const previous = this.generateTotp(secret, 30, -1);
    if (totpCode !== current && totpCode !== previous) {
      throw new ForbiddenException("Invalid two-factor code");
    }
  }

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
    totpCode?: string,
  ) {
    this.enforceIpRateLimit(ipAddress);

    // Validate credentials with full security checks
    let validatedUser: any;
    try {
      validatedUser = await this.validateUser(username, password, ipAddress);
    } catch (error) {
      this.recordIpFailedAttempt(ipAddress);
      throw error;
    }

    if (!validatedUser) {
      this.recordIpFailedAttempt(ipAddress);
      throw new UnauthorizedException("Invalid credentials");
    }

    this.validateTotpCodeOrThrow(totpCode);
    this.clearIpAttempts(ipAddress);

    // Update last login
    await this.prisma.user.update({
      where: { id: validatedUser.id },
      data: {
        lastLogin: new Date(),
        lastPasswordChange: validatedUser.lastPasswordChange || new Date(),
      },
    });

    const sessionId = randomUUID();
    const sessionExpiry = new Date(
      Date.now() + SECURITY_CONFIG.sessionIdleTimeoutMinutes * 60 * 1000,
    );

    await this.prisma.userSession.create({
      data: {
        userId: validatedUser.id,
        token: sessionId,
        expiresAt: sessionExpiry,
      },
    });

    const payload = {
      username: validatedUser.username,
      sub: validatedUser.id,
      userType: validatedUser.userTypeId,
      sid: sessionId,
    };

    return {
      user: validatedUser,
      token: this.jwtService.sign(payload, {
        expiresIn: `${SECURITY_CONFIG.sessionIdleTimeoutMinutes}m`,
      }),
      expiresIn: `${SECURITY_CONFIG.sessionIdleTimeoutMinutes}m`,
    };
  }

  async logout(userId?: string, sessionId?: string): Promise<void> {
    if (!userId || !sessionId) return;

    await this.prisma.userSession.deleteMany({
      where: { userId, token: sessionId },
    });
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
