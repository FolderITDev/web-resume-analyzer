type FieldError = { path: string; message: string };

/**
 * Errors the application raises on purpose. Each carries a stable machine-readable code and the
 * HTTP status it maps to; anything else that escapes a handler is reported as a 500.
 */
export class AppError extends Error {
  constructor(
    readonly code: string,
    readonly status: number,
    message: string,
    readonly fieldErrors?: readonly FieldError[],
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, fieldErrors: readonly FieldError[] = []) {
    super('validation_failed', 422, message, fieldErrors);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource does not exist.') {
    super('not_found', 404, message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super('forbidden', 403, message);
  }
}

export class PayloadTooLargeError extends AppError {
  constructor(message: string) {
    super('payload_too_large', 413, message);
  }
}

export class UnsupportedFileError extends AppError {
  constructor(message: string) {
    super('unsupported_file', 415, message);
  }
}

export class RateLimitError extends AppError {
  constructor(readonly retryAfterSeconds: number) {
    super(
      'rate_limited',
      429,
      `Too many analyses in a short time. Try again in ${retryAfterSeconds} seconds.`,
    );
  }
}

/** Raised by the extraction step; stored on the analysis rather than returned as HTTP. */
export class ExtractionError extends Error {
  constructor(
    readonly code: 'unreadable_file' | 'no_text_found',
    message: string,
  ) {
    super(message);
    this.name = 'ExtractionError';
  }
}
