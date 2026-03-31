# OrderFlow

OrderFlow uses a split architecture:

- Frontend: Next.js app in the repository root
- Backend: Express + TypeScript API in [backend](backend)

## Daily Print (Current Scope)

Daily Print is fully database-backed.

- Frontend page: [src/app/daily-print/page.tsx](src/app/daily-print/page.tsx)
- Import page: [src/app/daily-print/import/page.tsx](src/app/daily-print/import/page.tsx)
- Frontend data client: [src/lib/dailyPrintDb.ts](src/lib/dailyPrintDb.ts)
- Backend route: [backend/src/routes/dailyPrint.ts](backend/src/routes/dailyPrint.ts)

## Run Frontend

```bash
npm install
npm run dev
```

## Run Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend default URL: `http://localhost:4000`

## Backend API

- `GET /health`
- `GET /api/daily-print/dates`
- `GET /api/daily-print?reportDate=YYYY-MM-DD&limit=5000&offset=0`
- `POST /api/daily-print/import` with JSON `{ "csvText": "..." }`
- `POST /api/daily-print/import-sales-summary` with JSON `{ "csvText": "...", "reportDate": "YYYY-MM-DD" }`

## Environment Setup

### Root `.env.local`

Copy from [`.env.example`](.env.example):

- `BACKEND_URL=http://localhost:4000`
- `NEXT_PUBLIC_BACKEND_URL=http://localhost:4000`

### Backend `.env`

Copy from [`backend/.env.example`](backend/.env.example):

- `PORT=4000`
- `FRONTEND_URL=http://localhost:9002`
- `SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`

## Supabase Schema

Run SQL from [docs/supabase_schema.sql](docs/supabase_schema.sql).

## Import DailyPrint.csv into Database

From the backend folder:

```bash
npm run import:daily-print
```

Optional custom file path:

```bash
npm run import:daily-print -- ../DailyPrint.csv
```

This importer:

- parses report-style CSV safely (quoted commas/newlines)
- maps rows into `daily_print_rows`
- clears existing rows for the same `report_date` before insert

SalesByItemSummary update flow:

- Upload `SalesByItemSummary.csv` from the Daily Print Import page
- Backend aggregates by group from item transactions
- Updates matching Daily Print rows by `company_name` for `total` and `quantity`
- Inserts missing groups as new Daily Print rows for that report date

## Sales CSV Extraction Helper (Python)

Script: [scripts/sales_csv_helper.py](scripts/sales_csv_helper.py)

Example run:

```bash
python scripts/sales_csv_helper.py input.csv --out extracted --verbose
```

Outputs:

- `groups.csv`
- `items.csv`
- `sales.csv`
- `monthly_sales.csv`
- `group_totals.csv`

Assumptions and edge cases:

- Input is a report-style CSV (not flat), encoded as UTF-8/UTF-8 BOM.
- Group rows are identified by `Group` or `အုပ်စု` markers.
- Item rows follow `Item - <item_code>, <item_name>` and remove duplicate code prefix in name.
- Invalid/empty numeric cells are parsed as `None`; malformed rows are skipped safely.
- If transaction `amount` is missing but `qty` and `unit_price` exist, amount is computed.
- Monthly summary uses `%m/%d/%Y %I:%M %p`; invalid date rows are excluded from monthly totals.

Tests:

```bash
pytest scripts/tests/test_sales_csv_helper.py
```
#backend


PORT=4000
FRONTEND_URL=http://localhost:9002
SUPABASE_URL=https://avopnpohapyfadnkdtvx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2b3BucG9oYXB5ZmFkbmtkdHZ4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3NzM2NywiZXhwIjoyMDkwNTUzMzY3fQ.0a802X5C39bOLktLPJAyeQK8NyI7nlU5oT8XbCHBlZo

#Frontend
BACKEND_URL=http://localhost:4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
