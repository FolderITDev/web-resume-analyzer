import { EXAMPLE_RESUMES } from '@/content/example-resumes';
import { analyzeResume } from '@/domain/analysis/analyze';

const EXAMPLE_SLUG = 'diego-marquez';
const REFERENCE_DATE = new Date('2026-10-01T00:00:00Z');

const resume = EXAMPLE_RESUMES.find((item) => item.slug === EXAMPLE_SLUG);
if (!resume) throw new Error(`Example resume "${EXAMPLE_SLUG}" is missing.`);

/**
 * A report produced by the engine at build time from one of the example resumes, so the landing
 * page shows actual engine output.
 */
export const EXAMPLE_REPORT = analyzeResume({ text: resume.text, referenceDate: REFERENCE_DATE });
export const EXAMPLE_DESCRIPTION = 'Example report for a mobile engineer’s resume';
