import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";

export const MODULE_KEY = "requiredModule";

export function RequireModule(
  module: string,
): MethodDecorator & ClassDecorator {
  return (target: any, key?: any, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(MODULE_KEY, module, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(MODULE_KEY, module, target);
    return target;
  };
}

@Injectable()
export class ModuleAccessGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredModule = this.reflector.getAllAndOverride<string>(
      MODULE_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No module restriction on this route
    if (!requiredModule) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) throw new ForbiddenException("Not authenticated");

    // Resolve organizationId from request (query, body, or user's org)
    const organizationId: string | undefined =
      request.query?.organizationId ??
      request.body?.organizationId ??
      user.organizationId;

    if (!organizationId) {
      throw new ForbiddenException(
        "Organization context is required for module access validation",
      );
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) throw new ForbiddenException("Organization not found");

    const normalized = requiredModule.toLowerCase();
    const moduleFlagMap: Record<string, keyof typeof org> = {
      investment: "hasInvestment",
      accounting: "hasAccounting",
      inventory: "hasInventory",
    };

    const moduleFlag = moduleFlagMap[normalized];
    if (!moduleFlag) {
      throw new ForbiddenException(`Unsupported module '${requiredModule}'`);
    }

    const isEnabled = org[moduleFlag] as boolean;

    if (!isEnabled) {
      throw new ForbiddenException(
        `Module '${requiredModule}' is not enabled for this organization`,
      );
    }

    return true;
  }
}
