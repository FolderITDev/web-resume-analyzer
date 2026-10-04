import { RateLimitError } from '../errors';

/**
 * Fixed-window limiter kept in memory, per server instance. A horizontally scaled deployment
 * would move the counters to Redis or the database.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const windows = new Map<string, { count: number; resetAt: number }>();

  return {
    consume(key: string, now = Date.now()): void {
      const current = windows.get(key);
      if (!current || current.resetAt <= now) {
        windows.set(key, { count: 1, resetAt: now + windowMs });
        if (windows.size > 10_000) {
          for (const [entryKey, entry] of windows)
            if (entry.resetAt <= now) windows.delete(entryKey);
        }
        return;
      }
      if (current.count >= limit) {
        throw new RateLimitError(Math.ceil((current.resetAt - now) / 1000));
      }
      current.count += 1;
    },
  };
}

export function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || request.headers.get('x-real-ip') || 'local';
}
