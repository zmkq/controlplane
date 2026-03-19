# Controlplane

<p align="center">
  <a href="./docs/marketing_video.mp4">
  </a>
</p>

<p align="center">
  <strong><a href="./docs/marketing_video.mp4">Watch the product video</a></strong> :clapper:
</p>

Controlplane is a bilingual operations dashboard for supplement commerce teams. It brings inventory, orders, delivery coordination, push notifications, profitability, QR-assisted workflows, and reporting into one dark, mobile-aware command center.

It is built with Next.js App Router, Bun, Prisma, Postgres, and a PWA-first UI. The current release is optimized for open-source onboarding with Supabase for data, Vercel for deployment, and English plus Arabic support out of the box.

## Highlights :sparkles:

- Built for supplement commerce operations, not a generic admin shell.
- English and Arabic support with runtime language switching.
- Mobile-aware UI with installable PWA flows, push notifications, and QR scanning.
- Prisma + Postgres backend with reporting, profit analysis, notifications, and device management.
- Open-source ready with docs, CI, issue templates, contributing guidelines, and security policy.

## Screenshots :camera_flash:

<p align="center">
  <img src="./docs/screenshots/dashboard-overview.png" alt="Dashboard overview" width="32%" />
  <img src="./docs/screenshots/reports-and-analytics.png" alt="Reports and analytics" width="32%" />
  <img src="./docs/screenshots/mobile-workflows.png" alt="Mobile workflows" width="32%" />
</p>

## Feature Overview :rocket:

- Dashboard with revenue, profit, channel, inventory, and activity views.
- Sales workflow with customer detail view, editing, duplication, and delivery metadata.
- Product catalog and stock controls with low-stock visibility.
- Agent and supplier workflows for on-demand fulfillment.
- Profit and reporting screens with PDF/export-oriented flows.
- Notifications hub, push subscription management, and device health endpoints.
- Settings panel for language, branding, timezone, and notification preferences.
- Customer-facing order detail page and printable shipment slips.

## Stack :bricks:

- `Next.js 16`
- `React 19`
- `TypeScript`
- `Bun`
- `Prisma 7`
- `PostgreSQL / Supabase`
- `NextAuth/Auth.js`
- `Tailwind CSS 4`
- `Framer Motion`
- `Recharts`

## Prerequisites :white_check_mark:

- `Bun` 1.1+
- `Node.js` 20+ for local tooling compatibility
- A `Supabase` project with Postgres enabled
- Optional: `ImgBB` key for image uploads
- Optional: `VAPID` keys for web push notifications

## Quick Start :zap:

```bash
git clone <your-public-controlplane-repo-url>
cd controlplane
bun install
cp .env.example .env.local
```

Fill in the required variables in `.env.local`, then run:

```bash
bun run db:generate
bun run db:migrate
bun run db:seed
bun run dev
```

Use `bun run db:migrate` only for local development. In CI, staging, or production, use `bun run db:migrate:deploy`.

Open `http://localhost:3000`.

Default seeded demo credentials:

- Username: `demo`
- Password: `controlplane-demo`

Override them with `DEMO_ADMIN_USERNAME`, `DEMO_ADMIN_EMAIL`, and `DEMO_ADMIN_PASSWORD` in your local env if needed.

## Environment Variables :lock:

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Runtime pooled Postgres URL. For Supabase, use the pooled connection string. |
| `DIRECT_URL` | Yes | Direct Postgres URL for Prisma migrations and schema operations. |
| `AUTH_SECRET` | Yes | Auth.js secret. Generate a long random value. |
| `NEXT_PUBLIC_APP_URL` | Yes | Public base URL used for metadata and deployment. |
| `IMGBB_API_KEY` | No | Enables hosted image upload support. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | No | Public VAPID key for client-side push subscription. |
| `VAPID_PUBLIC_KEY` | No | Server-side public VAPID key. |
| `VAPID_PRIVATE_KEY` | No | Server-side private VAPID key. |
| `VAPID_SUBJECT` | No | Contact string for web push, usually `mailto:...`. |
| `DEMO_ADMIN_USERNAME` | No | Seeded local demo username. |
| `DEMO_ADMIN_EMAIL` | No | Seeded local demo email. |
| `DEMO_ADMIN_PASSWORD` | No | Seeded local demo password. |

## Supabase Setup :card_file_box:

### 1. Create a project

- Create a new Supabase project.
- Wait for the database to finish provisioning.

### 2. Collect both database URLs

- Use the pooled connection string for `DATABASE_URL`.
- Use the direct connection string for `DIRECT_URL`.

Example:

```env
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres"
```

### 3. Apply schema and seed demo data

```bash
bun run db:migrate
bun run db:seed
```

For non-development environments, run `bun run db:migrate:deploy` instead of `bun run db:migrate`.

### 4. Verify connectivity

Start the app and hit:

```txt
GET /api/health
```

You should get a JSON response with database and feature status.

More detail: [docs/setup-supabase.md](./docs/setup-supabase.md)

## Bun Workflow :package:

Useful commands:

```bash
bun run dev
bun run lint
bun run typecheck
bun run test
bun run test:e2e
bun run build
```

Database commands:

```bash
bun run db:generate
bun run db:migrate
bun run db:migrate:deploy
bun run db:seed
bun run db:reset
```

Full local gate:

```bash
bun run ci
```

## English and Arabic Support :earth_africa:

Controlplane ships with two UI languages:

- English
- Arabic

The language switcher updates the document language and persisted preference. The interface stays LTR in both languages, while Arabic uses Arabic-capable typography and translated product copy across the app shell, login surface, and customer-facing order view.

## Push Notifications :bell:

Push notifications are optional. To enable them:

1. Generate VAPID keys.
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.
3. Rebuild and reopen the app.

If those vars are missing, Controlplane keeps the notification UI available but safely disables push broadcasting.

## Image Uploads :framed_picture:

Image uploads are optional. Set `IMGBB_API_KEY` to enable hosted uploads.

Without that key, upload-dependent flows fail fast with a clear configuration error instead of silently using a hardcoded fallback.

## Vercel Deployment :arrow_upper_right:

### 1. Import the repo into Vercel

- If you are extracting this app from a larger private workspace, use this directory as the project root.
- Install with `bun install`.

### 2. Add env vars

Add every required variable from `.env.example`.

### 3. Build and deploy

Vercel build command:

```bash
bun run build
```

### 4. Post-deploy smoke test

- Open `/api/health`
- Open `/login`
- Sign in with your seeded demo user or your own seeded account

## Troubleshooting :hammer_and_wrench:

- `DATABASE_URL is required`: your local env file is missing the pooled runtime URL.
- `DIRECT_URL is required`: Prisma needs the direct Postgres URL for migrations.
- Login succeeds locally but not in deployment: verify `AUTH_SECRET` and your database envs are set in Vercel.
- Push subscription fails: confirm both public and private VAPID keys are present.
- Image upload fails: confirm `IMGBB_API_KEY` is set.

## Scripts Reference :scroll:

- `bun run dev`: start the app in development mode.
- `bun run build`: generate Prisma client and build the production app.
- `bun run start`: run the production server.
- `bun run lint`: run ESLint.
- `bun run typecheck`: run TypeScript without emitting files.
- `bun run test`: run Vitest unit tests.
- `bun run test:e2e`: run Playwright smoke tests.
- `bun run db:generate`: run `prisma generate`.
- `bun run db:migrate`: run `prisma migrate dev` for local development.
- `bun run db:migrate:deploy`: run `prisma migrate deploy` for CI, staging, and production.
- `bun run db:seed`: seed demo-safe local data.
- `bun run db:reset`: reset and recreate the local database.
- `bun run ci`: run the local release gate sequence.

## Open-Source Maintenance :handshake:

- Contributing guide: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- Release notes and checks: [docs/release-checklist.md](./docs/release-checklist.md)

## License :page_facing_up:

[MIT](./LICENSE)
