import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { CompanySettings } from '@/components/companies/CompanySettings';

interface OrgModules {
    hasInvestment: boolean;
    hasAccounting: boolean;
    hasInventory: boolean;
}

interface Organization {
    id: string;
    name: string;
    code: string;
    panNumber?: string;
    vatNumber?: string;
    address?: string;
    phone?: string;
    email?: string;
    fiscalYearStart?: string;
}

export function OrganizationSettings({ organizationId }: { organizationId: string }) {
    const [org, setOrg] = useState<Organization | null>(null);
    const [modules, setModules] = useState<OrgModules | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!organizationId) return;
        loadOrg();
    }, [organizationId]);

    const loadOrg = async () => {
        setLoading(true);
        setError(null);
        try {
            const [orgData, modData] = await Promise.all([
                apiService.getOrganization(organizationId),
                apiService.getOrganizationModules(organizationId),
            ]);
            if (orgData.success && orgData.data) {
                setOrg(orgData.data as Organization);
            }
            if (modData.success && modData.data) {
                setModules(modData.data as OrgModules);
            }
        } catch {
            setError('Failed to load organization settings');
        } finally {
            setLoading(false);
        }
    };

    if (!organizationId) {
        return (
            <Card>
                <CardContent className="p-6">
                    <p className="text-gray-500 text-sm">No organization linked to your account.</p>
                </CardContent>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Org Info */}
            {org && (
                <Card>
                    <CardHeader>
                        <CardTitle>Organization Profile</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Name</span>
                                <p className="font-medium">{org.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Code</span>
                                <p className="font-medium">{org.code}</p>
                            </div>
                            {org.panNumber && (
                                <div>
                                    <span className="text-gray-500">PAN</span>
                                    <p className="font-medium">{org.panNumber}</p>
                                </div>
                            )}
                            {org.vatNumber && (
                                <div>
                                    <span className="text-gray-500">VAT Number</span>
                                    <p className="font-medium">{org.vatNumber}</p>
                                </div>
                            )}
                            {org.email && (
                                <div>
                                    <span className="text-gray-500">Email</span>
                                    <p className="font-medium">{org.email}</p>
                                </div>
                            )}
                            {org.phone && (
                                <div>
                                    <span className="text-gray-500">Phone</span>
                                    <p className="font-medium">{org.phone}</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Module Toggles */}
            {modules && (
                <CompanySettings
                    organizationId={organizationId}
                    currentModules={modules}
                    onSaved={(updated) => setModules(updated)}
                />
            )}
        </div>
    );
}
