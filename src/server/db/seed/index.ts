import { eq } from 'drizzle-orm';

import { EXAMPLE_JOB_DESCRIPTIONS } from '@/content/example-jobs';
import { EXAMPLE_RESUMES } from '@/content/example-resumes';
import { analyzeResume, ENGINE_VERSION } from '@/domain/analysis/analyze';

import { type Database } from '../client';
import { analyses, type NewAnalysisRow } from '../schema';

const HOUR = 60 * 60 * 1000;

/**
 * Replaces the example analyses with fresh ones computed by the current engine. Visitor
 * analyses are left untouched, so the seed is safe to run against a live database.
 */
export async function seedDatabase(db: Database, now = new Date()): Promise<number> {
  const rows: NewAnalysisRow[] = EXAMPLE_RESUMES.map((resume, index) => {
    const createdAt = new Date(now.getTime() - (index * 26 + 3) * HOUR);
    const completedAt = new Date(createdAt.getTime() + 4_000);
    const jobDescription = resume.jobDescriptionSlug
      ? EXAMPLE_JOB_DESCRIPTIONS[resume.jobDescriptionSlug]?.text
      : undefined;
    const report = analyzeResume({ text: resume.text, jobDescription, referenceDate: completedAt });
    return {
      isExample: true,
      ownerHash: null,
      status: 'completed',
      stage: 'done',
      fileName: resume.fileName,
      fileType: resume.fileType,
      fileSizeBytes: Math.round(resume.text.length * (resume.fileType === 'pdf' ? 0.62 : 2.4)),
      jobTitle: resume.jobTitle ?? null,
      hasJobDescription: Boolean(jobDescription),
      score: report.score,
      grade: report.grade,
      report,
      engineVersion: ENGINE_VERSION,
      createdAt,
      startedAt: new Date(createdAt.getTime() + 300),
      completedAt,
    };
  });

  await db.transaction(async (tx) => {
    await tx.delete(analyses).where(eq(analyses.isExample, true));
    await tx.insert(analyses).values(rows);
  });
  return rows.length;
}
