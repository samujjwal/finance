import { useState, useRef } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { apiService } from '@/services/api';
import { exportTransactionsToExcel, importTransactionsFromExcel } from '@/utils/excelExportImport';

interface ImportExportProps {
  companies: any[];
  onImport: () => void;
}

export function ImportExport({ companies, onImport }: ImportExportProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Use the new ExcelJS-based import function
      const result = await importTransactionsFromExcel(file);

      if (result.errors.length > 0) {
        setError(`Import completed with warnings: ${result.errors.join(', ')}`);
      }

      // Import transactions via API
      let imported = 0;
      let failed = 0;

      for (const transaction of result.transactions) {
        try {
          await apiService.createTransaction(transaction);
          imported++;
        } catch (err) {
          failed++;
          console.error('Failed to import transaction:', err);
        }
      }

      // Import companies via API
      for (const company of result.companies) {
        try {
          await apiService.createCompany(company);
        } catch (err) {
          console.error('Failed to import company:', err);
        }
      }

      setSuccess(`Successfully imported ${imported} transactions${failed > 0 ? ` (${failed} failed)` : ''}`);
      onImport();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to import file');
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get all transactions and companies
      const [transactionsResponse, companiesResponse] = await Promise.all([
        apiService.getTransactions(),
        apiService.getCompanies()
      ]);

      const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : [];
      const companies = Array.isArray(companiesResponse) ? companiesResponse : [];

      // Export to Excel using ExcelJS
      const excelBuffer = await exportTransactionsToExcel(transactions, companies);

      // Create and download the file
      const blob = new Blob([excelBuffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `investment-portfolio-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess('Excel file exported successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import/Export Data</CardTitle>
        <CardDescription>
          Import transactions from Excel files or export your portfolio data
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-sm font-medium mb-2">Import Data</h4>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileImport}
              disabled={loading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supports Excel files (.xlsx, .xls) with the standard format
            </p>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Export Data</h4>
            <Button
              onClick={handleExport}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? 'Exporting...' : 'Export to Excel'}
            </Button>
            <p className="text-xs text-gray-500 mt-1">
              Download all transactions and companies as Excel file
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            <strong>Success:</strong> {success}
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-4">
          <h4 className="font-medium mb-2">File Format Requirements:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Excel file must contain "LISTED COMPANIES" sheet with company information</li>
            <li>Each company should have its own sheet with transaction data</li>
            <li>Required columns: SYMBOL, Company Name, Txn Date, Txn Type</li>
            <li>Transaction types must be "BUY" or "SELL"</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
