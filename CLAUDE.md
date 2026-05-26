# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Active development: flux-web/

The current development effort lives in **[flux-web/](flux-web/)** — a Next.js 16 + Supabase rewrite of the Google Apps Script app below. Run it with:

```bash
cd flux-web
npm run dev    # http://localhost:3000
npm run build  # production build
```

Requires a `.env.local` file (see `flux-web/.env.local.example`) with Supabase credentials before the app works.

**Deploy:** `vercel --cwd flux-web` or connect the `flux-web/` directory to a Vercel project.

### flux-web architecture

- **Next.js 16 App Router** — `proxy.ts` (replaces deprecated `middleware.ts`) handles auth redirects
- **Supabase** — DB + Auth. Schema in `flux-web/supabase/migrations/001_initial.sql`
- **Server Actions** in `flux-web/actions/` for all mutations (no API routes for web UI)
- **Shortcut API** at `POST /api/shortcut/transaction` — bearer token auth via `shortcut_tokens` table
- **Key pages:** `/home` (dashboard), `/transactions`, `/settings` (with shortcut install)
- **iPhone Shortcuts token:** auto-generated on signup, shown in Settings → Atajos

### Shortcut iCloud links
Update `flux-web/lib/constants.ts` → `SHORTCUT_LINKS` once the shortcuts are published to iCloud.

## Legacy: Code.js + Dashboard.html

## What this is

Flux App WebApp is a **Google Apps Script** personal finance tracker. The entire app lives in two files deployed as a Google Apps Script project bound to a Google Sheets spreadsheet:

- **[Code.js](Code.js)** — Server-side backend (Google Apps Script / V8 runtime)
- **[Dashboard.html](Dashboard.html)** — Single-file frontend (React 18 + Babel Standalone + Tailwind CSS via CDN)

There is no build step, no package.json, and no local dev server. The app runs entirely inside Google's infrastructure.

## Deployment

Files are deployed through the [Google Apps Script editor](https://script.google.com) or via the `clasp` CLI tool:

```bash
# If clasp is configured:
clasp push        # Upload local files to Apps Script project
clasp open        # Open the project in the browser editor
```

The deployed web app URL is the `URL_EXEC` constant at the top of [Code.js](Code.js). Deploying a new version requires creating a new deployment in the Apps Script editor (Deploy → Manage deployments).

The `V2`–`V5` directories in the parent folder are archived iterations; `WebApp/` is the current version.

## Architecture

### Backend (Code.js)

Uses Google Apps Script APIs — **not** Node.js. Key globals: `SpreadsheetApp`, `MailApp`, `CacheService`, `LockService`, `PropertiesService`, `Utilities`, `HtmlService`, `ContentService`, `Session`.

**Entry points:**
- `doGet(e)` — if `e.parameter.mode === 'api'`, returns JSON with categories/accounts for form initialization (cached 6h via `CacheService`). Otherwise serves the Dashboard HTML via `HtmlService`.
- `doPost(e)` — handles external transaction POSTs (e.g., Apple Pay webhook), writes directly to the `movimientos` sheet.

**Data layer — Google Sheets as the database:**

| Sheet | Purpose |
|---|---|
| `movimientos` | Transactions (14 columns; `ajuste` is the signed delta applied to account balance) |
| `categorias` | Custom categories (merged with `DEFAULT_CATEGORIES` constant at runtime) |
| `cuentas` | Accounts (Efectivo, TDD, TDC) |
| `planificados` | Recurring transactions/subscriptions |
| `presupuestos` | Monthly budgets |
| `personas` | People for split/debt tracking |

All IDs use prefixed string format: `CAT-DEF-FOOD`, `IC-001`, `COL-01`, `MP-EFECTIVO`, `TR-GASTO`, `TR-INGRESO`, `TR-TRANSFER`, `CTA-XXXX`, `PER-YO` (always "me").

**Key backend functions:**
- `getDashboardData()` — called by frontend on load; runs `checkRecurringTransactions()` then returns all sheet data as JSON
- `addManualTransaction(form, customId?)` — inserts row(s) to `movimientos`; transfers create two rows sharing the same UUID
- `updateTransaction(form)` — edits existing row; for transfers, deletes and re-inserts
- `saveItem(table, idField, dataObj)` — upsert for categories, accounts, planificados, personas, budgets
- `deleteItem(table, idField, idValue)` / `deleteTransaction(id)` — row deletion
- `checkRecurringTransactions(ss, force?)` — processes overdue planificados into movimientos; runs once per day (guarded by `PropertiesService`)
- `recordSplitPayment(parentId, personId, amount, accountId)` — marks a split as paid and creates an abono row
- `recordPersonPayment(personId, amount, accountId, isActionPaying)` — FIFO debt settlement with auto-netting of cross-debts
- `applyBalanceAdjustments(adjustments)` — writes `CAT-AUDIT` adjustment rows for manual balance sync

**Split payment data model** (`split_data` JSON column on `movimientos` and `planificados`):
```json
{ "mode": "AMT", "splitMode": "DIV|IOWE|THEY", "data": [{ "id": "PER-YO|PER-xxx", "nombre": "...", "value": 100, "paidAmount": 0, "paidStatus": false }] }
```
- `DIV` — shared expense (each owes their `value`)
- `IOWE` — I owe someone (PER-YO is the debtor; the other person paid)
- `THEY` — they owe me (I paid; others owe their `value`)

**Email notifications** (via `MailApp`): recurring payment reminders, TDC due-date reminders (1 day prior), monthly balance adjustment reminders (last Sunday of month).

**Timezone:** All dates formatted as Mexico City (GMT-6) using `getMexicoISOString()`.

### Frontend (Dashboard.html)

A single HTML file served by `HtmlService`. JSX is transpiled at runtime by Babel Standalone — no compilation needed.

**CDN dependencies loaded at runtime:**
- React 18 (development build)
- Babel Standalone (JSX transpilation)
- Tailwind CSS (via CDN, JIT)
- Chart.js
- Font Awesome 6.4

**Frontend → Backend communication** uses `google.script.run`, not `fetch`:
```javascript
google.script.run
  .withSuccessHandler(callback)
  .withFailureHandler(errCallback)
  .getDashboardData();  // calls the Apps Script function by name
```

All backend functions callable from the frontend must be top-level functions in Code.js.

**UI structure:** Dark theme (`#020617`), mobile-first, PWA-capable (`apple-mobile-web-app-capable`). Tab-based navigation with scroll-snap sections. The React component tree lives entirely inside the `<script type="text/babel">` block.

## Static data constants (Code.js)

These are defined in Code.js and sent to the frontend on every load — they don't live in Sheets:
- `STATIC_ICONS` — 50+ Font Awesome icon definitions with `id_icon` (e.g., `IC-001`)
- `STATIC_COLORS` — 30 color definitions with `id_color`, `hex`, Tailwind class, and bg class
- `STATIC_PAYMENT_METHODS` — Efectivo, Tarjeta Débito, Tarjeta Crédito
- `DEFAULT_CATEGORIES` — 15 built-in categories merged with any custom ones from the sheet
