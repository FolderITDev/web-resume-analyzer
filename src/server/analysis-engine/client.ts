import { z } from 'zod';

import {
  ACCEPTED_UPLOAD,
  AnalysisReportSchema,
  AnalysisStageSchema,
  type FileType,
} from '@/lib/validation/analysis';

const job = { id: z.string().min(1).max(200), stage: AnalysisStageSchema };

/**
 * Contract of the analysis engine's job API. Its responses come from another service, so they
 * are parsed as strictly as a request body before anything reaches the database: a completed
 * job must carry a report and a failed one an error.
 */
export const EngineJobSchema = z.discriminatedUnion('status', [
  z.object({ ...job, status: z.literal('queued') }),
  z.object({ ...job, status: z.literal('processing') }),
  z.object({ ...job, status: z.literal('completed'), report: AnalysisReportSchema }),
  z.object({
    ...job,
    status: z.literal('failed'),
    error: z.object({
      code: z.string().regex(/^[a-z][a-z0-9_]{0,63}$/),
      message: z.string().min(1).max(500),
    }),
  }),
]);
export type EngineJob = z.infer<typeof EngineJobSchema>;
export type RunningEngineJob = Extract<EngineJob, { status: 'queued' | 'processing' }>;
export type SettledEngineJob = Exclude<EngineJob, RunningEngineJob>;

export type EngineSubmission = {
  file: { name: string; type: FileType; bytes: Uint8Array };
  jobDescription?: string | undefined;
};

export type AnalysisEngine = {
  /** Starts an analysis job. The engine answers before the job finishes. */
  submit(submission: EngineSubmission): Promise<EngineJob>;
  /** Reads the current state of a job. */
  get(jobId: string): Promise<EngineJob>;
};

/** The engine could not be reached, refused the request or answered outside its contract. */
export class AnalysisEngineError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'AnalysisEngineError';
  }
}

const MIME_TYPE: Record<FileType, string> = {
  pdf: ACCEPTED_UPLOAD.mimeTypes[0],
  docx: ACCEPTED_UPLOAD.mimeTypes[1],
};

type ClientOptions = {
  baseUrl: string;
  apiKey?: string | undefined;
  timeoutMs?: number;
  fetch?: typeof globalThis.fetch;
};

/** HTTP client for the analysis engine, configured with its base URL. */
export function createAnalysisEngine({
  baseUrl,
  apiKey,
  timeoutMs = 15_000,
  fetch = globalThis.fetch,
}: ClientOptions): AnalysisEngine {
  const root = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;

  async function call(path: string, init: RequestInit): Promise<EngineJob> {
    const headers = new Headers(init.headers);
    headers.set('Accept', 'application/json');
    if (apiKey) headers.set('Authorization', `Bearer ${apiKey}`);

    let response: Response;
    try {
      response = await fetch(new URL(path, root), {
        ...init,
        headers,
        cache: 'no-store',
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (cause) {
      throw new AnalysisEngineError('The analysis engine could not be reached.', { cause });
    }
    if (!response.ok) {
      throw new AnalysisEngineError(`The analysis engine answered ${response.status}.`);
    }

    const parsed = EngineJobSchema.safeParse(await response.json().catch(() => undefined));
    if (!parsed.success) {
      throw new AnalysisEngineError('The analysis engine answered outside its contract.', {
        cause: parsed.error,
      });
    }
    return parsed.data;
  }

  return {
    submit({ file, jobDescription }) {
      const form = new FormData();
      form.append(
        'file',
        new Blob([file.bytes.slice()], { type: MIME_TYPE[file.type] }),
        file.name,
      );
      if (jobDescription) form.append('jobDescription', jobDescription);
      return call('v1/resume-analyses', { method: 'POST', body: form });
    },

    get(jobId) {
      return call(`v1/resume-analyses/${encodeURIComponent(jobId)}`, { method: 'GET' });
    },
  };
}
