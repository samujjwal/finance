import { ApiResponse } from "@/types/api";

// Single backend API service - always uses REST API
class ApiService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("auth_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const headers = {
      "Content-Type": "application/json",
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    // Always use REST API - single backend approach
    const apiUrl = this.getApiBaseUrl();
    try {
      const response = await fetch(`${apiUrl}/${endpoint}`, {
        ...options,
        headers,
      });

      // Handle 401 Unauthorized - clear auth and reload to login
      // Skip for setup-status endpoint which is unauthenticated
      if (response.status === 401 && !endpoint.includes("setup-status")) {
        localStorage.removeItem("auth_token");
        window.location.reload();
        return { success: false, error: "Unauthorized - please login again" };
      }

      const data = await response.json();
      return response.ok
        ? { success: true, data: data.data || data }
        : { success: false, error: data.message || "Request failed" };
    } catch (error) {
      return { success: false, error: error as string };
    }
  }

  private getApiBaseUrl(): string {
    // For development, use local API server
    if (import.meta.env.DEV) {
      return "http://localhost:3001/api";
    }

    // Production - bundled app uses port 41337
    return "http://localhost:41337/api";
  }

  // Authentication
  async getSetupStatus() {
    return this.makeRequest("auth/setup-status");
  }

  async login(username: string, password: string) {
    return this.makeRequest("auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
  }

  async register(userData: any) {
    return this.makeRequest("auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async logout() {
    return this.makeRequest("auth/logout", { method: "POST" });
  }

  async getCurrentUser() {
    return this.makeRequest("auth/me");
  }

  // Generic helper for custom endpoints used by advanced UI screens.
  async post(endpoint: string, body?: unknown) {
    return this.makeRequest(endpoint.replace(/^\//, ""), {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
  }

  // Companies
  async getCompanies() {
    return this.makeRequest("companies");
  }

  // Backward-compatible aliases for phase-2 terminology
  async getInstruments() {
    return this.getCompanies();
  }

  async getCompany(symbol: string) {
    return this.makeRequest(`companies/${symbol}`);
  }

  async createCompany(companyData: any) {
    return this.makeRequest("companies", {
      method: "POST",
      body: JSON.stringify(companyData),
    });
  }

  async createInstrument(instrumentData: any) {
    return this.createCompany(instrumentData);
  }

  async createCompaniesBulk(companies: any[]) {
    return this.makeRequest("companies/bulk", {
      method: "POST",
      body: JSON.stringify(companies),
    });
  }

  async updateCompany(symbol: string, companyData: any) {
    return this.makeRequest(`companies/${symbol}`, {
      method: "PUT",
      body: JSON.stringify(companyData),
    });
  }

  async updateInstrument(symbol: string, instrumentData: any) {
    return this.updateCompany(symbol, instrumentData);
  }

  async deleteCompany(symbol: string) {
    return this.makeRequest(`companies/${symbol}`, {
      method: "DELETE",
    });
  }

  // Transactions
  async getTransactions(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : "";
    return this.makeRequest(`transactions${queryString}`);
  }

  async getTransaction(id: string) {
    return this.makeRequest(`transactions/${id}`);
  }

  async createTransaction(transactionData: any) {
    return this.makeRequest("transactions", {
      method: "POST",
      body: JSON.stringify(transactionData),
    });
  }

  async createTransactionsBulk(transactions: any[]) {
    return this.makeRequest("transactions/bulk", {
      method: "POST",
      body: JSON.stringify(transactions),
    });
  }

  async updateTransaction(id: string, transactionData: any) {
    return this.makeRequest(`transactions/${id}`, {
      method: "PUT",
      body: JSON.stringify(transactionData),
    });
  }

  async deleteTransaction(id: string) {
    return this.makeRequest(`transactions/${id}`, {
      method: "DELETE",
    });
  }

  // Tax and calculations
  async getTaxRates() {
    return this.makeRequest("fee-rates/summary");
  }

  async getFeeRates() {
    return this.makeRequest("fee-rates");
  }

  async getFeeRatesGrouped() {
    return this.makeRequest("fee-rates/grouped");
  }

  async calculateTransactionCharges(
    transactionType: "BUY" | "SELL",
    amount: number,
  ) {
    return this.makeRequest("transactions/calculate-charges", {
      method: "POST",
      body: JSON.stringify({ transactionType, amount }),
    });
  }

  async calculateCapitalGains(body: {
    sellAmount: number;
    costBasis: number;
    purchaseDate: string;
    sellDate: string;
  }) {
    return this.makeRequest("transactions/calculate-capital-gains", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  async getPortfolioCalculations() {
    return this.makeRequest("portfolio/calculations");
  }

  // Portfolio
  async getPortfolioHoldings() {
    return this.makeRequest("portfolio/holdings");
  }

  async getPortfolioSummary() {
    return this.makeRequest("portfolio/summary");
  }

  async getPortfolioStats() {
    return this.makeRequest("portfolio/stats");
  }

  async recalculatePortfolio() {
    return this.makeRequest("portfolio/recalculate", { method: "POST" });
  }

  // Reports
  async getMonthlySummary(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : "";
    return this.makeRequest(`reports/monthly${queryString}`);
  }

  async getMonthlyPerformance(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : "";
    return this.makeRequest(`reports/performance${queryString}`);
  }

  async generatePortfolioReport(filters: any) {
    return this.makeRequest("reports/portfolio", {
      method: "POST",
      body: JSON.stringify(filters),
    });
  }

  async generateSectorAnalysis(filters: any) {
    return this.makeRequest("reports/sectors", {
      method: "POST",
      body: JSON.stringify(filters),
    });
  }

  async exportData(options: any) {
    return this.makeRequest("reports/export", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  // ===== USER MANAGEMENT =====
  async getUsers(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : "";
    return this.makeRequest(`users${queryString}`);
  }

  async getUser(id: string) {
    return this.makeRequest(`users/${id}`);
  }

  async createUser(userData: any) {
    return this.makeRequest("users", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  async approveUser(
    id: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string,
  ) {
    return this.makeRequest(`users/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action, rejectionReason }),
    });
  }

  async suspendUser(id: string, reason: string) {
    return this.makeRequest(`users/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async reactivateUser(id: string, reason: string) {
    return this.makeRequest(`users/${id}/reactivate`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async unlockUser(id: string, reason?: string) {
    return this.makeRequest(`users/${id}/unlock`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async getLockedUsers() {
    return this.makeRequest("users/locked/list");
  }

  // ===== ROLE MANAGEMENT =====
  async getRoles(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : "";
    return this.makeRequest(`roles${queryString}`);
  }

  async getRole(id: string) {
    return this.makeRequest(`roles/${id}`);
  }

  async createRole(roleData: any) {
    return this.makeRequest("roles", {
      method: "POST",
      body: JSON.stringify(roleData),
    });
  }

  async approveRole(
    id: string,
    action: "APPROVE" | "REJECT",
    rejectionReason?: string,
  ) {
    return this.makeRequest(`roles/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ action, rejectionReason }),
    });
  }

  async assignFunctionsToRole(id: string, functionIds: string[]) {
    return this.makeRequest(`roles/${id}/functions`, {
      method: "POST",
      body: JSON.stringify({ functionIds }),
    });
  }

  async removeFunctionFromRole(roleId: string, functionId: string) {
    return this.makeRequest(`roles/${roleId}/functions/${functionId}/remove`, {
      method: "POST",
    });
  }

  async suspendRole(id: string, reason: string) {
    return this.makeRequest(`roles/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async deleteRole(id: string) {
    return this.makeRequest(`roles/${id}/delete`, {
      method: "POST",
    });
  }

  async getAllFunctions() {
    return this.makeRequest("roles/functions");
  }

  async assignRoleToUser(
    userId: string,
    roleId: string,
    effectiveFrom?: Date,
    effectiveTo?: Date,
  ) {
    return this.makeRequest("roles/assign-to-user", {
      method: "POST",
      body: JSON.stringify({ userId, roleId, effectiveFrom, effectiveTo }),
    });
  }

  async removeRoleFromUser(userId: string, roleId: string) {
    return this.makeRequest("roles/remove-from-user", {
      method: "POST",
      body: JSON.stringify({ userId, roleId }),
    });
  }

  async getCurrentUserFunctions() {
    // Get current user first, then fetch their functions
    const userResponse = await this.getCurrentUser();
    if (
      userResponse.success &&
      userResponse.data &&
      (userResponse.data as any).id
    ) {
      return this.makeRequest(
        `roles/user/${(userResponse.data as any).id}/functions`,
      );
    }
    return { success: false, error: "Could not get current user functions" };
  }

  // ===== APPROVAL WORKFLOWS =====
  async getPendingApprovals() {
    return this.makeRequest("approvals/pending");
  }

  async getApprovalsByEntityType() {
    return this.makeRequest("approvals/by-entity-type");
  }

  async getApprovalStats() {
    return this.makeRequest("approvals/stats");
  }

  async getApprovalsForEntity(entityType: string, entityId: string) {
    return this.makeRequest(`approvals/${entityType}/${entityId}`);
  }

  async approveWorkflow(id: string) {
    return this.makeRequest(`approvals/${id}/approve`, {
      method: "POST",
    });
  }

  async rejectWorkflow(id: string, rejectionReason: string) {
    return this.makeRequest(`approvals/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejectionReason }),
    });
  }

  // ===== AUDIT LOGS =====
  async getAuditLogs(filters?: any) {
    const queryString = filters ? `?${new URLSearchParams(filters)}` : "";
    return this.makeRequest(`audit/logs${queryString}`);
  }

  async getRecentAuditLogs(limit: number = 50) {
    return this.makeRequest(`audit/recent?limit=${limit}`);
  }

  async getAuditStats() {
    return this.makeRequest("audit/stats");
  }

  async getAuditLogsForEntity(entityType: string, entityId: string) {
    return this.makeRequest(`audit/entity/${entityType}/${entityId}`);
  }

  // ===== Organizations =====
  async getOrganizations() {
    return this.makeRequest("organizations");
  }
  async getOrganization(id: string) {
    return this.makeRequest(`organizations/${id}`);
  }
  async createOrganization(data: any) {
    return this.makeRequest("organizations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateOrganization(id: string, data: any) {
    return this.makeRequest(`organizations/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async getOrganizationModules(id: string) {
    return this.makeRequest(`organizations/${id}/modules`);
  }
  async updateOrganizationModules(id: string, data: any) {
    return this.makeRequest(`organizations/${id}/modules`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== Accounting - Fiscal Years =====
  async getFiscalYears(organizationId: string) {
    return this.makeRequest(
      `accounting/fiscal-years?organizationId=${organizationId}`,
    );
  }
  async getCurrentFiscalYear(organizationId: string) {
    return this.makeRequest(
      `accounting/fiscal-years/current?organizationId=${organizationId}`,
    );
  }
  async createFiscalYear(data: any) {
    return this.makeRequest("accounting/fiscal-years", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async closeFiscalYear(id: string) {
    return this.makeRequest(`accounting/fiscal-years/${id}/close`, {
      method: "PUT",
    });
  }

  // ===== Accounting - Chart of Accounts =====
  async getAccountGroups(organizationId: string) {
    return this.makeRequest(
      `accounting/groups?organizationId=${organizationId}`,
    );
  }
  async getAccountGroupTree(organizationId: string) {
    return this.makeRequest(
      `accounting/groups/tree?organizationId=${organizationId}`,
    );
  }
  async createAccountGroup(data: any) {
    return this.makeRequest("accounting/groups", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async getLedgerAccounts(organizationId: string, groupId?: string) {
    const q = new URLSearchParams({
      organizationId,
      ...(groupId && { groupId }),
    });
    return this.makeRequest(`accounting/ledger-accounts?${q}`);
  }
  async getLedgerAccount(id: string) {
    return this.makeRequest(`accounting/ledger-accounts/${id}`);
  }
  async getLedgerBalance(id: string, asOfDate?: string) {
    const q = asOfDate ? `?asOfDate=${asOfDate}` : "";
    return this.makeRequest(`accounting/ledger-accounts/${id}/balance${q}`);
  }
  async createLedgerAccount(data: any) {
    return this.makeRequest("accounting/ledger-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async updateLedgerAccount(id: string, data: any) {
    return this.makeRequest(`accounting/ledger-accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async deleteLedgerAccount(id: string) {
    return this.makeRequest(`accounting/ledger-accounts/${id}`, {
      method: "DELETE",
    });
  }
  async autoCreateInvestmentAccounts(organizationId: string) {
    return this.makeRequest(
      "accounting/ledger-accounts/auto-create-investment",
      { method: "POST", body: JSON.stringify({ organizationId }) },
    );
  }

  // ===== Accounting - Journals =====
  async getJournals(organizationId: string, filters?: any) {
    const q = new URLSearchParams({ organizationId, ...filters });
    return this.makeRequest(`accounting/journals?${q}`);
  }
  async getJournal(id: string) {
    return this.makeRequest(`accounting/journals/${id}`);
  }
  async createJournal(data: any) {
    return this.makeRequest("accounting/journals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async postJournal(id: string, postedById: number) {
    return this.makeRequest(`accounting/journals/${id}/post`, {
      method: "PUT",
      body: JSON.stringify({ postedById }),
    });
  }
  async reverseJournal(id: string, reversalDate: string, createdById: number) {
    return this.makeRequest(`accounting/journals/${id}/reverse`, {
      method: "POST",
      body: JSON.stringify({ reversalDate, createdById }),
    });
  }

  // ===== Accounting - Vouchers =====
  async getVouchers(organizationId: string, status?: string) {
    const q = new URLSearchParams({
      organizationId,
      ...(status && { status }),
    });
    return this.makeRequest(`accounting/vouchers?${q}`);
  }
  async createVoucher(data: any) {
    return this.makeRequest("accounting/vouchers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async submitVoucher(id: string) {
    return this.makeRequest(`accounting/vouchers/${id}/submit`, {
      method: "PUT",
    });
  }
  async approveVoucher(id: string, data: any) {
    return this.makeRequest(`accounting/vouchers/${id}/approve`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ===== Accounting - Customers & Vendors =====
  async getCustomers(organizationId: string) {
    return this.makeRequest(
      `accounting/customers?organizationId=${organizationId}`,
    );
  }
  async getCustomer(id: string) {
    return this.makeRequest(`accounting/customers/${id}`);
  }
  async createCustomer(data: any) {
    return this.makeRequest("accounting/customers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async getCustomerBalance(id: string) {
    return this.makeRequest(`accounting/customers/${id}/balance`);
  }
  async getVendors(organizationId: string) {
    return this.makeRequest(
      `accounting/vendors?organizationId=${organizationId}`,
    );
  }
  async getVendor(id: string) {
    return this.makeRequest(`accounting/vendors/${id}`);
  }
  async createVendor(data: any) {
    return this.makeRequest("accounting/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ===== Accounting - Invoices & Bills =====
  async getInvoices(organizationId: string, status?: string) {
    const q = new URLSearchParams({
      organizationId,
      ...(status && { status }),
    });
    return this.makeRequest(`accounting/invoices?${q}`);
  }
  async createInvoice(data: any) {
    return this.makeRequest("accounting/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async postInvoice(id: string) {
    return this.makeRequest(`accounting/invoices/${id}/post`, {
      method: "PUT",
    });
  }
  async applyInvoicePayment(id: string, data: any) {
    return this.makeRequest(`accounting/invoices/${id}/payment`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }
  async getBills(organizationId: string, status?: string) {
    const q = new URLSearchParams({
      organizationId,
      ...(status && { status }),
    });
    return this.makeRequest(`accounting/bills?${q}`);
  }
  async createBill(data: any) {
    return this.makeRequest("accounting/bills", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async postBill(id: string) {
    return this.makeRequest(`accounting/bills/${id}/post`, { method: "PUT" });
  }

  // ===== Accounting - Banking =====
  async getBankAccounts(organizationId: string) {
    return this.makeRequest(
      `accounting/banking/accounts?organizationId=${organizationId}`,
    );
  }
  async createBankAccount(data: any) {
    return this.makeRequest("accounting/banking/accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async startReconciliation(data: any) {
    return this.makeRequest("accounting/banking/reconciliations", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async getReconciliation(id: string) {
    return this.makeRequest(`accounting/banking/reconciliations/${id}`);
  }
  async addBankTransaction(reconId: string, data: any) {
    return this.makeRequest(
      `accounting/banking/reconciliations/${reconId}/transactions`,
      { method: "POST", body: JSON.stringify(data) },
    );
  }
  async autoMatchReconciliation(id: string) {
    return this.makeRequest(
      `accounting/banking/reconciliations/${id}/auto-match`,
      { method: "POST" },
    );
  }
  async completeReconciliation(id: string) {
    return this.makeRequest(
      `accounting/banking/reconciliations/${id}/complete`,
      { method: "PUT" },
    );
  }

  // ===== Portfolio Accounts =====
  async getPortfolioAccounts(organizationId: string) {
    return this.makeRequest(
      `portfolio-accounts?organizationId=${organizationId}`,
    );
  }
  async createPortfolioAccount(data: any) {
    return this.makeRequest("portfolio-accounts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async getPortfolioAccount(id: string) {
    return this.makeRequest(`portfolio-accounts/${id}`);
  }
  async getPortfolioAccountHoldings(id: string) {
    return this.makeRequest(`portfolio-accounts/${id}/holdings`);
  }

  // ===== Nepal - Calendar =====
  async convertADToBS(date: string) {
    return this.makeRequest(`nepal/calendar/convert/ad-to-bs?date=${date}`);
  }
  async convertBSToAD(year: number, month: number, day: number) {
    return this.makeRequest(
      `nepal/calendar/convert/bs-to-ad?year=${year}&month=${month}&day=${day}`,
    );
  }
  async getNepalFiscalYear(date?: string) {
    return this.makeRequest(
      `nepal/calendar/fiscal-year${date ? `?date=${date}` : ""}`,
    );
  }
  async getBSCalendarMonth(year: number, month: number) {
    return this.makeRequest(`nepal/calendar/${year}/${month}`);
  }

  // ===== Nepal - VAT =====
  async getVatConfig(organizationId: string) {
    return this.makeRequest(
      `nepal/vat/config?organizationId=${organizationId}`,
    );
  }
  async configureVat(data: any) {
    return this.makeRequest("nepal/vat/config", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async generateVatReturn(data: any) {
    return this.makeRequest("nepal/vat/returns", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async getVatReturns(organizationId: string) {
    return this.makeRequest(
      `nepal/vat/returns?organizationId=${organizationId}`,
    );
  }
  async submitVatReturn(id: string) {
    return this.makeRequest(`nepal/vat/returns/${id}/submit`, {
      method: "PUT",
    });
  }

  // ===== Nepal - TDS =====
  async getTdsSections() {
    return this.makeRequest("nepal/tds/sections");
  }
  async getTdsConfig(organizationId: string) {
    return this.makeRequest(
      `nepal/tds/config?organizationId=${organizationId}`,
    );
  }
  async calculateTds(data: any) {
    return this.makeRequest("nepal/tds/calculate", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }
  async getTdsDeductions(organizationId: string, fiscalYearId?: string) {
    const q = new URLSearchParams({
      organizationId,
      ...(fiscalYearId && { fiscalYearId }),
    });
    return this.makeRequest(`nepal/tds/deductions?${q}`);
  }

  // ===== Nepal - IRD Export =====
  async downloadSalesRegister(
    organizationId: string,
    from: string,
    to: string,
  ) {
    window.open(
      `${this.getApiBaseUrl()}/nepal/ird/sales-register?organizationId=${organizationId}&from=${from}&to=${to}`,
    );
  }
  async downloadPurchaseRegister(
    organizationId: string,
    from: string,
    to: string,
  ) {
    window.open(
      `${this.getApiBaseUrl()}/nepal/ird/purchase-register?organizationId=${organizationId}&from=${from}&to=${to}`,
    );
  }
  async downloadTdsRegister(organizationId: string, fiscalYearId: string) {
    window.open(
      `${this.getApiBaseUrl()}/nepal/ird/tds-register?organizationId=${organizationId}&fiscalYearId=${fiscalYearId}`,
    );
  }
}

export const apiService = new ApiService();
