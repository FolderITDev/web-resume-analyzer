import { startAnalysisEngine } from './analysis-engine';

/** Runs the analysis engine test double for the end-to-end tests (see playwright.config.ts). */
const port = Number(process.env.PORT ?? 3019);
const engine = await startAnalysisEngine(port);
process.stdout.write(`Analysis engine test double listening on ${engine.url}\n`);
