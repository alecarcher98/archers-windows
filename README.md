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
- **Point getroundmate.co.uk at this project**: just add the domain in the
  Vercel dashboard — no host-specific logic is needed any more, since `/`
  is the marketing site on every domain.
- **Fill in the real links**: edit `lib/marketingConfig.ts`. It's the only
  file you need to touch:
  - `STRIPE_PAYMENT_LINK_URL` — the Stripe Payment Link for the £99 setup fee.
  - `ARCHERS_WINDOWS_LIVE_URL` — defaults to the internal `/archers` link.
    Not currently linked from any public marketing page (the real round is
    private), but kept here in case it's wired in elsewhere later.
  - `CONTACT_WHATSAPP_NUMBER` — the only contact method shown in the footer
    and final call-to-action (no email support exists, by design).
- **`/demo`** is a live, interactive sandbox (`components/demo/`), not a
  video — a fake business ("Cleaning Co") seeded with fake customers and
  jobs entirely client-side (`lib/demoSeed.ts`). Visitors can mark jobs
  done, chase a payment and add a customer; nothing is persisted or sent
  anywhere, and a page refresh resets it back to the seed data.
