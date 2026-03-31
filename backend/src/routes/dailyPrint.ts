import { Router } from "express";
import { supabase } from "../lib/supabase.js";

export const dailyPrintRouter = Router();

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

  if (!reportDate) {
    return res.status(400).json({ error: "reportDate query param is required (YYYY-MM-DD)" });
  }

  const { data, error } = await supabase
    .from("daily_print_rows")
    .select("*")
    .eq("report_date", reportDate)
    .order("row_index", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.json({ reportDate, rows: data ?? [] });
});
