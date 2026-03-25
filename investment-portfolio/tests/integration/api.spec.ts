import { test, expect } from '@playwright/test';

test.describe('API Integration Tests', () => {
  const baseURL = 'http://localhost:3001/api';
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post(`${baseURL}/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });

    const loginData = await loginResponse.json();
    authToken = loginData.data.token;
  });

  test.describe('Authentication Endpoints', () => {
    test('POST /auth/login - should authenticate valid credentials', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          username: 'admin',
          password: 'admin123'
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.user.username).toBe('admin');
      expect(data.data.token).toBeDefined();
    });

    test('POST /auth/login - should reject invalid credentials', async ({ request }) => {
      const response = await request.post(`${baseURL}/auth/login`, {
        data: {
          username: 'invalid',
          password: 'invalid'
        }
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(401);
    });

    test('GET /auth/me - should return current user info', async ({ request }) => {
      const response = await request.get(`${baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.username).toBe('admin');
    });

    test('GET /auth/setup-status - should return setup status', async ({ request }) => {
      const response = await request.get(`${baseURL}/auth/setup-status`);

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.firstRun).toBe(false);
      expect(data.data.userCount).toBeGreaterThan(0);
    });
  });

  test.describe('User Management Endpoints', () => {
    test('GET /users - should return users list', async ({ request }) => {
      const response = await request.get(`${baseURL}/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.users).toBeInstanceOf(Array);
      expect(data.data.pagination).toBeDefined();
    });

    test('GET /users - should support pagination', async ({ request }) => {
      const response = await request.get(`${baseURL}/users?page=1&limit=5`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.pagination.page).toBe(1);
      expect(data.data.pagination.limit).toBe(5);
    });

    test('GET /users - should filter by status', async ({ request }) => {
      const response = await request.get(`${baseURL}/users?status=ACTIVE`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      // All returned users should have ACTIVE status
      data.data.users.forEach((user: any) => {
        expect(user.status).toBe('ACTIVE');
      });
    });

    test('GET /users/:id - should return specific user', async ({ request }) => {
      // First get a user ID
      const usersResponse = await request.get(`${baseURL}/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const usersData = await usersResponse.json();
      const userId = usersData.data.users[0].id;

      const response = await request.get(`${baseURL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(userId);
    });

    test('POST /users - should create new user', async ({ request }) => {
      const newUser = {
        username: `testuser_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        password: 'Password123',
        firstName: 'Test',
        surname: 'User',
        userId: `TEST${Date.now()}`,
        userTypeId: 'MGR',
        branchId: 'BRANCH_MAIN'
      };

      const response = await request.post(`${baseURL}/users`, {
        data: newUser,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.username).toBe(newUser.username);
      expect(data.data.status).toBe('PENDING_APPROVAL');
    });

    test('POST /users - should reject duplicate username', async ({ request }) => {
      const duplicateUser = {
        username: 'admin', // Already exists
        email: 'duplicate@example.com',
        password: 'Password123',
        firstName: 'Duplicate',
        surname: 'User',
        userId: 'DUP001',
        userTypeId: 'MGR',
        branchId: 'BRANCH_MAIN'
      };

      const response = await request.post(`${baseURL}/users`, {
        data: duplicateUser,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Role Management Endpoints', () => {
    test('GET /roles - should return roles list', async ({ request }) => {
      const response = await request.get(`${baseURL}/roles`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('GET /roles/functions - should return available functions', async ({ request }) => {
      const response = await request.get(`${baseURL}/roles/functions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('GET /roles/:id - should return specific role', async ({ request }) => {
      // First get a role ID
      const rolesResponse = await request.get(`${baseURL}/roles`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      const rolesData = await rolesResponse.json();
      const roleId = rolesData.data[0].id;

      const response = await request.get(`${baseURL}/roles/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(roleId);
    });
  });

  test.describe('Transaction Management Endpoints', () => {
    test('GET /transactions - should return transactions list', async ({ request }) => {
      const response = await request.get(`${baseURL}/transactions`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('GET /transactions/pending-approvals - should return pending transactions', async ({ request }) => {
      const response = await request.get(`${baseURL}/transactions/pending-approvals`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('GET /transactions/approval-stats - should return approval statistics', async ({ request }) => {
      const response = await request.get(`${baseURL}/transactions/approval-stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('draft');
      expect(data.data).toHaveProperty('pending');
      expect(data.data).toHaveProperty('approved');
      expect(data.data).toHaveProperty('rejected');
    });

    test('POST /transactions - should create new transaction', async ({ request }) => {
      const newTransaction = {
        companySymbol: 'NABIL',
        transactionType: 'BUY',
        transactionDate: '2024-01-01',
        purchaseQuantity: 100,
        purchasePricePerUnit: 1000
      };

      const response = await request.post(`${baseURL}/transactions`, {
        data: newTransaction,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.companySymbol).toBe(newTransaction.companySymbol);
      expect(data.data.status).toBe('DRAFT');
    });
  });

  test.describe('Approval Workflow Endpoints', () => {
    test('GET /approvals/pending - should return pending approvals', async ({ request }) => {
      const response = await request.get(`${baseURL}/approvals/pending`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('GET /approvals/stats - should return approval statistics', async ({ request }) => {
      const response = await request.get(`${baseURL}/approvals/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('total');
      expect(data.data).toHaveProperty('pending');
      expect(data.data).toHaveProperty('approved');
      expect(data.data).toHaveProperty('rejected');
    });

    test('GET /approvals/by-entity-type - should return approvals by entity type', async ({ request }) => {
      const response = await request.get(`${baseURL}/approvals/by-entity-type?entityType=USER`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });
  });

  test.describe('Portfolio Management Endpoints', () => {
    test('GET /portfolio/holdings - should return portfolio holdings', async ({ request }) => {
      const response = await request.get(`${baseURL}/portfolio/holdings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('GET /portfolio/summary - should return portfolio summary', async ({ request }) => {
      const response = await request.get(`${baseURL}/portfolio/summary`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalValue');
      expect(data.data).toHaveProperty('totalCost');
      expect(data.data).toHaveProperty('unrealizedPnL');
    });

    test('GET /portfolio/stats - should return portfolio statistics', async ({ request }) => {
      const response = await request.get(`${baseURL}/portfolio/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalHoldings');
      expect(data.data).toHaveProperty('totalValue');
    });

    test('POST /portfolio/recalculate - should recalculate portfolio', async ({ request }) => {
      const response = await request.post(`${baseURL}/portfolio/recalculate`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.message).toBeDefined();
    });
  });

  test.describe('Company Management Endpoints', () => {
    test('GET /companies - should return companies list', async ({ request }) => {
      const response = await request.get(`${baseURL}/companies`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeGreaterThan(0);
    });

    test('POST /companies - should create new company', async ({ request }) => {
      const newCompany = {
        symbol: `TEST${Date.now()}`,
        companyName: 'Test Company',
        sector: 'Technology',
        instrumentType: 'EQUITY'
      };

      const response = await request.post(`${baseURL}/companies`, {
        data: newCompany,
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.symbol).toBe(newCompany.symbol);
    });

    test('POST /companies/bulk - should handle bulk import', async ({ request }) => {
      const companies = [
        {
          symbol: `BULK1${Date.now()}`,
          companyName: 'Bulk Company 1',
          sector: 'Technology',
          instrumentType: 'EQUITY'
        },
        {
          symbol: `BULK2${Date.now()}`,
          companyName: 'Bulk Company 2',
          sector: 'Finance',
          instrumentType: 'EQUITY'
        }
      ];

      const response = await request.post(`${baseURL}/companies/bulk`, {
        data: { companies },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.imported).toBe(2);
    });
  });

  test.describe('Reports Endpoints', () => {
    test('GET /reports/monthly - should return monthly reports', async ({ request }) => {
      const response = await request.get(`${baseURL}/reports/monthly`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('GET /reports/performance - should return performance reports', async ({ request }) => {
      const response = await request.get(`${baseURL}/reports/performance`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('POST /reports/portfolio - should generate portfolio report', async ({ request }) => {
      const response = await request.post(`${baseURL}/reports/portfolio`, {
        data: {
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('summary');
      expect(data.data).toHaveProperty('holdings');
    });

    test('POST /reports/export - should export reports', async ({ request }) => {
      const response = await request.post(`${baseURL}/reports/export`, {
        data: {
          reportType: 'monthly',
          format: 'csv',
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.downloadUrl).toBeDefined();
    });
  });

  test.describe('Audit Endpoints', () => {
    test('GET /audit/logs - should return audit logs', async ({ request }) => {
      const response = await request.get(`${baseURL}/audit/logs`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
    });

    test('GET /audit/recent - should return recent audit logs', async ({ request }) => {
      const response = await request.get(`${baseURL}/audit/recent?limit=10`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.data.length).toBeLessThanOrEqual(10);
    });

    test('GET /audit/stats - should return audit statistics', async ({ request }) => {
      const response = await request.get(`${baseURL}/audit/stats`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveProperty('totalLogs');
      expect(data.data).toHaveProperty('recentActivity');
    });
  });

  test.describe('Error Handling', () => {
    test('should return 401 for unauthorized requests', async ({ request }) => {
      const response = await request.get(`${baseURL}/users`);

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(401);
    });

    test('should return 404 for non-existent endpoints', async ({ request }) => {
      const response = await request.get(`${baseURL}/non-existent`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(404);
    });

    test('should return 400 for invalid data', async ({ request }) => {
      const response = await request.post(`${baseURL}/users`, {
        data: {
          // Missing required fields
          username: '',
          email: 'invalid-email'
        },
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      expect(response.ok()).toBeFalsy();
      expect(response.status()).toBe(400);
    });
  });

  test.describe('Rate Limiting', () => {
    test('should handle multiple requests gracefully', async ({ request }) => {
      const promises = Array(10).fill(null).map(() =>
        request.get(`${baseURL}/users`, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
      );

      const responses = await Promise.all(promises);
      
      // Most requests should succeed
      const successCount = responses.filter(r => r.ok()).length;
      expect(successCount).toBeGreaterThan(5);
    });
  });
});
