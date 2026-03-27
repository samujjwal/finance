# Unified Functional, Design, and Technical Specification  
## AccountFlow ERP + Investment Portfolio Platform

**Version:** 2.0 Unified Consolidated Architecture  
**Scope:** Combined accounting/ERP and investment portfolio management  
**Status:** World-class consolidated architecture  

---

## 1. Executive Synthesis

This unified specification consolidates:
1. **Investment Portfolio Module** (existing, Nepal NEPSE-focused)
2. **Accounting/ERP Module** (new, AccountFlow ERP with Nepal compliance)

Into a single cohesive platform with shared data models, services, and deployment architecture.

### 1.1 Key Unification Decisions

1. **Shared Foundation**: User, Role, Permission, Audit, Company/Tenant, Branch - used by both modules
2. **Domain Separation**: Investment and Accounting domains remain logically separate but share common patterns
3. **Unified Ledger**: Investment transactions feed into accounting journal entries automatically
4. **Multi-Module Company**: A single Company entity can have both investment portfolio AND accounting books
5. **Shared Deployment**: Same architecture supports desktop, on-prem, and SaaS for both modules

---

## 2. Unified Domain Architecture

### 2.1 Domain Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                        UNIFIED PLATFORM                              │
├─────────────────────────────────────────────────────────────────────┤
│  FOUNDATION (Shared)                                                 │
│  ├── User, Role, Permission, Branch, Company/Tenant               │
│  ├── AuditLog, ApprovalWorkflow, SystemConfig                       │
│  └── Currency, ExchangeRate, FiscalYear                            │
├─────────────────────────────────────────────────────────────────────┤
│  INVESTMENT DOMAIN (Module A)                                        │
│  ├── Portfolio Management: Company, Transaction, PortfolioHolding   │
│  ├── Fee/Tax Engine: FeeRate, TaxCalculation                      │
│  └── Market Data: MonthlySummary, PriceHistory                      │
├─────────────────────────────────────────────────────────────────────┤
│  ACCOUNTING DOMAIN (Module B)                                      │
│  ├── Core Ledger: AccountGroup, LedgerAccount, JournalEntry        │
│  ├── Commercial: Customer, Vendor, Invoice, Bill, Payment           │
│  ├── Inventory: Item, Warehouse, StockMovement                      │
│  └── Banking: BankAccount, Reconciliation, BankTransaction          │
├─────────────────────────────────────────────────────────────────────┤
│  INTEGRATION LAYER                                                 │
│  └── InvestmentTransaction → JournalEntry (automatic posting)        │
├─────────────────────────────────────────────────────────────────────┤
│  NEPAL LOCALIZATION (Module C)                                       │
│  ├── NEPSE Integration, Bikram Sambat Calendar                      │
│  └── VAT, TDS, IRD Reporting                                        │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.2 Module Activation

Companies can activate modules independently:
- **Investment Only**: For stock brokerages, portfolio managers
- **Accounting Only**: For standard businesses
- **Combined**: Full ERP with investment tracking

---

## 3. Shared Data Models (Foundation)

### 3.1 Core Entities

| Entity | Purpose | Used By |
|--------|---------|---------|
| **Tenant** | Multi-tenant isolation (SaaS) | All modules |
| **Company** | Business entity, can have multiple modules | Investment + Accounting |
| **Branch** | Location/department hierarchy | All modules |
| **User** | Platform user with RBAC | All modules |
| **UserType** | Role categories (ADMIN, MGR, ACCT, etc.) | All modules |
| **Role** | Permission groups | All modules |
| **Function** | Granular permissions | All modules |
| **AuditLog** | Immutable audit trail | All modules |
| **ApprovalWorkflow** | Multi-step approvals | All modules |
| **Currency** | Multi-currency support | All modules |
| **FiscalYear** | Accounting periods | All modules |

### 3.2 Company Module Association

```prisma
model Company {
  id              String    @id @default(cuid())
  name            String
  code            String    @unique
  
  // Module activation flags
  hasInvestment   Boolean   @default(false)
  hasAccounting   Boolean   @default(false)
  hasInventory    Boolean   @default(false)
  
  // Relations
  investmentProfile InvestmentCompanyProfile?
  accountingProfile AccountingCompanyProfile?
  
  // Common
  baseCurrencyId  String
  fiscalYearId    String?
  
  @@map("companies")
}
```

---

## 4. Investment Domain (Existing - Enhanced)

### 4.1 Core Entities

| Entity | Description |
|--------|-------------|
| **Instrument** | NEPSE-listed securities (replaces Company) |
| **Transaction** | Buy/Sell transactions with full cost breakdown |
| **PortfolioHolding** | Real-time position tracking |
| **FeeRate** | NEPSE brokerage, SEBON, DP charges, CGT rules |
| **MonthlySummary** | Aggregated monthly performance |

### 4.2 Investment → Accounting Integration

**Automatic Journal Posting:**
- BUY transaction → Debit Investment Asset, Credit Bank/Cash
- SELL transaction → Debit Bank/Cash, Credit Investment Asset, Debit/Credit P&L
- Fees → Debit Expense accounts
- CGT → Debit Tax Liability

---

## 5. Accounting Domain (New)

### 5.1 Core Entities

| Entity | Description |
|--------|-------------|
| **AccountGroup** | Hierarchical chart of accounts |
| **LedgerAccount** | Individual GL accounts |
| **JournalEntry** | Double-entry transactions |
| **JournalEntryLine** | Individual debits/credits |
| **Customer** | AR management |
| **Vendor** | AP management |
| **Invoice** | Sales billing |
| **Bill** | Purchase invoices |
| **BankAccount** | Cash management |
| **Reconciliation** | Bank reconciliation |

### 5.2 Accounting Principles

1. **Immutable Posted Ledger**: Posted entries cannot be edited
2. **Voucher-Based Entry**: All entries flow through voucher system
3. **Multi-Currency**: Transaction + base currency tracking
4. **Period Locking**: Closed periods prevent new postings

---

## 6. Unified Database Schema

### 6.1 Foundation Tables

```sql
-- Multi-tenancy
tenants (id, name, status, plan, created_at)

-- Organization hierarchy
companies (id, tenant_id, name, code, base_currency_id, 
           has_investment, has_accounting, has_inventory,
           pan_number, vat_number, created_at)
           
branches (id, company_id, name, code, address, is_active)

fiscal_years (id, company_id, name, start_date, end_date, 
              is_closed, created_at)

-- Users and access control
user_types (id, name, description, is_active)

users (id, user_id, username, email, password_hash,
       first_name, surname, user_type_id, branch_id,
       status, is_active, last_login, created_at)

functions (id, name, module, description, is_active)

roles (id, name, user_type_id, description, status, is_system)

role_functions (id, role_id, function_id, assigned_by, status)

user_roles (id, user_id, role_id, assigned_by, effective_from, 
            effective_to, status)

-- Audit and workflow
audit_logs (id, entity_type, entity_id, action, old_values, 
            new_values, user_id, timestamp, ip_address)

approval_workflows (id, entity_type, entity_id, action, 
                  requested_by, status, approved_by, 
                  approved_at, rejection_reason)

-- Reference data
currencies (id, code, name, symbol, decimal_places, is_active)

exchange_rates (id, from_currency, to_currency, rate, date)
```

### 6.2 Investment Module Tables

```sql
instruments (id, symbol, name, symbol_2, sector, 
             instrument_type, is_active, created_at)

instrument_prices (id, instrument_id, price, price_date, 
                   source, created_at)

portfolio_accounts (id, company_id, account_number, 
                    bo_id, dp_code, investor_type)

transactions (id, portfolio_account_id, instrument_id,
              transaction_type, transaction_date,
              quantity, price_per_unit, total_amount,
              brokerage, sebon_fee, dp_charge, cgt,
              total_cost, status, approved_by, created_at)

portfolio_holdings (id, portfolio_account_id, instrument_id,
                    total_quantity, avg_cost, total_cost,
                    market_price, unrealized_gain_loss)

fee_rates (id, instrument_type, category, rate, 
           fixed_amount, min_fixed, is_active)
```

### 6.3 Accounting Module Tables

```sql
account_groups (id, company_id, code, name, parent_id, 
                group_type, is_active)

ledger_accounts (id, company_id, account_group_id, code, 
                 name, account_type, is_bank_account, 
                 opening_balance, current_balance, is_active)

vouchers (id, company_id, voucher_type, voucher_number, 
          date, reference, narration, total_amount, status)

journal_entries (id, company_id, voucher_id, date, 
                 reference, narration, posted_by, posted_at)

journal_entry_lines (id, journal_entry_id, ledger_account_id,
                     debit, credit, narration, cost_center_id)

customers (id, company_id, name, code, address, phone, email,
           credit_limit, payment_terms, is_active)

vendors (id, company_id, name, code, address, phone, email,
         payment_terms, is_active)

invoices (id, company_id, customer_id, invoice_number, 
          date, due_date, subtotal, tax_amount, total,
          status, paid_amount)

invoice_lines (id, invoice_id, item_id, description, 
               quantity, unit_price, amount, tax_amount)

bills (id, company_id, vendor_id, bill_number, date, 
       due_date, subtotal, tax_amount, total, status)

payments (id, company_id, payment_type, date, amount, 
          reference, bank_account_id, status)

payment_allocations (id, payment_id, invoice_id/bill_id,
                     amount_applied)

bank_accounts (id, company_id, account_name, account_number,
              bank_name, bank_branch, gl_account_id, 
              current_balance, is_active)

reconciliations (id, bank_account_id, statement_date, 
                 statement_balance, book_balance, status)

reconciliation_items (id, reconciliation_id, bank_transaction_id,
                      journal_entry_line_id, status)
```

### 6.4 Nepal Localization Tables

```sql
bs_calendar (id, ad_date, bs_year, bs_month, bs_day, 
             is_holiday, holiday_name)

vat_config (id, company_id, vat_registration_no, 
            default_vat_rate, is_vat_registered)

vat_returns (id, company_id, period_start, period_end,
             sales_amount, purchase_amount, vat_collected,
             vat_paid, net_vat, status)

tds_config (id, company_id, section, rate_threshold, rate)

tds_deductions (id, company_id, vendor_id, payment_id,
                section, amount, tds_amount, certificate_no)
```

---

## 7. Unified Service Architecture

### 7.1 Service Layer Structure

```
services/
├── foundation/
│   ├── user.service.ts
│   ├── role.service.ts
│   ├── permission.service.ts
│   ├── audit.service.ts
│   ├── approval.service.ts
│   └── company.service.ts
├── investment/
│   ├── instrument.service.ts
│   ├── transaction.service.ts
│   ├── portfolio.service.ts
│   ├── fee-calculation.service.ts
│   └── market-data.service.ts
├── accounting/
│   ├── ledger.service.ts
│   ├── journal.service.ts
│   ├── voucher.service.ts
│   ├── invoice.service.ts
│   ├── bill.service.ts
│   ├── payment.service.ts
│   └── reconciliation.service.ts
├── integration/
│   ├── investment-accounting-bridge.service.ts
│   └── reporting.service.ts
└── localization/
    ├── nepal/
    │   ├── bs-calendar.service.ts
    │   ├── vat.service.ts
    │   └── tds.service.ts
    └── nepse/
        ├── nepse-connector.service.ts
        └── price-sync.service.ts
```

### 7.2 Investment-Accounting Bridge

```typescript
// Automatic posting of investment transactions to accounting
class InvestmentAccountingBridgeService {
  async postTransactionToLedger(transaction: Transaction) {
    const journalEntry = await this.journalService.create({
      companyId: transaction.companyId,
      date: transaction.transactionDate,
      reference: `TRX-${transaction.id}`,
      narration: `${transaction.type} ${transaction.instrument.symbol}`,
      lines: this.generateJournalLines(transaction)
    });
    
    await this.journalService.post(journalEntry.id);
  }
  
  private generateJournalLines(transaction: Transaction): JournalLine[] {
    if (transaction.type === 'BUY') {
      return [
        { account: 'INVESTMENT_ASSET', debit: transaction.totalCost },
        { account: 'BANK', credit: transaction.totalCost }
      ];
    }
    // ... SELL logic with CGT, P&L
  }
}
```

---

## 8. Unified API Design

### 8.1 API Namespacing

| Endpoint | Module | Purpose |
|----------|--------|---------|
| `/api/v1/investment/instruments` | Investment | List securities |
| `/api/v1/investment/transactions` | Investment | CRUD transactions |
| `/api/v1/investment/portfolio` | Investment | Holdings view |
| `/api/v1/accounting/ledger` | Accounting | Chart of accounts |
| `/api/v1/accounting/journals` | Accounting | Journal entries |
| `/api/v1/accounting/invoices` | Accounting | AR management |
| `/api/v1/accounting/bills` | Accounting | AP management |
| `/api/v1/foundation/users` | Shared | User management |
| `/api/v1/foundation/roles` | Shared | Role management |
| `/api/v1/foundation/audit` | Shared | Audit logs |
| `/api/v1/nepal/vat` | Nepal | VAT returns |
| `/api/v1/nepal/bs-calendar` | Nepal | Date conversion |

---

## 9. Frontend Architecture

### 9.1 Module-Based Routing

```
/app
├── /foundation
│   ├── /users
│   ├── /roles
│   ├── /companies
│   └── /audit
├── /investment
│   ├── /portfolio
│   ├── /transactions
│   ├── /instruments
│   └── /reports
├── /accounting
│   ├── /ledger
│   ├── /vouchers
│   ├── /invoices
│   ├── /bills
│   └── /banking
└── /nepal
    ├── /vat
    └── /tds
```

### 9.2 Shared UI Components

- **DataGrid**: Universal table with sorting, filtering, pagination
- **FormBuilder**: Dynamic forms from schema
- **AuditTrail**: Timeline view for any entity
- **ApprovalFlow**: Workflow visualization
- **DatePicker**: AD/BS dual calendar
- **AmountInput**: Currency-aware input

---

## 10. Deployment Architecture

### 10.1 Unified Deployment Options

| Mode | Use Case | Database | Frontend |
|------|----------|----------|----------|
| **Desktop** | Single user, offline | SQLite (embedded) | Tauri + React |
| **On-Prem** | Office LAN | PostgreSQL | Browser/Electron |
| **SaaS** | Multi-tenant cloud | PostgreSQL (sharded) | Browser |

### 10.2 Module Licensing

- **Core**: Users, Roles, Audit, Company (always included)
- **Investment**: NEPSE integration, portfolio management
- **Accounting**: Full GL, AP, AR, banking
- **Inventory**: Stock management (future)
- **Nepal Pack**: VAT, TDS, BS calendar, IRD exports

---

## 11. Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- [ ] Refactor existing schema to unified foundation
- [ ] Migrate Company model to support modules
- [ ] Enhance User/Role system for cross-module permissions
- [ ] Implement module activation/deactivation

### Phase 2: Investment Enhancement (Weeks 5-6)
- [ ] Rename Company → Instrument in investment domain
- [ ] Add portfolio_account entity
- [ ] Implement investment-accounting bridge
- [ ] Add fee calculation engine

### Phase 3: Accounting Core (Weeks 7-12)
- [ ] Implement chart of accounts
- [ ] Build journal entry system
- [ ] Create voucher workflow
- [ ] Add period closing

### Phase 4: Commercial (Weeks 13-16)
- [ ] AR module (customers, invoices, receipts)
- [ ] AP module (vendors, bills, payments)
- [ ] Banking module (reconciliation)

### Phase 5: Nepal Localization (Weeks 17-20)
- [ ] BS calendar integration
- [ ] VAT/TDS configuration
- [ ] IRD export formats
- [ ] NEPSE data sync

### Phase 6: Integration & Testing (Weeks 21-24)
- [ ] End-to-end workflows
- [ ] Data migration tools
- [ ] Performance optimization
- [ ] Security audit

---

## 12. Data Migration Strategy

### 12.1 Existing Investment Database

```sql
-- Migration script outline
1. Backup existing database
2. Add new columns to companies (has_investment, has_accounting)
3. Rename company table to instruments (with migration of existing data)
4. Create portfolio_accounts (link to existing users/companies)
5. Migrate transactions to new schema
6. Verify data integrity
```

### 12.2 From Other Accounting Systems

- **Tally**: Master data import via XML/CSV
- **QuickBooks**: API-based migration
- **Excel**: Template-based import

---

## 13. Success Metrics

| Metric | Target |
|--------|--------|
| Code reuse (foundation) | >80% between modules |
| Database migration time | <2 hours for typical client |
| New module activation | <5 minutes |
| Cross-module transactions | <1 second latency |
| Report generation | <3 seconds for 1M records |

---

**Document Status**: Ready for implementation  
**Next Step**: Phase 1 foundation refactoring  
**Architecture Owner**: Engineering Lead  
**Review Cycle**: Monthly during implementation
