import { test, expect } from '@playwright/test';

test.describe('Investment Portfolio Application - Full Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:1420');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test.describe('Authentication Flow', () => {
    test('should show login page for unauthenticated users', async ({ page }) => {
      // Should redirect to login page
      await expect(page.locator('h1')).toContainText('JCL Investment Portfolio');
      await expect(page.locator('text=Sign in to access your portfolio')).toBeVisible();
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
      await expect(page.locator('button:has-text("Login")')).toBeVisible();
    });

    test('should login successfully with admin credentials', async ({ page }) => {
      // Fill login form
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');

      // Should redirect to dashboard
      await expect(page.locator('h1')).toContainText('JCL Investment Portfolio');
      await expect(page.locator('text=Welcome, admin')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should login successfully with demo credentials', async ({ page }) => {
      // Fill login form
      await page.fill('input[name="username"]', 'demo');
      await page.fill('input[name="password"]', 'demo123');
      await page.click('button:has-text("Login")');

      // Should redirect to dashboard
      await expect(page.locator('text=Welcome, demo')).toBeVisible();
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      // Fill login form with invalid credentials
      await page.fill('input[name="username"]', 'invalid');
      await page.fill('input[name="password"]', 'invalid');
      await page.click('button:has-text("Login")');

      // Should show error message
      await expect(page.locator('text=Invalid credentials')).toBeVisible();
    });

    test('should logout successfully', async ({ page }) => {
      // Login first
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      
      // Wait for dashboard to load
      await expect(page.locator('text=Welcome, admin')).toBeVisible();

      // Logout
      await page.click('button:has-text("Logout")');

      // Should return to login page
      await expect(page.locator('input[name="username"]')).toBeVisible();
      await expect(page.locator('input[name="password"]')).toBeVisible();
    });
  });

  test.describe('Navigation and Routes', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin for all navigation tests
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await expect(page.locator('text=Welcome, admin')).toBeVisible();
    });

    test('should navigate to all main tabs', async ({ page }) => {
      const tabs = [
        { name: 'Dashboard', expectedContent: 'Portfolio Overview' },
        { name: 'Portfolio', expectedContent: 'Portfolio Holdings' },
        { name: 'Transactions', expectedContent: 'Transactions' },
        { name: 'Reports', expectedContent: 'Reports' },
        { name: 'Companies', expectedContent: 'Companies' },
        { name: 'Admin', expectedContent: 'Admin Dashboard' }
      ];

      for (const tab of tabs) {
        await page.click(`button:has-text("${tab.name}")`);
        
        // Wait for content to load
        await page.waitForTimeout(1000);
        
        // Verify tab is active
        await expect(page.locator(`button:has-text("${tab.name}")`)).toHaveClass(/border-indigo-500/);
        
        // Verify content is loaded (basic check)
        await expect(page.locator('h1, h2, h3').first()).toBeVisible();
      }
    });

    test('should show admin tab only for admin users', async ({ page }) => {
      // Admin user should see Admin tab
      await expect(page.locator('button:has-text("Admin")')).toBeVisible();
    });

    test('should navigate between admin sub-tabs', async ({ page }) => {
      // Navigate to Admin section
      await page.click('button:has-text("Admin")');
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();

      const adminTabs = ['Overview', 'Users', 'Roles', 'Approvals', 'System'];
      
      for (const tab of adminTabs) {
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(500);
        
        // Verify tab is active
        await expect(page.locator(`button:has-text("${tab}")`)).toHaveClass(/border-indigo-500/);
      }
    });
  });

  test.describe('Dashboard Content', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await expect(page.locator('text=Welcome, admin')).toBeVisible();
    });

    test('should display portfolio overview cards', async ({ page }) => {
      await expect(page.locator('text=Portfolio Overview')).toBeVisible();
      await expect(page.locator('text=Total Value')).toBeVisible();
      await expect(page.locator('text=Total Cost')).toBeVisible();
      await expect(page.locator('text=Unrealized P&L')).toBeVisible();
      await expect(page.locator('text=Day Change')).toBeVisible();
    });

    test('should display top performers section', async ({ page }) => {
      await expect(page.locator('text=Top Performers')).toBeVisible();
      // Check for chart or data display
      await expect(page.locator('[class*="chart"], [class*="grid"], [class*="table"]').first()).toBeVisible();
    });

    test('should display sector distribution', async ({ page }) => {
      await expect(page.locator('text=Sector Distribution')).toBeVisible();
      // Check for chart or data visualization
      await expect(page.locator('[class*="chart"], [class*="progress"], [class*="bar"]').first()).toBeVisible();
    });
  });

  test.describe('Transaction Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('button:has-text("Transactions")');
      await page.waitForTimeout(1000);
    });

    test('should display transaction list interface', async ({ page }) => {
      await expect(page.locator('text=Transactions')).toBeVisible();
      // Check for transaction grid or list
      await expect(page.locator('[class*="grid"], [class*="table"], [class*="list"]').first()).toBeVisible();
    });

    test('should show transaction filters', async ({ page }) => {
      // Look for filter controls
      await expect(page.locator('input[placeholder*="Search"], input[placeholder*="Filter"], select').first()).toBeVisible();
    });

    test('should have add transaction button', async ({ page }) => {
      // Look for add/create button
      await expect(page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first()).toBeVisible();
    });
  });

  test.describe('Portfolio Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('button:has-text("Portfolio")');
      await page.waitForTimeout(1000);
    });

    test('should display portfolio holdings', async ({ page }) => {
      await expect(page.locator('text=Portfolio Holdings')).toBeVisible();
      // Check for holdings display
      await expect(page.locator('[class*="holdings"], [class*="positions"], [class*="grid"]').first()).toBeVisible();
    });

    test('should display portfolio charts', async ({ page }) => {
      // Look for chart components
      await expect(page.locator('[class*="chart"], svg, canvas').first()).toBeVisible();
    });

    test('should show portfolio summary', async ({ page }) => {
      await expect(page.locator('text=Summary', text=Overview').first()).toBeVisible();
    });
  });

  test.describe('Reports System', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('button:has-text("Reports")');
      await page.waitForTimeout(1000);
    });

    test('should display reports interface', async ({ page }) => {
      await expect(page.locator('text=Reports')).toBeVisible();
      // Check for report options or interface
      await expect(page.locator('button, select, [class*="report"]').first()).toBeVisible();
    });

    test('should have custom report builder', async ({ page }) => {
      // Look for custom report builder
      await expect(page.locator('text=Custom, Builder, Create').first()).toBeVisible();
    });
  });

  test.describe('Company Management', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('button:has-text("Companies")');
      await page.waitForTimeout(1000);
    });

    test('should display company list', async ({ page }) => {
      await expect(page.locator('text=Companies')).toBeVisible();
      // Check for company list or grid
      await expect(page.locator('[class*="list"], [class*="grid"], [class*="table"]').first()).toBeVisible();
    });

    test('should have add company functionality', async ({ page }) => {
      await expect(page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New")').first()).toBeVisible();
    });
  });

  test.describe('Admin Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await page.click('button:has-text("Admin")');
      await page.waitForTimeout(1000);
    });

    test('should display admin overview with stats', async ({ page }) => {
      await expect(page.locator('text=Admin Dashboard')).toBeVisible();
      await expect(page.locator('text=Total Users')).toBeVisible();
      await expect(page.locator('text=Active Users')).toBeVisible();
      await expect(page.locator('text=Pending Approvals')).toBeVisible();
      await expect(page.locator('text=Total Roles')).toBeVisible();
    });

    test('should navigate to user management', async ({ page }) => {
      await page.click('button:has-text("Users")');
      await expect(page.locator('text=User Management')).toBeVisible();
      // Check for user list or management interface
      await expect(page.locator('[class*="user"], [class*="management"], [class*="table"]').first()).toBeVisible();
    });

    test('should navigate to role management', async ({ page }) => {
      await page.click('button:has-text("Roles")');
      await expect(page.locator('text=Role Management')).toBeVisible();
      // Check for role management interface
      await expect(page.locator('[class*="role"], [class*="permission"], [class*="management"]').first()).toBeVisible();
    });

    test('should navigate to approval dashboard', async ({ page }) => {
      await page.click('button:has-text("Approvals")');
      await expect(page.locator('text=Approval Dashboard')).toBeVisible();
      // Check for approval interface
      await expect(page.locator('[class*="approval"], [class*="pending"], [class*="workflow"]').first()).toBeVisible();
    });

    test('should show system health status', async ({ page }) => {
      await page.click('button:has-text("Overview")');
      await expect(page.locator('text=System Overview')).toBeVisible();
      await expect(page.locator('text=Backend API')).toBeVisible();
      await expect(page.locator('text=Database')).toBeVisible();
      await expect(page.locator('text=Authentication')).toBeVisible();
    });
  });

  test.describe('Responsive Design', () => {
    test.beforeEach(async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
    });

    test('should be responsive on mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check navigation adapts
      await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
      
      // Check content is still accessible
      await expect(page.locator('text=Portfolio Overview')).toBeVisible();
    });

    test('should be responsive on tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check navigation and content
      await expect(page.locator('button:has-text("Dashboard")')).toBeVisible();
      await expect(page.locator('text=Portfolio Overview')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate offline condition
      await page.context().setOffline(true);
      
      // Try to interact with the app
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      
      // Should show appropriate error or loading state
      await page.waitForTimeout(2000);
      
      // Restore connection
      await page.context().setOffline(false);
    });

    test('should handle 404 routes', async ({ page }) => {
      // Navigate to non-existent route
      await page.goto('http://localhost:1420/non-existent-page');
      
      // Should handle gracefully (either show 404 or redirect)
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Performance', () => {
    test('should load pages within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:1420');
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await expect(page.locator('text=Welcome, admin')).toBeVisible();
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('should navigate between tabs quickly', async ({ page }) => {
      await page.fill('input[name="username"]', 'admin');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button:has-text("Login")');
      await expect(page.locator('text=Welcome, admin')).toBeVisible();

      const tabs = ['Portfolio', 'Transactions', 'Reports', 'Companies'];
      
      for (const tab of tabs) {
        const startTime = Date.now();
        await page.click(`button:has-text("${tab}")`);
        await page.waitForTimeout(500);
        const navigationTime = Date.now() - startTime;
        
        // Should navigate within 2 seconds
        expect(navigationTime).toBeLessThan(2000);
      }
    });
  });
});
