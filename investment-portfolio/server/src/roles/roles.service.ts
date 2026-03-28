import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ApprovalService } from "../approval/approval.service";
import { AuditService } from "../audit/audit.service";

export interface CreateRoleDto {
  id: string;
  name: string;
  userTypeId: string;
  description?: string;
  functionIds?: string[];
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
}

export interface AssignFunctionDto {
  functionIds: string[];
  assignedBy: string;
}

@Injectable()
export class RoleService {
  constructor(
    private prisma: PrismaService,
    private approvalService: ApprovalService,
    private auditService: AuditService,
  ) {}

  /**
   * Validate role ID format (max 50 chars, alphanumeric)
   */
  private validateRoleId(roleId: string): void {
    if (!roleId || roleId.length > 50) {
      throw new BadRequestException("Role ID must not exceed 50 characters");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(roleId)) {
      throw new BadRequestException(
        "Role ID must be alphanumeric with hyphens or underscores only",
      );
    }
  }

  /**
   * Create a new role (requires approval)
   */
  async createRole(dto: CreateRoleDto, createdBy: string) {
    // Validate role ID
    this.validateRoleId(dto.id);

    // Check if role ID already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { id: dto.id },
    });
    if (existingRole) {
      throw new BadRequestException("Role ID already exists");
    }

    // Verify user type exists
    const userType = await this.prisma.userType.findUnique({
      where: { id: dto.userTypeId },
    });
    if (!userType) {
      throw new NotFoundException("User type not found");
    }

    // Verify all function IDs exist if provided
    if (dto.functionIds && dto.functionIds.length > 0) {
      const functions = await this.prisma.function.findMany({
        where: { id: { in: dto.functionIds } },
      });
      if (functions.length !== dto.functionIds.length) {
        throw new BadRequestException("One or more function IDs are invalid");
      }
    }

    // Create role with PENDING_APPROVAL status
    const role = await this.prisma.role.create({
      data: {
        id: dto.id,
        name: dto.name,
        userTypeId: dto.userTypeId,
        description: dto.description,
        status: "PENDING_APPROVAL",
        createdBy,
      },
    });

    // Create approval workflow
    await this.approvalService.createWorkflow({
      entityType: "ROLE",
      entityId: role.id,
      action: "CREATE",
      requestedBy: createdBy,
      comment: `Create role ${dto.name} (${dto.id})`,
    });

    // If functions were provided, assign them (also pending approval)
    if (dto.functionIds && dto.functionIds.length > 0) {
      for (const functionId of dto.functionIds) {
        await this.prisma.roleFunction.create({
          data: {
            id: `RF_${role.id}_${functionId}`,
            roleId: role.id,
            functionId,
            assignedBy: createdBy,
            status: "PENDING_APPROVAL",
          },
        });
      }

      // Create separate workflow for function assignments
      await this.approvalService.createWorkflow({
        entityType: "ROLE_FUNCTION",
        entityId: role.id,
        action: "ASSIGN",
        requestedBy: createdBy,
        comment: `Assign ${dto.functionIds.length} functions to role ${dto.name}`,
      });
    }

    // Log in audit trail
    await this.auditService.log({
      entityType: "ROLE",
      entityId: role.id,
      action: "CREATE",
      newValues: dto,
      userId: createdBy,
      comment: `Role ${dto.name} created and sent for approval`,
    });

    return {
      ...role,
      message: "Role created successfully and sent for approval",
    };
  }

  /**
   * Approve a role creation
   */
  async approveRole(
    roleId: string,
    approvedBy: string,
    rejectionReason?: string,
  ) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        roleFunctions: true,
      },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.status !== "PENDING_APPROVAL") {
      throw new BadRequestException(
        `Role is not pending approval (current status: ${role.status})`,
      );
    }

    const oldValues = { ...role };

    if (rejectionReason) {
      // Reject the role
      if (rejectionReason.length > 2500) {
        throw new BadRequestException(
          "Rejection reason must not exceed 2500 characters",
        );
      }

      const updatedRole = await this.prisma.role.update({
        where: { id: roleId },
        data: {
          status: "REJECTED",
          rejectionReason,
          approvedBy,
          approvedAt: new Date(),
        },
      });

      await this.auditService.log({
        entityType: "ROLE",
        entityId: roleId,
        action: "REJECT",
        oldValues,
        newValues: updatedRole,
        userId: approvedBy,
        comment: rejectionReason,
      });

      return updatedRole;
    }

    // Approve the role
    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        status: "ACTIVE",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    // Also approve any pending function assignments
    await this.prisma.roleFunction.updateMany({
      where: {
        roleId,
        status: "PENDING_APPROVAL",
      },
      data: {
        status: "ACTIVE",
        approvedBy,
        approvedAt: new Date(),
      },
    });

    await this.auditService.log({
      entityType: "ROLE",
      entityId: roleId,
      action: "APPROVE",
      oldValues,
      newValues: updatedRole,
      userId: approvedBy,
      comment: `Role ${role.name} approved`,
    });

    return updatedRole;
  }

  /**
   * Assign functions to a role (requires approval)
   */
  async assignFunctions(roleId: string, dto: AssignFunctionDto) {
    // Validate functionIds is provided and is an array
    if (!dto.functionIds || !Array.isArray(dto.functionIds)) {
      throw new BadRequestException("functionIds must be a non-empty array");
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.status !== "ACTIVE") {
      throw new BadRequestException(
        "Functions can only be assigned to ACTIVE roles",
      );
    }

    // Verify all function IDs exist
    const functions = await this.prisma.function.findMany({
      where: { id: { in: dto.functionIds } },
    });
    if (functions.length !== dto.functionIds.length) {
      throw new BadRequestException("One or more function IDs are invalid");
    }

    // Check for duplicates
    const existingAssignments = await this.prisma.roleFunction.findMany({
      where: {
        roleId,
        functionId: { in: dto.functionIds },
        status: { in: ["ACTIVE", "PENDING_APPROVAL"] },
      },
    });

    if (existingAssignments.length > 0) {
      const existingIds = existingAssignments.map((ef) => ef.functionId);
      throw new BadRequestException(
        `Functions already assigned: ${existingIds.join(", ")}`,
      );
    }

    // Create function assignments with PENDING_APPROVAL status
    const assignments = [];
    for (const functionId of dto.functionIds) {
      const assignment = await this.prisma.roleFunction.create({
        data: {
          id: `RF_${roleId}_${functionId}`,
          roleId,
          functionId,
          assignedBy: dto.assignedBy,
          status: "PENDING_APPROVAL",
        },
      });
      assignments.push(assignment);
    }

    // Create approval workflow
    await this.approvalService.createWorkflow({
      entityType: "ROLE_FUNCTION",
      entityId: roleId,
      action: "ASSIGN",
      requestedBy: dto.assignedBy,
      comment: `Assign ${dto.functionIds.length} functions to role ${role.name}`,
    });

    await this.auditService.log({
      entityType: "ROLE",
      entityId: roleId,
      action: "ASSIGN_FUNCTIONS",
      newValues: { functionIds: dto.functionIds },
      userId: dto.assignedBy,
      comment: `Assigned ${dto.functionIds.length} functions to role ${role.name}`,
    });

    return {
      roleId,
      assignments,
      message: "Functions assigned and sent for approval",
    };
  }

  /**
   * Remove function from role
   */
  async removeFunction(roleId: string, functionId: string, removedBy: string) {
    const assignment = await this.prisma.roleFunction.findFirst({
      where: {
        roleId,
        functionId,
        status: "ACTIVE",
      },
    });

    if (!assignment) {
      throw new NotFoundException("Function assignment not found");
    }

    // Soft delete by updating status
    await this.prisma.roleFunction.update({
      where: { id: assignment.id },
      data: {
        status: "INACTIVE",
      },
    });

    await this.auditService.log({
      entityType: "ROLE",
      entityId: roleId,
      action: "REMOVE_FUNCTION",
      oldValues: assignment,
      userId: removedBy,
      comment: `Removed function ${functionId} from role ${roleId}`,
    });

    return { message: "Function removed from role" };
  }

  /**
   * Get all roles with pagination and filtering
   */
  async getRoles(
    filters?: {
      status?: string;
      userTypeId?: string;
      isSystem?: boolean;
      search?: string;
    },
    page: number = 1,
    limit: number = 20,
  ) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.userTypeId) {
      where.userTypeId = filters.userTypeId;
    }

    if (filters?.isSystem !== undefined) {
      where.isSystem = filters.isSystem;
    }

    if (filters?.search) {
      where.OR = [
        { id: { contains: filters.search, mode: "insensitive" } },
        { name: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const [roles, total] = await Promise.all([
      this.prisma.role.findMany({
        where,
        include: {
          userType: true,
          roleFunctions: {
            where: { status: "ACTIVE" },
            include: {
              function: true,
            },
          },
          userRoles: {
            where: { status: "ACTIVE" },
            include: {
              user: {
                select: {
                  id: true,
                  userId: true,
                  username: true,
                  firstName: true,
                  surname: true,
                },
              },
            },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.role.count({ where }),
    ]);

    return {
      roles,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get a single role by ID with all details
   */
  async getRoleById(roleId: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: {
        userType: true,
        roleFunctions: {
          include: {
            function: true,
            assigner: {
              select: {
                id: true,
                username: true,
                firstName: true,
                surname: true,
              },
            },
            approver: {
              select: {
                id: true,
                username: true,
                firstName: true,
                surname: true,
              },
            },
          },
        },
        userRoles: {
          include: {
            user: {
              select: {
                id: true,
                userId: true,
                username: true,
                firstName: true,
                surname: true,
              },
            },
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    return role;
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, dto: UpdateRoleDto, updatedBy: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.isSystem) {
      throw new BadRequestException("System roles cannot be modified");
    }

    const oldValues = { ...role };

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });

    await this.auditService.log({
      entityType: "ROLE",
      entityId: roleId,
      action: "MODIFY",
      oldValues,
      newValues: updatedRole,
      userId: updatedBy,
    });

    return updatedRole;
  }

  /**
   * Suspend a role
   */
  async suspendRole(roleId: string, reason: string, suspendedBy: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.isSystem) {
      throw new BadRequestException("System roles cannot be suspended");
    }

    if (role.status !== "ACTIVE") {
      throw new BadRequestException("Only ACTIVE roles can be suspended");
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException("Suspension reason is required");
    }

    const oldValues = { ...role };

    const updatedRole = await this.prisma.role.update({
      where: { id: roleId },
      data: {
        status: "SUSPENDED",
        suspensionReason: reason,
      },
    });

    await this.auditService.log({
      entityType: "ROLE",
      entityId: roleId,
      action: "SUSPEND",
      oldValues,
      newValues: updatedRole,
      userId: suspendedBy,
      comment: reason,
    });

    return updatedRole;
  }

  /**
   * Delete role (only if PENDING_APPROVAL or INACTIVE)
   */
  async deleteRole(roleId: string, deletedBy: string) {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.isSystem) {
      throw new BadRequestException("System roles cannot be deleted");
    }

    if (!["PENDING_APPROVAL", "REJECTED", "INACTIVE"].includes(role.status)) {
      throw new BadRequestException(
        "Only PENDING_APPROVAL, REJECTED, or INACTIVE roles can be deleted",
      );
    }

    // Check if any users are assigned to this role
    const assignedUsers = await this.prisma.userRole.count({
      where: {
        roleId,
        status: "ACTIVE",
      },
    });

    if (assignedUsers > 0) {
      throw new BadRequestException(
        "Cannot delete role with active user assignments",
      );
    }

    const oldValues = { ...role };

    // Soft delete by updating status
    await this.prisma.role.update({
      where: { id: roleId },
      data: {
        status: "INACTIVE",
      },
    });

    await this.auditService.log({
      entityType: "ROLE",
      entityId: roleId,
      action: "DELETE",
      oldValues,
      userId: deletedBy,
    });

    return { message: "Role deleted successfully" };
  }

  /**
   * Get all available functions
   */
  async getAllFunctions() {
    return this.prisma.function.findMany({
      where: { isActive: true },
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  }

  /**
   * Check if user has a specific function
   */
  async userHasFunction(
    userId: string,
    functionName: string,
  ): Promise<boolean> {
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
              include: {
                function: true,
              },
            },
          },
        },
      },
    });

    for (const userRole of userRoles) {
      for (const roleFunction of userRole.role.roleFunctions) {
        if (roleFunction.function.name === functionName) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get all functions assigned to a user
   */
  async getUserFunctions(userId: string) {
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
              include: {
                function: true,
              },
            },
          },
        },
      },
    });

    const functions = new Map();
    for (const userRole of userRoles) {
      for (const roleFunction of userRole.role.roleFunctions) {
        functions.set(roleFunction.function.id, roleFunction.function);
      }
    }

    return Array.from(functions.values());
  }

  /**
   * Assign role to user (requires approval)
   */
  async assignRoleToUser(
    userId: string,
    roleId: string,
    assignedBy: string,
    effectiveFrom?: Date,
    effectiveTo?: Date,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      throw new NotFoundException("Role not found");
    }

    if (role.status !== "ACTIVE") {
      throw new BadRequestException(
        "Only ACTIVE roles can be assigned to users",
      );
    }

    // Check if user already has this role
    const existingAssignment = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        status: { in: ["ACTIVE", "PENDING_APPROVAL"] },
      },
    });

    if (existingAssignment) {
      throw new BadRequestException("User already has this role assigned");
    }

    // Create user role assignment with PENDING_APPROVAL status
    const userRole = await this.prisma.userRole.create({
      data: {
        id: `UR_${userId}_${roleId}`,
        userId,
        roleId,
        assignedBy,
        status: "PENDING_APPROVAL",
        effectiveFrom: effectiveFrom || new Date(),
        effectiveTo,
      },
    });

    // Create approval workflow
    await this.approvalService.createWorkflow({
      entityType: "USER_ROLE",
      entityId: userRole.id,
      action: "ASSIGN",
      requestedBy: assignedBy,
      comment: `Assign role ${role.name} to user ${user.username}`,
    });

    await this.auditService.log({
      entityType: "USER_ROLE",
      entityId: userRole.id,
      action: "CREATE",
      newValues: { userId, roleId, effectiveFrom, effectiveTo },
      userId: assignedBy,
      comment: `Role ${role.name} assigned to user ${user.username}`,
    });

    return {
      ...userRole,
      message: "Role assigned to user and sent for approval",
    };
  }

  /**
   * Remove role from user
   */
  async removeRoleFromUser(userId: string, roleId: string, removedBy: string) {
    const userRole = await this.prisma.userRole.findFirst({
      where: {
        userId,
        roleId,
        status: "ACTIVE",
      },
    });

    if (!userRole) {
      throw new NotFoundException("User role assignment not found");
    }

    // Soft delete by updating status and effectiveTo
    const updatedUserRole = await this.prisma.userRole.update({
      where: { id: userRole.id },
      data: {
        status: "INACTIVE",
        effectiveTo: new Date(),
      },
    });

    await this.auditService.log({
      entityType: "USER_ROLE",
      entityId: userRole.id,
      action: "REMOVE",
      oldValues: userRole,
      newValues: updatedUserRole,
      userId: removedBy,
      comment: `Role ${roleId} removed from user ${userId}`,
    });

    return { message: "Role removed from user" };
  }

  /**
   * Returns functions filtered by module name (e.g. INVESTMENT, ACCOUNTING, FOUNDATION).
   */
  async getFunctionsByModule(module: string) {
    return this.prisma.function.findMany({
      where: { module, isActive: true },
      orderBy: { name: "asc" },
    });
  }

  /**
   * Assign all active functions of a given module to a role (bulk).
   */
  async assignModuleFunctionsToRole(
    roleId: string,
    module: string,
    assignedBy: string,
  ) {
    const functions = await this.getFunctionsByModule(module);
    const assignments = [];
    for (const fn of functions) {
      const existing = await this.prisma.roleFunction.findFirst({
        where: { roleId, functionId: fn.id },
      });
      if (!existing) {
        assignments.push(
          this.prisma.roleFunction.create({
            data: {
              roleId,
              functionId: fn.id,
              assignedBy,
              status: "PENDING_APPROVAL",
            },
          }),
        );
      }
    }
    if (assignments.length > 0) await Promise.all(assignments);
    return { assigned: assignments.length };
  }
}
