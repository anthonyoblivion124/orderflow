export function parseDailyPrintCsv(data) {
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let insideQuotes = false;
    for (let index = 0; index < data.length; index++) {
        const char = data[index];
        const next = data[index + 1];
        if (char === '"') {
            if (insideQuotes && next === '"') {
                currentCell += '"';
                index++;
            }
            else {
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
            const normalized = currentRow.map((cell) => cell.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim());
            if (normalized.some((cell) => cell.length > 0)) {
                rows.push(normalized);
            }
            currentRow = [];
            currentCell = "";
            continue;
        }
        currentCell += char;
    }
    if (currentCell.length > 0 || currentRow.length > 0) {
        currentRow.push(currentCell);
        const normalized = currentRow.map((cell) => cell.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim());
        if (normalized.some((cell) => cell.length > 0)) {
            rows.push(normalized);
        }
    }
    return rows;
}
export function parseReportDateToIso(rawDate) {
    const parts = rawDate.trim().split("/");
    if (parts.length !== 3) {
        throw new Error(`Invalid report date in CSV: ${rawDate}`);
    }
    const [day, month, year] = parts;
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        throw new Error(`Invalid report date in CSV: ${rawDate}`);
    }
    return iso;
}
function asText(value) {
    const normalized = (value ?? "").trim();
    if (!normalized || normalized === "-") {
        return null;
    }
    return normalized;
}
function asNumber(value) {
    const normalized = (value ?? "").trim();
    if (!normalized || normalized === "-") {
        return null;
    }
    const numeric = Number(normalized.replace(/,/g, ""));
    return Number.isFinite(numeric) ? numeric : null;
}
export function rowToImport(reportDate, rowIndex, row) {
    const values = [...row];
    while (values.length < 23) {
        values.push("");
    }
    return {
        report_date: reportDate,
        row_index: rowIndex,
        company_name: asText(values[0]),
        total: asNumber(values[1]),
        discount_ysb: asNumber(values[2]),
        discount_gift: asNumber(values[3]),
        discount_shop_discount: asNumber(values[4]),
        wholesale_customer_name: asText(values[5]),
        wholesale_company_name: asText(values[6]),
        wholesale_total: asNumber(values[7]),
        debt_customer_name: asText(values[8]),
        debt_company_name: asText(values[9]),
        debt_total: asNumber(values[10]),
        quantity: asNumber(values[11]),
        pos_amount: asNumber(values[12]),
        change_amount: asNumber(values[13]),
        pos_amount_and_change: asNumber(values[14]),
        cash_received: asNumber(values[15]),
        banking_kpay_personal: asNumber(values[16]),
        banking_kpay_qr: asNumber(values[17]),
        banking_aya_pay: asNumber(values[18]),
        banking_kbz_bank: asNumber(values[19]),
        banking_aya_bank: asNumber(values[20]),
        banking_mab_bank: asNumber(values[21]),
        surplus_deficit: asNumber(values[22]),
    };
}
export function buildDailyPrintImportRows(csvText) {
    const rows = parseDailyPrintCsv(csvText);
    if (rows.length < 3) {
        throw new Error("CSV does not contain enough rows for daily print report format");
    }
    const reportDateIso = parseReportDateToIso(rows[0]?.[0] ?? "");
    const sourceRows = rows.slice(2).filter((row) => row.some((cell) => cell.trim().length > 0));
    const mappedRows = sourceRows.map((row, index) => rowToImport(reportDateIso, index + 1, row));
    return { reportDateIso, rows: mappedRows };
}
