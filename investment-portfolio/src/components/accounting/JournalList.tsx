import { useState, useEffect } from 'react';
import { apiService } from '@/services/api';

interface Props { organizationId: string; userId: number; }

interface JournalEntry {
    id: string;
    entryNumber: string;
    entryDate: string;
    description: string;
    status: 'DRAFT' | 'POSTED' | 'REVERSED';
    totalDebit: number;
    totalCredit: number;
    reference?: string;
}

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    POSTED: 'bg-green-100 text-green-800',
    REVERSED: 'bg-gray-100 text-gray-600',
};

export function JournalList({ organizationId, userId }: Props) {
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<JournalEntry | null>(null);
    const [detail, setDetail] = useState<any>(null);

    const load = async () => {
        setLoading(true);
        const res = await apiService.getJournals(organizationId);
        if (res.success) {
            const payload = (res.data as any[]) || [];
            setEntries(
                payload.map((entry: any) => ({
                    id: entry.id,
                    entryNumber: entry.reference || entry.id,
                    entryDate: entry.entryDate,
                    description: entry.narration || 'Journal Entry',
                    status: entry.status,
                    totalDebit: Number(entry.totalDebit ?? 0),
                    totalCredit: Number(entry.totalCredit ?? 0),
                    reference: entry.reference,
                })),
            );
        }
        setLoading(false);
    };

    const openDetail = async (entry: JournalEntry) => {
        setSelected(entry);
        const res = await apiService.getJournal(entry.id);
        if (res.success) setDetail(res.data);
    };

    const handlePost = async (id: string) => {
        const res = await apiService.postJournal(id, userId);
        if (res.success) load();
    };

    useEffect(() => { load(); }, [organizationId]);

    if (loading) return <div className="p-6 text-gray-500">Loading journals…</div>;

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-800">Journal Entries</h2>
            </div>

            {selected && detail && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="p-4 border-b flex justify-between">
                            <h3 className="font-semibold">{detail.reference || detail.id} — {detail.narration || 'Journal Entry'}</h3>
                            <button onClick={() => { setSelected(null); setDetail(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
                        </div>
                        <div className="p-4">
                            <div className="flex gap-4 mb-4 text-sm text-gray-600">
                                <span>Date: {new Date(detail.entryDate).toLocaleDateString()}</span>
                                <span className={`px-2 py-1 rounded-full text-xs ${STATUS_COLORS[detail.status]}`}>{detail.status}</span>
                                {detail.reference && <span>Ref: {detail.reference}</span>}
                            </div>
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left text-xs text-gray-500">Account</th>
                                        <th className="px-3 py-2 text-right text-xs text-gray-500">Debit</th>
                                        <th className="px-3 py-2 text-right text-xs text-gray-500">Credit</th>
                                        <th className="px-3 py-2 text-left text-xs text-gray-500">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(detail.lines || []).map((l: any) => (
                                        <tr key={l.id}>
                                            <td className="px-3 py-2">{l.ledgerAccount?.name ?? l.ledgerAccountId}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{l.debit > 0 ? l.debit.toLocaleString() : ''}</td>
                                            <td className="px-3 py-2 text-right tabular-nums">{l.credit > 0 ? l.credit.toLocaleString() : ''}</td>
                                            <td className="px-3 py-2 text-gray-500">{l.narration}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {detail.status === 'DRAFT' && (
                                <div className="mt-4 flex justify-end">
                                    <button onClick={() => { handlePost(detail.id); setSelected(null); setDetail(null); }}
                                        className="px-4 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700">
                                        Post Journal Entry
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="min-w-full bg-white border rounded-lg overflow-hidden">
                    <thead className="bg-gray-50">
                        <tr>
                            {['Entry #', 'Date', 'Description', 'Reference', 'Debit', 'Credit', 'Status', ''].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {entries.map(e => (
                            <tr key={e.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => openDetail(e)}>
                                <td className="px-4 py-3 text-sm font-mono text-indigo-700">{e.entryNumber}</td>
                                <td className="px-4 py-3 text-sm text-gray-600">{new Date(e.entryDate).toLocaleDateString()}</td>
                                <td className="px-4 py-3 text-sm text-gray-900">{e.description}</td>
                                <td className="px-4 py-3 text-sm text-gray-500">{e.reference ?? '—'}</td>
                                <td className="px-4 py-3 text-sm text-right tabular-nums">{Number(e.totalDebit).toLocaleString()}</td>
                                <td className="px-4 py-3 text-sm text-right tabular-nums">{Number(e.totalCredit).toLocaleString()}</td>
                                <td className="px-4 py-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${STATUS_COLORS[e.status]}`}>{e.status}</span>
                                </td>
                                <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                                    {e.status === 'DRAFT' && (
                                        <button onClick={() => handlePost(e.id)} className="text-xs text-green-700 hover:underline">Post</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                        {entries.length === 0 && (
                            <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-sm">No journal entries yet.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
