import { z } from 'zod';

/**
 * API contracts shared by the route handlers, the browser client and the OpenAPI document.
 * Every response body is parsed with these schemas on the client and validated before it
 * leaves the server, so the documented shape and the real one cannot drift apart.
 */

export const CATEGORY_IDS = [
  'structure',
  'impact',
  'skills',
  'clarity',
  'experience',
  'completeness',
] as const;
export const CategoryIdSchema = z.enum(CATEGORY_IDS);
export type CategoryId = z.infer<typeof CategoryIdSchema>;

export const SKILL_CATEGORIES = [
  'language',
  'frontend',
  'backend',
  'data',
  'cloud',
  'testing',
  'practice',
  'design',
] as const;
export const SkillCategorySchema = z.enum(SKILL_CATEGORIES);
export type SkillCategory = z.infer<typeof SkillCategorySchema>;

export const SECTION_IDS = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
] as const;
export const SectionIdSchema = z.enum(SECTION_IDS);
export type SectionId = z.infer<typeof SectionIdSchema>;

export const SeveritySchema = z.enum(['high', 'medium', 'low']);
export type Severity = z.infer<typeof SeveritySchema>;

export const GRADES = ['excellent', 'strong', 'fair', 'needs-work'] as const;
export const GradeSchema = z.enum(GRADES);
export type Grade = z.infer<typeof GradeSchema>;

export const FindingSchema = z
  .object({
    ruleId: z.string().meta({ example: 'IMP-01' }),
    category: CategoryIdSchema,
    severity: SeveritySchema,
    title: z.string(),
    detail: z.string(),
  })
  .meta({ id: 'Finding', description: 'A strength or an issue, always traceable to one rule.' });
export type Finding = z.infer<typeof FindingSchema>;

export const RecommendationSchema = z
  .object({
    ruleId: z.string(),
    priority: z.int().min(1).max(3).meta({ description: '1 is the most important.' }),
    title: z.string(),
    detail: z.string(),
  })
  .meta({ id: 'Recommendation' });
export type Recommendation = z.infer<typeof RecommendationSchema>;

export const CategoryScoreSchema = z
  .object({
    id: CategoryIdSchema,
    label: z.string(),
    score: z.int().min(0).max(100),
    weight: z.number().min(0).max(1),
  })
  .meta({ id: 'CategoryScore' });
export type CategoryScore = z.infer<typeof CategoryScoreSchema>;

export const DetectedSkillSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: SkillCategorySchema,
    mentions: z.int().min(1),
  })
  .meta({ id: 'DetectedSkill' });
export type DetectedSkill = z.infer<typeof DetectedSkillSchema>;

export const ExperienceSchema = z
  .object({
    estimatedYears: z.number().min(0).meta({ description: 'Merged, non-overlapping dated roles.' }),
    datedRoles: z.int().min(0),
    earliestYear: z.int().nullable(),
    hasCurrentRole: z.boolean(),
  })
  .meta({ id: 'Experience' });
export type Experience = z.infer<typeof ExperienceSchema>;

export const JobMatchSchema = z
  .object({
    score: z.int().min(0).max(100),
    matchedSkills: z.array(z.string()),
    missingSkills: z.array(z.string()),
    keywordCoverage: z.number().min(0).max(1),
    missingKeywords: z.array(z.string()),
  })
  .meta({ id: 'JobMatch', description: 'Present only when a job description was provided.' });
export type JobMatch = z.infer<typeof JobMatchSchema>;

export const ResumeStatsSchema = z
  .object({
    wordCount: z.int().min(0),
    bulletCount: z.int().min(0),
    quantifiedBullets: z.int().min(0),
    actionVerbBullets: z.int().min(0),
  })
  .meta({ id: 'ResumeStats' });
export type ResumeStats = z.infer<typeof ResumeStatsSchema>;

export const AnalysisReportSchema = z
  .object({
    engineVersion: z.string(),
    score: z.int().min(0).max(100),
    grade: GradeSchema,
    summary: z.string(),
    categories: z.array(CategoryScoreSchema),
    sections: z.array(z.object({ id: SectionIdSchema, present: z.boolean() })),
    skills: z.array(DetectedSkillSchema),
    experience: ExperienceSchema,
    strengths: z.array(FindingSchema),
    issues: z.array(FindingSchema),
    recommendations: z.array(RecommendationSchema),
    jobMatch: JobMatchSchema.nullable(),
    stats: ResumeStatsSchema,
  })
  .meta({ id: 'AnalysisReport' });
export type AnalysisReport = z.infer<typeof AnalysisReportSchema>;

export const ANALYSIS_STATUSES = ['queued', 'processing', 'completed', 'failed'] as const;
export const AnalysisStatusSchema = z.enum(ANALYSIS_STATUSES);
export type AnalysisStatus = z.infer<typeof AnalysisStatusSchema>;

export const ANALYSIS_STAGES = [
  'received',
  'extracting',
  'parsing',
  'matching',
  'scoring',
  'done',
] as const;
export const AnalysisStageSchema = z.enum(ANALYSIS_STAGES);
export type AnalysisStage = z.infer<typeof AnalysisStageSchema>;

export const FileTypeSchema = z.enum(['pdf', 'docx']);
export type FileType = z.infer<typeof FileTypeSchema>;

export const AnalysisErrorSchema = z
  .object({ code: z.string(), message: z.string() })
  .meta({ id: 'AnalysisError' });

export const AnalysisSchema = z
  .object({
    id: z.uuid(),
    status: AnalysisStatusSchema,
    stage: AnalysisStageSchema,
    file: z.object({ name: z.string(), type: FileTypeSchema, sizeBytes: z.int().min(0) }),
    jobTitle: z.string().nullable(),
    hasJobDescription: z.boolean(),
    isExample: z.boolean(),
    createdAt: z.iso.datetime(),
    completedAt: z.iso.datetime().nullable(),
    report: AnalysisReportSchema.nullable(),
    error: AnalysisErrorSchema.nullable(),
  })
  .meta({ id: 'Analysis' });
export type Analysis = z.infer<typeof AnalysisSchema>;

export const AnalysisSummarySchema = z
  .object({
    id: z.uuid(),
    status: AnalysisStatusSchema,
    fileName: z.string(),
    jobTitle: z.string().nullable(),
    score: z.int().min(0).max(100).nullable(),
    grade: GradeSchema.nullable(),
    isExample: z.boolean(),
    createdAt: z.iso.datetime(),
  })
  .meta({ id: 'AnalysisSummary' });
export type AnalysisSummary = z.infer<typeof AnalysisSummarySchema>;

export const AnalysisListSchema = z
  .object({
    items: z.array(AnalysisSummarySchema),
    page: z.int().min(1),
    pageSize: z.int().min(1),
    total: z.int().min(0),
  })
  .meta({ id: 'AnalysisList' });
export type AnalysisList = z.infer<typeof AnalysisListSchema>;

export const SubmittedAnalysisSchema = z
  .object({
    id: z.uuid(),
    status: AnalysisStatusSchema,
    stage: AnalysisStageSchema,
    links: z.object({ self: z.string() }),
  })
  .meta({ id: 'SubmittedAnalysis' });
export type SubmittedAnalysis = z.infer<typeof SubmittedAnalysisSchema>;

/** Query string for GET /api/resumes/analyses. */
export const ListAnalysesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(12),
  status: AnalysisStatusSchema.optional(),
  q: z.string().trim().max(80).optional(),
  sort: z.enum(['newest', 'oldest', 'score-desc', 'score-asc']).default('newest'),
});
export type ListAnalysesQuery = z.infer<typeof ListAnalysesQuerySchema>;

export const JOB_DESCRIPTION_MAX_LENGTH = 12_000;
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_UPLOAD = {
  extensions: ['.pdf', '.docx'],
  mimeTypes: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

/** Text fields of the multipart upload. The file itself is validated by sniffing its bytes. */
export const AnalyzeFieldsSchema = z.object({
  jobTitle: z
    .string()
    .trim()
    .max(120, 'Keep the job title under 120 characters.')
    .optional()
    .transform((value) => value || undefined),
  jobDescription: z
    .string()
    .trim()
    .max(JOB_DESCRIPTION_MAX_LENGTH, 'Paste at most 12,000 characters of the job description.')
    .optional()
    .transform((value) => value || undefined),
});
export type AnalyzeFields = z.infer<typeof AnalyzeFieldsSchema>;

/** RFC 9457 problem details, the body of every error response. */
export const ProblemSchema = z
  .object({
    type: z.string(),
    title: z.string(),
    status: z.int(),
    detail: z.string().optional(),
    code: z.string(),
    errors: z
      .array(z.object({ path: z.string(), message: z.string() }))
      .optional()
      .meta({ description: 'Field-level validation errors.' }),
  })
  .meta({ id: 'Problem' });
export type Problem = z.infer<typeof ProblemSchema>;
