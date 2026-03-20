const XLSX = require("xlsx");
const fs = require("fs");

try {
  // Read the Excel file with error handling
  console.log("Reading Excel file...");

  // Try to read the file as buffer first
  const fileBuffer = fs.readFileSync(
    "/home/samujjwal/Developments/finance/New JCL Investment F.Y 2082_83 .xlsx",
  );
  console.log("File size:", fileBuffer.length, "bytes");

  // Parse the Excel file
  const workbook = XLSX.read(fileBuffer, {
    type: "buffer",
    cellDates: true,
    cellNF: false,
    cellText: false,
  });

  console.log("Available sheets:", workbook.SheetNames);

  // Look for transaction data in company sheets
  const allTransactions = [];
  const companySheets = workbook.SheetNames.filter(
    (name) =>
      name !== "LISTED COMPANIES" &&
      name !== "VALIDATION" &&
      name !== "Monthly Summary",
  );

  console.log("\n=== Processing Company Sheets ===");
  console.log("Company sheets to process:", companySheets.length);

  companySheets.forEach((sheetName, index) => {
    if (index < 5) {
      // Process first 5 sheets as sample
      console.log(`\n--- Processing ${sheetName} ---`);
      const worksheet = workbook.Sheets[sheetName];

      // Convert to JSON to see structure
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: "",
        raw: false,
        dateNF: "yyyy-mm-dd",
      });

      console.log(`Rows in ${sheetName}:`, jsonData.length);

      if (jsonData.length > 0) {
        console.log("Headers:", jsonData[0]);

        // Look for transaction-like data
        const dataRows = jsonData
          .slice(1)
          .filter((row) => row && row.length > 0);
        if (dataRows.length > 0) {
          console.log("Sample data row:", dataRows[0]);

          // Try to identify transaction columns
          const headers = jsonData[0];
          const transactionData = dataRows
            .map((row) => {
              const obj = {};
              headers.forEach((header, colIndex) => {
                if (
                  header &&
                  row[colIndex] !== undefined &&
                  row[colIndex] !== null &&
                  row[colIndex] !== ""
                ) {
                  const cleanHeader = header.toString().trim();
                  let cleanValue = row[colIndex];

                  // Handle different data types
                  if (typeof cleanValue === "string") {
                    cleanValue = cleanValue.toString().trim();
                    // Try to convert numbers
                    if (cleanValue && !isNaN(cleanValue) && cleanValue !== "") {
                      cleanValue = parseFloat(cleanValue);
                    }
                  }

                  obj[cleanHeader] = cleanValue;
                }
              });

              // Add company symbol
              obj.CompanySymbol = sheetName;
              return obj;
            })
            .filter((obj) => Object.keys(obj).length > 1); // Filter out empty rows

          if (transactionData.length > 0) {
            console.log(
              `Found ${transactionData.length} transaction records in ${sheetName}`,
            );
            allTransactions.push(...transactionData);
          }
        }
      }
    }
  });

  console.log("\n=== Summary ===");
  console.log("Total transactions found:", allTransactions.length);

  if (allTransactions.length > 0) {
    console.log("Sample transaction:", allTransactions[0]);

    // Save all transactions
    fs.writeFileSync(
      "/home/samujjwal/Developments/finance/investment-portfolio/extracted-transactions.json",
      JSON.stringify(allTransactions, null, 2),
    );
    console.log("Transactions saved to: extracted-transactions.json");

    // Create import-ready Excel file
    const importData = allTransactions.map((transaction) => {
      // Try to map to our expected format
      return {
        "Company Symbol": transaction.CompanySymbol || "",
        "Transaction Type": "BUY", // Default to BUY
        "Transaction Date": "2026-03-19", // Default date
        "Bill No":
          transaction["Bill No"] ||
          transaction["Bill"] ||
          transaction["SN"] ||
          "",
        "Purchase Quantity":
          transaction["Quantity"] ||
          transaction["Qty"] ||
          transaction["Units"] ||
          0,
        "Purchase Price Per Unit":
          transaction["Price"] ||
          transaction["Rate"] ||
          transaction["Cost"] ||
          0,
        "Total Purchase Amount":
          transaction["Amount"] || transaction["Total"] || 0,
        "Sales Quantity": 0,
        "Sales Price Per Unit": 0,
        "Total Sales Amount": 0,
      };
    });

    // Create new workbook with transaction data
    const ws = XLSX.utils.json_to_sheet(importData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");

    // Write the cleaned Excel file
    const cleanedExcelBuffer = XLSX.write(wb, {
      bookType: "xlsx",
      type: "buffer",
    });
    fs.writeFileSync(
      "/home/samujjwal/Developments/finance/investment-portfolio/ready-to-import.xlsx",
      cleanedExcelBuffer,
    );
    console.log("Import-ready Excel file saved to: ready-to-import.xlsx");
  } else {
    console.log("No transaction data found in the company sheets");

    // Let's also check the Monthly Summary sheet
    console.log("\n=== Checking Monthly Summary Sheet ===");
    if (workbook.SheetNames.includes("Monthly Summary")) {
      const monthlySheet = workbook.Sheets["Monthly Summary"];
      const monthlyData = XLSX.utils.sheet_to_json(monthlySheet, {
        header: 1,
        defval: "",
        raw: false,
        dateNF: "yyyy-mm-dd",
      });

      console.log("Monthly Summary rows:", monthlyData.length);
      if (monthlyData.length > 0) {
        console.log("Monthly Summary headers:", monthlyData[0]);
        if (monthlyData.length > 1) {
          console.log("Monthly Summary sample:", monthlyData[1]);
        }
      }
    }
  }
} catch (error) {
  console.error("Error processing Excel file:", error.message);
  console.error("Stack:", error.stack);
}
