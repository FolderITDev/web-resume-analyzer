import { unstable_rethrow } from 'next/navigation';
import { z } from 'zod';

import { type Problem } from '@/lib/validation/analysis';

import { AppError, RateLimitError } from '../errors';

const PROBLEM_TYPE_BASE =
  'https://github.com/FolderITDev/web-resume-analyzer/blob/main/docs/api.md#';

/**
 * Serializes a response body after validating it against its contract. A body that does not
 * match its schema is a server bug, so it fails loudly instead of reaching the client.
 */
export function json<T>(schema: z.ZodType<T>, body: T, init: ResponseInit = {}): Response {
  return Response.json(schema.parse(body), init);
}

export function problem(problem: Problem, headers: HeadersInit = {}): Response {
  return Response.json(problem, {
    status: problem.status,
    headers: { 'Content-Type': 'application/problem+json', ...headers },
  });
}

const TITLES: Record<number, string> = {
  400: 'Bad request',
  403: 'Forbidden',
  404: 'Not found',
  413: 'Payload too large',
  415: 'Unsupported media type',
  422: 'Validation failed',
  429: 'Too many requests',
  500: 'Internal server error',
};

export function errorToResponse(error: unknown): Response {
  if (error instanceof z.ZodError) {
    return problem({
      type: `${PROBLEM_TYPE_BASE}validation_failed`,
      title: TITLES[422] ?? 'Validation failed',
      status: 422,
      code: 'validation_failed',
      detail: 'One or more fields are invalid.',
      errors: error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    });
  }

  if (error instanceof AppError) {
    const headers: Record<string, string> =
      error instanceof RateLimitError ? { 'Retry-After': String(error.retryAfterSeconds) } : {};
    return problem(
      {
        type: `${PROBLEM_TYPE_BASE}${error.code}`,
        title: TITLES[error.status] ?? 'Error',
        status: error.status,
        code: error.code,
        detail: error.message,
        ...(error.fieldErrors?.length ? { errors: [...error.fieldErrors] } : {}),
      },
      headers,
    );
  }

  console.error('Unhandled API error', error);
  return problem({
    type: `${PROBLEM_TYPE_BASE}internal_error`,
    title: TITLES[500] ?? 'Internal server error',
    status: 500,
    code: 'internal_error',
    detail: 'Something went wrong on our side. Try again in a moment.',
  });
}

type Handler<C> = (request: Request, context: C) => Promise<Response>;

/** Wraps a route handler so every failure becomes an RFC 9457 problem response. */
export function handle<C>(handler: Handler<C>): Handler<C> {
  return async (request, context) => {
    try {
      return await handler(request, context);
    } catch (error) {
      // Framework signals (such as bailing out of prerendering) belong to Next.js, not to the API.
      unstable_rethrow(error);
      return errorToResponse(error);
    }
  };
}
