import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { buildDailyPrintImportRows } from "../lib/dailyPrintCsv.js";

dotenv.config();

function isMissingTableError(message: string): boolean {
  const lowered = message.toLowerCase();
  return (
    lowered.includes("could not find the table") ||
    lowered.includes("relation") && lowered.includes("does not exist")
  );
}

async function main() {
  const csvArg = process.argv[2] || "../DailyPrint.csv";
  const csvPath = path.resolve(process.cwd(), csvArg);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in backend .env");
  }

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found: ${csvPath}`);
  }

  const csvText = fs.readFileSync(csvPath, "utf-8");
  const { reportDateIso, rows: mappedRows } = buildDailyPrintImportRows(csvText);

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: deleteError } = await supabase
    .from("daily_print_rows")
    .delete()
    .eq("report_date", reportDateIso);

  if (deleteError) {
    if (isMissingTableError(deleteError.message)) {
      throw new Error(
        "Table public.daily_print_rows is missing. Run docs/supabase_schema.sql in Supabase SQL Editor, then retry import."
      );
    }
    throw new Error(`Failed to clear existing rows: ${deleteError.message}`);
  }

  const batchSize = 500;
  for (let i = 0; i < mappedRows.length; i += batchSize) {
    const batch = mappedRows.slice(i, i + batchSize);
    const { error } = await supabase.from("daily_print_rows").insert(batch);
    if (error) {
      if (isMissingTableError(error.message)) {
        throw new Error(
          "Table public.daily_print_rows is missing. Run docs/supabase_schema.sql in Supabase SQL Editor, then retry import."
        );
      }
      throw new Error(`Failed to insert rows ${i + 1}-${i + batch.length}: ${error.message}`);
    }
  }

  console.log(
    `Imported ${mappedRows.length} rows into daily_print_rows for report_date=${reportDateIso}`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
