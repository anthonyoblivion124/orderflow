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