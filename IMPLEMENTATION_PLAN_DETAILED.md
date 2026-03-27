# Detailed Implementation Plan: AccountFlow + Investment Platform

## Phase 1: Foundation Refactoring (Weeks 1-4)

### Week 1: Database Schema Updates

**File: `server/prisma/schema.prisma`**
```
Changes:
1. Add to Company model:
   - hasInvestment Boolean @default(true)
   - hasAccounting Boolean @default(false)
   - hasInventory Boolean @default(false)
   - baseCurrencyId String
   - fiscalYearId String?

2. Add to Function model:
   - module String (FOUNDATION/INVESTMENT/ACCOUNTING)

3. Create FiscalYear model (if not exists)
   - id, companyId, name, startDate, endDate, isClosed

4. Create Tenant model (for SaaS future)
   - id, name, status, plan, createdAt
```

**File: `server/prisma/migrations/`**
- Create migration: `add_module_support`
- SQL: ALTER TABLE companies ADD has_investment/has_accounting columns

### Week 2: Backend Service Updates

**File: `server/src/companies/companies.service.ts`**
```typescript
// Add methods:
- updateModuleAccess(companyId, modules: {investment, accounting, inventory})
- getCompanyModules(companyId) → returns active modules
- validateCompanyModuleAccess(companyId, moduleName)
```

**File: `server/src/companies/dto/company.dto.ts`**
```typescript
// Add to CreateCompanyDto:
- hasInvestment?: boolean
- hasAccounting?: boolean
- baseCurrencyId: string
```

**File: `server/src/roles/roles.service.ts`**
```typescript
// Add methods:
- getFunctionsByModule(module: string) → filters functions by module
- assignModuleFunctionsToRole(roleId, module, functionIds)
```

**File: `server/src/users/users.service.ts`**
```typescript
// Add method:
- getUserModules(userId) → returns modules user has access to via roles
```

### Week 3-4: Frontend Navigation & UI

**File: `src/components/layout/MainLayout.tsx`**
```typescript
// Changes:
- Add useCompanyModules() hook call
- Pass modules to Navigation component
- Show/hide nav items based on modules
```

**File: `src/components/layout/Navigation.tsx`**
```typescript
// Changes:
- Accept modules: {investment, accounting} prop
- Conditional rendering:
  investment && <NavItem to="/investment">Portfolio</NavItem>
  accounting && <NavItem to="/accounting">Accounting</NavItem>
```

**File: `src/components/companies/CompanySettings.tsx` (NEW)**
```typescript
// Create component:
- Module activation toggle switches
- API call to companiesService.updateModuleAccess()
- Confirmation dialog for activating accounting (irreversible)
```

**File: `src/hooks/useCompanyModules.ts` (NEW)**
```typescript
// Create hook:
- Fetches current company modules
- Caches result
- Provides hasModule(moduleName) helper
```

---

## Phase 2: Investment Enhancement (Weeks 5-6)

### Week 5: Company → Instrument Migration

**File: `server/prisma/schema.prisma`**
```
Changes:
1. Rename Company model → Instrument (keep existing fields)
2. Update all relations:
   - Transaction.companySymbol → Transaction.instrumentSymbol
   - MonthlySummary.companySymbol → MonthlySummary.instrumentSymbol
   - PortfolioHolding.companySymbol → PortfolioHolding.instrumentSymbol

3. Create PortfolioAccount model:
   - id, companyId (the business entity), accountNumber, boId, dpCode, investorType
```

**File: `server/src/instruments/instruments.service.ts` (RENAMED from companies)**
```typescript
// Rename service:
- companies.service.ts → instruments.service.ts
- Update all imports and references
- Change Company → Instrument in all type references
```

**File: `server/src/instruments/instruments.controller.ts` (RENAMED)**
```typescript
// Rename controller
- Update route: @Controller('instruments') (was 'companies')
- Update all method names and types
```

**File: `src/services/api.ts`**
```typescript
// Update API methods:
- getCompanies() → getInstruments()
- createCompany() → createInstrument()
- updateCompany() → updateInstrument()
```

**File: `src/components/instruments/InstrumentManagement.tsx` (RENAMED from Companies)**
```typescript
// Rename component
- Update all references Company → Instrument
- Update table columns
- Update form fields
```

### Week 6: Portfolio Account & Fee Engine

**File: `server/src/portfolio/portfolio-accounts.service.ts` (NEW)**
```typescript
// Create service:
- createPortfolioAccount(companyId, data)
- getPortfolioAccounts(companyId)
- updatePortfolioAccount(id, data)
- linkPortfolioAccountToUser(userId, accountId)
```

**File: `server/src/transactions/fee-calculation.service.ts` (ENHANCED)**
```typescript
// Enhance existing or create new:
- calculateTransactionFees(transaction) → returns detailed fee breakdown
- getFeeRates(instrumentType) → fetches from FeeRate table
- applyFeeRules(amount, instrumentType, investorType)
```

**File: `src/components/portfolio/PortfolioAccountSelector.tsx` (NEW)**
```typescript
// Create component:
- Dropdown of portfolio accounts for current company
- Add new account button
- Show BO ID, DP code info
```

---

## Phase 3: Accounting Core (Weeks 7-12)

### Week 7-8: Chart of Accounts

**File: `server/src/accounting/account-groups.service.ts` (NEW)**
```typescript
// Create service:
- createAccountGroup(companyId, data)
- getAccountGroups(companyId)
- getAccountGroupTree(companyId) → hierarchical structure
- updateAccountGroup(id, data)
```

**File: `server/src/accounting/ledger-accounts.service.ts` (NEW)**
```typescript
// Create service:
- createLedgerAccount(companyId, data)
- getLedgerAccounts(companyId, filters)
- updateLedgerAccount(id, data)
- deleteLedgerAccount(id) (only if no transactions)
- getLedgerAccountBalance(accountId, asOfDate)
```

**File: `server/prisma/schema.prisma` (ADDITIONS)**
```
Add models:
- AccountGroup (id, companyId, code, name, parentId, groupType)
- LedgerAccount (id, companyId, accountGroupId, code, name, accountType, openingBalance, currentBalance)
```

**File: `src/components/accounting/chart-of-accounts/ChartOfAccounts.tsx` (NEW)**
```typescript
// Create component:
- Tree view of account groups
- List of ledger accounts per group
- Add/Edit/Delete modals
- Balance display
```

### Week 9-10: Journal Entry System

**File: `server/src/accounting/journals.service.ts` (NEW)**
```typescript
// Create service:
- createJournalEntry(companyId, data: CreateJournalDto)
- getJournalEntries(companyId, filters: date range, status)
- postJournalEntry(id, postedBy) → immutable posting
- reverseJournalEntry(id, reason) → creates reversing entry
- validateJournalEntry(data) → debits must equal credits
```

**File: `server/prisma/schema.prisma` (ADDITIONS)**
```
Add models:
- JournalEntry (id, companyId, date, reference, narration, totalDebit, totalCredit, status, postedBy, postedAt)
- JournalEntryLine (id, journalEntryId, ledgerAccountId, debit, credit, narration)
```

**File: `src/components/accounting/journals/JournalEntryForm.tsx` (NEW)**
```typescript
// Create component:
- Dynamic line items (add/remove rows)
- Account selector dropdown
- Debit/Credit input with validation
- Running balance check (must equal zero)
- Narration field
```

**File: `src/components/accounting/journals/JournalEntryList.tsx` (NEW)**
```typescript
// Create component:
- Table of journal entries
- Filter by date, status (DRAFT/POSTED)
- Post action (with confirmation)
- View details (read-only for posted)
```

### Week 11-12: Voucher Workflow & Period Closing

**File: `server/src/accounting/vouchers.service.ts` (NEW)**
```typescript
// Create service:
- createVoucher(companyId, type, data)
- getVouchers(companyId, type, filters)
- submitVoucherForApproval(id)
- approveVoucher(id, approvedBy)
- getNextVoucherNumber(companyId, type, fiscalYear)
```

**File: `server/src/accounting/fiscal-year.service.ts` (NEW)**
```typescript
// Create service:
- createFiscalYear(companyId, data)
- closeFiscalYear(id) → locks period, posts closing entries
- reopenFiscalYear(id) → admin only, with audit trail
- getCurrentFiscalYear(companyId)
```

**File: `src/components/accounting/vouchers/VoucherList.tsx` (NEW)**
```typescript
// Create component:
- Tab per voucher type (Payment, Receipt, Journal, Contra)
- Number series display
- Approval workflow status
```

---

## Phase 4: Commercial (Weeks 13-16)

### Week 13-14: AR Module (Customers, Invoices)

**File: `server/src/accounting/customers.service.ts` (NEW)**
```typescript
// Create service:
- createCustomer(companyId, data)
- getCustomers(companyId, filters)
- updateCustomer(id, data)
- getCustomerBalance(customerId)
- getCustomerStatement(customerId, dateRange)
```

**File: `server/src/accounting/invoices.service.ts` (NEW)**
```typescript
// Create service:
- createInvoice(companyId, data)
- getInvoices(companyId, filters: customer, date, status)
- updateInvoice(id, data) (only if draft)
- postInvoice(id) → creates journal entry
- applyPayment(invoiceId, paymentId, amount)
- getInvoiceBalance(invoiceId)
```

**File: `server/prisma/schema.prisma` (ADDITIONS)**
```
Add models:
- Customer (id, companyId, name, code, address, phone, email, creditLimit, paymentTerms)
- Invoice (id, companyId, customerId, invoiceNumber, date, dueDate, subtotal, taxAmount, total, status, paidAmount)
- InvoiceLine (id, invoiceId, itemId/description, quantity, unitPrice, amount, taxAmount)
```

**File: `src/components/accounting/customers/CustomerManagement.tsx` (NEW)**
```typescript
// Create component:
- Customer list table
- Add/Edit customer modal
- View statement button
- Balance column
```

**File: `src/components/accounting/invoices/InvoiceForm.tsx` (NEW)**
```typescript
// Create component:
- Customer selector
- Line items with auto-calculation
- Tax calculation
- Total summary
- Save as Draft / Post buttons
```

### Week 15: AP Module (Vendors, Bills)

**File: `server/src/accounting/vendors.service.ts` (NEW)**
```typescript
// Similar to customers.service.ts
```

**File: `server/src/accounting/bills.service.ts` (NEW)**
```typescript
// Similar to invoices.service.ts
// Bills are "purchase invoices" / "bills payable"
```

**File: `src/components/accounting/vendors/VendorManagement.tsx` (NEW)**
```typescript
// Similar to CustomerManagement
```

**File: `src/components/accounting/bills/BillForm.tsx` (NEW)**
```typescript
// Similar to InvoiceForm
```

### Week 16: Banking & Reconciliation

**File: `server/src/accounting/bank-accounts.service.ts` (NEW)**
```typescript
// Create service:
- createBankAccount(companyId, data: accountName, accountNumber, bankName, glAccountId)
- getBankAccounts(companyId)
- updateBankAccount(id, data)
- getBankBalance(accountId, asOfDate)
```

**File: `server/src/accounting/reconciliation.service.ts` (NEW)**
```typescript
// Create service:
- startReconciliation(bankAccountId, statementDate, statementBalance)
- addBankTransaction(reconciliationId, transactionData)
- matchTransaction(reconciliationId, bankTxId, journalLineId)
- autoMatch(reconciliationId) → matches by amount/date
- completeReconciliation(reconciliationId) → reconciles differences
```

**File: `server/prisma/schema.prisma` (ADDITIONS)**
```
Add models:
- BankAccount (id, companyId, accountName, accountNumber, bankName, glAccountId, currentBalance)
- Reconciliation (id, bankAccountId, statementDate, statementBalance, bookBalance, status)
- BankTransaction (id, reconciliationId, date, description, amount, matchedJournalLineId)
```

**File: `src/components/accounting/banking/BankAccountList.tsx` (NEW)**
```typescript
// Create component:
- List of bank accounts
- Current balance display
- Start reconciliation button
```

**File: `src/components/accounting/banking/ReconciliationScreen.tsx` (NEW)**
```typescript
// Create component:
- Side-by-side view: Bank transactions | Book entries
- Match/Unmatch buttons
- Auto-match button
- Difference calculation
- Complete reconciliation button
```

---

## Phase 5: Nepal Localization (Weeks 17-20)

### Week 17: BS Calendar Integration

**File: `server/src/nepal/bs-calendar.service.ts` (NEW)**
```typescript
// Create service:
- convertADToBS(adDate) → returns {year, month, day, bsDateString}
- convertBSToAD(bsDate) → returns Date
- isHoliday(bsDate) → returns boolean + holiday name
- getFiscalYear(bsDate) → returns fiscal year string (2080/81)
- generateBsCalendarRange(startBS, endBS) → populates bs_calendar table
```

**File: `server/prisma/schema.prisma` (ADDITIONS)**
```
Add model:
- BsCalendar (id, adDate, bsYear, bsMonth, bsDay, bsDateString, isHoliday, holidayName)
```

**File: `src/components/common/DatePicker.tsx` (ENHANCED)**
```typescript
// Enhance existing:
- Add calendar toggle: AD | BS
- BS calendar picker using react-nepali-calendar or similar
- Display both dates in tooltip
```

**File: `src/hooks/useBSDates.ts` (NEW)**
```typescript
// Create hook:
- useADToBS(adDate) → converts to BS
- useBsFiscalYear(date) → returns current fiscal year
- useBsToday() → returns today's BS date
```

### Week 18: VAT/TDS Configuration

**File: `server/src/nepal/vat.service.ts` (NEW)**
```typescript
// Create service:
- configureVat(companyId, config: {registrationNo, defaultRate, isRegistered})
- calculateVat(amount, vatRate, isInclusive)
- generateVatReturn(companyId, periodStart, periodEnd) → aggregates sales/purchases
- exportVatReturnToIRD(companyId, period) → generates IRD-compatible file
```

**File: `server/src/nepal/tds.service.ts` (NEW)**
```typescript
// Create service:
- configureTdsSections(companyId, sections: TdsSection[])
- calculateTds(amount, section, vendorType)
- generateTdsReturn(companyId, period)
- generateTdsCertificate(deductionId) → Form 1099 equivalent
```

**File: `server/prisma/schema.prisma` (ADDITIONS)**
```
Add models:
- VatConfig (id, companyId, registrationNo, defaultRate, isRegistered)
- VatReturn (id, companyId, periodStart, periodEnd, salesAmount, purchaseAmount, vatCollected, vatPaid, netVat, status)
- TdsConfig (id, companyId, section, rateThreshold, rate, effectiveFrom, effectiveTo)
- TdsDeduction (id, companyId, vendorId, paymentId, section, amount, tdsAmount, certificateNo)
```

**File: `src/components/nepal/vat/VatConfiguration.tsx` (NEW)**
```typescript
// Create component:
- VAT registration number input
- Default VAT rate selector
- Enable/disable VAT toggle
```

**File: `src/components/nepal/vat/VatReturnForm.tsx` (NEW)**
```typescript
// Create component:
- Period selector (BS month/quarter)
- Auto-populated sales/purchase summaries
- VAT calculation display
- Export to IRD button
```

### Week 19: IRD Export Formats

**File: `server/src/nepal/ird-export.service.ts` (NEW)**
```typescript
// Create service:
- exportSalesRegister(companyId, period) → CSV/Excel per IRD spec
- exportPurchaseRegister(companyId, period) → CSV/Excel per IRD spec
- exportVatReturn(companyId, period) → JSON/XML per IRD API spec
- validateForIRDExport(data) → checks required fields
```

**File: `server/src/nepal/templates/ird-sales-template.ts` (NEW)**
```typescript
// Define IRD sales register column format:
// Invoice Date, Invoice No, Buyer Name, Buyer PAN, Total Amount, Taxable Amount, VAT Amount
```

**File: `src/components/nepal/ird/IrdExportPage.tsx` (NEW)**
```typescript
// Create component:
- Export type selector (Sales/Purchase/VAT Return)
- Period selector
- Preview exported data
- Download button (CSV/Excel)
```

### Week 20: NEPSE Data Sync

**File: `server/src/nepal/nepse/nepse-connector.service.ts` (NEW)**
```typescript
// Create service:
- syncInstruments() → fetches listed companies from NEPSE
- syncPrices() → fetches daily price history
- getCurrentPrice(symbol) → real-time price (if API available)
- verifyBoId(boId) → validates BO ID with NEPSE
```

**File: `server/src/nepal/nepse/price-sync.job.ts` (NEW)**
```typescript
// Create scheduled job:
- Runs daily at 18:00 NPT (after market close)
- Fetches closing prices for all instruments
- Updates PortfolioHolding market values
- Triggers unrealized P&L recalculation
```

**File: `src/components/nepal/nepse/NepseSyncStatus.tsx` (NEW)**
```typescript
// Create component:
- Last sync timestamp
- Instruments synced count
- Price update preview
- Manual sync trigger button
```

---

## Phase 6: Integration & Testing (Weeks 21-24)

### Week 21: Investment-Accounting Bridge

**File: `server/src/integration/investment-accounting-bridge.service.ts` (NEW)**
```typescript
// Create service:
- postTransactionToLedger(transaction: Transaction)
  → Creates journal entry for buy/sell
  → Debit/Credit appropriate accounts (INVESTMENT_ASSET, BANK, BROKERAGE_EXPENSE, etc.)
  
- generateJournalLines(transaction): JournalLine[]
  BUY: [
    { account: 'INVESTMENT_ASSET', debit: totalCost },
    { account: 'BANK', credit: totalCost }
  ]
  SELL: [
    { account: 'BANK', debit: netReceivables },
    { account: 'CGT_PAYABLE', credit: cgtAmount },
    { account: 'INVESTMENT_ASSET', credit: costBasis },
    { account: 'REALIZED_GAIN_LOSS', debit/credit: pnl }
  ]

- autoCreateInvestmentAccounts(companyId)
  → Creates standard ledger accounts for investment:
    - Investment Assets (current/non-current)
    - Brokerage Expenses
    - SEBON Fee Expenses
    - DP Charge Expenses
    - Capital Gain Tax Payable
    - Realized Gain/Loss
```

**File: `server/src/transactions/transactions.service.ts` (MODIFIED)**
```typescript
// In create() method, after transaction creation:
if (company.hasAccounting) {
  await investmentAccountingBridge.postTransactionToLedger(transaction);
}
```

**File: `src/components/integration/BridgeStatus.tsx` (NEW)**
```typescript
// Create component:
- Shows pending investment→accounting postings
- Error retry mechanism
- Manual post button
- Sync status per transaction
```

### Week 22: Data Migration Tools

**File: `server/src/migration/migration.service.ts` (NEW)**
```typescript
// Create service:
- validateExistingDatabase() → checks pre-conditions
- backupDatabase() → creates .db backup
- runPhase1Migration() → adds module columns
- runPhase2Migration() → Company→Instrument rename
- verifyMigration() → data integrity checks
- rollbackMigration() → restores from backup
```

**File: `src/components/admin/migration/MigrationTool.tsx` (NEW)**
```typescript
// Create admin component:
- Pre-migration validation results
- Backup current database button
- Run migration step-by-step
- Progress indicator per phase
- Verification report
- Rollback option (before commit)
```

**File: `scripts/migrate-to-unified-schema.ts` (NEW)**
```typescript
// CLI script for headless migration:
// npx ts-node scripts/migrate-to-unified-schema.ts --phase=1 --backup=true
```

### Week 23: Performance Optimization

**File: `server/src/common/interceptors/caching.interceptor.ts` (NEW)**
```typescript
// Create interceptor:
- Cache GET requests with Redis/in-memory
- Cache keys: userId + url + query params
- Invalidate on POST/PUT/DELETE
```

**File: `server/prisma/schema.prisma` (INDEXES)**
```
Add indexes:
- transactions: @index([companyId, transactionDate])
- journal_entries: @index([companyId, date, status])
- audit_logs: @index([entityType, entityId, timestamp])
```

**File: `src/components/common/VirtualizedDataGrid.tsx` (NEW)**
```typescript
// For large datasets (10k+ rows):
- React-window or react-virtualized
- Infinite scroll for transaction lists
- Lazy load journal entry lines
```

### Week 24: Security Audit & Hardening

**File: `server/src/common/guards/module-access.guard.ts` (NEW)**
```typescript
// Create guard:
@UseGuards(ModuleAccessGuard)
@ModuleAccess('INVESTMENT')
@Controller('investment')
// Checks if user's company has module enabled
```

**File: `server/src/common/decorators/audit.decorator.ts` (ENHANCED)**
```typescript
// Enhance audit logging:
@AuditLog({
  entityType: 'TRANSACTION',
  includeBeforeAfter: true,
  sensitiveFields: ['password', 'apiKey']
})
```

**File: `server/src/auth/auth.service.ts` (SECURITY)**
```typescript
// Add:
- Rate limiting on login (5 attempts per IP per minute)
- Password complexity enforcement
- Session timeout (30 min idle)
- 2FA support (TOTP)
```

---

## File Summary by Phase

### Phase 1 (8 files modified, 2 new)
**Modified:**
- `server/prisma/schema.prisma`
- `server/src/companies/companies.service.ts`
- `server/src/companies/dto/company.dto.ts`
- `server/src/roles/roles.service.ts`
- `server/src/users/users.service.ts`
- `src/components/layout/MainLayout.tsx`
- `src/components/layout/Navigation.tsx`

**New:**
- `src/components/companies/CompanySettings.tsx`
- `src/hooks/useCompanyModules.ts`

### Phase 2 (5 files renamed, 4 new)
**Renamed:**
- `companies.service.ts` → `instruments.service.ts`
- `companies.controller.ts` → `instruments.controller.ts`
- `CompanyManagement.tsx` → `InstrumentManagement.tsx`

**New:**
- `server/src/portfolio/portfolio-accounts.service.ts`
- `server/src/transactions/fee-calculation.service.ts`
- `src/components/portfolio/PortfolioAccountSelector.tsx`

### Phase 3 (8 new services, 12 new components)
**New Services:**
- `server/src/accounting/account-groups.service.ts`
- `server/src/accounting/ledger-accounts.service.ts`
- `server/src/accounting/journals.service.ts`
- `server/src/accounting/vouchers.service.ts`
- `server/src/accounting/fiscal-year.service.ts`

**New Components:**
- `src/components/accounting/chart-of-accounts/*`
- `src/components/accounting/journals/*`
- `src/components/accounting/vouchers/*`

### Phase 4 (6 new services, 12 new components)
**New Services:**
- `server/src/accounting/customers.service.ts`
- `server/src/accounting/invoices.service.ts`
- `server/src/accounting/vendors.service.ts`
- `server/src/accounting/bills.service.ts`
- `server/src/accounting/bank-accounts.service.ts`
- `server/src/accounting/reconciliation.service.ts`

### Phase 5 (6 new services, 10 new components)
**Nepal-specific:**
- `server/src/nepal/bs-calendar.service.ts`
- `server/src/nepal/vat.service.ts`
- `server/src/nepal/tds.service.ts`
- `server/src/nepal/ird-export.service.ts`
- `server/src/nepal/nepse/*`

### Phase 6 (4 new services, 4 new components)
- `server/src/integration/investment-accounting-bridge.service.ts`
- `server/src/migration/migration.service.ts`
- Performance and security hardening files

---

## Total File Changes

| Phase | Modified | New | Renamed |
|-------|----------|-----|---------|
| 1 | 8 | 2 | 0 |
| 2 | 3 | 4 | 3 |
| 3 | 1 | 20 | 0 |
| 4 | 0 | 18 | 0 |
| 5 | 1 | 16 | 0 |
| 6 | 4 | 8 | 0 |
| **Total** | **17** | **68** | **3** |

---

**Document Status**: Detailed implementation ready  
**Next Action**: Start Phase 1 Week 1 tasks  
**Estimated Effort**: 6 months (24 weeks) with 2-3 developers
