import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface Props { organizationId: string; }

export function VatDashboard({ organizationId }: Props) {
    const [config, setConfig] = useState<any>(null);
    const [returns, setReturns] = useState<any[]>([]);
    const [showConfig, setShowConfig] = useState(false);
    const [configForm, setConfigForm] = useState({ panNumber: '', vatRate: '13', effectiveFrom: '', fiscalYearId: '' });
    const [fiscalYears, setFiscalYears] = useState<any[]>([]);
    const [genForm, setGenForm] = useState({ periodStart: '', periodEnd: '' });

    const load = async () => {
        const [cfgRes, retRes, fyRes] = await Promise.all([
            apiService.getVatConfig(organizationId),
            apiService.getVatReturns(organizationId),
            apiService.getFiscalYears(organizationId),
        ]);
        if (cfgRes.success) setConfig(cfgRes.data);
        if (retRes.success) setReturns((retRes.data as any[]) || []);
        if (fyRes.success) setFiscalYears((fyRes.data as any[]) || []);
    };

    useEffect(() => { load(); }, [organizationId]);

    const saveConfig = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiService.configureVat({ ...configForm, organizationId, vatRate: parseFloat(configForm.vatRate) });
        if (res.success) { setShowConfig(false); load(); }
    };

    const generateReturn = async (e: React.FormEvent) => {
        e.preventDefault();
        await apiService.generateVatReturn({ organizationId, ...genForm });
        load();
    };

    const STATUS_COLORS: Record<string, string> = {
        DRAFT: 'bg-yellow-100 text-yellow-800',
        SUBMITTED: 'bg-green-100 text-green-800',
        FILED: 'bg-blue-100 text-blue-800',
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">VAT Management</h2>
                <button onClick={() => setShowConfig(!showConfig)} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                    {config ? 'Update VAT Config' : 'Configure VAT'}
                </button>
            </div>

            {config && (
                <div className="p-4 bg-blue-50 rounded-lg text-sm">
                    <p>PAN: <strong>{config.panNumber}</strong> | VAT Rate: <strong>{config.vatRate}%</strong> | Since: {new Date(config.effectiveFrom).toLocaleDateString()}</p>
                </div>
            )}

            {showConfig && (
                <form onSubmit={saveConfig} className="p-4 bg-gray-50 rounded-lg border space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                            <input className="w-full border rounded px-3 py-2 text-sm" value={configForm.panNumber} onChange={e => setConfigForm({ ...configForm, panNumber: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">VAT Rate (%)</label>
                            <input type="number" step="0.01" className="w-full border rounded px-3 py-2 text-sm" value={configForm.vatRate} onChange={e => setConfigForm({ ...configForm, vatRate: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Effective From</label>
                            <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={configForm.effectiveFrom} onChange={e => setConfigForm({ ...configForm, effectiveFrom: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
                            <select className="w-full border rounded px-3 py-2 text-sm" value={configForm.fiscalYearId} onChange={e => setConfigForm({ ...configForm, fiscalYearId: e.target.value })} required>
                                <option value="">Select…</option>
                                {fiscalYears.map(fy => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm">Save</button>
                        <button type="button" onClick={() => setShowConfig(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm">Cancel</button>
                    </div>
                </form>
            )}

            <div>
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-medium text-gray-700">VAT Returns</h3>
                </div>
                <form onSubmit={generateReturn} className="flex gap-2 mb-4">
                    <input type="date" className="border rounded px-3 py-2 text-sm" value={genForm.periodStart} onChange={e => setGenForm({ ...genForm, periodStart: e.target.value })} required placeholder="From" title="Period Start" />
                    <input type="date" className="border rounded px-3 py-2 text-sm" value={genForm.periodEnd} onChange={e => setGenForm({ ...genForm, periodEnd: e.target.value })} required placeholder="To" title="Period End" />
                    <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">Generate Return</button>
                </form>

                <table className="min-w-full bg-white border rounded-lg overflow-hidden text-sm">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Period', 'Output VAT', 'Input VAT', 'Net VAT', 'Status', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {returns.map(r => (
                            <tr key={r.id}>
                                <td className="px-4 py-3">{new Date(r.periodStart).toLocaleDateString()} – {new Date(r.periodEnd).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{Number(r.outputVat).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right tabular-nums">{Number(r.inputVat).toLocaleString()}</td>
                                <td className="px-4 py-3 text-right tabular-nums font-medium">{Number(r.netVat).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[r.status] ?? 'bg-gray-100 text-gray-600'}`}>{r.status}</span>
                                </td>
                                <td className="px-4 py-3">
                                    {r.status === 'DRAFT' && (
                                        <button onClick={() => apiService.submitVatReturn(r.id).then(load)} className="text-xs text-green-700 hover:underline">Submit</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {returns.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No VAT returns yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
