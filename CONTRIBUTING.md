# Contributing

## Local setup

1. Install Bun.
2. Copy `.env.example` to `.env.local`.
3. Fill in the required env vars.
4. Run:

```bash
bun install
bun run db:setup
bun run dev
```

Use `bun run db:migrate` for local development only. For CI, staging, or production verification, use `bun run db:migrate:deploy`.

If you are on PowerShell, use `Copy-Item .env.example .env.local` instead of `cp`.

## Before opening a pull request

- Run `bun run check`
- Run `bun run build`

## Pull request expectations

- Keep changes focused.
- Include screenshots for UI changes.
- Update docs when setup or behavior changes.
- Call out env or migration changes clearly.

## Scope

Controlplane is currently optimized for supplement-commerce operations. Changes that widen the product scope should keep the existing workflow polished, not dilute it.
