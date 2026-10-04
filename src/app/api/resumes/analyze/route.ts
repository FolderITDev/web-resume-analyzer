import { after } from 'next/server';

import { BASE_PATH } from '@/config/site';
import { MAX_UPLOAD_BYTES, SubmittedAnalysisSchema } from '@/lib/validation/analysis';
import { PayloadTooLargeError, ValidationError } from '@/server/errors';
import { clientKey, createRateLimiter } from '@/server/http/rate-limit';
import { handle, json } from '@/server/http/responses';
import { ensureSession } from '@/server/http/session';
import { analysisService } from '@/server/services';

const uploads = createRateLimiter({ limit: 20, windowMs: 10 * 60 * 1000 });
const MULTIPART_OVERHEAD = 64 * 1024;

const text = (value: FormDataEntryValue | null) => (typeof value === 'string' ? value : undefined);

/** Accepts a resume upload and queues its analysis. Responds 202 with the analysis to poll. */
export const POST = handle(async (request) => {
  uploads.consume(clientKey(request));

  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_UPLOAD_BYTES + MULTIPART_OVERHEAD) {
    throw new PayloadTooLargeError('The file is larger than 5 MB. Export a smaller PDF or DOCX.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    throw new ValidationError('Send the resume as multipart/form-data with a "file" field.');
  }

  const upload = form.get('file');
  const session = ensureSession(request);
  const { analysis, run } = await analysisService().submit({
    file:
      upload instanceof File
        ? { name: upload.name, bytes: new Uint8Array(await upload.arrayBuffer()) }
        : null,
    fields: {
      jobTitle: text(form.get('jobTitle')),
      jobDescription: text(form.get('jobDescription')),
    },
    ownerHash: session.ownerHash,
  });

  after(run);

  const self = `${BASE_PATH}/api/resumes/analyses/${analysis.id}`;
  const headers = new Headers({
    Location: self,
    'Cache-Control': 'no-store',
    'Set-Cookie': session.setCookie,
  });
  return json(
    SubmittedAnalysisSchema,
    { id: analysis.id, status: analysis.status, stage: analysis.stage, links: { self } },
    { status: 202, headers },
  );
});
