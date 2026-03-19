# Release Checklist

- Secrets removed from tracked files and rotated outside the repo.
- `.env.example` matches the real runtime contract.
- `bun run lint` passes.
- `bun run typecheck` passes.
- `bun run test` passes.
- `bun run build` passes.
- `/api/health` returns `ok` on staging.
- Login, dashboard, customer detail page, and report flows are smoke-tested.
- English and Arabic toggling is verified.
- Push and image-upload optional states are verified.
- README matches the final deployment flow.
