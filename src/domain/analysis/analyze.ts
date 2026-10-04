import {
  type AnalysisReport,
  type CategoryId,
  type CategoryScore,
  type Finding,
  type Grade,
  type Recommendation,
  SECTION_IDS,
  type Severity,
} from '@/lib/validation/analysis';

import { collectFacts } from './facts';
import { matchJob } from './job-match';
import { RULES } from './rules';

/** Bump whenever a rule, weight or threshold changes, so stored reports stay traceable. */
export const ENGINE_VERSION = 'rules-2026.10.2';

export const CATEGORIES: readonly { id: CategoryId; label: string; weight: number }[] = [
  { id: 'structure', label: 'Structure', weight: 0.2 },
  { id: 'impact', label: 'Impact', weight: 0.25 },
  { id: 'skills', label: 'Skills', weight: 0.2 },
  { id: 'clarity', label: 'Clarity', weight: 0.15 },
  { id: 'experience', label: 'Experience', weight: 0.1 },
  { id: 'completeness', label: 'Completeness', weight: 0.1 },
];

const SEVERITY_WEIGHT: Record<Severity, number> = { high: 3, medium: 2, low: 1 };
const SEVERITY_PRIORITY: Record<Severity, 1 | 2 | 3> = { high: 1, medium: 2, low: 3 };

export function gradeFor(score: number): Grade {
  if (score >= 85) return 'excellent';
  if (score >= 70) return 'strong';
  if (score >= 50) return 'fair';
  return 'needs-work';
}

const GRADE_OPENING: Record<Grade, string> = {
  excellent: 'An excellent resume',
  strong: 'A strong resume',
  fair: 'A solid base',
  'needs-work': 'A resume with clear room to improve',
};

function summarize(grade: Grade, categories: readonly CategoryScore[]): string {
  const weakest = [...categories].sort((a, b) => a.score - b.score || b.weight - a.weight)[0];
  if (!weakest || weakest.score >= 90)
    return `${GRADE_OPENING[grade]}: every category scores 90 or higher.`;
  return `${GRADE_OPENING[grade]}. ${weakest.label} has the most room to improve, at ${weakest.score} of 100.`;
}

export type AnalyzeInput = {
  text: string;
  jobDescription?: string | undefined;
  /** "Today" for date ranges ending in "Present". Injected so results are reproducible. */
  referenceDate: Date;
};

/**
 * Analyzes resume text with the deterministic rule set. The same input always produces the
 * same report: no randomness, no network and no model.
 */
export function analyzeResume({
  text,
  jobDescription,
  referenceDate,
}: AnalyzeInput): AnalysisReport {
  const facts = collectFacts(text, referenceDate);
  const outcomes = RULES.map((rule) => ({ rule, outcome: rule.evaluate(facts) }));

  const categories = CATEGORIES.map(({ id, label, weight }) => {
    const scored = outcomes.filter(({ rule }) => rule.category === id);
    const totalWeight = scored.reduce((sum, { rule }) => sum + SEVERITY_WEIGHT[rule.severity], 0);
    const weighted = scored.reduce(
      (sum, { rule, outcome }) => sum + outcome.score * SEVERITY_WEIGHT[rule.severity],
      0,
    );
    return {
      id,
      label,
      weight,
      score: totalWeight === 0 ? 100 : Math.round((weighted / totalWeight) * 100),
    };
  });

  const score = Math.round(
    categories.reduce((sum, category) => sum + category.score * category.weight, 0),
  );
  const grade = gradeFor(score);

  const toFinding = (
    rule: (typeof RULES)[number],
    message: { title: string; detail: string },
  ): Finding => ({
    ruleId: rule.id,
    category: rule.category,
    severity: rule.severity,
    ...message,
  });
  const strengths = outcomes.flatMap(({ rule, outcome }) =>
    outcome.strength ? [toFinding(rule, outcome.strength)] : [],
  );
  const issues = outcomes
    .flatMap(({ rule, outcome }) => (outcome.issue ? [toFinding(rule, outcome.issue)] : []))
    .sort((a, b) => SEVERITY_PRIORITY[a.severity] - SEVERITY_PRIORITY[b.severity]);

  const recommendations: Recommendation[] = outcomes
    .flatMap(({ rule, outcome }) =>
      outcome.recommendation && outcome.score < 1
        ? [
            {
              ruleId: rule.id,
              priority: SEVERITY_PRIORITY[rule.severity],
              ...outcome.recommendation,
            },
          ]
        : [],
    )
    .sort((a, b) => a.priority - b.priority);

  const description = jobDescription?.trim();
  const jobMatch = description ? matchJob(facts.text, facts.skills, description) : null;
  if (jobMatch && jobMatch.missingSkills.length > 0) {
    const named = jobMatch.missingSkills.slice(0, 4).join(', ');
    recommendations.unshift({
      ruleId: 'JOB-01',
      priority: 1,
      title: 'Mention the job’s skills you actually have',
      detail: `The posting asks for ${named}${jobMatch.missingSkills.length > 4 ? ' and more' : ''}. If you have used them, name them in the roles where you did.`,
    });
  }

  return {
    engineVersion: ENGINE_VERSION,
    score,
    grade,
    summary: summarize(grade, categories),
    categories,
    sections: SECTION_IDS.map((id) => ({ id, present: facts.sections.has(id) })),
    skills: [...facts.skills],
    experience: facts.experience,
    strengths,
    issues,
    recommendations,
    jobMatch,
    stats: {
      wordCount: facts.wordCount,
      bulletCount: facts.bullets.length,
      quantifiedBullets: facts.quantifiedBullets,
      actionVerbBullets: facts.actionVerbBullets,
    },
  };
}
