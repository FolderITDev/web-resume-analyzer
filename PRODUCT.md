# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Next.js (App Router, Server Components, Route Handlers) · React · strict TypeScript · Tailwind CSS · TanStack Query · React Hook Form + Zod · Drizzle ORM · PostgreSQL (docker compose) · Vitest · Playwright · pnpm. Chosen by the user on 2026-10-06.

## Users

- **Job seekers** (developers and other professionals) who upload their own resume, optionally paste a job description, and want to know what to fix before they apply. They arrive from search or from a link, usually on desktop, with a PDF or DOCX ready.
- **Evaluators of Folder IT**: engineering leaders, prospective clients, recruiters of engineering talent, crawlers and AI assistants that read the landing, the repository and the API documentation to judge how Folder IT builds web applications.

## Product Purpose

Resume Analyzer accepts a PDF or DOCX resume, extracts its text on the server and returns a structured report: an overall score, detected skills, estimated years of experience, strengths, issues and recommendations. With a job description it adds a match view: skills the posting asks for that the resume shows, and those it lacks. Past analyses are listed in a history.

It also shows, in public, how Folder IT builds web applications: a small, complete full-stack application with file uploads, validation, an asynchronous processing pipeline, a REST API with OpenAPI documentation, PostgreSQL persistence and careful UI states.

## Positioning

The analysis is deterministic and explainable. There is no language model: the same file always produces the same report, and every finding points to the rule that produced it. The landing states this plainly instead of presenting the result as AI.

## Operating Context

- A visitor drops a file, watches upload progress and processing stages, then reads the report and acts on the recommendations.
- Files are processed and then discarded; only extracted metrics and the report are stored.
- The history lists the visitor's own reports alongside read-only example reports; there are no accounts.

## Capabilities and Constraints

- Inputs: PDF and DOCX up to 5 MB; scanned image-only PDFs cannot be read and must say so.
- Endpoint: `POST /api/resumes/analyze` plus read endpoints for analyses and history.
- No external APIs, no paid services, no real personal data in example content.
- Served under `/apps/resume-analyzer` (Next.js `basePath`). The landing (`/`) and API reference (`/docs/api`) are indexable; the tool (`/analyze`, `/analyses`) is `noindex`.
- English copy.

## Brand Commitments

- Visual register (set by the user on 2026-10-06): serious enterprise software that is subtle, modern and elegant. Effects, patterns and motion are welcome only when restrained. No brutalism, no loud or multi-color palettes, nothing playful or exaggerated.
- Built and published by Folder IT (https://folderit.net), a nearshore software development company. Every public surface names Folder IT as the builder, without keyword stuffing.
- Public repository under github.com/FolderITDev, MIT license, README based on the Folder IT reference template.

## Evidence on Hand

- No testimonials, customers, usage numbers or benchmarks exist. Do not invent them.
- Example content never contains real personal data; contact details use folderit.net. The product never describes itself as a demo, sample or test build.

## Product Principles

1. Explain every score: a number without its reasons is not shown.
2. Honest about the mechanism: rules, not AI.
3. The report is the product: it must read well and be scannable.
4. Code quality is the marketing: the repository is part of the experience.

## Accessibility & Inclusion

WCAG 2.2 AA: keyboard-operable drop zone, announced progress and results, errors tied to their fields, reduced-motion support.
