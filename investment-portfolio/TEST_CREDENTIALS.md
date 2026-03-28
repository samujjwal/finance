# Test Credentials & Tab Testing Guide

## Quick Start: Enable All Tabs

Edit [src/App.tsx](src/App.tsx#L77) and change:

```typescript
// CHANGE THESE to true to enable all test tabs
const showLegacyCapitalMarketTabs = true;   // Enables: Portfolio, Transactions, Reports, Companies, Accounting, Nepal
const showLegacyAdminTabs = true;            // Enables: Admin, Root Actions
```

The dev server will auto-reload. You'll now see all tabs.

---

## Test User Accounts

First, seed the database with test data:
```bash
cd /home/samujjwal/Developments/finance/investment-portfolio/server
npx prisma db seed
```

Then use these credentials to login:

| Role | Username | Password | Tabs Visible | Permissions |
|------|----------|----------|--------------|-------------|
| **System Admin** | `admin` | `Admin@123` | ALL | Full access, all modules |
| **Portfolio Manager** | `portmgr` | `PortMgr@123` | Dashboard, Portfolio, Transactions, Reports, Companies, Accounting | Create/modify/export |
| **Trader** | `trader` | `Trader@123` | Dashboard, Portfolio, Transactions, Reports, Companies | Create/modify transactions |
| **Viewer** | `viewer` | `Viewer@123` | Dashboard, Portfolio, Transactions, Reports, Companies | Read-only access |

---

## Testing Each Tab

### 1. Dashboard
- **Who can see**: All users
- **Test**: Login with any account, verify dashboard loads
- **Expected**: Metrics, charts, quick actions visible

### 2. Portfolio Tab  
- **Who can see**: Admin, PortMgr, Trader, Viewer
- **Test with**: `portmgr` / `PortMgr@123`
- **Actions**: View holdings, create portfolio entry (admin only)

### 3. Transactions Tab
- **Who can see**: Admin, PortMgr, Trader, Viewer
- **Test with**: `trader` / `Trader@123`
- **Actions**: Create transaction, view history, approve (admin only)

### 4. Reports Tab
- **Who can see**: Admin, PortMgr, Trader, Viewer  
- **Test with**: `portmgr` / `PortMgr@123`
- **Actions**: View reports, export to CSV, schedule (manager+ only)

### 5. Companies Tab
- **Who can see**: Admin, PortMgr, Trader, Viewer
- **Test with**: `trader` / `Trader@123`
- **Actions**: View company list, create company (manager+ only)

### 6. Accounting Tab
- **Who can see**: Admin, Portfolio Manager
- **Test with**: `portmgr` / `PortMgr@123`
- **Actions**: Journal entries, ledger, reconciliation

### 7. Nepal/Tax Tab
- **Who can see**: Admin, Portfolio Manager (if enabled)
- **Test with**: `admin` / `Admin@123`
- **Actions**: Tax compliance setup, reporting

### 8. Admin Tab
- **Who can see**: Admin ONLY
- **Test with**: `admin` / `Admin@123` (tab visible)
- **Test with**: `trader` / `Trader@123` (tab NOT visible)
- **Actions**: User management, role assignment, system settings

### 9. Org Settings
- **Who can see**: All (if orgId configured)
- **Test with**: Any account after login
- **Actions**: Organization profile, module management

---

## Tab Visibility Logic (in code)

```typescript
// src/App.tsx lines 77-82
const showLegacyCapitalMarketTabs = false;  // SET TO true FOR TESTING
const showLegacyAdminTabs = false;          // SET TO true FOR TESTING

const canUseInvestment = showLegacyCapitalMarketTabs && hasModule('investment');
const canUseAccounting = showLegacyCapitalMarketTabs && hasModule('accounting');
const canUseNepal = showLegacyCapitalMarketTabs && canUseAccounting;
const canUseAdmin = showLegacyAdminTabs && isAdminUser;  // Also checks if user is admin
const canUseMaintenance = showLegacyAdminTabs && isRootUser;
```

---

## Run Automated Tests

```bash
# Run Playwright tests with all enabled tabs
npx playwright test

# Run specific test file
npx playwright test tests/e2e/complete-application-coverage.spec.ts

# Run in headed mode (see browser)
npx playwright test --headed

# Run specific test
npx playwright test -g "Portfolio"

# View test report
npx playwright show-report
```

---

## When Done: Disable All Tabs

Revert to production mode with Dashboard-only:

```typescript
// src/App.tsx lines 77-82
const showLegacyCapitalMarketTabs = false;  // Set back to false
const showLegacyAdminTabs = false;          // Set back to false
```

---

## Troubleshooting

**"Tab not visible"**
- Confirm feature flag is `true` in App.tsx
- Check user role in database: `npx prisma studio` → look at Users → userRoles
- Verify module is enabled in Organization

**"Can't login"**
- Reset database: `cd server && npx prisma migrate reset`
- Verify users table has test users: `npx prisma studio`
- Check API is running on port 3000

**"Test data missing"**
```bash
cd /home/samujjwal/Developments/finance/investment-portfolio/server
npx prisma db seed
```

---

## Tab Availability Quick Reference

| Tab | Admin | PortMgr | Trader | Viewer | Feature Flag |
|-----|-------|---------|--------|--------|--------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | Always on |
| Portfolio | ✅ | ✅ | ✅ | ✅ | `showLegacyCapitalMarketTabs` |
| Transactions | ✅ | ✅ | ✅ | ✅ | `showLegacyCapitalMarketTabs` |
| Reports | ✅ | ✅ | ✅ | ✅ | `showLegacyCapitalMarketTabs` |
| Companies | ✅ | ✅ | ✅ | ✅ | `showLegacyCapitalMarketTabs` |
| Accounting | ✅ | ✅ | ❌ | ❌ | `showLegacyCapitalMarketTabs` |
| Nepal/Tax | ✅ | ✅ | ❌ | ❌ | `showLegacyCapitalMarketTabs` |
| Admin | ✅ | ❌ | ❌ | ❌ | `showLegacyAdminTabs` + isAdminUser |
| Root Actions | ✅ (root only) | ❌ | ❌ | ❌ | `showLegacyAdminTabs` + isRootUser |
| Org Settings | ✅ | ✅ | ✅ | ✅ | Always on (if orgId) |
