import { type z } from 'zod';

import { BASE_PATH } from '@/config/site';
import {
  ProblemSchema,
  type SubmittedAnalysis,
  SubmittedAnalysisSchema,
} from '@/lib/validation/analysis';

const API_ROOT = `${BASE_PATH}/api`;

/** A failed API call, carrying the RFC 9457 problem the server returned when there was one. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fieldErrors: readonly { path: string; message: string }[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static network(): ApiError {
    return new ApiError(
      0,
      'network_error',
      'The server could not be reached. Check your connection and try again.',
    );
  }
}

function toApiError(status: number, body: unknown): ApiError {
  const problem = ProblemSchema.safeParse(body);
  if (problem.success) {
    return new ApiError(
      status,
      problem.data.code,
      problem.data.detail ?? problem.data.title,
      problem.data.errors,
    );
  }
  return new ApiError(status, 'unexpected_response', 'The server returned an unexpected response.');
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

/** Calls the API and validates the response body against its contract. */
export async function apiRequest<T>(
  path: string,
  schema: z.ZodType<T>,
  init: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      ...init,
      headers: { Accept: 'application/json', ...init.headers },
    });
  } catch {
    throw ApiError.network();
  }
  const body = await readJson(response);
  if (!response.ok) throw toApiError(response.status, body);
  return schema.parse(body);
}

export async function apiDelete(path: string): Promise<void> {
  let response: Response;
  try {
    response = await fetch(`${API_ROOT}${path}`, { method: 'DELETE' });
  } catch {
    throw ApiError.network();
  }
  if (!response.ok) throw toApiError(response.status, await readJson(response));
}

/**
 * Uploads with XMLHttpRequest because fetch cannot report upload progress. Progress is reported
 * as a fraction from 0 to 1.
 */
export function uploadResume(
  form: FormData,
  { onProgress, signal }: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {},
): Promise<SubmittedAnalysis> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${API_ROOT}/resumes/analyze`);
    request.setRequestHeader('Accept', 'application/json');
    request.responseType = 'json';

    request.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) onProgress?.(event.loaded / event.total);
    });
    request.addEventListener('load', () => {
      if (request.status >= 200 && request.status < 300) {
        const parsed = SubmittedAnalysisSchema.safeParse(request.response);
        if (parsed.success) resolve(parsed.data);
        else
          reject(
            new ApiError(
              request.status,
              'unexpected_response',
              'The server returned an unexpected response.',
            ),
          );
      } else {
        reject(toApiError(request.status, request.response));
      }
    });
    request.addEventListener('error', () => reject(ApiError.network()));
    request.addEventListener('abort', () =>
      reject(new DOMException('Upload cancelled', 'AbortError')),
    );
    signal?.addEventListener('abort', () => request.abort(), { once: true });

    request.send(form);
  });
}
