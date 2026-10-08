# Architecture and decisions

Resume Analyzer is a Next.js application with its own REST API and PostgreSQL database. The public pages are prerendered; the tool is a set of client islands that talk to the API.

## Layers

```text
src/app/(marketing)   Server Components     → public, indexable pages with stored engine reports
src/app/(tool)        thin pages            → render a feature component inside Suspense
src/features/         client components     → TanStack Query, forms, states
src/lib/api/          browser client        → fetch / XHR, Zod-parsed responses, ApiError
src/app/api/          Route Handlers        → parse input, call a service, validate output
src/server/services/  use cases             → validation, ownership, following engine jobs
src/server/repositories/ data access        → Drizzle queries, visibility filter
src/server/analysis-engine/ HTTP client     → the only code that knows ANALYSIS_ENGINE_URL
PostgreSQL            analyses table        → metadata, status, stage, report (JSONB)
```

Dependencies point down only. The validation contracts are the only modules shared by the browser and the server. The analysis itself runs in an external engine; the application reaches it only through `src/server/analysis-engine`.

## Request flow

1. The browser checks the file (extension, size) with the same limits the server uses and uploads it with `XMLHttpRequest`, which reports progress.
2. `POST /api/resumes/analyze` applies a rate limit, reads the multipart body, ensures an anonymous session and calls `AnalysisService.submit`.
3. The service validates the fields with Zod, sniffs the file's magic bytes (`%PDF-` or a ZIP containing `word/`), checks that the extension matches, purges expired visitor analyses, fails stale jobs and inserts a `queued` row.
4. The handler responds `202 Accepted` with `Location`, and schedules the pipeline with `after()`.
5. The pipeline submits the file and the job description to the analysis engine, stores the engine's job ID and reads the job until it settles, persisting each stage the engine reports (`extracting`, `parsing`, `matching` with a job description, `scoring`). It then stores the report with `completed`, or the engine's error code with `failed`.
6. The browser polls `GET /api/resumes/analyses/{id}` every 700 ms with TanStack Query and stops at a terminal status.

## The analysis engine

The analysis runs in an external service whose base URL is `ANALYSIS_ENGINE_URL` (with an optional bearer token in `ANALYSIS_ENGINE_API_KEY`). The application uses its job API:

| Method | Path                       | Body and response                                                                       |
| ------ | -------------------------- | --------------------------------------------------------------------------------------- |
| `POST` | `/v1/resume-analyses`      | Multipart `file` and optional `jobDescription`. Answers with the new job.               |
| `GET`  | `/v1/resume-analyses/{id}` | The job: `status`, `stage`, and the `report` once completed or the `error` once failed. |

A job's `status` is `queued`, `processing`, `completed` or `failed`; its `stage` uses the same values as an analysis. The report follows the `AnalysisReport` contract in `src/lib/validation/analysis.ts`, and its `engineVersion` is stored with the analysis.

- **Untrusted by default.** Every engine response is parsed with `EngineJobSchema`. A response outside the contract is treated like an outage, never stored.
- **Bounded waiting.** Status reads back off from 250 ms to one second, and a job that has not settled after two minutes fails the analysis. Each request times out after 15 seconds.
- **Clear failures.** An unreachable, misconfigured or misbehaving engine fails the analysis with `engine_unavailable`; a job the engine fails keeps the engine's own code and message, such as `no_text_found` for an image-only document.
- **Configuration on first use.** The engine settings are read when the first job is submitted, so the public pages and the history work while the engine is unavailable.

## Persistence

- **One table.** An analysis is one row: file metadata, status and stage enums, score and grade columns for sorting, the report as JSONB, the engine's job ID and version, and timestamps. The report is validated by its Zod schema whenever it leaves the server.
- **Integrity in the database.** Check constraints keep the score between 0 and 100 and require each row to be an example or owned by a session, never both.
- **Indexes for the real queries.** `(owner_hash, created_at desc)` and `(is_example, created_at desc)` serve the history list.
- **Migrations.** Drizzle Kit generates SQL into `drizzle/`; `runMigrations` applies them for the CLI, the integration tests and CI.
- **Seed.** `seedDatabase` inserts the engine's stored reports for the example resumes (`src/content/example-reports.json`) inside a transaction, replacing only example rows.

## Privacy model

Visitors are anonymous. The first upload sets an HttpOnly, SameSite=Lax cookie scoped to the app path, holding 24 random bytes. Only its SHA-256 hash is stored, so the database alone cannot be used to impersonate a visitor. The repository's visibility filter returns examples plus the caller's rows; anything else is a 404. Visitor rows are deleted 24 hours after creation. Files and job descriptions are forwarded to the analysis engine and never stored by the application.

## Rendering and caching

Cache Components and Partial Prefetching are enabled. The landing page and API reference are fully static: the example report shown on the landing page is one of the stored engine reports, validated against the report contract when the module loads. Tool pages prerender their shell and stream client components inside Suspense. Route Handlers that read the request are dynamic; `/api/openapi.json`, `/llms.txt`, the sitemap and the social image are static.

## Interface

The visual system is documented in [DESIGN.md](../DESIGN.md). Server Components render everything that does not need interaction. Client components are limited to the upload form, the analysis view, the history table, the skills filter and the navigation's active state. Motion uses CSS transitions with `@starting-style`, transforms and opacity; `motion` is used only for presence and height animations in the upload form.

## Verification

- Vitest `unit`: the engine client and the pipeline that follows engine jobs.
- Vitest `components`: design system components in jsdom.
- Vitest `integration`: Route Handlers called directly with `Request` objects against a real PostgreSQL test database, with `after()` collected so tests can await the pipeline, and a double of the engine's job API from `tests/support/analysis-engine.ts`.
- Playwright: the main flows and axe WCAG 2.2 AA scans against a production build, at desktop and mobile sizes, with the same engine double on port 3019.

## Deployment

The app is built with `basePath: '/apps/resume-analyzer'`. Set `SITE_ORIGIN` to the public origin at build time so canonical URLs, the sitemap and JSON-LD use the public origin. Set `ANALYSIS_ENGINE_URL` and, if the engine requires it, `ANALYSIS_ENGINE_API_KEY` at runtime. The in-process rate limiter and the `after()` job follower assume a single long-lived instance; serverless or multi-instance deployments should move them to a shared store and a job queue.

Rate limits count requests per client address. Set `TRUSTED_PROXY_HOPS` to the number of reverse proxies in front of the app (default 1): the address is read that many entries from the right of `X-Forwarded-For`, so a client cannot choose its own key by sending the header.
