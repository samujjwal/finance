import { SetMetadata } from "@nestjs/common";

/**
 * @ModuleAccess Decorator for Controller Methods
 * Phase 1: Foundation Refactoring - Module Access Control
 *
 * Usage: @ModuleAccess('INVESTMENT')
 * Marks a controller method as requiring a specific module to be enabled.
 * The ModuleAccessGuard will check if the current user's organization has this module active.
 */
export const ModuleAccess = (moduleName: string) =>
  SetMetadata("moduleAccess", moduleName);

/**
 * Module names enum (matches Organization model fields)
 */
export enum ModuleName {
  INVESTMENT = "hasInvestment",
  ACCOUNTING = "hasAccounting",
  INVENTORY = "hasInventory",
}

/**
 * Mapping from readable names to model field names
 */
export const MODULE_NAME_MAP: Record<string, keyof any> = {
  INVESTMENT: "hasInvestment",
  ACCOUNTING: "hasAccounting",
  INVENTORY: "hasInventory",
};
