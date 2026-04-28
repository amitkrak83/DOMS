# DOMS — Distributor Order Management System

A mobile-first web application for beverage distributors to manage orders, deliveries, payments, and customer accounts. Built specifically for small-to-mid-sized distributor teams operating in the field, where speed of order entry, automatic scheme calculations, and real-time sync across multiple users are critical.

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Features](#features)
6. [User Journey](#user-journey)
7. [Data Flow](#data-flow)
8. [Setup & Installation](#setup--installation)
9. [Usage](#usage)
10. [Environment & Configuration](#environment--configuration)
11. [Development Guidelines](#development-guidelines)
12. [Deployment](#deployment)
13. [Known Limitations & Future Improvements](#known-limitations--future-improvements)

---

## Overview

DOMS is a lightweight order management system tailored to beverage distributors. It replaces paper-based or spreadsheet workflows with a fast, mobile-optimized interface that:

- Captures orders with automatic free-bottle scheme calculation
- Tracks delivery status in real time across multiple field users
- Records payments (cash, credit, UPI/online) and generates UPI QR codes on the spot
- Maintains a per-customer outstanding ledger (Khata/Udhar)
- Allows sharing order summaries as PNG images via WhatsApp or other channels

**Primary users:** Distributor staff (salespeople, delivery drivers) who need a quick, always-available tool on their phones.

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Framework | Next.js 15 (App Router, Turbopack) | Full-stack React with SSR, file-based routing, and server components for fast initial load |
| Language | TypeScript 5 | Type safety across client and server code |
| Database | Supabase (PostgreSQL) | Managed Postgres with built-in Auth, Realtime, Row Level Security, and auto-generated types |
| Auth | Supabase Auth (Google OAuth) | Zero-password login; safe for non-technical field staff |
| UI Components | shadcn/ui (Base Nova) | Accessible, unstyled-by-default components that compose well with Tailwind |
| Styling | Tailwind CSS v4 | Utility-first, mobile-first styling; integrates directly via PostCSS |
| Icons | Lucide React | Consistent icon set with tree-shaking |
| Real-time | Supabase Realtime (postgres_changes) | Push DB change events to connected clients without polling |
| Image Export | html-to-image, html2canvas | Render DOM nodes to PNG for order-share feature |
| QR Code | qrcode.react | Generate UPI payment QR codes client-side |
| Toasts | Sonner | Lightweight, accessible toast notifications |
| Theme | next-themes | Dark/light mode toggle |
| Build | Turbopack | Faster local dev rebuilds compared to Webpack |

---

## Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         Browser (PWA)                              │
│  ┌────────────────────┐   ┌──────────────────────────────────────┐ │
│  │  Server Components │   │  Client Components                   │ │
│  │  (async, SSR)      │   │  (forms, modals, realtime listeners) │ │
│  │  - Pages           │   │  - NewOrderForm                      │ │
│  │  - Data fetching   │   │  - DeliverSection (UPI QR)           │ │
│  │  - Auth checks     │   │  - RealtimeSync                      │ │
│  └────────┬───────────┘   └──────────────┬───────────────────────┘ │
│           │                              │                         │
└───────────┼──────────────────────────────┼─────────────────────────┘
            │  Server-side queries         │  Client-side mutations
            ▼                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase (Hosted)                           │
│  ┌──────────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  PostgreSQL DB   │  │  Auth (OAuth)│  │  Realtime Server  │  │
│  │  - products      │  │  Google SSO  │  │  postgres_changes │  │
│  │  - variants      │  │  Sessions    │  │  WebSocket push   │  │
│  │  - orders        │  │  via cookies │  │  to all clients   │  │
│  │  - order_items   │  └──────────────┘  └───────────────────┘  │
│  │  - payments      │                                           │
│  │  - customers     │  Row Level Security: authenticated users  │
│  └──────────────────┘  only; all users share one namespace      │
└─────────────────────────────────────────────────────────────────┘
```

### Key design decisions

- **Server Components for pages** — all pages use async server components that fetch data at request time. No client-side data fetching on initial load.
- **Client Components for mutations** — forms and interactive widgets are client components that write to Supabase directly using the browser client.
- **Real-time sync via refresh** — `RealtimeSync` subscribes to DB change events and calls `router.refresh()` (debounced 800ms), which re-runs server components and re-fetches data. Delivery/undelivery actions navigate to `/orders` immediately rather than refreshing in-place to avoid UI lag.
- **All users share all data** — RLS policies allow any authenticated user to read/write all rows. There is no per-user data isolation.

---

## Project Structure

```
/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout: BottomNav, Toaster, SW registration
│   ├── page.tsx                # Root → redirects to /dashboard
│   ├── manifest.ts             # PWA web app manifest
│   ├── dashboard/              # Main landing page with stats and recent orders
│   ├── login/                  # Google OAuth login page
│   ├── auth/callback/          # OAuth code-exchange route (sets session cookies)
│   ├── orders/
│   │   ├── page.tsx            # Orders list filtered to last 2 days
│   │   ├── new/                # Multi-step new order creation form
│   │   └── [id]/               # Order detail view; nested /edit for editing
│   ├── customers/              # Customer master CRUD
│   ├── products/               # Products & variant master CRUD
│   └── ledger/                 # Customer-wise outstanding balance (Khata)
│
├── components/
│   ├── ui/                     # shadcn base primitives (button, input, dialog, etc.)
│   ├── auth/                   # logout-button.tsx
│   ├── orders/
│   │   ├── new-order-form.tsx  # 3-step order creation with live scheme calculation
│   │   ├── deliver-section.tsx # Mark delivered + payment modal + UPI QR
│   │   ├── share-order-button.tsx  # Render order to PNG and share/download
│   │   ├── customer-search.tsx # Debounced customer search + select
│   │   ├── orders-list.tsx
│   │   ├── delete-order-button.tsx
│   │   └── undeliver-button.tsx
│   ├── customers/              # Add/edit/list customer components
│   ├── products/               # Add/edit/delete product and variant components
│   ├── ledger/                 # Ledger list component
│   ├── bottom-nav.tsx          # 5-tab mobile bottom navigation
│   ├── page-header.tsx         # Reusable sticky page header
│   ├── realtime-sync.tsx       # Supabase Realtime listener → router.refresh()
│   └── sw-register.tsx         # PWA service worker registration
│
├── lib/
│   ├── supabase.ts             # Browser Supabase client (singleton)
│   ├── supabase-server.ts      # Server Supabase client (SSR, cookie-based)
│   ├── database.types.ts       # Auto-generated TypeScript types from Supabase schema
│   ├── calculations.ts         # Scheme calculation, quantity formatting, order totals
│   └── utils.ts                # clsx/tailwind-merge helper (cn)
│
├── supabase/
│   ├── schema.sql              # Full database schema (tables, constraints, indexes)
│   ├── rls-policies.sql        # Row Level Security policies
│   ├── add-customers.sql       # Migration: customers table + FK on orders
│   └── add_online_payment_type.sql  # Migration: adds 'online' payment type
│
├── public/                     # Static assets (icons, favicon)
├── proxy.ts                    # Next.js middleware — auth guard (redirects to /login)
├── next.config.ts              # Next.js config (Turbopack enabled)
├── tailwind.config.ts          # Tailwind v4 config
├── postcss.config.mjs          # PostCSS with Tailwind plugin
├── components.json             # shadcn CLI config (Base Nova preset, Tailwind v4)
├── tsconfig.json               # TypeScript config (strict, path aliases)
└── package.json
```

---

## Features

### Dashboard
- Summary cards: Pending Orders count, Delivered Today count, Today's Cash Collection, Total Udhar (credit outstanding)
- Filterable recent orders list: All / Pending / Delivered Today / Cash Today / Udhar
- Floating "New Order" button
- Real-time sync — any update by any user reflects within ~1 second

### Order Management
- **Create** orders with a 3-step form:
  1. Select customer (or enter free-text name)
  2. Add one or more line items (product → variant → quantity in cases)
  3. Review with auto-calculated free bottles and total amount
- **Edit** pending orders (blocked once delivered)
- **Deliver** an order: mark as delivered, select payment type (Cash / Credit / Online), enter amount; shows UPI QR code for online payments
- **Share** order as a PNG image (WhatsApp-friendly)
- **Delete** orders
- Automatic free-bottle scheme calculation: free bottles = cases × `free_bottles_per_case`
- Historical price snapshot stored per order item

### Product & Variant Master
- Add/edit/delete products
- Per-product variants with: variant name, bottles per case, price per case, free bottles per case (scheme)
- Scheme is embedded in the variant — no separate promotions module

### Customer Master
- Add/edit customers with name, mobile number, and address
- Customer search with debounced lookup
- Link orders to customers (optional — orders can also use free-text names)

### Ledger (Khata)
- Aggregated outstanding balance per customer (total ordered on credit, minus any payments)
- Sorted highest outstanding first
- Drill down to individual orders

### Authentication
- Google OAuth only — no passwords
- Server-side session management via cookies
- All routes except `/login` and `/auth/*` are protected by middleware

### PWA
- Installable to home screen on Android/iOS
- Service worker for offline support
- Mobile viewport and touch-optimized UI

---

## User Journey

```
1. LOGIN
   User opens the app → /login
   Clicks "Continue with Google" → Google OAuth consent
   Redirected to /auth/callback → session established → /dashboard

2. PLACE AN ORDER
   Dashboard → "New Order" button → /orders/new
   Step 1: Search and select customer (or type name)
   Step 2: Select product variant → enter number of cases
            App auto-shows free bottles and total amount
            Repeat for multiple line items
   Step 3: Review summary → Submit
   Order created with status "pending" → redirected to order detail page

3. DELIVER AN ORDER
   Dashboard (Pending tab) or /orders → select order
   Tap "Mark as Delivered"
   Select payment type:
     - Cash: enter amount → confirm
     - Credit (Udhar): confirm, no payment needed
     - Online: UPI QR code shown → customer scans → enter amount → confirm
   Order status changes to "delivered"
   Real-time update reflected on all other connected devices

4. TRACK OUTSTANDING
   /ledger → view all customers with outstanding balances
   Tap a customer to see individual unpaid orders

5. MANAGE MASTER DATA
   /products → add/edit product variants and schemes
   /customers → add/edit customer records
```

---

## Data Flow

### Initial page load (server-rendered)

```
Browser request
  → Next.js middleware (proxy.ts)
      → Check Supabase session via cookie
      → No session? Redirect to /login
      → Session valid? Continue
  → Server Component (async page.tsx)
      → supabase-server.ts creates server client with cookies
      → Query Supabase PostgreSQL (e.g., SELECT * FROM orders)
      → Render HTML with data
  → Browser receives fully rendered page
```

### Client-side mutation (e.g., create order)

```
User submits NewOrderForm (client component)
  → supabase.ts browser client
  → INSERT into orders, order_items (Supabase REST/PostgREST)
  → Supabase PostgreSQL commits row
  → Supabase Realtime broadcasts postgres_changes event
  → RealtimeSync listener receives event on all connected clients
  → Calls router.refresh()
  → Next.js re-runs server components, refetches data
  → UI updates across all tabs/devices
```

### Payment & delivery flow

```
DeliverSection (client component)
  → UPDATE orders SET status = 'delivered'
  → INSERT into payments (type, amount)
  → If type = 'online': render UPI QR code via qrcode.react
      QR encodes: upi://pay?pa=UPI_ID&pn=MERCHANT_NAME&am=AMOUNT
  → Realtime event → all clients refresh
```

### Authentication flow

```
/login page → supabase.auth.signInWithOAuth({ provider: 'google' })
  → Redirects to Google consent
  → Google redirects to /auth/callback?code=...
  → Server route: supabase.auth.exchangeCodeForSession(code)
  → Supabase sets auth cookies on response
  → Redirect to /dashboard
  → All subsequent requests carry cookie → server client reads session
```

---

## Setup & Installation

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (free tier works)
- Google OAuth credentials (configured in your Supabase project's Auth settings)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd doms
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Then fill in the values — see Environment & Configuration below
   ```

4. **Set up the database**

   In your Supabase project's SQL Editor, run these files in order:
   ```
   supabase/schema.sql                  -- Creates all tables
   supabase/rls-policies.sql            -- Enables Row Level Security
   supabase/add-customers.sql           -- Adds customers table
   supabase/add_online_payment_type.sql -- Adds 'online' payment type
   ```

5. **Enable Google OAuth in Supabase**

   Go to Supabase Dashboard → Authentication → Providers → Google.
   Add your Google OAuth Client ID and Secret.
   Set the redirect URL to: `https://<your-domain>/auth/callback`

6. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Usage

Once running, navigate to `http://localhost:3000`. You will be redirected to `/login`.

- **Login:** Click "Continue with Google" and authenticate.
- **Dashboard:** View today's summary. Use the tab filters to drill into pending orders, deliveries, cash collection, or Udhar.
- **New Order:** Tap the "+" button, select a customer, add line items (product/variant/cases), and submit.
- **Deliver:** Open any pending order and tap "Mark as Delivered". Choose the payment method and confirm.
- **Ledger:** Navigate to `/ledger` for a customer-wise outstanding balance view.
- **Master Data:** Use `/products` and `/customers` to manage your product catalog and customer list.

---

## Environment & Configuration

All environment variables are prefixed with `NEXT_PUBLIC_` and are safe to expose to the browser. Supabase's anon key is limited by Row Level Security — it cannot bypass RLS policies.

| Variable | Description | Example |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | `eyJ...` |
| `NEXT_PUBLIC_UPI_ID` | UPI VPA for online payment QR codes (fallback: `9918802425@okbizicici`) | `9999999999@okbizicici` |
| `NEXT_PUBLIC_MERCHANT_NAME` | Merchant name shown on UPI payment screen (fallback: `Verma Rice Mill`) | `Verma Rice Mill` |

Create `.env.local` in the project root with these values. This file is git-ignored and must not be committed.

---

## Development Guidelines

### Component patterns

- **Server Components by default** — pages are async server components. Only reach for `'use client'` when you need browser APIs, event handlers, or hooks.
- **Direct Supabase mutations from client components** — no API routes. Client components import `lib/supabase.ts` directly and call Supabase JS methods.
- **Real-time via refresh** — after any mutation, rely on `RealtimeSync` triggering `router.refresh()` rather than managing local state for server data.

### Styling conventions

- Use `cn()` from `lib/utils.ts` for conditional class merging.
- Mobile-first: design for small screens first. Max content width is `max-w-2xl` on most pages.
- Use semantic Tailwind color tokens. Avoid arbitrary values unless necessary.

### Type safety

- Database types are in `lib/database.types.ts`. Regenerate this file when the schema changes:
  ```bash
  npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
  ```
- Always import table row types from `database.types.ts` rather than defining inline interfaces.

### Scheme / calculation logic

- All free-bottle and price calculations live in `lib/calculations.ts`. Do not duplicate this logic in components.
- `calculateScheme(cases, variant)` → returns free bottles and total bottles.
- `formatQuantity(totalBottles, bottlesPerCase)` → returns human-readable string like "2 Case 4 Bottle".

### Code style

- ESLint is configured with `next/core-web-vitals` + TypeScript rules. Run `npm run lint` before committing.
- No custom Prettier config — use editor defaults consistent with the existing file formatting.
- Comments only where the intent is non-obvious. Avoid restating what the code already says.

---

## Deployment

The app is designed for deployment on **Vercel** (native Next.js host), but any platform supporting Node.js or the Next.js standalone output works.

### Vercel (recommended)

1. Push the repository to GitHub.
2. Import the repo in Vercel.
3. Add all `NEXT_PUBLIC_*` environment variables in the Vercel project settings.
4. Deploy. Vercel auto-detects Next.js and configures the build.

### Environment parity

| Environment | Notes |
|---|---|
| Local (dev) | `.env.local`, `npm run dev`, Turbopack HMR |
| Production | Vercel (or equivalent), same Supabase project or a separate one |

There is currently no staging environment or separate Supabase project for testing. All development uses the production Supabase instance.

### Service worker (PWA)

The service worker is registered by `components/sw-register.tsx`. On Vercel, the `/public` directory is served at the root, making the service worker scope correct automatically.

---

## Known Limitations & Future Improvements

### Current limitations

- **No per-user data isolation** — all authenticated users can read and write all orders, customers, and payments. Suitable for a trusted team; not suitable if users should only see their own data.
- **No staging/test environment** — development runs against the production Supabase instance.
- **Orders linked to customers loosely** — `customer_name` on orders is a free-text field. Orders created before the customer master was introduced are not linked to a `customers` row.
- **Single UPI ID** — the UPI ID is a global env var. Multiple merchant accounts are not supported.
- **No offline write support** — the service worker caches assets for offline load, but mutations require an internet connection.
- **No audit trail** — there is no log of who created or modified an order.

### Potential improvements

- Per-user or per-role data scoping with updated RLS policies
- Offline order queue with background sync
- Separate test/staging Supabase project
- PDF invoice generation in addition to PNG sharing
- Push notifications for new orders (Web Push API)
- Route-based code splitting for faster cold starts on slower networks
- Automated Supabase type generation in CI pipeline
