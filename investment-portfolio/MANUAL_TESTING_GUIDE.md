# MANUAL TESTING GUIDE

## Step-by-Step Test Cases for All User Interaction Paths

**Purpose**: Complete manual test procedures for QA testers to verify all user-facing functionality  
**Date**: March 27, 2026  
**Test Environment**: http://localhost:1420

---

## 📋 TABLE OF CONTENTS

1. [Setup & Prerequisites](#setup--prerequisites)
2. [Authentication Tests](#authentication-tests)
3. [Navigation Tests](#navigation-tests)
4. [Dashboard Tests](#dashboard-tests)
5. [Portfolio Tests](#portfolio-tests)
6. [Transactions Tests](#transactions-tests)
7. [Reports Tests](#reports-tests)
8. [Companies Tests](#companies-tests)
9. [Accounting Tests](#accounting-tests)
10. [Nepal/Tax Tests](#nepaltax-tests)
11. [Organization Settings Tests](#organization-settings-tests)
12. [Admin Tests](#admin-tests)
13. [Maintenance Tests (Root Only)](#maintenance-tests-root-only)
14. [Error Handling & Edge Cases](#error-handling--edge-cases)
15. [Performance & Load Tests](#performance--load-tests)

---

## SETUP & PREREQUISITES

### Test Environment

```bash
# 1. Start the application
cd /home/samujjwal/Developments/finance/investment-portfolio
npm run dev

# 2. Open browser to test app
http://localhost:1420

# 3. Open browser console (F12) for debugging
# Monitor:
# - Network tab (API calls)
# - Console tab (errors/warnings)
# - Application tab (localStorage, sessionStorage)
```

### Test User Credentials

**Admin User** (Full Access)

```
Username: admin
Password: admin123
Expected: All tabs visible including Admin and Root Actions
```

**Demo User** (Limited Access)

```
Username: demo
Password: demo123
Expected: Dashboard + Portfolio, Transactions, Reports, Companies tabs
```

**Root User** (System Access - if available)

```
Username: root
Password: root123
Expected: All tabs + Maintenance
```

### Test Data

- Pre-created companies in database
- Sample portfolio holdings
- Sample transactions
- Sample chart of accounts

---

## AUTHENTICATION TESTS

### Test Case: AT-001 - Initial Load without Authentication

**Preconditions**: App cleared of all session storage  
**Steps**:

1. Open http://localhost:1420 in new incognito window
2. Wait for page to fully load

**Expected Results**:

- [ ] Loading spinner displays with text "Loading…"
- [ ] Debug info visible (in development mode)
- [ ] Wait completes within 5 seconds
- [ ] Login form appears after loading complete

**Notes**: Verify by checking Network tab that API calls complete

---

### Test Case: AT-002 - First-Run Setup Wizard

**Preconditions**: System in first-run state  
**Steps**:

1. Clear all database and localStorage
2. Load application fresh
3. Wizard should automatically appear

**Expected Results**:

- [ ] Setup Wizard component loads
- [ ] "Welcome" screen shows with explanation
- [ ] "Get Started" and "Skip" buttons visible

**Wizard Screens**:

**Screen 1 - Welcome**

- [ ] Title: "Welcome to JCL Investment Portfolio"
- [ ] Description text visible
- [ ] Buttons: "Get Started", "Skip"

**Screen 2 - Create Admin Account**

- [ ] Form fields visible:
  - [ ] Username input (focused by default)
  - [ ] Email input
  - [ ] Password input
  - [ ] Confirm Password input
- [ ] Buttons: "Create Account", "Back"
- [ ] Fill with test data:
  ```
  Username: testadmin
  Email: admin@test.com
  Password: TestPass123!
  Confirm: TestPass123!
  ```
- [ ] Submit button enabled
- [ ] Click "Create Account"

**Validation Checks**:

- [ ] Error if passwords don't match
- [ ] Error if email invalid format
- [ ] Error if username empty
- [ ] Error if password too weak (if enabled)

**Screen 3 - Create Organization**

- [ ] Form fields visible:
  - [ ] Organization Name
  - [ ] Business Type (dropdown)
  - [ ] Country (default: NEPAL)
  - [ ] Fiscal Year Start (date picker)
  - [ ] Module checkboxes: Investment, Accounting, Inventory
- [ ] Fill with test data:
  ```
  Name: Test Organization
  Business Type: Trading
  Country: Nepal
  Fiscal Year: 2081-07-01
  Check: Investment, Accounting
  ```
- [ ] Click "Create Organization"

**Screen 4 - Summary**

- [ ] Shows created data
- [ ] Button: "Complete Setup"
- [ ] Click button

**Expected Result After Completion**:

- [ ] Wizard closes
- [ ] User automatically logged in
- [ ] Dashboard displays
- [ ] Welcome message: "Welcome, testadmin"
- [ ] Navigation tabs reflect enabled modules

---

### Test Case: AT-003 - Login with Valid Credentials (Admin)

**Preconditions**: Not logged in, normal login mode  
**Steps**:

1. Go to http://localhost:1420
2. Enter credentials:
   ```
   Username: admin
   Password: admin123
   ```
3. Click "Login" button

**Expected Results**:

- [ ] Login button shows loading spinner
- [ ] Form fields disabled during submission
- [ ] Redirect to Dashboard within 2 seconds
- [ ] Header shows: "Welcome, admin"
- [ ] Navigation tabs visible:
  - [ ] Dashboard
  - [ ] Portfolio
  - [ ] Transactions
  - [ ] Reports
  - [ ] Companies
  - [ ] Accounting
  - [ ] Nepal/Tax
  - [ ] Org Settings
  - [ ] Admin (blue highlight for admin)
- [ ] Dashboard content loads
- [ ] Logout button visible in top right
- [ ] Server Status Indicator shows green (if server running)

**Console Checks**:

- [ ] No JavaScript errors
- [ ] API call to `/api/auth/login` succeeds (200 or 201)
- [ ] Response contains JWT token
- [ ] Token stored in localStorage

---

### Test Case: AT-004 - Login with Valid Credentials (Demo)

**Preconditions**: Not logged in  
**Steps**:

1. Go to http://localhost:1420
2. Enter:
   ```
   Username: demo
   Password: demo123
   ```
3. Click "Login"

**Expected Results**:

- [ ] Successfully logs in
- [ ] Header shows: "Welcome, demo"
- [ ] Navigation tabs visible:
  - [ ] Dashboard
  - [ ] Portfolio
  - [ ] Transactions
  - [ ] Reports
  - [ ] Companies
  - [ ] Accounting ❌ (not visible if no accounting module)
  - [ ] Nepal/Tax ❌ (not visible if no accounting module)
- [ ] Admin tab ❌ (not visible - not admin)
- [ ] Dashboard loads

---

### Test Case: AT-005 - Login with Invalid Username

**Preconditions**: Not logged in  
**Steps**:

1. Go to login page
2. Enter:
   ```
   Username: invaliduser
   Password: admin123
   ```
3. Click "Login"

**Expected Results**:

- [ ] Error message displays: "Invalid credentials"
- [ ] Error message styled in red/warning color
- [ ] Still on login page
- [ ] Form fields not cleared (except password for security)
- [ ] Retry possible (button enabled)

---

### Test Case: AT-006 - Login with Invalid Password

**Preconditions**: Not logged in  
**Steps**:

1. Go to login page
2. Enter:
   ```
   Username: admin
   Password: wrongpassword
   ```
3. Click "Login"

**Expected Results**:

- [ ] Error message: "Invalid credentials"
- [ ] Still on login page
- [ ] Can retry

---

### Test Case: AT-007 - Login with Empty Fields

**Preconditions**: On login page  
**Steps**:

1. Leave username field empty
2. Enter password: admin123
3. Click "Login"

**Expected Results**:

- [ ] Client-side validation prevents submit (or shows required error)
- [ ] Focus moves to empty field
- [ ] Error message: "Username is required" or similar
- [ ] Form not submitted to server

---

### Test Case: AT-008 - Remember Me Checkbox

**Preconditions**: On login page  
**Steps**:

1. Check "Remember Me" checkbox (if present)
2. Enter valid credentials
3. Click "Login"
4. Login successfully
5. Close browser completely
6. Reopen http://localhost:1420

**Expected Results**:

- [ ] If remember me is enabled:
  - [ ] Username field pre-filled on return visit
  - [ ] User still logged in (auto-login if token valid)
  - [ ] OR shows login form with filled username
- [ ] If remember me disabled:
  - [ ] Require login again

---

### Test Case: AT-009 - Logout

**Preconditions**: Logged in as admin  
**Steps**:

1. Click "Logout" button in top right
2. Confirm if modal appears

**Expected Results**:

- [ ] Session ends
- [ ] Redirect to login page within 1 second
- [ ] localStorage cleared (check console)
- [ ] All user data gone from sessionStorage
- [ ] Login form clean (fields empty)
- [ ] Can login again with same or different credentials

**Console Verification**:

- [ ] No JWT token in localStorage
- [ ] POST to `/api/auth/logout` called (optional)

---

### Test Case: AT-010 - Session Timeout

**Preconditions**: Logged in  
**Steps**:

1. Get timestamp of login
2. Wait for configured session timeout (usually 30-60 minutes)
3. OR simulate timeout by clearing token in console
4. Try to navigate or refresh page
5. Try to use app

**Expected Results**:

- [ ] Page redirects to login
- [ ] Modal shows: "Session expired. Please login again."
- [ ] Button: "Login"
- [ ] All tabs disabled
- [ ] Content not accessible

---

## NAVIGATION TESTS

### Test Case: NT-001 - Tab Navigation Visibility (Admin User)

**Preconditions**: Logged in as admin  
**Steps**:

1. Observe navigation tabs
2. Count visible tabs
3. Check tab styling

**Expected Results**:

```
Visible Tabs:
□ Dashboard (always)
□ Portfolio (if hasModule('investment'))
□ Transactions (if hasModule('investment'))
□ Reports (if hasModule('investment'))
□ Companies (if hasModule('investment'))
□ Accounting (if hasModule('accounting'))
□ Nepal/Tax (if hasModule('accounting'))
□ Org Settings (if orgId exists)
□ Admin (if isAdminUser)
□ Root Actions ❌ (only if isRootUser)
```

**Visual Checks**:

- [ ] Active tab has underline: `border-indigo-500`
- [ ] Active tab text color: `text-indigo-600`
- [ ] Inactive tabs: gray text
- [ ] Hover effect on inactive tabs

---

### Test Case: NT-002 - Tab Switching

**Preconditions**: Logged in as admin  
**Steps**:

1. Click "Dashboard" tab
2. Wait for content to load
3. Verify URL or content changes
4. Click "Portfolio" tab
5. Wait for content
6. Click "Accounting" tab
7. Wait for content

**Expected Results**:

- [ ] Each click switches tabs
- [ ] Previous tab content unloads
- [ ] New tab content loads within 1-2 seconds
- [ ] No errors in console
- [ ] Active tab indicator moves
- [ ] Browser history updated (if URL-based routing)

---

### Test Case: NT-003 - Tab Access Restrictions

**Preconditions**: Logged in as demo user (limited modules)  
**Steps**:

1. Try clicking "Accounting" tab (if not enabled)
2. Observe behavior

**Expected Results**:

- [ ] Tab not in navigation (best case)
- [ ] OR Click disabled/grayed out
- [ ] OR Click allowed but redirects to Dashboard
- [ ] Toast message: "You don't have access to this feature"

---

### Test Case: NT-004 - Back Button Navigation

**Preconditions**: On multiple tabs sequentially  
**Steps**:

1. Visit: Dashboard → Portfolio → Transactions
2. Click browser back button
3. Verify location

**Expected Results**:

- [ ] Back button navigates to previous tab
- [ ] OR If not implemented, stays on current tab (note as limitation)

---

## DASHBOARD TESTS

### Test Case: DT-001 - Dashboard Content Loads

**Preconditions**: Logged in  
**Steps**:

1. Click "Dashboard" tab (or it's default)
2. Wait for page to fully load
3. Monitor Network tab

**Expected Results**:

- [ ] Page loads within 3 seconds
- [ ] All API calls complete successfully
- [ ] No 404 or 5xx errors
- [ ] Loading skeletons/spinners briefly show then disappear
- [ ] Content renders without layout shift

---

### Test Case: DT-002 - Portfolio Summary Card

**Preconditions**: On Dashboard tab, user has portfolio  
**Steps**:

1. Locate Portfolio Summary card
2. Check displayed data

**Expected Results**:

- [ ] Card title: "Portfolio Overview"
- [ ] Shows: Total Value (₨), Holdings Count, Cash Balance, Day Change (%)
- [ ] Number formatting correct (commas for thousands)
- [ ] Day Change color coded (green for +, red for -)
- [ ] Card clickable → Navigate to Portfolio tab (optional)

---

### Test Case: DT-003 - Quick Stats Cards (4 Cards)

**Preconditions**: On Dashboard  
**Steps**:

1. Locate stats section
2. Count and verify 4 cards
3. Check each card's data

**Expected Results**:

- [ ] Card 1: "Total Investments" with ₨ amount
- [ ] Card 2: "Annual Return" with % value
- [ ] Card 3: "Risk Score" (Low/Medium/High)
- [ ] Card 4: "Holdings Count" with number
- [ ] Data is real/not placeholder

---

### Test Case: DT-004 - Recent Transactions List

**Preconditions**: Dashboard with transaction history  
**Steps**:

1. Find Recent Transactions section
2. Check table display
3. Verify columns
4. Click a transaction row

**Expected Results**:

- [ ] Table shows up to 10 transactions
- [ ] Columns: Date, Company, Type, Quantity, Price, Total, Action
- [ ] Type shows BUY/SELL badge with color
- [ ] Dates formatted as YYYY-MM-DD or local format
- [ ] Click row → Details modal appears
- [ ] Modal shows transaction details
- [ ] Modal has close button (X)

---

### Test Case: DT-005 - Market Overview (If Available)

**Preconditions**: Dashboard with market data  
**Steps**:

1. Find Market Overview section
2. Check displayed data
3. Click on index name

**Expected Results**:

- [ ] Shows NEPSE Index value
- [ ] Shows day change with % and up/down arrow
- [ ] Top gainers listed (4-5 companies)
- [ ] Top losers listed (4-5 companies)
- [ ] Click company → Navigate to company details or reports

---

### Test Case: DT-006 - Quick Actions Buttons

**Preconditions**: On Dashboard  
**Steps**:

1. Locate Quick Actions section
2. Click "Add Company" button
3. Verify navigation

**Expected Results**:

- [ ] Click "Add Company" → Navigate to Companies tab
- [ ] Click "Record Transaction" → Navigate to Transactions tab
- [ ] Click "Generate Report" → Navigate to Reports tab
- [ ] Click "View Portfolio" → Navigate to Portfolio tab

---

## PORTFOLIO TESTS

### Test Case: PT-001 - Portfolio Page Loads

**Preconditions**: Logged in with investment module  
**Steps**:

1. Click "Portfolio" tab
2. Wait for page load

**Expected Results**:

- [ ] Portfolio view loads
- [ ] Summary cards display
- [ ] Holdings table displays
- [ ] No JavaScript errors
- [ ] Load time < 3 seconds

---

### Test Case: PT-002 - Portfolio Summary Cards

**Preconditions**: On Portfolio tab  
**Steps**:

1. Check summary section
2. Verify data

**Expected Results**:

- [ ] Total Value: Shows ₨ amount
- [ ] Holdings: Shows count of companies
- [ ] Cash: Shows available cash
- [ ] Day Change: Shows % with color (green/red)

---

### Test Case: PT-003 - Holdings Table Display

**Preconditions**: Portfolio with holdings  
**Steps**:

1. Locate holdings table
2. Count rows
3. Check columns

**Expected Results**:

- [ ] Table has all columns: Name, Symbol, Qty, Avg Cost, Price, Total, Change%, %, Actions
- [ ] 10 rows visible initially
- [ ] Alternating row colors (light/white)
- [ ] Enough rows shown to demonstrate pagination (if applicable)

---

### Test Case: PT-004 - Holdings Table Row Actions

**Preconditions**: Portfolio table visible with holdings  
**Steps**:

1. Click "Edit" button on first holding
2. Verify action

**Expected Results**:

- [ ] Modal opens with holding edit form
- [ ] Form fields: Quantity, Average Cost
- [ ] Current values pre-filled
- [ ] Buttons: "Save", "Cancel"
- [ ] Click Save → Update holding → Toast: "Holding updated"
- [ ] Click Cancel → Close modal, no changes

**Delete Action**:

- [ ] Click "Delete" button
- [ ] Confirmation modal: "Delete this holding?"
- [ ] Click "Delete" in modal → Remove from list
- [ ] Toast: "Holding deleted"
- [ ] Table row disappears

**Details Action**:

- [ ] Click "Details" button
- [ ] Side panel shows holding details:
  - [ ] Company name
  - [ ] Symbol
  - [ ] Quantity
  - [ ] Cost basis
  - [ ] Current value
  - [ ] Gain/Loss
  - [ ] Performance chart (if rendered)

---

### Test Case: PT-005 - Holdings Filtering

**Preconditions**: Portfolio with multiple holdings from different sectors  
**Steps**:

1. Find filter section above table
2. Select "Banking" sector from dropdown
3. Click "Apply Filters"
4. Observe table

**Expected Results**:

- [ ] Table now shows only Banking sector holdings
- [ ] Count reduces
- [ ] Filter dropdown shows "Banking" selected
- [ ] "Clear Filters" button enabled
- [ ] Click "Clear Filters" → All holdings visible again

---

### Test Case: PT-006 - Holdings Sorting

**Preconditions**: Holdings table visible  
**Steps**:

1. Click "Company Name" column header
2. Observe sort
3. Click again
4. Observe reverse sort

**Expected Results**:

- [ ] First click: Sorts A→Z
- [ ] Second click: Sorts Z→A
- [ ] Sort arrow indicator visible on header
- [ ] Table re-renders with new order
- [ ] No API call needed (client-side sort)

---

### Test Case: PT-007 - Add Holding Button

**Preconditions**: Portfolio tab open  
**Steps**:

1. Click "Add Holding" button
2. Observe modal

**Expected Results**:

- [ ] Modal opens: "Add Holding"
- [ ] Form fields:
  - [ ] Company (searchable dropdown)
  - [ ] Quantity (number input)
  - [ ] Average Cost (currency input)
  - [ ] Purchase Date (date picker)
- [ ] Form empty for new entry
- [ ] Buttons: "Add Holding", "Cancel"

**Add Holding Flow**:

1. Type "NIFRA" in Company field
2. Dropdown shows matching companies
3. Click to select "NIFRA Insurance"
4. Enter: Qty=100, Cost=500
5. Click "Add Holding"

**Expected Result**:

- [ ] Modal closes
- [ ] New row added to table
- [ ] Toast: "Holding added successfully"
- [ ] Table re-calculates totals

---

### Test Case: PT-008 - Portfolio Recalculation

**Preconditions**: Portfolio tab with holdings  
**Steps**:

1. Click "Recalculate Portfolio" button
2. Wait for process

**Expected Results**:

- [ ] Button shows loading spinner
- [ ] Button disabled during calculation
- [ ] Toast: "Recalculating portfolio…"
- [ ] After complete: "Portfolio recalculated"
- [ ] Updated values display
- [ ] Totals verified

---

## TRANSACTIONS TESTS

### Test Case: TR-001 - Transactions Page Loads

**Preconditions**: Logged in with investment module  
**Steps**:

1. Click "Transactions" tab

**Expected Results**:

- [ ] Transactions view loads
- [ ] Filters section visible
- [ ] Transaction table visible
- [ ] Add transaction form visible
- [ ] No errors

---

### Test Case: TR-002 - Transaction Filters

**Preconditions**: On Transactions tab  
**Steps**:

1. Set date range: From = 01-Jan-2025, To = 31-Mar-2025
2. Select Company = NIFRA
3. Select Type = BUY
4. Click "Apply Filters"

**Expected Results**:

- [ ] Table updates to show only matching transactions
- [ ] Filter values displayed
- [ ] "Clear Filters" button enabled
- [ ] Click to clear resets all filters

---

### Test Case: TR-003 - Transaction List Display

**Preconditions**: Transactions loaded  
**Steps**:

1. View transaction table
2. Check columns
3. Count rows

**Expected Results**:

- [ ] Columns: Date, Company, Type, Quantity, Price, Commission, Tax, Total, Status, Actions
- [ ] 10-20 rows visible
- [ ] Type shows BUY/SELL badge with styling
- [ ] Status shows POSTED/DRAFT/CANCELLED with colors
- [ ] Amounts formatted with commas and currency symbol

---

### Test Case: TR-004 - View Transaction Details

**Preconditions**: Transaction list visible  
**Steps**:

1. Click "View" button on first transaction
2. Examine modal

**Expected Results**:

- [ ] Modal opens: "Transaction Details"
- [ ] Shows all fields:
  - [ ] Date
  - [ ] Company
  - [ ] Type
  - [ ] Quantity
  - [ ] Unit Price
  - [ ] Commission
  - [ ] Tax
  - [ ] Total Cost/Proceeds
  - [ ] Status
  - [ ] Notes
- [ ] Fields read-only
- [ ] Close button (X)

---

### Test Case: TR-005 - Edit Transaction

**Preconditions**: Transaction visible, status = DRAFT  
**Steps**:

1. Click "Edit" button
2. Observe form

**Expected Results**:

- [ ] Modal opens: "Edit Transaction"
- [ ] Fields editable:
  - [ ] Date
  - [ ] Quantity
  - [ ] Unit Price
  - [ ] Commission
  - [ ] Tax
- [ ] Fields disabled (read-only):
  - [ ] Company
  - [ ] Type
- [ ] Buttons: "Save", "Cancel"
- [ ] Edit and click Save

**After Save**:

- [ ] Modal closes
- [ ] Table row updates
- [ ] Toast: "Transaction updated"

---

### Test Case: TR-006 - Delete Transaction

**Preconditions**: Transaction visible, status = DRAFT  
**Steps**:

1. Click "Delete" button
2. Confirmation modal

**Expected Results**:

- [ ] Modal: "Delete this transaction?"
- [ ] Warning: "This action cannot be undone"
- [ ] Buttons: "Cancel", "Delete"
- [ ] Click "Delete"

**After Delete**:

- [ ] Modal closes
- [ ] Row removed from table
- [ ] Toast: "Transaction deleted"
- [ ] Portfolio recalculates

---

### Test Case: TR-007 - Add Single Transaction (BUY)

**Preconditions**: On Transactions tab  
**Steps**:

1. Locate "Record Transaction" or "Add Transaction" form
2. Fill form:
   ```
   Date: 01-Jan-2025
   Company: NIFRA
   Type: BUY (select)
   Quantity: 50
   Unit Price: 500
   Commission: 250 (fixed amount)
   Tax: 5%
   Notes: Test transaction
   ```
3. Click "Record Transaction"

**Auto-Calculated Fields**:

- [ ] Total Cost = 50 × 500 = 25,000
- [ ] Commission = 250
- [ ] Tax = (25000 + 250) × 5% = 1,262.50
- [ ] Net Cost = 25,000 + 250 + 1,262.50 = 26,512.50

**Expected Results**:

- [ ] Form validates successfully
- [ ] Loading spinner shows
- [ ] Success toast: "Transaction recorded"
- [ ] Form resets to empty
- [ ] New transaction appears in table

---

### Test Case: TR-008 - Add Single Transaction (SELL)

**Preconditions**: On Transactions, holding exists  
**Steps**:

1. Fill form:
   ```
   Date: 15-Jan-2025
   Company: NIFRA
   Type: SELL (select)
   Quantity: 25
   Unit Price: 550
   Commission: 137.50
   Tax: 5%
   ```
2. Click "Record Transaction"

**Expected Results**:

- [ ] Transaction records
- [ ] Calculations show proceeds after commission/tax
- [ ] Transaction appears in list

---

### Test Case: TR-009 - Bulk Import Transactions

**Preconditions**: On Transactions tab  
**Steps**:

1. Click "Import Excel" button
2. Download template (if available)
3. Prepare Excel file:
   ```
   Date | Company | Type | Quantity | Price | Commission | Tax
   01-Jan-2025 | NIFRA | BUY | 50 | 500 | 250 | 5
   05-Jan-2025 | HGC | BUY | 100 | 250 | 250 | 5
   10-Jan-2025 | NIFRA | SELL | 25 | 550 | 137.50 | 5
   ```
4. Upload file
5. Verify preview data
6. Click "Import All"

**Expected Results**:

- [ ] File upload succeeds
- [ ] Preview shows all rows
- [ ] Column mapping automatic/configurable
- [ ] Click Import processes all rows
- [ ] Success: Toast with count "3 transactions imported"
- [ ] All appear in table

---

### Test Case: TR-010 - Commission Percentage Option

**Preconditions**: Adding transaction  
**Steps**:

1. Fill transaction form
2. Set Commission Type = "Percentage"
3. Enter Commission = 0.5%
4. Total Cost = 50 × 500 = 25,000
5. Commission = 25,000 × 0.5% = 125
6. Observe auto-calculation

**Expected Results**:

- [ ] Commission field becomes percentage
- [ ] Label changes: "Commission"
- [ ] Calculation updates: Total Commission = Net × %
- [ ] Final cost includes percentage commission

---

## REPORTS TESTS

### Test Case: RP-001 - Reports Page Loads

**Preconditions**: Logged in with investment module  
**Steps**:

1. Click "Reports" tab
2. Wait for load

**Expected Results**:

- [ ] Reports view loads
- [ ] Report selector visible (switches between 8 report types)
- [ ] First report (Monthly Summary) displays
- [ ] No errors

---

### Test Case: RP-002 - Monthly Summary Report

**Preconditions**: On Reports tab  
**Steps**:

1. Ensure "Monthly Summary" selected
2. Check date range selector
3. Review table

**Expected Results**:

- [ ] Date range picker shows: From date, To date
- [ ] Table shows:
  - [ ] Month | BUYs | SELLs | Profit/Loss | Notes
- [ ] Numbers sum correctly
- [ ] Color coding: Green for profit, Red for loss

---

### Test Case: RP-003 - Sector Analysis Report

**Preconditions**: On Reports tab  
**Steps**:

1. Select "Sector Analysis" from dropdown
2. Wait for render
3. Examine display

**Expected Results**:

- [ ] Report type changes
- [ ] Shows table with sectors:
  - [ ] Sector | Holdings | Value | % of Portfolio | Return
- [ ] Bar/pie chart displays sector breakdown
- [ ] Colors per sector

---

### Test Case: RP-004 - Tax Report

**Preconditions**: On Reports, transactions exist with gains/losses  
**Steps**:

1. Select "Tax Report"
2. Set date range last fiscal year
3. Review data

**Expected Results**:

- [ ] Lists:
  - [ ] Short-term capital gains
  - [ ] Long-term capital gains
  - [ ] Total tax liability
  - [ ] Deductible losses
- [ ] Amounts calculated correctly
- [ ] Export options available

---

### Test Case: RP-005 - Custom Pivot Table

**Preconditions**: On Reports, select Pivot Table  
**Steps**:

1. Select "Custom Pivot"
2. Drag fields:
   - [ ] Rows: "Company"
   - [ ] Columns: "Type" (BUY/SELL)
   - [ ] Values: "Total Cost"
3. Click "Apply"

**Expected Results**:

- [ ] Pivot table renders with custom dimensions
- [ ] Shows company rows × type columns
- [ ] Totals calculated
- [ ] Can modify fields and refresh

---

### Test Case: RP-006 - Export Report to Excel

**Preconditions**: Report displayed  
**Steps**:

1. Click "Export to Excel" button
2. Monitor file download

**Expected Results**:

- [ ] Browser download starts
- [ ] Filename: [ReportType]\_[Date].xlsx
- [ ] Excel file opens in editor
- [ ] Data matches displayed report
- [ ] Formatting preserved (colors, numbers)

---

### Test Case: RP-007 - Print Report

**Preconditions**: Report displayed  
**Steps**:

1. Click "Print" button (or Ctrl+P)
2. Print dialog opens
3. Preview print

**Expected Results**:

- [ ] Print dialog shows
- [ ] Report appears in preview
- [ ] Headers/footers visible
- [ ] Data formatted for print
- [ ] Colors/styling maintained (or PDF-friendly)
- [ ] Can print to PDF or paper printer

---

## COMPANIES TESTS

### Test Case: CP-001 - Companies Page Loads

**Preconditions**: Logged in with investment module  
**Steps**:

1. Click "Companies" tab

**Expected Results**:

- [ ] Companies view loads
- [ ] Search/filter section visible
- [ ] Company list/cards visible
- [ ] No errors

---

### Test Case: CP-002 - Company Search

**Preconditions**: On Companies tab  
**Steps**:

1. Type "NIFRA" in search field
2. Wait for filter

**Expected Results**:

- [ ] List filters to show only NIFRA
- [ ] Count reduces
- [ ] Company card/row visible
- [ ] No need to click search button (real-time filter)

---

### Test Case: CP-003 - Company Filter by Sector

**Preconditions**: Companies page  
**Steps**:

1. Click Sector dropdown
2. Select "BANKING"
3. Apply filter

**Expected Results**:

- [ ] List shows only Banking sector companies
- [ ] "Clear Filters" button enabled
- [ ] Count displayed

---

### Test Case: CP-004 - View Company in Table View

**Preconditions**: Companies in table view  
**Steps**:

1. Verify table layout
2. Check columns
3. Click company row

**Expected Results**:

- [ ] Table shows columns: Name, Symbol, Sector, Type, Market Cap, 52H, 52L, Price, Actions
- [ ] Click row → Company details page/modal
- [ ] Shows full company info

---

### Test Case: CP-005 - Switch to Card View

**Preconditions**: Companies tab, in Table View  
**Steps**:

1. Look for "View" toggle or button
2. Click toggle → Card view
3. Observe layout

**Expected Results**:

- [ ] View switches to card grid
- [ ] Each company shown in card format
- [ ] Card shows: Logo, Name, Symbol, Sector, Price, Change%, Action buttons
- [ ] Responsive grid (1-2-3 columns depending on screen width)

---

### Test Case: CP-006 - Add Company

**Preconditions**: On Companies tab  
**Steps**:

1. Click "Add Company" button
2. Modal opens: "Create Company"
3. Enter:
   ```
   Company Name: Test Stock Inc
   Symbol: TSI
   Sector: Technology
   Type: Equity
   Market Cap: 5000000000
   Description: A test company
   Logo URL: https://example.com/logo.png
   ```
4. Click "Create"

**Validation Checks**:

- [ ] Symbol must be unique (error if duplicate)
- [ ] Name required (error if empty)
- [ ] Sector required

**Expected Result**:

- [ ] Modal closes
- [ ] New company appears in list
- [ ] Toast: "Company created successfully"

---

### Test Case: CP-007 - Edit Company (Admin)

**Preconditions**: On Companies, logged in as admin, company card visible  
**Steps**:

1. Click "Edit" button on company,
2. Modal opens: "Edit Company"
3. Change company name: "Test Stock Inc → Test Stock Modified"
4. Click "Save"

**Expected Results**:

- [ ] Form validates
- [ ] Updates in list
- [ ] Toast: "Company updated"
- [ ] Card/row shows new name

---

### Test Case: CP-008 - Delete Company (Admin)

**Preconditions**: Company editable in admin  
**Steps**:\*\*

1. Click "Delete" button on company
2. Confirmation modal appears

**Expected Results**:

- [ ] Modal: "Delete [Company]?"
- [ ] Warning if company has holdings
- [ ] Buttons: "Delete", "Cancel"
- [ ] Click Delete

**After Delete**:

- [ ] Removed from list
- [ ] Toast: if has holdings "Cannot delete - holdings exist"
- [ ] OR Toast: "Company deleted"

---

## ACCOUNTING TESTS

### Test Case: AC-001 - Accounting Dashboard Loads

**Preconditions**: Logged in with accounting module  
**Steps**:

1. Click "Accounting" tab

**Expected Results**:

- [ ] Accounting dashboard loads
- [ ] Sub-tabs visible: Chart of Accounts, Journals, Bank Reconciliation, Reports
- [ ] Default subtab displayed: Chart of Accounts
- [ ] No errors

---

### Test Case: AC-002 - Chart of Accounts Tree View

**Preconditions**: On Accounting > Chart of Accounts  
**Steps**:

1. Observe tree structure
2. Click expand arrow on "Assets"
3. Verify hierarchy

**Expected Results**:

- [ ] Tree shows 5 main groups:
  - [ ] Assets (arrow expands)
  - [ ] Liabilities
  - [ ] Equity
  - [ ] Income
  - [ ] Expenses
- [ ] Expanded "Assets" shows sub-groups:
  - [ ] Current Assets
  - [ ] Fixed Assets
- [ ] Collapsed -> Expanded arrow changes direction
- [ ] Click row to view details

---

### Test Case: AC-003 - Create Ledger Account

**Preconditions**: On Chart of Accounts, "Assets > Current Assets" expanded  
**Steps**:

1. Click "Add Account" button (or right-click group)
2. Modal: "Create Ledger Account"
3. Fill form:
   ```
   Account Code: 1050
   Account Name: Petty Cash
   Normal Balance: DEBIT
   Opening Balance: 10000
   Description: Small expense cash
   ```
4. Click "Create"

**Validation**:

- [ ] Code unique within org (error if duplicate)
- [ ] Code required
- [ ] Name required

**Result**:

- [ ] Account appears under Assets > Current Assets
- [ ] Toast: "Account created"

---

### Test Case: AC-004 - View Ledger Account Details

**Preconditions**: Ledger account in tree  
**Steps**:

1. Click account row (e.g., "1050 Petty Cash")
2. Details panel opens

**Expected Results**:

- [ ] Panel shows:
  - [ ] Code: 1050
  - [ ] Name: Petty Cash
  - [ ] Normal Balance: DEBIT
  - [ ] Opening Balance: 10,000
  - [ ] Current Balance: (calculated, may change after entries)
  - [ ] Recent transactions: List of entries
- [ ] Close panel (X button)

---

### Test Case: AC-005 - Journal Entry List

**Preconditions**: On Accounting > Journals  
**Steps**:

1. View journal entries table
2. Count visible entries
3. Check columns

**Expected Results**:

- [ ] Table shows entries:
  - [ ] Entry ID
  - [ ] Date
  - [ ] Description
  - [ ] Debit Total
  - [ ] Credit Total
  - [ ] Status (DRAFT/POSTED/REVERSED)
  - [ ] Actions
- [ ] 20+ entries visible
- [ ] Paginated if more than 20

---

### Test Case: AC-006 - Filter Journals by Date

**Preconditions**: Journals page  
**Steps**:

1. Set date range: Jan 1 - Mar 31, 2025
2. Click "Apply Filter"

**Expected Results**:

- [ ] Table updates to show only entries in date range
- [ ] Count updates
- [ ] Filter indicator shows "Applied"

---

### Test Case: AC-007 - Create Journal Entry

**Preconditions**: On Journals tab  
**Steps**:

1. Click "New Entry" button
2. Form opens: "Journal Entry"
3. Fill form:
   ```
   Date: 01-Jan-2025
   Description: Opening balances entry
   Reference: OP-2025-01
   Lines:
     1. Account: 1010 Cash, Debit: 50000
     2. Account: 1020 Bank, Debit: 100000
     3. Account: 3010 Capital, Credit: 150000
   ```
4. Verify: Total Debit = 150,000, Total Credit = 150,000
5. Click "Post"

**Validations**:

- [ ] Debit must equal Credit
- [ ] At least 2 lines
- [ ] All accounts required
- [ ] All amounts required

**Result**:

- [ ] Entry saved and posted
- [ ] Status: POSTED
- [ ] Ledger accounts updated with balances
- [ ] Toast: "Entry posted"

---

### Test Case: AC-008 - Edit Draft Journal Entry

**Preconditions**: Journal entry in DRAFT status  
**Steps**:

1. Click "Edit" on draft entry
2. Change amount on a line
3. Click "Save"

**Expected Results**:

- [ ] Form opens in edit mode
- [ ] Fields editable
- [ ] After save: Updates entry, status remains DRAFT
- [ ] Toast: "Entry updated"

---

### Test Case: AC-009 - Reverse Posted Entry

**Preconditions**: Journal entry in POSTED status  
**Steps**:

1. Click "Reverse" button
2. Modal appears: "Reverse this entry?"
3. Confirm

**Expected Results**:

- [ ] New entry created with reversed amounts
- [ ] Original entry status: REVERSED (read-only)
- [ ] New entry status: POSTED
- [ ] Ledger balances back to previous state
- [ ] Toast: "Entry reversed"

---

### Test Case: AC-010 - Bank Reconciliation

**Preconditions**: On Reconciliation tab, bank transactions exist  
**Steps**:

1. Check "Start Reconciliation" button
2. Click to open reconciliation form
3. Fill:
   ```
   Bank: NABIL Bank
   Statement Balance: 250000
   Statement Date: 31-Jan-2025
   ```
4. Match transactions:
   - [ ] Click checkboxes to match recorded transactions
   - [ ] Total matched should approach statement balance
5. Resolve discrepancies (if any)
6. Click "Complete Reconciliation"

**Expected Results**:

- [ ] Outstanding items listed (not yet cleared)
- [ ] Matched total calculated
- [ ] Variance shown: Statement Balance - Matched = Outstanding
- [ ] After complete: Status shows RECONCILED
- [ ] Date recorded

---

## NEPAL/TAX TESTS

### Test Case: NP-001 - Nepal Dashboard Loads

**Preconditions**: Logged in with accounting module  
**Steps**:

1. Click "Nepal / Tax" tab
2. Wait for load

**Expected Results**:

- [ ] Nepal dashboard loads
- [ ] 4 sections visible:
  - [ ] Calendar Conversion
  - [ ] VAT Management
  - [ ] TDS Management
  - [ ] IRD Compliance
- [ ] No errors

---

### Test Case: NP-002 - BS ↔ AD Conversion

**Preconditions**: On Nepal Dashboard  
**Steps**:

1. Select "AD to BS" mode
2. Pick date: 15-Mar-2025 (AD)
3. Click "Convert"

**Expected Results**:

- [ ] Converts to BS: 01-12-2081 (approx.)
- [ ] Shows day of week
- [ ] Shows if holiday (with holiday name)
- [ ] Second conversion: Select "BS to AD"
- [ ] Pick: 01-12-2081
- [ ] Converts back to ~15-Mar-2025

---

### Test Case: NP-003 - Configure VAT

**Preconditions**: On Nepal Dashboard, VAT section  
**Steps**:

1. Click "Configure VAT"
2. Modal: "VAT Configuration"
3. Fill:
   ```
   VAT Rate: 13%
   Apply to Sales: checked
   Apply to Purchases: unchecked
   Effective Date: 01-Jan-2025
   ```
4. Click "Save"

**Result**:

- [ ] VAT config saved
- [ ] Toast: "VAT configured"

---

### Test Case: NP-004 - Generate VAT Return

**Preconditions**: VAT configured, invoices with VAT posted  
**Steps**:

1. Click "Generate VAT Return"
2. Select:
   ```
   Period: Month
   From: 01-Jan-2025
   To: 31-Jan-2025
   ```
3. Click "Generate"

**Expected Results**:

- [ ] Preview shows:
  - [ ] Total Sales (Taxable)
  - [ ] VAT Collected
  - [ ] Total Purchases
  - [ ] VAT Paid
  - [ ] Net VAT Due/Refundable
- [ ] Amounts calculated from GL
- [ ] Buttons: "Download PDF", "Submit to IRD"
- [ ] Click Download → PDF file generated

---

### Test Case: NP-005 - Configure TDS Section

**Preconditions**: On Nepal Dashboard, TDS section  
**Steps**:

1. Click "Add TDS Section"
2. Modal: "Configure TDS"
3. Select Section: "Salary (194J)"
4. Enter Rate: 5%
5. Click "Save"

**Result**:

- [ ] TDS section added to list
- [ ] Shows in TDS Summary table

---

### Test Case: NP-006 - Calculate TDS on Invoice

**Preconditions**: Invoice posted with TDS applicable vendor  
**Steps**:

1. Navigate to invoice details
2. Check TDS calculation:
   ```
   Invoice Amount: 100,000
   TDS Rate: 5%
   TDS Amount: 5,000
   Net Payable: 95,000
   ```

**Expected Results**:

- [ ] TDS auto-calculated
- [ ] GL entry created:
  - [ ] Expense: 100,000
  - [ ] TDS Rec: 5,000
  - [ ] AP: 95,000

---

### Test Case: NP-007 - Generate TDS Certificate

**Preconditions**: TDS transactions recorded  
**Steps**:

1. Click "Generate TDS Certificate"
2. Select:
   ```
   Section: Salary
   Fiscal Year: 2081/82
   ```
3. Click "Generate"

**Expected Results**:

- [ ] Certificate preview shows:
  - [ ] Employee details
  - [ ] Total salary
  - [ ] TDS deducted
  - [ ] Net amount
- [ ] Buttons: "Download PDF", "Email"
- [ ] Click Download → PDF file

---

### Test Case: NP-008 - Export Sales Register to IRD

**Preconditions**: Invoices posted  
**Steps**:

1. Click "Export Sales Register"
2. Select date range: Jan-Mar 2025
3. Click "Export"

**Expected Results**:

- [ ] CSV file downloads: SalesRegister_2025-01-01_2025-03-31.csv
- [ ] Contains columns:
  - [ ] Date
  - [ ] Invoice No
  - [ ] Customer Name
  - [ ] Amount
  - [ ] VAT
  - [ ] IRD Format
- [ ] Open CSV in Excel to verify

---

## ORGANIZATION SETTINGS TESTS

### Test Case: OS-001 - Organization Info Display

**Preconditions**: Logged in, click "Org Settings" tab  
**Steps**:

1. View organization information section

**Expected Results**:

- [ ] Displays:
  - [ ] Organization Name
  - [ ] Business Type
  - [ ] Country
  - [ ] Fiscal Year Start
  - [ ] Created Date
  - [ ] Last Updated
- [ ] Fields read-only for non-admin

---

### Test Case: OS-002 - Edit Organization (Admin)

**Preconditions**: Logged in as admin  
**Steps**:

1. Find "Organization Information" section
2. Click "Edit" button
3. Modal: "Edit Organization"
4. Change Fiscal Year Start date
5. Click "Save"

**Result**:

- [ ] Updates organization
- [ ] Toast: "Organization updated"

---

### Test Case: OS-003 - Module Management

**Preconditions**: On Org Settings, admin user  
**Steps**:

1. Find "Module Management" section
2. Observe checkboxes:
   - [ ] Investment Module
   - [ ] Accounting Module
   - [ ] Inventory Module
3. Uncheck "Investment Module"
4. Confirm dialog: "Disabling this module will hide related tabs"
5. Confirm

**Expected Results**:

- [ ] Module disabled in org
- [ ] Portfolio, Transactions, Reports, Companies tabs hidden
- [ ] Non-redirected users get toast: "Module not available"
- [ ] Check module again → Tabs re-appear

---

### Test Case: OS-004 - Add User to Organization

**Preconditions**: On Org Settings  
**Steps**:

1. Find "Users & Roles" section
2. Click "Add User" button
3. Modal opens
4. Select user from dropdown: "demo"
5. Select role: "Manager"
6. Click "Add User"

**Result**:

- [ ] User added to org
- [ ] Appears in list
- [ ] Toast: "User added"

---

### Test Case: OS-005 - Change User Role

**Preconditions**: Users listed in Organization  
**Steps**:

1. Find user in list: "demo"
2. Click role dropdown: currently "Manager"
3. Change to "Operator"
4. Click "Save"

**Result**:

- [ ] Role updated
- [ ] Toast: "User role updated"

---

### Test Case: OS-006 - Set Session Timeout

**Preconditions**: On Org Settings, "Security Settings" section  
**Steps**:

1. Find Session Timeout dropdown
2. Select: "30 minutes"
3. Click "Save"

**Result**:

- [ ] Setting saved
- [ ] Toast: "Settings updated"
- [ ] Future sessions timeout after 30 minutes of inactivity

---

## ADMIN TESTS

### Test Case: AD-001 - Admin Dashboard Loads

**Preconditions**: Logged in as admin, click "Admin" tab  
**Steps**:

1. Wait for page load

**Expected Results**:

- [ ] Admin dashboard loads
- [ ] 4 sub-tabs visible:
  - [ ] Overview
  - [ ] Users
  - [ ] Roles
  - [ ] Approvals
- [ ] No errors

---

### Test Case: AD-002 - Overview Statistics

**Preconditions**: On Admin > Overview  
**Steps**:

1. View statistics section

**Expected Results**:

- [ ] 4 cards visible:
  1. Total Users: Shows count (clickable)
  2. Active Users: Shows count
  3. Pending Approvals: Shows count
  4. Total Roles: Shows count
- [ ] Cards color-coded
- [ ] Click "Total Users" card → Navigate to Users tab

---

### Test Case: AD-003 - Quick Actions

**Preconditions**: On Admin > Overview  
**Steps**:

1. Find "Quick Actions" section
2. Check available buttons

**Expected Results**:

- [ ] Button: "Create User" → Opens user creation modal
- [ ] Button: "Create Role" → Opens role creation modal
- [ ] Button: "View Approvals" → Navigate to Approvals tab

---

### Test Case: AD-004 - Recent Activity List

**Preconditions**: On Admin > Overview  
**Steps**:

1. Find "Recent Activity" section
2. Check list

**Expected Results**:

- [ ] Shows recent actions:
  - [ ] User created: Alice (timestamp)
  - [ ] User approved: Bob (timestamp)
  - [ ] Role modified: Manager (timestamp)
- [ ] Can expand row for details

---

### Test Case: AD-005 - User List Display

**Preconditions**: On Admin > Users tab  
**Steps**:

1. View user table

**Expected Results**:

- [ ] Table columns: User ID, Username, Email, Branch, User Type, Status, Created Date, Actions
- [ ] 20+ users visible
- [ ] Pagination if more than 20

---

### Test Case: AD-006 - Filter Users by Status

**Preconditions**: On Users tab  
**Steps**:

1. Click Status dropdown filter
2. Select "PENDING"
3. Apply

**Expected Results**:

- [ ] Shows only PENDING users
- [ ] Count reduces
- [ ] Filter indicator shows

---

### Test Case: AD-007 - Create User

**Preconditions**: On Users tab  
**Steps**:

1. Click "Create User" button
2. Modal: "Create User"
3. Fill form:
   ```
   Username: newuser
   Email: newuser@test.com
   User Type: Operator
   Branch: New York
   ```
4. Click "Create"

**Validation**:

- [ ] Username unique
- [ ] Email valid format
- [ ] Required fields checked

**Result**:

- [ ] User created with status PENDING (requires approval)
- [ ] Toast: "User created. Approval required."
- [ ] Appears in pending approvals
- [ ] User receives invitation email (if email configured)

---

### Test Case: AD-008 - Approve Pending User

**Preconditions**: Pending user in list  
**Steps**:

1. Find pending user: "newuser"
2. Click "Approve" button
3. Confirmation: "Approve this user?"
4. Click "Approve"

**Result**:

- [ ] User status changes to ACTIVE
- [ ] User can now login
- [ ] Toast: "User approved"
- [ ] Removed from pending count

---

### Test Case: AD-009 - Reject Pending User

**Preconditions**: Pending user in list  
**Steps**:

1. Find pending user
2. Click "Reject" button
3. Modal: "Reject User"
4. Enter reason: "Does not meet criteria"
5. Click "Confirm"

**Result**:

- [ ] User status: REJECTED
- [ ] User notified (email)
- [ ] Toast: "User rejected"

---

### Test Case: AD-010 - Suspend Active User

**Preconditions**: Active user in list  
**Steps**:

1. Find user: "demo"
2. Click "Suspend" button
3. Confirm: "Suspend this user?"
4. Click "Suspend"

**Result**:

- [ ] User status: SUSPENDED
- [ ] User cannot login (if they try, error: "Account suspended")
- [ ] Toast: "User suspended"

---

### Test Case: AD-011 - Unsuspend User

**Preconditions**: Suspended user in list  
**Steps**:

1. Find suspended user
2. Click "Unsuspend" button
3. Confirm
4. Click "Unsuspend"

**Result**:

- [ ] User status: ACTIVE
- [ ] User can login again
- [ ] Toast: "User unsuspended"

---

### Test Case: AD-012 - Reset User Password

**Preconditions**: User in list  
**Steps**:

1. Click "Reset Password" button on user row
2. Modal: "Reset password for [User]?"
3. Click "Send Reset Email"

**Result**:

- [ ] Reset email sent to user's email
- [ ] Toast: "Reset email sent"
- [ ] User receives password reset link
- [ ] User can click link and set new password

---

### Test Case: AD-013 - Delete User

**Preconditions**: User to delete in list  
**Steps**:

1. Click "Delete" button
2. Modal: "Are you sure you want to delete [User]?"
3. Warning: "This cannot be undone"
4. Click "Delete"

**Result**:

- [ ] User removed from list
- [ ] Toast: "User deleted"
- [ ] User cannot login

---

### Test Case: AD-014 - Create Role

**Preconditions**: On Admin > Roles tab  
**Steps**:

1. Click "Create Role" button
2. Modal: "Create Role"
3. Fill:
   ```
   Role Name: Analyst
   Description: Business analyst role
   Functions:
     - USER_VIEW
     - TRANSACTION_VIEW
     - REPORT_VIEW
   ```
4. Click "Create"

**Result**:

- [ ] Role created
- [ ] Appears in roles list
- [ ] Toast: "Role created"

---

### Test Case: AD-015 - Edit Role (Add Functions)

**Preconditions**: Role in list  
**Steps**:

1. Click "Edit" on role: "Manager"
2. Modal: "Edit Role: Manager"
3. Check additional functions: "TRANSACTION_MODIFY"
4. Click "Save"

**Result**:

- [ ] Role updated with new functions
- [ ] Toast: "Role updated"

---

### Test Case: AD-016 - Delete Role (If No Users Assigned)

**Preconditions**: Role with no assigned users  
**Steps**:

1. Click "Delete" on role
2. Modal: "Delete [Role]?"
3. Click "Delete"

**Result**:

- [ ] Role deleted
- [ ] Toast: "Role deleted"

**If Users Assigned**:

- [ ] Delete button disabled OR
- [ ] Error message: "Cannot delete role with assigned users"

---

### Test Case: AD-017 - View Approvals List

**Preconditions**: On Admin > Approvals tab  
**Steps**:

1. View approvals table

**Expected Results**:

- [ ] Table shows:
  - [ ] Approval ID
  - [ ] Type (User Signup / Data Change / Deletion)
  - [ ] Submitted By
  - [ ] Submitted Date
  - [ ] Status (PENDING / APPROVED / REJECTED)

---

### Test Case: AD-018 - Approve Data Change Request

**Preconditions**: Pending approval in list  
**Steps**:

1. Click row to expand
2. Review requested changes
3. Click "Approve" button
4. Confirm

**Result**:

- [ ] Change applied
- [ ] Status: APPROVED
- [ ] Toast: "Approval granted"

---

## MAINTENANCE TESTS (ROOT ONLY)

### Test Case: MN-001 - Maintenance Page Loads

**Preconditions**: Logged in as root  
**Steps**:

1. Click "Root Actions" tab

**Expected Results**:

- [ ] Maintenance dashboard loads
- [ ] Sections visible:
  - [ ] Database Management
  - [ ] Server Status
  - [ ] System Configuration
  - [ ] Development Tools

---

### Test Case: MN-002 - Backup Database

**Preconditions**: On Maintenance tab  
**Steps**:

1. Click "Backup Database" button
2. Show spinner with status
3. Wait for completion

**Expected Results**:

- [ ] Status: "Creating backup…"
- [ ] After complete: "Backup created successfully"
- [ ] Download link appears
- [ ] Click link → Download .db or .sql file

---

### Test Case: MN-003 - View Server Logs

**Preconditions**: On Maintenance tab  
**Steps**:

1. Find "Server Logs" section
2. View live log output (last 100 lines)
3. Adjust log level filter: ERROR, WARN, INFO, DEBUG
4. Select DEBUG

**Expected Results**:

- [ ] Logs update to show DEBUG level messages
- [ ] Real-time updates (or refresh button)
- [ ] Download logs button available

---

### Test Case: MN-004 - Clear Logs

**Preconditions**: On Maintenance tab  
**Steps**:

1. Click "Clear Logs" button
2. Modal: "Clear logs from [date] to [date]?"
3. Set date range
4. Confirm

**Expected Results**:

- [ ] Logs cleared
- [ ] Toast: "Logs cleared"
- [ ] Log display updated

---

### Test Case: MN-005 - View Database Statistics

**Preconditions**: On Maintenance tab  
**Steps**:

1. Find "Database Stats" section

**Expected Results**:

- [ ] Displays:
  - [ ] Database size: (MB/GB)
  - [ ] Table count: N
  - [ ] Record count: N
  - [ ] Last backup: [Date/Time]

---

### Test Case: MN-006 - Reset to Factory Defaults

**Preconditions**: On Maintenance tab  
**Steps**:

1. Click "Reset to Defaults" button (DANGER)
2. Multiple confirmation modals:
   - [ ] Confirm window 1: "Are you sure?"
   - [ ] Confirm window 2: "Type 'RESET' to confirm"
   - [ ] Confirm window 3: "All data will be deleted"
3. Type RESET
4. Final confirmation

**Expected Results**:

- [ ] Database reset to initial state
- [ ] All user data cleared
- [ ] Demo data reloaded
- [ ] System redirects to setup wizard
- [ ] Toast: "System reset complete"

---

## ERROR HANDLING & EDGE CASES

### Test Case: EH-001 - Network Error Handling

**Preconditions**: API unavailable  
**Steps**:

1. Disable network (DevTools > Offline)
2. Click any data-loading button (e.g., "Generate Report")
3. Wait for timeout

**Expected Results**:

- [ ] Error toast: "Network error. Please try again."
- [ ] Retry button available
- [ ] UI remains usable
- [ ] No hard crash

---

### Test Case: EH-002 - Invalid Form Data

**Preconditions**: On a form (e.g., Create User)  
**Steps**:

1. Enter invalid email: "notanemail"
2. Try submit

**Expected Results**:

- [ ] Error: "Invalid email format"
- [ ] Field highlighted in red
- [ ] Focus on field
- [ ] Submit blocked

---

### Test Case: EH-003 - Session Expired Error

**Preconditions**: Logged in for extended session  
**Steps**:

1. Clear localStorage (manually delete JWT token)
2. Click any button requiring auth
3. Wait for response

**Expected Results**:

- [ ] Modal: "Session expired. Please login again."
- [ ] Button: "Login"
- [ ] Redirect to login page
- [ ] No data displayed

---

### Test Case: EH-004 - Permission Denied

**Preconditions**: Non-admin user on admin page  
**Steps**:

1. Try navigating to admin page via URL: `/admin`
2. OR Try accessing admin feature

**Expected Results**:

- [ ] Toast: "You don't have access to this feature"
- [ ] Redirect to Dashboard
- [ ] Admin tab not visible in menu

---

### Test Case: EH-005 - Data Not Found

**Preconditions**: Try viewing deleted resource  
**Steps**:

1. Get ID of a user
2. Delete the user
3. Refresh page or navigate to user details URL

**Expected Results**:

- [ ] Error message: "User not found"
- [ ] Empty state view with message
- [ ] "Go Back" button
- [ ] No crash

---

### Test Case: EH-006 - Conflicting Data

**Preconditions**: Create company with duplicate symbol  
**Steps**:

1. Add Company 1: Symbol = "NIFRA"
2. Try to add Company 2: Symbol = "NIFRA"
3. Click Create

**Expected Results**:

- [ ] Error: "Symbol already exists"
- [ ] Modal stays open
- [ ] Form not cleared
- [ ] Can retry with different symbol

---

### Test Case: EH-007 - Unsaved Changes Warning

**Preconditions**: Edit form with changes  
**Steps**:

1. Open edit modal for user
2. Change username
3. Click browser back or click different tab
4. No Save clicked

**Expected Results**:

- [ ] Modal: "You have unsaved changes. Leave without saving?"
- [ ] Buttons: "Stay", "Leave"
- [ ] Click "Leave" → Navigate away, changes lost
- [ ] Click "Stay" → Return to form

---

### Test Case: EH-008 - Large Data Set Handling

**Preconditions**: Report with 10,000+ transactions  
**Steps**:

1. Generate report for full year with large portfolio
2. Monitor load time
3. Check memory usage

**Expected Results**:

- [ ] Page loads within 5 seconds
- [ ] Pagination or virtualization prevents lag
- [ ] Can filter/sort without significant delay
- [ ] Memory doesn't spike excessively

---

### Test Case: EH-009 - XSS Prevention

**Preconditions**: Create company with malicious data  
**Steps**:

1. Add Company with Name: `<script>alert('XSS')</script>`
2. Close modal
3. Observe company list

**Expected Results**:

- [ ] Company name displayed as text, NOT executable
- [ ] No alert popup
- [ ] Shows: "<script>alert('XSS')</script>" as literal text
- [ ] Sanitized in display

---

### Test Case: EH-010 - SQL Injection Prevention

**Preconditions**: Search field  
**Steps**:

1. In company search: Type: `" OR "1"="1`
2. Press Enter or search

**Expected Results**:

- [ ] Treated as literal search string
- [ ] Looks for company named: `" OR "1"="1`
- [ ] No special behavior
- [ ] Protected by parameterized queries (Prisma)

---

## PERFORMANCE & LOAD TESTS

### Test Case: PF-001 - Page Load Time

**Preconditions**: Measure initial load  
**Steps**:

1. Clear cache (Ctrl+Shift+Delete)
2. Load http://localhost:1420
3. Measure time to first paint (DevTools Performance tab)
4. Measure time to interactive

**Expected Results**:

- [ ] First Paint: < 2 seconds
- [ ] Time to Interactive: < 4 seconds
- [ ] Content visible within 1 second

---

### Test Case: PF-002 - Tab Navigation Load Time

**Preconditions**: On Dashboard  
**Steps**:

1. Click "Portfolio" tab
2. Measure time to content load

**Expected Results**:

- [ ] Content loads within 2 seconds
- [ ] No layout shift
- [ ] Loading skeleton visible during load

---

### Test Case: PF-003 - Large Report Generation

**Preconditions**: Generate comprehensive report  
**Steps**:

1. Generate Pivot Table Report for 5 years
2. With 10,000+ transactions
3. Monitor time and memory

**Expected Results**:

- [ ] Generation time: < 10 seconds
- [ ] Report interactive (can filter, sort)
- [ ] Memory usage stable

---

### Test Case: PF-004 - Multiple Users Concurrent

**Preconditions**: Load testing setup  
**Steps**:

1. Simulate 50 concurrent users
2. Each performing different actions
3. Monitor server response times
4. Check error rates

**Expected Results**:

- [ ] 99% requests complete < 500ms
- [ ] Error rate < 1%
- [ ] Server stays up
- [ ] Database responsive

---

### Test Case: PF-005 - Mobile Responsiveness

**Preconditions**: DevTools mobile emulation  
**Steps**:

1. Emulate iPhone 12 (390×844)
2. Test all major pages
3. Test all forms

**Expected Results**:

- [ ] All content visible (no horizontal scroll)
- [ ] Buttons large enough to tap (44×44px minimum)
- [ ] Forms single column and usable
- [ ] Navigation accessible (hamburger menu if needed)

---

### Test Case: PF-006 - Tablet Responsiveness

**Preconditions**: DevTools tablet emulation  
**Steps**:

1. Emulate iPad (768×1024)
2. Test layouts
3. Check sidebar visibility

**Expected Results**:

- [ ] All content visible
- [ ] Optimal use of wider screen
- [ ] Sidebar visible (if applicable)
- [ ] Tables not scrolling excessively

---

## TEST EXECUTION CHECKLIST

### Daily Manual Testing

- [ ] Login/Logout workflows
- [ ] Dashboard content
- [ ] Navigation tabs
- [ ] One CRUD operation per major module

### Weekly Manual Testing

- [ ] All CRUD operations (Create/Read/Update/Delete)
- [ ] All filtering and search
- [ ] Error handling scenarios
- [ ] Permission-based feature access

### Monthly Manual Testing

- [ ] Complete end-to-end workflows
- [ ] Cross-browser compatibility (Chrome, Firefox, Safari)
- [ ] Mobile and tablet responsiveness
- [ ] Performance baselines
- [ ] Data integrity (GL reconciliation)

### Before Release

- [ ] All test cases passing
- [ ] Regression testing on changed features
- [ ] Performance testing with load
- [ ] Security testing (XSS, SQL injection)
- [ ] UAT approval from business

---

## NOTES FOR TESTERS

- **Save Test Results**: Document pass/fail for each test case
- **Screenshot Evidence**: Capture screens for failed tests
- **Video Recording**: Record complex workflows for documentation
- **Issue Tracking**: Log bugs with:
  - Steps to reproduce
  - Expected vs actual result
  - Browser/device info
  - Screenshots/video
- **Environment**: Note any backend/database issues
- **Performance**: Monitor Network tab for slow API calls

---

**Total Test Cases**: 100+  
**Estimated Manual Testing Time**: 40-50 hours  
**Recommended Testing Cycle**: Weekly

---

This manual testing guide provides comprehensive coverage of all user interaction paths in the application.
