import { type DetectedSkill, type Experience, type SectionId } from '@/lib/validation/analysis';

import { estimateExperience } from './experience';
import { sectionText, splitSections } from './sections';
import { detectSkills } from './skills';
import { bulletLines, normalizeText, toLines, words } from './text';

const ACTION_VERBS = new Set(
  `accelerated achieved added analyzed architected automated built championed collaborated consolidated
  created cut decreased defined delivered deployed designed developed directed doubled drove eliminated
  enabled engineered established expanded grew guided halved implemented improved increased integrated
  introduced launched led maintained managed mentored migrated modernized optimized orchestrated organized
  owned partnered planned produced published rebuilt redesigned reduced refactored released replaced
  resolved restructured saved scaled secured shipped simplified spearheaded standardized streamlined
  supported tested trained transformed tripled unified upgraded wrote`.split(/\s+/),
);

const WEAK_PHRASES = [
  'responsible for',
  'worked on',
  'helped with',
  'helped to',
  'involved in',
  'duties included',
  'tasked with',
  'participated in',
];

const FIRST_PERSON = /\b(i|me|my|mine|myself)\b/gi;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const PHONE = /\+?\d[\d\s().-]{7,}\d/;
const PROFILE_LINK =
  /\b(linkedin\.com|github\.com|gitlab\.com|behance\.net|dribbble\.com|https?:\/\/)\S*/i;
const YEAR = /\b(19|20)\d{2}\b/g;

/** Everything the rules need, computed once from the extracted text. */
export type ResumeFacts = {
  text: string;
  wordCount: number;
  sections: ReadonlySet<SectionId>;
  bullets: readonly string[];
  quantifiedBullets: number;
  actionVerbBullets: number;
  weakPhrases: readonly string[];
  firstPersonCount: number;
  longBullets: number;
  summaryWordCount: number | null;
  hasEmail: boolean;
  hasPhone: boolean;
  hasProfileLink: boolean;
  skills: readonly DetectedSkill[];
  experience: Experience;
};

export function isQuantified(bullet: string): boolean {
  const withoutYears = bullet.replace(YEAR, '');
  return /\d|%|[$€£]/.test(withoutYears);
}

export function startsWithActionVerb(bullet: string): boolean {
  const first = words(bullet)[0]?.toLowerCase();
  return first !== undefined && ACTION_VERBS.has(first);
}

export function collectFacts(rawText: string, referenceDate: Date): ResumeFacts {
  const text = normalizeText(rawText);
  const lines = toLines(text);
  const { header, sections } = splitSections(lines);
  const bullets = bulletLines(lines);
  const lower = text.toLowerCase();
  const summary = sectionText(sections, 'summary');
  const experienceText = sectionText(sections, 'experience') || text;

  return {
    text,
    wordCount: words(text).length,
    sections: new Set(sections.map((section) => section.id)),
    bullets,
    quantifiedBullets: bullets.filter(isQuantified).length,
    actionVerbBullets: bullets.filter(startsWithActionVerb).length,
    weakPhrases: WEAK_PHRASES.filter((phrase) => lower.includes(phrase)),
    firstPersonCount: (text.match(FIRST_PERSON) ?? []).length,
    longBullets: bullets.filter((bullet) => words(bullet).length > 32).length,
    summaryWordCount: summary ? words(summary).length : null,
    hasEmail: EMAIL.test(text),
    hasPhone: PHONE.test(header.join(' ')) || PHONE.test(text.slice(0, 400)),
    hasProfileLink: PROFILE_LINK.test(text),
    skills: detectSkills(text),
    experience: estimateExperience(experienceText, referenceDate),
  };
}
