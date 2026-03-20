import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { calculateTransactionCharges } from '@/utils/taxCalculations';

interface GridTransaction {
  _rowId: string;
  id?: string;
  companySymbol: string;
  transactionType: 'BUY' | 'SELL';
  transactionDate: string;
  billNo?: string;
  purchaseQuantity: number;
  purchasePricePerUnit?: number;
  totalPurchaseAmount?: number;
  salesQuantity: number;
  salesPricePerUnit?: number;
  totalSalesAmount?: number;
  // Enhanced fields
  purchaseCommission?: number;
  purchaseDpCharges?: number;
  totalPurchaseCommission?: number;
  totalInvestmentCost?: number;
  salesCommission?: number;
  salesDpCharges?: number;
  totalSalesCommission?: number;
  capitalGainTax?: number;
  netReceivables?: number;
  isNew?: boolean;
  hasErrors?: boolean;
  errors?: Record<string, string>;
}

interface TransactionGridProps {
  companies: any[];
  onSave: (transactions: GridTransaction[]) => Promise<void>;
  onCancel: () => void;
}

export function TransactionGrid({ companies, onSave, onCancel }: TransactionGridProps) {
  const [transactions, setTransactions] = useState<GridTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const rowIdCounter = useRef(0);

  const createEmptyTransaction = useCallback((): GridTransaction => {
    rowIdCounter.current += 1;
    return {
      _rowId: `row-${rowIdCounter.current}`,
      companySymbol: '',
      transactionType: 'BUY',
      transactionDate: new Date().toISOString().split('T')[0],
      billNo: '',
      purchaseQuantity: 0,
      purchasePricePerUnit: undefined,
      totalPurchaseAmount: undefined,
      salesQuantity: 0,
      salesPricePerUnit: undefined,
      totalSalesAmount: undefined,
      // Enhanced fields
      purchaseCommission: 0,
      purchaseDpCharges: 0,
      totalPurchaseCommission: 0,
      totalInvestmentCost: undefined,
      salesCommission: 0,
      salesDpCharges: 0,
      totalSalesCommission: 0,
      capitalGainTax: 0,
      netReceivables: 0,
      isNew: true,
      hasErrors: false,
      errors: {},
    };
  }, []);

  useEffect(() => {
    // Initialize with one empty row on mount only
    setTransactions([createEmptyTransaction()]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addNewRow = useCallback(() => {
    setTransactions(prev => [...prev, createEmptyTransaction()]);
  }, [createEmptyTransaction]);

  const removeRow = useCallback((index: number) => {
    setTransactions(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateTransaction = useCallback((index: number, field: keyof GridTransaction, value: any) => {
    setTransactions(prev => {
      const updated = [...prev];
      const transaction = { ...updated[index] };

      // Update the field
      (transaction as any)[field] = value;

      // Auto-calculate purchase total and charges synchronously
      if (field === 'purchaseQuantity' || field === 'purchasePricePerUnit') {
        const qty = field === 'purchaseQuantity' ? (value as number) : (transaction.purchaseQuantity || 0);
        const price = field === 'purchasePricePerUnit' ? (value as number) : (transaction.purchasePricePerUnit || 0);
        const total = qty && price ? qty * price : undefined;
        transaction.totalPurchaseAmount = total;
        if (total) {
          const charges = calculateTransactionCharges('BUY', total);
          transaction.purchaseCommission = charges.brokerage;
          transaction.purchaseDpCharges = charges.dpCharges;
          transaction.totalPurchaseCommission = charges.totalCharges;
          transaction.totalInvestmentCost = total + charges.totalCharges;
        } else {
          transaction.purchaseCommission = 0;
          transaction.purchaseDpCharges = 0;
          transaction.totalPurchaseCommission = 0;
          transaction.totalInvestmentCost = undefined;
        }
      }

      // Auto-calculate sales total and charges synchronously
      if (field === 'salesQuantity' || field === 'salesPricePerUnit') {
        const qty = field === 'salesQuantity' ? (value as number) : (transaction.salesQuantity || 0);
        const price = field === 'salesPricePerUnit' ? (value as number) : (transaction.salesPricePerUnit || 0);
        const total = qty && price ? qty * price : undefined;
        transaction.totalSalesAmount = total;
        if (total) {
          const charges = calculateTransactionCharges('SELL', total);
          transaction.salesCommission = charges.brokerage;
          transaction.salesDpCharges = charges.dpCharges;
          transaction.totalSalesCommission = charges.totalCharges;
          // Net receivables = salesAmount - commission - dpCharges - sebonFee
          transaction.netReceivables = total - charges.totalCharges;
        } else {
          transaction.salesCommission = 0;
          transaction.salesDpCharges = 0;
          transaction.totalSalesCommission = 0;
          transaction.netReceivables = 0;
        }
      }

      // Clear opposite transaction type fields when switching type
      if (field === 'transactionType') {
        if (value === 'BUY') {
          transaction.salesQuantity = 0;
          transaction.salesPricePerUnit = undefined;
          transaction.totalSalesAmount = undefined;
          transaction.salesCommission = 0;
          transaction.salesDpCharges = 0;
          transaction.totalSalesCommission = 0;
          transaction.capitalGainTax = 0;
          transaction.netReceivables = 0;
          transaction.purchaseQuantity = transaction.purchaseQuantity || 0;
        } else {
          transaction.purchaseQuantity = 0;
          transaction.purchasePricePerUnit = undefined;
          transaction.totalPurchaseAmount = undefined;
          transaction.purchaseCommission = 0;
          transaction.purchaseDpCharges = 0;
          transaction.totalPurchaseCommission = 0;
          transaction.totalInvestmentCost = undefined;
          transaction.salesQuantity = transaction.salesQuantity || 0;
        }
      }

      updated[index] = transaction;
      return updated;
    });
  }, []);

  const validateTransaction = (transaction: GridTransaction): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!transaction.companySymbol) {
      errors.companySymbol = 'Company is required';
    }

    if (!transaction.transactionDate) {
      errors.transactionDate = 'Date is required';
    }

    if (transaction.transactionType === 'BUY') {
      if (!transaction.purchaseQuantity || transaction.purchaseQuantity <= 0) {
        errors.purchaseQuantity = 'Quantity must be greater than 0';
      }
      if (!transaction.purchasePricePerUnit || transaction.purchasePricePerUnit <= 0) {
        errors.purchasePricePerUnit = 'Price must be greater than 0';
      }
    } else {
      if (!transaction.salesQuantity || transaction.salesQuantity <= 0) {
        errors.salesQuantity = 'Quantity must be greater than 0';
      }
      if (!transaction.salesPricePerUnit || transaction.salesPricePerUnit <= 0) {
        errors.salesPricePerUnit = 'Price must be greater than 0';
      }
    }

    return errors;
  };

  const validateAllTransactions = () => {
    let hasErrors = false;
    const updated = transactions.map(transaction => {
      const errors = validateTransaction(transaction);
      const isValid = Object.keys(errors).length === 0;

      if (!isValid) {
        hasErrors = true;
      }

      return {
        ...transaction,
        hasErrors: !isValid,
        errors,
      };
    });

    setTransactions(updated);
    return !hasErrors;
  };

  const handleSave = async () => {
    if (!validateAllTransactions()) {
      setError('Please fix validation errors before saving');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Filter out empty transactions
      const validTransactions = transactions.filter(t =>
        t.companySymbol &&
        (t.transactionType === 'BUY' ? t.purchaseQuantity > 0 : t.salesQuantity > 0)
      );

      await onSave(validTransactions);
    } catch (err) {
      setError('Failed to save transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, field: keyof GridTransaction) => {
    // Handle navigation with arrow keys
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextRow = rowIndex + 1;
      if (nextRow < transactions.length) {
        const nextInput = gridRef.current?.querySelector(`[data-row="${nextRow}"][data-field="${field}"]`) as HTMLInputElement;
        nextInput?.focus();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevRow = rowIndex - 1;
      if (prevRow >= 0) {
        const prevInput = gridRef.current?.querySelector(`[data-row="${prevRow}"][data-field="${field}"]`) as HTMLInputElement;
        prevInput?.focus();
      }
    } else if (e.key === 'Tab' && !e.shiftKey && field === 'totalSalesAmount') {
      e.preventDefault();
      addNewRow();
    }
  };

  const formatCurrency = (value?: number) => {
    if (!value) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'NPR',
    }).format(value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Transaction Entry</CardTitle>
        <CardDescription>
          Enter multiple transactions in a spreadsheet-like interface. Use Tab to navigate between fields.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Grid */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <div ref={gridRef} className="min-w-max">
                {/* Header */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200">
                  <div className="col-span-2 px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200">
                    Company
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200">
                    Type
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200">
                    Date
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200">
                    Bill No
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200">
                    Qty
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200">
                    Price/Unit
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 border-r border-gray-200">
                    Total Amount
                  </div>
                  <div className="px-3 py-2 text-xs font-medium text-gray-700 text-center">
                    Actions
                  </div>
                </div>

                {/* Rows */}
                {transactions.map((transaction, rowIndex) => (
                  <div key={transaction._rowId} className={`grid grid-cols-12 border-b border-gray-200 ${transaction.hasErrors ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                    {/* Company */}
                    <div className="col-span-2 border-r border-gray-200">
                      <select
                        data-row={rowIndex}
                        data-field="companySymbol"
                        value={transaction.companySymbol}
                        onChange={(e) => updateTransaction(rowIndex, 'companySymbol', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 'companySymbol')}
                        className={`w-full px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${transaction.errors?.companySymbol ? 'border-red-500' : ''
                          }`}
                      >
                        <option value="">Select company</option>
                        {companies.map((company) => (
                          <option key={company.symbol} value={company.symbol}>
                            {company.symbol}
                          </option>
                        ))}
                      </select>
                      {transaction.errors?.companySymbol && (
                        <div className="text-xs text-red-600 px-3 pb-1">
                          {transaction.errors.companySymbol}
                        </div>
                      )}
                    </div>

                    {/* Transaction Type */}
                    <div className="border-r border-gray-200">
                      <select
                        data-row={rowIndex}
                        data-field="transactionType"
                        value={transaction.transactionType}
                        onChange={(e) => updateTransaction(rowIndex, 'transactionType', e.target.value as 'BUY' | 'SELL')}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 'transactionType')}
                        className="w-full px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="BUY">BUY</option>
                        <option value="SELL">SELL</option>
                      </select>
                    </div>

                    {/* Date */}
                    <div className="border-r border-gray-200">
                      <input
                        type="date"
                        data-row={rowIndex}
                        data-field="transactionDate"
                        value={transaction.transactionDate}
                        onChange={(e) => updateTransaction(rowIndex, 'transactionDate', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 'transactionDate')}
                        className={`w-full px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${transaction.errors?.transactionDate ? 'border-red-500' : ''
                          }`}
                      />
                      {transaction.errors?.transactionDate && (
                        <div className="text-xs text-red-600 px-3 pb-1">
                          {transaction.errors.transactionDate}
                        </div>
                      )}
                    </div>

                    {/* Bill No */}
                    <div className="border-r border-gray-200">
                      <input
                        type="text"
                        data-row={rowIndex}
                        data-field="billNo"
                        value={transaction.billNo || ''}
                        onChange={(e) => updateTransaction(rowIndex, 'billNo', e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, 'billNo')}
                        placeholder="Bill #"
                        className="w-full px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>

                    {/* Quantity */}
                    <div className="border-r border-gray-200">
                      <input
                        type="number"
                        data-row={rowIndex}
                        data-field={transaction.transactionType === 'BUY' ? 'purchaseQuantity' : 'salesQuantity'}
                        value={transaction.transactionType === 'BUY' ? transaction.purchaseQuantity : transaction.salesQuantity}
                        onChange={(e) => {
                          const field = transaction.transactionType === 'BUY' ? 'purchaseQuantity' : 'salesQuantity';
                          updateTransaction(rowIndex, field as any, parseInt(e.target.value) || 0);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, transaction.transactionType === 'BUY' ? 'purchaseQuantity' : 'salesQuantity')}
                        placeholder="0"
                        min="0"
                        className={`w-full px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${transaction.errors?.purchaseQuantity || transaction.errors?.salesQuantity ? 'border-red-500' : ''
                          }`}
                      />
                      {(transaction.errors?.purchaseQuantity || transaction.errors?.salesQuantity) && (
                        <div className="text-xs text-red-600 px-3 pb-1">
                          {transaction.errors?.purchaseQuantity || transaction.errors?.salesQuantity}
                        </div>
                      )}
                    </div>

                    {/* Price per Unit */}
                    <div className="border-r border-gray-200">
                      <input
                        type="number"
                        data-row={rowIndex}
                        data-field={transaction.transactionType === 'BUY' ? 'purchasePricePerUnit' : 'salesPricePerUnit'}
                        value={transaction.transactionType === 'BUY' ? (transaction.purchasePricePerUnit || '') : (transaction.salesPricePerUnit || '')}
                        onChange={(e) => {
                          const field = transaction.transactionType === 'BUY' ? 'purchasePricePerUnit' : 'salesPricePerUnit';
                          updateTransaction(rowIndex, field as any, parseFloat(e.target.value) || undefined);
                        }}
                        onKeyDown={(e) => handleKeyDown(e, rowIndex, transaction.transactionType === 'BUY' ? 'purchasePricePerUnit' : 'salesPricePerUnit')}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className={`w-full px-3 py-2 text-sm border-0 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${transaction.errors?.purchasePricePerUnit || transaction.errors?.salesPricePerUnit ? 'border-red-500' : ''
                          }`}
                      />
                      {(transaction.errors?.purchasePricePerUnit || transaction.errors?.salesPricePerUnit) && (
                        <div className="text-xs text-red-600 px-3 pb-1">
                          {transaction.errors?.purchasePricePerUnit || transaction.errors?.salesPricePerUnit}
                        </div>
                      )}
                    </div>

                    {/* Total Amount */}
                    <div className="border-r border-gray-200">
                      <input
                        type="text"
                        data-row={rowIndex}
                        data-field={transaction.transactionType === 'BUY' ? 'totalPurchaseAmount' : 'totalSalesAmount'}
                        value={transaction.transactionType === 'BUY'
                          ? formatCurrency(transaction.totalPurchaseAmount)
                          : formatCurrency(transaction.totalSalesAmount)
                        }
                        readOnly
                        className="w-full px-3 py-2 text-sm border-0 bg-gray-50 text-gray-700"
                        placeholder="Auto-calculated"
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-center px-3 py-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeRow(rowIndex)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            {transactions.length} row{transactions.length !== 1 ? 's' : ''}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={addNewRow}
            >
              Add Row
            </Button>
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? 'Saving...' : `Save ${transactions.filter(t => t.companySymbol).length} Transactions`}
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded">
          <h4 className="font-medium mb-2">Quick Entry Tips:</h4>
          <ul className="text-sm space-y-1">
            <li>• Use Tab key to move between fields</li>
            <li>• Use arrow keys to navigate up/down</li>
            <li>• Total amount is calculated automatically</li>
            <li>• Fields are validated when you save</li>
            <li>• Empty rows are ignored when saving</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
