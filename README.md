# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.


### Prompt

```
You are a senior Python engineer. Build a robust CSV extraction helper for a **report-style sales CSV** (not a flat table), similar to POS export reports.

## Goal
Create a Python module + CLI that parses a raw CSV and exports normalized tables:
1) groups.csv
2) items.csv
3) sales.csv
4) monthly_sales.csv
5) group_totals.csv

## Input format characteristics
- CSV may contain Myanmar text (UTF-8 / UTF-8 BOM).
- One file can contain multiple logical sections/tables.
- Rows include:
  - Group marker row (e.g., "အုပ်စု", "Group", then group name like "- Accessories")
  - Item header row (e.g., `Item - AC004, AC004 Gillette Mach 3 ...`, and possibly `Total Qty : N`)
  - Transaction rows (date-time + voucher + customer + qty + unit_price + amount)
  - Empty/page-break/noise rows

## Required parsing rules
- Detect item line with regex like:
  - `Item - <item_code>, <item_name>`
- Remove duplicated item code prefix in item name:
  - Example input name: `AC004 Gillette Mach 3 ...`
  - Output name: `Gillette Mach 3 ...`
- Parse numbers safely:
  - supports commas, empty cells, invalid numeric text
- Parse datetime format:
  - `%m/%d/%Y %I:%M %p`
- If amount is missing but qty and unit_price exist, compute amount = qty * unit_price.
- Preserve Myanmar text correctly when reading/writing.

## Output schemas
- groups.csv: `group_name`
- items.csv: `group_name, item_code, item_name, declared_total_qty`
- sales.csv: `group_name, item_code, item_name, sale_datetime, voucher_no, customer, qty, unit_price, amount`
- monthly_sales.csv: `month,total_sales` (month = `YYYY-MM`)
- group_totals.csv: `group_name,line_count,total_qty,total_sales`

## Technical requirements
- Python 3.11+
- Use dataclasses for internal records.
- Strong type hints.
- Modular functions:
  - normalize_row, non_empty_cells, parse_number
  - parse_group_name / is_group_line
  - parse_item_line
  - parse_transaction
  - extract_sales_tables
  - summarize_monthly_sales
  - summarize_group_sales
  - export_tables
- CLI:
  - `python sales_csv_helper.py input.csv --out extracted`
- Write output CSV with `encoding="utf-8-sig"` for Excel compatibility.
- Handle bad rows gracefully (skip with optional warning, do not crash).

## Deliverables
1) Complete `sales_csv_helper.py`
2) Example run command
3) Short README section describing assumptions and edge cases
4) Basic pytest tests for:
   - duplicated code cleanup in item name
   - transaction number parsing
   - monthly and group summaries

Keep code production-ready and readable.
```

```
<table border="1" cellspacing="0" cellpadding="6">
  <thead>
    <tr>
      <th rowspan="2">Date</th>
      <th rowspan="2">Company Name</th>
      <th rowspan="2">Total</th>

      <th colspan="3">Discount</th>
      <th colspan="3">Whole Sale</th>
      <th colspan="3">Debt</th>

      <th rowspan="2">Quantity</th>
      <th rowspan="2">POS Amount</th>
      <th rowspan="2">Change</th>
      <th rowspan="2">POS Amount + Change</th>
      <th rowspan="2">Cash Received</th>

      <th colspan="6">Banking</th>
      <th rowspan="2">Surplus / Deficit</th>
    </tr>

    <tr>
      <!-- Discount -->
      <th>YSB</th>
      <th>Gift</th>
      <th>Shop Discount</th>

      <!-- Wholesale -->
      <th>Customer Name</th>
      <th>Company Name</th>
      <th>Total</th>

      <!-- Debt -->
      <th>Customer Name</th>
      <th>Company Name</th>
      <th>Total</th>

      <!-- Banking -->
      <th>KPay (Personal)</th>
      <th>KPay (QR)</th>
      <th>AYA Pay</th>
      <th>KBZ Bank</th>
      <th>AYA Bank</th>
      <th>MAB Bank</th>
    </tr>
  </thead>

  <tbody>
    <tr>
      <td>31/01/2025</td>
      <td>Paul Mitchel</td>
      <td></td>

      <td></td>
      <td></td>
      <td></td>

      <td></td>
      <td></td>
      <td></td>

      <td></td>
      <td></td>
      <td></td>

      <td>1</td>
      <td>23,774,358</td>
      <td>125,000</td>
      <td>23,899,358</td>
      <td>13,552,600</td>

      <td>10,346,950</td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>
      <td></td>

      <td>192</td>
    </tr>
  </tbody>
</table>
```