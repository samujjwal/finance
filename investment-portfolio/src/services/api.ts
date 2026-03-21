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
      if (response.status === 401 && !endpoint.includes('setup-status')) {
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

  // Companies
  async getCompanies() {
    return this.makeRequest("companies");
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
}

export const apiService = new ApiService();
