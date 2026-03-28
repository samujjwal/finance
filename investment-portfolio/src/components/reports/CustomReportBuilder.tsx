import React, { useState, useCallback } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import { Download, Filter, Plus, Trash2, Save, FileText } from 'lucide-react';
import { apiService } from '../../services/api';

// Report field definitions
const AVAILABLE_FIELDS = [
  { id: 'transactionDate', label: 'Transaction Date', type: 'date' },
  { id: 'companySymbol', label: 'Company Symbol', type: 'string' },
  { id: 'companyName', label: 'Company Name', type: 'string' },
  { id: 'sector', label: 'Sector', type: 'string' },
  { id: 'transactionType', label: 'Transaction Type', type: 'string' },
  { id: 'purchaseQuantity', label: 'Purchase Quantity', type: 'number' },
  { id: 'purchasePricePerUnit', label: 'Purchase Price', type: 'number' },
  { id: 'totalPurchaseAmount', label: 'Total Purchase', type: 'number' },
  { id: 'salesQuantity', label: 'Sales Quantity', type: 'number' },
  { id: 'salesPricePerUnit', label: 'Sales Price', type: 'number' },
  { id: 'totalSalesAmount', label: 'Total Sales', type: 'number' },
  { id: 'capitalGainTax', label: 'Capital Gain Tax', type: 'number' },
  { id: 'netReceivables', label: 'Net Receivables', type: 'number' },
  { id: 'profitLoss', label: 'Profit/Loss', type: 'number' },
];

const CHART_TYPES = [
  { id: 'table', label: 'Table', icon: FileText },
  { id: 'bar', label: 'Bar Chart', icon: BarChart },
  { id: 'line', label: 'Line Chart', icon: LineChart },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
];

const AGGREGATIONS = [
  { id: 'sum', label: 'Sum' },
  { id: 'avg', label: 'Average' },
  { id: 'count', label: 'Count' },
  { id: 'min', label: 'Minimum' },
  { id: 'max', label: 'Maximum' },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface ReportFilter {
  id: string;
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains';
  value: string;
}

interface ReportConfig {
  id?: string;
  name: string;
  description?: string;
  chartType: string;
  selectedFields: string[];
  groupBy?: string;
  aggregation?: string;
  aggregationField?: string;
  filters: ReportFilter[];
  dateRange?: {
    from?: string;
    to?: string;
  };
}

interface SavedReport {
  id: string;
  name: string;
  description?: string;
  config: ReportConfig;
  createdAt: string;
  updatedAt: string;
}

export const CustomReportBuilder: React.FC = () => {
  const [config, setConfig] = useState<ReportConfig>({
    name: 'New Report',
    chartType: 'table',
    selectedFields: ['transactionDate', 'companySymbol', 'transactionType', 'totalPurchaseAmount'],
    filters: [],
  });
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState<SavedReport[]>([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  // Add a new filter
  const addFilter = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      filters: [
        ...prev.filters,
        { id: Date.now().toString(), field: '', operator: 'eq', value: '' },
      ],
    }));
  }, []);

  // Remove a filter
  const removeFilter = useCallback((filterId: string) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId),
    }));
  }, []);

  // Update filter
  const updateFilter = useCallback((filterId: string, updates: Partial<ReportFilter>) => {
    setConfig(prev => ({
      ...prev,
      filters: prev.filters.map(f =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    }));
  }, []);

  // Toggle field selection
  const toggleField = useCallback((fieldId: string) => {
    setConfig(prev => ({
      ...prev,
      selectedFields: prev.selectedFields.includes(fieldId)
        ? prev.selectedFields.filter(f => f !== fieldId)
        : [...prev.selectedFields, fieldId],
    }));
  }, []);

  const generateReport = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiService.post('/reports/custom', {
        ...config,
        dateRange: config.dateRange,
      });
      const payload = (response.data as any) || {};
      setData(payload.data || payload || []);
    } catch (error) {
      console.error('Failed to generate report:', error);
      // Use mock data for demo
      setData(generateMockData(config));
    } finally {
      setLoading(false);
    }
  }, [config]);

  // Generate mock data based on config
  const generateMockData = (cfg: ReportConfig): any[] => {
    const companies = ['NABIL', 'NRN', 'NTC', 'NIFRA', 'HRL'];
    const sectors = ['Banking', 'Hydro', 'Telecom', 'Manufacturing'];
    const types = ['BUY', 'SELL'];

    return Array.from({ length: 20 }, (_, i) => ({
      transactionDate: new Date(2024, 0, i + 1).toISOString().split('T')[0],
      companySymbol: companies[i % companies.length],
      companyName: `${companies[i % companies.length]} Company`,
      sector: sectors[i % sectors.length],
      transactionType: types[i % types.length],
      purchaseQuantity: types[i % types.length] === 'BUY' ? 100 + i * 10 : 0,
      purchasePricePerUnit: types[i % types.length] === 'BUY' ? 500 + i * 5 : 0,
      totalPurchaseAmount: types[i % types.length] === 'BUY' ? (100 + i * 10) * (500 + i * 5) : 0,
      salesQuantity: types[i % types.length] === 'SELL' ? 50 + i * 5 : 0,
      salesPricePerUnit: types[i % types.length] === 'SELL' ? 550 + i * 10 : 0,
      totalSalesAmount: types[i % types.length] === 'SELL' ? (50 + i * 5) * (550 + i * 10) : 0,
      capitalGainTax: types[i % types.length] === 'SELL' ? (50 + i * 5) * 10 : 0,
      netReceivables: types[i % types.length] === 'SELL' ? (50 + i * 5) * (550 + i * 10) - (50 + i * 5) * 10 : 0,
      profitLoss: types[i % types.length] === 'SELL' ? (50 + i * 5) * 50 : 0,
    }));
  };

  // Export report
  const exportReport = useCallback((format: 'csv' | 'json') => {
    if (format === 'csv') {
      const headers = config.selectedFields.join(',');
      const rows = data.map(row =>
        config.selectedFields.map(field => row[field] ?? '').join(',')
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}.csv`;
      a.click();
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.name}.json`;
      a.click();
    }
  }, [config, data]);

  // Save report
  const saveReport = useCallback(() => {
    const newReport: SavedReport = {
      id: Date.now().toString(),
      name: config.name,
      description: config.description,
      config: { ...config },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedReports(prev => [...prev, newReport]);
    setShowSaveDialog(false);
  }, [config]);

  // Load report
  const loadReport = useCallback((report: SavedReport) => {
    setConfig(report.config);
    setShowLoadDialog(false);
  }, []);

  // Render chart based on type
  const renderChart = () => {
    if (data.length === 0) {
      return (
        <div className="flex items-center justify-center h-96 text-gray-500">
          No data available. Click "Generate Report" to load data.
        </div>
      );
    }

    switch (config.chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.groupBy || 'companySymbol'} />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.selectedFields
                .filter(f => AVAILABLE_FIELDS.find(af => af.id === f)?.type === 'number')
                .slice(0, 3)
                .map((field, index) => (
                  <Bar
                    key={field}
                    dataKey={field}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="transactionDate" />
              <YAxis />
              <Tooltip />
              <Legend />
              {config.selectedFields
                .filter(f => AVAILABLE_FIELDS.find(af => af.id === f)?.type === 'number')
                .slice(0, 2)
                .map((field, index) => (
                  <Line
                    key={field}
                    type="monotone"
                    dataKey={field}
                    stroke={COLORS[index % COLORS.length]}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'pie':
        const pieData = data.slice(0, 6).map((item, index) => ({
          name: item[config.groupBy || 'companySymbol'],
          value: item[config.aggregationField || 'totalPurchaseAmount'] || 0,
        }));
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'table':
      default:
        return (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {config.selectedFields.map(field => {
                    const fieldDef = AVAILABLE_FIELDS.find(af => af.id === field);
                    return (
                      <th
                        key={field}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {fieldDef?.label || field}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((row, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    {config.selectedFields.map(field => (
                      <td key={field} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {row[field]?.toLocaleString?.() ?? row[field] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Report Builder</h1>
          <p className="text-gray-600">Create and customize your own reports</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowLoadDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <FileText className="w-4 h-4" />
            Load Report
          </button>
          <button
            onClick={() => setShowSaveDialog(true)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            onClick={generateReport}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Report'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Report Settings */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Report Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Report Name
                </label>
                <input
                  type="text"
                  value={config.name}
                  onChange={e => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={config.description || ''}
                  onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Chart Type */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Chart Type</h3>
            <div className="grid grid-cols-2 gap-2">
              {CHART_TYPES.map(type => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.id}
                    onClick={() => setConfig(prev => ({ ...prev, chartType: type.id }))}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-colors ${config.chartType === type.id
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fields Selection */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Fields</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {AVAILABLE_FIELDS.map(field => (
                <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.selectedFields.includes(field.id)}
                    onChange={() => toggleField(field.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Filters</h3>
              <button
                onClick={addFilter}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                <Plus className="w-4 h-4" />
                Add Filter
              </button>
            </div>
            <div className="space-y-3">
              {config.filters.map(filter => (
                <div key={filter.id} className="flex gap-2 items-start">
                  <select
                    value={filter.field}
                    onChange={e => updateFilter(filter.id, { field: e.target.value })}
                    className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="">Select field...</option>
                    {AVAILABLE_FIELDS.map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                  <select
                    value={filter.operator}
                    onChange={e => updateFilter(filter.id, { operator: e.target.value as any })}
                    className="w-20 text-sm px-2 py-1 border border-gray-300 rounded"
                  >
                    <option value="eq">=</option>
                    <option value="neq">≠</option>
                    <option value="gt">&gt;</option>
                    <option value="gte">≥</option>
                    <option value="lt">&lt;</option>
                    <option value="lte">≤</option>
                    <option value="contains">⊃</option>
                  </select>
                  <input
                    type="text"
                    value={filter.value}
                    onChange={e => updateFilter(filter.id, { value: e.target.value })}
                    placeholder="Value"
                    className="flex-1 text-sm px-2 py-1 border border-gray-300 rounded"
                  />
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Group By */}
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="font-semibold text-gray-900 mb-4">Group By</h3>
            <select
              value={config.groupBy || ''}
              onChange={e => setConfig(prev => ({ ...prev, groupBy: e.target.value || undefined }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">No grouping</option>
              {AVAILABLE_FIELDS.filter(f => f.type === 'string').map(f => (
                <option key={f.id} value={f.id}>{f.label}</option>
              ))}
            </select>
          </div>

          {/* Aggregation */}
          {config.groupBy && (
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Aggregation</h3>
              <div className="space-y-3">
                <select
                  value={config.aggregation || ''}
                  onChange={e => setConfig(prev => ({ ...prev, aggregation: e.target.value || undefined }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="">Select aggregation...</option>
                  {AGGREGATIONS.map(agg => (
                    <option key={agg.id} value={agg.id}>{agg.label}</option>
                  ))}
                </select>
                {config.aggregation && (
                  <select
                    value={config.aggregationField || ''}
                    onChange={e => setConfig(prev => ({ ...prev, aggregationField: e.target.value || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="">Select field...</option>
                    {AVAILABLE_FIELDS.filter(f => f.type === 'number').map(f => (
                      <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Report Preview */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{config.name}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => exportReport('csv')}
                    disabled={data.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    CSV
                  </button>
                  <button
                    onClick={() => exportReport('json')}
                    disabled={data.length === 0}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    JSON
                  </button>
                </div>
              </div>
              {config.description && (
                <p className="text-sm text-gray-600 mt-1">{config.description}</p>
              )}
            </div>
            <div className="p-4">
              {renderChart()}
            </div>
          </div>
        </div>
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Save Report</h3>
            <p className="text-sm text-gray-600 mb-4">
              Save &quot;{config.name}&quot; for future use?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={saveReport}
                className="px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Load Saved Report</h3>
            {savedReports.length === 0 ? (
              <p className="text-gray-600">No saved reports yet.</p>
            ) : (
              <div className="space-y-2">
                {savedReports.map(report => (
                  <button
                    key={report.id}
                    onClick={() => loadReport(report)}
                    className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                  >
                    <div className="font-medium text-gray-900">{report.name}</div>
                    {report.description && (
                      <div className="text-sm text-gray-600">{report.description}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(report.updatedAt).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowLoadDialog(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomReportBuilder;
