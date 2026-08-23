# Netlify full-stack deployment

This edition runs both the React frontend and backend API on Netlify. Supabase remains the PostgreSQL database. The old Spring Boot folder is kept only as a reference and is not used by Netlify.

## Architecture

Browser -> Netlify React site -> Netlify Function `/api/*` -> Supabase PostgreSQL

## Netlify build settings

- Base directory: `frontend`
- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory is configured by `frontend/netlify.toml`.

## Required Netlify environment variables

Set these under Project configuration -> Environment variables. Make them available to Functions.

- `DATABASE_URL` - use the Supabase Transaction pooler connection string (port 6543), for example:
  `postgresql://postgres.PROJECT_REF:YOUR_PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres`
- `JWT_SECRET` - at least 32 bytes; keep your current strong secret.
- `ADMIN_USERNAME` - e.g. `admin`
- `ADMIN_PASSWORD` - at least 8 characters
- `ADMIN_DISPLAY_NAME` - optional; default is `Administrator`
- `JWT_EXPIRATION_MS` - optional; default `86400000` (24 hours)

Remove `VITE_API_BASE_URL` from Netlify, or set it to `/api`. Do not point it to Render anymore. CORS is no longer needed because frontend and API use the same Netlify origin.

## Database

This serverless backend uses the same tables and data as the Spring Boot version. On the first API request in a new function instance it verifies/creates the schema, preserves existing rows, seeds missing years from 2024 through the current year, and synchronizes the configured admin password.

## Local test

Install Netlify CLI once: `npm install -g netlify-cli`

From `frontend`:

1. `npm install`
2. Create a local `.env` with `DATABASE_URL`, `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and optional `ADMIN_DISPLAY_NAME`. Use a test database if possible.
3. `netlify dev`
4. Open the URL printed by Netlify CLI.

## Feature parity

- Public dashboard, donation list, expenditure list
- Admin/user JWT login and session validation
- Admin donation CRUD, paid/unpaid tracking, Father / Mother Name
- Admin expenditure CRUD, total cost / paid / left tracking
- Cash-balance calculations
- Year closure and carry-forward safety checks
- User creation/listing
- Admin-only donation and expenditure PDF reports
- Existing Mustafapur branding, community photo, mobile-responsive UI
