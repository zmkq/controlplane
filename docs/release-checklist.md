# Release Checklist

- Secrets removed from tracked files and rotated outside the repo.
- `.env.example` matches the real runtime contract.
- `bun run env:check` passes with the intended deployment env set.
- `bun run i18n:check` passes and English/Arabic locale keys stay aligned.
- `bun run check` passes.
- `bun run release:check` passes from a clean branch before tagging or deploying.
- `bun run build` passes.
- CI/staging uses `bun run db:migrate:deploy`, not `bun run db:migrate`.
- `/api/health` returns `ok` on staging.
- Login, dashboard, customer detail page, and report flows are smoke-tested.
- English and Arabic toggling is verified.
- Push and image-upload optional states are verified.
- README matches the final deployment flow.
