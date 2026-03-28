import { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { TransactionGrid } from './TransactionGrid';
import { ImportExport } from './ImportExport';
import { TransactionFilters } from './TransactionFilters';
import { CompanyStatement } from '@/components/portfolio/CompanyStatement';
import { VirtualizedDataGrid } from '@/components/common/VirtualizedDataGrid';
import { apiService } from '@/services/api';
import React from 'react';

interface Transaction {
  id: string;
  companySymbol: string;
  billNo?: string;
  transactionDate: string;
  transactionType: string;
  purchaseQuantity: number;
  purchasePricePerUnit?: number;
  totalPurchaseAmount?: number;
  salesQuantity: number;
  salesPricePerUnit?: number;
  totalSalesAmount?: number;
  createdAt: string;
  updatedAt: string;
  company?: {
    symbol: string;
    companyName: string;
    sector?: string;
  };
}

export function TransactionList() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'create' | 'bulk' | 'import' | 'statement'>('list');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<any>({});
  const hasLoadedOnce = React.useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = useCallback(async (filters?: any) => {
    if (!hasLoadedOnce.current) {
      setInitialLoading(true);
    } else {
      setIsRefreshing(true);
    }
    setError(null);
    try {
      const [transactionsResponse, companiesResponse] = await Promise.all([
        apiService.getTransactions(filters),
        apiService.getCompanies(),
      ]);

      if (transactionsResponse.success && transactionsResponse.data) {
        setTransactions(transactionsResponse.data as Transaction[]);
      }

      if (companiesResponse.success && companiesResponse.data) {
        setCompanies(companiesResponse.data as any[]);
      }
      hasLoadedOnce.current = true;
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setInitialLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleFiltersChange = useCallback((filters: any) => {
    setActiveFilters(filters);
    loadData(filters);
  }, [loadData]);

  const handleSaveGrid = useCallback(async (gridTransactions: any[]) => {
    try {
      setIsRefreshing(true);
      for (const transaction of gridTransactions) {
        await apiService.createTransaction(transaction);
      }

      setActiveView('list');
      await loadData(activeFilters);
    } catch (err) {
      setError('Failed to save transactions');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadData, activeFilters]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this transaction?')) {
      return;
    }

    try {
      setIsRefreshing(true);
      await apiService.deleteTransaction(id);
      await loadData(activeFilters);
    } catch (err) {
      setError('Failed to delete transaction');
    } finally {
      setIsRefreshing(false);
    }
  }, [loadData, activeFilters]);

  const formatCurrency = useCallback((amount?: number) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
    }).format(amount);
  }, []);

  const transactionColumns = useMemo(() => [
    {
      key: 'transactionDate' as const,
      header: 'Date',
      width: 1,
      render: (transaction: Transaction) => (
        <span className="text-sm text-gray-900">
          {new Date(transaction.transactionDate).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'companySymbol' as const,
      header: 'Company',
      width: 1.6,
      render: (transaction: Transaction) => (
        <div>
          <div className="font-medium text-sm text-gray-900">{transaction.companySymbol}</div>
          <div className="text-xs text-gray-500">{transaction.company?.companyName || '-'}</div>
        </div>
      ),
    },
    {
      key: 'transactionType' as const,
      header: 'Type',
      width: 1,
      render: (transaction: Transaction) => (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${transaction.transactionType === 'BUY' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {transaction.transactionType}
        </span>
      ),
    },
    {
      key: 'purchaseQuantity' as const,
      header: 'Quantity',
      width: 1,
      render: (transaction: Transaction) => (
        <span className="text-sm text-gray-900">
          {transaction.transactionType === 'BUY' ? transaction.purchaseQuantity : transaction.salesQuantity}
        </span>
      ),
    },
    {
      key: 'purchasePricePerUnit' as const,
      header: 'Price',
      width: 1,
      render: (transaction: Transaction) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(transaction.transactionType === 'BUY' ? transaction.purchasePricePerUnit : transaction.salesPricePerUnit)}
        </span>
      ),
    },
    {
      key: 'totalPurchaseAmount' as const,
      header: 'Total',
      width: 1,
      render: (transaction: Transaction) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(transaction.transactionType === 'BUY' ? transaction.totalPurchaseAmount : transaction.totalSalesAmount)}
        </span>
      ),
    },
    {
      key: 'id' as const,
      header: 'Actions',
      width: 1.4,
      render: (transaction: Transaction) => (
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={() => setEditingTransaction(transaction)}>Edit</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(transaction.id)}
            className="text-red-600 hover:text-red-800"
          >
            Delete
          </Button>
        </div>
      ),
    },
  ], [formatCurrency, handleDelete]);

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading transactions...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Transactions</h2>
          <p className="text-gray-600">Manage buy/sell transactions</p>
        </div>
        {isRefreshing && (
          <div className="text-sm text-gray-500 flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded-full bg-indigo-400 animate-pulse"></span>
            Refreshing...
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'list', name: 'Transaction List', icon: '📋' },
            { id: 'create', name: 'Add Transaction', icon: '➕' },
            { id: 'bulk', name: 'Bulk Entry', icon: '📝' },
            { id: 'import', name: 'Import/Export', icon: '📁' },
            { id: 'statement', name: 'Company Statement', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${activeView === tab.id
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeView === 'list' && (
        <div className="space-y-6">
          {/* Filters */}
          <TransactionFilters
            companies={companies}
            onFiltersChange={handleFiltersChange}
          />

          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View and manage all your buy/sell transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <VirtualizedDataGrid
                rows={transactions}
                columns={transactionColumns}
                rowHeight={54}
                height={520}
              />
            </CardContent>
          </Card>
        </div>
      )}

      {activeView === 'create' && (
        <TransactionForm
          companies={companies}
          onClose={() => setActiveView('list')}
          onSuccess={() => { setActiveView('list'); loadData(activeFilters); }}
        />
      )}

      {activeView === 'bulk' && (
        <TransactionGrid
          companies={companies}
          onSave={handleSaveGrid}
          onCancel={() => setActiveView('list')}
        />
      )}

      {activeView === 'import' && (
        <ImportExport
          companies={companies}
          onImport={() => { setActiveView('list'); loadData(activeFilters); }}
        />
      )}

      {activeView === 'statement' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Select Company:</label>
            <select
              value={selectedCompany || ''}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Choose a company...</option>
              {companies.map((company) => (
                <option key={company.symbol} value={company.symbol}>
                  {company.symbol} - {company.companyName}
                </option>
              ))}
            </select>
          </div>

          {selectedCompany && (
            <CompanyStatement
              companySymbol={selectedCompany}
              onClose={() => { setSelectedCompany(null); setActiveView('list'); }}
            />
          )}
        </div>
      )}

      {/* Edit Transaction Modal */}
      {editingTransaction && (
        <TransactionForm
          companies={companies}
          transaction={editingTransaction}
          onClose={() => setEditingTransaction(null)}
          onSuccess={() => { setEditingTransaction(null); loadData(activeFilters); }}
        />
      )}
    </div>
  );
}

interface TransactionFormProps {
  companies: any[];
  transaction?: Transaction;
  onClose: () => void;
  onSuccess: () => void;
}

function TransactionForm({ companies, transaction, onClose, onSuccess }: TransactionFormProps) {
  const isEditing = !!transaction;
  const [formData, setFormData] = useState({
    companySymbol: transaction?.companySymbol || '',
    transactionType: transaction?.transactionType || 'BUY',
    transactionDate: transaction ? new Date(transaction.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    billNo: transaction?.billNo || '',
    purchaseQuantity: transaction?.purchaseQuantity?.toString() || '',
    purchasePricePerUnit: transaction?.purchasePricePerUnit?.toString() || '',
    totalPurchaseAmount: transaction?.totalPurchaseAmount?.toString() || '',
    salesQuantity: transaction?.salesQuantity?.toString() || '',
    salesPricePerUnit: transaction?.salesPricePerUnit?.toString() || '',
    totalSalesAmount: transaction?.totalSalesAmount?.toString() || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const transactionData = {
        ...formData,
        purchaseQuantity: formData.purchaseQuantity ? parseInt(formData.purchaseQuantity) : 0,
        purchasePricePerUnit: formData.purchasePricePerUnit ? parseFloat(formData.purchasePricePerUnit) : undefined,
        totalPurchaseAmount: formData.totalPurchaseAmount ? parseFloat(formData.totalPurchaseAmount) : undefined,
        salesQuantity: formData.salesQuantity ? parseInt(formData.salesQuantity) : 0,
        salesPricePerUnit: formData.salesPricePerUnit ? parseFloat(formData.salesPricePerUnit) : undefined,
        totalSalesAmount: formData.totalSalesAmount ? parseFloat(formData.totalSalesAmount) : undefined,
      };

      if (isEditing) {
        await apiService.updateTransaction(transaction!.id, transactionData);
      } else {
        await apiService.createTransaction(transactionData);
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(isEditing ? 'Failed to update transaction' : 'Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Transaction' : 'Add New Transaction'}</CardTitle>
        <CardDescription>
          {isEditing ? 'Update transaction details' : 'Record a buy or sell transaction'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company *
              </label>
              <select
                name="companySymbol"
                value={formData.companySymbol}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">Select company</option>
                {companies.map((company) => (
                  <option key={company.symbol} value={company.symbol}>
                    {company.symbol} - {company.companyName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Type *
              </label>
              <select
                name="transactionType"
                value={formData.transactionType}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="BUY">Buy</option>
                <option value="SELL">Sell</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transaction Date *
              </label>
              <input
                type="date"
                name="transactionDate"
                value={formData.transactionDate}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bill Number
              </label>
              <input
                type="text"
                name="billNo"
                value={formData.billNo}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Bill number"
              />
            </div>
          </div>

          {formData.transactionType === 'BUY' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Purchase Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="purchaseQuantity"
                    value={formData.purchaseQuantity}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit *
                  </label>
                  <input
                    type="number"
                    name="purchasePricePerUnit"
                    value={formData.purchasePricePerUnit}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Price per unit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    name="totalPurchaseAmount"
                    value={formData.totalPurchaseAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Total amount"
                  />
                </div>
              </div>
            </div>
          )}

          {formData.transactionType === 'SELL' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Sales Details</h4>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    name="salesQuantity"
                    value={formData.salesQuantity}
                    onChange={handleChange}
                    required
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Quantity"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Unit *
                  </label>
                  <input
                    type="number"
                    name="salesPricePerUnit"
                    value={formData.salesPricePerUnit}
                    onChange={handleChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Price per unit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Amount
                  </label>
                  <input
                    type="number"
                    name="totalSalesAmount"
                    value={formData.totalSalesAmount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Total amount"
                  />
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? (isEditing ? 'Updating...' : 'Creating...') : (isEditing ? 'Update Transaction' : 'Create Transaction')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
