import { useState, useEffect } from "react";
import { apiService } from "@/services/api";

interface OrgModules {
  investmentEnabled: boolean;
  accountingEnabled: boolean;
  vatEnabled: boolean;
  tdsEnabled: boolean;
  payrollEnabled: boolean;
  fixedAssetsEnabled: boolean;
}

const DEFAULT_MODULES: OrgModules = {
  investmentEnabled: true,
  accountingEnabled: false,
  vatEnabled: false,
  tdsEnabled: false,
  payrollEnabled: false,
  fixedAssetsEnabled: false,
};

export function useOrganizationModules(organizationId?: string) {
  const [modules, setModules] = useState<OrgModules>(DEFAULT_MODULES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!organizationId) return;
    setLoading(true);
    apiService
      .getOrganizationModules(organizationId)
      .then((res) => {
        if (res.success && res.data) setModules(res.data as OrgModules);
      })
      .finally(() => setLoading(false));
  }, [organizationId]);

  const hasModule = (module: keyof OrgModules) => modules[module] === true;

  return { modules, loading, hasModule };
}
