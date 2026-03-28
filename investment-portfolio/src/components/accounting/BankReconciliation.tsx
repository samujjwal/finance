import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface Props { organizationId: string; }

export function BankReconciliation({ organizationId }: Props) {
    const [bankAccounts, setBankAccounts] = useState<any[]>([]);
    const [selected, setSelected] = useState<string>('');
    const [reconciliation, setReconciliation] = useState<any>(null);
    const [showStart, setShowStart] = useState(false);
    const [startForm, setStartForm] = useState({ statementDate: '', statementBalance: '', createdBy: '' });
    const [newTx, setNewTx] = useState({ transactionDate: '', description: '', amount: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        apiService.getBankAccounts(organizationId).then(res => {
            if (res.success) setBankAccounts((res.data as any[]) || []);
        });
    }, [organizationId]);

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await apiService.startReconciliation({
            bankAccountId: selected,
            statementDate: startForm.statementDate,
            statementBalance: parseFloat(startForm.statementBalance),
            createdBy: startForm.createdBy,
        });
        if (res.success) { setReconciliation(res.data); setShowStart(false); }
    };

    const addTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reconciliation) return;
        const res = await apiService.addBankTransaction(reconciliation.id, {
            transactionDate: newTx.transactionDate,
            description: newTx.description,
            amount: parseFloat(newTx.amount),
        });
        if (res.success) {
            setReconciliation({ ...reconciliation, transactions: [...(reconciliation.transactions || []), res.data] });
            setNewTx({ transactionDate: '', description: '', amount: '' });
        }
    };

    const autoMatch = async () => {
        if (!reconciliation) return;
        setLoading(true);
        const res = await apiService.autoMatchReconciliation(reconciliation.id);
        if (res.success) {
            const detail = await apiService.getReconciliation(reconciliation.id);
            if (detail.success) setReconciliation(detail.data);
        }
        setLoading(false);
    };

    const complete = async () => {
        if (!reconciliation) return;
        const res = await apiService.completeReconciliation(reconciliation.id);
        if (res.success) setReconciliation({ ...reconciliation, status: 'COMPLETED' });
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Bank Reconciliation</h2>
                {!reconciliation && (
                    <button onClick={() => setShowStart(true)} className="px-4 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700">
                        Start Reconciliation
                    </button>
                )}
            </div>

            {showStart && (
                <form onSubmit={handleStart} className="mb-6 p-4 bg-gray-50 rounded-lg border space-y-3">
                    <h3 className="font-medium text-gray-700">New Reconciliation</h3>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Bank Account</label>
                            <select className="w-full border rounded px-3 py-2 text-sm" value={selected} onChange={e => setSelected(e.target.value)} required>
                                <option value="">Select…</option>
                                {bankAccounts.map(a => <option key={a.id} value={a.id}>{a.accountName}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statement Date</label>
                            <input type="date" className="w-full border rounded px-3 py-2 text-sm" value={startForm.statementDate} onChange={e => setStartForm({ ...startForm, statementDate: e.target.value })} required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Statement Balance (NPR)</label>
                            <input type="number" step="0.01" className="w-full border rounded px-3 py-2 text-sm" value={startForm.statementBalance} onChange={e => setStartForm({ ...startForm, statementBalance: e.target.value })} required />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded text-sm">Start</button>
                        <button type="button" onClick={() => setShowStart(false)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded text-sm">Cancel</button>
                    </div>
                </form>
            )}

            {reconciliation && (
                <div className="space-y-4">
                    <div className="flex gap-4 p-3 bg-blue-50 rounded-lg text-sm">
                        <span>Statement Balance: <strong>NPR {Number(reconciliation.statementBalance).toLocaleString()}</strong></span>
                        <span>Book Balance: <strong>NPR {Number(reconciliation.bookBalance).toLocaleString()}</strong></span>
                        <span>Difference: <strong className={Math.abs(reconciliation.statementBalance - reconciliation.bookBalance) > 0.01 ? 'text-red-600' : 'text-green-600'}>
                            NPR {(reconciliation.statementBalance - reconciliation.bookBalance).toLocaleString()}
                        </strong></span>
                        <span className={`ml-auto px-2 py-1 rounded-full text-xs ${reconciliation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {reconciliation.status}
                        </span>
                    </div>

                    {reconciliation.status === 'OPEN' && (
                        <form onSubmit={addTransaction} className="p-3 bg-gray-50 rounded-lg border flex gap-2 items-end">
                            <div className="flex-1">
                                <label className="block text-xs text-gray-600 mb-1">Date</label>
                                <input type="date" className="w-full border rounded px-2 py-1 text-sm" value={newTx.transactionDate} onChange={e => setNewTx({ ...newTx, transactionDate: e.target.value })} required />
                            </div>
                            <div className="flex-2">
                                <label className="block text-xs text-gray-600 mb-1">Description</label>
                                <input className="w-full border rounded px-2 py-1 text-sm" value={newTx.description} onChange={e => setNewTx({ ...newTx, description: e.target.value })} required />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">Amount</label>
                                <input type="number" step="0.01" className="w-32 border rounded px-2 py-1 text-sm" value={newTx.amount} onChange={e => setNewTx({ ...newTx, amount: e.target.value })} required />
                            </div>
                            <button type="submit" className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Add</button>
                        </form>
                    )}

                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white border rounded-lg overflow-hidden text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    {['Date', 'Description', 'Amount', 'Matched'].map(h => (
                                        <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(reconciliation.transactions || []).map((t: any) => (
                                    <tr key={t.id} className={t.isMatched ? 'bg-green-50' : ''}>
                                        <td className="px-3 py-2">{new Date(t.transactionDate).toLocaleDateString()}</td>
                                        <td className="px-3 py-2">{t.description}</td>
                                        <td className="px-3 py-2 text-right tabular-nums">{Number(t.amount).toLocaleString()}</td>
                                        <td className="px-3 py-2">{t.isMatched ? '✓' : '—'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {reconciliation.status === 'OPEN' && (
                        <div className="flex gap-2">
                            <button onClick={autoMatch} disabled={loading} className="px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50">
                                {loading ? 'Matching…' : 'Auto-Match'}
                            </button>
                            <button onClick={complete} className="px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                Complete Reconciliation
                            </button>
                        </div>
                    )}
                </div>
            )}

            {bankAccounts.length === 0 && !showStart && (
                <p className="text-gray-500 text-sm mt-4">No bank accounts configured. Add bank accounts in Chart of Accounts first.</p>
            )}
        </div>
    );
}
