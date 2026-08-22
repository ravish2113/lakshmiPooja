# Lakshmi Pooja Ledger — Local Test and Free Deployment Guide

## What was fixed

- Removed visible/default production admin credentials from the application UI/config.
- Cloud secrets are now required through environment variables.
- Completed the ADMIN Users page and `/api/admin/users` list/create flow.
- Public donation API no longer returns flat/house details or private notes.
- Added a safety rule so closing year N cannot overwrite year N+1 opening balance when year N+1 already contains transactions.
- Year-close backend errors are shown to the administrator.
- Seed years are future-proof: 2024 through the current year are created when missing.
- Frontend API base can be configured with `VITE_API_BASE_URL` for Netlify/Koyeb.
- Local Vite development proxies `/api` to `localhost:8080` automatically.
- Backend Dockerfile now uses a Maven build stage and runs the final container as a non-root user.
- Added Spring Boot Actuator health endpoint at `/actuator/health` for cloud health checks.
- Added Netlify SPA configuration.

## 1. Local test — easiest method (Docker Desktop)

Prerequisites: Docker Desktop running.

From the project root:

```bash
# Optional: copy sample environment configuration
cp .env.example .env

# Build and start PostgreSQL + backend + frontend
docker compose up --build
```

Windows PowerShell equivalent for the optional copy:

```powershell
Copy-Item .env.example .env
docker compose up --build
```

Open:

- Application: http://localhost
- Backend health: http://localhost:8080/actuator/health

Default LOCAL-TEST login if you do not create a `.env` file:

- Username: `admin`
- Password: `LocalTestOnly123!`

These local defaults are in `docker-compose.yml` only. Production deployment must use different secrets.

Stop:

```bash
docker compose down
```

Reset the local database completely:

```bash
docker compose down -v
docker compose up --build
```

## 2. Local test — frontend/backend separately

Start PostgreSQL first (Docker is easiest):

```bash
docker compose up postgres -d
```

Set backend environment variables and run Spring Boot from `backend/` using Maven/IDE. Required variables:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/pooja_ledger
SPRING_DATASOURCE_USERNAME=pooja
SPRING_DATASOURCE_PASSWORD=pooja_password
JWT_SECRET=replace-with-a-long-random-secret-at-least-32-characters
ADMIN_USERNAME=admin
ADMIN_PASSWORD=LocalTestOnly123!
ADMIN_DISPLAY_NAME=Administrator
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost
```

Then from `frontend/`:

```bash
npm install
npm run dev
```

Open http://localhost:5173. Vite proxies `/api` to `http://localhost:8080`.

## 3. Put the project on GitHub

Create an empty repository, then from this project root:

```bash
git init
git add .
git commit -m "Lakshmi Pooja Ledger production-ready"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
git push -u origin main
```

Do not commit `.env` or any real passwords. `.gitignore` already excludes `.env`.

## 4. Create the free PostgreSQL database on Supabase

1. Create a Supabase account and a new Free project.
2. Save the database password.
3. In the project dashboard choose **Connect**.
4. Select **Session pooler** (port 5432), not Transaction pooler.
5. Record:
   - pooler host, e.g. `aws-0-REGION.pooler.supabase.com`
   - username, typically `postgres.PROJECT_REF`
   - database name `postgres`
   - your database password
6. You do NOT manually create the tables. Spring Boot Flyway runs `V1__create_schema.sql` automatically on first backend start.

Use these Koyeb values:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres.YOUR_PROJECT_REF
SPRING_DATASOURCE_PASSWORD=YOUR_SUPABASE_DATABASE_PASSWORD
```

## 5. Deploy the Spring Boot backend to Koyeb

1. Sign in to Koyeb and choose **Create Web Service**.
2. Choose **GitHub** and select your repository.
3. Builder: **Dockerfile**.
4. Work directory: `backend`.
5. Dockerfile location: `Dockerfile`.
6. Choose the **Free** instance if available for your account.
7. Exposed port: `8080` using HTTP.
8. Health check path: `/actuator/health`.
9. Add these environment variables/secrets:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://YOUR_SESSION_POOLER_HOST:5432/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres.YOUR_PROJECT_REF
SPRING_DATASOURCE_PASSWORD=YOUR_SUPABASE_DATABASE_PASSWORD
JWT_SECRET=YOUR_LONG_RANDOM_SECRET
ADMIN_USERNAME=YOUR_ADMIN_USERNAME
ADMIN_PASSWORD=YOUR_STRONG_ADMIN_PASSWORD
ADMIN_DISPLAY_NAME=Administrator
CORS_ALLOWED_ORIGINS=https://YOUR-NETLIFY-SITE.netlify.app
```

A suitable JWT secret can be generated locally with:

```bash
openssl rand -base64 48
```

10. Deploy.
11. Copy the Koyeb public domain, for example:

```text
https://lakshmi-pooja-api-xxxx.koyeb.app
```

12. Test:

```text
https://lakshmi-pooja-api-xxxx.koyeb.app/actuator/health
```

It should report `UP`.

Note: Koyeb Free instances sleep after inactivity, so the first request after a long idle period can be slower.

## 6. Deploy the React frontend to Netlify

1. Sign in to Netlify and choose **Add new project / Import an existing project**.
2. Connect the same GitHub repository.
3. Set **Base directory** to `frontend`.
4. Build command: `npm run build`.
5. Publish directory: `dist`.
6. Under **Project configuration → Environment variables**, add:

```text
VITE_API_BASE_URL=https://YOUR-KOYEB-DOMAIN.koyeb.app/api
```

7. Deploy/publish the site.
8. Copy the final Netlify URL, e.g.:

```text
https://lakshmi-pooja-ledger.netlify.app
```

9. Return to Koyeb and set:

```text
CORS_ALLOWED_ORIGINS=https://lakshmi-pooja-ledger.netlify.app
```

Then redeploy/restart the Koyeb service.

If you later add a custom frontend domain, include both domains separated by commas, e.g.:

```text
CORS_ALLOWED_ORIGINS=https://lakshmi-pooja-ledger.netlify.app,https://pooja.example.com
```

## 7. First production test

Perform these checks in order:

1. Open the Netlify URL without logging in.
2. Verify years/dashboard load.
3. Verify public donations show donor names and amounts but NOT flat/house details.
4. Login using the production `ADMIN_USERNAME` / `ADMIN_PASSWORD` configured in Koyeb.
5. Add one small test donation.
6. Edit it.
7. Delete it.
8. Add one test expenditure, edit it, then delete it.
9. Open Users and create a USER account.
10. Log out and verify that USER can view authenticated records but cannot add/edit/delete.
11. Verify `/actuator/health` reports `UP`.

## 8. Important year-close behavior

Closing a year is intentionally strict:

- negative balance cannot be closed;
- an already closed year cannot be closed again;
- if the next year already contains transactions, the previous year cannot be closed because doing so would rewrite the next year's opening balance;
- close years in chronological order.

This protects ledger integrity.

## 9. Backup recommendation

The Supabase Free plan does not include the same backup guarantees as paid production plans. For a community ledger, export/backup the database periodically, especially immediately after the Pooja season and before closing a year.
