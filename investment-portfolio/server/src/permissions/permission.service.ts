import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

export interface PermissionCheckOptions {
  requireAll?: boolean; // If true, user must have ALL functions. If false, ANY function is sufficient
  checkModuleAccess?: boolean; // If true, also check if user has any function in the module
}

@Injectable()
export class PermissionService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get all functions assigned to a user through their active roles
   */
  async getUserFunctions(userId: string): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      module: string;
    }>
  > {
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

    const functionMap = new Map<string, any>();

    userRoles.forEach((userRole) => {
      userRole.role.roleFunctions.forEach((roleFunction) => {
        const func = roleFunction.function;
        if (!functionMap.has(func.id)) {
          functionMap.set(func.id, {
            id: func.id,
            name: func.name,
            description: func.description,
            module: func.module,
          });
        }
      });
    });

    return Array.from(functionMap.values());
  }

  /**
   * Get all function names assigned to a user
   */
  async getUserFunctionNames(userId: string): Promise<string[]> {
    const functions = await this.getUserFunctions(userId);
    return functions.map((f) => f.name);
  }

  /**
   * Check if user has a specific function
   */
  async hasFunction(userId: string, functionName: string): Promise<boolean> {
    const functions = await this.getUserFunctionNames(userId);
    return functions.includes(functionName);
  }

  /**
   * Check if user has any of the specified functions
   */
  async hasAnyFunction(
    userId: string,
    functionNames: string[],
  ): Promise<boolean> {
    const userFunctions = await this.getUserFunctionNames(userId);
    return functionNames.some((name) => userFunctions.includes(name));
  }

  /**
   * Check if user has all of the specified functions
   */
  async hasAllFunctions(
    userId: string,
    functionNames: string[],
  ): Promise<boolean> {
    const userFunctions = await this.getUserFunctionNames(userId);
    return functionNames.every((name) => userFunctions.includes(name));
  }

  /**
   * Check if user has access to a specific module (has any function in that module)
   */
  async hasModuleAccess(userId: string, module: string): Promise<boolean> {
    const functions = await this.getUserFunctions(userId);
    return functions.some((f) => f.module === module);
  }

  /**
   * Get modules that user has access to
   */
  async getAccessibleModules(userId: string): Promise<string[]> {
    const functions = await this.getUserFunctions(userId);
    const modules = new Set<string>();
    functions.forEach((f) => modules.add(f.module));
    return Array.from(modules);
  }

  /**
   * Check permissions with options - throws if check fails
   */
  async checkPermission(
    userId: string,
    functions: string | string[],
    options: PermissionCheckOptions = {},
  ): Promise<void> {
    const functionList = Array.isArray(functions) ? functions : [functions];

    const hasPermission = options.requireAll
      ? await this.hasAllFunctions(userId, functionList)
      : await this.hasAnyFunction(userId, functionList);

    if (!hasPermission) {
      throw new ForbiddenException(
        `Access denied. Required function(s): ${functionList.join(", ")}`,
      );
    }
  }

  /**
   * Get detailed permission report for a user
   */
  async getUserPermissionReport(userId: string): Promise<{
    userId: string;
    totalFunctions: number;
    functions: Array<{
      id: string;
      name: string;
      description: string;
      module: string;
    }>;
    modules: string[];
    roles: Array<{
      id: string;
      name: string;
      userType: string;
    }>;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userId: true },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const [functions, modules, userRoles] = await Promise.all([
      this.getUserFunctions(userId),
      this.getAccessibleModules(userId),
      this.prisma.userRole.findMany({
        where: {
          userId,
          status: "ACTIVE",
          effectiveFrom: { lte: new Date() },
          OR: [{ effectiveTo: null }, { effectiveTo: { gt: new Date() } }],
        },
        include: {
          role: {
            select: {
              id: true,
              name: true,
              userType: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return {
      userId: user.userId,
      totalFunctions: functions.length,
      functions,
      modules,
      roles: userRoles.map((ur) => ({
        id: ur.role.id,
        name: ur.role.name,
        userType: ur.role.userType.name,
      })),
    };
  }

  /**
   * Get all available functions in the system
   */
  async getAllFunctions(): Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      module: string;
    }>
  > {
    return this.prisma.function.findMany({
      where: { isActive: true },
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  }

  async getFunctionsByModule(): Promise<
    Record<string, Array<{ id: string; name: string; description: string }>>
  > {
    const allFunctions = await this.getAllFunctions();

    return allFunctions.reduce(
      (acc, func) => {
        if (!acc[func.module]) {
          acc[func.module] = [];
        }
        acc[func.module].push({
          id: func.id,
          name: func.name,
          description: func.description,
        });
        return acc;
      },
      {} as Record<
        string,
        Array<{ id: string; name: string; description: string }>
      >,
    );
  }
}
