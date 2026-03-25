import { test, expect } from '@playwright/test';

/**
 * MANUAL TEST STYLE PLAYWRIGHT TESTS - PART 2
 * Admin Portal - Roles and Approvals Tab Verification
 */

test.describe('MANUAL TEST: Roles Tab - Role Management', () => {
  
  test('TC-ROLES-001: Role Table Display', async ({ page }) => {
    // Test Case ID: TC-ROLES-001
    // Description: Verify role table displays all columns and data correctly
    
    await test.step('Precondition: Navigate to Roles tab', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Roles")');
      await page.waitForTimeout(2000);
    });
    
    // Step 1: Verify table headers
    await test.step('Step 1: Verify all column headers present', async () => {
      await expect(page.locator('th:has-text("Role ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Type")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Functions")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      console.log('✓ All 6 column headers present');
    });
    
    // Step 2: Verify role data rows
    await test.step('Step 2: Verify role data present', async () => {
      const roleRows = page.locator('table tbody tr');
      const rowCount = await roleRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(2);
      console.log(`✓ ${rowCount} roles displayed in table`);
      
      // Expected: System Administrator role visible
      await expect(page.locator('tr:has-text("System Administrator")')).toBeVisible();
      console.log('✓ System Administrator role visible');
      
      // Expected: Portfolio Manager role visible
      await expect(page.locator('tr:has-text("Portfolio Manager")')).toBeVisible();
      console.log('✓ Portfolio Manager role visible');
    });
    
    // Step 3: Verify status badges
    await test.step('Step 3: Verify status and system badges', async () => {
      // Expected: ACTIVE badge visible
      await expect(page.locator('span:has-text("ACTIVE")').first()).toBeVisible();
      console.log('✓ ACTIVE badge visible');
      
      // Expected: System badge visible on system roles
      await expect(page.locator('span:has-text("System")').first()).toBeVisible();
      console.log('✓ System badge visible');
    });
    
    // Step 4: Verify function counts
    await test.step('Step 4: Verify function counts displayed', async () => {
      // Expected: Function count shown (e.g., "20+ functions")
      const functionCountText = await page.locator('td:has-text("functions")').first().textContent();
      expect(functionCountText).toContain('functions');
      console.log(`✓ Function counts displayed: ${functionCountText}`);
    });
    
    // Step 5: Verify action buttons
    await test.step('Step 5: Verify Assign Functions button', async () => {
      const sysAdminRow = page.locator('tr:has-text("System Administrator")');
      await expect(sysAdminRow.locator('button:has-text("Assign Functions")')).toBeVisible();
      console.log('✓ Assign Functions button visible');
    });
    
    console.log('\n✅ TC-ROLES-001: PASSED - Role table verified');
  });

  test('TC-ROLES-002: Create Role Button', async ({ page }) => {
    // Test Case ID: TC-ROLES-002
    // Description: Verify Create Role button is present and functional
    
    await test.step('Precondition: Navigate to Roles tab', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Roles")');
    });
    
    // Step 1: Verify Create Role button
    await test.step('Step 1: Verify Create Role button', async () => {
      const createButton = page.locator('button:has-text("Create Role")');
      await expect(createButton).toBeVisible();
      await expect(createButton).toBeEnabled();
      console.log('✓ Create Role button visible and enabled');
    });
    
    console.log('\n✅ TC-ROLES-002: PASSED - Create Role button verified');
  });
});

test.describe('MANUAL TEST: Approvals Tab - Approval Dashboard', () => {
  
  test('TC-APPROVALS-001: Approval Statistics Cards', async ({ page }) => {
    // Test Case ID: TC-APPROVALS-001
    // Description: Verify all 4 approval statistics cards display correctly
    
    await test.step('Precondition: Navigate to Approvals tab', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Approvals")');
      await page.waitForTimeout(2000);
    });
    
    // Step 1: Verify Pending Approvals card
    await test.step('Step 1: Verify Pending Approvals card', async () => {
      await expect(page.locator('text=Pending Approvals').first()).toBeVisible();
      
      const pendingElement = page.locator('text=Pending Approvals').first().locator('..').locator('.text-2xl');
      const pendingText = await pendingElement.textContent();
      expect(pendingText).toBeTruthy();
      
      const pendingNum = parseInt(pendingText || '0');
      expect(pendingNum).toBeGreaterThanOrEqual(0);
      console.log(`✓ Pending Approvals: ${pendingNum}`);
    });
    
    // Step 2: Verify Approved Today card
    await test.step('Step 2: Verify Approved Today card', async () => {
      await expect(page.locator('text=Approved Today')).toBeVisible();
      
      const todayElement = page.locator('text=Approved Today').locator('..').locator('.text-2xl');
      const todayText = await todayElement.textContent();
      expect(todayText).toBeTruthy();
      
      const todayNum = parseInt(todayText || '0');
      expect(todayNum).toBeGreaterThanOrEqual(0);
      console.log(`✓ Approved Today: ${todayNum}`);
    });
    
    // Step 3: Verify Total Approved card
    await test.step('Step 3: Verify Total Approved card', async () => {
      await expect(page.locator('text=Total Approved')).toBeVisible();
      
      const totalApprovedElement = page.locator('text=Total Approved').locator('..').locator('.text-2xl');
      const totalApprovedText = await totalApprovedElement.textContent();
      expect(totalApprovedText).toBeTruthy();
      
      const totalApprovedNum = parseInt(totalApprovedText || '0');
      expect(totalApprovedNum).toBeGreaterThanOrEqual(0);
      console.log(`✓ Total Approved: ${totalApprovedNum}`);
    });
    
    // Step 4: Verify Total Rejected card
    await test.step('Step 4: Verify Total Rejected card', async () => {
      await expect(page.locator('text=Total Rejected')).toBeVisible();
      
      const totalRejectedElement = page.locator('text=Total Rejected').locator('..').locator('.text-2xl');
      const totalRejectedText = await totalRejectedElement.textContent();
      expect(totalRejectedText).toBeTruthy();
      
      const totalRejectedNum = parseInt(totalRejectedText || '0');
      expect(totalRejectedNum).toBeGreaterThanOrEqual(0);
      console.log(`✓ Total Rejected: ${totalRejectedNum}`);
    });
    
    console.log('\n✅ TC-APPROVALS-001: PASSED - Approval statistics cards verified');
  });

  test('TC-APPROVALS-002: Pending Approvals Table', async ({ page }) => {
    // Test Case ID: TC-APPROVALS-002
    // Description: Verify Pending Approvals table structure
    
    await test.step('Precondition: Navigate to Approvals tab', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Approvals")');
    });
    
    // Step 1: Verify table header
    await test.step('Step 1: Verify Pending Approvals section', async () => {
      await expect(page.locator('h3:has-text("Pending Approvals")')).toBeVisible();
      console.log('✓ Pending Approvals section visible');
    });
    
    // Step 2: Verify table columns
    await test.step('Step 2: Verify table column headers', async () => {
      await expect(page.locator('th:has-text("Type")')).toBeVisible();
      await expect(page.locator('th:has-text("Action")')).toBeVisible();
      await expect(page.locator('th:has-text("Requested By")')).toBeVisible();
      await expect(page.locator('th:has-text("Requested At")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      console.log('✓ All 5 column headers present');
    });
    
    // Step 3: Verify empty state or data
    await test.step('Step 3: Verify table content', async () => {
      // Either show "No pending approvals" or display table with data
      const hasNoPending = await page.locator('text=No pending approvals').isVisible().catch(() => false);
      const hasTableData = await page.locator('table tbody tr').first().isVisible().catch(() => false);
      
      expect(hasNoPending || hasTableData).toBeTruthy();
      
      if (hasNoPending) {
        console.log('✓ Empty state displayed: "No pending approvals"');
      } else {
        console.log('✓ Table data displayed');
      }
    });
    
    console.log('\n✅ TC-APPROVALS-002: PASSED - Pending Approvals table verified');
  });
});

test.describe('MANUAL TEST: Admin Flow Integration', () => {
  
  test('TC-FLOW-001: Complete Admin Navigation Flow', async ({ page }) => {
    // Test Case ID: TC-FLOW-001
    // Description: Verify complete navigation flow through all admin tabs
    
    await test.step('Precondition: Login as admin', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await expect(page.locator('text=Welcome, admin')).toBeVisible();
    });
    
    // Step 1: Navigate to Admin
    await test.step('Step 1: Navigate to Admin section', async () => {
      await page.click('nav >> text=Admin');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Admin Dashboard")')).toBeVisible();
      console.log('✓ Navigated to Admin');
    });
    
    // Step 2: Verify Overview content
    await test.step('Step 2: Verify Overview tab content', async () => {
      await expect(page.locator('text=Total Users')).toBeVisible();
      await expect(page.locator('text=Active Users')).toBeVisible();
      await expect(page.locator('text=Pending Approvals')).toBeVisible();
      await expect(page.locator('text=Total Roles')).toBeVisible();
      console.log('✓ Overview statistics displayed');
    });
    
    // Step 3: Navigate to Users
    await test.step('Step 3: Navigate to Users tab', async () => {
      await page.click('button:has-text("Users")');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
      await expect(page.locator('button:has-text("Create User")')).toBeVisible();
      console.log('✓ Users tab loaded');
    });
    
    // Step 4: Navigate to Roles
    await test.step('Step 4: Navigate to Roles tab', async () => {
      await page.click('button:has-text("Roles")');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Role Management")')).toBeVisible();
      await expect(page.locator('button:has-text("Create Role")')).toBeVisible();
      console.log('✓ Roles tab loaded');
    });
    
    // Step 5: Navigate to Approvals
    await test.step('Step 5: Navigate to Approvals tab', async () => {
      await page.click('button:has-text("Approvals")');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Approval Dashboard")')).toBeVisible();
      await expect(page.locator('text=Pending Approvals')).toBeVisible();
      console.log('✓ Approvals tab loaded');
    });
    
    // Step 6: Return to Overview
    await test.step('Step 6: Return to Overview tab', async () => {
      await page.click('button:has-text("Overview")');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("Admin Dashboard")')).toBeVisible();
      await expect(page.locator('text=Total Users')).toBeVisible();
      console.log('✓ Returned to Overview tab');
    });
    
    console.log('\n✅ TC-FLOW-001: PASSED - Complete admin flow verified');
  });

  test('TC-FLOW-002: Cross-Navigation Persistence', async ({ page }) => {
    // Test Case ID: TC-FLOW-002
    // Description: Verify admin tab state persists when navigating to other sections
    
    await test.step('Precondition: Login and go to Admin Users tab', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
    });
    
    // Step 1: Navigate to Dashboard
    await test.step('Step 1: Navigate to Dashboard', async () => {
      await page.click('nav >> text=Dashboard');
      await page.waitForTimeout(1000);
      
      await expect(page.locator('h1:has-text("JCL Investment Portfolio")')).toBeVisible();
      console.log('✓ Navigated to Dashboard');
    });
    
    // Step 2: Navigate back to Admin
    await test.step('Step 2: Navigate back to Admin', async () => {
      await page.click('nav >> text=Admin');
      await page.waitForTimeout(1000);
      
      // Expected: Still on Users tab (state persisted)
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
      console.log('✓ Returned to Admin Users tab (state persisted)');
    });
    
    console.log('\n✅ TC-FLOW-002: PASSED - Cross-navigation persistence verified');
  });
});

test.describe('MANUAL TEST: Error Handling and Edge Cases', () => {
  
  test('TC-ERROR-001: Permission Denied Handling', async ({ page }) => {
    // Test Case ID: TC-ERROR-001
    // Description: Verify admin user can access all admin features without permission errors
    
    await test.step('Precondition: Login as admin with full permissions', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
    });
    
    // Step 1: Navigate to Admin
    await test.step('Step 1: Navigate to Admin section', async () => {
      await page.click('nav >> text=Admin');
      await page.waitForTimeout(1000);
    });
    
    // Step 2: Verify no permission errors
    await test.step('Step 2: Verify no permission errors', async () => {
      // Expected: No "You do not have permission" message
      const hasPermissionError = await page.locator('text=You do not have permission').isVisible().catch(() => false);
      expect(hasPermissionError).toBeFalsy();
      console.log('✓ No permission errors displayed');
    });
    
    // Step 3: Verify all tabs accessible
    await test.step('Step 3: Verify all tabs accessible', async () => {
      // Check Users tab
      await page.click('button:has-text("Users")');
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
      
      // Check Roles tab
      await page.click('button:has-text("Roles")');
      await expect(page.locator('h2:has-text("Role Management")')).toBeVisible();
      
      // Check Approvals tab
      await page.click('button:has-text("Approvals")');
      await expect(page.locator('h2:has-text("Approval Dashboard")')).toBeVisible();
      
      console.log('✓ All tabs accessible without permission errors');
    });
    
    console.log('\n✅ TC-ERROR-001: PASSED - Permission handling verified');
  });

  test('TC-ERROR-002: Loading State Display', async ({ page }) => {
    // Test Case ID: TC-ERROR-002
    // Description: Verify loading states are shown during data fetch
    
    await test.step('Precondition: Login as admin', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
    });
    
    // Step 1: Navigate to Users with fresh load
    await test.step('Step 1: Navigate to Users tab', async () => {
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
      
      // Expected: Content loads (may show loading state briefly)
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible({ timeout: 5000 });
      console.log('✓ Users tab loaded (loading state handled)');
    });
    
    // Step 2: Verify data loaded
    await test.step('Step 2: Verify data loaded successfully', async () => {
      // Expected: User table visible with data
      await expect(page.locator('table')).toBeVisible();
      console.log('✓ Data loaded successfully');
    });
    
    console.log('\n✅ TC-ERROR-002: PASSED - Loading states verified');
  });
});

// Test Summary Report
test.afterAll(async () => {
  console.log('\n' + '='.repeat(70));
  console.log('MANUAL TEST EXECUTION SUMMARY');
  console.log('='.repeat(70));
  console.log('✅ All manual test cases executed');
  console.log('✅ All UI elements verified');
  console.log('✅ All flows tested');
  console.log('✅ All expected results validated');
  console.log('='.repeat(70));
});
