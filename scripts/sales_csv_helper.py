from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any, Iterable

ITEM_PATTERN = re.compile(r"^Item\s*-\s*(?P<code>[^,]+),\s*(?P<name>.+)$", re.IGNORECASE)
TOTAL_QTY_PATTERN = re.compile(r"Total\s*Qty\s*:\s*(\d+)", re.IGNORECASE)
DATE_PATTERN = re.compile(r"^\d{1,2}/\d{1,2}/\d{4}\s+\d{1,2}:\d{2}\s+(AM|PM)$", re.IGNORECASE)


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


@dataclass
class ExtractionResult:
    groups: list[GroupRecord]
    items: list[ItemRecord]
    sales: list[SaleRecord]
    warnings: list[str]


def normalize_row(row: list[str]) -> list[str]:
    return [cell.replace("\ufeff", "").strip() for cell in row]


def non_empty_cells(row: list[str]) -> list[str]:
    return [cell for cell in row if cell and cell.strip()]


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
    matched_cell = first_matching(cells, ITEM_PATTERN)
    if not matched_cell:
        return None

    match = ITEM_PATTERN.match(matched_cell)
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
    return any(cell.strip().lower() in {"အုပ်စု", "group"} for cell in cells)


def parse_group_name(cells: list[str]) -> str:
    for cell in cells:
        if cell.startswith("-"):
            return cell[1:].strip()
    return next(
        (cell for cell in cells if cell and cell.lower() not in {"အုပ်စု", "group"}),
        "Unknown",
    )


def is_page_break_line(cells: list[str]) -> bool:
    joined = " | ".join(cells)
    lowered = joined.lower()
    return "print date" in lowered or "page " in lowered or "page:" in lowered


def looks_like_transaction(cells: list[str]) -> bool:
    return first_matching(cells, DATE_PATTERN) is not None


def parse_transaction(cells: list[str]) -> tuple[str, str, str, float | None, float | None, float | None] | None:
    dt_cell = first_matching(cells, DATE_PATTERN)
    if not dt_cell:
        return None

    dt_index = cells.index(dt_cell)
    tail = cells[dt_index + 1 :]

    voucher = ""
    customer = ""
    qty: float | None = None
    unit_price: float | None = None
    amount: float | None = None

    text_tokens: list[str] = []
    number_tokens: list[float] = []

    for cell in tail:
        number = parse_number(cell)
        if number is None:
            text_tokens.append(cell)
        else:
            number_tokens.append(number)

    for token in text_tokens:
        if any(char.isdigit() for char in token) and not voucher:
            voucher = token
        elif not customer:
            customer = token

    if number_tokens:
        qty = number_tokens[0]
    if len(number_tokens) > 1:
        unit_price = number_tokens[1]
    if len(number_tokens) > 2:
        amount = number_tokens[-1]

    if amount is None and qty is not None and unit_price is not None:
        amount = qty * unit_price

    return dt_cell, voucher, customer, qty, unit_price, amount


def _warn(messages: list[str], message: str, verbose: bool) -> None:
    messages.append(message)
    if verbose:
        print(f"[WARN] {message}")


def extract_sales_tables(csv_path: Path, verbose: bool = False) -> ExtractionResult:
    groups: list[GroupRecord] = []
    items: list[ItemRecord] = []
    sales: list[SaleRecord] = []
    warnings: list[str] = []

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

            if looks_like_transaction(cells):
                parsed_sale = parse_transaction(cells)
                if parsed_sale is None:
                    _warn(warnings, f"Skipped malformed transaction row: {cells}", verbose)
                    continue

                if not current_item_code:
                    _warn(
                        warnings,
                        f"Skipped transaction without active item context: {cells}",
                        verbose,
                    )
                    continue

                sale_datetime, voucher, customer, qty, unit_price, amount = parsed_sale
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
                continue

            _warn(warnings, f"Skipped unrecognized row: {cells}", verbose)

    unique_group_names = sorted({group.group_name for group in groups})
    if not unique_group_names and items:
        unique_group_names = sorted({item.group_name for item in items})

    unique_groups = [GroupRecord(group_name=name) for name in unique_group_names]

    return ExtractionResult(groups=unique_groups, items=items, sales=sales, warnings=warnings)


def dataclass_rows(records: Iterable[Any]) -> list[dict[str, Any]]:
    return [record.__dict__ for record in records]


def write_table(path: Path, rows: list[dict[str, Any]], headers: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as file:
        writer = csv.DictWriter(file, fieldnames=headers)
        writer.writeheader()
        if rows:
            writer.writerows(rows)


def export_tables(csv_path: Path, output_dir: Path, verbose: bool = False) -> dict[str, Path]:
    tables = extract_sales_tables(csv_path, verbose=verbose)
    sales_rows = dataclass_rows(tables.sales)
    monthly = summarize_monthly_sales(sales_rows)
    group_totals = summarize_group_sales(sales_rows)
    output_paths = {
        "groups": output_dir / "groups.csv",
        "items": output_dir / "items.csv",
        "sales": output_dir / "sales.csv",
        "monthly_sales": output_dir / "monthly_sales.csv",
        "group_totals": output_dir / "group_totals.csv",
    }

    write_table(output_paths["groups"], dataclass_rows(tables.groups), ["group_name"])
    write_table(
        output_paths["items"],
        dataclass_rows(tables.items),
        ["group_name", "item_code", "item_name", "declared_total_qty"],
    )
    write_table(
        output_paths["sales"],
        sales_rows,
        [
            "group_name",
            "item_code",
            "item_name",
            "sale_datetime",
            "voucher_no",
            "customer",
            "qty",
            "unit_price",
            "amount",
        ],
    )
    write_table(output_paths["monthly_sales"], monthly, ["month", "total_sales"])
    write_table(
        output_paths["group_totals"],
        group_totals,
        ["group_name", "line_count", "total_qty", "total_sales"],
    )

    if tables.warnings and verbose:
        print(f"Warnings: {len(tables.warnings)}")

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
            continue

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
    parser.add_argument(
        "--verbose",
        action="store_true",
        help="Print warnings for skipped/malformed rows",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    outputs = export_tables(args.input, args.out, verbose=args.verbose)
    print("Extracted tables:")
    for name, path in outputs.items():
        print(f"- {name}: {path}")


if __name__ == "__main__":
    main()
