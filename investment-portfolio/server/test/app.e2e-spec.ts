import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import * as request from "supertest";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/prisma/prisma.service";
import { AllExceptionsFilter } from "../src/common/all-exceptions.filter";

describe("Investment Portfolio E2E", () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let testCompanySymbol: string;
  let testTransactionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix("api");

    await app.init();

    prisma = app.get(PrismaService);

    // Clean the test database
    await prisma.transaction.deleteMany();
    await prisma.monthlySummary.deleteMany();
    await prisma.portfolioHolding.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.instrument.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    // Clean up
    await prisma.transaction.deleteMany();
    await prisma.monthlySummary.deleteMany();
    await prisma.portfolioHolding.deleteMany();
    await prisma.userSession.deleteMany();
    await prisma.instrument.deleteMany();
    await prisma.user.deleteMany();
    await app.close();
  });

  // =======================================================
  //  AUTH FLOW
  // =======================================================
  describe("Auth Module", () => {
    const testUser = {
      username: "testuser",
      email: "test@example.com",
      password: "Test1234!",
    };

    it("POST /api/auth/register - should register a new user", () => {
      return request(app.getHttpServer())
        .post("/api/auth/register")
        .send(testUser)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("access_token");
          expect(res.body.data).toHaveProperty("user");
          expect(res.body.data.user.username).toBe(testUser.username);
        });
    });

    it("POST /api/auth/register - should reject duplicate username", () => {
      return request(app.getHttpServer())
        .post("/api/auth/register")
        .send(testUser)
        .expect((res) => {
          // Should return error (409 or 400)
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it("POST /api/auth/login - should login with valid credentials", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: testUser.username, password: testUser.password })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("access_token");
          authToken = res.body.data.access_token;
        });
    });

    it("POST /api/auth/login - should reject invalid password", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: testUser.username, password: "wrong" })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it("POST /api/auth/login - should reject non-existent user", () => {
      return request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: "nonexistent", password: "whatever" })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it("GET /api/auth/me - should return current user with valid token", () => {
      return request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.username).toBe(testUser.username);
          expect(res.body.data.email).toBe(testUser.email);
        });
    });

    it("GET /api/auth/me - should reject without token", () => {
      return request(app.getHttpServer()).get("/api/auth/me").expect(401);
    });

    it("GET /api/auth/me - should reject with invalid token", () => {
      return request(app.getHttpServer())
        .get("/api/auth/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  // =======================================================
  //  COMPANIES CRUD
  // =======================================================
  describe("Companies Module", () => {
    it("should reject unauthenticated access", () => {
      return request(app.getHttpServer()).get("/api/companies").expect(401);
    });

    it("POST /api/companies - should create a company", () => {
      return request(app.getHttpServer())
        .post("/api/companies")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          symbol: "TESTCO",
          companyName: "Test Company Limited",
          sector: "Technology",
          instrumentType: "Equity",
          serialNumber: 1,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.symbol).toBe("TESTCO");
          expect(res.body.data.companyName).toBe("Test Company Limited");
          testCompanySymbol = res.body.data.symbol;
        });
    });

    it("POST /api/companies - should create a second company", () => {
      return request(app.getHttpServer())
        .post("/api/companies")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          symbol: "TESTCO2",
          companyName: "Test Company 2",
          sector: "Banking",
          instrumentType: "Equity",
          serialNumber: 2,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it("POST /api/companies - should reject duplicate symbol", () => {
      return request(app.getHttpServer())
        .post("/api/companies")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          symbol: "TESTCO",
          companyName: "Duplicate",
        })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it("POST /api/companies - should reject without required fields", () => {
      return request(app.getHttpServer())
        .post("/api/companies")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ sector: "Banking" })
        .expect(400);
    });

    it("GET /api/companies - should list all companies", () => {
      return request(app.getHttpServer())
        .get("/api/companies")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        });
    });

    it("GET /api/companies/:symbol - should get a single company", () => {
      return request(app.getHttpServer())
        .get(`/api/companies/${testCompanySymbol}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.symbol).toBe(testCompanySymbol);
        });
    });

    it("GET /api/companies/:symbol - should 404 for unknown symbol", () => {
      return request(app.getHttpServer())
        .get("/api/companies/UNKNOWN")
        .set("Authorization", `Bearer ${authToken}`)
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
        });
    });

    it("PUT /api/companies/:symbol - should update a company", () => {
      return request(app.getHttpServer())
        .put(`/api/companies/${testCompanySymbol}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ companyName: "Updated Company Name", sector: "Finance" })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.companyName).toBe("Updated Company Name");
          expect(res.body.data.sector).toBe("Finance");
        });
    });
  });

  // =======================================================
  //  TRANSACTIONS CRUD
  // =======================================================
  describe("Transactions Module", () => {
    it("should reject unauthenticated access", () => {
      return request(app.getHttpServer()).get("/api/transactions").expect(401);
    });

    it("POST /api/transactions - should create a BUY transaction", () => {
      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          companySymbol: testCompanySymbol,
          transactionType: "BUY",
          transactionDate: "2024-01-15",
          purchaseQuantity: 100,
          purchasePricePerUnit: 500,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.companySymbol).toBe(testCompanySymbol);
          expect(res.body.data.transactionType).toBe("BUY");
          expect(res.body.data.purchaseQuantity).toBe(100);
          expect(res.body.data.totalPurchaseAmount).toBe(50000);
          testTransactionId = res.body.data.id;
        });
    });

    it("POST /api/transactions - should create a second BUY transaction", () => {
      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          companySymbol: testCompanySymbol,
          transactionType: "BUY",
          transactionDate: "2024-02-10",
          purchaseQuantity: 50,
          purchasePricePerUnit: 520,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.totalPurchaseAmount).toBe(26000);
        });
    });

    it("POST /api/transactions - should create a SELL transaction", () => {
      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          companySymbol: testCompanySymbol,
          transactionType: "SELL",
          transactionDate: "2024-03-20",
          salesQuantity: 30,
          salesPricePerUnit: 550,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.transactionType).toBe("SELL");
          expect(res.body.data.salesQuantity).toBe(30);
          expect(res.body.data.totalSalesAmount).toBe(16500);
          // BUY fields should be zeroed/null for a SELL transaction
          expect(res.body.data.purchaseQuantity).toBe(0);
        });
    });

    it("POST /api/transactions - should create transaction for second company", () => {
      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          companySymbol: "TESTCO2",
          transactionType: "BUY",
          transactionDate: "2024-01-20",
          purchaseQuantity: 200,
          purchasePricePerUnit: 300,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it("GET /api/transactions - should list all transactions", () => {
      return request(app.getHttpServer())
        .get("/api/transactions")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBeGreaterThanOrEqual(4);
        });
    });

    it("GET /api/transactions?companySymbol=... - should filter by company", () => {
      return request(app.getHttpServer())
        .get(`/api/transactions?companySymbol=${testCompanySymbol}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.length).toBe(3);
          res.body.data.forEach((t: any) => {
            expect(t.companySymbol).toBe(testCompanySymbol);
          });
        });
    });

    it("GET /api/transactions?transactionType=BUY - should filter by type", () => {
      return request(app.getHttpServer())
        .get("/api/transactions?transactionType=BUY")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          res.body.data.forEach((t: any) => {
            expect(t.transactionType).toBe("BUY");
          });
        });
    });

    it("GET /api/transactions/:id - should get a single transaction", () => {
      return request(app.getHttpServer())
        .get(`/api/transactions/${testTransactionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.id).toBe(testTransactionId);
        });
    });

    it("PUT /api/transactions/:id - should update a transaction", () => {
      return request(app.getHttpServer())
        .put(`/api/transactions/${testTransactionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ purchaseQuantity: 120, purchasePricePerUnit: 510 })
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data.purchaseQuantity).toBe(120);
        });
    });

    it("POST /api/transactions/bulk - should create multiple transactions", () => {
      return request(app.getHttpServer())
        .post("/api/transactions/bulk")
        .set("Authorization", `Bearer ${authToken}`)
        .send([
          {
            companySymbol: "TESTCO2",
            transactionType: "BUY",
            transactionDate: "2024-04-01",
            purchaseQuantity: 50,
            purchasePricePerUnit: 310,
          },
          {
            companySymbol: "TESTCO2",
            transactionType: "SELL",
            transactionDate: "2024-05-01",
            salesQuantity: 20,
            salesPricePerUnit: 350,
          },
        ])
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          expect(res.body.data.length).toBe(2);
        });
    });
  });

  // =======================================================
  //  PORTFOLIO
  // =======================================================
  describe("Portfolio Module", () => {
    it("should reject unauthenticated access", () => {
      return request(app.getHttpServer())
        .get("/api/portfolio/holdings")
        .expect(401);
    });

    it("POST /api/portfolio/recalculate - should recalculate holdings", () => {
      return request(app.getHttpServer())
        .post("/api/portfolio/recalculate")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });

    it("GET /api/portfolio/holdings - should return holdings", () => {
      return request(app.getHttpServer())
        .get("/api/portfolio/holdings")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          // We have 2 companies with transactions
          expect(res.body.data.length).toBeGreaterThanOrEqual(2);
          const holding = res.body.data.find(
            (h: any) => h.companySymbol === testCompanySymbol,
          );
          expect(holding).toBeDefined();
          // 120 (updated) + 50 buy - 30 sell = 140
          expect(holding.totalQuantity).toBeGreaterThan(0);
        });
    });

    it("GET /api/portfolio/summary - should return portfolio summary", () => {
      return request(app.getHttpServer())
        .get("/api/portfolio/summary")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("totalInvested");
          expect(res.body.data).toHaveProperty("totalCompanies");
          expect(res.body.data.totalCompanies).toBeGreaterThanOrEqual(2);
        });
    });

    it("GET /api/portfolio/stats - should return portfolio statistics", () => {
      return request(app.getHttpServer())
        .get("/api/portfolio/stats")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("totalTransactions");
          expect(res.body.data.totalTransactions).toBeGreaterThanOrEqual(6);
        });
    });
  });

  // =======================================================
  //  REPORTS
  // =======================================================
  describe("Reports Module", () => {
    it("should reject unauthenticated access to monthly", () => {
      return request(app.getHttpServer())
        .get("/api/reports/monthly")
        .expect(401);
    });

    it("GET /api/reports/monthly - should return monthly summary", () => {
      return request(app.getHttpServer())
        .get("/api/reports/monthly")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it("GET /api/reports/performance - should return performance data", () => {
      return request(app.getHttpServer())
        .get("/api/reports/performance")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty("month");
            expect(res.body.data[0]).toHaveProperty("purchases");
            expect(res.body.data[0]).toHaveProperty("sales");
            expect(res.body.data[0]).toHaveProperty("net");
          }
        });
    });

    it("POST /api/reports/portfolio - should generate portfolio report", () => {
      return request(app.getHttpServer())
        .post("/api/reports/portfolio")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ dateFrom: "2024-01-01", dateTo: "2024-12-31" })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.data).toHaveProperty("summary");
          expect(res.body.data).toHaveProperty("holdings");
          expect(res.body.data).toHaveProperty("transactions");
        });
    });

    it("POST /api/reports/sectors - should return sector analysis", () => {
      return request(app.getHttpServer())
        .post("/api/reports/sectors")
        .set("Authorization", `Bearer ${authToken}`)
        .send({})
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(Array.isArray(res.body.data)).toBe(true);
          if (res.body.data.length > 0) {
            expect(res.body.data[0]).toHaveProperty("sector");
            expect(res.body.data[0]).toHaveProperty("value");
            expect(res.body.data[0]).toHaveProperty("percentage");
            expect(res.body.data[0]).toHaveProperty("companies");
          }
        });
    });

    it("POST /api/reports/export - should export data", () => {
      return request(app.getHttpServer())
        .post("/api/reports/export")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ type: "transactions", format: "json" })
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  // =======================================================
  //  CLEANUP / DELETE OPERATIONS
  // =======================================================
  describe("Cleanup - Delete Operations", () => {
    it("DELETE /api/transactions/:id - should delete a transaction", () => {
      return request(app.getHttpServer())
        .delete(`/api/transactions/${testTransactionId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe("Transaction deleted successfully");
        });
    });

    it("DELETE /api/companies/:symbol - should delete a company after deleting its transactions", async () => {
      // First delete all transactions for TESTCO2
      const txRes = await request(app.getHttpServer())
        .get("/api/transactions?companySymbol=TESTCO2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      for (const tx of txRes.body.data) {
        await request(app.getHttpServer())
          .delete(`/api/transactions/${tx.id}`)
          .set("Authorization", `Bearer ${authToken}`)
          .expect(200);
      }

      // Delete portfolio holdings
      await prisma.portfolioHolding.deleteMany({
        where: { companySymbol: "TESTCO2" },
      });

      return request(app.getHttpServer())
        .delete("/api/companies/TESTCO2")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.success).toBe(true);
          expect(res.body.message).toBe("Company deleted successfully");
        });
    });

    it("POST /api/auth/logout - should logout", () => {
      return request(app.getHttpServer())
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201)
        .expect((res) => {
          expect(res.body.success).toBe(true);
        });
    });
  });

  // =======================================================
  //  EDGE CASES & VALIDATION
  // =======================================================
  describe("Edge Cases", () => {
    let freshToken: string;

    beforeAll(async () => {
      // Get a fresh token
      const res = await request(app.getHttpServer())
        .post("/api/auth/login")
        .send({ username: "testuser", password: "Test1234!" });
      freshToken = res.body.data.access_token;
    });

    it("should handle non-existent endpoints with 404", () => {
      return request(app.getHttpServer())
        .get("/api/nonexistent")
        .set("Authorization", `Bearer ${freshToken}`)
        .expect(404);
    });

    it("POST /api/transactions - should reject invalid transactionType", () => {
      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${freshToken}`)
        .send({
          companySymbol: testCompanySymbol,
          transactionType: "INVALID",
          transactionDate: "2024-01-01",
          purchaseQuantity: 10,
        })
        .expect(400);
    });

    it("POST /api/transactions - should reject negative quantity", () => {
      return request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${freshToken}`)
        .send({
          companySymbol: testCompanySymbol,
          transactionType: "BUY",
          transactionDate: "2024-01-01",
          purchaseQuantity: -10,
          purchasePricePerUnit: 500,
        })
        .expect(400);
    });

    it("POST /api/companies - should reject empty symbol", () => {
      return request(app.getHttpServer())
        .post("/api/companies")
        .set("Authorization", `Bearer ${freshToken}`)
        .send({
          symbol: "",
          companyName: "No Symbol",
        })
        .expect(400);
    });

    it("Full round-trip: create company -> buy -> sell -> portfolio -> report", async () => {
      // 1. Create company
      const compRes = await request(app.getHttpServer())
        .post("/api/companies")
        .set("Authorization", `Bearer ${freshToken}`)
        .send({
          symbol: "TRIP",
          companyName: "Trip Test Corp",
          sector: "Tourism",
          instrumentType: "Equity",
        })
        .expect(201);
      expect(compRes.body.success).toBe(true);

      // 2. BUY
      const buyRes = await request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${freshToken}`)
        .send({
          companySymbol: "TRIP",
          transactionType: "BUY",
          transactionDate: "2024-06-01",
          purchaseQuantity: 500,
          purchasePricePerUnit: 100,
        })
        .expect(201);
      expect(buyRes.body.data.totalPurchaseAmount).toBe(50000);

      // 3. SELL partial
      const sellRes = await request(app.getHttpServer())
        .post("/api/transactions")
        .set("Authorization", `Bearer ${freshToken}`)
        .send({
          companySymbol: "TRIP",
          transactionType: "SELL",
          transactionDate: "2024-07-15",
          salesQuantity: 200,
          salesPricePerUnit: 120,
        })
        .expect(201);
      expect(sellRes.body.data.totalSalesAmount).toBe(24000);

      // 4. Recalculate
      await request(app.getHttpServer())
        .post("/api/portfolio/recalculate")
        .set("Authorization", `Bearer ${freshToken}`)
        .expect(201);

      // 5. Verify holdings
      const holdingsRes = await request(app.getHttpServer())
        .get("/api/portfolio/holdings")
        .set("Authorization", `Bearer ${freshToken}`)
        .expect(200);
      const tripHolding = holdingsRes.body.data.find(
        (h: any) => h.companySymbol === "TRIP",
      );
      expect(tripHolding).toBeDefined();
      expect(tripHolding.totalQuantity).toBe(300); // 500 - 200

      // 6. Sector analysis should include Tourism
      const sectorRes = await request(app.getHttpServer())
        .post("/api/reports/sectors")
        .set("Authorization", `Bearer ${freshToken}`)
        .send({})
        .expect(201);
      const tourismSector = sectorRes.body.data.find(
        (s: any) => s.sector === "Tourism",
      );
      expect(tourismSector).toBeDefined();

      // 7. Performance report
      const perfRes = await request(app.getHttpServer())
        .get("/api/reports/performance")
        .set("Authorization", `Bearer ${freshToken}`)
        .expect(200);
      expect(perfRes.body.data.length).toBeGreaterThan(0);
    });
  });
});
