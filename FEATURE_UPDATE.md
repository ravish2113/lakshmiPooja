# Payment Tracking + PDF Reports Update

## Donations
- New PAID / UNPAID status.
- UNPAID records automatically use PENDING payment mode.
- Only PAID donations are counted as cash received.

## Expenditures
- Replaced single amount with Total Cost + Paid Amount + calculated Left to Pay.
- Total Expenditure is total committed cost (paid + left).
- Available cash subtracts only the amount actually paid.

## Dashboard
- Shows donation total, paid and unpaid.
- Shows expenditure total, paid and outstanding.
- Available Cash = Opening Balance + Paid Donations - Paid Expenditure.

## Year Closure
- A year cannot be closed while donations are unpaid or expenditure still has money left to pay.

## PDF Reports
- ADMIN-only Reports menu.
- Donation PDF: date, donor, father/mother name, mode, status, amount, notes + totals.
- Expenditure PDF: date, item, category, vendor, total cost, paid, left, receipt, notes + totals.

## Database migration
Flyway V2 automatically upgrades an existing database. Existing donation records become PAID and existing expenditure records become fully paid, preserving historical balances.
