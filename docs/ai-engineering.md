# AI-assisted engineering

The analysis runs in an external engine; the application itself runs no inference. AI coding agents are used as development tools, and their changes meet the same bar as any other change.

1. **Constraints first.** Give the agent [AGENTS.md](../AGENTS.md) and [DESIGN.md](../DESIGN.md) as explicit constraints, with a bounded task and observable acceptance criteria.
2. **Real APIs only.** Resolve framework APIs against the documentation shipped in `node_modules/next/dist/docs/` and the installed type definitions. Reject invented APIs, options and packages.
3. **Contracts stay in code.** What the engine returns is validated against Zod schemas before it is stored or shown. Generated output never replaces a validation or a test.
4. **Review every diff.** Check for unnecessary dependencies, secrets, logging of personal data, wider data access, accessibility regressions and claims the application does not support.
5. **Verify.** Run `pnpm check`, `pnpm format:check`, `pnpm build` and `pnpm test:e2e`. Never report a check as passing unless it ran.
6. **Data boundaries.** Never give a model real resumes, personal data, customer code or credentials. The fixtures and examples in this repository contain no real personal data for that reason.

## Working with the analysis engine

The engine is an external service, reached only through `src/server/analysis-engine`. Changes that touch it must:

- treat every engine response as untrusted input and parse it with its schema;
- keep resume and job description text out of logs, error messages and the database;
- keep the API key on the server, read from `ANALYSIS_ENGINE_API_KEY`;
- update the contract double in `tests/support/analysis-engine.ts` together with the client, so the tests describe the API the engine actually serves;
- keep the guarantee that uploaded files are never stored by the application.
