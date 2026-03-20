import { Transaction, Company } from "@/types/api";
import * as ExcelJS from "exceljs";

export interface ExcelTransactionRow {
  SN: number;
  SYMBOL: string;
  "Company Name": string;
  SYMBOL2: string;
  Sector: string;
  SYMBOL3: string;
  Instrument: string;
  "Bill No": string;
  "Txn Date": string;
  "Txn Type": "BUY" | "SELL";
  "Purchase QTY": number;
  PPPU: number; // Purchase Price Per Unit
  "Total Purchase Amount": number;
  "Sales Qty": number;
  "Sales Price": number;
  "Sales Amt": number;
  "TC AP NFRS": number; // Transaction Cost
  "Closing Unit": number;
  "WACC NFRS": number;
  "P/L NFRS": number;
  "Purchase Commission": number;
  "DP Charges": number;
  "Total Commission on Purchase": number;
  "Sales Commission": number;
  "DP Charges Sales": number;
  "Total Commission on Sales": number;
  "Capital Gain Tax": number;
  "Net Receivables": number;
  "TC AP TAX": number;
  "WACC AP TAX": number;
  "P/L AP TAX": number;
}

export interface ExcelCompanyRow {
  SN: number;
  SYMBOL: string;
  "Company Name": string;
  SYMBOL2: string;
  Sector: string;
  SYMBOL3: string;
  Instrument: string;
}

/**
 * Convert transactions to Excel format matching the original structure
 */
export async function exportTransactionsToExcel(
  transactions: Transaction[],
  companies: Company[],
): Promise<ArrayBuffer> {
  // Create workbook
  const wb = new ExcelJS.Workbook();

  // 1. Listed Companies Sheet
  const companiesWS = wb.addWorksheet("LISTED COMPANIES");
  const companiesData: ExcelCompanyRow[] = companies.map((company, index) => ({
    SN: index + 1,
    SYMBOL: company.symbol,
    "Company Name": company.companyName,
    SYMBOL2: company.symbol2 || "",
    Sector: company.sector || "",
    SYMBOL3: company.symbol3 || "",
    Instrument: company.instrumentType || "Equity",
  }));

  // Add headers
  companiesWS.columns = [
    { header: "SN", key: "SN", width: 10 },
    { header: "SYMBOL", key: "SYMBOL", width: 15 },
    { header: "Company Name", key: "Company Name", width: 30 },
    { header: "SYMBOL2", key: "SYMBOL2", width: 15 },
    { header: "Sector", key: "Sector", width: 20 },
    { header: "SYMBOL3", key: "SYMBOL3", width: 15 },
    { header: "Instrument", key: "Instrument", width: 15 },
  ];

  companiesWS.addRows(companiesData);

  // 2. Monthly Summary Sheet
  const monthlyWS = wb.addWorksheet("Monthly Summary");
  const monthlySummaryData = generateMonthlySummaryData(transactions);

  monthlyWS.columns = [
    { header: "Month", key: "Month", width: 15 },
    { header: "Total Buy", key: "Total Buy", width: 15 },
    { header: "Total Sell", key: "Total Sell", width: 15 },
    { header: "Net", key: "Net", width: 15 },
  ];

  monthlyWS.addRows(monthlySummaryData);

  // 3. Company-wise sheets (like the original Excel)
  const companyGroups = groupTransactionsByCompany(transactions);

  companyGroups.forEach((companyTxns, symbol) => {
    const company = companies.find((c) => c.symbol === symbol);
    const companyName = company?.companyName || symbol;

    // Create company statement data
    const companyData = generateCompanyStatementData(companyTxns, companyName);
    const companyWS = wb.addWorksheet(
      symbol.replace(/[^a-zA-Z0-9]/g, "").substring(0, 31),
    );

    // Add columns for company data
    if (companyData.length > 0) {
      const headers = Object.keys(companyData[0]);
      companyWS.columns = headers.map((header) => ({
        header,
        key: header,
        width: 15,
      }));
      companyWS.addRows(companyData);
    }
  });

  // 4. Validation Sheet
  const validationWS = wb.addWorksheet("VALIDATION");
  const validationData = generateValidationData();

  if (validationData.length > 0) {
    const headers = Object.keys(validationData[0]);
    validationWS.columns = headers.map((header) => ({
      header,
      key: header,
      width: 15,
    }));
    validationWS.addRows(validationData);
  }

  // Generate Excel file
  const excelBuffer = await wb.xlsx.writeBuffer();
  return excelBuffer as ArrayBuffer;
}

/**
 * Import transactions from Excel file
 */
export async function importTransactionsFromExcel(file: File): Promise<{
  transactions: Partial<Transaction>[];
  companies: Partial<Company>[];
  errors: string[];
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(arrayBuffer);

    const transactions: Partial<Transaction>[] = [];
    const companies: Partial<Company>[] = [];
    const errors: string[] = [];

    // Import companies from LISTED COMPANIES sheet
    const companiesWS = wb.getWorksheet("LISTED COMPANIES");
    if (companiesWS) {
      const companiesData: ExcelCompanyRow[] = [];
      companiesWS.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const values = row.values as any[];
        if (values[2] && values[3]) {
          // SYMBOL and Company Name
          companiesData.push({
            SN: values[1],
            SYMBOL: values[2],
            "Company Name": values[3],
            SYMBOL2: values[4] || "",
            Sector: values[5] || "",
            SYMBOL3: values[6] || "",
            Instrument: values[7] || "Equity",
          });
        } else {
          errors.push(
            `Row ${rowNumber} in companies sheet: Missing required fields`,
          );
        }
      });

      companiesData.forEach((row) => {
        companies.push({
          symbol: row.SYMBOL,
          companyName: row["Company Name"],
          symbol2: row.SYMBOL2,
          sector: row.Sector,
          symbol3: row.SYMBOL3,
          instrumentType: row.Instrument,
        });
      });
    }

    // Import transactions from company sheets
    wb.eachSheet((worksheet) => {
      if (
        worksheet.name === "LISTED COMPANIES" ||
        worksheet.name === "VALIDATION" ||
        worksheet.name === "Monthly Summary"
      ) {
        return;
      }

      const transactionData: ExcelTransactionRow[] = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        const values = row.values as any[];
        if (values[10]) {
          // Txn Type
          transactionData.push({
            SN: values[1],
            SYMBOL: values[2],
            "Company Name": values[3],
            SYMBOL2: values[4] || "",
            Sector: values[5] || "",
            SYMBOL3: values[6] || "",
            Instrument: values[7] || "",
            "Bill No": values[8] || "",
            "Txn Date": values[9] || "",
            "Txn Type": values[10],
            "Purchase QTY": values[11] || 0,
            PPPU: values[12] || 0,
            "Total Purchase Amount": values[13] || 0,
            "Sales Qty": values[14] || 0,
            "Sales Price": values[15] || 0,
            "Sales Amt": values[16] || 0,
            "TC AP NFRS": values[17] || 0,
            "Closing Unit": values[18] || 0,
            "WACC NFRS": values[19] || 0,
            "P/L NFRS": values[20] || 0,
            "Purchase Commission": values[21] || 0,
            "DP Charges": values[22] || 0,
            "Total Commission on Purchase": values[23] || 0,
            "Sales Commission": values[24] || 0,
            "DP Charges Sales": values[25] || 0,
            "Total Commission on Sales": values[26] || 0,
            "Capital Gain Tax": values[27] || 0,
            "Net Receivables": values[28] || 0,
            "TC AP TAX": values[29] || 0,
            "WACC AP TAX": values[30] || 0,
            "P/L AP TAX": values[31] || 0,
          });
        }
      });

      transactionData.forEach((row) => {
        transactions.push({
          companySymbol: row.SYMBOL,
          billNo: row["Bill No"],
          transactionDate: row["Txn Date"],
          transactionType: row["Txn Type"],
          purchaseQuantity: row["Txn Type"] === "BUY" ? row["Purchase QTY"] : 0,
          purchasePricePerUnit: row["Txn Type"] === "BUY" ? row.PPPU : 0,
          totalPurchaseAmount:
            row["Txn Type"] === "BUY" ? row["Total Purchase Amount"] : 0,
          salesQuantity: row["Txn Type"] === "SELL" ? row["Sales Qty"] : 0,
          salesPricePerUnit:
            row["Txn Type"] === "SELL" ? row["Sales Price"] : 0,
          totalSalesAmount: row["Txn Type"] === "SELL" ? row["Sales Amt"] : 0,
          principalCostNfrs: row["TC AP NFRS"],
          unitSum: row["Closing Unit"],
          waccNfrs: row["WACC NFRS"],
          profitLossNfrs: row["P/L NFRS"],
          purchaseCommission:
            row["Txn Type"] === "BUY" ? row["Purchase Commission"] : 0,
          purchaseDpCharges: row["Txn Type"] === "BUY" ? row["DP Charges"] : 0,
          totalPurchaseCommission:
            row["Txn Type"] === "BUY" ? row["Total Commission on Purchase"] : 0,
          salesCommission:
            row["Txn Type"] === "SELL" ? row["Sales Commission"] : 0,
          salesDpCharges:
            row["Txn Type"] === "SELL" ? row["DP Charges Sales"] : 0,
          totalSalesCommission:
            row["Txn Type"] === "SELL" ? row["Total Commission on Sales"] : 0,
          capitalGainTax: row["Capital Gain Tax"],
          netReceivables: row["Net Receivables"],
          tcTax: row["TC AP TAX"],
          waccTax: row["WACC AP TAX"],
          profitLossTax: row["P/L AP TAX"],
        });
      });
    });

    return { transactions, companies, errors };
  } catch (error) {
    return {
      transactions: [],
      companies: [],
      errors: [`Failed to read Excel file: ${error}`],
    };
  }
}

/**
 * Generate monthly summary data similar to the Excel structure
 */
function generateMonthlySummaryData(transactions: Transaction[]): any[] {
  const monthlyData = new Map<string, any>();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.transactionDate);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    if (!monthlyData.has(monthKey)) {
      monthlyData.set(monthKey, {
        Month: monthKey,
        "Total Buy": 0,
        "Total Sell": 0,
        Net: 0,
      });
    }

    const monthData = monthlyData.get(monthKey)!;
    if (transaction.transactionType === "BUY") {
      monthData["Total Buy"] += transaction.totalPurchaseAmount || 0;
    } else {
      monthData["Total Sell"] += transaction.totalSalesAmount || 0;
    }
    monthData.Net = monthData["Total Sell"] - monthData["Total Buy"];
  });

  return Array.from(monthlyData.values());
}

/**
 * Group transactions by company symbol
 */
function groupTransactionsByCompany(
  transactions: Transaction[],
): Map<string, Transaction[]> {
  const grouped = new Map<string, Transaction[]>();

  transactions.forEach((transaction) => {
    const symbol = transaction.companySymbol || "";
    if (!grouped.has(symbol)) {
      grouped.set(symbol, []);
    }
    grouped.get(symbol)!.push(transaction);
  });

  return grouped;
}

/**
 * Generate company statement data
 */
function generateCompanyStatementData(
  transactions: Transaction[],
  companyName: string,
): any[] {
  return transactions.map((transaction, index) => ({
    SN: index + 1,
    SYMBOL: transaction.companySymbol,
    "Company Name": companyName,
    "Bill No": transaction.billNo,
    "Txn Date": transaction.transactionDate,
    "Txn Type": transaction.transactionType,
    "Purchase QTY": transaction.purchaseQuantity || 0,
    PPPU: transaction.purchasePricePerUnit || 0,
    "Total Purchase Amount": transaction.totalPurchaseAmount || 0,
    "Sales Qty": transaction.salesQuantity || 0,
    "Sales Price": transaction.salesPricePerUnit || 0,
    "Sales Amt": transaction.totalSalesAmount || 0,
    "TC AP NFRS": transaction.principalCostNfrs || 0,
    "Closing Unit": transaction.unitSum || 0,
    "WACC NFRS": transaction.waccNfrs || 0,
    "P/L NFRS": transaction.profitLossNfrs || 0,
    "Purchase Commission": transaction.purchaseCommission || 0,
    "DP Charges": transaction.purchaseDpCharges || 0,
    "Total Commission on Purchase": transaction.totalPurchaseCommission || 0,
    "Sales Commission": transaction.salesCommission || 0,
    "DP Charges Sales": transaction.salesDpCharges || 0,
    "Total Commission on Sales": transaction.totalSalesCommission || 0,
    "Capital Gain Tax": transaction.capitalGainTax || 0,
    "Net Receivables": transaction.netReceivables || 0,
    "TC AP TAX": transaction.tcTax || 0,
    "WACC AP TAX": transaction.waccTax || 0,
    "P/L AP TAX": transaction.profitLossTax || 0,
  }));
}

/**
 * Generate validation data
 */
function generateValidationData(): any[] {
  return [
    {
      "Validation Check": "Total Buy = Total Sell + Closing Balance",
      Status: "Pending",
      Remarks: "Verify all transactions are balanced",
    },
    {
      "Validation Check": "No Duplicate Bill Numbers",
      Status: "Pending",
      Remarks: "Check for duplicate transactions",
    },
    {
      "Validation Check": "Date Sequence",
      Status: "Pending",
      Remarks: "Verify transaction dates are in sequence",
    },
  ];
}
