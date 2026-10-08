import { describe, expect, it } from 'vitest';

import { readBodyBytes } from '@/server/http/body';
import { clientKey } from '@/server/http/rate-limit';

const withForwarded = (value: string, extra: Record<string, string> = {}) =>
  new Request('http://app.test/api', { headers: { 'x-forwarded-for': value, ...extra } });

function streamed(chunks: number[]): Request {
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const size of chunks) controller.enqueue(new Uint8Array(size));
      controller.close();
    },
  });
  // Node requires `duplex` for a streamed body; the DOM typings do not declare it yet.
  const init: RequestInit & { duplex: 'half' } = { method: 'POST', body, duplex: 'half' };
  return new Request('http://app.test/api', init);
}

describe('clientKey', () => {
  it('reads the address the trusted proxy appended, not the one the client sent', () => {
    const request = withForwarded('203.0.113.9, 198.51.100.7');
    expect(clientKey(request, 1)).toBe('198.51.100.7');
    expect(clientKey(request, 2)).toBe('203.0.113.9');
  });

  it('cannot be changed by a client that forges X-Forwarded-For', () => {
    const forged = withForwarded('1.1.1.1, 198.51.100.7');
    const honest = withForwarded('198.51.100.7');
    expect(clientKey(forged, 1)).toBe(clientKey(honest, 1));
  });

  it('falls back to X-Real-IP, then to one shared budget', () => {
    const realIp = new Request('http://app.test/api', { headers: { 'x-real-ip': '198.51.100.7' } });
    expect(clientKey(realIp, 1)).toBe('198.51.100.7');
    expect(clientKey(new Request('http://app.test/api'), 1)).toBe('direct');
    expect(clientKey(withForwarded('198.51.100.7'), 0)).toBe('direct');
  });
});

describe('readBodyBytes', () => {
  it('returns the whole body when it fits', async () => {
    const bytes = await readBodyBytes(streamed([4, 6]), 10, 'Too large.');
    expect(bytes.byteLength).toBe(10);
  });

  it('refuses a body without Content-Length as soon as it passes the limit', async () => {
    await expect(readBodyBytes(streamed([8, 8]), 10, 'Too large.')).rejects.toMatchObject({
      status: 413,
      message: 'Too large.',
    });
  });

  it('refuses a declared Content-Length over the limit before reading', async () => {
    const request = new Request('http://app.test/api', {
      method: 'POST',
      headers: { 'content-length': '11' },
      body: 'x',
    });
    await expect(readBodyBytes(request, 10, 'Too large.')).rejects.toMatchObject({ status: 413 });
  });
});
