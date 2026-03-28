import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface Props { organizationId: string; }

export function IrdExportPanel({ organizationId }: Props) {
    const [fiscalYears, setFiscalYears] = useState<any[]>([]);
    const [selectedFy, setSelectedFy] = useState('');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');

    useEffect(() => {
        apiService.getFiscalYears(organizationId).then(res => {
            if (res.success) setFiscalYears((res.data as any[]) || []);
        });
    }, [organizationId]);

    return (
        <div className="p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800">IRD Exports</h2>
            <p className="text-sm text-gray-600">Download tax registers in IRD-compatible CSV format.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* VAT Registers */}
                <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                    <h3 className="font-medium text-gray-700">VAT Registers (Annex 9 / 10)</h3>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">From</label>
                            <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={from} onChange={e => setFrom(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-600 mb-1">To</label>
                            <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={to} onChange={e => setTo(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => apiService.downloadSalesRegister(organizationId, from, to)}
                            disabled={!from || !to}
                            className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                            Sales Register (CSV)
                        </button>
                        <button
                            onClick={() => apiService.downloadPurchaseRegister(organizationId, from, to)}
                            disabled={!from || !to}
                            className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                            Purchase Register (CSV)
                        </button>
                    </div>
                </div>

                {/* TDS Register */}
                <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
                    <h3 className="font-medium text-gray-700">TDS Register (Annual)</h3>
                    <div>
                        <label className="block text-xs text-gray-600 mb-1">Fiscal Year</label>
                        <select className="w-full border rounded px-2 py-1 text-sm" value={selectedFy} onChange={e => setSelectedFy(e.target.value)}>
                            <option value="">Select fiscal year…</option>
                            {fiscalYears.map(fy => <option key={fy.id} value={fy.id}>{fy.name}</option>)}
                        </select>
                    </div>
                    <button
                        onClick={() => apiService.downloadTdsRegister(organizationId, selectedFy)}
                        disabled={!selectedFy}
                        className="px-3 py-2 bg-orange-600 text-white rounded text-sm hover:bg-orange-700 disabled:opacity-50"
                    >
                        TDS Register (CSV)
                    </button>
                </div>
            </div>
        </div>
    );
}
