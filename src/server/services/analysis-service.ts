import { z } from 'zod';

import { analyzeResume, ENGINE_VERSION } from '@/domain/analysis/analyze';
import {
  ACCEPTED_UPLOAD,
  type Analysis,
  type AnalysisList,
  type AnalysisStage,
  AnalyzeFieldsSchema,
  type FileType,
  type ListAnalysesQuery,
  MAX_UPLOAD_BYTES,
} from '@/lib/validation/analysis';

import { type AnalysisRow } from '../db/schema';
import {
  ExtractionError,
  ForbiddenError,
  NotFoundError,
  PayloadTooLargeError,
  UnsupportedFileError,
  ValidationError,
} from '../errors';
import { extractText, sniffFileType } from '../extraction';
import { type AnalysisRepository } from '../repositories/analysis-repository';

const VISITOR_RETENTION_MS = 24 * 60 * 60 * 1000;
const STALE_JOB_MS = 5 * 60 * 1000;
const FILE_NAME_MAX = 160;

export type UploadedFile = { name: string; bytes: Uint8Array };

export type SubmitInput = {
  file: UploadedFile | null;
  fields: { jobTitle?: unknown; jobDescription?: unknown };
  ownerHash: string;
};

type Dependencies = {
  repository: AnalysisRepository;
  now?: () => Date;
};

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
export function createAnalysisService({ repository, now = () => new Date() }: Dependencies) {
  async function moveTo(id: string, stage: AnalysisStage) {
    await repository.update(id, { stage });
  }

  async function process(
    id: string,
    bytes: Uint8Array,
    type: FileType,
    jobDescription: string | undefined,
  ) {
    try {
      await repository.update(id, { status: 'processing', stage: 'extracting', startedAt: now() });
      const text = await extractText(bytes, type);
      await moveTo(id, 'parsing');
      if (jobDescription) await moveTo(id, 'matching');
      await moveTo(id, 'scoring');

      const completedAt = now();
      const report = analyzeResume({ text, jobDescription, referenceDate: completedAt });
      await repository.update(id, {
        status: 'completed',
        stage: 'done',
        score: report.score,
        grade: report.grade,
        report,
        engineVersion: ENGINE_VERSION,
        completedAt,
      });
    } catch (error) {
      const known = error instanceof ExtractionError;
      if (!known) console.error('Analysis pipeline failed', { id, error });
      await repository.update(id, {
        status: 'failed',
        errorCode: known ? error.code : 'internal_error',
        errorMessage: known
          ? error.message
          : 'The analysis could not be completed. Try again in a moment.',
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
     * Validates and records an upload. The returned `run` performs the analysis; the caller
     * decides when (after the response in production, immediately in tests).
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

      return { analysis: toAnalysis(row), run: () => process(row.id, bytes, type, jobDescription) };
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
