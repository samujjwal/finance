import { test, expect } from '@playwright/test';

/**
 * MANUAL TEST STYLE PLAYWRIGHT TESTS
 * Admin Portal - Complete Flow Verification
 * 
 * Each test follows manual test case format:
 * - Test Case ID
 * - Description
 * - Preconditions
 * - Test Steps with Expected Results
 * - Actual Result Verification
 * - Pass/Fail Status
 */

test.describe('MANUAL TEST: Admin Portal - Navigation & Access', () => {
  
  test('TC-ADMIN-001: Admin Tab Navigation', async ({ page }) => {
    // Test Case ID: TC-ADMIN-001
    // Description: Verify Admin tab is visible and clickable in main navigation
    // Preconditions: User is logged in as admin
    
    // Step 1: Navigate to application
    await test.step('Step 1: Navigate to application', async () => {
      await page.goto('http://localhost:1420');
      await page.waitForLoadState('networkidle');
      console.log('✓ Navigated to application');
    });
    
    // Step 2: Login as admin
    await test.step('Step 2: Login as admin', async () => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      
      // Expected: Dashboard loads with welcome message
      await expect(page.locator('text=Welcome, admin')).toBeVisible({ timeout: 10000 });
      console.log('✓ Logged in successfully');
    });
    
    // Step 3: Verify Admin tab is visible in navigation
    await test.step('Step 3: Verify Admin tab visibility', async () => {
      const adminNavLink = page.locator('nav >> text=Admin');
      
      // Expected: Admin link is visible
      await expect(adminNavLink).toBeVisible();
      console.log('✓ Admin tab is visible in navigation');
      
      // Expected: Admin link is enabled and clickable
      await expect(adminNavLink).toBeEnabled();
      console.log('✓ Admin tab is enabled');
    });
    
    // Step 4: Click Admin tab
    await test.step('Step 4: Click Admin tab', async () => {
      await page.click('nav >> text=Admin');
      
      // Expected: URL changes to /admin
      await expect(page).toHaveURL(/.*\/admin/, { timeout: 5000 });
      console.log('✓ URL changed to /admin');
      
      // Expected: Admin Dashboard heading is visible
      await expect(page.locator('h2:has-text("Admin Dashboard")')).toBeVisible({ timeout: 5000 });
      console.log('✓ Admin Dashboard loaded');
    });
    
    // Step 5: Verify all subtabs are visible
    await test.step('Step 5: Verify all subtabs visible', async () => {
      // Wait for permissions to load
      await page.waitForTimeout(1000);
      
      // Expected: Overview tab button visible
      await expect(page.locator('button:has-text("Overview")')).toBeVisible();
      console.log('✓ Overview tab visible');
      
      // Expected: Users tab button visible
      await expect(page.locator('button:has-text("Users")')).toBeVisible();
      console.log('✓ Users tab visible');
      
      // Expected: Roles tab button visible
      await expect(page.locator('button:has-text("Roles")')).toBeVisible();
      console.log('✓ Roles tab visible');
      
      // Expected: Approvals tab button visible
      await expect(page.locator('button:has-text("Approvals")')).toBeVisible();
      console.log('✓ Approvals tab visible');
    });
    
    console.log('\n✅ TC-ADMIN-001: PASSED - Admin Tab Navigation verified');
  });

  test('TC-ADMIN-002: Tab Switching Functionality', async ({ page }) => {
    // Test Case ID: TC-ADMIN-002
    // Description: Verify switching between admin subtabs works correctly
    
    await test.step('Precondition: Login and navigate to Admin', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.waitForTimeout(1000);
    });
    
    // Step 1: Verify starting on Overview tab
    await test.step('Step 1: Verify Overview tab active', async () => {
      // Expected: Overview content visible
      await expect(page.locator('h2:has-text("Admin Dashboard")')).toBeVisible();
      console.log('✓ Started on Overview tab');
    });
    
    // Step 2: Click Users tab
    await test.step('Step 2: Switch to Users tab', async () => {
      await page.click('button:has-text("Users")');
      
      // Expected: Users content loads within 2 seconds
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible({ timeout: 2000 });
      console.log('✓ Switched to Users tab');
      
      // Expected: Create User button visible
      await expect(page.locator('button:has-text("Create User")')).toBeVisible();
      console.log('✓ Users tab content loaded');
    });
    
    // Step 3: Click Roles tab
    await test.step('Step 3: Switch to Roles tab', async () => {
      await page.click('button:has-text("Roles")');
      
      // Expected: Roles content loads
      await expect(page.locator('h2:has-text("Role Management")')).toBeVisible({ timeout: 2000 });
      console.log('✓ Switched to Roles tab');
      
      // Expected: Create Role button visible
      await expect(page.locator('button:has-text("Create Role")')).toBeVisible();
      console.log('✓ Roles tab content loaded');
    });
    
    // Step 4: Click Approvals tab
    await test.step('Step 4: Switch to Approvals tab', async () => {
      await page.click('button:has-text("Approvals")');
      
      // Expected: Approvals content loads
      await expect(page.locator('h2:has-text("Approval Dashboard")')).toBeVisible({ timeout: 2000 });
      console.log('✓ Switched to Approvals tab');
      
      // Expected: Statistics cards visible
      await expect(page.locator('text=Pending Approvals')).toBeVisible();
      console.log('✓ Approvals tab content loaded');
    });
    
    // Step 5: Return to Overview tab
    await test.step('Step 5: Return to Overview tab', async () => {
      await page.click('button:has-text("Overview")');
      
      // Expected: Overview content loads
      await expect(page.locator('h2:has-text("Admin Dashboard")')).toBeVisible({ timeout: 2000 });
      console.log('✓ Returned to Overview tab');
      
      // Expected: Statistics cards visible
      await expect(page.locator('text=Total Users')).toBeVisible();
      console.log('✓ Overview tab content loaded');
    });
    
    console.log('\n✅ TC-ADMIN-002: PASSED - Tab Switching verified');
  });
});

test.describe('MANUAL TEST: Overview Tab Content Verification', () => {
  
  test('TC-OVERVIEW-001: Statistics Cards Display', async ({ page }) => {
    // Test Case ID: TC-OVERVIEW-001
    // Description: Verify all 4 statistics cards display correct data
    
    await test.step('Precondition: Login and navigate to Admin Overview', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.waitForTimeout(2000); // Wait for data to load
    });
    
    // Step 1: Verify Total Users card
    await test.step('Step 1: Verify Total Users card', async () => {
      // Expected: Total Users label visible
      await expect(page.locator('text=Total Users')).toBeVisible();
      
      // Expected: Number is displayed (not empty)
      const totalUsersElement = page.locator('text=Total Users').locator('..').locator('.text-2xl');
      const totalUsersText = await totalUsersElement.textContent();
      expect(totalUsersText).toBeTruthy();
      
      // Expected: Number is 3 (based on seeded data)
      const totalUsersNum = parseInt(totalUsersText || '0');
      expect(totalUsersNum).toBeGreaterThanOrEqual(3);
      console.log(`✓ Total Users: ${totalUsersNum}`);
    });
    
    // Step 2: Verify Active Users card
    await test.step('Step 2: Verify Active Users card', async () => {
      await expect(page.locator('text=Active Users')).toBeVisible();
      
      const activeUsersElement = page.locator('text=Active Users').locator('..').locator('.text-2xl');
      const activeUsersText = await activeUsersElement.textContent();
      expect(activeUsersText).toBeTruthy();
      
      const activeUsersNum = parseInt(activeUsersText || '0');
      expect(activeUsersNum).toBeGreaterThanOrEqual(3);
      console.log(`✓ Active Users: ${activeUsersNum}`);
    });
    
    // Step 3: Verify Pending Approvals card
    await test.step('Step 3: Verify Pending Approvals card', async () => {
      await expect(page.locator('text=Pending Approvals')).toBeVisible();
      
      const pendingElement = page.locator('text=Pending Approvals').locator('..').locator('.text-2xl');
      const pendingText = await pendingElement.textContent();
      expect(pendingText).toBeTruthy();
      
      const pendingNum = parseInt(pendingText || '0');
      expect(pendingNum).toBeGreaterThanOrEqual(0);
      console.log(`✓ Pending Approvals: ${pendingNum}`);
    });
    
    // Step 4: Verify Total Roles card
    await test.step('Step 4: Verify Total Roles card', async () => {
      await expect(page.locator('text=Total Roles')).toBeVisible();
      
      const rolesElement = page.locator('text=Total Roles').locator('..').locator('.text-2xl');
      const rolesText = await rolesElement.textContent();
      expect(rolesText).toBeTruthy();
      
      const rolesNum = parseInt(rolesText || '0');
      expect(rolesNum).toBeGreaterThanOrEqual(4);
      console.log(`✓ Total Roles: ${rolesNum}`);
    });
    
    console.log('\n✅ TC-OVERVIEW-001: PASSED - Statistics cards verified');
  });

  test('TC-OVERVIEW-002: Quick Actions Section', async ({ page }) => {
    // Test Case ID: TC-OVERVIEW-002
    // Description: Verify Quick Actions section is visible and functional
    
    await test.step('Precondition: Navigate to Admin Overview', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
    });
    
    // Step 1: Verify Quick Actions header
    await test.step('Step 1: Verify Quick Actions section', async () => {
      // Expected: Quick Actions heading visible
      await expect(page.locator('text=Quick Actions')).toBeVisible();
      console.log('✓ Quick Actions section visible');
    });
    
    // Step 2: Verify System Overview section
    await test.step('Step 2: Verify System Overview section', async () => {
      // Expected: System Overview heading visible
      await expect(page.locator('text=System Overview')).toBeVisible();
      
      // Expected: System Health visible
      await expect(page.locator('text=System Health')).toBeVisible();
      console.log('✓ System Overview section visible');
    });
    
    // Step 3: Verify Recent Activity section
    await test.step('Step 3: Verify Recent Activity section', async () => {
      // Expected: Recent Activity heading visible
      await expect(page.locator('text=Recent Activity')).toBeVisible();
      console.log('✓ Recent Activity section visible');
    });
    
    console.log('\n✅ TC-OVERVIEW-002: PASSED - Quick Actions section verified');
  });
});

test.describe('MANUAL TEST: Users Tab - User Management', () => {
  
  test('TC-USERS-001: User Table Display', async ({ page }) => {
    // Test Case ID: TC-USERS-001
    // Description: Verify user table displays all columns and data correctly
    
    await test.step('Precondition: Navigate to Users tab', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
      await page.waitForTimeout(2000); // Wait for data
    });
    
    // Step 1: Verify table headers
    await test.step('Step 1: Verify all column headers present', async () => {
      // Expected: All 7 column headers visible
      await expect(page.locator('th:has-text("User ID")')).toBeVisible();
      await expect(page.locator('th:has-text("Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Email")')).toBeVisible();
      await expect(page.locator('th:has-text("Branch")')).toBeVisible();
      await expect(page.locator('th:has-text("Type")')).toBeVisible();
      await expect(page.locator('th:has-text("Status")')).toBeVisible();
      await expect(page.locator('th:has-text("Actions")')).toBeVisible();
      console.log('✓ All 7 column headers present');
    });
    
    // Step 2: Verify user data rows
    await test.step('Step 2: Verify user data present', async () => {
      // Expected: At least 3 users displayed (root, demo, admin)
      const userRows = page.locator('table tbody tr');
      const rowCount = await userRows.count();
      expect(rowCount).toBeGreaterThanOrEqual(3);
      console.log(`✓ ${rowCount} users displayed in table`);
      
      // Expected: Admin user visible
      await expect(page.locator('tr:has-text("admin")')).toBeVisible();
      console.log('✓ Admin user row visible');
      
      // Expected: Demo user visible
      await expect(page.locator('tr:has-text("demo")')).toBeVisible();
      console.log('✓ Demo user row visible');
    });
    
    // Step 3: Verify status badges
    await test.step('Step 3: Verify status badges', async () => {
      // Expected: ACTIVE badge visible (green)
      await expect(page.locator('span:has-text("ACTIVE")').first()).toBeVisible();
      console.log('✓ Status badges visible');
    });
    
    // Step 4: Verify action buttons in rows
    await test.step('Step 4: Verify action buttons', async () => {
      // Expected: Edit button visible on user row
      const demoRow = page.locator('tr:has-text("demo")');
      await expect(demoRow.locator('button:has-text("Edit")')).toBeVisible();
      console.log('✓ Edit button visible');
      
      // Expected: Suspend button visible on user row
      await expect(demoRow.locator('button:has-text("Suspend")')).toBeVisible();
      console.log('✓ Suspend button visible');
    });
    
    console.log('\n✅ TC-USERS-001: PASSED - User table verified');
  });

  test('TC-USERS-002: Create User Button and Modal', async ({ page }) => {
    // Test Case ID: TC-USERS-002
    // Description: Verify Create User button opens modal with all form fields
    
    await test.step('Precondition: Navigate to Users tab', async () => {
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
    });
    
    // Step 1: Verify Create User button
    await test.step('Step 1: Verify Create User button', async () => {
      const createButton = page.locator('button:has-text("Create User")');
      
      // Expected: Button visible
      await expect(createButton).toBeVisible();
      console.log('✓ Create User button visible');
      
      // Expected: Button enabled
      await expect(createButton).toBeEnabled();
      console.log('✓ Create User button enabled');
    });
    
    // Step 2: Click Create User button
    await test.step('Step 2: Click Create User button', async () => {
      await page.click('button:has-text("Create User")');
      
      // Expected: Modal opens with "Create User" header
      await expect(page.locator('h3:has-text("Create User")')).toBeVisible({ timeout: 3000 });
      console.log('✓ Create User modal opened');
    });
    
    // Step 3: Verify all form fields present
    await test.step('Step 3: Verify form fields', async () => {
      // Expected: User ID field
      await expect(page.locator('input[name="userId"]')).toBeVisible();
      console.log('✓ User ID field present');
      
      // Expected: Username field
      await expect(page.locator('input[name="username"]')).toBeVisible();
      console.log('✓ Username field present');
      
      // Expected: Email field
      await expect(page.locator('input[name="email"]')).toBeVisible();
      console.log('✓ Email field present');
      
      // Expected: First Name field
      await expect(page.locator('input[name="firstName"]')).toBeVisible();
      console.log('✓ First Name field present');
      
      // Expected: Surname field
      await expect(page.locator('input[name="surname"]')).toBeVisible();
      console.log('✓ Surname field present');
      
      // Expected: Password field
      await expect(page.locator('input[name="password"]')).toBeVisible();
      console.log('✓ Password field present');
      
      // Expected: Branch dropdown
      await expect(page.locator('select[name="branchId"]')).toBeVisible();
      console.log('✓ Branch dropdown present');
      
      // Expected: User Type dropdown
      await expect(page.locator('select[name="userTypeId"]')).toBeVisible();
      console.log('✓ User Type dropdown present');
    });
    
    // Step 4: Verify modal buttons
    await test.step('Step 4: Verify modal buttons', async () => {
      // Expected: Create button
      await expect(page.locator('button:has-text("Create")')).toBeVisible();
      console.log('✓ Create button present');
      
      // Expected: Cancel button
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
      console.log('✓ Cancel button present');
    });
    
    // Step 5: Close modal using Cancel
    await test.step('Step 5: Close modal', async () => {
      await page.click('button:has-text("Cancel")');
      
      // Expected: Modal closes
      await expect(page.locator('h3:has-text("Create User")')).not.toBeVisible();
      console.log('✓ Modal closed successfully');
      
      // Expected: Back to User Management
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
      console.log('✓ Returned to User Management');
    });
    
    console.log('\n✅ TC-USERS-002: PASSED - Create User modal verified');
  });
});
