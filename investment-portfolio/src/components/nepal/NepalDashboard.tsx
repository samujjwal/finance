import { useState } from 'react';
import { VatDashboard } from './VatDashboard';
import { IrdExportPanel } from './IrdExportPanel';
import { BsDatePicker } from './BsDatePicker';

interface Props {
    organizationId: string;
}

type NepalTab = 'vat' | 'ird' | 'calendar';

export function NepalDashboard({ organizationId }: Props) {
    const [tab, setTab] = useState<NepalTab>('vat');
    const [demoDate, setDemoDate] = useState('');
    const [demoBsLabel, setDemoBsLabel] = useState('');

    const tabs: { id: NepalTab; label: string }[] = [
        { id: 'vat', label: 'VAT' },
        { id: 'ird', label: 'IRD Exports' },
        { id: 'calendar', label: 'BS Calendar' },
    ];

    return (
        <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6 px-6">
                    {tabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${tab === t.id
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </nav>
            </div>
            {tab === 'vat' && <VatDashboard organizationId={organizationId} />}
            {tab === 'ird' && <IrdExportPanel organizationId={organizationId} />}
            {tab === 'calendar' && (
                <div className="p-6 space-y-4">
                    <h2 className="text-xl font-semibold text-gray-800">BS / AD Calendar Conversion</h2>
                    <p className="text-sm text-gray-600">Convert between Bikram Sambat (BS) and Gregorian (AD) dates.</p>
                    <div className="max-w-sm">
                        <BsDatePicker
                            label="Pick a date"
                            value={demoDate}
                            onChange={(ad, bs) => { setDemoDate(ad); setDemoBsLabel(bs); }}
                        />
                        {demoDate && (
                            <div className="mt-3 p-3 bg-blue-50 rounded text-sm">
                                <p>AD (Gregorian): <strong>{demoDate}</strong></p>
                                <p>BS (Bikram Sambat): <strong>{demoBsLabel}</strong></p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
