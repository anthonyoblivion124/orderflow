from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any

ITEM_PATTERN = re.compile(r"^Item\s*-\s*(?P<code>[^,]+),\s*(?P<name>.+)$", re.IGNORECASE)
TOTAL_QTY_PATTERN = re.compile(r"Total\s*Qty\s*:\s*(\d+)", re.IGNORECASE)
DATE_PATTERN = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$", re.IGNORECASE)
AMOUNT_PATTERN = re.compile(r"^-?\d[\d,]*(\.\d+)?$")


@dataclass
class GroupRecord:
    group_name: str


@dataclass
class ItemRecord:
    group_name: str
    item_code: str
    item_name: str
    declared_total_qty: int | None


@dataclass
class SaleRecord:
    group_name: str
    item_code: str
    item_name: str
    sale_datetime: str
    voucher_no: str
    customer: str
    qty: float | None
    unit_price: float | None
    amount: float | None


def normalize_row(row: list[str]) -> list[str]:
    return [cell.strip() for cell in row]


def non_empty_cells(row: list[str]) -> list[str]:
    return [cell for cell in row if cell]


def parse_number(value: str) -> float | None:
    cleaned = value.replace(",", "").replace("$", "").strip()
    if not cleaned:
        return None
    try:
        return float(cleaned)
    except ValueError:
        return None


def first_matching(cells: list[str], pattern: re.Pattern[str]) -> str | None:
    for cell in cells:
        if pattern.search(cell):
            return cell
    return None


def strip_code_prefix_from_name(item_code: str, item_name: str) -> str:
    cleaned_name = item_name.strip()
    escaped_code = re.escape(item_code.strip())
    pattern = re.compile(rf"^(?:{escaped_code})(?:\b|\s|[-_/:.])\s*", re.IGNORECASE)

    while cleaned_name:
        updated = pattern.sub("", cleaned_name, count=1).strip()
        if updated == cleaned_name:
            break
        cleaned_name = updated

    return cleaned_name or item_name.strip()


def parse_item_line(cells: list[str]) -> tuple[str, str, int | None] | None:
    if not cells:
        return None
    first = cells[0]
    match = ITEM_PATTERN.match(first)
    if not match:
        return None

    total_qty: int | None = None
    for cell in cells:
        qty_match = TOTAL_QTY_PATTERN.search(cell)
        if qty_match:
            total_qty = int(qty_match.group(1))
            break

    item_code = match.group("code").strip()
    item_name = strip_code_prefix_from_name(item_code, match.group("name"))
    return item_code, item_name, total_qty


def is_group_line(cells: list[str]) -> bool:
    return any(cell == "အုပ်စု" or cell.lower() == "group" for cell in cells)


def parse_group_name(cells: list[str]) -> str:
    for cell in cells:
        if cell.startswith("-"):
            return cell[1:].strip()
    return next((cell for cell in cells if cell and cell not in {"အုပ်စု", "Group"}), "Unknown")


def is_page_break_line(cells: list[str]) -> bool:
    joined = " | ".join(cells)
    return "Print Date" in joined or "Page " in joined


def looks_like_transaction(cells: list[str]) -> bool:
    if not cells:
        return False
    return DATE_PATTERN.match(cells[0]) is not None


def parse_transaction(cells: list[str]) -> tuple[str, str, str, float | None, float | None, float | None]:
    sale_datetime = cells[0]

    voucher = ""
    customer = ""
    qty: float | None = None
    unit_price: float | None = None
    amount: float | None = None

    for index, cell in enumerate(cells[1:], start=1):
        if not voucher and "-" in cell and any(char.isdigit() for char in cell):
            voucher = cell
            if index + 1 < len(cells):
                customer = cells[index + 1]
            continue

        if AMOUNT_PATTERN.match(cell):
            number = parse_number(cell)
            if number is None:
                continue
            if qty is None:
                qty = number
            elif unit_price is None:
                unit_price = number
            else:
                amount = number

    if amount is None and qty is not None and unit_price is not None:
        amount = qty * unit_price

    return sale_datetime, voucher, customer, qty, unit_price, amount


def extract_sales_tables(csv_path: Path) -> dict[str, list[dict[str, Any]]]:
    groups: list[GroupRecord] = []
    items: list[ItemRecord] = []
    sales: list[SaleRecord] = []

    current_group = "Unknown"
    current_item_code = ""
    current_item_name = ""

    with csv_path.open("r", newline="", encoding="utf-8-sig") as file:
        reader = csv.reader(file)
        for row in reader:
            cells = non_empty_cells(normalize_row(row))
            if not cells:
                continue

            if is_page_break_line(cells):
                continue

            if is_group_line(cells):
                current_group = parse_group_name(cells)
                groups.append(GroupRecord(group_name=current_group))
                current_item_code = ""
                current_item_name = ""
                continue

            parsed_item = parse_item_line(cells)
            if parsed_item:
                current_item_code, current_item_name, total_qty = parsed_item
                items.append(
                    ItemRecord(
                        group_name=current_group,
                        item_code=current_item_code,
                        item_name=current_item_name,
                        declared_total_qty=total_qty,
                    )
                )
                continue

            if looks_like_transaction(cells) and current_item_code:
                sale_datetime, voucher, customer, qty, unit_price, amount = parse_transaction(cells)
                sales.append(
                    SaleRecord(
                        group_name=current_group,
                        item_code=current_item_code,
                        item_name=current_item_name,
                        sale_datetime=sale_datetime,
                        voucher_no=voucher,
                        customer=customer,
                        qty=qty,
                        unit_price=unit_price,
                        amount=amount,
                    )
                )

    unique_groups = sorted({group.group_name for group in groups})

    return {
        "groups": [group.__dict__ for group in groups],
        "unique_groups": [{"group_name": name} for name in unique_groups],
        "items": [item.__dict__ for item in items],
        "sales": [sale.__dict__ for sale in sales],
    }


def write_table(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8-sig")
        return

    headers = list(rows[0].keys())
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        writer.writerows(rows)


def export_tables(csv_path: Path, output_dir: Path) -> dict[str, Path]:
    tables = extract_sales_tables(csv_path)
    monthly = summarize_monthly_sales(tables["sales"])
    group_totals = summarize_group_sales(tables["sales"])
    output_paths = {
        "groups": output_dir / "groups.csv",
        "items": output_dir / "items.csv",
        "sales": output_dir / "sales.csv",
        "monthly_sales": output_dir / "monthly_sales.csv",
        "group_totals": output_dir / "group_totals.csv",
    }

    write_table(output_paths["groups"], tables["unique_groups"])
    write_table(output_paths["items"], tables["items"])
    write_table(output_paths["sales"], tables["sales"])
    write_table(output_paths["monthly_sales"], monthly)
    write_table(output_paths["group_totals"], group_totals)
    return output_paths


def summarize_monthly_sales(sales_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    monthly_totals: dict[str, float] = {}

    for row in sales_rows:
        sale_datetime = str(row.get("sale_datetime", "")).strip()
        amount_value = row.get("amount")
        amount = float(amount_value) if amount_value is not None else 0.0

        try:
            date = datetime.strptime(sale_datetime, "%m/%d/%Y %I:%M %p")
            month_key = date.strftime("%Y-%m")
        except ValueError:
            month_key = "unknown"

        monthly_totals[month_key] = monthly_totals.get(month_key, 0.0) + amount

    return [
        {"month": month, "total_sales": round(total, 2)}
        for month, total in sorted(monthly_totals.items(), key=lambda item: item[0])
    ]


def summarize_group_sales(sales_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    group_totals: dict[str, dict[str, float]] = {}

    for row in sales_rows:
        group_name = str(row.get("group_name", "Unknown")).strip() or "Unknown"
        qty_value = row.get("qty")
        amount_value = row.get("amount")

        qty = float(qty_value) if qty_value is not None else 0.0
        amount = float(amount_value) if amount_value is not None else 0.0

        if group_name not in group_totals:
            group_totals[group_name] = {"total_qty": 0.0, "total_sales": 0.0, "line_count": 0.0}

        group_totals[group_name]["total_qty"] += qty
        group_totals[group_name]["total_sales"] += amount
        group_totals[group_name]["line_count"] += 1.0

    rows: list[dict[str, Any]] = []
    for group_name, metrics in sorted(group_totals.items(), key=lambda item: item[0].lower()):
        rows.append(
            {
                "group_name": group_name,
                "line_count": int(metrics["line_count"]),
                "total_qty": round(metrics["total_qty"], 2),
                "total_sales": round(metrics["total_sales"], 2),
            }
        )

    return rows


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Extract structured tables from report-style sales CSV.")
    parser.add_argument("input", type=Path, help="Path to the raw CSV file")
    parser.add_argument(
        "--out",
        type=Path,
        default=Path("extracted"),
        help="Output folder for extracted tables",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    outputs = export_tables(args.input, args.out)
    print("Extracted tables:")
    for name, path in outputs.items():
        print(f"- {name}: {path}")


if __name__ == "__main__":
    main()
