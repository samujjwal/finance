const XLSX = require('xlsx');
const fs = require('fs');

// Create sample transaction data
const sampleData = [
  {
    'Company Symbol': 'NABIL',
    'Transaction Type': 'BUY',
    'Transaction Date': '2026-03-19',
    'Bill No': 'BILL001',
    'Purchase Quantity': 100,
    'Purchase Price Per Unit': 850.00,
    'Total Purchase Amount': 85000,
    'Sales Quantity': 0,
    'Sales Price Per Unit': '',
    'Total Sales Amount': ''
  },
  {
    'Company Symbol': 'NABIL',
    'Transaction Type': 'SELL',
    'Transaction Date': '2026-03-20',
    'Bill No': 'BILL002',
    'Purchase Quantity': 0,
    'Purchase Price Per Unit': '',
    'Total Purchase Amount': '',
    'Sales Quantity': 50,
    'Sales Price Per Unit': 950.00,
    'Total Sales Amount': 47500
  },
  {
    'Company Symbol': 'UPPER',
    'Transaction Type': 'BUY',
    'Transaction Date': '2026-03-21',
    'Bill No': 'BILL003',
    'Purchase Quantity': 200,
    'Purchase Price Per Unit': 1200.00,
    'Total Purchase Amount': 240000,
    'Sales Quantity': 0,
    'Sales Price Per Unit': '',
    'Total Sales Amount': ''
  },
  {
    'Company Symbol': 'SCB',
    'Transaction Type': 'BUY',
    'Transaction Date': '2026-03-22',
    'Bill No': 'BILL004',
    'Purchase Quantity': 150,
    'Purchase Price Per Unit': 950.00,
    'Total Purchase Amount': 142500,
    'Sales Quantity': 0,
    'Sales Price Per Unit': '',
    'Total Sales Amount': ''
  }
];

// Create workbook
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

// Write Excel file
const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
fs.writeFileSync('test-data/sample-portfolio.xlsx', excelBuffer);

console.log('Sample Excel file created successfully!');
