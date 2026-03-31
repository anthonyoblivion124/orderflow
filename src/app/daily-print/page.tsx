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
  const lines = data
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  return lines.map((line) => line.split(",").map((v) => v.trim()));
}

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

  // Extract headers from CSV
  const mainHeadersRow = csvData.length > 0 ? csvData[0] : [];
  const subHeadersRow = csvData.length > 1 ? csvData[1] : [];
  const dataRows = csvData.length > 2 ? csvData.slice(2) : [];

  // Build main headers with colspan
  const mainHeaders: { label: string; colspan: number }[] = [];
  let currentColspan = 0;
  let lastLabel = "";

  mainHeadersRow.forEach((cell) => {
    const trimmed = cell.trim();
    if (trimmed === "" || trimmed === lastLabel) {
      // Empty or duplicate means it's part of the colspan
      if (lastLabel) currentColspan++;
    } else {
      // New header
      if (lastLabel) {
        mainHeaders.push({ label: lastLabel, colspan: currentColspan });
      }
      lastLabel = trimmed;
      currentColspan = 1;
    }
  });
  // Add the last header
  if (lastLabel) {
    mainHeaders.push({ label: lastLabel, colspan: currentColspan });
  }

  const subHeaders = subHeadersRow.map((h) => h.trim());

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
                    {mainHeaders.map((header, index) => (
                      <TableHead
                        key={index}
                        colSpan={header.colspan}
                        className="text-center font-bold bg-muted"
                      >
                        {header.label}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    {subHeaders.map((header, index) => (
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
