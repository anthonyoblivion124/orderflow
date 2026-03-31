type GroupAggregate = {
  groupName: string;
  total: number;
  quantity: number;
};

type ItemExtract = {
  groupName: string;
  itemCode: string;
  itemName: string;
  declaredTotalQty: number | null;
};

type SaleExtract = {
  groupName: string;
  itemCode: string;
  itemName: string;
  voucherNo: string;
  customer: string;
  qty: number | null;
  unitPrice: number | null;
  amount: number | null;
};

const DATE_TIME_PATTERN = /^\d{1,2}\/\d{1,2}\/\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$/i;
const GROUP_MARKER_PATTERN = /^(group|အုပ်စု)$/i;
const FROM_DATE_PATTERN = /\bfrom\s+(\d{1,2}\/\d{1,2}\/\d{4})\b/i;
const ITEM_PATTERN = /^Item\s*-\s*([^,]+),\s*(.+)$/i;
const TOTAL_QTY_PATTERN = /Total\s*Qty\s*:\s*(\d+)/i;

function parseReportCsv(data: string): string[][] {
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
      const normalized = currentRow.map((cell) =>
        cell.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
      );

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
    const normalized = currentRow.map((cell) =>
      cell.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim()
    );
    if (normalized.some((cell) => cell.length > 0)) {
      rows.push(normalized);
    }
  }

  return rows;
}

function parseNumber(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();
  if (!normalized || normalized === "-") {
    return null;
  }

  const number = Number(normalized);
  return Number.isFinite(number) ? number : null;
}

function normalizeGroupName(cell: string): string {
  return cell.replace(/^[-\s]+/, "").trim();
}

function firstMatch(cells: string[], pattern: RegExp): string | null {
  for (const cell of cells) {
    if (pattern.test(cell)) {
      return cell;
    }
  }
  return null;
}

function parseItemLine(cells: string[]): { itemCode: string; itemName: string; declaredTotalQty: number | null } | null {
  const itemCell = firstMatch(cells, ITEM_PATTERN);
  if (!itemCell) {
    return null;
  }

  const match = itemCell.match(ITEM_PATTERN);
  if (!match) {
    return null;
  }

  let declaredTotalQty: number | null = null;
  for (const cell of cells) {
    const qtyMatch = cell.match(TOTAL_QTY_PATTERN);
    if (qtyMatch?.[1]) {
      declaredTotalQty = Number(qtyMatch[1]);
      break;
    }
  }

  return {
    itemCode: match[1]?.trim() || "",
    itemName: match[2]?.trim() || "",
    declaredTotalQty: Number.isFinite(declaredTotalQty) ? declaredTotalQty : null,
  };
}

function parseTransactionRow(cells: string[]): {
  voucherNo: string;
  customer: string;
  qty: number | null;
  unitPrice: number | null;
  amount: number | null;
} | null {
  const dateIndex = cells.findIndex((cell) => DATE_TIME_PATTERN.test(cell));
  if (dateIndex < 0) {
    return null;
  }

  const tail = cells.slice(dateIndex + 1).map((value) => value.trim()).filter(Boolean);
  if (tail.length === 0) {
    return null;
  }

  const textTokens: string[] = [];
  const numericTokens: number[] = [];

  for (const token of tail) {
    const numeric = parseNumber(token);
    if (numeric === null) {
      textTokens.push(token);
    } else {
      numericTokens.push(numeric);
    }
  }

  const voucherNo = textTokens[0] || "";
  const customer = textTokens[1] || "";
  const qty = numericTokens.length > 0 ? numericTokens[0] : null;
  const unitPrice = numericTokens.length > 1 ? numericTokens[1] : null;
  const amount = numericTokens.length > 0 ? numericTokens[numericTokens.length - 1] : null;

  return {
    voucherNo,
    customer,
    qty,
    unitPrice,
    amount,
  };
}

function parseIsoDateFromDdmmyyyy(ddmmyyyy: string): string {
  const parts = ddmmyyyy.split("/");
  if (parts.length !== 3) {
    throw new Error(`Invalid date format: ${ddmmyyyy}`);
  }

  const [day, month, year] = parts;
  const iso = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    throw new Error(`Invalid date format: ${ddmmyyyy}`);
  }
  return iso;
}

export function extractSalesByItemSummary(csvText: string): {
  reportDateIso: string;
  reportDateDisplay: string;
  groups: GroupAggregate[];
  items: ItemExtract[];
  sales: SaleExtract[];
} {
  const rows = parseReportCsv(csvText);
  if (rows.length === 0) {
    throw new Error("CSV is empty");
  }

  let reportDateIso = "";
  let reportDateDisplay = "";
  const aggregates = new Map<string, GroupAggregate>();
  const items: ItemExtract[] = [];
  const sales: SaleExtract[] = [];
  let currentGroup = "";
  let currentItemCode = "";
  let currentItemName = "";

  for (const row of rows) {
    if (!reportDateDisplay) {
      const transactionCell = row.find((cell) => DATE_TIME_PATTERN.test(cell));
      if (transactionCell) {
        reportDateDisplay = transactionCell.trim();
      }
    }

    if (!reportDateIso) {
      for (const cell of row) {
        const match = cell.match(FROM_DATE_PATTERN);
        if (match?.[1]) {
          try {
            reportDateIso = parseIsoDateFromDdmmyyyy(match[1]);
          } catch {
            // Date parsing failed, will use fallback
          }
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
        currentItemCode = "";
        currentItemName = "";
        if (!aggregates.has(currentGroup)) {
          aggregates.set(currentGroup, { groupName: currentGroup, total: 0, quantity: 0 });
        }
      }
      continue;
    }

    const parsedItem = parseItemLine(row);
    if (parsedItem) {
      currentItemCode = parsedItem.itemCode;
      currentItemName = parsedItem.itemName;
      items.push({
        groupName: currentGroup,
        itemCode: parsedItem.itemCode,
        itemName: parsedItem.itemName,
        declaredTotalQty: parsedItem.declaredTotalQty,
      });
      continue;
    }

    const parsedTransaction = parseTransactionRow(row);
    if (!parsedTransaction || !currentGroup || !currentItemCode) {
      continue;
    }

    const qty = parsedTransaction.qty ?? 0;
    const amount = parsedTransaction.amount ?? 0;

    sales.push({
      groupName: currentGroup,
      itemCode: currentItemCode,
      itemName: currentItemName,
      voucherNo: parsedTransaction.voucherNo,
      customer: parsedTransaction.customer,
      qty: parsedTransaction.qty,
      unitPrice: parsedTransaction.unitPrice,
      amount: parsedTransaction.amount,
    });

    const existing = aggregates.get(currentGroup);
    if (existing) {
      existing.quantity += qty;
      existing.total += amount;
    }
  }

  return {
    reportDateIso: reportDateIso || "",
    reportDateDisplay: reportDateDisplay || "",
    groups: Array.from(aggregates.values()).filter((item) => item.quantity > 0 || item.total > 0),
    items,
    sales,
  };
}
