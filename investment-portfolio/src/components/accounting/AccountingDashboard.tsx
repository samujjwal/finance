import { useState } from 'react';
import { ChartOfAccounts } from './ChartOfAccounts';
import { JournalList } from './JournalList';
import { BankReconciliation } from './BankReconciliation';

interface Props {
    organizationId: string;
    userId: number;
}

type AccTab = 'coa' | 'journals' | 'banking';

export function AccountingDashboard({ organizationId, userId }: Props) {
    const [tab, setTab] = useState<AccTab>('coa');

    const tabs: { id: AccTab; label: string }[] = [
        { id: 'coa', label: 'Chart of Accounts' },
        { id: 'journals', label: 'Journal Entries' },
        { id: 'banking', label: 'Bank Reconciliation' },
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
            {tab === 'coa' && <ChartOfAccounts organizationId={organizationId} />}
            {tab === 'journals' && <JournalList organizationId={organizationId} userId={userId} />}
            {tab === 'banking' && <BankReconciliation organizationId={organizationId} />}
        </div>
    );
}
