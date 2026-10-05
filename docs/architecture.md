# Architecture and decisions

Resume Analyzer is a Next.js application with its own REST API and PostgreSQL database. The public pages are prerendered; the tool is a set of client islands that talk to the API.

## Layers

```text
src/app/(marketing)   Server Components     → public, indexable pages with real engine output
src/app/(tool)        thin pages            → render a feature component inside Suspense
src/features/         client components     → TanStack Query, forms, states
src/lib/api/          browser client        → fetch / XHR, Zod-parsed responses, ApiError
src/app/api/          Route Handlers        → parse input, call a service, validate output
src/server/services/  use cases             → validation, ownership, the analysis pipeline
src/server/repositories/ data access        → Drizzle queries, visibility filter
src/domain/analysis/  pure rules engine     → no React, Next.js, I/O or clock
PostgreSQL            analyses table        → metadata, status, stage, report (JSONB)
```

Dependencies point down only. The domain and the validation contracts are the only modules shared by the browser and the server.

## Request flow

1. The browser checks the file (extension, size) with the same limits the server uses and uploads it with `XMLHttpRequest`, which reports progress.
2. `POST /api/resumes/analyze` applies a rate limit, reads the multipart body, ensures an anonymous session and calls `AnalysisService.submit`.
3. The service validates the fields with Zod, sniffs the file's magic bytes (`%PDF-` or a ZIP containing `word/`), checks that the extension matches, purges expired visitor analyses, fails stale jobs and inserts a `queued` row.
4. The handler responds `202 Accepted` with `Location`, and schedules the pipeline with `after()`.
5. The pipeline moves the row through `extracting`, `parsing`, `matching` (only with a job description) and `scoring`, then stores the report with `completed`, or an error code with `failed`.
6. The browser polls `GET /api/resumes/analyses/{id}` every 700 ms with TanStack Query and stops at a terminal status.

## The rules engine

`analyzeResume({ text, jobDescription, referenceDate })` in `src/domain/analysis/analyze.ts`:

- **Normalization** unifies newlines, removes control characters and collapses spaces.
- **Sections** are recognized from short heading lines (Experience, Work history, Technical skills…). Lines before the first heading are the header.
- **Bullets** are lines that start with a bullet glyph or a number; a bullet is _quantified_ if it contains a number that is not a year, a percentage or a currency amount.
- **Experience** comes from date ranges in the experience section (`Mar 2021 – Present`, `2018 - 2021`, `03/2017 to 06/2020`). Ranges are clamped to the reference date, inverted ranges are ignored, and overlapping roles are merged before counting months.
- **Skills** are matched against an 81-entry taxonomy with aliases. Longer spellings match first and mask their text, so "React Native" is never also "React". Ambiguous words (Go, R, C) only match through unambiguous aliases.
- **Rules** are pure functions of the collected facts. Each returns a score from 0 to 1 and, when relevant, a strength, an issue and a recommendation. Category scores are severity-weighted averages; the overall score is the weighted sum of six categories.
- **Job matching** compares detected skills (70%) and the posting's distinctive non-skill terms (30%).

Because the reference date is an input, a report is reproducible: tests, the seed and the landing page all call the same function.

## Persistence

- **One table.** An analysis is one row: file metadata, status and stage enums, score and grade columns for sorting, the report as JSONB, the engine version and timestamps. The report is validated by its Zod schema whenever it leaves the server.
- **Integrity in the database.** Check constraints keep the score between 0 and 100 and require each row to be an example or owned by a session, never both.
- **Indexes for the real queries.** `(owner_hash, created_at desc)` and `(is_example, created_at desc)` serve the history list.
- **Migrations.** Drizzle Kit generates SQL into `drizzle/`; `runMigrations` applies them for the CLI, the integration tests and CI.
- **Seed.** `seedDatabase` recomputes the example reports with the current engine inside a transaction, replacing only example rows.

## Privacy model

Visitors are anonymous. The first upload sets an HttpOnly, SameSite=Lax cookie scoped to the app path, holding 24 random bytes. Only its SHA-256 hash is stored, so the database alone cannot be used to impersonate a visitor. The repository's visibility filter returns examples plus the caller's rows; anything else is a 404. Visitor rows are deleted 24 hours after creation, and files and job descriptions are never stored.

## Rendering and caching

Cache Components and Partial Prefetching are enabled. The landing page and API reference are fully static: the example report shown on the landing page is computed at build time by the same engine. Tool pages prerender their shell and stream client components inside Suspense. Route Handlers that read the request are dynamic; `/api/openapi.json`, `/llms.txt`, the sitemap and the social image are static.

## Interface

The visual system is documented in [DESIGN.md](../DESIGN.md). Server Components render everything that does not need interaction. Client components are limited to the upload form, the analysis view, the history table, the skills filter and the navigation's active state. Motion uses CSS transitions with `@starting-style`, transforms and opacity; `motion` is used only for presence and height animations in the upload form.

## Verification

- Vitest `unit`: the engine and its building blocks.
- Vitest `components`: design system components in jsdom.
- Vitest `integration`: Route Handlers called directly with `Request` objects against a real PostgreSQL test database, with `after()` collected so tests can await the pipeline.
- Playwright: the main flows and axe WCAG 2.2 AA scans against a production build, at desktop and mobile sizes.

## Deployment

The app is built with `basePath: '/apps/resume-analyzer'`. Set `SITE_ORIGIN` to the public origin at build time so canonical URLs, the sitemap and JSON-LD use the public origin. The root `robots.txt` of that origin should reference `/apps/resume-analyzer/sitemap.xml`. The in-process rate limiter and `after()` pipeline assume a single long-lived instance; serverless or multi-instance deployments should move them to a shared store and a job queue.
