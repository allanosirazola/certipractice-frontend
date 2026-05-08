# CertiPractice Admin Panel

Internal analytics dashboard for monitoring user behavior, exam performance,
and platform health. **Not visible to end users.**

## Architecture

This is a separate Vite app inside the same repo as the public frontend, with
its own build pipeline. They share React, Tailwind, and the test runner but
nothing else — no shared bundle, no exposed admin routes from the public app.

```
certipractice-frontend/
├── src/                    # public frontend (untouched)
├── admin/                  # ← THIS panel
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx         # router with all admin routes
│       ├── pages/          # one file per dashboard page
│       │   ├── Login.jsx
│       │   ├── Overview.jsx
│       │   ├── Trends.jsx
│       │   ├── Questions.jsx
│       │   ├── Users.jsx
│       │   ├── Funnel.jsx
│       │   └── Alerts.jsx
│       ├── components/     # shared UI primitives
│       ├── services/       # api.js, queryClient.js
│       ├── hooks/          # useAuth, useDateRange
│       ├── utils/          # format.js, csv.js, alerts.js
│       └── tests/          # vitest specs (75 tests)
├── vite.config.js          # public app build
└── vite.admin.config.js    # admin app build
```

## Running

```bash
# Install once (covers both apps)
npm install

# Public frontend (port 5173)
npm run dev

# Admin panel (port 5174)
npm run dev:admin
```

## Building

```bash
npm run build         # public → dist/
npm run build:admin   # admin  → dist-admin/
```

The two builds are entirely independent. Deploy `dist-admin/` to
`admin.certipractice.com` and `dist/` to the main domain.

## Testing

```bash
npm run test:admin:run   # one-off run, 75 tests
npm run test:admin       # watch mode
```

## Configuration

Set `VITE_ADMIN_API_URL` in `.env.local` to point at your backend
(`http://localhost:3000` for local dev, your Railway URL for production).
Falls back to `VITE_API_URL` if not set.

## What it shows

Six tabs, each backed by a `/api/admin/analytics/*` endpoint:

- **Overview** — KPIs with delta vs previous period (8 metric tiles + 2 charts)
- **Trends** — 4 daily charts from pre-aggregated `daily_metrics` + CSV export
- **Questions** — most failed/viewed/reported with click-to-drill-down sidebar
- **Users** — DAU, registrations, most active, percentile durations, anon vs auth
- **Funnel** — exam-flow conversion bars + abandonment-by-question chart + top paths/errors/searches
- **Alerts** — auto-generated from rules (low pass rate, server errors, problematic questions)

## Auth

Same backend `/api/auth/login`, but client-side enforces `role === 'admin'`.
Token is stored in `localStorage('admin_token')` (separate from any public
frontend token). The login page rejects non-admin users without storing the
token.

## Stack

- React 18 + Vite 5
- Tailwind 3 (custom dark tokens in `admin/src/index.css`)
- Recharts (charts)
- TanStack Query (cache, refetch)
- React Router 6
- Vitest (75 tests)

## Backend dependencies

Requires `certipractice-backend` v1.3.0 (telemetry endpoints).
See `docs/TELEMETRY.md` in that repo for endpoint shapes.
