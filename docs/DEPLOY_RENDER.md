# Deploy to Render.com (Node + PostgreSQL)

This project runs an Express server with EJS and PostgreSQL. Below are the minimal steps to deploy on Render.

## 1) Prepare repo
- Push this repo to GitHub (public or private).

## 2) Create a PostgreSQL database on Render
- In the Render dashboard: New -> PostgreSQL -> pick a name/region (Free tier is ok for testing).
- After creation, open the database page -> Connections.
  - For best performance inside Render, copy the Internal Connection string (postgres://...)
  - Alternatively use the External Connection string (requires SSL).

## 3) Create a Web Service for the app
- In Render: New -> Web Service -> Connect your GitHub repo -> pick branch `main`.
- Runtime is detected automatically as Node.js.
- Set commands:
  - Build Command: `npm ci` (or `npm install`)
  - Start Command: `npm start`
- Render will inject `PORT` automatically. This app already listens on `process.env.PORT`.

## 4) Environment variables
Set the following Environment Variables on the Web Service (Settings -> Environment):

- DATABASE_URL: paste the connection string from the DB (Internal or External)
  - If you use the External connection string, leave as-is; the app enables SSL by default.
  - If you use the Internal connection string, it typically works without SSL; the app sets `ssl: { rejectUnauthorized: false }` which is also ok. If needed, set `DB_SSL=false` to disable SSL explicitly.
- JWT_SECRET: a strong random value (required for auth cookies)
- PAYPAL_CLIENT_ID: your PayPal client ID (optional if you don't use PayPal yet)
- PAYPAL_CLIENT_SECRET: your PayPal client secret (optional)
- PAYPAL_MODE: `sandbox` or `live` (default: sandbox)
- Optional UI/env:
  - USD_VND_RATE: e.g. `25000`
  - LOGO_URL: optional logo URL

You DO NOT need to set `PORT`; Render provides it.

## 5) First deploy
- Click Deploy. On first boot, the app runs basic migrations:
  - `sql/schema.sql` to create base tables
  - additional migrations in `migrations/*` to add columns and fix shapes (cart_items, stock, slug, etc.)
- Open the Render Web Service URL once it’s green. Example: `https://your-service.onrender.com/`.
- API base path is under `/api/*`. Example: `GET /api/products`.

## 6) Troubleshooting
- 500 on cart endpoints: ensure the DB schema was applied (the app applies it on startup). Check Logs in Render dashboard.
- DB auth errors: confirm `DATABASE_URL` is correct and the database is in the same region as the service.
- PayPal errors: ensure `PAYPAL_CLIENT_ID/SECRET` and allowed redirect URLs in your PayPal app settings.

## 7) (Optional) Use Render Blueprint
You can also use a `render.yaml` to define the web service + database as code. For a simple app, using the dashboard is sufficient.
