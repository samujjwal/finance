# Investment Portfolio E2E Test Suite

This comprehensive Playwright test suite covers all end-to-end user journeys, UI flows, and action-based content for the Investment Portfolio application.

## 🎯 Test Coverage

### 1. Authentication & Navigation
- ✅ User login/logout functionality
- ✅ Tab navigation and routing
- ✅ Session management
- ✅ Unauthorized access prevention

### 2. Company Management
- ✅ Add, view, edit, delete companies
- ✅ Company search and filtering
- ✅ Form validation
- ✅ Data persistence

### 3. Transaction Management
- ✅ Single transaction entry
- ✅ Bulk transaction entry
- ✅ Auto-calculation of commissions and taxes
- ✅ Company statement generation
- ✅ Transaction editing and deletion
- ✅ Advanced filtering and search

### 4. Dashboard Features
- ✅ Basic dashboard content
- ✅ Live dashboard with real-time data
- ✅ Market indices display
- ✅ Portfolio value updates
- ✅ Live data pause/resume

### 5. Portfolio Features
- ✅ Portfolio overview
- ✅ Holdings management
- ✅ Portfolio recalculation
- ✅ Performance metrics

### 6. Reporting Features
- ✅ Basic reports (Monthly, Sector, Summary)
- ✅ Advanced reports (8 report types)
- ✅ Pivot table analysis
- ✅ Tax reporting
- ✅ Risk analysis
- ✅ Performance analytics

### 7. Excel Integration
- ✅ Excel export functionality
- ✅ Excel import with validation
- ✅ Multi-sheet export
- ✅ Data integrity checks

### 8. Error Handling & Validation
- ✅ Form validation errors
- ✅ Network error handling
- ✅ Data validation
- ✅ User feedback

### 9. Responsive Design
- ✅ Mobile device compatibility
- ✅ Tablet device compatibility
- ✅ Desktop device compatibility

### 10. Performance
- ✅ Page load times
- ✅ Large dataset handling
- ✅ Memory usage
- ✅ Network performance

### 11. Accessibility
- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Screen reader compatibility
- ✅ Focus management

### 12. Security
- ✅ Authentication security
- ✅ Session timeout
- ✅ Data protection
- ✅ XSS prevention

### 13. Cross-browser Compatibility
- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari/Webkit
- ✅ Mobile browsers

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install

# Start the application
npm run dev
```

### Test Commands

```bash
# Run all tests
npm run test:e2e

# Run tests in specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Run tests with UI mode
npm run test:e2e:ui

# Run specific test file
npx playwright tests/e2e/investment-portfolio.spec.ts

# Run tests with specific tag
npx playwright --grep "Authentication"

# Run tests in debug mode
npx playwright --debug

# Generate code from user actions
npx playwright codegen http://localhost:1420
```

### Test Reports

After running tests, reports are available at:

- **HTML Report**: `playwright-report/index.html`
- **JSON Report**: `test-results.json`
- **Screenshots**: `test-results/` (on failure)
- **Videos**: `test-results/` (on failure)
- **Traces**: `test-results/` (on failure)

## 📊 Test Data

### Sample Data Structure
```json
{
  "companies": [
    {
      "symbol": "NABIL",
      "companyName": "Nabil Bank Limited",
      "sector": "Banking"
    }
  ],
  "transactions": [
    {
      "companySymbol": "NABIL",
      "transactionType": "BUY",
      "transactionDate": "2024-01-15",
      "purchaseQuantity": 100,
      "purchasePricePerUnit": 850
    }
  ]
}
```

### Test Scenarios

#### 1. Complete Investment Workflow
- Add multiple companies
- Add various transactions (BUY/SELL)
- View portfolio overview
- Generate comprehensive reports
- Export data to Excel
- View live dashboard

#### 2. Tax Reporting Workflow
- Add taxable transactions (SELL)
- Generate tax reports
- Verify capital gains calculations
- Check tax compliance
- Export tax statements

#### 3. Portfolio Analysis Workflow
- Create diversified portfolio
- Analyze sector distribution
- Check risk metrics
- Verify performance analytics
- Generate pivot reports

#### 4. Data Integrity Workflow
- Add test data
- Perform calculations
- Verify consistency
- Check persistence
- Validate exports/imports

## 🔧 Test Configuration

### Playwright Config
```typescript
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report" }],
    ["json", { outputFile: "test-results.json" }]
  ],
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
    { name: "Mobile Safari", use: { ...devices["iPhone 12"] } }
  ]
});
```

### Environment Variables
```bash
# CI environment
CI=true

# Test environment
TEST_BASE_URL=http://localhost:1420
TEST_USERNAME=testuser
TEST_PASSWORD=testpass
```

## 🎯 Page Object Model

### BasePage Class
- Common navigation methods
- Form interaction helpers
- Wait strategies
- Error handling
- Accessibility checks
- Performance monitoring

### Specialized Page Objects
- `DashboardPage` - Dashboard interactions
- `TransactionsPage` - Transaction management
- `ReportsPage` - Report generation
- `PortfolioPage` - Portfolio features
- `CompaniesPage` - Company management

## 📈 Performance Benchmarks

### Expected Performance
- **Page Load**: < 3 seconds
- **Navigation**: < 1 second
- **Form Submission**: < 2 seconds
- **Report Generation**: < 5 seconds
- **Data Export**: < 10 seconds

### Performance Monitoring
- Automatic performance metrics collection
- Load time tracking
- Memory usage monitoring
- Network request analysis

## 🔍 Test Scenarios Detail

### Authentication Tests
```typescript
test('should login successfully and navigate to dashboard', async () => {
  await page.goto('http://localhost:1420');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'testpass');
  await page.click('button[type="submit"]');
  await expect(page.locator('text:has-text("JCL Investment Portfolio")')).toBeVisible();
});
```

### Transaction Tests
```typescript
test('should add single transaction with auto-calculations', async () => {
  await app.navigateToTab('Transactions');
  await app.clickButton('Add Transaction');
  await app.selectOption('companySymbol', 'NABIL');
  await app.selectOption('transactionType', 'BUY');
  await app.fillInput('purchaseQuantity', '100');
  await app.fillInput('purchasePricePerUnit', '850');
  await app.clickButton('Save');
  await expect(page.locator('text:has-text("Transaction added successfully")')).toBeVisible();
});
```

### Dashboard Tests
```typescript
test('should display live dashboard with real-time data', async () => {
  await app.navigateToTab('Live Dashboard');
  await expect(page.locator('text:has-text("Live Portfolio Dashboard")')).toBeVisible();
  await expect(page.locator('text:has-text("Market Indices")')).toBeVisible();
  await expect(page.locator('text:has-text("NEPSE Index")')).toBeVisible();
});
```

### Reports Tests
```typescript
test('should generate comprehensive reports', async () => {
  await app.navigateToTab('Advanced Reports');
  await page.click('button:has-text("Pivot Reports")');
  await page.selectOption('select[data-testid="pivot-group-by"]', 'Company');
  await page.selectOption('select[data-testid="pivot-metric"]', 'Total Investment');
  await page.click('button:has-text("Generate Report")');
  await expect(page.locator('table')).toBeVisible();
});
```

## 🐛 Debugging

### Debug Mode
```bash
# Run tests in debug mode
npx playwright --debug tests/e2e/investment-portfolio.spec.ts

# Run with UI mode for step-by-step execution
npx playwright --ui tests/e2e/investment-portfolio.spec.ts
```

### Common Issues
1. **Test Data Not Loading**: Ensure backend is running
2. **Timeout Errors**: Increase timeout in config
3. **Element Not Found**: Check selectors and wait strategies
4. **Authentication Failures**: Verify test user credentials

### Troubleshooting Steps
1. Check application is running on correct port
2. Verify test data is properly set up
3. Check network requests in browser dev tools
4. Review test logs and screenshots
5. Run tests in headed mode to see actual browser behavior

## 📝 Best Practices

### Test Writing
1. **Use descriptive test names**
2. **Follow AAA pattern (Arrange, Act, Assert)**
3. **Use page object model**
4. **Add proper assertions**
5. **Handle async operations correctly**

### Maintenance
1. **Keep selectors stable**
2. **Update test data regularly**
3. **Review test coverage**
4. **Optimize test performance**
5. **Document complex scenarios**

### CI/CD Integration
```yaml
# GitHub Actions example
- name: Run E2E Tests
  run: |
    npm run dev &
    npx playwright install
    npm run test:e2e
```

## 🎯 Future Enhancements

### Planned Additions
- Visual regression testing
- API testing integration
- Load testing scenarios
- Accessibility automation
- Performance benchmarking
- Cross-platform testing

### Advanced Features
- Custom test reporters
- Parallel test execution
- Smart test selection
- Self-healing tests
- AI-powered test generation
