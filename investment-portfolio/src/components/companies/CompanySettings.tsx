import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiService } from "@/services/api";

type ModuleState = {
    hasInvestment: boolean;
    hasAccounting: boolean;
    hasInventory: boolean;
};

export function CompanySettings({
    organizationId,
    currentModules,
    onSaved,
}: {
    organizationId: string;
    currentModules: ModuleState;
    onSaved?: (modules: ModuleState) => void;
}) {
    const [modules, setModules] = useState<ModuleState>(currentModules);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const toggleModule = (key: keyof ModuleState) => {
        const next = { ...modules, [key]: !modules[key] };

        // Explicit confirmation for accounting activation as requested in the plan.
        if (key === "hasAccounting" && next.hasAccounting && !modules.hasAccounting) {
            const confirmed = window.confirm(
                "Enable accounting module? This introduces accounting workflows and should only be done when the organization is ready.",
            );
            if (!confirmed) return;
        }

        setModules(next);
    };

    const save = async () => {
        setSaving(true);
        setError(null);
        const response = await apiService.updateOrganizationModules(
            organizationId,
            modules,
        );

        if (!response.success) {
            setError(response.error || "Failed to update modules");
            setSaving(false);
            return;
        }

        setSaving(false);
        onSaved?.(modules);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Module Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {error ? (
                    <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                        {error}
                    </div>
                ) : null}

                {(
                    [
                        ["hasInvestment", "Investment"],
                        ["hasAccounting", "Accounting"],
                        ["hasInventory", "Inventory"],
                    ] as Array<[keyof ModuleState, string]>
                ).map(([key, label]) => (
                    <label key={key} className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-900">{label}</span>
                        <input
                            type="checkbox"
                            checked={modules[key]}
                            onChange={() => toggleModule(key)}
                            className="h-4 w-4"
                        />
                    </label>
                ))}

                <div>
                    <Button onClick={save} disabled={saving}>
                        {saving ? "Saving..." : "Save Module Access"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
