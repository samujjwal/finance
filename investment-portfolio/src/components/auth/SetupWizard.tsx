import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { useAuthStore } from '@/stores/authStore';
import { importTransactionsFromExcel } from '@/utils/excelExportImport';

const DEFAULT_EXCEL_PATH =
    '/home/samujjwal/Developments/finance/New JCL Investment F.Y 2082_83 .xlsx';

interface SetupWizardProps {
    onComplete: () => void;
}

type Step = 'account' | 'import' | 'done';

export function SetupWizard({ onComplete }: SetupWizardProps) {
    /* ── Step tracking ── */
    const [step, setStep] = useState<Step>('account');

    /* ── Account creation form ── */
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPass, setShowPass] = useState(false);

    /* ── Shared loading / feedback ── */
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [progress, setProgress] = useState('');

    /* ── Import step ── */
    const fileInputRef = useRef<HTMLInputElement>(null);

    /* ════════════════════════════════════════════════════════════
       STEP 1 – Create user account
    ════════════════════════════════════════════════════════════ */
    const handleCreateAccount = async () => {
        setError(null);

        if (!username.trim()) { setError('Username is required'); return; }
        if (username.trim().length < 3) { setError('Username must be at least 3 characters'); return; }
        if (!password) { setError('Password is required'); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
        if (password !== confirmPassword) { setError('Passwords do not match'); return; }

        setLoading(true);
        try {
            const res = await apiService.register({
                username: username.trim(),
                email: `${username.trim()}@jcl.local`,
                password,
            });

            if (!res.success) {
                throw new Error((res as any).error || 'Registration failed');
            }

            // Auto-login: store token and refresh Zustand auth state
            const { token } = res.data as any;
            localStorage.setItem('auth_token', token);
            await useAuthStore.getState().checkAuth();

            setStep('import');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    /* ════════════════════════════════════════════════════════════
       STEP 2 – Import Excel (optional)
    ════════════════════════════════════════════════════════════ */
    const handleImportFile = async (file: File) => {
        setLoading(true);
        setError(null);
        setProgress('Reading Excel file…');

        try {
            const result = await importTransactionsFromExcel(file);

            if (result.errors.length > 0) {
                console.warn('Import warnings:', result.errors);
            }

            // Import companies first
            setProgress(`Importing ${result.companies.length} companies…`);
            for (const company of result.companies) {
                try { await apiService.createCompany(company); } catch { /* may already exist */ }
            }

            // Import transactions
            let imported = 0;
            let failed = 0;
            setProgress(`Importing ${result.transactions.length} transactions…`);
            for (const txn of result.transactions) {
                try { await apiService.createTransaction(txn); imported++; }
                catch { failed++; }
            }

            // Trigger portfolio recalculation
            await apiService.recalculatePortfolio();

            setProgress(
                `Done! Imported ${imported} transactions` +
                (failed > 0 ? ` (${failed} skipped)` : '') +
                '.',
            );

            setStep('done');
            setTimeout(onComplete, 1800);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to import file');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleImportFile(file);
    };

    /* ════════════════════════════════════════════════════════════
       Render
    ════════════════════════════════════════════════════════════ */
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-100 py-12 px-4">
            <div className="max-w-lg w-full space-y-6">

                {/* Progress indicator */}
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                    {(['account', 'import', 'done'] as Step[]).map((s, i) => (
                        <span key={s} className="flex items-center space-x-2">
                            <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-semibold text-xs
                ${step === s ? 'bg-indigo-600 text-white' :
                                    (['account', 'import', 'done'].indexOf(step) > i
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 text-gray-500')}`}>
                                {(['account', 'import', 'done'] as Step[]).indexOf(step) > i ? '✓' : i + 1}
                            </span>
                            <span className={step === s ? 'text-indigo-700 font-medium' : ''}>
                                {s === 'account' ? 'Create Account' : s === 'import' ? 'Import Data' : 'Done'}
                            </span>
                            {i < 2 && <span className="text-gray-300">›</span>}
                        </span>
                    ))}
                </div>

                {/* ── STEP 1: Create Account ── */}
                {step === 'account' && (
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">Welcome to JCL Portfolio</CardTitle>
                            <CardDescription>
                                Create your user account to get started. A <strong>root</strong> administrator
                                account has been auto-provisioned — set up your personal login below.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Root user info banner */}
                            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
                                <p className="font-semibold text-amber-800 mb-1">Auto-created admin account</p>
                                <p className="text-amber-700">
                                    Username: <code className="bg-amber-100 px-1 rounded">root</code>&nbsp;/&nbsp;
                                    Password: <code className="bg-amber-100 px-1 rounded">password123#</code>
                                </p>
                                <p className="text-amber-600 mt-1 text-xs">Keep this safe. You can change it after setup.</p>
                            </div>

                            {/* Username */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Your Username
                                </label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={e => { setUsername(e.target.value); setError(null); }}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
                                    placeholder="e.g. jcl_admin"
                                    disabled={loading}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Password <span className="text-gray-400 text-xs">(min 8 characters)</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPass ? 'text' : 'password'}
                                        value={password}
                                        onChange={e => { setPassword(e.target.value); setError(null); }}
                                        placeholder="••••••••"
                                        disabled={loading}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-16"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPass(v => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 hover:text-gray-700 px-1"
                                    >
                                        {showPass ? 'Hide' : 'Show'}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setError(null); }}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateAccount()}
                                    placeholder="••••••••"
                                    disabled={loading}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            {/* Error */}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-2">
                                <Button variant="outline" onClick={onComplete} disabled={loading} className="text-sm">
                                    Skip setup
                                </Button>
                                <Button onClick={handleCreateAccount} disabled={loading}>
                                    {loading ? 'Creating account…' : 'Create Account →'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── STEP 2: Import Data ── */}
                {step === 'import' && (
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-xl font-bold">Import Existing Data</CardTitle>
                            <CardDescription>
                                Optionally load your portfolio history from an Excel file. You can skip
                                and add transactions manually later.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5">
                            {/* Suggested file */}
                            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                <p className="text-xs font-semibold text-blue-900 mb-1">Suggested file:</p>
                                <p className="text-xs text-blue-700 font-mono break-all">{DEFAULT_EXCEL_PATH}</p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Must contain a <em>LISTED COMPANIES</em> sheet plus per-company transaction sheets.
                                </p>
                            </div>

                            {/* File picker */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Select Excel File (.xlsx / .xls)
                                </label>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleFileSelected}
                                    disabled={loading}
                                    className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                    file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                                />
                            </div>

                            {/* Progress */}
                            {progress && !error && (
                                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded text-sm flex items-center space-x-2">
                                    {loading && <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />}
                                    <span>{progress}</span>
                                </div>
                            )}
                            {error && (
                                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                                    <strong>Error:</strong> {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-2">
                                <Button variant="outline" onClick={onComplete} disabled={loading}>
                                    Skip — start empty
                                </Button>
                                <Button onClick={() => fileInputRef.current?.click()} disabled={loading}>
                                    {loading ? 'Importing…' : 'Browse & Import'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* ── STEP 3: Done ── */}
                {step === 'done' && (
                    <Card>
                        <CardHeader className="text-center">
                            <div className="text-5xl mb-2">🎉</div>
                            <CardTitle className="text-xl font-bold">Setup Complete!</CardTitle>
                            <CardDescription>{progress || 'Your portfolio is ready.'}</CardDescription>
                        </CardHeader>
                        <CardContent className="flex justify-center pt-2">
                            <Button onClick={onComplete}>Go to Dashboard →</Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
