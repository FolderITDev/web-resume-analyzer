import { PayloadTooLargeError } from '../errors';

/**
 * Reads the request body, refusing it with 413 as soon as it grows past `maxBytes`. The limit is
 * enforced on the bytes received, so a missing or understated Content-Length cannot bypass it.
 */
export async function readBodyBytes(
  request: Request,
  maxBytes: number,
  message: string,
): Promise<Uint8Array> {
  if (Number(request.headers.get('content-length')) > maxBytes) {
    throw new PayloadTooLargeError(message);
  }
  if (!request.body) return new Uint8Array();

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new PayloadTooLargeError(message);
    }
    chunks.push(value);
  }

  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}
