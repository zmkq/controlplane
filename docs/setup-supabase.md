# Supabase Setup

This project expects two database URLs:

- `DATABASE_URL`: pooled runtime URL
- `DIRECT_URL`: direct Prisma URL

## Recommended flow

1. Create a Supabase project.
2. Open `Project Settings -> Database`.
3. Copy the pooled connection string into `DATABASE_URL`.
4. Copy the direct connection string into `DIRECT_URL`.
5. Update `.env.local`.
6. Run:

```bash
bun run db:migrate
bun run db:seed
```

## Notes

- Use the pooled URL for app runtime traffic.
- Use the direct URL for migrations and schema changes.
- If your project enforces SSL, keep SSL enabled on both URLs.
- The `/api/health` route is the fastest post-setup smoke test.
