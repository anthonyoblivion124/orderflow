import fs from "fs";
import path from "path";
import Link from "next/link";

import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const PREVIEW_ROW_LIMIT = 200;
const AVAILABLE_FILES = [
  "groups.csv",
  "items.csv",
  "sales.csv",
  "monthly_sales.csv",
  "group_totals.csv",
] as const;

function parseCsv(data: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let insideQuotes = false;

  for (let index = 0; index < data.length; index++) {
    const char = data[index];
    const next = data[index + 1];

    if (char === '"') {
      if (insideQuotes && next === '"') {
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
      if (char === "\r" && next === "\n") {
        index++;
      }

      currentRow.push(currentCell);
      rows.push(currentRow.map((cell) => cell.trim()));
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow.map((cell) => cell.trim()));
  }

  return rows.filter((row) => row.some((cell) => cell.length > 0));
}

export default function DailyPrintExtractedPreviewPage({
  searchParams,
}: {
  searchParams?: { file?: string };
}) {
  const requestedFile = (searchParams?.file || "sales.csv").trim();
  const selectedFile = AVAILABLE_FILES.includes(requestedFile as (typeof AVAILABLE_FILES)[number])
    ? requestedFile
    : "sales.csv";

  const extractedPath = path.join(process.cwd(), "extracted", selectedFile);
  let headers: string[] = [];
  let rows: string[][] = [];
  let errorMessage: string | null = null;

  try {
    if (!fs.existsSync(extractedPath)) {
      throw new Error(`File not found: extracted/${selectedFile}`);
    }

    const content = fs.readFileSync(extractedPath, "utf-8");
    const parsed = parseCsv(content);

    if (parsed.length === 0) {
      throw new Error("Selected extracted file is empty.");
    }

    headers = parsed[0] || [];
    rows = parsed.slice(1, PREVIEW_ROW_LIMIT + 1);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load extracted file";
  }

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title="Extracted Files Preview"
          description="View generated CSV outputs in web table format."
          action={
            <Button variant="outline" asChild>
              <Link href="/daily-print">Back to Daily Print</Link>
            </Button>
          }
        />

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FILES.map((fileName) => (
                <Button key={fileName} variant={selectedFile === fileName ? "default" : "outline"} asChild>
                  <Link href={`/daily-print/extracted?file=${encodeURIComponent(fileName)}`}>{fileName}</Link>
                </Button>
              ))}
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Showing up to {PREVIEW_ROW_LIMIT} rows from <span className="font-medium">{selectedFile}</span>
                </p>

                <div className="max-h-[70vh] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((header) => (
                          <TableHead key={header}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((row, rowIndex) => (
                        <TableRow key={`${selectedFile}-${rowIndex}`}>
                          {headers.map((_, cellIndex) => (
                            <TableCell key={`${rowIndex}-${cellIndex}`} className="whitespace-nowrap">
                              {row[cellIndex] ?? ""}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </MainAppLayout>
    </AuthGuard>
  );
}
