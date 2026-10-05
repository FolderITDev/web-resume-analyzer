# Security and privacy

Resume Analyzer is a public web application without accounts. Uploaded files are processed in memory and never stored; reports are linked to an anonymous HttpOnly cookie, stored as the SHA-256 hash of its token, and deleted after 24 hours. It is not designed to hold regulated or highly sensitive data.

## Reporting a vulnerability

Report vulnerabilities privately through [GitHub private vulnerability reporting](https://github.com/FolderITDev/web-resume-analyzer/security/advisories/new). Do not disclose personal data or exploitable details in public issues. For anything else, contact Folder IT through [folderit.net](https://folderit.net).

This is a static reference repository without a support commitment; reports are reviewed on a best-effort basis.

## Controls in place

- Uploads are limited to 5 MB, identified by their bytes rather than their name or MIME type, and the extension must match the content.
- Every request body, query string and response body is validated with Zod; SQL is built with Drizzle's parameterized queries, and search terms escape `LIKE` wildcards.
- Visitors can only read example analyses and their own; other IDs return 404.
- A per-client rate limit applies to uploads.
- Security headers: `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options` and `Permissions-Policy`. The `X-Powered-By` header is disabled.
- Errors never return stack traces, file contents or resume text.

## Dependency advisories

At the time of writing, `pnpm audit` reports one moderate advisory in production dependencies: `sprintf-js` through `mammoth > argparse`, used only by mammoth's command-line interface, which this application does not run ([GHSA-hp3w-g68c-fv3c](https://github.com/advisories/GHSA-hp3w-g68c-fv3c)). Development-only tooling reports a high advisory in `braces` through `eslint-config-next` ([GHSA-vfj7-8cjw-p6xm](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)) and a moderate one in an old `esbuild` through `drizzle-kit` ([GHSA-67mh-4wv8-2f99](https://github.com/advisories/GHSA-67mh-4wv8-2f99)); neither ships in the production build. Recheck `pnpm audit` before publication; do not describe the dependency graph as vulnerability-free.
