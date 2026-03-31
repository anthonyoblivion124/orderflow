import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { buildDailyPrintImportRows } from "../lib/dailyPrintCsv.js";
import { extractSalesByItemSummary } from "../lib/salesByItemSummary.js";
export const dailyPrintRouter = Router();
function isValidIsoDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }
    const date = new Date(`${value}T00:00:00Z`);
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}
function toBoundedInt(value, fallback, min, max) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }
    return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
dailyPrintRouter.get("/daily-print/dates", async (_req, res) => {
    const { data, error } = await supabase
        .from("daily_print_rows")
        .select("report_date")
        .order("report_date", { ascending: false });
    if (error) {
        return res.status(500).json({ error: error.message });
    }
    const dates = Array.from(new Set((data ?? []).map((row) => row.report_date).filter(Boolean)));
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
    }
    catch (error) {
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
        const reportDate = reportDateOverride || extracted.reportDateIso;
        if (!isValidIsoDate(reportDate)) {
            return res.status(400).json({ error: "Invalid reportDate. Use YYYY-MM-DD." });
        }
        const { data: existingRows, error: fetchError } = await supabase
            .from("daily_print_rows")
            .select("id, row_index, company_name")
            .eq("report_date", reportDate)
            .order("row_index", { ascending: true });
        if (fetchError) {
            return res.status(500).json({ error: fetchError.message });
        }
        const byCompanyName = new Map();
        let maxRowIndex = 0;
        for (const row of existingRows ?? []) {
            const key = String(row.company_name ?? "").trim().toLowerCase();
            if (key) {
                byCompanyName.set(key, row);
            }
            if (row.row_index > maxRowIndex) {
                maxRowIndex = row.row_index;
            }
        }
        let updated = 0;
        let inserted = 0;
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
                continue;
            }
            maxRowIndex += 1;
            const { error } = await supabase.from("daily_print_rows").insert({
                report_date: reportDate,
                row_index: maxRowIndex,
                company_name: group.groupName,
                total: group.total,
                quantity: group.quantity,
            });
            if (error) {
                return res.status(500).json({ error: error.message });
            }
            inserted += 1;
        }
        return res.json({
            ok: true,
            reportDate,
            matchedGroups: extracted.groups.length,
            updatedRows: updated,
            insertedRows: inserted,
        });
    }
    catch (error) {
        return res.status(400).json({
            error: error instanceof Error
                ? error.message
                : "Failed to parse SalesByItemSummary CSV",
        });
    }
});
