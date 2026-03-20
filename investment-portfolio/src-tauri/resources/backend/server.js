#!/usr/bin/env node

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs").promises;
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const DB_PATH = path.join(__dirname, "..", "..", "investment_portfolio.db");
const REPORTS_PATH = path.join(__dirname, "..", "..", "reports");

// Nepal Tax Rates (as of current fiscal year) - Move from frontend to backend
const TAX_RATES = {
  SHORT_TERM_CAPITAL_GAINS: 0.1, // 10% for holdings < 1 year
  LONG_TERM_CAPITAL_GAINS: 0.05, // 5% for holdings >= 1 year
  BROKERAGE_RATE: 0.0025, // 0.25% of transaction value
  DP_CHARGE_RATE: 0.00025, // 0.025% of transaction value
  SEBON_FEE_RATE: 0.000067, // 0.0067% of transaction value
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// Tax rates endpoint
app.get("/api/tax-rates", (req, res) => {
  res.json({ success: true, data: TAX_RATES });
});

// Calculate transaction charges endpoint
app.post("/api/calculate-charges", (req, res) => {
  try {
    const { transactionType, amount } = req.body;

    if (!transactionType || !amount || typeof amount !== "number") {
      return res.status(400).json({
        success: false,
        error: "Invalid transactionType or amount",
      });
    }

    const brokerage = amount * TAX_RATES.BROKERAGE_RATE;
    const dpCharges = amount * TAX_RATES.DP_CHARGE_RATE;
    const sebonFee = amount * TAX_RATES.SEBON_FEE_RATE;
    const totalCharges = brokerage + dpCharges + sebonFee;

    res.json({
      success: true,
      data: {
        brokerage,
        dpCharges,
        sebonFee,
        totalCharges,
      },
    });
  } catch (error) {
    console.error("Error calculating charges:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Calculate capital gains tax endpoint
app.post("/api/calculate-capital-gains", (req, res) => {
  try {
    const { transaction, currentPrice } = req.body;

    if (!transaction || transaction.transactionType !== "SELL") {
      return res.json({
        success: true,
        data: {
          capitalGains: 0,
          holdingPeriodDays: 0,
          isLongTerm: false,
          applicableTaxRate: 0,
          taxAmount: 0,
          netReceivables: 0,
        },
      });
    }

    const transactionDate = new Date(transaction.transactionDate);
    const currentDate = new Date();
    const holdingPeriodDays = Math.floor(
      (currentDate.getTime() - transactionDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const isLongTerm = holdingPeriodDays >= 365;
    const applicableTaxRate = isLongTerm
      ? TAX_RATES.LONG_TERM_CAPITAL_GAINS
      : TAX_RATES.SHORT_TERM_CAPITAL_GAINS;

    // Calculate capital gains
    const totalSalesAmount = transaction.totalSalesAmount || 0;
    const totalInvestmentCost = transaction.totalInvestmentCost || 0;
    const capitalGains = Math.max(0, totalSalesAmount - totalInvestmentCost);

    // Calculate tax
    const taxAmount = capitalGains * applicableTaxRate;
    const netReceivables =
      totalSalesAmount - taxAmount - (transaction.totalSalesCommission || 0);

    res.json({
      success: true,
      data: {
        capitalGains,
        holdingPeriodDays,
        isLongTerm,
        applicableTaxRate,
        taxAmount,
        netReceivables,
      },
    });
  } catch (error) {
    console.error("Error calculating capital gains:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Database access endpoints
app.get("/api/portfolio", async (req, res) => {
  try {
    const data = await fs.readFile(DB_PATH, "utf8");
    res.json({ success: true, data: data });
  } catch (error) {
    console.error("Error reading portfolio data:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/transactions", async (req, res) => {
  try {
    const csvPath = path.join(REPORTS_PATH, "all_transactions.csv");
    const data = await fs.readFile(csvPath, "utf8");

    // Parse CSV and return structured data
    const lines = data.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());
    const transactions = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const transaction = {};
      headers.forEach((header, index) => {
        transaction[header] = values[index] || "";
      });
      return transaction;
    });

    res.json({ success: true, data: transactions });
  } catch (error) {
    console.error("Error reading transactions:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get("/api/companies", async (req, res) => {
  try {
    const csvPath = path.join(REPORTS_PATH, "portfolio_holdings.csv");
    const data = await fs.readFile(csvPath, "utf8");

    // Parse CSV and return structured data
    const lines = data.split("\n").filter((line) => line.trim());
    const headers = lines[0].split(",").map((h) => h.trim());
    const companies = lines.slice(1).map((line) => {
      const values = line.split(",").map((v) => v.trim());
      const company = {};
      headers.forEach((header, index) => {
        company[header] = values[index] || "";
      });
      return company;
    });

    res.json({ success: true, data: companies });
  } catch (error) {
    console.error("Error reading companies:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Portfolio calculations endpoint
app.get("/api/portfolio/calculations", async (req, res) => {
  try {
    // Get transactions data
    const transactionsResponse = await fetch(
      `http://localhost:${PORT}/api/transactions`,
    );
    const transactionsData = await transactionsResponse.json();

    if (!transactionsData.success) {
      throw new Error("Failed to fetch transactions");
    }

    const transactions = transactionsData.data;

    // Calculate portfolio metrics
    const portfolioMetrics = calculatePortfolioMetrics(transactions);

    res.json({ success: true, data: portfolioMetrics });
  } catch (error) {
    console.error("Error calculating portfolio metrics:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Helper function to calculate portfolio metrics
function calculatePortfolioMetrics(transactions) {
  const companyTransactions = new Map();

  // Group transactions by company
  transactions.forEach((transaction) => {
    const symbol = transaction.companySymbol || transaction.SYMBOL;
    if (!companyTransactions.has(symbol)) {
      companyTransactions.set(symbol, []);
    }
    companyTransactions.get(symbol).push(transaction);
  });

  let totalInvestment = 0;
  let currentValue = 0;
  const holdings = [];

  for (const [symbol, txns] of companyTransactions) {
    const buys = txns.filter(
      (t) => (t.transactionType || t["Txn Type"]) === "BUY",
    );
    const sells = txns.filter(
      (t) => (t.transactionType || t["Txn Type"]) === "SELL",
    );

    let totalBuyQuantity = 0;
    let totalBuyCost = 0;

    buys.forEach((buy) => {
      const qty = parseFloat(buy.purchaseQuantity || buy["Purchase QTY"] || 0);
      const cost = parseFloat(
        buy.totalPurchaseAmount || buy["Total Purchase Amount"] || 0,
      );
      const commission = parseFloat(
        buy.totalPurchaseCommission || buy["Total Commission on Purchase"] || 0,
      );

      totalBuyQuantity += qty;
      totalBuyCost += cost + commission;
    });

    let totalSellQuantity = 0;
    sells.forEach((sell) => {
      const qty = parseFloat(sell.salesQuantity || sell["Sales Qty"] || 0);
      totalSellQuantity += qty;
    });

    const currentQuantity = totalBuyQuantity - totalSellQuantity;
    const avgCostPerUnit =
      totalBuyQuantity > 0 ? totalBuyCost / totalBuyQuantity : 0;

    if (currentQuantity > 0) {
      // For demo purposes, use last buy price as current price
      const lastBuy = buys[buys.length - 1];
      const currentPrice = parseFloat(
        lastBuy?.purchasePricePerUnit || lastBuy?.PPPU || avgCostPerUnit,
      );
      const currentVal = currentQuantity * currentPrice;

      totalInvestment += currentQuantity * avgCostPerUnit;
      currentValue += currentVal;

      holdings.push({
        symbol,
        quantity: currentQuantity,
        avgCost: avgCostPerUnit,
        currentPrice,
        currentValue: currentVal,
        unrealizedPnL: currentVal - currentQuantity * avgCostPerUnit,
      });
    }
  }

  const unrealizedPnL = currentValue - totalInvestment;
  const totalReturnPercent =
    totalInvestment > 0 ? (unrealizedPnL / totalInvestment) * 100 : 0;

  return {
    totalInvestment,
    currentValue,
    unrealizedPnL,
    totalReturnPercent,
    holdings,
  };
}

app.post("/api/backup", async (req, res) => {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(__dirname, "..", "..", "backups");

    await fs.mkdir(backupDir, { recursive: true });

    // Backup database
    const dbSource = path.join(
      __dirname,
      "..",
      "..",
      "investment_portfolio.db",
    );
    const dbBackup = path.join(backupDir, `portfolio_${timestamp}.db`);
    await fs.copyFile(dbSource, dbBackup);

    // Backup reports
    const reportsSource = path.join(__dirname, "..", "..", "reports");
    const reportsBackup = path.join(backupDir, `reports_${timestamp}`);

    const { exec } = require("child_process");
    await new Promise((resolve, reject) => {
      exec(`cp -r "${reportsSource}" "${reportsBackup}"`, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    res.json({
      success: true,
      backup: {
        database: dbBackup,
        reports: reportsBackup,
        timestamp: timestamp,
      },
    });
  } catch (error) {
    console.error("Error creating backup:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});

// Start server
app.listen(PORT, "127.0.0.1", () => {
  console.log(`JCL Investment Portfolio backend running on port ${PORT}`);
  console.log(`Process ID: ${process.pid}`);
  console.log(`Node.js version: ${process.version}`);
});

// Auto-recovery mechanism
let restartCount = 0;
const MAX_RESTARTS = 5;

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  if (restartCount < MAX_RESTARTS) {
    restartCount++;
    console.log(`Attempting restart ${restartCount}/${MAX_RESTARTS}`);
    setTimeout(() => {
      process.exit(1); // Let the parent process restart us
    }, 1000);
  } else {
    console.error("Max restart attempts reached, exiting...");
    process.exit(1);
  }
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
