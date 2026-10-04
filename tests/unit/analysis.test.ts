import { describe, expect, it } from 'vitest';

import { analyzeResume, ENGINE_VERSION, gradeFor } from '@/domain/analysis/analyze';
import { estimateExperience, findDateRanges, mergedMonths } from '@/domain/analysis/experience';
import { isQuantified, startsWithActionVerb } from '@/domain/analysis/facts';
import { extractKeywords, matchJob } from '@/domain/analysis/job-match';
import { splitSections } from '@/domain/analysis/sections';
import { detectSkills } from '@/domain/analysis/skills';
import { normalizeText, toLines } from '@/domain/analysis/text';
import { AnalysisReportSchema } from '@/lib/validation/analysis';
import { EXAMPLE_JOB_DESCRIPTIONS } from '@/content/example-jobs';
import { EXAMPLE_RESUMES } from '@/content/example-resumes';

const REFERENCE_DATE = new Date('2026-10-01T00:00:00Z');

function example(slug: string) {
  const resume = EXAMPLE_RESUMES.find((item) => item.slug === slug);
  if (!resume) throw new Error(`Unknown example ${slug}`);
  return resume;
}

describe('text normalization', () => {
  it('unifies newlines, removes control characters and collapses spaces', () => {
    expect(normalizeText('A\r\nB\u0007  C  D\n\n\n\nE')).toBe('A\nB C D\n\nE');
  });
});

describe('sections', () => {
  it('recognizes common headings and keeps the header apart', () => {
    const { header, sections } = splitSections(
      toLines(
        'Jane Doe\njane.doe@folderit.net\nWORK EXPERIENCE\nEngineer\nTechnical Skills:\nReact\nEducation\nB.S.',
      ),
    );
    expect(header).toEqual(['Jane Doe', 'jane.doe@folderit.net']);
    expect(sections.map((section) => section.id)).toEqual(['experience', 'skills', 'education']);
  });

  it('does not treat long sentences that contain a heading word as headings', () => {
    const { sections } = splitSections(toLines('I have experience leading cross-functional teams'));
    expect(sections).toHaveLength(0);
  });
});

describe('experience', () => {
  it('parses month names, numeric months, bare years and open ranges', () => {
    const ranges = findDateRanges(
      'Jan 2019 – Present\n03/2016 to 06/2018\n2014 - 2015\nSeptember 2012 — May 2013',
      REFERENCE_DATE,
    );
    expect(ranges).toHaveLength(4);
    expect(ranges[0]?.open).toBe(true);
  });

  it('counts overlapping roles once', () => {
    const ranges = findDateRanges('Jan 2020 - Dec 2021\nJun 2021 - Dec 2022', REFERENCE_DATE);
    expect(mergedMonths(ranges)).toBe(36);
  });

  it('clamps ranges to the reference date and ignores inverted ranges', () => {
    const experience = estimateExperience('Jan 2026 - Dec 2030\n2020 - 2018', REFERENCE_DATE);
    expect(experience.datedRoles).toBe(1);
    expect(experience.estimatedYears).toBe(0.8);
  });

  it('reports zero years when no dates exist', () => {
    expect(estimateExperience('Developer at a company', REFERENCE_DATE)).toEqual({
      estimatedYears: 0,
      datedRoles: 0,
      earliestYear: null,
      hasCurrentRole: false,
    });
  });
});

describe('skills', () => {
  it('matches aliases case-insensitively and counts mentions', () => {
    const skills = detectSkills(
      'Built APIs in node.js and Node. Deployed with K8S and kubernetes.',
    );
    expect(skills.find((skill) => skill.id === 'nodejs')?.mentions).toBe(2);
    expect(skills.find((skill) => skill.id === 'kubernetes')?.mentions).toBe(2);
  });

  it('does not count a longer skill as its shorter prefix', () => {
    const ids = detectSkills('React Native apps').map((skill) => skill.id);
    expect(ids).toEqual(['react-native']);
  });

  it('respects term boundaries', () => {
    const ids = detectSkills('JavaScript and Java; C# and C++').map((skill) => skill.id);
    expect(ids).toEqual(expect.arrayContaining(['javascript', 'java', 'csharp', 'cpp']));
    expect(detectSkills('Javanese reactive scripts')).toEqual([]);
  });
});

describe('bullet heuristics', () => {
  it('treats numbers as quantification but not bare years', () => {
    expect(isQuantified('Cut costs by 30%')).toBe(true);
    expect(isQuantified('Saved $40k')).toBe(true);
    expect(isQuantified('Joined the team in 2019')).toBe(false);
  });

  it('detects action verbs at the start of a bullet', () => {
    expect(startsWithActionVerb('Led the migration')).toBe(true);
    expect(startsWithActionVerb('Responsible for the migration')).toBe(false);
  });
});

describe('job match', () => {
  it('ranks keywords by frequency, then alphabetically, without stop words', () => {
    expect(extractKeywords('billing billing invoices ledger and the with ledger', 3)).toEqual([
      'billing',
      'ledger',
      'invoices',
    ]);
  });

  it('weighs skill coverage and keyword coverage', () => {
    const resumeSkills = detectSkills('React TypeScript');
    const match = matchJob('React TypeScript', resumeSkills, 'React TypeScript GraphQL Kubernetes');
    expect(match.matchedSkills).toEqual(['React', 'TypeScript']);
    expect(match.missingSkills).toEqual(['GraphQL', 'Kubernetes']);
    expect(match.score).toBe(65);
  });
});

describe('analyzeResume', () => {
  it('is deterministic', () => {
    const { text } = example('avery-lindqvist');
    const first = analyzeResume({ text, referenceDate: REFERENCE_DATE });
    const second = analyzeResume({ text, referenceDate: REFERENCE_DATE });
    expect(second).toEqual(first);
  });

  it('produces a report that satisfies the API contract', () => {
    const { text } = example('avery-lindqvist');
    const report = analyzeResume({
      text,
      jobDescription: EXAMPLE_JOB_DESCRIPTIONS['senior-full-stack']?.text,
      referenceDate: REFERENCE_DATE,
    });
    expect(() => AnalysisReportSchema.parse(report)).not.toThrow();
    expect(report.engineVersion).toBe(ENGINE_VERSION);
  });

  it('scores a strong resume well above a weak one', () => {
    const strong = analyzeResume({
      text: example('avery-lindqvist').text,
      referenceDate: REFERENCE_DATE,
    });
    const weak = analyzeResume({
      text: example('sam-whitfield').text,
      referenceDate: REFERENCE_DATE,
    });
    expect(strong.score).toBeGreaterThanOrEqual(85);
    expect(weak.score).toBeLessThan(50);
    expect(strong.grade).toBe('excellent');
    expect(weak.grade).toBe('needs-work');
  });

  it('estimates experience from the experience section', () => {
    const report = analyzeResume({
      text: example('avery-lindqvist').text,
      referenceDate: REFERENCE_DATE,
    });
    expect(report.experience.datedRoles).toBe(3);
    expect(report.experience.hasCurrentRole).toBe(true);
    expect(report.experience.estimatedYears).toBeCloseTo(10.8, 1);
  });

  it('traces every finding and recommendation to a rule', () => {
    const report = analyzeResume({
      text: example('jordan-okafor').text,
      referenceDate: REFERENCE_DATE,
    });
    const ruleIds = [...report.issues, ...report.strengths, ...report.recommendations].map(
      (item) => item.ruleId,
    );
    expect(ruleIds.length).toBeGreaterThan(0);
    for (const id of ruleIds) expect(id).toMatch(/^[A-Z]{3}-\d{2}$/);
  });

  it('flags paragraph-style experience and passive phrasing', () => {
    const report = analyzeResume({
      text: example('jordan-okafor').text,
      referenceDate: REFERENCE_DATE,
    });
    const issueIds = report.issues.map((issue) => issue.ruleId);
    expect(issueIds).toContain('IMP-01');
    expect(issueIds).toContain('IMP-03');
  });

  it('orders issues by severity and recommendations by priority', () => {
    const report = analyzeResume({
      text: example('sam-whitfield').text,
      referenceDate: REFERENCE_DATE,
    });
    const rank = { high: 1, medium: 2, low: 3 } as const;
    const severities = report.issues.map((issue) => rank[issue.severity]);
    expect(severities).toEqual([...severities].sort((a, b) => a - b));
    const priorities = report.recommendations.map((item) => item.priority);
    expect(priorities).toEqual([...priorities].sort((a, b) => a - b));
  });

  it('adds a job match and puts missing job skills first', () => {
    const report = analyzeResume({
      text: example('sam-whitfield').text,
      jobDescription: EXAMPLE_JOB_DESCRIPTIONS['senior-full-stack']?.text,
      referenceDate: REFERENCE_DATE,
    });
    expect(report.jobMatch?.missingSkills).toContain('TypeScript');
    expect(report.recommendations[0]?.ruleId).toBe('JOB-01');
  });

  it('omits the job match without a job description', () => {
    expect(
      analyzeResume({ text: 'Plain text', referenceDate: REFERENCE_DATE }).jobMatch,
    ).toBeNull();
  });
});

describe('gradeFor', () => {
  it.each([
    [100, 'excellent'],
    [85, 'excellent'],
    [84, 'strong'],
    [70, 'strong'],
    [69, 'fair'],
    [50, 'fair'],
    [49, 'needs-work'],
    [0, 'needs-work'],
  ] as const)('maps %i to %s', (score, grade) => {
    expect(gradeFor(score)).toBe(grade);
  });
});
