import { useState } from 'react';
import { apiService } from '@/services/api';

interface Props {
    value?: string; // AD ISO string
    onChange: (adDate: string, bsLabel: string) => void;
    label?: string;
}

export function BsDatePicker({ value, onChange, label }: Props) {
    const [bsYear, setBsYear] = useState('');
    const [bsMonth, setBsMonth] = useState('');
    const [bsDay, setBsDay] = useState('');
    const [bsLabel, setBsLabel] = useState('');
    const [mode, setMode] = useState<'bs' | 'ad'>('bs');

    const handleBSChange = async () => {
        if (!bsYear || !bsMonth || !bsDay) return;
        const res = await apiService.convertBSToAD(+bsYear, +bsMonth, +bsDay);
        if (res.success && (res.data as any)?.adDate) {
            const ad = new Date((res.data as any).adDate).toISOString().split('T')[0];
            const label = `${bsYear}-${String(bsMonth).padStart(2, '0')}-${String(bsDay).padStart(2, '0')} BS`;
            setBsLabel(label);
            onChange(ad, label);
        }
    };

    const handleADChange = async (adStr: string) => {
        const res = await apiService.convertADToBS(adStr);
        if (res.success && res.data) {
            const bs = res.data as any;
            const label = `${bs.year}-${String(bs.month).padStart(2, '0')}-${String(bs.day).padStart(2, '0')} BS (${bs.monthName})`;
            setBsYear(String(bs.year));
            setBsMonth(String(bs.month));
            setBsDay(String(bs.day));
            setBsLabel(label);
            onChange(adStr, label);
        }
    };

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
            <div className="flex gap-2 text-sm mb-1">
                <button type="button" onClick={() => setMode('bs')} className={`px-2 py-1 rounded ${mode === 'bs' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>BS</button>
                <button type="button" onClick={() => setMode('ad')} className={`px-2 py-1 rounded ${mode === 'ad' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700'}`}>AD</button>
            </div>
            {mode === 'bs' ? (
                <div className="flex gap-1">
                    <input type="number" placeholder="YYYY" className="w-20 border rounded px-2 py-1 text-sm" value={bsYear} onChange={e => setBsYear(e.target.value)} />
                    <input type="number" placeholder="MM" min="1" max="12" className="w-14 border rounded px-2 py-1 text-sm" value={bsMonth} onChange={e => setBsMonth(e.target.value)} />
                    <input type="number" placeholder="DD" min="1" max="32" className="w-14 border rounded px-2 py-1 text-sm" value={bsDay} onChange={e => setBsDay(e.target.value)} />
                    <button type="button" onClick={handleBSChange} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Convert</button>
                </div>
            ) : (
                <input type="date" className="border rounded px-2 py-1 text-sm" value={value?.split('T')[0] ?? ''} onChange={e => handleADChange(e.target.value)} />
            )}
            {bsLabel && <p className="text-xs text-gray-500">{bsLabel}</p>}
        </div>
    );
}
