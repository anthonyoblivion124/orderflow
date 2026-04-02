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

const AVAILABLE_FILES = [
  "groups.csv",
  "items.csv",
  "sales.csv",
  "monthly_sales.csv",
  "group_totals.csv",
] as const;

const PAGE_SIZE_OPTIONS = [200, 500, 1000] as const;

function toPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.floor(parsed);
}

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

export default async function DailyPrintExtractedPreviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ file?: string; page?: string; pageSize?: string }>;
}) {
  const params = await searchParams;
  const requestedFile = (params?.file || "sales.csv").trim();
  const selectedFile = AVAILABLE_FILES.includes(requestedFile as (typeof AVAILABLE_FILES)[number])
    ? requestedFile
    : "sales.csv";
  const requestedPageSize = toPositiveInt(params?.pageSize, 500);
  const pageSize = PAGE_SIZE_OPTIONS.includes(requestedPageSize as (typeof PAGE_SIZE_OPTIONS)[number])
    ? requestedPageSize
    : 500;
  const requestedPage = toPositiveInt(params?.page, 1);

  const extractedPath = path.join(process.cwd(), "extracted", selectedFile);
  let headers: string[] = [];
  let rows: string[][] = [];
  let totalRows = 0;
  let page = 1;
  let totalPages = 1;
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
    const allRows = parsed.slice(1);
    totalRows = allRows.length;
    totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
    page = Math.min(requestedPage, totalPages);
    const startIndex = (page - 1) * pageSize;
    rows = allRows.slice(startIndex, startIndex + pageSize);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load extracted file";
  }

  const pageStart = totalRows === 0 ? 0 : (page - 1) * pageSize + 1;
  const pageEnd = Math.min(page * pageSize, totalRows);

  const buildHref = (nextPage: number, nextPageSize = pageSize) =>
    `/daily-print/upload-excel/extracted?file=${encodeURIComponent(selectedFile)}&page=${nextPage}&pageSize=${nextPageSize}`;

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title="Extracted Files Preview"
          description="View generated CSV outputs in web table format."
          action={
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/daily-print/upload-excel">Back to Upload Excel</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/daily-print">Back to Daily Print</Link>
              </Button>
            </div>
          }
        />

        <Card>
          <CardContent className="space-y-4 p-4">
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FILES.map((fileName) => (
                <Button key={fileName} variant={selectedFile === fileName ? "default" : "outline"} asChild>
                  <Link href={`/daily-print/upload-excel/extracted?file=${encodeURIComponent(fileName)}&page=1&pageSize=${pageSize}`}>
                    {fileName}
                  </Link>
                </Button>
              ))}
            </div>

            {errorMessage ? (
              <p className="text-sm text-red-600">{errorMessage}</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Showing {pageStart}-{pageEnd} of {totalRows} rows from <span className="font-medium">{selectedFile}</span>
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <Button key={option} variant={option === pageSize ? "default" : "outline"} size="sm" asChild>
                      <Link href={buildHref(1, option)}>{option} / page</Link>
                    </Button>
                  ))}
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled={page <= 1} asChild>
                      <Link href={buildHref(Math.max(1, page - 1))}>Previous</Link>
                    </Button>
                    <span className="text-sm text-muted-foreground">Page {page} / {totalPages}</span>
                    <Button variant="outline" size="sm" disabled={page >= totalPages} asChild>
                      <Link href={buildHref(Math.min(totalPages, page + 1))}>Next</Link>
                    </Button>
                  </div>
                </div>

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
