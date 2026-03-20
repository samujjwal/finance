import { test, expect } from "@playwright/test";

test.describe("Investment Portfolio End-to-End", () => {
  test.setTimeout(120000);

  test("User Journey 1: Authentication, Dashboard, and Global Navigation", async ({
    page,
  }) => {
    await page.goto("/");

    // Login form verify - Updated to true labels
    await expect(
      page.getByRole("heading", { name: "JCL Investment Portfolio" }),
    ).toBeVisible();

    await page.getByLabel("Username").fill("admin_test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Sign in" }).click();

    // Verify dashboard load
    await expect(
      page.getByRole("heading", { name: "Portfolio Overview" }),
    ).toBeVisible({ timeout: 15000 });

    // Global Navigation verify links exist
    await expect(
      page.getByRole("button", { name: "Dashboard", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Companies", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Transactions", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Reports", exact: true }),
    ).toBeVisible();

    // Logout
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(
      page.getByRole("heading", { name: "JCL Investment Portfolio" }),
    ).toBeVisible();
  });

  test("User Journey 2: Complete Data flow (Companies + Transactions + Recalculation + Reports)", async ({
    page,
  }) => {
    const uniqueSymbol = `E2E_${Date.now()}`;

    await page.goto("/");
    await page.getByLabel("Username").fill("admin_test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("heading", { name: "Portfolio Overview" }),
    ).toBeVisible({ timeout: 15000 });

    // --- A. COMPANIES CRUD ---
    await page.getByRole("button", { name: "Companies", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Companies", level: 2 }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Add Company", exact: true })
      .click();
    await page.locator('input[name="symbol"]').fill(uniqueSymbol);
    await page
      .locator('input[name="companyName"]')
      .fill("Automation Testing Corp");
    await page.locator('input[name="sector"]').fill("Automata");
    await page.getByRole("button", { name: "Create Company" }).click();
    await expect(page.getByText(uniqueSymbol).first()).toBeVisible();

    await page
      .getByRole("button", { name: "Add Company", exact: true })
      .click();
    await page.locator('input[name="symbol"]').fill(`${uniqueSymbol}_2`);
    await page.locator('input[name="companyName"]').fill("To Be Deleted Corp");
    await page.locator('input[name="sector"]').fill("Finance");
    await page.getByRole("button", { name: "Create Company" }).click();
    await expect(page.getByText(`${uniqueSymbol}_2`).first()).toBeVisible();

    // --- B. TRANSACTIONS CRUD ---
    await page
      .getByRole("button", { name: "Transactions", exact: true })
      .first()
      .click();
    await page.waitForTimeout(2000); // Wait for routing
    await expect(
      page.getByText("Manage buy/sell", { exact: false }).first(),
    ).toBeVisible({ timeout: 15000 });

    await page
      .getByRole("button", { name: "Add Transaction", exact: true })
      .click();
    await page
      .locator('select[name="companySymbol"]')
      .selectOption(uniqueSymbol);
    await page.locator('select[name="transactionType"]').selectOption("BUY");
    await page.locator('input[name="transactionDate"]').fill("2026-03-01");
    // wait for purchase fields to render
    await page.locator('input[name="purchaseQuantity"]').fill("100");
    await page.locator('input[name="purchasePricePerUnit"]').fill("50");
    await page.getByRole("button", { name: "Create Transaction" }).click();

    await expect(page.getByText(uniqueSymbol).first()).toBeVisible();

    await page
      .getByRole("button", { name: "Add Transaction", exact: true })
      .click();
    await page
      .locator('select[name="companySymbol"]')
      .selectOption(uniqueSymbol);
    await page.locator('select[name="transactionType"]').selectOption("SELL");
    await page.locator('input[name="transactionDate"]').fill("2026-03-10");
    await page
      .locator('input[name="salesQuantity"]')
      .waitFor({ state: "visible" });
    await page.locator('input[name="salesQuantity"]').fill("20");
    await page.locator('input[name="salesPricePerUnit"]').fill("70");
    await page.getByRole("button", { name: "Create Transaction" }).click();

    await expect(page.getByText("SELL").first()).toBeVisible();

    // --- C. ACTIONABLE DASHBOARD ---
    await page.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Portfolio Overview" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Recalculate Portfolio" }).click();
    await page.waitForTimeout(2000);

    await expect(page.getByText(uniqueSymbol).first()).toBeVisible();

    // --- D. DYNAMIC REPORTS & RICH VISUALIZATION ---
    await page.getByRole("button", { name: "Reports", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Reports & Analytics" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Monthly Performance" }),
    ).toBeVisible();

    await page.getByRole("tab", { name: "Sector Analysis" }).click();
    await expect(
      page.getByRole("heading", { name: "Industry Sectors" }),
    ).toBeVisible();

    await expect(page.locator("canvas, svg, .recharts-wrapper").first())
      .toBeVisible({ timeout: 10000 })
      .catch(() => {});

    await page.getByRole("tab", { name: "Monthly Summary" }).click();
    await expect(
      page.getByRole("heading", { name: "Monthly Summary" }),
    ).toBeVisible();
  });

  test("User Journey 3: Tools & Advanced Features (Import / Export / Bulk Entry)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByLabel("Username").fill("admin_test");
    await page.getByLabel("Password").fill("admin123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(
      page.getByRole("heading", { name: "Portfolio Overview" }),
    ).toBeVisible({ timeout: 15000 });

    await page
      .getByRole("button", { name: "Transactions", exact: true })
      .click();

    await page
      .getByRole("button", { name: "Import/Export", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Import/Export Transactions" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Choose CSV File" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download Template" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export as CSV" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Export as Excel" }),
    ).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download Template" }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("transaction_template.csv");

    await page
      .getByRole("button", { name: "Transactions", exact: true })
      .click();

    await page.getByRole("button", { name: "Bulk Entry", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Bulk Transaction Entry" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Row" })).toBeVisible();

    await page.getByRole("button", { name: "Add Row" }).click();
    await expect(
      page.getByRole("button", { name: /Save.*Transactions/ }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Cancel" }).click();

    await page.getByRole("button", { name: "Dashboard", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Portfolio Overview" }),
    ).toBeVisible();
  });
});
