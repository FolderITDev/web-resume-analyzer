import { z } from 'zod';

import {
  ACCEPTED_UPLOAD,
  type Analysis,
  type AnalysisList,
  AnalyzeFieldsSchema,
  type FileType,
  type ListAnalysesQuery,
  MAX_UPLOAD_BYTES,
} from '@/lib/validation/analysis';

import {
  type AnalysisEngine,
  AnalysisEngineError,
  type EngineJob,
  type EngineSubmission,
  type RunningEngineJob,
  type SettledEngineJob,
} from '../analysis-engine/client';
import { type AnalysisRow } from '../db/schema';
import {
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedFileError,
  ValidationError,
} from '../errors';
import { type AnalysisRepository } from '../repositories/analysis-repository';
import { sniffFileType } from '../uploads/file-type';

const VISITOR_RETENTION_MS = 24 * 60 * 60 * 1000;
const STALE_JOB_MS = 5 * 60 * 1000;
/** How long the engine has to finish a job before the analysis is marked as failed. */
const ENGINE_DEADLINE_MS = 2 * 60 * 1000;
/** Delays before the first status reads; after these, the job is read once a second. */
const FIRST_POLL_DELAYS_MS = [250, 500, 750] as const;
const POLL_INTERVAL_MS = 1000;
const FILE_NAME_MAX = 160;

export type UploadedFile = { name: string; bytes: Uint8Array };

export type SubmitInput = {
  file: UploadedFile | null;
  fields: { jobTitle?: unknown; jobDescription?: unknown };
  ownerHash: string;
};

type Dependencies = {
  repository: AnalysisRepository;
  engine: AnalysisEngine;
  now?: () => Date;
  wait?: (ms: number) => Promise<void>;
};

const defaultWait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const ENGINE_UNAVAILABLE = {
  errorCode: 'engine_unavailable',
  errorMessage: 'The analysis service is not available right now. Try again in a moment.',
} as const;

const isRunning = (job: EngineJob): job is RunningEngineJob =>
  job.status === 'queued' || job.status === 'processing';

const pollDelay = (attempt: number) => FIRST_POLL_DELAYS_MS[attempt] ?? POLL_INTERVAL_MS;

export function toAnalysis(row: AnalysisRow): Analysis {
  return {
    id: row.id,
    status: row.status,
    stage: row.stage,
    file: { name: row.fileName, type: row.fileType, sizeBytes: row.fileSizeBytes },
    jobTitle: row.jobTitle,
    hasJobDescription: row.hasJobDescription,
    isExample: row.isExample,
    createdAt: row.createdAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    report: row.status === 'completed' ? row.report : null,
    error: row.errorCode
      ? { code: row.errorCode, message: row.errorMessage ?? 'The analysis failed.' }
      : null,
  };
}

function cleanFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'resume';
  return base.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, FILE_NAME_MAX) || 'resume';
}

function validateFile(file: UploadedFile | null): {
  type: FileType;
  name: string;
  bytes: Uint8Array;
} {
  if (!file || file.bytes.byteLength === 0) {
    throw new ValidationError('Choose a PDF or DOCX file to analyze.', [
      { path: 'file', message: 'A file is required.' },
    ]);
  }
  if (file.bytes.byteLength > MAX_UPLOAD_BYTES) {
    throw new PayloadTooLargeError('The file is larger than 5 MB. Export a smaller PDF or DOCX.');
  }
  const name = cleanFileName(file.name);
  const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
  const type = sniffFileType(file.bytes);
  if (
    !type ||
    !(ACCEPTED_UPLOAD.extensions as readonly string[]).includes(extension) ||
    `.${type}` !== extension
  ) {
    throw new UnsupportedFileError(
      'Only PDF and DOCX resumes are supported, and the file content must match its extension.',
    );
  }
  return { type, name, bytes: file.bytes };
}

/**
 * Use cases for resume analyses. Route handlers call these; nothing here knows about HTTP,
 * and the repository is injected so tests can run it against a real, isolated database.
 */
export function createAnalysisService({
  repository,
  engine,
  now = () => new Date(),
  wait = defaultWait,
}: Dependencies) {
  /** Reads the job until it settles, recording every stage the engine reports on the way. */
  async function follow(id: string, submitted: EngineJob): Promise<SettledEngineJob> {
    const deadline = now().getTime() + ENGINE_DEADLINE_MS;
    let job = submitted;
    for (let attempt = 0; isRunning(job); attempt++) {
      if (now().getTime() > deadline) {
        throw new AnalysisEngineError(`Job ${job.id} did not finish within the deadline.`);
      }
      await wait(pollDelay(attempt));
      const next = await engine.get(job.id);
      if (isRunning(next) && next.stage !== job.stage) {
        await repository.update(id, { stage: next.stage });
      }
      job = next;
    }
    return job;
  }

  async function process(
    id: string,
    file: EngineSubmission['file'],
    jobDescription: string | undefined,
  ) {
    try {
      const submitted = await engine.submit({ file, jobDescription });
      await repository.update(id, {
        status: 'processing',
        stage: submitted.stage,
        engineJobId: submitted.id,
        startedAt: now(),
      });

      const job = await follow(id, submitted);
      if (job.status === 'failed') {
        await repository.update(id, {
          status: 'failed',
          errorCode: job.error.code,
          errorMessage: job.error.message,
          completedAt: now(),
        });
        return;
      }

      await repository.update(id, {
        status: 'completed',
        stage: 'done',
        score: job.report.score,
        grade: job.report.grade,
        report: job.report,
        engineVersion: job.report.engineVersion,
        completedAt: now(),
      });
    } catch (error) {
      console.error('Analysis pipeline failed', { id, error });
      await repository.update(id, {
        status: 'failed',
        ...(error instanceof AnalysisEngineError
          ? ENGINE_UNAVAILABLE
          : {
              errorCode: 'internal_error',
              errorMessage: 'The analysis could not be completed. Try again in a moment.',
            }),
        completedAt: now(),
      });
    }
  }

  async function get(id: string, ownerHash: string | null): Promise<Analysis> {
    if (!z.uuid().safeParse(id).success) throw new NotFoundError('No analysis with this ID.');
    const row = await repository.findVisible(id, ownerHash);
    if (!row) throw new NotFoundError('No analysis with this ID.');
    return toAnalysis(row);
  }

  return {
    get,

    /**
     * Validates and records an upload. The returned `run` hands the file to the analysis engine
     * and follows the job; the caller decides when (after the response in production, at once
     * in tests).
     */
    async submit({ file, fields, ownerHash }: SubmitInput) {
      const { jobTitle, jobDescription } = AnalyzeFieldsSchema.parse(fields);
      const { type, name, bytes } = validateFile(file);

      const current = now();
      await repository.deleteExpired(new Date(current.getTime() - VISITOR_RETENTION_MS));
      await repository.failStale(new Date(current.getTime() - STALE_JOB_MS), current);

      const row = await repository.insert({
        ownerHash,
        fileName: name,
        fileType: type,
        fileSizeBytes: bytes.byteLength,
        jobTitle: jobTitle ?? null,
        hasJobDescription: Boolean(jobDescription),
        createdAt: current,
      });

      return {
        analysis: toAnalysis(row),
        run: () => process(row.id, { name, type, bytes }, jobDescription),
      };
    },

    async list(query: ListAnalysesQuery, ownerHash: string | null): Promise<AnalysisList> {
      const { rows, total } = await repository.list(query, ownerHash);
      return {
        items: rows.map((row) => ({
          id: row.id,
          status: row.status,
          fileName: row.fileName,
          jobTitle: row.jobTitle,
          score: row.score,
          grade: row.grade,
          isExample: row.isExample,
          createdAt: row.createdAt.toISOString(),
        })),
        page: query.page,
        pageSize: query.pageSize,
        total,
      };
    },

    async remove(id: string, ownerHash: string | null): Promise<void> {
      const analysis = await get(id, ownerHash);
      if (analysis.isExample) throw new ForbiddenError('Example reports cannot be deleted.');
      if (!ownerHash || !(await repository.deleteOwned(id, ownerHash)))
        throw new NotFoundError('No analysis with this ID.');
    },
  };
}

export type AnalysisService = ReturnType<typeof createAnalysisService>;
