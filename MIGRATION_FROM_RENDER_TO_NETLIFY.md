# Move backend from Render to Netlify Functions

## 1. Keep Supabase exactly as it is
Do not delete, reset, or recreate the Supabase project. Existing users, donations, expenditures, payment status, Father / Mother Name, year closures, and balances stay in the same PostgreSQL tables.

## 2. Use Supabase Transaction Pooler for Netlify
Netlify Functions are serverless, so use Supabase transaction pooling on port 6543.

For this Supabase project the shape is:

`postgresql://postgres.imxxmyjdzsqtvzxqywnu:[YOUR-PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`

The safest method is Supabase -> Connect -> Transaction pooler -> copy the full connection string and replace the password placeholder locally. If your database password contains URL-reserved characters, use the connection string supplied by Supabase / URL-encode the password.

## 3. Netlify environment variables
In Netlify -> Project configuration -> Environment variables, add:

- `DATABASE_URL` = Supabase Transaction Pooler string (port 6543)
- `JWT_SECRET` = the same strong JWT secret you currently use, at least 32 bytes
- `ADMIN_USERNAME` = your admin username, e.g. `admin`
- `ADMIN_PASSWORD` = your chosen admin password, minimum 8 characters
- `ADMIN_DISPLAY_NAME` = optional, e.g. `Administrator`
- `JWT_EXPIRATION_MS` = optional; default is `86400000`

The frontend is hard-wired to same-origin `/api`, so the old `VITE_API_BASE_URL` is no longer used. `CORS_ALLOWED_ORIGINS` is also no longer needed.

## 4. Netlify build settings
Keep:

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`

Functions are automatically picked up from `frontend/netlify/functions` through `frontend/netlify.toml`.

## 5. Deploy
Push this code to GitHub. Netlify should rebuild automatically. After the deploy is published, test:

- `/api/public/years`
- Public dashboard
- Admin login
- Add/edit/delete donation
- Paid/unpaid donation
- Add/edit/delete expenditure
- Total cost / paid / left to pay
- Dashboard totals and available cash
- User creation
- Donation PDF
- Expenditure PDF
- Year closure and carry-forward

## 6. Render
Only after Netlify API tests pass, you may suspend/delete the Render service. The database remains in Supabase, so removing Render does not remove ledger data.
