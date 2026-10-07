import { z } from 'zod';

import { AnalysisReportSchema } from '@/lib/validation/analysis';

import reports from './example-reports.json';
import { type ExampleResume } from './example-resumes';

/**
 * Reports the analysis engine returned for the example resumes, kept with the content so the
 * landing page and the example history show engine output without calling it at build time.
 * Parsed on load so a contract change cannot let a stale report through.
 */
export const EXAMPLE_REPORTS = z.record(z.string(), AnalysisReportSchema).parse(reports);

export function exampleReport(slug: ExampleResume['slug']) {
  const report = EXAMPLE_REPORTS[slug];
  if (!report) throw new Error(`No stored report for the example resume "${slug}".`);
  return report;
}
