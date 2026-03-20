import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import type { MonthlyPerformance, SectorAnalysis } from '@/types/api';

export function ReportsView() {
    const [activeReport, setActiveReport] = useState<'performance' | 'sectors' | 'monthly'>('performance');
    const [performance, setPerformance] = useState<MonthlyPerformance[]>([]);
    const [sectors, setSectors] = useState<SectorAnalysis[]>([]);
    const [monthly, setMonthly] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    useEffect(() => {
        loadReport();
    }, [activeReport]);

    const loadReport = async () => {
        setLoading(true);
        try {
            if (activeReport === 'performance') {
                const res = await apiService.getMonthlyPerformance();
                if (res.success) setPerformance(res.data as MonthlyPerformance[]);
            } else if (activeReport === 'sectors') {
                const res = await apiService.generateSectorAnalysis({ dateFrom, dateTo });
                if (res.success) setSectors(res.data as SectorAnalysis[]);
            } else {
                const res = await apiService.getMonthlySummary();
                if (res.success) setMonthly(res.data as any[]);
            }
        } finally {
            setLoading(false);
        }
    };

    const fmt = (n: number) =>
        new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'NPR' }).format(n);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
                    <p className="text-gray-600">Portfolio reports and analytics</p>
                </div>
            </div>

            <div className="flex space-x-4">
                {(['performance', 'sectors', 'monthly'] as const).map((tab) => (
                    <Button
                        key={tab}
                        variant={activeReport === tab ? 'default' : 'outline'}
                        onClick={() => setActiveReport(tab)}
                    >
                        {tab === 'performance' ? 'Monthly Performance' : tab === 'sectors' ? 'Sector Analysis' : 'Monthly Summary'}
                    </Button>
                ))}
            </div>

            {/* Date filters for sector analysis */}
            {activeReport === 'sectors' && (
                <div className="flex items-end space-x-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md" />
                    </div>
                    <Button onClick={loadReport}>Apply</Button>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center items-center h-64"><p>Loading report...</p></div>
            ) : (
                <>
                    {activeReport === 'performance' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Performance</CardTitle>
                                <CardDescription>Buy/Sell activity by month</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {performance.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">No data available. Add transactions to see performance.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Investment</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {performance.map((p) => (
                                                    <tr key={p.month} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">{p.month}</td>
                                                        <td className="px-6 py-4 text-sm text-green-600">{fmt(p.purchases)}</td>
                                                        <td className="px-6 py-4 text-sm text-red-600">{fmt(p.sales)}</td>
                                                        <td className={`px-6 py-4 text-sm font-medium ${p.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                                                            {fmt(p.net)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeReport === 'sectors' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Sector Analysis</CardTitle>
                                <CardDescription>Portfolio distribution across sectors</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {sectors.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">No sector data available.</p>
                                ) : (
                                    <div className="space-y-4">
                                        {sectors.map((s) => (
                                            <div key={s.sector}>
                                                <div className="flex justify-between mb-1">
                                                    <span className="text-sm font-medium">{s.sector} ({s.companies} companies)</span>
                                                    <span className="text-sm text-gray-600">{s.percentage.toFixed(1)}% - {fmt(s.value)}</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-4">
                                                    <div className="bg-indigo-500 h-4 rounded-full" style={{ width: `${s.percentage}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeReport === 'monthly' && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Monthly Summary</CardTitle>
                                <CardDescription>Aggregated data by month and company</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {monthly.length === 0 ? (
                                    <p className="text-center py-8 text-gray-500">No monthly summary data. Use Portfolio &rarr; Recalculate to generate.</p>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchases</th>
                                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sales</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {monthly.map((m: any) => (
                                                    <tr key={m.id} className="hover:bg-gray-50">
                                                        <td className="px-4 py-3 text-sm">{m.monthName}</td>
                                                        <td className="px-4 py-3 text-sm font-medium">{m.companySymbol}</td>
                                                        <td className="px-4 py-3 text-sm text-gray-500">{m.sector || '-'}</td>
                                                        <td className="px-4 py-3 text-sm text-green-600">
                                                            {m.purchaseQuantity || 0} units / {fmt(m.totalPurchaseAmount || 0)}
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-red-600">
                                                            {m.salesQuantity || 0} units / {fmt(m.salesAmount || 0)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
}
