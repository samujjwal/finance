const XLSX = require('xlsx');
const fs = require('fs');

try {
  console.log('Advanced Excel Parser for Investment Data');
  
  // Read the Excel file
  const fileBuffer = fs.readFileSync('/home/samujjwal/Developments/finance/New JCL Investment F.Y 2082_83 .xlsx');
  const workbook = XLSX.read(fileBuffer, { 
    type: 'buffer',
    cellDates: true,
    cellNF: false,
    cellText: false
  });
  
  console.log('Available sheets:', workbook.SheetNames);
  
  // Focus on Monthly Summary sheet first
  if (workbook.SheetNames.includes('Monthly Summary')) {
    console.log('\n=== Analyzing Monthly Summary Sheet ===');
    const monthlySheet = workbook.Sheets['Monthly Summary'];
    
    // Get the range to understand the structure
    const range = XLSX.utils.decode_range(monthlySheet['!ref'] || 'A1');
    console.log('Sheet range:', monthlySheet['!ref']);
    console.log('Rows:', range.e.r - range.s.r + 1, 'Columns:', range.e.c - range.s.c + 1);
    
    // Read as array of arrays to see the raw structure
    const rawData = XLSX.utils.sheet_to_json(monthlySheet, {
      header: 1,
      defval: '',
      raw: false,
      dateNF: 'yyyy-mm-dd'
    });
    
    console.log('Total rows in Monthly Summary:', rawData.length);
    
    // Look for transaction headers
    let transactionStartRow = -1;
    let headers = [];
    
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row.length > 0) {
        const firstCell = (row[0] || '').toString().toLowerCase();
        
        // Look for common transaction headers
        if (firstCell.includes('s.no') || firstCell.includes('serial') || 
            firstCell.includes('date') || firstCell.includes('particulars') ||
            firstCell.includes('company') || firstCell.includes('symbol')) {
          transactionStartRow = i;
          headers = row.map(h => (h || '').toString().trim());
          console.log(`Found potential transaction headers at row ${i + 1}:`, headers);
          break;
        }
      }
    }
    
    if (transactionStartRow >= 0) {
      console.log('\n=== Extracting Transaction Data ===');
      
      // Extract transaction rows
      const transactions = [];
      for (let i = transactionStartRow + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;
        
        // Check if this looks like a transaction row
        const firstCell = (row[0] || '').toString().trim();
        if (firstCell === '' || firstCell.toLowerCase().includes('total') || 
            firstCell.toLowerCase().includes('summary')) {
          continue;
        }
        
        // Create transaction object
        const transaction = {};
        headers.forEach((header, colIndex) => {
          if (header && row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') {
            let value = row[colIndex];
            
            // Clean and convert values
            if (typeof value === 'string') {
              value = value.toString().trim();
              // Try to convert to number if it looks like a number
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
        
        // Only add if we have some data
        if (Object.keys(transaction).length > 1) {
          transactions.push(transaction);
        }
      }
      
      console.log(`Extracted ${transactions.length} transactions`);
      
      if (transactions.length > 0) {
        console.log('Sample transaction:', transactions[0]);
        console.log('Last transaction:', transactions[transactions.length - 1]);
        
        // Save raw transactions
        fs.writeFileSync('/home/samujjwal/Developments/finance/investment-portfolio/monthly-transactions.json', JSON.stringify(transactions, null, 2));
        
        // Map to our import format
        const importData = transactions.map(t => {
          // Try to identify columns
          return {
            'Company Symbol': t['SYMBOL'] || t['Symbol'] || t['Company'] || t['Company Name'] || '',
            'Transaction Type': t['TYPE'] || t['Type'] || t['Transaction Type'] || 'BUY',
            'Transaction Date': t['DATE'] || t['Date'] || t['Transaction Date'] || '2026-03-19',
            'Bill No': t['BILL NO'] || t['Bill No'] || t['Bill'] || t['S.No'] || '',
            'Purchase Quantity': t['QUANTITY'] || t['Quantity'] || t['Qty'] || t['Units'] || 0,
            'Purchase Price Per Unit': t['RATE'] || t['Rate'] || t['Price'] || t['Cost'] || 0,
            'Total Purchase Amount': t['AMOUNT'] || t['Amount'] || t['Total'] || 0,
            'Sales Quantity': t['SALE QUANTITY'] || t['Sale Quantity'] || 0,
            'Sales Price Per Unit': t['SALE RATE'] || t['Sale Rate'] || 0,
            'Total Sales Amount': t['SALE AMOUNT'] || t['Sale Amount'] || 0
          };
        });
        
        // Create import-ready Excel
        const ws = XLSX.utils.json_to_sheet(importData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Transactions');
        
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
        fs.writeFileSync('/home/samujjwal/Developments/finance/investment-portfolio/monthly-transactions-import.xlsx', excelBuffer);
        console.log('Monthly transactions saved to: monthly-transactions-import.xlsx');
        
      }
    } else {
      console.log('No transaction headers found in Monthly Summary sheet');
      
      // Let's examine the raw structure
      console.log('\n=== Raw Data Structure (First 20 rows) ===');
      rawData.slice(0, 20).forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
    }
  }
  
  // Also check a few company sheets to see if they have transaction data
  console.log('\n=== Checking Individual Company Sheets ===');
  const sampleCompanies = ['SGIC', 'SHL', 'MNBBL'];
  
  sampleCompanies.forEach(companySymbol => {
    if (workbook.SheetNames.includes(companySymbol)) {
      console.log(`\n--- Checking ${companySymbol} ---`);
      const sheet = workbook.Sheets[companySymbol];
      const data = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: '',
        raw: false
      });
      
      console.log(`${companySymbol} has ${data.length} rows`);
      
      // Look for transaction-like data patterns
      let foundTransactions = 0;
      for (let i = 0; i < Math.min(data.length, 30); i++) {
        const row = data[i];
        if (row && row.length > 1) {
          // Check if row contains numeric data that could be transactions
          const hasNumbers = row.some(cell => {
            const val = (cell || '').toString().trim();
            return val !== '' && !isNaN(val) && val !== '0';
          });
          
          if (hasNumbers) {
            foundTransactions++;
            if (foundTransactions <= 3) { // Show first 3 examples
              console.log(`  Row ${i + 1} (potential transaction):`, row);
            }
          }
        }
      }
      
      console.log(`  Found ${foundTransactions} rows with numeric data`);
    }
  });
  
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}
