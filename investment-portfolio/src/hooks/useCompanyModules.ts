import { useEffect, useMemo, useState } from "react";
import { apiService } from "@/services/api";

export type CompanyModules = {
  hasInvestment: boolean;
  hasAccounting: boolean;
  hasInventory: boolean;
};

type HookState = {
  modules: CompanyModules;
  modulesLoaded: boolean;
  refresh: () => Promise<void>;
  hasModule: (moduleName: "investment" | "accounting" | "inventory") => boolean;
};

const DEFAULT_MODULES: CompanyModules = {
  hasInvestment: true,
  hasAccounting: false,
  hasInventory: false,
};

/**
 * Reads organization module flags and exposes ergonomic checks for UI gating.
 */
export function useCompanyModules(organizationId?: string): HookState {
  const [modules, setModules] = useState<CompanyModules>(DEFAULT_MODULES);
  const [modulesLoaded, setModulesLoaded] = useState(false);

  const refresh = async () => {
    if (!organizationId) {
      setModules(DEFAULT_MODULES);
      setModulesLoaded(true);
      return;
    }

    setModulesLoaded(false);
    const response = await apiService.getOrganizationModules(organizationId);

    if (response.success && response.data) {
      const data = response.data as Partial<CompanyModules>;
      setModules({
        hasInvestment: Boolean(data.hasInvestment),
        hasAccounting: Boolean(data.hasAccounting),
        hasInventory: Boolean(data.hasInventory),
      });
    }

    setModulesLoaded(true);
  };

  useEffect(() => {
    void refresh();
  }, [organizationId]);

  const hasModule = useMemo(
    () => (moduleName: "investment" | "accounting" | "inventory") => {
      if (moduleName === "investment") return modules.hasInvestment;
      if (moduleName === "accounting") return modules.hasAccounting;
      return modules.hasInventory;
    },
    [modules],
  );

  return {
    modules,
    modulesLoaded,
    refresh,
    hasModule,
  };
}
