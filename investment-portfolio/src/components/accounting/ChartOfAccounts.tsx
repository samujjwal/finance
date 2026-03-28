import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface Props {
    organizationId: string;
}

interface LedgerAccount {
    id: string;
    code: string;
    name: string;
    accountType: string;
    balance: number;
    isActive: boolean;
    group?: { name: string };
}

export function ChartOfAccounts({ organizationId }: Props) {
    const [accounts, setAccounts] = useState<LedgerAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ code: '', name: '', accountType: 'ASSET', groupId: '', description: '' });
    const [groups, setGroups] = useState<any[]>([]);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        const [acRes, grpRes] = await Promise.all([
            apiService.getLedgerAccounts(organizationId),
            apiService.getAccountGroups(organizationId),
        ]);
        if (acRes.success) {
            const payload = (acRes.data as any[]) || [];
            setAccounts(
                payload.map((account: any) => ({
                    id: account.id,
                    code: account.code,
                    name: account.name,
                    accountType: account.accountType,
                    balance: Number(account.currentBalance ?? 0),
                    isActive: Boolean(account.isActive),
                    group: account.accountGroup ? { name: account.accountGroup.name } : undefined,
                })),
            );
        }
        if (grpRes.success) setGroups((grpRes.data as any[]) || []);
        setLoading(false);
    };

    useEffect(() => { load(); }, [organizationId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const res = await apiService.createLedgerAccount({
            organizationId,
            code: form.code,
            name: form.name,
            accountType: form.accountType,
            accountGroupId: form.groupId || undefined,
            description: form.description || undefined,
        });
        if (res.success) { setShowForm(false); setForm({ code: '', name: '', accountType: 'ASSET', groupId: '', description: '' }); load(); }
        else setError((res.error as string) || 'Failed to create account');
    };

    const handleAutoCreate = async () => {
        const res = await apiService.autoCreateInvestmentAccounts(organizationId);
        if (res.success) load();
    };

    const typeColors: Record<string, string> = {
        ASSET: 'bg-blue-100 text-blue-800',
        LIABILITY: 'bg-red-100 text-red-800',
        EQUITY: 'bg-purple-100 text-purple-800',
        INCOME: 'bg-green-100 text-green-800',
        EXPENSE: 'bg-orange-100 text-orange-800',
    };

    if (loading) return <div className="p-6 text-gray-500">Loading chart of accounts…</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Chart of Accounts</h2>
                <div className="flex gap-2">
                    <button onClick={handleAutoCreate} className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200">
                        Auto-create Investment Accounts
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
                        + New Account
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg border space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                            <input className="w-full border rounded px-3 py-2 text-sm" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                            <input className="w-full border rounded px-3 py-2 text-sm" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                            <select className="w-full border rounded px-3 py-2 text-sm" value={form.accountType} onChange={e => setForm({ ...form, accountType: e.target.value })}>
                                {['ASSET', 'LIABILITY', 'EQUITY', 'INCOME', 'EXPENSE'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Group</label>
                            <select className="w-full border rounded px-3 py-2 text-sm" value={form.groupId} onChange={e => setForm({ ...form, groupId: e.target.value })}>
                                <option value="">-- No Group --</option>
                                {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                            </select>
                        </div>
                    </div>
                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">Save</button>
                        <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300">Cancel</button>
                    </div>
                </form>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Code', 'Name', 'Type', 'Group', 'Balance', 'Status'].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {accounts.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm font-mono text-gray-900">{a.code}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{a.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${typeColors[a.accountType] ?? 'bg-gray-100 text-gray-700'}`}>{a.accountType}</span>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">{a.group?.name ?? '—'}</td>
                                <td className="px-4 py-3 text-sm font-medium text-right tabular-nums">
                                    {Number(a.balance ?? 0).toLocaleString('en-NP', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${a.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                                        {a.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {accounts.length === 0 && (
                            <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">No accounts yet. Click "Auto-create Investment Accounts" to get started.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
