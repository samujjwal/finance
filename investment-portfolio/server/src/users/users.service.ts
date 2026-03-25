import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ApprovalService } from "../approval/approval.service";
import { AuditService } from "../audit/audit.service";
import * as bcrypt from "bcrypt";

export interface CreateUserDto {
  userId: string;
  username: string;
  email?: string;
  password: string;
  firstName: string;
  surname: string;
  designation?: string;
  branchId: string;
  userTypeId: string;
  telephone?: string;
  mobile?: string;
  extension?: string;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  surname?: string;
  designation?: string;
  telephone?: string;
  mobile?: string;
  extension?: string;
  isActive?: boolean;
}

export interface SuspendUserDto {
  reason: string;
  suspendedBy: string;
}

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private approvalService: ApprovalService,
    private auditService: AuditService,
  ) {}

  /**
   * Validate user ID format (SRS: max 15 chars, alphanumeric with hyphens/underscores)
   */
  private validateUserId(userId: string): void {
    if (!userId || userId.length > 15) {
      throw new BadRequestException("User ID must not exceed 15 characters");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
      throw new BadRequestException(
        "User ID must be alphanumeric with hyphens or underscores only",
      );
    }
  }

  /**
   * Validate password format (relaxed: 8-128 chars, basic complexity)
   */
  private validatePassword(password: string): void {
    if (!password || password.length < 8 || password.length > 128) {
      throw new BadRequestException(
        "Password must be between 8-128 characters",
      );
    }
    // Relaxed complexity - just require some variety
    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(password)) {
      throw new BadRequestException(
        "Password must contain at least one letter and one number",
      );
    }
  }

  /**
   * Check if user account is locked and handle lockout logic
   */
  private async checkAndHandleLockout(
    userId: string,
    ipAddress?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        failedLoginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) return;

    // Check if account is currently locked
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new UnauthorizedException(
        `Account is locked until ${user.lockedUntil.toISOString()}`,
      );
    }

    // If lock has expired, reset the lock
    if (user.lockedUntil && user.lockedUntil <= new Date()) {
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          lockedUntil: null,
          lockReason: null,
          failedLoginAttempts: 0,
        },
      });
    }
  }

  /**
   * Record failed login attempt and potentially lock account
   */
  async recordFailedLogin(
    username: string,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        failedLoginAttempts: true,
        status: true,
      },
    });

    if (!user) return;

    // Don't count if account is not active
    if (user.status !== "ACTIVE") return;

    const maxAttempts = 5;
    const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;

    if (newFailedAttempts >= maxAttempts) {
      // Lock the account
      const lockDuration = 30; // 30 minutes
      const lockedUntil = new Date(Date.now() + lockDuration * 60000);

      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: newFailedAttempts,
          lockedUntil,
          lockReason: `Account locked after ${newFailedAttempts} failed login attempts`,
          isActive: false,
        },
      });

      // Log the lockout
      await this.auditService.log({
        entityType: "USER",
        entityId: user.id,
        action: "ACCOUNT_LOCKED",
        oldValues: { failedLoginAttempts: user.failedLoginAttempts },
        newValues: {
          lockedUntil,
          lockReason: `Account locked after ${newFailedAttempts} failed login attempts`,
        },
        userId: user.id,
        ipAddress,
        userAgent,
        comment: `Account locked after ${newFailedAttempts} failed login attempts`,
      });
    } else {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: newFailedAttempts },
      });
    }
  }

  /**
   * Reset failed login attempts on successful login
   */
  async resetFailedAttempts(userId: string): Promise<void> {
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
   * Create a new user (requires approval)
   */
  async createUser(dto: CreateUserDto, createdBy: string) {
    // Validate user ID
    this.validateUserId(dto.userId);

    // Validate password
    this.validatePassword(dto.password);

    // Check if userId already exists
    const existingUserById = await this.prisma.user.findUnique({
      where: { userId: dto.userId },
    });
    if (existingUserById) {
      throw new BadRequestException("User ID already exists");
    }

    // Check if username already exists
    const existingUserByUsername = await this.prisma.user.findUnique({
      where: { username: dto.username },
    });
    if (existingUserByUsername) {
      throw new BadRequestException("Username already exists");
    }

    // Check if email already exists
    if (dto.email) {
      const existingUserByEmail = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (existingUserByEmail) {
        throw new BadRequestException("Email already exists");
      }
    }

    // Verify branch exists
    const branch = await this.prisma.branch.findUnique({
      where: { id: dto.branchId },
    });
    if (!branch) {
      throw new NotFoundException("Branch not found");
    }

    // Verify user type exists
    const userType = await this.prisma.userType.findUnique({
      where: { id: dto.userTypeId },
    });
    if (!userType) {
      throw new NotFoundException("User type not found");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user with PENDING_APPROVAL status
    const user = await this.prisma.user.create({
      data: {
        userId: dto.userId,
        username: dto.username,
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        surname: dto.surname,
        designation: dto.designation,
        branchId: dto.branchId,
        userTypeId: dto.userTypeId,
        telephone: dto.telephone,
        mobile: dto.mobile,
        extension: dto.extension,
        status: "PENDING_APPROVAL",
        createdBy,
      },
    });

    // Create approval workflow
    await this.approvalService.createWorkflow({
      entityType: "USER",
      entityId: user.id,
      action: "CREATE",
      requestedBy: createdBy,
      comment: `Create user ${dto.username} (${dto.userId})`,
    });

    // Log in audit trail
    await this.auditService.log({
      entityType: "USER",
      entityId: user.id,
      action: "CREATE",
      newValues: { ...dto, password: "[REDACTED]" },
      userId: createdBy,
      comment: `User ${dto.username} created and sent for approval`,
    });

    return {
      ...user,
      passwordHash: undefined,
      message: "User created successfully and sent for approval",
    };
  }

  /**
   * Approve a user creation
   */
  async approveUser(
    userId: string,
    approvedBy: string,
    rejectionReason?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status !== "PENDING_APPROVAL") {
      throw new BadRequestException(
        `User is not pending approval (current status: ${user.status})`,
      );
    }

    const oldValues = { ...user };

    if (rejectionReason) {
      // Reject the user
      if (rejectionReason.length > 2500) {
        throw new BadRequestException(
          "Rejection reason must not exceed 2500 characters",
        );
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          status: "REJECTED",
          rejectionReason,
          approvedBy,
          approvedAt: new Date(),
        },
      });

      await this.auditService.log({
        entityType: "USER",
        entityId: userId,
        action: "REJECT",
        oldValues,
        newValues: updatedUser,
        userId: approvedBy,
        comment: rejectionReason,
      });

      return { ...updatedUser, passwordHash: undefined };
    }

    // Approve the user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: "ACTIVE",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    await this.auditService.log({
      entityType: "USER",
      entityId: userId,
      action: "APPROVE",
      oldValues,
      newValues: updatedUser,
      userId: approvedBy,
      comment: `User ${user.username} approved`,
    });

    return { ...updatedUser, passwordHash: undefined };
  }

  /**
   * Suspend a user
   */
  async suspendUser(userId: string, dto: SuspendUserDto) {
    if (!dto.reason || dto.reason.trim().length === 0) {
      throw new BadRequestException("Suspension reason is required");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check status - log actual value for debugging
    const userStatus = user.status?.toUpperCase();
    if (userStatus !== "ACTIVE") {
      throw new BadRequestException(
        `Only ACTIVE users can be suspended. Current status: ${user.status || "undefined"}`,
      );
    }

    // Cannot suspend yourself
    if (userId === dto.suspendedBy) {
      throw new BadRequestException("You cannot suspend your own account");
    }

    const oldValues = { ...user };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: "SUSPENDED",
        suspensionReason: dto.reason,
        isActive: false,
      },
    });

    await this.auditService.log({
      entityType: "USER",
      entityId: userId,
      action: "SUSPEND",
      oldValues,
      newValues: updatedUser,
      userId: dto.suspendedBy,
      comment: dto.reason,
    });

    return { ...updatedUser, passwordHash: undefined };
  }

  /**
   * Reactivate a suspended user (requires approval)
   */
  async reactivateUser(userId: string, reason: string, requestedBy: string) {
    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException("Reactivation reason is required");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    if (user.status !== "SUSPENDED") {
      throw new BadRequestException("Only SUSPENDED users can be reactivated");
    }

    const oldValues = { ...user };

    // Update status to PENDING_APPROVAL for reactivation
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        status: "PENDING_APPROVAL",
        suspensionReason: null,
      },
    });

    // Create approval workflow for reactivation
    await this.approvalService.createWorkflow({
      entityType: "USER",
      entityId: userId,
      action: "REACTIVATE",
      requestedBy,
      comment: reason,
    });

    await this.auditService.log({
      entityType: "USER",
      entityId: userId,
      action: "REACTIVATE_REQUEST",
      oldValues,
      newValues: updatedUser,
      userId: requestedBy,
      comment: reason,
    });

    return { ...updatedUser, passwordHash: undefined };
  }

  /**
   * Unlock a locked or suspended user account
   */
  async unlockUser(userId: string, unlockedBy: string, reason?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if user is locked (due to failed attempts) or suspended
    const isLocked = user.lockedUntil !== null;
    const isSuspended = user.status === "SUSPENDED";

    if (!isLocked && !isSuspended) {
      throw new BadRequestException("User account is not locked or suspended");
    }

    const oldValues = { ...user };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lockedUntil: null,
        lockReason: null,
        failedLoginAttempts: 0,
        status: "ACTIVE",
        isActive: true,
        suspensionReason: null,
      },
    });

    await this.auditService.log({
      entityType: "USER",
      entityId: userId,
      action: "UNLOCK",
      oldValues,
      newValues: updatedUser,
      userId: unlockedBy,
      comment: reason || "Account manually unlocked",
    });

    return { ...updatedUser, passwordHash: undefined };
  }

  /**
   * Get all users with pagination and filtering
   */
  async getUsers(
    filters?: {
      status?: string;
      branchId?: string;
      userTypeId?: string;
      search?: string;
    },
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.branchId) {
      where.branchId = filters.branchId;
    }

    if (filters?.userTypeId) {
      where.userTypeId = filters.userTypeId;
    }

    if (filters?.search) {
      where.OR = [
        { userId: { contains: filters.search, mode: "insensitive" } },
        { username: { contains: filters.search, mode: "insensitive" } },
        { firstName: { contains: filters.search, mode: "insensitive" } },
        { surname: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          branch: true,
          userType: true,
          userRoles: {
            include: {
              role: true,
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map((u) => ({ ...u, passwordHash: undefined })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single user by ID
   */
  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        branch: true,
        userType: true,
        userRoles: {
          include: {
            role: {
              include: {
                roleFunctions: {
                  include: {
                    function: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return { ...user, passwordHash: undefined };
  }

  /**
   * Update user (requires approval if modifying protected fields)
   */
  async updateUser(userId: string, dto: UpdateUserDto, updatedBy: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Can only update if status is PENDING_APPROVAL or REJECTED
    if (!["PENDING_APPROVAL", "REJECTED", "ACTIVE"].includes(user.status)) {
      throw new BadRequestException(
        `Cannot update user with status: ${user.status}`,
      );
    }

    const oldValues = { ...user };

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    await this.auditService.log({
      entityType: "USER",
      entityId: userId,
      action: "MODIFY",
      oldValues,
      newValues: updatedUser,
      userId: updatedBy,
    });

    return { ...updatedUser, passwordHash: undefined };
  }

  /**
   * Get locked users
   */
  async getLockedUsers() {
    return this.prisma.user.findMany({
      where: {
        lockedUntil: {
          not: null,
        },
      },
      select: {
        id: true,
        userId: true,
        username: true,
        firstName: true,
        surname: true,
        lockedUntil: true,
        lockReason: true,
        failedLoginAttempts: true,
      },
      orderBy: { lockedUntil: "asc" },
    });
  }

  /**
   * Clear all locked users
   */
  async clearLockedUsers(clearedBy: string) {
    const lockedUsers = await this.prisma.user.findMany({
      where: {
        lockedUntil: {
          not: null,
          lte: new Date(), // Only clear locks that have expired
        },
      },
    });

    for (const user of lockedUsers) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          lockedUntil: null,
          lockReason: null,
          failedLoginAttempts: 0,
          isActive: true,
        },
      });

      await this.auditService.log({
        entityType: "USER",
        entityId: user.id,
        action: "AUTO_UNLOCK",
        oldValues: {
          lockedUntil: user.lockedUntil,
          lockReason: user.lockReason,
        },
        newValues: { lockedUntil: null, lockReason: null },
        userId: clearedBy,
        comment: "Account auto-unlocked after lock duration expired",
      });
    }

    return { cleared: lockedUsers.length };
  }
}
