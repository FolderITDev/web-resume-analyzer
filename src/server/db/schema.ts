import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

import {
  ANALYSIS_STAGES,
  ANALYSIS_STATUSES,
  type AnalysisReport,
  GRADES,
} from '@/lib/validation/analysis';

export const analysisStatus = pgEnum('analysis_status', ANALYSIS_STATUSES);
export const analysisStage = pgEnum('analysis_stage', ANALYSIS_STAGES);
export const fileType = pgEnum('file_type', ['pdf', 'docx']);
export const grade = pgEnum('grade', GRADES);

/**
 * One row per analysis. The uploaded file and the job description are never stored: they are
 * forwarded to the analysis engine, and only file metadata and the report are persisted.
 */
export const analyses = pgTable(
  'analyses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** SHA-256 of the visitor's anonymous session token. Null for examples. */
    ownerHash: text('owner_hash'),
    isExample: boolean('is_example').notNull().default(false),
    status: analysisStatus('status').notNull().default('queued'),
    stage: analysisStage('stage').notNull().default('received'),
    fileName: text('file_name').notNull(),
    fileType: fileType('file_type').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    jobTitle: text('job_title'),
    hasJobDescription: boolean('has_job_description').notNull().default(false),
    score: smallint('score'),
    grade: grade('grade'),
    report: jsonb('report').$type<AnalysisReport>(),
    /** The job ID the analysis engine assigned; used to follow the job until it finishes. */
    engineJobId: text('engine_job_id'),
    engineVersion: text('engine_version'),
    errorCode: text('error_code'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    startedAt: timestamp('started_at', { withTimezone: true }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
  },
  (table) => [
    index('analyses_owner_created_idx').on(table.ownerHash, table.createdAt.desc()),
    index('analyses_example_created_idx').on(table.isExample, table.createdAt.desc()),
    check('analyses_score_range', sql`${table.score} IS NULL OR ${table.score} BETWEEN 0 AND 100`),
    check(
      'analyses_owner_or_example',
      sql`(${table.isExample} AND ${table.ownerHash} IS NULL) OR (NOT ${table.isExample} AND ${table.ownerHash} IS NOT NULL)`,
    ),
  ],
);

export type AnalysisRow = typeof analyses.$inferSelect;
export type NewAnalysisRow = typeof analyses.$inferInsert;
