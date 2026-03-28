import { ForbiddenException, ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { ModuleAccessGuard } from "./module-access.guard";

describe("ModuleAccessGuard", () => {
  const getRequest = (overrides?: Record<string, unknown>) => ({
    user: { id: "u1", organizationId: "org-1" },
    query: {},
    body: {},
    ...overrides,
  });

  const createContext = (request: Record<string, unknown>) =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({ getRequest: () => request }),
    }) as unknown as ExecutionContext;

  it("allows request when module is enabled", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue("INVESTMENT"),
    } as unknown as Reflector;

    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: "org-1",
          hasInvestment: true,
          hasAccounting: false,
          hasInventory: false,
        }),
      },
    } as any;

    const guard = new ModuleAccessGuard(reflector, prisma);
    const result = await guard.canActivate(createContext(getRequest()));

    expect(result).toBe(true);
    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { id: "org-1" },
    });
  });

  it("rejects request when required module is disabled", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue("ACCOUNTING"),
    } as unknown as Reflector;

    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: "org-1",
          hasInvestment: true,
          hasAccounting: false,
          hasInventory: false,
        }),
      },
    } as any;

    const guard = new ModuleAccessGuard(reflector, prisma);

    await expect(
      guard.canActivate(createContext(getRequest())),
    ).rejects.toThrow(ForbiddenException);
  });

  it("uses query/body organizationId when provided", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue("INVESTMENT"),
    } as unknown as Reflector;

    const prisma = {
      organization: {
        findUnique: jest.fn().mockResolvedValue({
          id: "org-2",
          hasInvestment: true,
          hasAccounting: false,
          hasInventory: false,
        }),
      },
    } as any;

    const guard = new ModuleAccessGuard(reflector, prisma);
    const request = getRequest({ query: { organizationId: "org-2" } });

    const result = await guard.canActivate(createContext(request));
    expect(result).toBe(true);
    expect(prisma.organization.findUnique).toHaveBeenCalledWith({
      where: { id: "org-2" },
    });
  });

  it("rejects when organization context is missing", async () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue("INVESTMENT"),
    } as unknown as Reflector;

    const prisma = {
      organization: {
        findUnique: jest.fn(),
      },
    } as any;

    const guard = new ModuleAccessGuard(reflector, prisma);
    const request = getRequest({ user: { id: "u1" } });

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      "Organization context is required",
    );
  });
});
