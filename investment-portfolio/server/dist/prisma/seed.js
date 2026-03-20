"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcrypt.hash("demo123", 10);
    const user = await prisma.user.upsert({
        where: { username: "demo" },
        update: {},
        create: {
            username: "demo",
            email: "demo@example.com",
            passwordHash,
            role: "ADMIN",
        },
    });
    console.log("Created user:", user.username);
    const companies = [
        {
            symbol: "NABIL",
            companyName: "Nabil Bank Limited",
            sector: "Banking",
            instrumentType: "Equity",
            serialNumber: 1,
        },
        {
            symbol: "NTC",
            companyName: "Nepal Telecom",
            sector: "Telecom",
            instrumentType: "Equity",
            serialNumber: 2,
        },
        {
            symbol: "NICA",
            companyName: "NIC Asia Bank Limited",
            sector: "Banking",
            instrumentType: "Equity",
            serialNumber: 3,
        },
        {
            symbol: "SBL",
            companyName: "Siddhartha Bank Limited",
            sector: "Banking",
            instrumentType: "Equity",
            serialNumber: 4,
        },
        {
            symbol: "NLIC",
            companyName: "Nepal Life Insurance Company",
            sector: "Insurance",
            instrumentType: "Equity",
            serialNumber: 5,
        },
        {
            symbol: "UPPER",
            companyName: "Upper Tamakoshi Hydropower",
            sector: "Hydropower",
            instrumentType: "Equity",
            serialNumber: 6,
        },
    ];
    for (const c of companies) {
        await prisma.company.upsert({
            where: { symbol: c.symbol },
            update: {},
            create: c,
        });
    }
    console.log("Created", companies.length, "companies");
    const transactions = [
        {
            companySymbol: "NABIL",
            transactionDate: "2024-01-15",
            transactionType: "BUY",
            purchaseQuantity: 100,
            purchasePricePerUnit: 850,
            totalPurchaseAmount: 85000,
        },
        {
            companySymbol: "NABIL",
            transactionDate: "2024-03-20",
            transactionType: "BUY",
            purchaseQuantity: 50,
            purchasePricePerUnit: 870,
            totalPurchaseAmount: 43500,
        },
        {
            companySymbol: "NTC",
            transactionDate: "2024-02-10",
            transactionType: "BUY",
            purchaseQuantity: 200,
            purchasePricePerUnit: 620,
            totalPurchaseAmount: 124000,
        },
        {
            companySymbol: "NICA",
            transactionDate: "2024-01-20",
            transactionType: "BUY",
            purchaseQuantity: 150,
            purchasePricePerUnit: 580,
            totalPurchaseAmount: 87000,
        },
        {
            companySymbol: "NABIL",
            transactionDate: "2024-06-05",
            transactionType: "SELL",
            salesQuantity: 30,
            salesPricePerUnit: 920,
            totalSalesAmount: 27600,
        },
        {
            companySymbol: "SBL",
            transactionDate: "2024-04-15",
            transactionType: "BUY",
            purchaseQuantity: 300,
            purchasePricePerUnit: 310,
            totalPurchaseAmount: 93000,
        },
        {
            companySymbol: "NLIC",
            transactionDate: "2024-05-01",
            transactionType: "BUY",
            purchaseQuantity: 100,
            purchasePricePerUnit: 750,
            totalPurchaseAmount: 75000,
        },
        {
            companySymbol: "UPPER",
            transactionDate: "2024-03-10",
            transactionType: "BUY",
            purchaseQuantity: 200,
            purchasePricePerUnit: 345,
            totalPurchaseAmount: 69000,
        },
    ];
    for (const t of transactions) {
        await prisma.transaction.create({ data: t });
    }
    console.log("Created", transactions.length, "transactions");
    console.log("Seed completed successfully!");
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map