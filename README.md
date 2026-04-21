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
