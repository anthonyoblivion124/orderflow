from scripts.sales_csv_helper import (
    parse_item_line,
    parse_transaction,
    summarize_group_sales,
    summarize_monthly_sales,
)


def test_item_name_removes_duplicate_code_prefix() -> None:
    parsed = parse_item_line(["Item - AC004, AC004 Gillette Mach 3 Razor"])
    assert parsed is not None

    item_code, item_name, total_qty = parsed
    assert item_code == "AC004"
    assert item_name == "Gillette Mach 3 Razor"
    assert total_qty is None


def test_parse_transaction_numbers_and_computed_amount() -> None:
    parsed = parse_transaction([
        "01/31/2025 10:30 AM",
        "VC-1001",
        "Paul Mitchell",
        "2",
        "1,500",
        "",
    ])
    assert parsed is not None

    sale_datetime, voucher, customer, qty, unit_price, amount = parsed
    assert sale_datetime == "01/31/2025 10:30 AM"
    assert voucher == "VC-1001"
    assert customer == "Paul Mitchell"
    assert qty == 2.0
    assert unit_price == 1500.0
    assert amount == 3000.0


def test_monthly_and_group_summaries() -> None:
    sales = [
        {
            "group_name": "Accessories",
            "sale_datetime": "01/31/2025 10:30 AM",
            "amount": 1000,
            "qty": 2,
        },
        {
            "group_name": "Accessories",
            "sale_datetime": "01/31/2025 11:00 AM",
            "amount": 500,
            "qty": 1,
        },
        {
            "group_name": "Skincare",
            "sale_datetime": "02/01/2025 09:15 AM",
            "amount": 200,
            "qty": 4,
        },
    ]

    monthly = summarize_monthly_sales(sales)
    groups = summarize_group_sales(sales)

    assert monthly == [
        {"month": "2025-01", "total_sales": 1500.0},
        {"month": "2025-02", "total_sales": 200.0},
    ]

    assert groups == [
        {
            "group_name": "Accessories",
            "line_count": 2,
            "total_qty": 3.0,
            "total_sales": 1500.0,
        },
        {
            "group_name": "Skincare",
            "line_count": 1,
            "total_qty": 4.0,
            "total_sales": 200.0,
        },
    ]
