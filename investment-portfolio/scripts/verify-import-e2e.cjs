/**
 * End-to-end import verification: parse real Excel → import via API → verify portfolio.
 * Uses same parser logic as verify-parser.cjs + the live API.
 */
const http = require('http');
const ExcelJS = require('../node_modules/exceljs');

const EXCEL_FILE = 'C:/Users/samuj/Developments/finance/New JCL Investment F.Y 2082_83 .xlsx';
const SKIP_SHEETS = new Set(['LISTED COMPANIES', 'VALIDATION', 'Monthly Summary']);
let passed = 0; let failed = 0;

// ── HTTP helper ────────────────────────────────────────────────────────────────
function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3001,
      path: `/api${path}`, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }); }
        catch { resolve({ status: res.statusCode, body: d }); }
      });
    });
    r.on('error', reject);
    if (data) r.write(data);
    r.end();
  });
}

function ok(label, condition, detail = '') {
  if (condition) { console.log(`  ✓ ${label}${detail ? ' | ' + detail : ''}`); passed++; }
  else { console.log(`  ✗ FAIL: ${label}${detail ? ' | ' + detail : ''}`); failed++; }
}

// ── Parser (mirrors excelExportImport.ts) ─────────────────────────────────────
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

async function parseExcel() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(EXCEL_FILE);

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
          symbol2: String(getCellVal(v[4]) || ''),
          sector: String(getCellVal(v[5]) || ''),
          symbol3: String(getCellVal(v[6]) || ''),
          instrumentType: String(getCellVal(v[7]) || 'Equity'),
        });
      }
    });
  }

  const transactions = [];
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
      if (typeStr === 'opening') {
        if (firstOpeningImported) return;
        firstOpeningImported = true;
        const qty = getNum(vals[6]);
        if (qty === 0) return;
      }
      const normalType = normalizeType(rawType);
      transactions.push({
        companySymbol: sym.trim(),
        transactionDate: convertExcelDate(vals[4]),
        transactionType: normalType,
        purchaseQuantity: getNum(vals[6]),
        purchasePricePerUnit: getNum(vals[7]),
        totalPurchaseAmount: getNum(vals[8]),
        salesQuantity: getNum(vals[9]),
        salesPricePerUnit: getNum(vals[10]),
        totalSalesAmount: getNum(vals[11]),
        totalInvestmentCost: getNum(vals[21]),
        netReceivables: getNum(vals[26]),
        // NFRS/Tax fields
        principalCostNfrs: getNum(vals[22]),
        unitSum: getNum(vals[6]) || getNum(vals[9]),
        waccNfrs: getNum(vals[23]),
        profitLossNfrs: getNum(vals[24]),
        tcTax: getNum(vals[21]),
        waccTax: getNum(vals[22]),
        profitLossTax: getNum(vals[23]),
        principalAmountTax: getNum(vals[25]),
      });
    });
  });

  return { companies, transactions };
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function run() {
  console.log('\n===============================');
  console.log('  END-TO-END IMPORT VERIFICATION');
  console.log('===============================\n');

  // 1. Parse Excel
  console.log('── 1. Parse Excel file ──');
  const { companies, transactions } = await parseExcel();
  ok('Companies parsed ≥ 300', companies.length >= 300, `count=${companies.length}`);
  ok('Transactions parsed ≥ 120', transactions.length >= 120, `count=${transactions.length}`);
  ok('BUY transactions present', transactions.filter(t => t.transactionType === 'BUY').length > 0);
  ok('SELL transactions present', transactions.filter(t => t.transactionType === 'SELL').length > 0);
  console.log(`  Parsed ${companies.length} companies, ${transactions.length} transactions`);

  // 2. Authenticate
  console.log('\n── 2. Authenticate ──');
  const login = await req('POST', '/auth/login', { username: 'root', password: 'password123#' });
  ok('Login successful', [200, 201].includes(login.status), `status=${login.status}`);
  const token = login.body?.data?.token ?? login.body?.token ?? '';
  ok('Got JWT token', !!token);
  if (!token) { console.log('FATAL: cannot proceed without token'); process.exit(1); }

  // 3. Import companies
  console.log('\n── 3. Bulk import companies ──');
  const compRes = await req('POST', '/companies/bulk', companies, token);
  ok('Companies bulk 200/201', [200, 201].includes(compRes.status), `status=${compRes.status}`);
  const compData = compRes.body?.data;
  ok('Companies bulk returns created/updated', !!(compData?.created !== undefined || compData?.updated !== undefined),
    `created=${compData?.created} updated=${compData?.updated}`);
  const totalCompImported = (compData?.created ?? 0) + (compData?.updated ?? 0);
  ok('All companies processed', totalCompImported === companies.length,
    `processed=${totalCompImported} expected=${companies.length}`);

  // 4. Import transactions
  console.log('\n── 4. Bulk import transactions ──');
  const txnRes = await req('POST', '/transactions/bulk', transactions, token);
  ok('Transactions bulk 200/201', [200, 201].includes(txnRes.status), `status=${txnRes.status}`);
  const txnSummary = txnRes.body?.summary;
  ok('Transactions summary present', !!txnSummary, JSON.stringify(txnSummary || {}));
  const importedCount = txnSummary?.imported ?? 0;
  const failedCount = txnSummary?.failed ?? 0;
  ok('Most transactions imported (≥90% success)', importedCount >= Math.floor(transactions.length * 0.9),
    `imported=${importedCount} failed=${failedCount} total=${transactions.length}`);
  ok('Zero or minimal failures (≤5%)', failedCount <= Math.ceil(transactions.length * 0.05),
    `failed=${failedCount}`);
  if (failedCount > 0) {
    console.log(`  Failure details: ${JSON.stringify((txnRes.body?.errors ?? []).slice(0, 5))}`);
  }

  // 5. Portfolio recalculate
  console.log('\n── 5. Portfolio recalculation ──');
  const recalc = await req('POST', '/portfolio/recalculate', {}, token);
  ok('Recalculate 200/201', [200, 201].includes(recalc.status), `status=${recalc.status}`);

  const holdings = await req('GET', '/portfolio/holdings', null, token);
  ok('Holdings 200', holdings.status === 200, `status=${holdings.status}`);
  const holdingsArr = Array.isArray(holdings.body?.data) ? holdings.body.data : [];
  ok('Holdings not empty', holdingsArr.length > 0, `count=${holdingsArr.length}`);

  // Expected holdings: companies that had net BUY qty > 0
  const netBySymbol = {};
  for (const t of transactions) {
    const sym = t.companySymbol;
    if (!netBySymbol[sym]) netBySymbol[sym] = 0;
    netBySymbol[sym] += (t.purchaseQuantity || 0) - (t.salesQuantity || 0);
  }
  const expectedHoldings = Object.entries(netBySymbol).filter(([,q]) => q > 0).length;
  ok('Holdings count matches net positions', holdingsArr.length >= expectedHoldings * 0.9,
    `holdings=${holdingsArr.length} expected≥${Math.floor(expectedHoldings * 0.9)}`);

  // Spot check SGIC
  const sgic = holdingsArr.find(h => h.companySymbol === 'SGIC');
  ok('SGIC has holding', !!sgic, sgic ? `qty=${sgic.totalQuantity}` : 'not found');

  // 6. Portfolio summary
  console.log('\n── 6. Portfolio summary ──');
  const summary = await req('GET', '/portfolio/summary', null, token);
  ok('Portfolio summary 200', summary.status === 200, `status=${summary.status}`);
  const sumData = summary.body?.data;
  ok('totalInvestment > 0', (sumData?.totalInvestment ?? 0) > 0, `totalInvestment=${sumData?.totalInvestment}`);
  ok('totalCompanies > 0', (sumData?.totalCompanies ?? 0) > 0, `totalCompanies=${sumData?.totalCompanies}`);
  ok('totalUnits > 0', (sumData?.totalUnits ?? 0) > 0, `totalUnits=${sumData?.totalUnits}`);
  console.log(`  Summary: investment=${sumData?.totalInvestment?.toFixed(2)} companies=${sumData?.totalCompanies} units=${sumData?.totalUnits}`);

  // 7. Verify company list
  console.log('\n── 7. Company list after import ──');
  const compList = await req('GET', '/companies', null, token);
  ok('GET /companies 200', compList.status === 200, `status=${compList.status}`);
  const compArr = Array.isArray(compList.body?.data) ? compList.body.data : [];
  ok('Company count ≥ imported', compArr.length >= companies.length,
    `in_db=${compArr.length} imported=${companies.length}`);

  // 8. Verify transactions list
  console.log('\n── 8. Transaction list after import ──');
  const txnList = await req('GET', '/transactions', null, token);
  ok('GET /transactions 200', txnList.status === 200, `status=${txnList.status}`);
  const txnArr = Array.isArray(txnList.body?.data) ? txnList.body.data : [];
  ok('Transaction count ≥ imported', txnArr.length >= importedCount,
    `in_db=${txnArr.length} imported=${importedCount}`);

  // Final summary
  console.log('\n===============================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('===============================\n');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
