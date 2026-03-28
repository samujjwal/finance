# USER INTERACTION MAP

## Complete Application Navigation, Actions, and Transitions

**Date**: March 27, 2026  
**Application**: JCL Investment Portfolio + Accounting System  
**Scope**: All user-facing screens, components, actions, and data flows

---

## 📋 TABLE OF CONTENTS

1. [Authentication Flows](#authentication-flows)
2. [Navigation Structure](#navigation-structure)
3. [Dashboard Tab](#dashboard-tab)
4. [Portfolio Tab](#portfolio-tab)
5. [Transactions Tab](#transactions-tab)
6. [Reports Tab](#reports-tab)
7. [Companies Tab](#companies-tab)
8. [Accounting Tab](#accounting-tab)
9. [Nepal/Tax Tab](#nepaltax-tab)
10. [Organization Settings Tab](#organization-settings-tab)
11. [Admin Tab](#admin-tab)
12. [Maintenance Tab (Root Only)](#maintenance-tab-root-only)
13. [Modals & Dialogs](#modals--dialogs)
14. [Error States & Transitions](#error-states--transitions)
15. [Permission-Based Features](#permission-based-features)
16. [Data Operations](#data-operations)

---

## AUTHENTICATION FLOWS

### Screen 1: Initial Load

**URL**: `/` or `http://localhost:1420`  
**Conditions**: No authentication  
**Elements**:

- Loading spinner with text "Loading…"
- Debug info (development only)

**Flow**:

1. App checks setup status
2. If first run (firstRun=true) → Go to Setup Wizard
3. If not first run and not authenticated → Go to Login Form
4. If authenticated → Go to Dashboard

---

### Screen 2: Setup Wizard (First Run Only)

**Component**: `SetupWizard`  
**Visible When**: `firstRun === true`  
**Purpose**: Initial system setup for first user

**Screens within Wizard**:

1. **Welcome Screen**
   - Title: "Welcome to JCL Investment Portfolio"
   - Action: "Get Started" button → Next
   - OR "Skip" → Proceed to Login
2. **Create Admin Account**
   - Form Fields:
     - Username (text input)
     - Email (email input)
     - Password (password input)
     - Password Confirm (password input)
   - Buttons: "Create Account", "Back"
   - Validation: Password match, email format, username required
3. **Create Organization**
   - Form Fields:
     - Organization Name (text input)
     - Business Type (select dropdown)
     - Country (select: Dropdown, default: NEPAL)
     - Fiscal Year Start (date picker)
   - Checkboxes:
     - ☑ Enable Investment Module
     - ☑ Enable Accounting Module
     - ☑ Enable Inventory Module
   - Buttons: "Create Organization", "Back"
4. **Summary Screen**
   - Shows created data
   - Action: "Complete Setup" button → `onComplete()` callback

**Transitions**:

- Success → Close wizard, login user automatically
- Cancel/Skip → Show Login Form

---

### Screen 3: Login Form

**Component**: `LoginForm`  
**Visible When**: Not authenticated and `firstRun === false`

**Elements**:

```
┌─────────────────────────────────────────┐
│   JCL Investment Portfolio              │
│   Sign in to access your portfolio      │
│                                         │
│   [ Username Input ] (name="username")  │
│   [ Password Input ] (name="password")  │
│                                         │
│   [ Remember Me ] (checkbox, optional)  │
│                                         │
│   [ Login Button ]                      │
│   [ Forgot Password Link ] (if enabled) │
│   [ Sign Up Link ] (if enabled)         │
└─────────────────────────────────────────┘
```

**Actions**:

- **Login Button Click**:
  - Submits username + password
  - Success: Navigate to Dashboard
  - Failure: Show error message "Invalid credentials"
  - Loading state: Disable button, show spinner
- **Forgot Password Link** (if present):
  - Navigate to: `/forgot-password`
  - Show password reset form
- **Sign Up Link** (if present):
  - Navigate to: `/signup`
  - Show registration form

**Test Cases**:

- ✅ Valid credentials (admin/admin123)
- ✅ Valid credentials (demo/demo123)
- ✅ Invalid username
- ✅ Invalid password
- ✅ Empty fields
- ✅ Remember me checkbox
- ✅ Enter key on password field (submit form)

---

## NAVIGATION STRUCTURE

### Main Navigation Bar

**Location**: Top of authenticated app (below header with Welcome message)  
**Type**: Horizontal tab navigation with underline indicator

**Tab Routing**:

```
Dashboard | Portfolio | Transactions | Reports | Companies
| Accounting | Nepal/Tax | Org Settings | Admin | Root Actions
```

**Visibility Rules**:

```
dashboard           → Always visible
portfolio           → Only if hasModule('investment')
transactions        → Only if hasModule('investment')
reports             → Only if hasModule('investment')
companies           → Only if hasModule('investment')
accounting          → Only if hasModule('accounting')
nepal               → Only if hasModule('accounting') [implies accounting]
organization        → Only if orgId exists
admin               → Only if isAdminUser || isRootUser
maintenance         → Only if isRootUser
```

**Tab Styling**:

- Active tab: `border-indigo-500 text-indigo-600`
- Inactive tab: `text-gray-500 hover:text-gray-700`
- On hover: `hover:border-gray-300`

**Transitions on Click**:

1. User clicks tab
2. Check module access: `hasModule(tabName)`
3. Redirect to Self dashboard if not allowed
4. Otherwise render tab content
5. Highlight active tab

---

## DASHBOARD TAB

**Component**: `UnifiedDashboard`  
**Default Active Tab**: When app loads with authenticated user

**Subsections**:

### Portfolio Summary Card

- **Title**: "Portfolio Overview"
- **Data Points**:
  - Total Value: Shows portfolio value with currency
  - Holdings Count: Number of stocks held
  - Cash Balance: Available cash
  - Day Change: % change (green if positive, red if negative)
- **Action**: Click → Navigate to Portfolio tab

### Quick Stats

- **Cards**: 4 cards showing:
  1. Total Investments (₨)
  2. Annual Return (%)
  3. Risk Score (Low/Medium/High)
  4. Holdings Count (#)

### Recent Transactions

- **Table** with columns:
  - Date
  - Company
  - Type (BUY/SELL)
  - Quantity
  - Price
  - Total
  - Action (Edit/Delete - if current user is owner)
- **Pagination**: 10 items per page
- **Action per row**: Click → View details modal

### Market Overview (if available)

- **Market Indices**:
  - NEPSE Index value
  - Day change (%)
  - Top gainers
  - Top losers
- **Action**: Click index → Navigate to reports

### Quick Actions Section

- **Buttons**:
  - "Add Company" → Navigate to Companies tab
  - "Record Transaction" → Navigate to Transactions tab
  - "Generate Report" → Navigate to Reports tab
  - "View Portfolio" → Navigate to Portfolio tab

---

## PORTFOLIO TAB

**Component**: `PortfolioView`  
**Visible When**: User has investment module

**Subsections**:

### Portfolio Summary Card

- Total Value: ₨ X,XXX,XXX
- Holdings: N companies
- Cash: ₨ X,XXX,XXX
- Day Change: ±% (colored)

### Holdings Table

**Columns**:

- Company Name
- Symbol
- Quantity
- Avg Cost
- Current Price
- Total Value
- Gain/Loss (%)
- % of Portfolio
- Actions (Edit, Delete, Details)

**Sorting**: Click column header to sort

**Filtering**:

- Sector filter (dropdown)
- Company type filter (dropdown)
- Search by company name (text input)

**Row Actions**:

- Click row → Show holding details modal
  - Shows transaction history
  - Shows average cost calculation
  - Shows break-even price
  - Action buttons: Edit, Delete, Add More
- Edit button → Edit holding quantity/cost
- Delete button → Remove holding (confirm)
- Details button → Show performance chart

### Portfolio Recalculation

- **Button**: "Recalculate Portfolio"
- **Action**: Recalculates all holdings and returns
- **Feedback**: Show spinner, then success message

### Add Holding Button

- **Button**: "Add Holding" (top right)
- **Action**: Open modal to manually add holding or search company

---

## TRANSACTIONS TAB

**Component**: `TransactionList`  
**Visible When**: User has investment module

**Subsections**:

### Transaction Filters & Search

**Inputs**:

- Date range picker (From / To)
- Company dropdown (multi-select optional)
- Transaction type: All / BUY / SELL
- Search by reference

**Button**: "Apply Filters" or auto-apply

### Transaction Table

**Columns**:

- Date
- Company / Symbol
- Type (BUY/SELL badge)
- Quantity
- Unit Price
- Commission
- Tax
- Total Cost / Proceeds
- Status (POSTED/DRAFT/CANCELLED)
- Actions

**Row Actions**:

- View details → Modal showing all transaction fields
- Edit → Edit transaction (if status=DRAFT)
- Delete → Delete transaction (confirm)

### Add Transaction Section

#### Single Entry Form

**Fields**:

- Transaction Date (date picker)
- Company (search dropdown)
- Type (BUY/SELL radio)
- Quantity (number input)
- Unit Price (currency input)
- Commission (currency or %)
- Commission Type (Fixed/Percentage)
- Tax Rate (%)
- Notes (textarea)

**Calculations** (auto-updates):

- Total Cost/Proceeds = Quantity × Unit Price
- Net Cost = Total ± Commission ± Tax
- Per-unit cost = Net Cost / Quantity

**Button**: "Record Transaction"

- Submit → Show confirmation modal
- Success → Reset form, show success toast
- Error → Show error message

#### Bulk Entry Section

**Upload Option**:

- Button: "Import Excel"
- Expected columns: Date, Company, Type, Quantity, Price, Commission, Tax
- File preview before import

**Actions**:

- Download template
- Upload file
- Preview imported data
- Auto-map columns
- Confirm import → Apply all transactions

### Transaction Statistics

- Total Transactions: N
- BUY Transactions: N
- SELL Transactions: N
- Total Investment: ₨X
- Total Proceeds: ₨X

---

## REPORTS TAB

**Component**: `CombinedReports`  
**Visible When**: User has investment module

**Subsections**:

### Report Type Selector

**Report Types**:

1. **Monthly Summary**
   - Grouped by month
   - Shows buys, sells, profits/losses
2. **Sector Analysis**
   - Breakdown by sector
   - Percentage of portfolio
   - Performance by sector
3. **Company Performance**
   - Ranking by performance
   - Absolute and relative returns
4. **Dividend Report** (if applicable)
   - Dividend by company
   - Total dividends
5. **Tax Report**
   - Capital gains
   - Tax liability
   - Deductions
6. **Risk Analysis**
   - Portfolio volatility
   - Beta analysis
   - Sector concentration
7. **Performance Analytics**
   - Time-weighted returns
   - Money-weighted returns
   - Comparison to benchmark
8. **Custom Pivot Table**
   - Customizable dimensions
   - Drag-drop interface

### Report Display Section

**For Table Reports**:

- Interactive table with sorting/filtering
- "Export to Excel" button
- "Print" button
- Date range selector (top of report)

**For Chart Reports**:

- Chart display (pie, bar, line, etc.)
- Toggle between chart/table view
- Legend with clickable items

**For Pivot Tables**:

- Drag fields to rows/columns/values
- Aggregate function selector (Sum, Average, Count)
- Filter by values

---

## COMPANIES TAB

**Component**: `CompanyList`  
**Visible When**: User has investment module

**Subsections**:

### Company Search & Filter

**Filters**:

- Search by name or symbol (text input)
- Sector dropdown (multi-select)
- Company type dropdown (Equity, Debt, Mutual Fund)
- Market status (Active, Delisted)

**Buttons**: "Clear Filters", "Apply Filters"

### Company List View

**View Options**:

- Toggle between: Table / Card grid

#### Table View

**Columns**:

- Company Name
- Symbol (ticker)
- Sector
- Type
- Market Cap
- 52-week high
- 52-week low
- Current Price
- Actions

**Actions per row**:

- View company details → Navigate to company detail page
- Edit → Edit company info (admin only)
- Delete → Delete company (confirm, admin only)

#### Card View

**Card Layout**:

```
┌──────────────────────┐
│ Company Logo         │
│ Company Name         │
│ Symbol: COMP         │
│ Sector: BANKING      │
│ Current Price: ₨100  │
│ Change: +5% ▲        │
│ [View] [Edit] [Del]  │
└──────────────────────┘
```

### Add Company Button

**Button**: "Add Company"
**Action**: Open modal with form

- Company Name (text input, required)
- Symbol (text input, required, unique)
- Sector (select dropdown)
- Company Type (select dropdown)
- Market Cap (currency, optional)
- Description (textarea)
- Logo URL (text input, optional)
- Action buttons: "Create", "Cancel"

**Validation**:

- Symbol must be unique
- Name required
- Sector required

**Success**: Add to list, reset form, show toast

---

## ACCOUNTING TAB

**Component**: `AccountingDashboard`  
**Visible When**: User has accounting module

**Subsections** (as defined in AccountingDashboard component):

### Sub-tabs (Navigation within Accounting)

1. **Chart of Accounts** → `ChartOfAccounts` component
2. **Journals** → `JournalList` component
3. **Bank Reconciliation** → `BankReconciliation` component
4. **Reports** → Accounting-specific reports

### Chart of Accounts Sub-tab

**Display**: Hierarchical tree view

```
Assets
├─ Current Assets
│  ├─ Cash (1010)
│  └─ Bank (1020)
├─ Fixed Assets
│  └─ Equipment (1030)
Liabilities
├─ Current Liabilities
│  ├─ Accounts Payable (2010)
│  └─ Short-term Loan (2020)
Equity
├─ Capital (3010)
├─ Retained Earnings (3020)
Income
├─ Sales (4010)
└─ Other Income (4020)
Expenses
├─ Cost of Goods (5010)
└─ Operating Expenses (5020)
```

**Actions per Account Group**:

- Expand/Collapse (click arrow)
- Add Sub-account (button) → Modal with form
- Edit Group (button) → Modal with form
- Delete Group (button) → Confirm (only if no sub-accounts)

**Ledger Account Details**:

- Click account → Show details panel
  - Account Code
  - Account Name
  - Account Type (Debit-normal / Credit-normal)
  - Opening Balance
  - Current Balance
  - Recent transactions (list)

**Actions on Ledger Account**:

- Edit → Modal with form
- Delete → Confirm (only if balance=0)
- View Ledger → Show all transactions for this account

### Journals Sub-tab

**Journal Entry List**:
**Columns**:

- Entry ID
- Date
- Description
- Reference
- Debit Total
- Credit Total
- Status (DRAFT/POSTED/REVERSED)
- Posted By
- Actions

**Filters**:

- Date range (From / To)
- Status (All / Draft / Posted / Reversed)
- Account (search)

**Row Actions**:

- View details → Modal showing all lines
- Edit (if DRAFT) → Edit form
- Post (if DRAFT) → Confirm post
- Reverse (if POSTED) → Create reversal entry
- Delete (if DRAFT) → Confirm delete

**Create Journal Entry Button**:

- Opens form with:
  - Entry Date
  - Description
  - Reference
  - Line items section:
    - Account (searchable dropdown)
    - Debit amount OR Credit amount
    - Description/Memo
    - Add line, Remove line, Add more lines
  - Action buttons: "Save as Draft", "Post", "Cancel"

**Validation**:

- Total Debit must equal Total Credit (±0.005 tolerance for rounding)
- At least 2 lines required
- All required fields filled

**Post Journal**:

- Updates ledger account balances
- Sets status to POSTED
- Shows posting confirmation

---

## NEPAL/TAX TAB

**Component**: `NepalDashboard`  
**Visible When**: User has accounting module

**Subsections**:

### Calendar Conversion

**Tool**: BS ↔ AD date converter

- Input BS date (year, month, day pickers)
- OR Input AD date (date picker)
- Button: "Convert"
- Shows converted date with day of week
- Holiday info if applicable

### VAT Management

**Section 1: VAT Configuration**

- Button: "Configure VAT"
- Modal form:
  - VAT Rate (percentage input)
  - Apply to Sales (checkbox)
  - Apply to Purchases (checkbox)
  - Effective Date (date picker)

**Section 2: VAT Summary**

- Total Sales (VATable)
- VAT Amount
- Total Sales (Exempt)
- Status: Not Filed / Filed

**Section 3: Generate VAT Return**

- Dropdowns:
  - Period (Month / Quarter / Annual)
  - From date
  - To date
- Button: "Generate Return"
- Shows preview table:
  - Sales
  - VAT Collected
  - Purchases
  - VAT Paid
  - Net VAT Due
- Buttons: "Download PDF", "Submit to IRD"

### TDS Management

**Section 1: TDS Sections Configuration**

- Button: "Add TDS Section"
- Modal form:
  - Section Name (dropdown: Salary, Contractor, Dividend, etc.)
  - Rate (percentage)
  - Applicability

**Section 2: TDS Summary**

- Table:
  - Section
  - Rate
  - Amount Deducted
  - Amount Remitted
  - Certificates Generated

**Section 3: Generate TDS Certificate**

- Dropdown: Select Section
- Dropdown: Select Fiscal Year
- Button: "Generate Certificate"
- Shows certificate preview
- Buttons: "Download PDF", "Email"

### IRD Compliance

**Exports**: Buttons for:

- "Export Sales Register" → CSV download
- "Export Purchase Register" → CSV download
- "Export TDS Register" → CSV download
- "Submit Monthly Return" → Modal with confirmation

**Each export**:

- Date range selector (From / To)
- Preview button shows data in table
- Download button gives CSV

---

## ORGANIZATION SETTINGS TAB

**Component**: `OrganizationSettings`  
**Visible When**: orgId exists

**Subsections**:

### Organization Information

**Display Fields** (read-only for non-admins):

- Organization Name
- Business Type
- Country
- Fiscal Year Start Date
- Created Date
- Last Updated

**Edit Button** (admin only):

- Edit form:
  - Organization Name (text)
  - Business Type (select)
  - Fiscal Year Start (date)
  - Action buttons: "Save", "Cancel"

### Module Management

**Checkboxes** (admin can toggle):

- ☑ Investment Module (manage holdings, companies, transactions)
- ☑ Accounting Module (GL, journals, reconciliation)
- ☑ Inventory Module (if implemented)

**On Toggle**:

- Ask confirmation: "Disabling this module will hide related tabs"
- Save immediately
- Refresh tab visibility in main nav

### Users & Roles in Organization

**List**:

- Username
- Email
- Role (select dropdown to change)
- Status (Active/Inactive toggle)
- Actions: Remove user

**Add User Button**:

- Search from list of available users
- Select user
- Assign role (select dropdown)
- Button: "Add User"

### Organization Settings

**Security Settings**:

- Session timeout (minutes, select)
- Require 2FA (checkbox)
- IP whitelist (textarea with comma-separated IPs)
- Save button

**Fiscal Settings**:

- Fiscal Year Start (month/day selector)
- Close previous year (button) → Confirm
- View closed periods (link)

---

## ADMIN TAB

**Component**: `AdminDashboard`  
**Visible When**: isAdminUser || isRootUser

**Sub-tabs**:

### Overview Sub-tab

**Statistics Cards**:

- Total Users: Number (clickable → Navigate to Users tab)
- Active Users: Number
- Pending Approvals: Number
- Total Roles: Number

**Quick Actions Section**:

- "Create User" button
- "Create Role" button
- "View Approvals" link

**System Overview**:

- System Health (status indicator)
- Database Status
- API Status

**Recent Activity**:

- List of recent actions (user created, user approved, etc.)
- Timestamp for each
- Click to expand details

### Users Sub-tab

**User List Table**:
**Columns**:

- User ID
- Username
- Email
- Branch/Organization
- User Type (ADMIN/MGR/OPR/VIEW)
- Status (ACTIVE/PENDING/SUSPENDED)
- Created Date
- Actions

**Row Actions**:

- **View Details** → Side panel with:
  - Full user info
  - Assigned roles
  - Last login
  - Activities
- **Edit** → Modal form:
  - Username (read-only)
  - Email (editable)
  - Branch (select)
  - User Type (select)
  - Button: "Save", "Cancel"
- **Approve** (if PENDING) → Confirm → Update status to ACTIVE
- **Reject** (if PENDING) → Confirm + optional reason → Mark as REJECTED
- **Suspend** (if ACTIVE) → Confirm → Mark as SUSPENDED
- **Unsuspend** (if SUSPENDED) → Confirm → Mark as ACTIVE
- **Reset Password** → Send reset email, show confirmation
- **Delete** → Confirm with warning → Remove user

**Filters**:

- Status (All/Active/Pending/Suspended)
- User Type (All/Admin/Manager/Operator/Viewer)
- Search by username/email

**Create User Button**:

- Modal form:
  - Username (required)
  - Email (required, validated)
  - Password (auto-generated or enter)
  - User Type (select)
  - Branch/Organization (select)
  - Action buttons: "Create", "Cancel"

**Bulk Actions**:

- Checkbox select all
- Suspend selected
- Delete selected (confirm)

### Roles Sub-tab

**Role List Table**:
**Columns**:

- Role ID
- Role Name
- Description
- Functions Count
- Users Count
- Actions

**Row Actions**:

- **View Details** → Side panel with:
  - Role info
  - Assigned functions (list)
  - Assigned users (list)
- **Edit** → Modal form:
  - Role Name
  - Description (textarea)
  - Functions (multi-select checkboxes)
  - Button: "Save", "Cancel"
- **Delete** (if no users assigned) → Confirm → Remove

**Create Role Button**:

- Modal form:
  - Role Name (required)
  - Description (textarea)
  - Functions (multi-select checkboxes):
    - All available functions listed
    - Checkboxes to select
  - Button: "Create", "Cancel"

**Functions Available**:

- USER_CREATE, USER_VIEW, USER_MODIFY, USER_DELETE
- ROLE_CREATE, ROLE_VIEW, ROLE_MODIFY, ROLE_DELETE
- TRANSACTION_CREATE, TRANSACTION_VIEW, TRANSACTION_MODIFY, TRANSACTION_DELETE
- COMPANY_CREATE, COMPANY_VIEW, COMPANY_MODIFY, COMPANY_DELETE
  -REPORT_VIEW, REPORT_EXPORT
- And more...

### Approvals Sub-tab

**Approval List**:
**Columns**:

- Approval ID
- Type (User Signup / Data Change / Deletion / Other)
- Submitted By
- Submitted Date
- Status (PENDING/APPROVED/REJECTED)
- Actions

**Row Details**:

- Click row → Expand to show:
  - Full request details
  - Reason (if applicable)
  - Attachments (if any)

**Row Actions**:

- **Approve** (if PENDING) → Confirm → Execute action
- **Reject** (if PENDING) → Modal:
  - Reason (textarea)
  - Button: "Reject", "Cancel"
  - Updates status to REJECTED

**Auto-clear**: Approved/Rejected items can be archived (button)

---

## MAINTENANCE TAB (Root Only)

**Component**: `RootMaintenanceView`  
**Visible When**: isRootUser

**Sections**:

### Database Management

- **Backup Database** button
  - Triggers server-side backup
  - Shows status and download link
- **Restore Database** button
  - File upload
  - Confirm restore (warning)
- **Clear Logs** button
  - Date range selector
  - Confirm clear
- **View Database Stats**
  - Table count
  - Database size
  - Last backup time

### Server Status

- **Services Status**:
  - API Server: RUNNING / STOPPED / ERROR
  - Database: CONNECTED / DISCONNECTED / ERROR
- **Server Logs**:
  - Real-time log viewer (last 100 lines)
  - Log level filter (ERROR/WARN/INFO/DEBUG)
  - Download logs button

### System Configuration

- **API Settings**:
  - API URL (text)
  - JWT Secret (masked, show/hide)
  - CORS Origins (textarea)
  - Button: "Save"
- **Email Settings**:
  - SMTP Host
  - SMTP Port
  - SMTP User
  - SMTP Password (masked)
  - Test button: "Send Test Email"

### Development Tools

- **Clear Cache** button
- **Reseed Database** button (with confirmation)
- **Reset to Defaults** button (DANGER - with multiple confirmations)

---

## MODALS & DIALOGS

### Common Modal Patterns

#### Confirmation Modal

```
┌─────────────────────────┐
│ ⚠ Confirm Action        │
├─────────────────────────┤
│ Are you sure you want   │
│ to [ACTION]? This       │
│ cannot be undone.       │
├─────────────────────────┤
│ [ Cancel ] [ Delete ]   │
└─────────────────────────┘
```

- Button 1: Cancel/Close (secondary)
- Button 2: Confirm/Yes (primary/danger)
- Keyboard: Escape to cancel, Enter to confirm

#### Success Toast

```
✓ [Action] completed successfully
[Dismiss button or auto-close after 5s]
```

#### Error Toast

```
✗ Error: [Error message]
[Details link] [Dismiss button]
```

#### Info Toast

```
ℹ [Information message]
[Dismiss button]
```

### Modal Transitions

- Open: Fade in, scale up
- Close: Fade out, scale down
- Escape key: Close modal
- Click outside: Close modal (if allowed)
- Submit: Validate → Show loader → Close on success or show error

---

## ERROR STATES & TRANSITIONS

### Network Error

**Trigger**: API call fails
**Display**:

- Error toast: "Network error. Please try again."
- Retry button on affected component
- Continue working with stale data (if available)

### Validation Error

**Trigger**: Form submission with invalid data
**Display**:

- Inline error below each invalid field
- Toast: "Please fix errors before submitting"
- Fields highlighted in red
- Error: `The field [name] is required` or `Invalid [field] format`

### Authentication Error

**Trigger**: Token expired or refresh failed
**Display**:

- Modal: "Session expired. Please login again."
- Button: "Login"
- Action: Redirect to login page

### Permission Error

**Trigger**: User tries to access feature without module/role
**Display**:

- Toast: "You don't have access to this feature"
- Redirect to dashboard

### Data Not Found

**Trigger**: Requested resource doesn't exist
**Display**:

- Empty state with message: "No data found"
- Show empty state illustration
- Suggestion: "Create [item] or try different filters"

---

## PERMISSION-BASED FEATURES

### Module-Based Access

```
canUseInvestment = hasModule('investment')
  - Hides: Portfolio, Transactions, Reports, Companies tabs
  - Accessing anyway: Redirects to Dashboard

canUseAccounting = hasModule('accounting')
  - Hides: Accounting tab
  - Hides: Nepal/Tax tab
  - Accessing anyway: Redirects to Dashboard

canUseNepal = canUseAccounting
  - Nepal features only available if Accounting is enabled
```

### Role-Based Access

```
isRootUser = role === 'ROOT' || username === 'root'
  - Shows: Maintenance tab
  - Admin privileges: Can do everything

isAdminUser = role === 'ADMIN' || isRootUser
  - Shows: Admin tab
  - Can: Create/edit users, assign roles, approve requests

Regular User:
  - No admin features
  - Can only access assigned modules
```

### Feature-Level Access

- Edit buttons: Hidden if user is not owner (for personal data)
- Delete buttons: Hidden/disabled if not owner or admin
- Accounting features: Only visible if hasModule('accounting')

---

## DATA OPERATIONS

### Create Operations

1. **User clicks Create button**
   - Modal/form appears
   - Form focuses on first input field
2. **User enters data**
   - Real-time validation (optional)
   - Auto-save draft (optional)
3. **User clicks Submit/Create**
   - Validate all fields
   - Show loading spinner on button
   - Disable submit button
4. **Success**
   - Close modal
   - Add item to list
   - Show success toast
   - Refresh list if needed
   - Reset form for next entry
5. **Error**
   - Keep modal open
   - Show error message
   - Highlight invalid fields
   - Button remains enabled

### Read Operations

1. **List loads**
   - Show loading skeleton
   - Fetch data from API
   - Render list
   - Show pagination info
2. **User interacts**
   - Click to view details
   - Click to filter
   - Click to sort
   - Click to search
3. **Refresh**
   - Auto-refresh: Every 30 seconds (configurable)
   - Manual refresh: Click refresh button
   - Pull-to-refresh: Mobile view

### Update Operations

1. **User clicks Edit**
   - Modal opens with current data
   - Form fields populated
   - Save button enabled
2. **User changes data**
   - Form tracks changes
   - Unsaved changes indicator
3. **User clicks Save**
   - Validate fields
   - Show loading spinner
   - Disable save button
4. **Success**
   - Close modal
   - Update list item
   - Show success toast
5. **Error**
   - Keep modal open
   - Show error
   - Allow retry

### Delete Operations

1. **User clicks Delete**
   - Show confirmation modal
   - State: "Delete [Item Name]?"
   - Warning if applicable
2. **User confirms**
   - Show loading spinner in modal
   - Disable buttons
3. **Success**
   - Close modal
   - Remove from list
   - Show success toast
4. **Error**
   - Keep modal open
   - Show error message
   - Allow retry

---

## TEST COVERAGE MATRIX

| Feature           | Unit | Integration | E2E | Manual |
| ----------------- | ---- | ----------- | --- | ------ |
| Authentication    | ✅   | ✅          | ✅  | ✅     |
| Navigation        | ❌   | ✅          | ✅  | ✅     |
| Dashboard         | ❌   | ✅          | ✅  | ✅     |
| Portfolio         | ❌   | ✅          | ✅  | ✅     |
| Transactions      | ❌   | ✅          | ✅  | ✅     |
| Reports           | ❌   | ✅          | ✅  | ✅     |
| Companies         | ❌   | ✅          | ✅  | ✅     |
| Accounting        | ❌   | ✅          | ✅  | ✅     |
| Nepal/Tax         | ❌   | ✅          | ✅  | ✅     |
| Organization      | ❌   | ✅          | ✅  | ✅     |
| Admin             | ❌   | ✅          | ✅  | ✅     |
| Maintenance       | ❌   | ✅          | ✅  | ✅     |
| Error Handling    | ✅   | ✅          | ✅  | ✅     |
| Mobile Responsive | ❌   | ✅          | ✅  | ✅     |

---

**Total Documented Screens**: 12 major + 8 sub-tabs  
**Total Components**: 25+  
**Total Actions**: 150+  
**Total Data Flows**: 50+  
**Total Error States**: 20+

This document provides the foundation for comprehensive manual and automated testing of all user interaction paths.
