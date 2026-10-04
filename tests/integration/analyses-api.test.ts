import { describe, expect, it } from 'vitest';

import { GET as getOpenApi } from '@/app/api/openapi.json/route';
import {
  DELETE as deleteAnalysis,
  GET as getAnalysis,
} from '@/app/api/resumes/analyses/[id]/route';
import { GET as listAnalyses } from '@/app/api/resumes/analyses/route';
import { POST as analyze } from '@/app/api/resumes/analyze/route';
import {
  AnalysisListSchema,
  AnalysisSchema,
  MAX_UPLOAD_BYTES,
  ProblemSchema,
  SubmittedAnalysisSchema,
} from '@/lib/validation/analysis';
import { EXAMPLE_JOB_DESCRIPTIONS } from '@/content/example-jobs';

import { API, cookieFrom, fixture, get, params, uploadRequest } from './http';
import { flushBackground } from './setup';

async function submit(fields: Record<string, string | File>, cookie?: string) {
  const response = await analyze(uploadRequest(fields, cookie), undefined);
  return { response, body: await response.json() };
}

async function analysisById(id: string, cookie?: string) {
  const response = await getAnalysis(get(`/resumes/analyses/${id}`, cookie), params(id));
  return { response, body: await response.json() };
}

async function list(query = '', cookie?: string) {
  const response = await listAnalyses(get(`/resumes/analyses${query}`, cookie), undefined);
  return { response, body: await response.json() };
}

function deleteRequest(id: string, cookie: string) {
  return deleteAnalysis(
    new Request(`${API}/resumes/analyses/${id}`, { method: 'DELETE', headers: { cookie } }),
    params(id),
  );
}

describe('POST /api/resumes/analyze', () => {
  it('accepts a PDF, queues it and completes the analysis in the background', async () => {
    const { response, body } = await submit({ file: fixture('avery-lindqvist.pdf') });
    expect(response.status).toBe(202);
    const submitted = SubmittedAnalysisSchema.parse(body);
    expect(response.headers.get('location')).toBe(submitted.links.self);
    expect(response.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Lax/);

    const cookie = cookieFrom(response);
    await flushBackground();

    const { response: read, body: analysis } = await analysisById(submitted.id, cookie);
    expect(read.status).toBe(200);
    const parsed = AnalysisSchema.parse(analysis);
    expect(parsed.status).toBe('completed');
    expect(parsed.stage).toBe('done');
    expect(parsed.file).toMatchObject({ name: 'avery-lindqvist.pdf', type: 'pdf' });
    expect(parsed.report?.score).toBeGreaterThanOrEqual(85);
    expect(parsed.report?.jobMatch).toBeNull();
  });

  it('analyzes a DOCX against a job description', async () => {
    const { response, body } = await submit({
      file: fixture('jordan-okafor.docx'),
      jobTitle: 'Frontend Developer',
      jobDescription: EXAMPLE_JOB_DESCRIPTIONS['frontend-developer']?.text ?? '',
    });
    await flushBackground();
    const { body: analysis } = await analysisById(body.id, cookieFrom(response));
    const parsed = AnalysisSchema.parse(analysis);
    expect(parsed.jobTitle).toBe('Frontend Developer');
    expect(parsed.hasJobDescription).toBe(true);
    expect(parsed.report?.jobMatch?.matchedSkills).toContain('React');
    expect(parsed.report?.jobMatch?.missingSkills.length).toBeGreaterThan(0);
  });

  it('records a failed analysis when the document has no text', async () => {
    const { response, body } = await submit({ file: fixture('image-only.pdf') });
    await flushBackground();
    const { body: analysis } = await analysisById(body.id, cookieFrom(response));
    const parsed = AnalysisSchema.parse(analysis);
    expect(parsed.status).toBe('failed');
    expect(parsed.error?.code).toBe('no_text_found');
    expect(parsed.report).toBeNull();
  });

  it('rejects a file whose bytes are not a PDF or DOCX', async () => {
    const { response, body } = await submit({ file: fixture('not-a-resume.pdf') });
    expect(response.status).toBe(415);
    expect(response.headers.get('content-type')).toBe('application/problem+json');
    expect(ProblemSchema.parse(body).code).toBe('unsupported_file');
  });

  it('rejects a renamed file whose extension does not match its content', async () => {
    const pdf = fixture('avery-lindqvist.pdf');
    const { response } = await submit({ file: new File([await pdf.arrayBuffer()], 'resume.docx') });
    expect(response.status).toBe(415);
  });

  it('requires a file', async () => {
    const { response, body } = await submit({ jobTitle: 'Engineer' });
    expect(response.status).toBe(422);
    expect(ProblemSchema.parse(body).errors).toEqual([
      { path: 'file', message: 'A file is required.' },
    ]);
  });

  it('rejects files over 5 MB', async () => {
    const big = new Uint8Array(MAX_UPLOAD_BYTES + 1);
    big.set(new TextEncoder().encode('%PDF-1.7'));
    const { response } = await submit({ file: new File([big], 'big.pdf') });
    expect(response.status).toBe(413);
  });

  it('validates the job description length', async () => {
    const { response, body } = await submit({
      file: fixture('avery-lindqvist.pdf'),
      jobDescription: 'x'.repeat(12_001),
    });
    expect(response.status).toBe(422);
    expect(ProblemSchema.parse(body).errors?.[0]?.path).toBe('jobDescription');
  });
});

describe('GET /api/resumes/analyses', () => {
  it('lists only the examples for a new visitor', async () => {
    const { response, body } = await list();
    const page = AnalysisListSchema.parse(body);
    expect(page.total).toBe(6);
    expect(page.items.every((item) => item.isExample)).toBe(true);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('includes the visitor’s own analyses, newest first, and nobody else sees them', async () => {
    const { response } = await submit({ file: fixture('mei-tanaka.pdf') });
    const cookie = cookieFrom(response);
    await flushBackground();

    const own = AnalysisListSchema.parse((await list('', cookie)).body);
    expect(own.total).toBe(7);
    expect(own.items[0]).toMatchObject({
      fileName: 'mei-tanaka.pdf',
      isExample: false,
      status: 'completed',
    });

    const stranger = AnalysisListSchema.parse((await list()).body);
    expect(stranger.total).toBe(6);
  });

  it('searches case-insensitively by file name and job title', async () => {
    const page = AnalysisListSchema.parse((await list('?q=FULL-STACK')).body);
    expect(page.items.map((item) => item.jobTitle)).toEqual([
      'Senior Full-Stack Engineer',
      'Senior Full-Stack Engineer',
    ]);
  });

  it('sorts by score', async () => {
    const page = AnalysisListSchema.parse((await list('?sort=score-desc')).body);
    const scores = page.items.map((item) => item.score ?? 0);
    expect(scores).toEqual([...scores].sort((a, b) => b - a));
  });

  it('paginates and filters by status', async () => {
    const second = AnalysisListSchema.parse((await list('?page=2&pageSize=4')).body);
    expect(second).toMatchObject({ page: 2, pageSize: 4, total: 6 });
    expect(second.items).toHaveLength(2);

    const failed = AnalysisListSchema.parse((await list('?status=failed')).body);
    expect(failed.total).toBe(0);
  });

  it('treats LIKE wildcards in the search as literal text', async () => {
    expect(AnalysisListSchema.parse((await list('?q=%25')).body).total).toBe(0);
  });

  it('rejects invalid query parameters', async () => {
    const { response, body } = await list('?pageSize=500');
    expect(response.status).toBe(422);
    expect(ProblemSchema.parse(body).errors?.[0]?.path).toBe('pageSize');
  });
});

describe('GET and DELETE /api/resumes/analyses/:id', () => {
  it('hides another visitor’s analysis', async () => {
    const { body } = await submit({ file: fixture('avery-lindqvist.pdf') });
    await flushBackground();
    const { response } = await analysisById(
      body.id,
      'ra_session=someone-else-entirely-0123456789abcdef',
    );
    expect(response.status).toBe(404);
  });

  it('returns 404 for malformed IDs', async () => {
    const { response, body } = await analysisById('not-a-uuid');
    expect(response.status).toBe(404);
    expect(ProblemSchema.parse(body).code).toBe('not_found');
  });

  it('lets a visitor delete their own analysis but not an example', async () => {
    const { response, body } = await submit({ file: fixture('avery-lindqvist.pdf') });
    const cookie = cookieFrom(response);
    await flushBackground();

    expect((await deleteRequest(body.id, cookie)).status).toBe(204);
    expect((await analysisById(body.id, cookie)).response.status).toBe(404);

    const example = AnalysisListSchema.parse((await list()).body).items[0];
    if (!example) throw new Error('Expected seeded examples.');
    expect((await deleteRequest(example.id, cookie)).status).toBe(403);
  });
});

describe('GET /api/openapi.json', () => {
  it('documents every operation with components generated from the Zod contracts', async () => {
    const document = await getOpenApi().json();
    expect(document.openapi).toBe('3.1.0');
    expect(Object.keys(document.paths)).toEqual([
      '/resumes/analyze',
      '/resumes/analyses',
      '/resumes/analyses/{id}',
    ]);
    expect(Object.keys(document.components.schemas)).toEqual(
      expect.arrayContaining(['Analysis', 'AnalysisReport', 'AnalysisList', 'Problem']),
    );
  });
});
