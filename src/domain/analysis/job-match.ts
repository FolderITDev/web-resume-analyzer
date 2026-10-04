import { type DetectedSkill, type JobMatch } from '@/lib/validation/analysis';

import { detectSkills } from './skills';
import { SKILLS } from './skills-taxonomy';
import { clamp, roundTo, words } from './text';

const STOP_WORDS = new Set(
  `about above across after again against also among an and any are around as at be because been before
  being below between both but by can could did do does doing down during each either else ever every few
  for from further had has have having here how however if in into is it its itself just least less like
  made make many may more most much must near need needs new no nor not now of off often on once one only
  or other our out over own per plus rather same several shall she should since so some such than that the
  their them then there these they this those through thus to too under until up upon us use used using
  very via was we well were what when where whether which while who whom whose why will with within without
  would yet you your able ability across including strong excellent good great work working team teams role
  join looking candidate candidates position company experience years year requirements responsibilities
  preferred required nice bonus etc environment knowledge understanding skills skill plus within day
  build building help ensure across based behind features applications expertise things ways`.split(
    /\s+/,
  ),
);

/** Single-word skill spellings. Skills are scored separately, so they never count as keywords. */
const SKILL_TERMS = new Set(
  SKILLS.flatMap((skill) =>
    [skill.name, ...(skill.aliases ?? [])].map((term) => term.toLowerCase()),
  ).filter((term) => !term.includes(' ')),
);

/** Distinctive terms of a job description, most frequent first, ties broken alphabetically. */
export function extractKeywords(text: string, limit = 24): string[] {
  const counts = new Map<string, number>();
  for (const word of words(text.toLowerCase())) {
    const term = word.replace(/[.'’-]+$/, '');
    if (term.length < 4 || STOP_WORDS.has(term) || /^\d+$/.test(term)) continue;
    counts.set(term, (counts.get(term) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([term]) => term);
}

/**
 * Compares the resume with a job description. Skills weigh 70% of the match because they are
 * matched precisely; general keywords weigh 30% because they are only literal term overlap.
 */
export function matchJob(
  resumeText: string,
  resumeSkills: readonly DetectedSkill[],
  jobDescription: string,
): JobMatch {
  const jobSkills = detectSkills(jobDescription);
  const resumeSkillIds = new Set(resumeSkills.map((skill) => skill.id));
  const matchedSkills = jobSkills
    .filter((skill) => resumeSkillIds.has(skill.id))
    .map((skill) => skill.name);
  const missingSkills = jobSkills
    .filter((skill) => !resumeSkillIds.has(skill.id))
    .map((skill) => skill.name);

  const keywords = extractKeywords(jobDescription).filter((keyword) => !SKILL_TERMS.has(keyword));
  const resumeWords = new Set(
    words(resumeText.toLowerCase()).map((word) => word.replace(/[.'’-]+$/, '')),
  );
  const missingKeywords = keywords.filter((keyword) => !resumeWords.has(keyword));
  const keywordCoverage =
    keywords.length === 0 ? 1 : (keywords.length - missingKeywords.length) / keywords.length;

  const skillCoverage =
    jobSkills.length === 0 ? keywordCoverage : matchedSkills.length / jobSkills.length;
  const score = Math.round(clamp(skillCoverage * 0.7 + keywordCoverage * 0.3, 0, 1) * 100);

  return {
    score,
    matchedSkills,
    missingSkills,
    keywordCoverage: roundTo(keywordCoverage, 2),
    missingKeywords: missingKeywords.slice(0, 10),
  };
}
