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

/** Reverse proxies in front of the app that append to X-Forwarded-For (TRUSTED_PROXY_HOPS). */
function trustedProxyHops(): number {
  const hops = Number(process.env.TRUSTED_PROXY_HOPS ?? 1);
  return Number.isInteger(hops) && hops >= 0 ? hops : 1;
}

/**
 * The client address that requests are counted against. Each trusted proxy appends the address
 * it received the request from to X-Forwarded-For, so the client is read that many entries from
 * the right; entries further left were sent by the client and could be anything. With no
 * trusted proxy, forwarding headers are ignored and every request shares one budget.
 */
export function clientKey(request: Request, hops = trustedProxyHops()): string {
  if (hops === 0) return 'direct';
  const chain = (request.headers.get('x-forwarded-for') ?? '')
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return (
    chain[Math.max(0, chain.length - hops)] ?? request.headers.get('x-real-ip')?.trim() ?? 'direct'
  );
}
