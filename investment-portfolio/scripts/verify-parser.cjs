/**
 * Verification script for the Excel parser logic.
 * Mirrors the exact same logic as the frontend excelExportImport.ts parser
 * so we can verify correctness before running the app.
 */
const ExcelJS = require('../node_modules/exceljs');

const EXCEL_FILE = 'C:/Users/samuj/Developments/finance/New JCL Investment F.Y 2082_83 .xlsx';
const SKIP_SHEETS = new Set(['LISTED COMPANIES', 'VALIDATION', 'Monthly Summary']);

function getCellVal(v) {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'object' && 'result' in v) {
    const r = v.result;
    return (r && typeof r === 'object' && 'error' in r) ? null : r;
  }
  return v;
}
function convertExcelDate(val) {
  const v = getCellVal(val);
  if (v instanceof Date) return v.toISOString().split('T')[0];
  if (typeof v === 'number' && v > 0) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 86400000);
    return d.toISOString().split('T')[0];
  }
  return String(v || '');
}
function getNum(val) {
  const v = getCellVal(val);
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}
function normalizeType(raw) {
  const t = String(getCellVal(raw) || '').toLowerCase().trim();
  if (t === 'sale' || t === 'sell' || t.startsWith('sale') || t.startsWith('sell')) return 'SELL';
  return 'BUY';
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_FILE);

  // ── Companies ──────────────────────────────────────────────────────────
  const companies = [];
  const companiesWS = wb.getWorksheet('LISTED COMPANIES');
  if (companiesWS) {
    companiesWS.eachRow((row, rowNum) => {
      if (rowNum === 1) return;
      const v = row.values;
      if (getCellVal(v[2]) && getCellVal(v[3])) {
        companies.push({
          symbol: String(getCellVal(v[2])).trim(),
          companyName: String(getCellVal(v[3])).trim(),
          symbol2: getCellVal(v[4]) || '',
          sector: getCellVal(v[5]) || '',
          symbol3: getCellVal(v[6]) || '',
          instrumentType: getCellVal(v[7]) || 'Equity',
        });
      }
    });
  }

  // ── Transactions ───────────────────────────────────────────────────────
  const transactions = [];
  const errors = [];
  let openingSkipped = 0;
  let openingImported = 0;
  let typeMap = {};

  wb.eachSheet((ws) => {
    if (SKIP_SHEETS.has(ws.name)) return;

    let firstOpeningImported = false;

    ws.eachRow((row, rowNum) => {
      if (rowNum <= 6) return;
      const vals = row.values;
      const sno = getCellVal(vals[1]);
      const sym = getCellVal(vals[2]);
      const rawType = getCellVal(vals[5]);

      if (!sym || typeof sym !== 'string') return;
      if (sym.trim().toUpperCase() === 'SYMBOL') return;
      if (typeof sno !== 'number') return;
      if (!rawType) return;

      const typeStr = String(rawType).trim().toLowerCase();
      typeMap[typeStr] = (typeMap[typeStr] || 0) + 1;

      if (typeStr === 'opening') {
        if (firstOpeningImported) { openingSkipped++; return; }
        // Always set the flag on the first Opening row (even qty=0)
        // so carry-forward Opening rows in later months are always skipped.
        firstOpeningImported = true;
        const qty = getNum(vals[6]);
        if (qty === 0) return;
        openingImported++;
      }

      const date = convertExcelDate(vals[4]);
      const purchaseQty = getNum(vals[6]);
      const pppu = getNum(vals[7]);
      const totalPurchase = getNum(vals[8]);
      const salesQty = getNum(vals[9]);
      const salesPrice = getNum(vals[10]);
      const salesAmt = getNum(vals[11]);
      const totalInvestment = getNum(vals[21]);
      const netReceivables = getNum(vals[26]);

      // Data quality check: BUY must have qty or amount, SELL must have sales amt
      const normalType = normalizeType(rawType);
      if (normalType === 'BUY' && purchaseQty === 0 && totalPurchase === 0) {
        errors.push(`${ws.name} row${rowNum}: BUY with 0 qty and 0 amount`);
      }
      if (normalType === 'SELL' && salesQty === 0 && salesAmt === 0) {
        errors.push(`${ws.name} row${rowNum}: SELL with 0 qty and 0 amount`);
      }

      // Verify critical numeric fields are non-zero when expected
      if (typeStr !== 'opening' && normalType === 'BUY' && purchaseQty > 0 && pppu === 0) {
        // PPPU might be a formula – check totalPurchase
        if (totalPurchase === 0) {
          errors.push(`${ws.name} row${rowNum}: BUY qty=${purchaseQty} but totalPurchase=0 (formula extraction issue?)`);
        }
      }

      transactions.push({
        companySymbol: sym.trim(),
        transactionDate: date,
        transactionType: normalType,
        purchaseQuantity: purchaseQty,
        purchasePricePerUnit: pppu,
        totalPurchaseAmount: totalPurchase,
        salesQuantity: salesQty,
        salesPricePerUnit: salesPrice,
        totalSalesAmount: salesAmt,
        totalInvestmentCost: totalInvestment,
        netReceivables: netReceivables,
      });
    });
  });

  // ── Summary ────────────────────────────────────────────────────────────
  console.log('\n============================');
  console.log('  EXCEL PARSER VERIFICATION');
  console.log('============================');
  console.log(`Companies parsed:        ${companies.length}`);
  console.log(`Transactions parsed:     ${transactions.length}`);
  console.log(`  BUY transactions:      ${transactions.filter(t => t.transactionType === 'BUY').length}`);
  console.log(`  SELL transactions:     ${transactions.filter(t => t.transactionType === 'SELL').length}`);
  console.log(`Opening rows imported:   ${openingImported}`);
  console.log(`Opening dupes skipped:   ${openingSkipped}`);
  console.log(`\nRaw type distribution:   ${JSON.stringify(typeMap)}`);

  console.log('\n── Sample Companies (first 5) ──');
  companies.slice(0, 5).forEach(c => console.log(`  ${c.symbol.padEnd(10)} ${c.companyName} [${c.sector}]`));

  console.log('\n── Sample Transactions (first 10) ──');
  transactions.slice(0, 10).forEach(t =>
    console.log(`  ${t.companySymbol.padEnd(8)} ${t.transactionDate}  ${t.transactionType.padEnd(4)} qty=${String(t.purchaseQuantity || t.salesQuantity).padStart(6)}  price=${String(t.purchasePricePerUnit || t.salesPricePerUnit || 0).padStart(8)}  total=${String(t.totalPurchaseAmount || t.totalSalesAmount || 0).padStart(12)}`)
  );

  // Verify some known data from what we observed
  const sgic = transactions.find(t => t.companySymbol === 'SGIC' && t.transactionType === 'BUY');
  const shl = transactions.find(t => t.companySymbol === 'SHL' && t.transactionType === 'BUY');
  console.log('\n── Known data spot checks ──');
  if (sgic) {
    const pass = sgic.purchaseQuantity === 8461 && sgic.totalPurchaseAmount > 5000000;
    console.log(`  SGIC opening BUY: qty=${sgic.purchaseQuantity}, total=${sgic.totalPurchaseAmount} → ${pass ? '✓ PASS' : '✗ FAIL'}`);
  } else {
    console.log('  SGIC opening: NOT FOUND ✗');
  }
  if (shl) {
    // First SHL transaction should be "purchase" type, qty=500, price=565
    const pass = shl.purchaseQuantity === 500 && shl.purchasePricePerUnit === 565 && shl.totalPurchaseAmount === 282500;
    console.log(`  SHL first BUY: qty=${shl.purchaseQuantity}, pvpu=${shl.purchasePricePerUnit}, total=${shl.totalPurchaseAmount} → ${pass ? '✓ PASS' : '✗ FAIL'}`);
  } else {
    console.log('  SHL first BUY: NOT FOUND ✗');
  }

  if (errors.length > 0) {
    console.log(`\n── Data Quality Issues (${errors.length}) ──`);
    errors.slice(0, 20).forEach(e => console.log(`  ⚠ ${e}`));
  } else {
    console.log('\n✓ No data quality issues found');
  }

  // Check all transaction symbols map to a known company
  const companySymbols = new Set(companies.map(c => c.symbol));
  const unknownSymbols = new Set(transactions.map(t => t.companySymbol).filter(s => !companySymbols.has(s)));
  if (unknownSymbols.size > 0) {
    console.log(`\n⚠ Symbols in transactions not in LISTED COMPANIES: ${Array.from(unknownSymbols).join(', ')}`);
    console.log('  These transactions will fail to import (foreign key constraint)');
  } else {
    console.log('✓ All transaction symbols map to a listed company');
  }

  console.log('\n============================\n');
}

main().catch(e => { console.error('FATAL:', e); process.exit(1); });
