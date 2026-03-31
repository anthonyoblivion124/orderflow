"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AuthGuard from "@/components/auth/AuthGuard";
import MainAppLayout from "@/components/layout/MainAppLayout";
import PageHeader from "@/components/shared/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function DailyPrintImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"daily-print" | "sales-summary">("daily-print");
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState(false);

  const backendUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";
  }, []);

  const onUpload = async () => {
    if (!file) {
      setIsError(true);
      setMessage("Please choose a CSV file first.");
      return;
    }

    setIsUploading(true);
    setIsError(false);
    setMessage("");

    try {
      const csvText = await file.text();
      const importUrl =
        mode === "daily-print"
          ? `${backendUrl}/api/daily-print/import`
          : `${backendUrl}/api/daily-print/import-sales-summary`;
      const response = await fetch(importUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body:
          mode === "sales-summary"
            ? JSON.stringify({ csvText })
            : JSON.stringify({ csvText }),
      });

      const contentType = response.headers.get("content-type") || "";
      const rawBody = await response.text();

      if (!contentType.toLowerCase().includes("application/json")) {
        const preview = rawBody.slice(0, 120).replace(/\s+/g, " ").trim();
        throw new Error(
          `Import endpoint did not return JSON. URL: ${importUrl}. Response starts with: ${preview || "(empty)"}`
        );
      }

      const payload = JSON.parse(rawBody) as {
        ok?: boolean;
        error?: string;
        reportDate?: string;
        importedRows?: number;
        matchedGroups?: number;
        updatedRows?: number;
      };

      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || `Import failed (${response.status})`);
      }

      if (mode === "daily-print") {
        setMessage(
          `Import complete: ${payload.importedRows ?? 0} rows for ${payload.reportDate ?? "selected date"}.`
        );
      } else {
        setMessage(
          `Sales summary applied for ${payload.reportDate ?? "selected date"}: matched ${payload.matchedGroups ?? 0}, updated ${payload.updatedRows ?? 0}.`
        );
      }
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Import failed.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AuthGuard allowedRoles={["admin", "manager"]}>
      <MainAppLayout>
        <PageHeader
          title="Import Daily Print"
          description="Upload a report-style DailyPrint CSV and update daily_print_rows in database."
          action={
            <Button variant="outline" asChild>
              <Link href="/daily-print">Back to Daily Print</Link>
            </Button>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle>Upload CSV</CardTitle>
            <CardDescription>
              Choose import type: full DailyPrint replacement or SalesByItemSummary totals/qty update.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "daily-print"}
                  onChange={() => setMode("daily-print")}
                />
                DailyPrint CSV (replace report date rows)
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="mode"
                  checked={mode === "sales-summary"}
                  onChange={() => setMode("sales-summary")}
                />
                SalesByItemSummary CSV (update total + quantity)
              </label>
            </div>

            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />

            <div className="flex gap-2">
              <Button onClick={onUpload} disabled={!file || isUploading}>
                {isUploading ? "Uploading..." : "Upload and Import"}
              </Button>
              <Button variant="outline" asChild>
                <Link href="/daily-print">Cancel</Link>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Backend URL: <span className="font-medium">{backendUrl}</span>
            </p>

            {message ? (
              <p className={isError ? "text-sm text-red-600" : "text-sm text-green-700"}>{message}</p>
            ) : null}
          </CardContent>
        </Card>
      </MainAppLayout>
    </AuthGuard>
  );
}
