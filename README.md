Mobile job scheduler for window cleaning rounds.

## App navigation

- **Schedule** (`/schedule`) — Day (today’s run), Week (7-day overview), More (customers, tomorrow, review, print)
- **Earnings** — cash collected by day/week
- **Settings** — business name and completion SMS template

Legacy URLs `/today` and `/week` redirect to Schedule.

## Features

- **Schedule** — Day (jobs, street grouping, mark street done), Week (summary + 7-day list), More
- **Customers** — Search, permanent notes, pause until date, CSV import/export, duplicate warnings
- **Earnings** — Cash / bank / card, expected vs collected, round vs one-off, CSV export
- **Texts to send** — Copy messages and phone list; tick off when sent
- **Settings** — Message template, compact run mode
- **PWA** — Install to home screen; basic offline fallback (`/offline`)

Print has been removed.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## RoundMate marketing site

A public, no-login marketing site for "RoundMate" (the productized,
done-for-you version of this app) lives alongside the private scheduler
under `app/marketing/`. **It is now the home page** — `/` loads the
marketing site on every domain (production, Vercel previews, and
localhost alike), and the private scheduler moved to `/archers`.

- **Routing**: `proxy.ts` resolves a small alias map before running its
  auth check — `/` → `/marketing`, `/demo` → `/marketing/demo`, `/archers`
  → `/schedule` — and the browser URL bar stays on the friendly path
  thanks to a rewrite (not a redirect). `/marketing` and `/marketing/demo`
  stay exempt from the login gate, so no session cookie is needed there.
  `/archers` resolves to `/schedule`, which still requires login exactly
  as before — visiting it while logged out sends you to `/login?next=...`
  first.
- **Preview locally**: run `pnpm dev` and open
  [http://localhost:3000](http://localhost:3000) for the marketing site, or
  [http://localhost:3000/archers](http://localhost:3000/archers) for the
  scheduler.
- **Point roundmate.org at this project**: just add the domain in the
  Vercel dashboard — no host-specific logic is needed any more, since `/`
  is the marketing site on every domain. `app/marketing/layout.tsx` hardcodes
  this as `metadataBase` for OG tags (never use `VERCEL_URL` for that — it's
  the per-deployment preview URL, not the custom domain).
- **Fill in the real links**: edit `lib/marketingConfig.ts`:
  - `ARCHERS_WINDOWS_LIVE_URL` — the internal `/archers` link. Linked from the
    founder-story section as proof of a real, live round.
  - `CONTACT_WHATSAPP_NUMBER` — the only contact method on the site (no email
    support exists, by design). Every "£99" CTA also links here — the £99 is
    taken via a Stripe Payment Link sent manually inside that chat, not a
    site button.
- **`/demo`** is a live, interactive sandbox (`components/demo/`), not a
  video — a fake business ("Cleaning Co") seeded with fake customers and
  jobs entirely client-side (`lib/demoSeed.ts`). Visitors can mark jobs
  done, chase a payment and add a customer; nothing is persisted or sent
  anywhere, and a page refresh resets it back to the seed data.

## Multi-tenancy & the admin portal

This app now hosts more than one company's round, each fully isolated. Every
domain table (`customers`, `days`, `moves`, `removed`, `app_settings`) has a
`company_id` column, every query is scoped by it, and `days`/`app_settings`
have composite primary keys (`company_id, date` / `company_id, id`) so two
companies can never collide on the same row. The original business
("Archer's Windows") was migrated into the first tenant (slug
`archers-windows`) and `/archers` keeps working as a permanent alias to it.

### Logging in (company)

Each company gets a slug at `/c/[slug]` (Archer's Windows also keeps
`/archers`). Visiting it shows a login screen for that company specifically —
the slug is only ever used at this login boundary; once signed in, the app
uses today's same flat URLs (`/schedule`, `/customers`, ...), now scoped by
the session rather than the URL. Logging into the wrong tenant's slug while
already signed in elsewhere is never silently allowed — it always re-prompts
for that tenant's own credentials.

### The admin portal (`/admin`) — you, not your customers

- **Login**: `/admin/login`, gated by the `ADMIN_SECRET` env var (generate
  with `openssl rand -hex 24`). This is a separate cookie/session from company
  logins — no shared code path, so a bug in one can't be replayed as the other.
- **Dashboard** (`/admin`): every company, customer count, and a link to open
  their live `/c/[slug]`.
- **New company** (`/admin/companies/new`): enter a display name (auto-slugs
  it, editable), set their login username/password, optionally a brand
  colour. Reserved slugs (`admin`, `api`, `c`, `demo`, `archers`, and every
  existing top-level route) are rejected, as are duplicates.
- **Manage a company** (`/admin/companies/[id]`): edit the display name,
  paste/import their customer list, and add/edit/delete individual customers
  afterward.

### CSV import format

Paste or type anything comma/tab-separated with a header row — it's
deliberately forgiving, since a notebook-typed customer list rarely has clean
headers. Recognised header variants (case-insensitive):

| Field | Recognised headers |
|---|---|
| Name | name, customer, client, full name, customer name |
| Address | address, addr, street address, full address |
| Street | street, road, area, street/area |
| Phone | phone, mobile, tel, telephone, number, phone number |
| Price | price, £, cost, amount, fee, price (£) |
| Start date | start date, start, first clean, date, first visit (ISO `YYYY-MM-DD` or UK `DD/MM/YYYY`; unrecognised values default to today) |
| Frequency | frequency, freq, weeks, every (a number of weeks; "one-off" in this column marks a one-off job) |
| Notes | notes, note, gate code, comments, gate |

Unrecognised columns are ignored (shown as a warning); blank rows are
skipped. Every parsed row is shown in an editable preview table with any
issues flagged before you commit the import — nothing is created until you
click "Import."

### Rolling back the multi-tenancy migration

The schema change happened in three additive/reversible steps, in this order:

1. **`lib/db.ts`'s `ensureMigrations()`** — added the `companies` table and a
   nullable `company_id` column to every domain table. To undo: drop the
   `companies` table and the `company_id` columns (only safe if no second
   tenant has ever been created).
2. **`scripts/backfill-archers-windows-tenant.mjs`** — one-time, idempotent;
   pointed every existing row at the Archer's Windows tenant. To undo: `update
   <table> set company_id = null` on each table.
3. **`scripts/tighten-tenant-constraints.mjs`** — set `company_id` `NOT NULL`
   everywhere and changed the primary keys on `days` (`date` →
   `company_id, date`) and `app_settings` (`id` → `company_id, id`). This is
   the step to be most careful reversing, since dropping a composite key back
   to a single column will error if more than one tenant's rows now share a
   `date`/`id` value. Only attempt this before a second tenant has real data.
