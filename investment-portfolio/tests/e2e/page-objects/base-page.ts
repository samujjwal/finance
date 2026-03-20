import { Page, Locator } from '@playwright/test';

export class BasePage {
  constructor(public page: Page) {}

  // Navigation helpers
  async navigateToTab(tabName: string): Promise<void> {
    const tabSelector = `button:has-text("${tabName}")`;
    await this.page.click(tabSelector);
    await this.page.waitForLoadState('networkidle');
  }

  // Common element interactions
  async clickButton(buttonText: string): Promise<void> {
    await this.page.click(`button:has-text("${buttonText}")`);
  }

  async fillInput(label: string, value: string): Promise<void> {
    await this.page.fill(`input[name="${label}"]`, value);
  }

  async selectOption(selectName: string, value: string): Promise<void> {
    await this.page.selectOption(`select[name="${selectName}"]`, value);
  }

  // Wait helpers
  async waitForElement(selector: string): Promise<Locator> {
    return this.page.waitForSelector(selector);
  }

  async waitForText(text: string): Promise<void> {
    await this.page.waitForSelector(`text:has-text("${text}")`);
  }

  // Verification helpers
  async expectText(text: string): Promise<void> {
    await this.expect(this.page.locator(`text:has-text("${text}")`)).toBeVisible();
  }

  async expectElement(selector: string): Promise<void> {
    await this.expect(this.page.locator(selector)).toBeVisible();
  }

  // Form helpers
  async fillForm(formData: Record<string, string>): Promise<void> {
    for (const [field, value] of Object.entries(formData)) {
      await this.fillInput(field, value);
    }
  }

  // Table helpers
  async getTableRowCount(): Promise<number> {
    const rows = this.page.locator('table tbody tr');
    return await rows.count();
  }

  async getTableCellText(rowIndex: number, columnIndex: number): Promise<string> {
    const cell = this.page.locator(`table tbody tr:nth-child(${rowIndex + 1}) td:nth-child(${columnIndex + 1})`);
    return await cell.textContent() || '';
  }

  // Modal helpers
  async closeModal(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.page.waitForTimeout(500);
  }

  // Loading helpers
  async waitForLoadingToComplete(): Promise<void> {
    await this.page.waitForSelector('text:has-text("Loading")', { state: 'hidden' });
    await this.page.waitForLoadState('networkidle');
  }

  // Error handling
  async handleError(): Promise<void> {
    const errorSelector = 'text:has-text("Error")';
    if (await this.page.locator(errorSelector).isVisible()) {
      const errorText = await this.page.locator(errorSelector).textContent();
      console.error('Application error:', errorText);
      throw new Error(errorText || 'Unknown application error');
    }
  }

  // Screenshot helpers
  async takeScreenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/${name}-${Date.now()}.png` });
  }

  // Performance monitoring
  async measurePageLoadTime(): Promise<number> {
    const startTime = Date.now();
    await this.page.waitForLoadState('networkidle');
    return Date.now() - startTime;
  }

  // Accessibility helpers
  async checkAccessibility(): Promise<void> {
    // Basic accessibility checks
    const buttons = this.page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const text = await button.textContent();
      
      if (!ariaLabel && (!text || text.trim().length === 0)) {
        console.warn(`Button at index ${i} lacks accessible label`);
      }
    }
  }

  // Private helper for expect
  private expect(locator: Locator) {
    return locator;
  }
}
