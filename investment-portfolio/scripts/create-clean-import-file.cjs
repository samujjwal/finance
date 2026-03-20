const XLSX = require('xlsx');
const fs = require('fs');

try {
  console.log('Creating Clean Import File from Monthly Summary Data');
  
  // Read the original Excel file
  const fileBuffer = fs.readFileSync('/home/samujjwal/Developments/finance/New JCL Investment F.Y 2082_83 .xlsx');
  const workbook = XLSX.read(fileBuffer, { 
    type: 'buffer',
    cellDates: true,
    cellNF: false,
    cellText: false
  });
  
  // Get Monthly Summary data
  const monthlySheet = workbook.Sheets['Monthly Summary'];
  const rawData = XLSX.utils.sheet_to_json(monthlySheet, {
    header: 1,
    defval: '',
    raw: false,
    dateNF: 'yyyy-mm-dd'
  });
  
  // Find the header row (row 3 based on previous analysis)
  const headers = rawData[2]; // Row 3 (0-indexed)
  const dataRows = rawData.slice(3); // Start from row 4
  
  console.log('Processing', dataRows.length, 'transaction rows');
  
  // Process and clean the data
  const cleanTransactions = [];
  
  dataRows.forEach((row, index) => {
    // Skip empty rows or summary rows
    if (!row || row.length === 0 || !row[0] || row[0].toString().trim() === '') {
      return;
    }
    
    // Create transaction object
    const transaction = {};
    
    headers.forEach((header, colIndex) => {
      if (header && row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') {
        let value = row[colIndex];
        
        // Clean and convert values
        if (typeof value === 'string') {
          value = value.toString().trim();
          // Try to convert to number
          if (value && !isNaN(value) && value !== '') {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              value = numValue;
            }
          }
        }
        
        transaction[header] = value;
      }
    });
    
    // Only add if we have a symbol and some transaction data
    if (transaction['SYMBOL'] && (transaction['Purchase QTY'] > 0 || transaction['Sales Qty'] > 0)) {
      cleanTransactions.push(transaction);
    }
  });
  
  console.log('Cleaned transactions:', cleanTransactions.length);
  
  // Map to our import format with proper data handling
  const importData = cleanTransactions.map((t, index) => {
    // Calculate price per unit if not directly available
    const purchaseQty = t['Purchase QTY'] || 0;
    const purchaseAmount = t['Total Purchase Amount'] || 0;
    const salesQty = t['Sales Qty'] || 0;
    const salesAmount = t['Sales Amt'] || 0;
    
    const purchasePricePerUnit = purchaseQty > 0 ? purchaseAmount / purchaseQty : 0;
    const salesPricePerUnit = salesQty > 0 ? salesAmount / salesQty : 0;
    
    // Determine transaction type
    let transactionType = 'BUY';
    let quantity = purchaseQty;
    let pricePerUnit = purchasePricePerUnit;
    let totalAmount = purchaseAmount;
    
    if (salesQty > 0) {
      transactionType = 'SELL';
      quantity = salesQty;
      pricePerUnit = salesPricePerUnit;
      totalAmount = salesAmount;
    }
    
    return {
      'Company Symbol': t['SYMBOL'] || '',
      'Transaction Type': transactionType,
      'Transaction Date': '2026-03-19', // Default date since not in summary
      'Bill No': `B/00010${index + 1}/082-83`, // Generate bill number
      'Purchase Quantity': transactionType === 'BUY' ? quantity : 0,
      'Purchase Price Per Unit': transactionType === 'BUY' ? pricePerUnit : 0,
      'Total Purchase Amount': transactionType === 'BUY' ? totalAmount : 0,
      'Sales Quantity': transactionType === 'SELL' ? quantity : 0,
      'Sales Price Per Unit': transactionType === 'SELL' ? pricePerUnit : 0,
      'Total Sales Amount': transactionType === 'SELL' ? totalAmount : 0,
      'Sector': t['Sector'] || '',
      'Commission': t['Total Commission on Purchase'] || t['Total Commission on Sales'] || 0,
      'Investment Cost': t['Investment Cost (Including Comission)'] || 0
    };
  });
  
  // Separate buy and sell transactions for proper import
  const buyTransactions = importData.filter(t => t['Transaction Type'] === 'BUY');
  const sellTransactions = importData.filter(t => t['Transaction Type'] === 'SELL');
  
  console.log('Buy transactions:', buyTransactions.length);
  console.log('Sell transactions:', sellTransactions.length);
  
  // Create separate files for buys and sells, plus combined
  const buyWs = XLSX.utils.json_to_sheet(buyTransactions);
  const sellWs = XLSX.utils.json_to_sheet(sellTransactions);
  const combinedWs = XLSX.utils.json_to_sheet(importData);
  
  // Create workbooks
  const buyWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(buyWb, buyWs, 'Buy Transactions');
  
  const sellWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(sellWb, sellWs, 'Sell Transactions');
  
  const combinedWb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(combinedWb, combinedWs, 'All Transactions');
  
  // Write files
  const buyBuffer = XLSX.write(buyWb, { bookType: 'xlsx', type: 'buffer' });
  const sellBuffer = XLSX.write(sellWb, { bookType: 'xlsx', type: 'buffer' });
  const combinedBuffer = XLSX.write(combinedWb, { bookType: 'xlsx', type: 'buffer' });
  
  fs.writeFileSync('/home/samujjwal/Developments/finance/investment-portfolio/clean-buy-transactions.xlsx', buyBuffer);
  fs.writeFileSync('/home/samujjwal/Developments/finance/investment-portfolio/clean-sell-transactions.xlsx', sellBuffer);
  fs.writeFileSync('/home/samujjwal/Developments/finance/investment-portfolio/clean-all-transactions.xlsx', combinedBuffer);
  
  console.log('\n=== Files Created ===');
  console.log('✓ clean-buy-transactions.xlsx -', buyTransactions.length, 'buy transactions');
  console.log('✓ clean-sell-transactions.xlsx -', sellTransactions.length, 'sell transactions');
  console.log('✓ clean-all-transactions.xlsx -', importData.length, 'total transactions');
  
  // Show sample data
  if (buyTransactions.length > 0) {
    console.log('\n=== Sample Buy Transaction ===');
    console.log(buyTransactions[0]);
  }
  
  if (sellTransactions.length > 0) {
    console.log('\n=== Sample Sell Transaction ===');
    console.log(sellTransactions[0]);
  }
  
  // Also create a CSV version for easy import
  const csvContent = [
    // Headers
    'Company Symbol,Transaction Type,Transaction Date,Bill No,Purchase Quantity,Purchase Price Per Unit,Total Purchase Amount,Sales Quantity,Sales Price Per Unit,Total Sales Amount',
    // Data rows
    ...importData.map(t => [
      t['Company Symbol'],
      t['Transaction Type'],
      t['Transaction Date'],
      t['Bill No'],
      t['Purchase Quantity'],
      t['Purchase Price Per Unit'],
      t['Total Purchase Amount'],
      t['Sales Quantity'],
      t['Sales Price Per Unit'],
      t['Total Sales Amount']
    ].join(','))
  ].join('\n');
  
  fs.writeFileSync('/home/samujjwal/Developments/finance/investment-portfolio/clean-transactions.csv', csvContent);
  console.log('✓ clean-transactions.csv - CSV format for import');
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
