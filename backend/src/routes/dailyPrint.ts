import { Router } from "express";
import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { supabase } from "../lib/supabase.js";
import { buildDailyPrintImportRows } from "../lib/dailyPrintCsv.js";
import { extractSalesByItemSummary } from "../lib/salesByItemSummary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = __filename.split("/").slice(0, -1).join("/");
const extractedDir = resolve(__dirname, "../../../extracted");

export const dailyPrintRouter = Router();

function isValidIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function toBoundedInt(value: unknown, fallback: number, min: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function toCsv(headers: string[], rows: Record<string, string | number | null>[]): string {
  const escapedHeaders = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
  const escapedRows = rows.map((row) =>
    headers.map((h) => {
      const val = row[h];
      if (val === null || val === undefined) return '""';
      const str = String(val);
      return `"${str.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [escapedHeaders, ...escapedRows].join("\n");
}

async function saveExtractedFiles(extracted: {
  reportDateIso: string;
  reportDateDisplay: string;
  groups: Array<{ groupName: string; total: number; quantity: number }>;
  items: Array<{ groupName: string; itemCode: string; itemName: string; declaredTotalQty: number | null }>;
  sales: Array<{
    groupName: string;
    itemCode: string;
    itemName: string;
    voucherNo: string;
    customer: string;
    qty: number | null;
    unitPrice: number | null;
    amount: number | null;
  }>;
}): Promise<void> {
  await mkdir(extractedDir, { recursive: true });

  const reportDateValue = extracted.reportDateDisplay || formatIsoAsDisplayDate(extracted.reportDateIso);

  const salesByGroup = new Map<string, number>();
  for (const sale of extracted.sales) {
    const key = sale.groupName.trim().toLowerCase();
    salesByGroup.set(key, (salesByGroup.get(key) ?? 0) + 1);
  }

  const groupRows = extracted.groups.map((g) => ({
    report_date: reportDateValue,
    group_name: g.groupName,
    line_count: salesByGroup.get(g.groupName.trim().toLowerCase()) ?? 0,
    total_qty: g.quantity,
    total_sales: g.total,
  }));
  await writeFile(
    join(extractedDir, "group_totals.csv"),
    toCsv(["report_date", "group_name", "line_count", "total_qty", "total_sales"], groupRows)
  );

  const groupOnlyRows = extracted.groups.map((g) => ({
    report_date: reportDateValue,
    group_name: g.groupName,
  }));
  await writeFile(join(extractedDir, "groups.csv"), toCsv(["report_date", "group_name"], groupOnlyRows));

  const itemRows = extracted.items.map((item) => ({
    report_date: reportDateValue,
    group_name: item.groupName,
    item_code: item.itemCode,
    item_name: item.itemName,
    declared_total_qty: item.declaredTotalQty,
  }));
  await writeFile(
    join(extractedDir, "items.csv"),
    toCsv(["report_date", "group_name", "item_code", "item_name", "declared_total_qty"], itemRows)
  );

  const salesRows = extracted.sales.map((sale) => ({
    report_date: reportDateValue,
    group_name: sale.groupName,
    item_code: sale.itemCode,
    item_name: sale.itemName,
    voucher_no: sale.voucherNo,
    customer: sale.customer,
    qty: sale.qty,
    unit_price: sale.unitPrice,
    amount: sale.amount,
  }));
  await writeFile(
    join(extractedDir, "sales.csv"),
    toCsv(
      ["report_date", "group_name", "item_code", "item_name", "voucher_no", "customer", "qty", "unit_price", "amount"],
      salesRows
    )
  );

  const monthlyTotal = extracted.groups.reduce((sum, group) => sum + group.total, 0);
  const month = /^\d{4}-\d{2}-\d{2}$/.test(extracted.reportDateIso)
    ? extracted.reportDateIso.slice(0, 7)
    : "";
  const monthlyRows = month ? [{ report_date: reportDateValue, month, total_sales: monthlyTotal }] : [];
  await writeFile(
    join(extractedDir, "monthly_sales.csv"),
    toCsv(["report_date", "month", "total_sales"], monthlyRows)
  );
}

function formatIsoAsDisplayDate(isoDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return isoDate;
  }

  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year} 12:00 AM`;
}

dailyPrintRouter.get("/daily-print/dates", async (_req, res) => {
  const { data, error } = await supabase
    .from("daily_print_rows")
    .select("report_date")
    .order("report_date", { ascending: false });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  const dates = Array.from(
    new Set((data ?? []).map((row) => row.report_date).filter(Boolean))
  );

  return res.json({ dates });
});

dailyPrintRouter.get("/daily-print", async (req, res) => {
  const reportDate = String(req.query.reportDate ?? "").trim();
  const limit = toBoundedInt(req.query.limit, 5000, 1, 10000);
  const offset = toBoundedInt(req.query.offset, 0, 0, 1_000_000);

  if (!reportDate) {
    return res.status(400).json({ error: "reportDate query param is required (YYYY-MM-DD)" });
  }

  if (!isValidIsoDate(reportDate)) {
    return res.status(400).json({ error: "Invalid reportDate format. Use YYYY-MM-DD." });
  }

  const { data, error } = await supabase
    .from("daily_print_rows")
    .select("*")
    .eq("report_date", reportDate)
    .range(offset, offset + limit - 1)
    .order("row_index", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ reportDate, limit, offset, rows: data ?? [] });
});

dailyPrintRouter.post("/daily-print/import", async (req, res) => {
  const csvText = String(req.body?.csvText ?? "");

  if (!csvText.trim()) {
    return res.status(400).json({ error: "csvText is required" });
  }

  try {
    const { reportDateIso, rows } = buildDailyPrintImportRows(csvText);

    const { error: deleteError } = await supabase
      .from("daily_print_rows")
      .delete()
      .eq("report_date", reportDateIso);

    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }

    const batchSize = 500;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from("daily_print_rows").insert(batch);
      if (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    return res.json({
      ok: true,
      reportDate: reportDateIso,
      importedRows: rows.length,
    });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to parse/import CSV",
    });
  }
});

dailyPrintRouter.post("/daily-print/import-sales-summary", async (req, res) => {
  const csvText = String(req.body?.csvText ?? "");
  const reportDateOverride = String(req.body?.reportDate ?? "").trim();

  if (!csvText.trim()) {
    return res.status(400).json({ error: "csvText is required" });
  }

  try {
    const extracted = extractSalesByItemSummary(csvText);

    // Use override if provided, otherwise use extracted date, otherwise fall back to today
    let reportDate = reportDateOverride || extracted.reportDateIso;

    if (!reportDate) {
      const today = new Date();
      reportDate = today.toISOString().split("T")[0];
    }

    if (!isValidIsoDate(reportDate)) {
      console.error(`Invalid reportDate: "${reportDate}" | override: "${reportDateOverride}" | extracted: "${extracted.reportDateIso}"`);
      return res.status(400).json({ error: `Invalid reportDate: ${reportDate}. Use YYYY-MM-DD.` });
    }

    const { data: existingRows, error: fetchError } = await supabase
      .from("daily_print_rows")
      .select("id, row_index, company_name")
      .eq("report_date", reportDate)
      .order("row_index", { ascending: true });

    if (fetchError) {
      return res.status(500).json({ error: fetchError.message });
    }

    const byCompanyName = new Map<string, { id: string; row_index: number; company_name: string | null }>();

    for (const row of existingRows ?? []) {
      const key = String(row.company_name ?? "").trim().toLowerCase();
      if (key) {
        byCompanyName.set(key, row);
      }
    }

    let updated = 0;

    for (const group of extracted.groups) {
      const key = group.groupName.trim().toLowerCase();
      const matched = byCompanyName.get(key);

      if (matched) {
        const { error } = await supabase
          .from("daily_print_rows")
          .update({
            total: group.total,
            quantity: group.quantity,
          })
          .eq("id", matched.id);

        if (error) {
          return res.status(500).json({ error: error.message });
        }

        updated += 1;
      }
    }

    try {
      await saveExtractedFiles({
        ...extracted,
        reportDateIso: reportDate,
        reportDateDisplay: extracted.reportDateDisplay || formatIsoAsDisplayDate(reportDate),
      });
    } catch (fileError) {
      console.error("Failed to save extracted files:", fileError);
    }

    return res.json({
      ok: true,
      reportDate,
      matchedGroups: extracted.groups.length,
      updatedRows: updated,
    });
  } catch (error) {
    return res.status(400).json({
      error:
        error instanceof Error
          ? error.message
          : "Failed to parse SalesByItemSummary CSV",
    });
  }
});
