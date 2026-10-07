# Resume Analyzer

Instructions for anyone, human or AI coding agent, changing this repository. Read this file, [DESIGN.md](DESIGN.md) and [docs/architecture.md](docs/architecture.md) before editing.

Resume Analyzer is a full-stack web application that scores PDF and DOCX resumes through an external analysis engine. A visitor uploads a resume, optionally adds a job description, follows the pipeline and reads a report. It is built and maintained by Folder IT.

The analysis engine, reached at `ANALYSIS_ENGINE_URL`, is the only external service. There is no account system. PostgreSQL stores analyses and reports; uploaded files are never stored.

**Stack:** Next.js 16 (App Router, Cache Components, Route Handlers) · React 19 · TypeScript 6 (strict) · Tailwind CSS 4 · TanStack Query 5 · React Hook Form + Zod 4 · Drizzle ORM · PostgreSQL 17 · Vitest · Playwright · pnpm 10 · Node.js 24.

This version of Next.js has breaking changes from older releases. Read the relevant guide in `node_modules/next/dist/docs/` before using an API.

---

## Commands

| Command                             | Purpose                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `pnpm install`                      | Install the locked dependencies.                                                                                   |
| `docker compose up -d`              | Start PostgreSQL on port 5441 (development and test databases).                                                    |
| `pnpm db:migrate` / `pnpm db:seed`  | Apply migrations / replace the example analyses.                                                                   |
| `pnpm db:generate`                  | Generate a SQL migration after changing `src/server/db/schema.ts`.                                                 |
| `pnpm dev`                          | Development server on http://localhost:3010/apps/resume-analyzer (set `ANALYSIS_ENGINE_URL` in `.env` to analyze). |
| `pnpm check`                        | ESLint, route typegen + `tsc`, and every Vitest project.                                                           |
| `pnpm format` / `pnpm format:check` | Prettier with Tailwind class sorting.                                                                              |
| `pnpm build` then `pnpm test:e2e`   | Production build and Playwright end-to-end tests.                                                                  |
| `pnpm fixtures`                     | Regenerate the PDF and DOCX fixtures and public examples.                                                          |

## Project structure

| Location              | Responsibility                                                                                                   |
| --------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `src/app/`            | Routes only: `(marketing)` public pages, `(tool)` noindex tool pages, `api/` Route Handlers, metadata files.     |
| `src/server/`         | Server-only: services, repositories, Drizzle schema and seed, the analysis engine client, HTTP helpers, OpenAPI. |
| `src/lib/validation/` | Zod contracts for every request and response.                                                                    |
| `src/lib/api/`        | Browser API client and `ApiError`.                                                                               |
| `src/features/`       | Feature components and TanStack Query options.                                                                   |
| `src/components/`     | Design system components documented in DESIGN.md.                                                                |
| `src/content/`        | Example resumes, job postings, the engine's stored reports for them and FAQ copy.                                |
| `tests/`, `e2e/`      | Vitest (unit, components, integration), Playwright and the engine contract double in `tests/support/`.           |

---

## Critical rules (always apply)

### R1. Layers point one way

UI → API client → Route Handler → service → repository → database. Components never import from `src/server`; Route Handlers contain no business logic; repositories contain no rules. Only `src/server/analysis-engine` talks to the analysis engine, and only services use it.

### R2. Contracts are Zod schemas

Every request body, query string and response body has a schema in `src/lib/validation`. Handlers parse input with it and send output through `json(schema, body)`, which validates before responding. The browser client parses every response with the same schema. A new schema that appears in the API needs a `.meta({ id })` so the OpenAPI document references it.

### R3. Errors are typed problems

Throw `AppError` subclasses from `src/server/errors.ts`; never build error responses by hand. `handle()` turns them into RFC 9457 problems with a stable `code` and calls `unstable_rethrow` first so Next.js signals are never swallowed. Document new codes in `docs/api.md`.

### R4. The engine is an external contract

The analysis runs in the engine behind `ANALYSIS_ENGINE_URL`; this repository holds its client, not its logic. Every engine response is parsed with `EngineJobSchema` before it is stored. Progress shown to visitors is the stage the engine reports, never a timer. When the engine's API changes, update the client, `AnalysisReportSchema` and the contract double in `tests/support/analysis-engine.ts` together, and refresh `src/content/example-reports.json` from the engine.

### R5. Files never persist

Uploaded bytes stay in memory only until they are sent to the engine. Do not write them to disk, the database, logs or error messages. Do not store the job description. Never log resume text or names.

### R6. Visitors only see examples and their own analyses

Ownership is the SHA-256 hash of the HttpOnly session token. Every query that reads analyses goes through the repository's visibility filter. Visitor analyses expire after 24 hours; examples cannot be deleted.

### R7. Schema changes are migrations

Change `src/server/db/schema.ts`, run `pnpm db:generate`, commit the SQL in `drizzle/`, and cover the change in an integration test. Never edit an applied migration.

### R8. Public pages stay indexable and static

Pages in `(marketing)` render their content on the server, use `pageMetadata()` for complete metadata, and keep JSON-LD in sync with visible content. Tool pages live in `(tool)`, which is `noindex`. New public pages go into `sitemap.ts`.

### R9. Use the design system

Follow [DESIGN.md](DESIGN.md): tokens from `globals.css`, components from `src/components`. No raw colors, ad hoc font sizes for new roles, or new accent colors. Monospace is for measurements, rule IDs and code only. Every state (loading, empty, error, success) is designed, and motion respects reduced motion.

### R10. Accessibility is tested

Interactive elements have names; status is never color alone; scroll regions are focusable; errors are announced. The axe checks in `e2e/` must stay at zero violations.

---

## Adding or changing a feature

1. Define or change the contract in `src/lib/validation`.
2. Put data access in a repository and the use case in a service, with unit tests for any logic around engine jobs.
3. Expose it through a thin Route Handler and cover it with an integration test against PostgreSQL.
4. Build the UI in `src/features` with TanStack Query, and design its loading, empty, error and success states.
5. Update the OpenAPI document, DESIGN.md, the README and the landing copy when visible behavior changes.

## Definition of done

- `pnpm check`, `pnpm format:check`, `pnpm build` and `pnpm test:e2e` pass.
- New endpoints, states and engine interactions are covered by tests at the right layer.
- English copy, in sentence case, with no claims the application does not support.
- Never report a check as passing unless it ran. Guidelines for AI-assisted changes are in [docs/ai-engineering.md](docs/ai-engineering.md).
