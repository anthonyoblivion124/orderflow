import fs from "fs";
import path from "path";

import MainAppLayout from "@/components/layout/MainAppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function parseCsv(data: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < data.length; index++) {
    const char = data[index];
    const nextChar = data[index + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        index++;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (char === "," && !insideQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !insideQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index++;
      }

      currentRow.push(currentCell);
      const normalizedRow = currentRow.map((cell) =>
        cell.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
      );

      if (normalizedRow.some((cell) => cell.length > 0)) {
        rows.push(normalizedRow);
      }

      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    const normalizedRow = currentRow.map((cell) =>
      cell.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
    );
    if (normalizedRow.some((cell) => cell.length > 0)) {
      rows.push(normalizedRow);
    }
  }

  return rows;
}

const TOTAL_COLUMNS = 24;

const fixedMainHeaders = [
  { label: "Date", rowSpan: 2 },
  { label: "Company Name", rowSpan: 2 },
  { label: "Total", rowSpan: 2 },
  { label: "Discount", colSpan: 3 },
  { label: "Whole Sale", colSpan: 3 },
  { label: "Debt", colSpan: 3 },
  { label: "Quantity", rowSpan: 2 },
  { label: "POS Amount", rowSpan: 2 },
  { label: "Change", rowSpan: 2 },
  { label: "POS Amount + Change", rowSpan: 2 },
  { label: "Cash Received", rowSpan: 2 },
  { label: "Banking", colSpan: 6 },
  { label: "Surplus / Deficit", rowSpan: 2 },
] as const;

const fixedSubHeaders = [
  "YSB",
  "Gift",
  "Shop Discount",
  "Customer Name",
  "Company Name",
  "Total",
  "Customer Name",
  "Company Name",
  "Total",
  "KPay (Personal)",
  "KPay (QR)",
  "AYA Pay",
  "KBZ Bank",
  "AYA Bank",
  "MAB Bank",
] as const;

export default function DailyPrintPage() {
  const csvPath = path.join(process.cwd(), "DailyPrint.csv");
  let csvData: string[][] = [];
  let errorMessage: string | null = null;

  try {
    if (!fs.existsSync(csvPath)) {
      throw new Error("DailyPrint.csv not found in project root");
    }

    const csvContent = fs.readFileSync(csvPath, "utf-8");
    csvData = parseCsv(csvContent);

    if (csvData.length === 0) {
      throw new Error("CSV file is empty");
    }
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load CSV";
  }

  const reportDate = csvData[0]?.[0] ?? "";
  const sourceRows = csvData.length > 2 ? csvData.slice(2) : [];
  const dataRows = sourceRows
    .filter((row) => row.some((cell) => cell.trim().length > 0))
    .map((row) => {
      const companyAndValues = [...row];
      while (companyAndValues.length < TOTAL_COLUMNS - 1) {
        companyAndValues.push("");
      }

      return [reportDate, ...companyAndValues.slice(0, TOTAL_COLUMNS - 1)];
    });

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title="Daily Print"
          description="Display DailyPrint.csv contents (temporary CSV view, replace with DB soon)."
        />

        <Card>
          <CardContent className="overflow-x-auto p-0">
            {errorMessage ? (
              <div className="p-6 text-red-600">{errorMessage}</div>
            ) : csvData.length === 0 ? (
              <div className="p-6 text-muted-foreground">No data available in DailyPrint.csv.</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {fixedMainHeaders.map((header, index) => (
                      <TableHead
                        key={index}
                        colSpan={header.colSpan}
                        rowSpan={header.rowSpan}
                        className="text-center font-bold bg-muted"
                      >
                        {header.label}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    {fixedSubHeaders.map((header, index) => (
                      <TableHead key={index} className="text-center">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="text-center">
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </MainAppLayout>
    </AuthGuard>
  );
}
