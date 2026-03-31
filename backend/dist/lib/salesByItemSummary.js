const DATE_TIME_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/i;
const GROUP_MARKER_PATTERN = /^(group|အုပ်စု)$/i;
const FROM_DATE_PATTERN = /\bfrom\s+(\d{1,2}\/\d{1,2}\/\d{4})\b/i;
function parseReportCsv(data) {
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
function parseNumber(value) {
    const normalized = value.replace(/,/g, "").trim();
    if (!normalized || normalized === "-") {
        return null;
    }
    const number = Number(normalized);
    return Number.isFinite(number) ? number : null;
}
function normalizeGroupName(cell) {
    return cell.replace(/^[-\s]+/, "").trim();
}
function parseIsoDateFromMmddyyyy(mmddyyyy) {
    const parts = mmddyyyy.split("/");
    if (parts.length !== 3) {
        throw new Error(`Invalid date format: ${mmddyyyy}`);
    }
    const [month, day, year] = parts;
    const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        throw new Error(`Invalid date format: ${mmddyyyy}`);
    }
    return iso;
}
export function extractSalesByItemSummary(csvText) {
    const rows = parseReportCsv(csvText);
    if (rows.length === 0) {
        throw new Error("CSV is empty");
    }
    let reportDateIso = "";
    const aggregates = new Map();
    let currentGroup = "";
    for (const row of rows) {
        if (!reportDateIso) {
            for (const cell of row) {
                const match = cell.match(FROM_DATE_PATTERN);
                if (match?.[1]) {
                    reportDateIso = parseIsoDateFromMmddyyyy(match[1]);
                    break;
                }
            }
        }
        const groupMarkerIndex = row.findIndex((cell) => GROUP_MARKER_PATTERN.test(cell));
        if (groupMarkerIndex >= 0) {
            const candidate = row
                .slice(groupMarkerIndex + 1)
                .map(normalizeGroupName)
                .find((value) => value.length > 0);
            if (candidate) {
                currentGroup = candidate;
                if (!aggregates.has(currentGroup)) {
                    aggregates.set(currentGroup, { groupName: currentGroup, total: 0, quantity: 0 });
                }
            }
            continue;
        }
        const dateIndex = row.findIndex((cell) => DATE_TIME_PATTERN.test(cell));
        if (dateIndex < 0 || !currentGroup) {
            continue;
        }
        const numericTokens = row.slice(dateIndex + 1).map(parseNumber).filter((value) => value !== null);
        if (numericTokens.length < 2) {
            continue;
        }
        const qty = numericTokens[0] ?? 0;
        const amount = numericTokens[numericTokens.length - 1] ?? 0;
        const existing = aggregates.get(currentGroup);
        if (existing) {
            existing.quantity += qty;
            existing.total += amount;
        }
    }
    if (!reportDateIso) {
        throw new Error("Could not detect report date (From MM/DD/YYYY)");
    }
    return {
        reportDateIso,
        groups: Array.from(aggregates.values()).filter((item) => item.quantity > 0 || item.total > 0),
    };
}
