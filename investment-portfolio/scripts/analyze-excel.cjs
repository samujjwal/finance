const ExcelJS = require('../node_modules/exceljs');
const wb = new ExcelJS.Workbook();

wb.xlsx.readFile('C:/Users/samuj/Developments/finance/New JCL Investment F.Y 2082_83 .xlsx').then(() => {
  const txnTypes = new Set();
  const skipSheets = new Set(['LISTED COMPANIES', 'VALIDATION', 'Monthly Summary']);
  let sampleRows = [];

  wb.eachSheet((ws) => {
    if (skipSheets.has(ws.name)) return;
    ws.eachRow((row, rowNum) => {
      if (rowNum <= 6) return;
      const vals = row.values;
      const getCellVal = (v) => {
        if (v instanceof Date) return v.toISOString().split('T')[0];
        if (v && typeof v === 'object' && 'result' in v) return v.result;
        return v;
      };
      const sno = getCellVal(vals[1]);
      const sym = getCellVal(vals[2]);
      const type = getCellVal(vals[5]);
      if (sym && type && typeof sym === 'string' && sym.trim().toUpperCase() !== 'SYMBOL') {
        if (typeof sno === 'number') {
          const t = String(type).trim();
          if (!txnTypes.has(t)) {
            sampleRows.push({ sheet: ws.name, rowNum, sno, sym, type: t });
            txnTypes.add(t);
          }
        }
      }
    });
  });

  console.log('All transaction types found:', JSON.stringify(Array.from(txnTypes).sort()));
  console.log('\nSample rows per type:');
  sampleRows.forEach(r => console.log(JSON.stringify(r)));
}).catch(e => console.error(e));
