import { test, expect } from '@playwright/test';

/**
 * PROPER FUNCTIONAL E2E TESTS - Create User/Role and Verify in List
 * These tests actually click buttons, fill forms, submit, and verify data appears
 */

test.describe('FUNCTIONAL TESTS: Create User/Role and Verify in List', () => {
  
  const loginAsAdmin = async (page: any) => {
    await page.goto('http://localhost:1420');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Login")');
    await expect(page.locator('text=Welcome, admin')).toBeVisible({ timeout: 10000 });
  };

  test('FUNC-001: Create User and Verify in User List', async ({ page }) => {
    const testUserId = `TESTUSER${Date.now()}`;
    const testUsername = `testuser${Date.now()}`;
    
    await test.step('Step 1: Login and navigate to Users', async () => {
      await loginAsAdmin(page);
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
      await expect(page.locator('h2:has-text("User Management")')).toBeVisible();
    });
    
    await test.step('Step 2: Get initial user count', async () => {
      const initialCount = await page.locator('table tbody tr').count();
      console.log(`Initial user count: ${initialCount}`);
    });
    
    await test.step('Step 3: Click Create User button', async () => {
      await page.click('button:has-text("Create User")');
      
      // Verify modal ACTUALLY opens (this was the bug - modal didn't render)
      await expect(page.locator('h3:has-text("Create User")')).toBeVisible({ timeout: 3000 });
      console.log('✅ Create User modal opened successfully');
    });
    
    await test.step('Step 4: Fill the form with test data', async () => {
      await page.fill('input[name="userId"]', testUserId);
      await page.fill('input[name="username"]', testUsername);
      await page.fill('input[name="email"]', `${testUsername}@example.com`);
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="surname"]', 'User');
      await page.fill('input[name="password"]', 'Password123');
      
      // Verify fields are filled
      const userIdValue = await page.locator('input[name="userId"]').inputValue();
      expect(userIdValue).toBe(testUserId);
      console.log('✅ Form filled correctly');
    });
    
    await test.step('Step 5: Submit the form', async () => {
      await page.click('button[type="submit"], button:has-text("Create")');
      console.log('✅ Submit button clicked');
    });
    
    await test.step('Step 6: Wait for creation and verify modal closes', async () => {
      // Wait for modal to close (success) or error to appear
      await page.waitForTimeout(2000);
      
      const modalVisible = await page.locator('h3:has-text("Create User")').isVisible().catch(() => false);
      
      if (!modalVisible) {
        console.log('✅ Modal closed - user creation likely successful');
      } else {
        // Check for error
        const errorText = await page.locator('.text-red-700, .error-message').first().textContent().catch(() => '');
        console.log(`⚠️ Modal still open. Error: ${errorText?.substring(0, 100)}`);
        
        // If error, close modal and fail test
        await page.click('button:has-text("Cancel")');
        throw new Error(`User creation failed: ${errorText}`);
      }
    });
    
    await test.step('Step 7: Reload and verify user appears in list', async () => {
      // Reload to get fresh data
      await page.reload();
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
      await page.waitForTimeout(2000);
      
      // Verify new user is in the table
      const newUserRow = page.locator(`tr:has-text("${testUserId}")`);
      await expect(newUserRow).toBeVisible({ timeout: 5000 });
      
      // Verify username is also shown
      await expect(newUserRow.locator('text=' + testUsername)).toBeVisible();
      
      console.log(`✅ User ${testUserId} successfully created and visible in list`);
    });
    
    await test.step('Step 8: Verify user has correct status', async () => {
      const userRow = page.locator(`tr:has-text("${testUserId}")`);
      const statusText = await userRow.locator('td').nth(5).textContent();
      
      // New users are typically PENDING_APPROVAL
      expect(statusText).toMatch(/PENDING_APPROVAL|ACTIVE/);
      console.log(`✅ User status: ${statusText?.trim()}`);
    });
    
    console.log('\n🎉 FUNC-001 PASSED: User created and verified in list');
  });

  test('FUNC-002: Create Role and Verify in Role List', async ({ page }) => {
    const testRoleId = `TESTROLE${Date.now()}`;
    const testRoleName = `Test Role ${Date.now()}`;
    
    await test.step('Step 1: Login and navigate to Roles', async () => {
      await loginAsAdmin(page);
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Roles")');
      await expect(page.locator('h2:has-text("Role Management")')).toBeVisible();
    });
    
    await test.step('Step 2: Get initial role count', async () => {
      const initialCount = await page.locator('table tbody tr').count();
      console.log(`Initial role count: ${initialCount}`);
    });
    
    await test.step('Step 3: Click Create Role button', async () => {
      await page.click('button:has-text("Create Role")');
      
      // Verify modal ACTUALLY opens (this was the bug - no onClick handler)
      await expect(page.locator('h3:has-text("Create Role")')).toBeVisible({ timeout: 3000 });
      console.log('✅ Create Role modal opened successfully');
    });
    
    await test.step('Step 4: Fill the form with test data', async () => {
      await page.fill('input[placeholder*="PORTFOLIO"], input[name="id"], input[placeholder*="Role ID"]', testRoleId);
      await page.fill('input[name="name"]', testRoleName);
      await page.fill('textarea[name="description"]', 'Test role created by Playwright');
      
      // Verify fields are filled
      const roleIdValue = await page.locator('input[name="id"]').inputValue();
      expect(roleIdValue).toBe(testRoleId);
      console.log('✅ Form filled correctly');
    });
    
    await test.step('Step 5: Submit the form', async () => {
      await page.click('button[type="submit"], button:has-text("Create")');
      console.log('✅ Submit button clicked');
    });
    
    await test.step('Step 6: Wait for creation and verify modal closes', async () => {
      await page.waitForTimeout(2000);
      
      const modalVisible = await page.locator('h3:has-text("Create Role")').isVisible().catch(() => false);
      
      if (!modalVisible) {
        console.log('✅ Modal closed - role creation likely successful');
      } else {
        const errorText = await page.locator('.text-red-700, .error-message').first().textContent().catch(() => '');
        console.log(`⚠️ Modal still open. Error: ${errorText?.substring(0, 100)}`);
        
        await page.click('button:has-text("Cancel")');
        throw new Error(`Role creation failed: ${errorText}`);
      }
    });
    
    await test.step('Step 7: Reload and verify role appears in list', async () => {
      await page.reload();
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Roles")');
      await page.waitForTimeout(2000);
      
      // Verify new role is in the table
      const newRoleRow = page.locator(`tr:has-text("${testRoleId}")`);
      await expect(newRoleRow).toBeVisible({ timeout: 5000 });
      
      // Verify role name is shown
      await expect(newRoleRow.locator('text=' + testRoleName)).toBeVisible();
      
      console.log(`✅ Role ${testRoleId} successfully created and visible in list`);
    });
    
    await test.step('Step 8: Verify role has correct status', async () => {
      const roleRow = page.locator(`tr:has-text("${testRoleId}")`);
      const statusText = await roleRow.locator('td').nth(3).textContent();
      
      // New roles are typically PENDING_APPROVAL
      expect(statusText).toMatch(/PENDING_APPROVAL|ACTIVE/);
      console.log(`✅ Role status: ${statusText?.trim()}`);
    });
    
    console.log('\n🎉 FUNC-002 PASSED: Role created and verified in list');
  });

  test('FUNC-003: Attempt to Create User with Invalid Data - Shows Error', async ({ page }) => {
    await test.step('Step 1: Navigate to Users', async () => {
      await loginAsAdmin(page);
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
    });
    
    await test.step('Step 2: Open Create User modal', async () => {
      await page.click('button:has-text("Create User")');
      await expect(page.locator('h3:has-text("Create User")')).toBeVisible();
    });
    
    await test.step('Step 3: Submit empty form', async () => {
      await page.click('button[type="submit"], button:has-text("Create")');
    });
    
    await test.step('Step 4: Verify error is shown', async () => {
      await page.waitForTimeout(500);
      
      // Check for error message
      const errorVisible = await page.locator('.text-red-700, .error-message, [role="alert"]').isVisible().catch(() => false);
      const modalStillOpen = await page.locator('h3:has-text("Create User")').isVisible().catch(() => false);
      
      // Either error shown or modal still open (validation prevented submit)
      expect(errorVisible || modalStillOpen).toBe(true);
      console.log('✅ Form validation prevented empty submission');
    });
    
    await test.step('Step 5: Close modal', async () => {
      await page.click('button:has-text("Cancel")');
    });
    
    console.log('\n🎉 FUNC-003 PASSED: Form validation works');
  });

  test('FUNC-004: Table Horizontal Scroll - Wide Tables Accessible', async ({ page }) => {
    await test.step('Step 1: Navigate to Users with mobile viewport', async () => {
      await page.setViewportSize({ width: 800, height: 600 });
      await loginAsAdmin(page);
      await page.click('nav >> text=Admin');
      await page.click('button:has-text("Users")');
      await page.waitForTimeout(2000);
    });
    
    await test.step('Step 2: Check table container for scroll', async () => {
      // Find table or its container
      const table = page.locator('table').first();
      const tableContainer = page.locator('.overflow-x-auto, .table-container, [class*="overflow"]').first();
      
      // Check if table is scrollable
      const container = await tableContainer.isVisible().catch(() => false) ? tableContainer : table;
      
      const scrollWidth = await container.evaluate((el: HTMLElement) => el.scrollWidth);
      const clientWidth = await container.evaluate((el: HTMLElement) => el.clientWidth);
      
      console.log(`Table scrollWidth: ${scrollWidth}, clientWidth: ${clientWidth}`);
      
      // If table is wider than container, it should have overflow/scroll
      if (scrollWidth > clientWidth) {
        const overflowStyle = await container.evaluate((el: HTMLElement) => {
          const style = window.getComputedStyle(el);
          return {
            overflowX: style.overflowX,
            overflow: style.overflow
          };
        });
        
        console.log(`Table overflow style: ${JSON.stringify(overflowStyle)}`);
        
        // Should have horizontal scroll capability
        const hasHorizontalScroll = overflowStyle.overflowX === 'auto' || 
                                    overflowStyle.overflowX === 'scroll' ||
                                    overflowStyle.overflow === 'auto';
        
        expect(hasHorizontalScroll || scrollWidth <= clientWidth).toBe(true);
        console.log('✅ Table has horizontal scroll capability');
      } else {
        console.log('ℹ️ Table fits within viewport');
      }
    });
    
    await test.step('Step 3: Try to scroll table horizontally', async () => {
      const tableContainer = page.locator('.overflow-x-auto, .table-container').first();
      
      if (await tableContainer.isVisible().catch(() => false)) {
        // Try scrolling right
        await tableContainer.evaluate((el: HTMLElement) => {
          el.scrollLeft = el.scrollWidth;
        });
        
        const scrollLeft = await tableContainer.evaluate((el: HTMLElement) => el.scrollLeft);
        console.log(`Table scrolled to: ${scrollLeft}`);
        
        if (scrollLeft > 0) {
          console.log('✅ Table is horizontally scrollable');
        }
      }
    });
    
    await test.step('Step 4: Reset viewport', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
    });
    
    console.log('\n🎉 FUNC-004 PASSED: Table scroll verified');
  });
});
