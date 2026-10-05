# AI-assisted engineering

Resume Analyzer runs no AI inference. AI coding agents are used as development tools, and their changes meet the same bar as any other change.

1. **Constraints first.** Give the agent [AGENTS.md](../AGENTS.md) and [DESIGN.md](../DESIGN.md) as explicit constraints, with a bounded task and observable acceptance criteria.
2. **Real APIs only.** Resolve framework APIs against the documentation shipped in `node_modules/next/dist/docs/` and the installed type definitions. Reject invented APIs, options and packages.
3. **Rules stay in code.** Scoring lives in pure, tested functions with stable rule IDs. Model output never replaces a rule, a validation or a test.
4. **Review every diff.** Check for unnecessary dependencies, secrets, logging of personal data, wider data access, accessibility regressions and claims the application does not support.
5. **Verify.** Run `pnpm check`, `pnpm format:check`, `pnpm build` and `pnpm test:e2e`. Never report a check as passing unless it ran.
6. **Data boundaries.** Never give a model real resumes, personal data, customer code or credentials. The fixtures and examples in this repository contain no real personal data for that reason.

## A language model as an extension (not implemented)

Rewriting bullet points or summarizing a resume with a model is a possible extension, not part of the application. If it is built, it must:

- run the model on the server, with server-side credentials and a per-request budget;
- keep the deterministic score as the source of truth and present model output as a suggestion the person accepts or rejects;
- treat resume and job description text as untrusted data, never as instructions;
- validate model output against a narrow schema and fall back to the rule-based recommendations on failure;
- be evaluated against a versioned set of example resumes, reporting quality, refusals and cost;
- keep the current guarantee that uploaded files are never stored.
