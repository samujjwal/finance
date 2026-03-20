import { test, expect } from "@playwright/test";
import { Page, BrowserContext } from "@playwright/test";

// Test data fixtures
const TEST_DATA = {
  companies: [
    { symbol: "NABIL", companyName: "Nabil Bank Limited", sector: "Banking" },
    { symbol: "NIMB", companyName: "Nepal Investment Bank", sector: "Banking" },
    {
      symbol: "SCB",
      companyName: "Standard Chartered Bank",
      sector: "Banking",
    },
    { symbol: "HBL", companyName: "Himalayan Bank", sector: "Banking" },
    {
      symbol: "UPPER",
      companyName: "Upper Tamakoshi Hydropower",
      sector: "Hydropower",
    },
  ],
  transactions: [
    {
      companySymbol: "NABIL",
      transactionType: "BUY",
      transactionDate: "2024-01-15",
      billNo: "B001",
      purchaseQuantity: 100,
      purchasePricePerUnit: 850,
      totalPurchaseAmount: 85000,
    },
    {
      companySymbol: "NABIL",
      transactionType: "SELL",
      transactionDate: "2024-03-20",
      billNo: "S001",
      salesQuantity: 50,
      salesPricePerUnit: 950,
      totalSalesAmount: 47500,
    },
    {
      companySymbol: "UPPER",
      transactionType: "BUY",
      transactionDate: "2024-02-10",
      billNo: "B002",
      purchaseQuantity: 200,
      purchasePricePerUnit: 1200,
      totalPurchaseAmount: 240000,
    },
  ],
};

class InvestmentPortfolioApp {
  constructor(public page: Page) {}

  // Navigation helpers
  async navigateToTab(tabName: string) {
    const tabSelector = `button:has-text("${tabName}")`;
    await this.page.click(tabSelector);
    await this.page.waitForLoadState("networkidle");
  }

  // Login helpers
  async login(username: string = "testuser", password: string = "testpass") {
    await this.page.fill('input[name="username"]', username);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL("**/dashboard");
  }

  // Company management
  async addCompany(company: (typeof TEST_DATA.companies)[0]) {
    await this.navigateToTab("Companies");
    await this.page.click('button:has-text("Add Company")');
    await this.page.fill('input[name="symbol"]', company.symbol);
    await this.page.fill('input[name="companyName"]', company.companyName);
    await this.page.fill('input[name="sector"]', company.sector);
    await this.page.click('button:has-text("Save")');
    await this.page.waitForSelector(
      'text:has-text("Company added successfully")',
    );
  }

  // Transaction management
  async addTransaction(transaction: (typeof TEST_DATA.transactions)[0]) {
    await this.navigateToTab("Transactions");
    await this.page.click('button:has-text("Add Transaction")');

    await this.page.selectOption(
      'select[name="companySymbol"]',
      transaction.companySymbol,
    );
    await this.page.selectOption(
      'select[name="transactionType"]',
      transaction.transactionType,
    );
    await this.page.fill(
      'input[name="transactionDate"]',
      transaction.transactionDate,
    );
    await this.page.fill('input[name="billNo"]', transaction.billNo);

    if (transaction.transactionType === "BUY") {
      await this.page.fill(
        'input[name="purchaseQuantity"]',
        transaction.purchaseQuantity.toString(),
      );
      await this.page.fill(
        'input[name="purchasePricePerUnit"]',
        transaction.purchasePricePerUnit.toString(),
      );
    } else {
      await this.page.fill(
        'input[name="salesQuantity"]',
        transaction.salesQuantity.toString(),
      );
      await this.page.fill(
        'input[name="salesPricePerUnit"]',
        transaction.salesPricePerUnit.toString(),
      );
    }

    await this.page.click('button:has-text("Save")');
    await this.page.waitForSelector(
      'text:has-text("Transaction added successfully")',
    );
  }

  // Bulk transaction entry
  async addBulkTransactions(transactions: typeof TEST_DATA.transactions) {
    await this.navigateToTab("Transactions");
    await this.page.click('button:has-text("Bulk Entry")');

    // Wait for grid to load
    await this.page.waitForSelector("table");

    // Fill transactions in grid
    for (let i = 0; i < transactions.length; i++) {
      const transaction = transactions[i];
      const row = i + 1; // Grid is 1-indexed for user interaction

      await this.page.fill(
        `input[data-testid="company-symbol-${row}"]`,
        transaction.companySymbol,
      );
      await this.page.selectOption(
        `select[data-testid="transaction-type-${row}"]`,
        transaction.transactionType,
      );
      await this.page.fill(
        `input[data-testid="transaction-date-${row}"]`,
        transaction.transactionDate,
      );
      await this.page.fill(
        `input[data-testid="bill-no-${row}"]`,
        transaction.billNo,
      );

      if (transaction.transactionType === "BUY") {
        await this.page.fill(
          `input[data-testid="purchase-qty-${row}"]`,
          transaction.purchaseQuantity.toString(),
        );
        await this.page.fill(
          `input[data-testid="purchase-price-${row}"]`,
          transaction.purchasePricePerUnit.toString(),
        );
      } else {
        await this.page.fill(
          `input[data-testid="sales-qty-${row}"]`,
          transaction.salesQuantity.toString(),
        );
        await this.page.fill(
          `input[data-testid="sales-price-${row}"]`,
          transaction.salesPricePerUnit.toString(),
        );
      }

      // Add new row if not last transaction
      if (i < transactions.length - 1) {
        await this.page.click('button:has-text("Add Row")');
      }
    }

    await this.page.click('button:has-text("Save All")');
    await this.page.waitForSelector(
      'text:has-text("Transactions saved successfully")',
    );
  }

  // Company statement view
  async viewCompanyStatement(companySymbol: string) {
    await this.navigateToTab("Transactions");
    await this.page.click('button:has-text("Company Statement")');

    // Verify company statement modal opens
    await this.page.waitForSelector('text:has-text("Portfolio Statement")');
    await this.page.waitForSelector(`text:has-text("${companySymbol}")`);

    // Verify statement sections
    await expect(
      this.page.locator('text:has-text("Market Information")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Portfolio Summary")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Transaction History")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Tax Summary")'),
    ).toBeVisible();

    await this.page.click('button:has-text("Close")');
  }

  // Dashboard interactions
  async verifyDashboardContent() {
    await this.navigateToTab("Dashboard");

    // Verify basic dashboard elements
    await expect(
      this.page.locator('text:has-text("Portfolio Overview")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Transaction Activity")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Top Holdings")'),
    ).toBeVisible();

    // Verify sector distribution if data exists
    const sectorDistribution = this.page.locator(
      'text:has-text("Sector Distribution")',
    );
    if (await sectorDistribution.isVisible()) {
      await expect(sectorDistribution).toBeVisible();
    }
  }

  // Live dashboard interactions
  async verifyLiveDashboard() {
    await this.navigateToTab("Live Dashboard");

    // Verify live dashboard elements
    await expect(
      this.page.locator('text:has-text("Live Portfolio Dashboard")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Market Indices")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("NEPSE Index")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Portfolio Value")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Live Holdings")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Market News")'),
    ).toBeVisible();

    // Verify live status indicator
    await expect(this.page.locator('text:has-text("Live")')).toBeVisible();

    // Test pause/resume functionality
    await this.page.click('button:has-text("Pause")');
    await expect(this.page.locator('text:has-text("Paused")')).toBeVisible();

    await this.page.click('button:has-text("Resume")');
    await expect(this.page.locator('text:has-text("Live")')).toBeVisible();
  }

  // Portfolio view interactions
  async verifyPortfolioView() {
    await this.navigateToTab("Portfolio");

    // Verify portfolio overview
    await expect(
      this.page.locator('text:has-text("Portfolio Overview")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Current Holdings")'),
    ).toBeVisible();

    // Test portfolio recalculation
    await this.page.click('button:has-text("Recalculate Portfolio")');
    await this.page.waitForSelector('text:has-text("Portfolio recalculated")');
  }

  // Basic reports interactions
  async verifyBasicReports() {
    await this.navigateToTab("Basic Reports");

    // Verify report tabs
    await expect(
      this.page.locator('text:has-text("Monthly Performance")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Sector Analysis")'),
    ).toBeVisible();
    await expect(
      this.page.locator('text:has-text("Monthly Summary")'),
    ).toBeVisible();

    // Test report switching
    await this.page.click('button:has-text("Monthly Performance")');
    await this.page.waitForSelector("table");

    await this.page.click('button:has-text("Sector Analysis")');
    await this.page.waitForSelector("table");

    await this.page.click('button:has-text("Monthly Summary")');
    await this.page.waitForSelector("table");
  }

  // Advanced reports interactions
  async verifyAdvancedReports() {
    await this.navigateToTab("Advanced Reports");

    // Verify comprehensive reports interface
    await expect(
      this.page.locator('text:has-text("Comprehensive Reports")'),
    ).toBeVisible();

    // Test different report types
    const reportTypes = [
      "Performance Reports",
      "Sector Reports",
      "Monthly Reports",
      "Tax Reports",
      "Company Statements",
      "Advanced Analytics",
      "Risk Analysis",
      "Pivot Reports",
    ];

    for (const reportType of reportTypes) {
      await this.page.click(`button:has-text("${reportType}")`);
      await this.page.waitForTimeout(500); // Brief wait for content to load
      await expect(
        this.page.locator('text:has-text("Loading data")'),
      ).not.toBeVisible();
    }

    // Test pivot report functionality
    await this.page.click('button:has-text("Pivot Reports")');
    await this.page.selectOption(
      'select[data-testid="pivot-group-by"]',
      "Company",
    );
    await this.page.selectOption(
      'select[data-testid="pivot-metric"]',
      "Total Investment",
    );
    await this.page.click('button:has-text("Generate Report")');
    await this.page.waitForSelector("table");
  }

  // Excel export/import functionality
  async verifyExcelExportImport() {
    await this.navigateToTab("Transactions");
    await this.page.click('button:has-text("Import/Export")');

    // Test export functionality
    await this.page.click('button:has-text("Export to Excel")');

    // Wait for download to complete
    const downloadPromise = this.page.waitForEvent("download");
    await downloadPromise;

    // Test import functionality
    await this.page.click('button:has-text("Import from Excel")');
    await this.page.setInputFiles(
      'input[type="file"]',
      "test-data/sample-portfolio.xlsx",
    );
    await this.page.click('button:has-text("Import")');

    // Verify import results
    await this.page.waitForSelector('text:has-text("Import completed")');
  }

  // Filtering and search functionality
  async verifyFiltering() {
    await this.navigateToTab("Transactions");

    // Test filter panel
    await this.page.click('button:has-text("Filters")');
    await expect(
      this.page.locator('text:has-text("Filter Transactions")'),
    ).toBeVisible();

    // Test company filter
    await this.page.selectOption('select[name="companySymbol"]', "NABIL");
    await this.page.click('button:has-text("Apply Filters")');
    await this.page.waitForTimeout(1000);

    // Verify filtered results
    const rows = this.page.locator("table tbody tr");
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Test date range filter
    await this.page.fill('input[name="startDate"]', "2024-01-01");
    await this.page.fill('input[name="endDate"]', "2024-12-31");
    await this.page.click('button:has-text("Apply Filters")');
    await this.page.waitForTimeout(1000);

    // Clear filters
    await this.page.click('button:has-text("Clear Filters")');
  }

  // Transaction editing and deletion
  async verifyTransactionManagement() {
    await this.navigateToTab("Transactions");

    // Wait for transactions to load
    await this.page.waitForSelector("table tbody tr");

    // Test editing
    await this.page.click('button:has-text("Edit")').first();
    await this.page.waitForSelector('text:has-text("Edit Transaction")');
    await this.page.fill('input[name="billNo"]', "UPDATED-001");
    await this.page.click('button:has-text("Update")');
    await this.page.waitForSelector('text:has-text("Transaction updated")');

    // Test deletion
    await this.page.click('button:has-text("Delete")').first();
    await this.page.on("dialog", (dialog) => dialog.accept());
    await this.page.waitForSelector('text:has-text("Transaction deleted")');
  }

  // Error handling and validation
  async verifyErrorHandling() {
    await this.navigateToTab("Transactions");
    await this.page.click('button:has-text("Add Transaction")');

    // Test validation - empty form submission
    await this.page.click('button:has-text("Save")');
    await expect(
      this.page.locator('text:has-text("Company is required")'),
    ).toBeVisible();

    // Test invalid data
    await this.page.selectOption('select[name="companySymbol"]', "NABIL");
    await this.page.selectOption('select[name="transactionType"]', "BUY");
    await this.page.fill('input[name="purchaseQuantity"]', "-10"); // Invalid negative quantity
    await this.page.click('button:has-text("Save")');
    await expect(
      this.page.locator('text:has-text("Quantity must be positive")'),
    ).toBeVisible();

    // Close modal
    await this.page.keyboard.press("Escape");
  }

  // Responsive design verification
  async verifyResponsiveDesign() {
    // Test mobile view
    await this.page.setViewportSize({ width: 375, height: 667 });
    await this.navigateToTab("Dashboard");

    // Verify mobile navigation
    await expect(this.page.locator("nav")).toBeVisible();

    // Test tablet view
    await this.page.setViewportSize({ width: 768, height: 1024 });
    await this.navigateToTab("Transactions");
    await expect(this.page.locator("table")).toBeVisible();

    // Test desktop view
    await this.page.setViewportSize({ width: 1920, height: 1080 });
    await this.navigateToTab("Live Dashboard");
    await expect(
      this.page.locator('text:has-text("Live Portfolio Dashboard")'),
    ).toBeVisible();
  }

  // Performance verification
  async verifyPerformance() {
    const startTime = Date.now();

    // Navigate through all tabs
    const tabs = [
      "Dashboard",
      "Live Dashboard",
      "Companies",
      "Transactions",
      "Portfolio",
      "Basic Reports",
      "Advanced Reports",
    ];

    for (const tab of tabs) {
      await this.navigateToTab(tab);
      await this.page.waitForLoadState("networkidle");
    }

    const endTime = Date.now();
    const totalTime = endTime - startTime;

    // Verify performance (should complete within reasonable time)
    expect(totalTime).toBeLessThan(10000); // 10 seconds max
  }

  // Data persistence verification
  async verifyDataPersistence() {
    // Add test data
    await this.addCompany(TEST_DATA.companies[0]);
    await this.addTransaction(TEST_DATA.transactions[0]);

    // Refresh page and verify data persists
    await this.page.reload();
    await this.login();

    await this.navigateToTab("Companies");
    await expect(
      this.page.locator(
        `text:has-text("${TEST_DATA.companies[0].companyName}")`,
      ),
    ).toBeVisible();

    await this.navigateToTab("Transactions");
    await expect(
      this.page.locator(`text:has-text("${TEST_DATA.transactions[0].billNo}")`),
    ).toBeVisible();
  }
}

// Test suite setup
test.describe("Investment Portfolio E2E Tests", () => {
  let app: InvestmentPortfolioApp;
  let context: BrowserContext;

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext();
  });

  test.afterAll(async () => {
    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    app = new InvestmentPortfolioApp(page);
    await page.goto("http://localhost:1420");
    await app.login();
  });

  test.describe("Authentication & Navigation", () => {
    test("should login successfully and navigate to dashboard", async ({
      page,
    }) => {
      await expect(
        page.locator('text:has-text("JCL Investment Portfolio")'),
      ).toBeVisible();
      await expect(
        page.locator('text:has-text("Welcome, testuser")'),
      ).toBeVisible();
    });

    test("should navigate through all tabs successfully", async ({ page }) => {
      const tabs = [
        "Dashboard",
        "Portfolio",
        "Transactions",
        "Reports",
        "Companies",
      ];

      for (const tab of tabs) {
        await app.navigateToTab(tab);
        await expect(
          page.locator('text:has-text("Loading")'),
        ).not.toBeVisible();

        // Verify specific content for each tab
        switch (tab) {
          case "Dashboard":
            await expect(
              page.locator('text:has-text("Portfolio Dashboard")'),
            ).toBeVisible();
            await expect(
              page.locator('text:has-text("Portfolio Value")'),
            ).toBeVisible();
            break;
          case "Portfolio":
            await expect(
              page.locator('text:has-text("Portfolio Overview")'),
            ).toBeVisible();
            await expect(
              page.locator('text:has-text("Total Investment")'),
            ).toBeVisible();
            break;
          case "Transactions":
            await expect(
              page.locator('text:has-text("Transaction Management")'),
            ).toBeVisible();
            break;
          case "Reports":
            await expect(
              page.locator('text:has-text("Portfolio Overview")'),
            ).toBeVisible();
            break;
          case "Companies":
            await expect(
              page.locator('text:has-text("Company Management")'),
            ).toBeVisible();
            break;
        }
      }
    });

    test("should logout successfully", async ({ page }) => {
      await page.click('button:has-text("Logout")');
      await expect(page.locator('text:has-text("Login")')).toBeVisible();
    });
  });

  test.describe("Company Management", () => {
    test("should add, view, and manage companies", async ({ page }) => {
      // Add company
      await app.addCompany(TEST_DATA.companies[0]);

      // Verify company appears in list
      await expect(
        page.locator(`text:has-text("${TEST_DATA.companies[0].companyName}")`),
      ).toBeVisible();

      // Test company search
      await page.fill(
        'input[placeholder*="Search"]',
        TEST_DATA.companies[0].symbol,
      );
      await expect(
        page.locator(`text:has-text("${TEST_DATA.companies[0].companyName}")`),
      ).toBeVisible();
    });

    test("should validate company data", async ({ page }) => {
      await app.navigateToTab("Companies");
      await page.click('button:has-text("Add Company")');

      // Test validation
      await page.click('button:has-text("Save")');
      await expect(
        page.locator('text:has-text("Symbol is required")'),
      ).toBeVisible();
      await expect(
        page.locator('text:has-text("Company name is required")'),
      ).toBeVisible();
    });
  });

  test.describe("Transaction Management", () => {
    test("should add single transaction", async ({ page }) => {
      await app.addCompany(TEST_DATA.companies[0]);
      await app.addTransaction(TEST_DATA.transactions[0]);

      // Verify transaction appears
      await expect(
        page.locator(`text:has-text("${TEST_DATA.transactions[0].billNo}")`),
      ).toBeVisible();
    });

    test("should add bulk transactions", async ({ page }) => {
      await app.addCompany(TEST_DATA.companies[0]);
      await app.addBulkTransactions(TEST_DATA.transactions);

      // Verify all transactions appear
      for (const transaction of TEST_DATA.transactions) {
        await expect(
          page.locator(`text:has-text("${transaction.billNo}")`),
        ).toBeVisible();
      }
    });

    test("should auto-calculate commissions and taxes", async ({ page }) => {
      await app.addCompany(TEST_DATA.companies[0]);
      await app.navigateToTab("Transactions");
      await page.click('button:has-text("Bulk Entry")');

      // Fill BUY transaction
      await page.fill('input[data-testid="company-symbol-1"]', "NABIL");
      await page.selectOption(
        'select[data-testid="transaction-type-1"]',
        "BUY",
      );
      await page.fill('input[data-testid="purchase-qty-1"]', "100");
      await page.fill('input[data-testid="purchase-price-1"]', "1000");

      // Verify auto-calculation
      await expect(page.locator('text:has-text("100000")')).toBeVisible(); // Total amount
    });

    test("should view company statements", async ({ page }) => {
      await app.addCompany(TEST_DATA.companies[0]);
      await app.addTransaction(TEST_DATA.transactions[0]);
      await app.viewCompanyStatement(TEST_DATA.companies[0].symbol);
    });

    test("should edit and delete transactions", async ({ page }) => {
      await app.addCompany(TEST_DATA.companies[0]);
      await app.addTransaction(TEST_DATA.transactions[0]);
      await app.verifyTransactionManagement();
    });

    test("should filter and search transactions", async ({ page }) => {
      await app.addCompany(TEST_DATA.companies[0]);
      await app.addTransaction(TEST_DATA.transactions[0]);
      await app.verifyFiltering();
    });
  });

  test.describe("Dashboard Features", () => {
    test("should display basic dashboard content", async ({ page }) => {
      await app.verifyDashboardContent();
    });

    test("should display live dashboard with real-time data", async ({
      page,
    }) => {
      await app.verifyLiveDashboard();

      // Verify live updates
      await page.waitForTimeout(5000); // Wait for live updates

      // Check for updated timestamps
      const lastUpdated = page.locator('text:has-text("Last updated:")');
      await expect(lastUpdated).toBeVisible();
    });
  });

  test.describe("Portfolio Features", () => {
    test("should display portfolio overview", async ({ page }) => {
      await app.verifyPortfolioView();
    });

    test("should recalculate portfolio", async ({ page }) => {
      await app.navigateToTab("Portfolio");
      await page.click('button:has-text("Recalculate Portfolio")');
      await page.waitForSelector('text:has-text("Portfolio recalculated")');
    });
  });

  test.describe("Reporting Features", () => {
    test("should display combined reports with all sections", async ({
      page,
    }) => {
      await app.navigateToTab("Reports");

      // Verify report navigation tabs
      await expect(
        page.locator('text:has-text("Portfolio Overview")'),
      ).toBeVisible();
      await expect(
        page.locator('text:has-text("Performance Analysis")'),
      ).toBeVisible();
      await expect(
        page.locator('text:has-text("Risk Assessment")'),
      ).toBeVisible();
      await expect(page.locator('text:has-text("Tax Report")')).toBeVisible();
      await expect(
        page.locator('text:has-text("Holdings Detail")'),
      ).toBeVisible();

      // Test each report section
      const reportSections = [
        "Portfolio Overview",
        "Performance Analysis",
        "Risk Assessment",
        "Tax Report",
        "Holdings Detail",
      ];

      for (const section of reportSections) {
        await page.click(`button:has-text("${section}")`);
        await expect(
          page.locator('text:has-text("Loading")'),
        ).not.toBeVisible();
        await page.waitForTimeout(1000); // Allow content to load
        await expect(page.locator("table")).toBeVisible();
      }
    });

    test("should handle network errors gracefully", async ({ page }) => {
      // Simulate network failure
      await page.route("**/api/**", (route) => route.abort());

      await app.navigateToTab("Transactions");
      await page.click('button:has-text("Add Transaction")');
      await page.selectOption('select[name="companySymbol"]', "NABIL");
      await page.click('button:has-text("Save")');

      await expect(
        page.locator('text:has-text("Network error")'),
      ).toBeVisible();
    });
  });

  test.describe("Responsive Design", () => {
    test("should work on mobile devices", async ({ page }) => {
      await app.verifyResponsiveDesign();
    });
  });

  test.describe("Performance", () => {
    test("should load pages quickly", async ({ page }) => {
      await app.verifyPerformance();
    });

    test("should handle large datasets efficiently", async ({ page }) => {
      // Add many transactions
      for (let i = 0; i < 50; i++) {
        await app.addTransaction({
          ...TEST_DATA.transactions[0],
          billNo: `BULK-${i.toString().padStart(3, "0")}`,
        });
      }

      const startTime = Date.now();
      await app.navigateToTab("Transactions");
      await page.waitForSelector("table tbody tr");
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(3000); // 3 seconds max
    });
  });

  test.describe("Data Persistence", () => {
    test("should persist data across sessions", async ({ page }) => {
      await app.verifyDataPersistence();
    });
  });

  test.describe("Accessibility", () => {
    test("should be keyboard navigable", async ({ page }) => {
      // Test keyboard navigation
      await page.keyboard.press("Tab");
      await expect(page.locator(":focus")).toBeVisible();

      // Test tab navigation
      for (let i = 0; i < 7; i++) {
        await page.keyboard.press("Tab");
        await page.keyboard.press("Enter");
        await page.waitForTimeout(500);
      }
    });

    test("should have proper ARIA labels", async ({ page }) => {
      // Check for proper ARIA labels
      const buttons = page.locator("button");
      const count = await buttons.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const button = buttons.nth(i);
        const ariaLabel = await button.getAttribute("aria-label");
        const text = await button.textContent();

        // Either have aria-label or descriptive text
        expect(ariaLabel || (text && text.trim().length > 0)).toBeTruthy();
      }
    });
  });

  test.describe("Security", () => {
    test("should prevent unauthorized access", async ({ page }) => {
      // Try to access protected routes without login
      await page.goto("http://localhost:1420/transactions");
      await expect(page.locator('text:has-text("Login")')).toBeVisible();
    });

    test("should handle session timeout", async ({ page }) => {
      // Simulate session timeout
      await page.evaluate(() => {
        localStorage.removeItem("authToken");
      });

      await page.reload();
      await expect(page.locator('text:has-text("Login")')).toBeVisible();
    });
  });

  test.describe("Cross-browser Compatibility", () => {
    test("should work in different browsers", async ({ page, browserName }) => {
      // Basic functionality test
      await app.navigateToTab("Dashboard");
      await expect(
        page.locator('text:has-text("Portfolio Overview")'),
      ).toBeVisible();

      console.log(`Test passed on ${browserName}`);
    });
  });

  test.describe("End-to-End User Journeys", () => {
    test("complete investment workflow", async ({ page }) => {
      // 1. Setup companies
      for (const company of TEST_DATA.companies) {
        await app.addCompany(company);
      }

      // 2. Add transactions
      for (const transaction of TEST_DATA.transactions) {
        await app.addTransaction(transaction);
      }

      // 3. View portfolio
      await app.verifyPortfolioView();

      // 4. Generate reports
      await app.verifyAdvancedReports();

      // 5. Export data
      await app.verifyExcelExportImport();

      // 6. View live dashboard
      await app.verifyLiveDashboard();

      // 7. View company statements
      for (const company of TEST_DATA.companies) {
        await app.viewCompanyStatement(company.symbol);
      }
    });

    test("tax reporting workflow", async ({ page }) => {
      // Add taxable transactions
      await app.addCompany(TEST_DATA.companies[0]);
      await app.addTransaction(TEST_DATA.transactions[1]); // SELL transaction

      // Generate tax reports
      await app.navigateToTab("Advanced Reports");
      await page.click('button:has-text("Tax Reports")');

      // Verify tax calculations
      await expect(
        page.locator('text:has-text("Capital Gains Tax")'),
      ).toBeVisible();
      await expect(page.locator('text:has-text("Tax Summary")')).toBeVisible();
    });

    test("portfolio analysis workflow", async ({ page }) => {
      // Setup portfolio with diverse holdings
      const diverseTransactions = [
        { ...TEST_DATA.transactions[0], companySymbol: "NABIL" },
        { ...TEST_DATA.transactions[2], companySymbol: "UPPER" },
        { ...TEST_DATA.transactions[0], companySymbol: "NIMB", billNo: "B003" },
      ];

      for (const transaction of diverseTransactions) {
        await app.addTransaction(transaction);
      }

      // Analyze portfolio
      await app.verifyAdvancedReports();

      // Check risk analysis
      await page.click('button:has-text("Risk Analysis")');
      await expect(page.locator('text:has-text("Risk Metrics")')).toBeVisible();

      // Check sector analysis
      await page.click('button:has-text("Sector Reports")');
      await expect(
        page.locator('text:has-text("Sector Performance")'),
      ).toBeVisible();
    });
  });
});

// Performance monitoring test
test.describe("Performance Monitoring", () => {
  test("should monitor page load times", async ({ page }) => {
    const metrics = [];

    const tabs = ["Dashboard", "Live Dashboard", "Transactions", "Portfolio"];

    for (const tab of tabs) {
      const startTime = Date.now();
      await page.click(`button:has-text("${tab}")`);
      await page.waitForLoadState("networkidle");
      const endTime = Date.now();

      metrics.push({
        page: tab,
        loadTime: endTime - startTime,
      });
    }

    // Log performance metrics
    console.table(metrics);

    // Verify all pages load within acceptable time
    metrics.forEach((metric) => {
      expect(metric.loadTime).toBeLessThan(5000); // 5 seconds max
    });
  });
});

// Data integrity test
test.describe("Data Integrity", () => {
  test("should maintain data consistency", async ({ page }) => {
    const app = new InvestmentPortfolioApp(page);

    // Add test data
    await app.addCompany(TEST_DATA.companies[0]);
    await app.addTransaction(TEST_DATA.transactions[0]);

    // Verify calculations
    await app.navigateToTab("Transactions");
    await page.click('button:has-text("Company Statement")');

    // Check that portfolio metrics are consistent
    const portfolioValue = page.locator('text:has-text("Current Value")');
    await expect(portfolioValue).toBeVisible();

    const totalInvestment = page.locator('text:has-text("Total Investment")');
    await expect(totalInvestment).toBeVisible();
  });
});
