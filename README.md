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
done-for-you version of this app, at getroundmate.co.uk) lives alongside the private app under
`app/marketing/`. It is completely separate from the scheduler above — no
existing route, layout, or data is touched.

- **Preview locally**: run `pnpm dev` and open
  [http://localhost:3000/marketing](http://localhost:3000/marketing). The
  `/marketing` and `/marketing/demo` paths are explicitly exempted from the
  login gate in `proxy.ts`, so no session cookie is needed. Every other
  route (`/schedule`, `/today`, etc.) requires login exactly as before.
- **Point getroundmate.co.uk at this project**: add the domain in the
  Vercel dashboard for this project. `proxy.ts` checks the request's `Host`
  header — when it's `getroundmate.co.uk` or `www.getroundmate.co.uk`, `/`
  and `/demo` are rewritten to `/marketing` and `/marketing/demo` so the
  new domain gets clean URLs. Any other domain (this app's own production
  domain, Vercel preview URLs, localhost) is unaffected and keeps its
  current behaviour.
- **Fill in the real links**: edit `lib/marketingConfig.ts`. It's the only
  file you need to touch:
  - `STRIPE_PAYMENT_LINK_URL` — the Stripe Payment Link for the £99 setup fee.
  - `ARCHERS_WINDOWS_LIVE_URL` — the production URL of this Archer's Windows
    instance, linked from the marketing site as free, live proof.
  - `DEMO_VIDEO_EMBED_URL` — a YouTube/Loom embed URL for the 60-second demo.
  - `CONTACT_WHATSAPP_NUMBER` / `CONTACT_EMAIL` — contact details shown in
    the footer and final call-to-action.
