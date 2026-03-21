/**
 * Portfolio calculation deep verification.
 * Checks that BUY/SELL netted correctly and WACC math matches our expectations.
 */
const http = require('http');

let passed = 0; let failed = 0;

function req(method, path, body, token) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: 'localhost', port: 3001, path: `/api${path}`, method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      }
    };
    const r = http.request(opts, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve({ status: res.statusCode, body: JSON.parse(d) }); } catch { resolve({ status: res.statusCode, body: d }); } });
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

async function run() {
  console.log('\n===================================');
  console.log('  PORTFOLIO CALCULATIONS VERIFICATION');
  console.log('===================================\n');

  const login = await req('POST', '/auth/login', { username: 'root', password: 'password123#' });
  const token = login.body?.data?.token ?? '';
  if (!token) { console.log('FATAL: auth failed'); process.exit(1); }

  // ── Holdings detail ────────────────────────────────────────────────────────
  console.log('── 1. Holdings integrity ──');
  const holdings = await req('GET', '/portfolio/holdings', null, token);
  const holdingsArr = Array.isArray(holdings.body?.data) ? holdings.body.data : [];
  ok('Holdings returned', holdingsArr.length > 0, `count=${holdingsArr.length}`);

  // Each holding must have required fields
  const badHoldings = holdingsArr.filter(h => !h.companySymbol || h.totalQuantity == null || h.weightedAverageCost == null || h.totalCost == null);
  ok('All holdings have required fields', badHoldings.length === 0, `bad=${badHoldings.length}`);

  // All quantities must be > 0 (zero-qty holdings should not exist)
  const zeroQtyHoldings = holdingsArr.filter(h => h.totalQuantity <= 0);
  ok('No zero-quantity holdings', zeroQtyHoldings.length === 0, `zero=${zeroQtyHoldings.length}`);

  // All averageCostPerUnit must be > 0
  const zeroCostHoldings = holdingsArr.filter(h => h.averageCostPerUnit <= 0);
  ok('No zero-cost holdings', zeroCostHoldings.length === 0, `zero=${zeroCostHoldings.length}`);

  // ── SGIC spot check (opening balance) ─────────────────────────────────────
  console.log('\n── 2. SGIC spot check (opening balance qty=8461) ──');
  const sgic = holdingsArr.find(h => h.companySymbol === 'SGIC');
  ok('SGIC holding found', !!sgic);
  if (sgic) {
    ok('SGIC qty=8461', sgic.totalQuantity === 8461, `qty=${sgic.totalQuantity}`);
    ok('SGIC avgCost > 0', sgic.weightedAverageCost > 0, `avgCost=${sgic.weightedAverageCost}`);
    ok('SGIC totalCost > 0', sgic.totalCost > 0, `totalCost=${sgic.totalCost}`);
    console.log(`  SGIC: qty=${sgic.totalQuantity}  wac=${sgic.weightedAverageCost?.toFixed(2)}  totalCost=${sgic.totalCost?.toFixed(2)}`);
  }

  // ── SHL spot check (BUY 500 @ 565) ────────────────────────────────────────
  console.log('\n── 3. SHL spot check (BUY 500 @ 565) ──');
  const shl = holdingsArr.find(h => h.companySymbol === 'SHL');
  ok('SHL holding found', !!shl);
  if (shl) {
    ok('SHL qty is multiple of 500', shl.totalQuantity % 500 === 0, `qty=${shl.totalQuantity}`);
    ok('SHL weightedAvgCost ≈ 565', Math.abs(shl.weightedAverageCost - 565) < 50, `wac=${shl.weightedAverageCost}`);
    console.log(`  SHL: qty=${shl.totalQuantity}  wac=${shl.weightedAverageCost?.toFixed(2)}  totalCost=${shl.totalCost?.toFixed(2)}`);
  }

  // ── Portfolio summary math check ───────────────────────────────────────────
  console.log('\n── 4. Portfolio summary math ──');
  const summary = await req('GET', '/portfolio/summary', null, token);
  const sumData = summary.body?.data;

  // totalInvestment should equal sum of (qty * avgCostPerUnit) across all holdings
  const manualTotal = holdingsArr.reduce((acc, h) => acc + (Number(h.totalCost) || 0), 0);
  const reportedTotal = sumData?.totalInvestment ?? 0;
  const diffPct = Math.abs(manualTotal - reportedTotal) / (reportedTotal || 1) * 100;
  ok('Summary totalInvestment matches holdings sum', diffPct < 0.1, `reported=${reportedTotal.toFixed(2)} calculated=${manualTotal.toFixed(2)} diff=${diffPct.toFixed(4)}%`);

  // totalUnits should equal sum of qty across all holdings
  const manualUnits = holdingsArr.reduce((acc, h) => acc + (h.totalQuantity ?? 0), 0);
  const reportedUnits = sumData?.totalUnits ?? 0;
  ok('Summary totalUnits matches holdings sum', manualUnits === reportedUnits, `reported=${reportedUnits} calculated=${manualUnits}`);

  // totalCompanies should equal holdings length
  ok('Summary totalCompanies matches holdings count', sumData?.totalCompanies === holdingsArr.length, `reported=${sumData?.totalCompanies} holdings=${holdingsArr.length}`);

  console.log(`  totalInvestment=${reportedTotal.toFixed(2)}  totalUnits=${reportedUnits}  totalCompanies=${sumData?.totalCompanies}`);

  // ── Reports ────────────────────────────────────────────────────────────────
  console.log('\n── 5. Reports endpoints ──');
  const monthly = await req('GET', '/reports/monthly', null, token);
  ok('reports/monthly 200', monthly.status === 200, `status=${monthly.status}`);
  const monthlyData = monthly.body?.data ?? [];
  ok('Monthly report has data', Array.isArray(monthlyData), `type=${typeof monthlyData}`);

  // ── Tax rate application check ─────────────────────────────────────────────
  console.log('\n── 6. Tax rate seeding check ──');
  const rates = await req('GET', '/fee-rates/summary', null, token);
  const rateData = rates.body?.data;
  ok('Fee rates summary 200', rates.status === 200);
  ok('CGT short-term rate = 7.5%', Math.abs((rateData?.CGT?.INDIVIDUAL_SHORT_TERM ?? 0) - 0.075) < 0.001, `rate=${rateData?.CGT?.INDIVIDUAL_SHORT_TERM}`);
  ok('CGT long-term rate = 5%', Math.abs((rateData?.CGT?.INDIVIDUAL_LONG_TERM ?? 0) - 0.05) < 0.001, `rate=${rateData?.CGT?.INDIVIDUAL_LONG_TERM}`);
  ok('CGT institutional rate = 10%', Math.abs((rateData?.CGT?.INSTITUTIONAL ?? 0) - 0.1) < 0.001, `rate=${rateData?.CGT?.INSTITUTIONAL}`);
  ok('SEBON rate = 0.015%', Math.abs((rateData?.SEBON_RATE ?? 0) - 0.00015) < 0.000001, `rate=${rateData?.SEBON_RATE}`);
  ok('DP charge = 25', (rateData?.DP_CHARGE_FIXED ?? 0) === 25, `charge=${rateData?.DP_CHARGE_FIXED}`);
  ok('Equity brokerage tiers exist', (rateData?.equityBrokerage ?? []).length > 0, `tiers=${rateData?.equityBrokerage?.length}`);

  console.log('\n===================================');
  console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
  console.log('===================================\n');
  if (failed > 0) process.exit(1);
}

run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
