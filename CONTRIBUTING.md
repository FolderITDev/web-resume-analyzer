# Contributing

Use the Node.js version pinned in `.node-version` (24) and the pnpm version pinned in `package.json`, run `pnpm install`, and read `AGENTS.md`, `DESIGN.md` and `docs/architecture.md` before editing. Keep changes small and in scope; all code, UI copy and documentation are English.

Start PostgreSQL with `docker compose up -d`, then run `pnpm db:migrate` and `pnpm db:seed`. Before opening a pull request, run `pnpm check`, `pnpm format:check`, `pnpm build` and `pnpm test:e2e`. For interface changes, include desktop and mobile screenshots and describe the loading, empty and error states you checked.

Never commit real resumes, personal data, credentials, customer code or build output. Fixtures are generated from the example resumes with `pnpm fixtures`. New dependencies require a demonstrated need and a license review. AI-assisted contributions require human review of the diff and the same verification as any other contribution.
