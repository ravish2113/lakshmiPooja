# श्री श्री लक्ष्मी पूजा समिति मुस्तफापुर

# Lakshmi Pooja Financial Ledger

Spring Boot + React/Vite + PostgreSQL community donation and expenditure ledger.

## Fast local start

```bash
docker compose up --build
```

Open http://localhost.

Local-test admin defaults (change via `.env` if desired):

- username: `admin`
- password: `LocalTestOnly123!`

These defaults are for local Docker testing only. Production application configuration requires environment-provided credentials and JWT secret.

For Supabase + Koyeb + Netlify deployment and full verification steps, read `DEPLOYMENT_GUIDE.md`.

## Payment tracking and PDF reports

The ledger now supports:

- Donation status: `PAID` / `UNPAID`.
- Unpaid donations use payment mode `PENDING` and do not increase available cash until marked paid.
- Expenditure tracks `totalCost`, `paidAmount`, and calculated `leftAmount`.
- Dashboard shows total donations, paid/unpaid donations, total expenditure, paid expenditure, outstanding expenditure, and actual available cash.
- Year closure is blocked while donations are unpaid or expenditure has an outstanding balance.
- ADMIN users have a **Reports** page with yearly Donation PDF and Expenditure PDF downloads.
- Existing donations are migrated as `PAID`; existing expenditure rows are migrated as fully paid so historical balances stay unchanged.

The production database upgrade is handled automatically by Flyway migration `V2__payment_status_and_expenditure_tracking.sql` during the next backend deployment.
