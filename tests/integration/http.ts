import { readFileSync } from 'node:fs';

import { BASE_PATH } from '../../src/config/site';

export const API = `http://localhost${BASE_PATH}/api`;

export function fixture(name: string): File {
  const type = name.endsWith('.pdf')
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return new File([readFileSync(`tests/fixtures/${name}`)], name, { type });
}

export function uploadRequest(fields: Record<string, string | File>, cookie?: string): Request {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  return new Request(`${API}/resumes/analyze`, {
    method: 'POST',
    body: form,
    headers: cookie ? { cookie } : {},
  });
}

export function get(path: string, cookie?: string): Request {
  return new Request(`${API}${path}`, { headers: cookie ? { cookie } : {} });
}

/** The `name=value` part of a Set-Cookie header, ready to send back. */
export function cookieFrom(response: Response): string {
  const header = response.headers.get('set-cookie');
  if (!header) throw new Error('Expected a Set-Cookie header.');
  return header.split(';')[0] ?? '';
}

export const params = (id: string) => ({ params: Promise.resolve({ id }) });
