import MainAppLayout from "@/components/layout/MainAppLayout";
import AuthGuard from "@/components/auth/AuthGuard";
import PageHeader from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAvailableReportDates,
  getDailyPrintRows,
  toDailyPrintCells,
  type DailyPrintRow,
} from "@/lib/dailyPrintDb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TOTAL_COLUMNS = 23;

type HeaderCell = {
  label: string;
  rowSpan?: number;
  colSpan?: number;
};

const fixedMainHeaders = [
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
] satisfies HeaderCell[];

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

const leftAlignedColumns = new Set([0, 5, 6, 8, 9]);

function formatIsoDateForDisplay(isoDate: string): string {
  const parts = isoDate.split("-");
  if (parts.length !== 3) {
    return isoDate;
  }

  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
}

function getCellAlignmentClass(columnIndex: number): string {
  return leftAlignedColumns.has(columnIndex) ? "text-left" : "text-right";
}

function getPinnedCellClass(columnIndex: number): string {
  if (columnIndex === 0) {
    return "sticky left-0 z-20 min-w-[220px] bg-inherit";
  }

  if (columnIndex === 1) {
    return "sticky left-[220px] z-20 min-w-[140px] bg-inherit";
  }

  return "";
}

export default async function DailyPrintPage({
  searchParams,
}: {
  searchParams?: { reportDate?: string };
}) {
  let errorMessage: string | null = null;
  let availableDates: string[] = [];

  try {
    availableDates = await getAvailableReportDates();
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Failed to load daily print dates";
  }

  const requestedReportDate = searchParams?.reportDate?.trim() || "";
  const selectedReportDateIso =
    (requestedReportDate && availableDates.includes(requestedReportDate) ? requestedReportDate : "") ||
    availableDates[0] ||
    "";
  const selectedReportDateDisplay = selectedReportDateIso
    ? formatIsoDateForDisplay(selectedReportDateIso)
    : "-";

  let rows: DailyPrintRow[] = [];
  if (!errorMessage && selectedReportDateIso) {
    try {
      rows = await getDailyPrintRows(selectedReportDateIso);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : "Failed to load daily print data";
    }
  }

  const dataRows = rows.map((row) => {
    const values = toDailyPrintCells(row);
    while (values.length < TOTAL_COLUMNS) {
      values.push("");
    }
    return values.slice(0, TOTAL_COLUMNS);
  });

  return (
    <AuthGuard allowedRoles={["admin", "manager", "viewer"]}>
      <MainAppLayout>
        <PageHeader
          title="Daily Print"
          description="Daily sales summary from database."
        />

        <Card>
          <CardContent className="p-0">
            {errorMessage ? (
              <div className="p-6 text-red-600">{errorMessage}</div>
            ) : selectedReportDateIso.length === 0 ? (
              <div className="p-6 text-muted-foreground">No report dates found in database.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-4 py-3 text-sm">
                  <div className="flex items-center gap-2">
                    <form className="flex items-center gap-2" method="get">
                      <Input
                        type="date"
                        name="reportDate"
                        defaultValue={selectedReportDateIso}
                        className="w-[170px]"
                        aria-label="Select report date"
                      />
                      <Button type="submit" variant="outline" size="sm">
                        Apply
                      </Button>
                    </form>
                    <p className="text-muted-foreground">
                      Report Date: <span className="font-medium text-foreground">{selectedReportDateDisplay}</span>
                    </p>
                  </div>
                  <p className="text-muted-foreground">
                    Total Rows: <span className="font-medium text-foreground">{dataRows.length}</span>
                  </p>
                </div>

                <div className="max-h-[70vh] overflow-auto">
                <Table className="min-w-[1700px]">
                <TableHeader>
                  <TableRow>
                    {fixedMainHeaders.map((header, index) => (
                      <TableHead
                        key={index}
                        colSpan={header.colSpan}
                        rowSpan={header.rowSpan}
                        className={`sticky top-0 h-12 border-r bg-muted text-center font-semibold text-foreground ${
                          index === 0
                            ? "left-0 z-40 min-w-[220px]"
                            : index === 1
                              ? "left-[220px] z-40 min-w-[140px]"
                              : "z-30"
                        }`}
                      >
                        {header.label}
                      </TableHead>
                    ))}
                  </TableRow>
                  <TableRow>
                    {fixedSubHeaders.map((header, index) => (
                      <TableHead
                        key={index}
                        className="sticky top-12 z-30 h-11 border-r bg-muted/90 text-center font-medium"
                      >
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dataRows.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className={rowIndex % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                      {row.map((cell, cellIndex) => (
                        <TableCell
                          key={cellIndex}
                          className={`whitespace-nowrap border-r px-3 py-2 ${getCellAlignmentClass(cellIndex)} ${getPinnedCellClass(cellIndex)}`}
                        >
                          {cell}
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
