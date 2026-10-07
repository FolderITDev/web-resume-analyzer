import { createServer, type IncomingMessage } from 'node:http';
import { type AddressInfo } from 'node:net';

import { EXAMPLE_REPORTS } from '../../src/content/example-reports';
import { type EngineJob, type SettledEngineJob } from '../../src/server/analysis-engine/client';

/**
 * Test double of the analysis engine's job API, so integration and end-to-end tests exercise the
 * real HTTP client against the documented contract. It answers with the stored reports of the
 * example resumes, matched by file name, and advances a job two stages per status read.
 */

type Stage = EngineJob['stage'];
type Job = { stages: readonly Stage[]; reads: number; result: SettledEngineJob };

const STAGES: readonly Stage[] = ['received', 'extracting', 'parsing', 'matching', 'scoring'];

function resultFor(id: string, fileName: string, jobDescription: string | null): SettledEngineJob {
  const slug = Object.keys(EXAMPLE_REPORTS).find((key) => fileName.startsWith(key));
  const report = slug ? EXAMPLE_REPORTS[slug] : undefined;
  if (!report) {
    return {
      id,
      status: 'failed',
      stage: 'extracting',
      error: {
        code: 'no_text_found',
        message:
          'No readable text was found. Scanned or image-only documents cannot be analyzed; export the resume as a text PDF or DOCX.',
      },
    };
  }
  return {
    id,
    status: 'completed',
    stage: 'done',
    report: { ...report, jobMatch: jobDescription ? report.jobMatch : null },
  };
}

async function readForm(request: IncomingMessage): Promise<FormData> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) chunks.push(chunk as Buffer);
  return new Request('http://engine.local', {
    method: 'POST',
    headers: { 'content-type': request.headers['content-type'] ?? '' },
    body: Buffer.concat(chunks),
  }).formData();
}

export type AnalysisEngineDouble = { url: string; close: () => Promise<void> };

export async function startAnalysisEngine(port = 0): Promise<AnalysisEngineDouble> {
  const jobs = new Map<string, Job>();

  const server = createServer(async (request, response) => {
    const send = (status: number, body: unknown) => {
      response.writeHead(status, { 'content-type': 'application/json' });
      response.end(JSON.stringify(body));
    };
    const path = new URL(request.url ?? '/', 'http://engine.local').pathname;

    if (request.method === 'POST' && path === '/v1/resume-analyses') {
      const form = await readForm(request);
      const file = form.get('file');
      if (!(file instanceof File)) return send(422, { code: 'file_required' });
      const jobDescription = form.get('jobDescription');
      const withMatch = typeof jobDescription === 'string' && jobDescription.length > 0;

      const id = crypto.randomUUID();
      jobs.set(id, {
        stages: withMatch ? STAGES : STAGES.filter((stage) => stage !== 'matching'),
        reads: 0,
        result: resultFor(id, file.name, withMatch ? jobDescription : null),
      });
      return send(202, { id, status: 'queued', stage: 'received' });
    }

    const match = /^\/v1\/resume-analyses\/([^/]+)$/.exec(path);
    const job = match?.[1] ? jobs.get(match[1]) : undefined;
    if (request.method === 'GET' && match?.[1] && job) {
      job.reads += 1;
      const stage = job.stages[job.reads * 2];
      if (stage) return send(200, { id: match[1], status: 'processing', stage });
      return send(200, job.result);
    }

    send(404, { code: 'not_found' });
  });

  await new Promise<void>((resolve) => server.listen(port, '127.0.0.1', resolve));
  const { port: bound } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${bound}`,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
