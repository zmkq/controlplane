# Contributing

## Local setup

1. Install Bun.
2. Copy `.env.example` to `.env.local`.
3. Fill in the required env vars.
4. Run:

```bash
bun install
bun run db:migrate
bun run db:seed
bun run dev
```

## Before opening a pull request

- Run `bun run lint`
- Run `bun run typecheck`
- Run `bun run test`
- Run `bun run build`

## Pull request expectations

- Keep changes focused.
- Include screenshots for UI changes.
- Update docs when setup or behavior changes.
- Call out env or migration changes clearly.

## Scope

Controlplane is currently optimized for supplement-commerce operations. Changes that widen the product scope should keep the existing workflow polished, not dilute it.
