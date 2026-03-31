export interface DailyPrintRow {
  id: string;
  row_index: number;
  report_date: string;
  company_name: string | null;
  total: string | number | null;
  discount_ysb: string | number | null;
  discount_gift: string | number | null;
  discount_shop_discount: string | number | null;
  wholesale_customer_name: string | null;
  wholesale_company_name: string | null;
  wholesale_total: string | number | null;
  debt_customer_name: string | null;
  debt_company_name: string | null;
  debt_total: string | number | null;
  quantity: string | number | null;
  pos_amount: string | number | null;
  change_amount: string | number | null;
  pos_amount_and_change: string | number | null;
  cash_received: string | number | null;
  banking_kpay_personal: string | number | null;
  banking_kpay_qr: string | number | null;
  banking_aya_pay: string | number | null;
  banking_kbz_bank: string | number | null;
  banking_aya_bank: string | number | null;
  banking_mab_bank: string | number | null;
  surplus_deficit: string | number | null;
}

function mapValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

export function toDailyPrintCells(row: DailyPrintRow): string[] {
  return [
    mapValue(row.company_name),
    mapValue(row.total),
    mapValue(row.discount_ysb),
    mapValue(row.discount_gift),
    mapValue(row.discount_shop_discount),
    mapValue(row.wholesale_customer_name),
    mapValue(row.wholesale_company_name),
    mapValue(row.wholesale_total),
    mapValue(row.debt_customer_name),
    mapValue(row.debt_company_name),
    mapValue(row.debt_total),
    mapValue(row.quantity),
    mapValue(row.pos_amount),
    mapValue(row.change_amount),
    mapValue(row.pos_amount_and_change),
    mapValue(row.cash_received),
    mapValue(row.banking_kpay_personal),
    mapValue(row.banking_kpay_qr),
    mapValue(row.banking_aya_pay),
    mapValue(row.banking_kbz_bank),
    mapValue(row.banking_aya_bank),
    mapValue(row.banking_mab_bank),
    mapValue(row.surplus_deficit),
  ];
}

export async function getAvailableReportDates(): Promise<string[]> {
  const backendUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const response = await fetch(`${backendUrl}/api/daily-print/dates`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch report dates (${response.status})`);
  }

  const payload = (await response.json()) as { dates?: string[] };
  const dates = Array.isArray(payload.dates) ? payload.dates : [];

  return dates;
}

export async function getDailyPrintRows(reportDateIso: string): Promise<DailyPrintRow[]> {
  if (!reportDateIso) {
    return [];
  }

  const backendUrl =
    process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

  const response = await fetch(
    `${backendUrl}/api/daily-print?reportDate=${encodeURIComponent(reportDateIso)}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch daily print rows (${response.status})`);
  }

  const payload = (await response.json()) as { rows?: DailyPrintRow[] };
  return Array.isArray(payload.rows) ? payload.rows : [];
}
