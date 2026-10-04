import { type CategoryId, type Severity } from '@/lib/validation/analysis';

import { type ResumeFacts } from './facts';
import { clamp } from './text';

type Message = { title: string; detail: string };

export type RuleOutcome = {
  /** 0 to 1. Category scores are the severity-weighted average of their rules. */
  score: number;
  strength?: Message;
  issue?: Message;
  recommendation?: Message;
};

export type Rule = {
  id: string;
  category: CategoryId;
  severity: Severity;
  /** What the rule checks, in one sentence. Published on the landing page. */
  summary: string;
  evaluate: (facts: ResumeFacts) => RuleOutcome;
};

const pct = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);
const plural = (count: number, one: string, many = `${one}s`) =>
  `${count} ${count === 1 ? one : many}`;

/**
 * The complete rule set. Each rule is a pure function of the facts, carries a stable ID that
 * appears in the report, and explains itself in plain words. Changing a rule's behavior
 * changes ENGINE_VERSION.
 */
export const RULES: readonly Rule[] = [
  {
    id: 'STR-01',
    summary: 'An "Experience" or "Work history" heading is present.',
    category: 'structure',
    severity: 'high',
    evaluate: ({ sections }) =>
      sections.has('experience')
        ? {
            score: 1,
            strength: {
              title: 'Clear experience section',
              detail: 'Your work history sits under its own heading, where reviewers look first.',
            },
          }
        : {
            score: 0,
            issue: {
              title: 'No experience section found',
              detail: 'No heading such as "Experience" or "Work history" was found.',
            },
            recommendation: {
              title: 'Add an "Experience" heading',
              detail:
                'Group your roles under one clear heading so reviewers and parsers find them immediately.',
            },
          },
  },
  {
    id: 'STR-02',
    summary: 'Skills are listed in their own section.',
    category: 'structure',
    severity: 'medium',
    evaluate: ({ sections }) =>
      sections.has('skills')
        ? { score: 1 }
        : {
            score: 0,
            issue: {
              title: 'No skills section',
              detail: 'Skills appear only inside your experience, which makes them easy to miss.',
            },
            recommendation: {
              title: 'Add a short skills section',
              detail:
                'List the tools and technologies you use most, grouped by area, in six to twelve items.',
            },
          },
  },
  {
    id: 'STR-03',
    summary: 'Education or certifications are listed.',
    category: 'structure',
    severity: 'medium',
    evaluate: ({ sections }) =>
      sections.has('education') || sections.has('certifications')
        ? { score: 1 }
        : {
            score: 0.3,
            issue: {
              title: 'No education or certifications',
              detail: 'Neither an "Education" nor a "Certifications" heading was found.',
            },
            recommendation: {
              title: 'Add education or certifications',
              detail:
                'Even a single line with your degree, bootcamp or most relevant certification answers a common screening question.',
            },
          },
  },
  {
    id: 'STR-04',
    summary: 'An email address is present.',
    category: 'structure',
    severity: 'high',
    evaluate: ({ hasEmail }) =>
      hasEmail
        ? { score: 1 }
        : {
            score: 0,
            issue: {
              title: 'No email address',
              detail: 'No email address was found in the document.',
            },
            recommendation: {
              title: 'Add an email address at the top',
              detail: 'Reviewers need a way to reach you; put your email next to your name.',
            },
          },
  },
  {
    id: 'IMP-01',
    summary: 'At least 35% of bullets include a number, percentage or amount.',
    category: 'impact',
    severity: 'high',
    evaluate: ({ bullets, quantifiedBullets }) => {
      if (bullets.length === 0) {
        return {
          score: 0.2,
          issue: {
            title: 'Experience is written as paragraphs',
            detail: 'No bullet points were found, so individual achievements are hard to scan.',
          },
          recommendation: {
            title: 'Rewrite roles as bullet points',
            detail: 'Use three to six bullets per role, each describing one result.',
          },
        };
      }
      const ratio = pct(quantifiedBullets, bullets.length);
      const detail = `${quantifiedBullets} of ${plural(bullets.length, 'bullet')} include a number, percentage or amount.`;
      if (ratio >= 0.35)
        return { score: 1, strength: { title: 'Measurable achievements', detail } };
      return {
        score: clamp(ratio / 0.35, 0, 1),
        ...(ratio < 0.2 ? { issue: { title: 'Few measurable achievements', detail } } : {}),
        recommendation: {
          title: 'Quantify your results',
          detail:
            'Add the scale or outcome to your strongest bullets: users served, time saved, revenue, latency, team size.',
        },
      };
    },
  },
  {
    id: 'IMP-02',
    summary: 'At least 60% of bullets start with an action verb.',
    category: 'impact',
    severity: 'medium',
    evaluate: ({ bullets, actionVerbBullets }) => {
      if (bullets.length === 0) return { score: 0.5 };
      const ratio = pct(actionVerbBullets, bullets.length);
      const detail = `${actionVerbBullets} of ${plural(bullets.length, 'bullet')} start with an action verb such as "Built", "Led" or "Reduced".`;
      if (ratio >= 0.6)
        return { score: 1, strength: { title: 'Bullets lead with action verbs', detail } };
      return {
        score: clamp(ratio / 0.6, 0, 1),
        ...(ratio < 0.4 ? { issue: { title: 'Bullets rarely start with an action', detail } } : {}),
        recommendation: {
          title: 'Start bullets with what you did',
          detail: 'Open each bullet with a strong verb in the past tense, followed by the result.',
        },
      };
    },
  },
  {
    id: 'IMP-03',
    summary: 'Duty phrases such as "responsible for" are avoided.',
    category: 'impact',
    severity: 'low',
    evaluate: ({ weakPhrases }) =>
      weakPhrases.length === 0
        ? { score: 1 }
        : {
            score: clamp(1 - weakPhrases.length * 0.3, 0, 1),
            issue: {
              title: 'Passive phrasing',
              detail: `Found ${weakPhrases.map((phrase) => `"${phrase}"`).join(', ')}, which describe duties rather than results.`,
            },
            recommendation: {
              title: 'Replace duty phrases with outcomes',
              detail:
                'Turn "Responsible for the API" into "Built the payments API used by 40 internal services".',
            },
          },
  },
  {
    id: 'SKL-01',
    summary: 'At least eight recognizable skills are named.',
    category: 'skills',
    severity: 'high',
    evaluate: ({ skills }) => {
      const count = skills.length;
      if (count >= 8) {
        return {
          score: 1,
          strength: {
            title: 'Broad, recognizable skill set',
            detail: `${plural(count, 'skill')} recognized, across your experience and skills section.`,
          },
        };
      }
      return {
        score: clamp(count / 8, 0, 1),
        ...(count < 5
          ? {
              issue: {
                title: 'Few recognizable skills',
                detail: `Only ${plural(count, 'skill')} could be recognized.`,
              },
            }
          : {}),
        recommendation: {
          title: 'Name your tools explicitly',
          detail:
            'Write the exact names of the languages, frameworks and platforms you used in each role.',
        },
      };
    },
  },
  {
    id: 'SKL-02',
    summary: 'Skills span at least four areas.',
    category: 'skills',
    severity: 'medium',
    evaluate: ({ skills }) => {
      const areas = new Set(skills.map((skill) => skill.category)).size;
      if (areas >= 4)
        return {
          score: 1,
          strength: {
            title: 'Range across areas',
            detail: `Your skills cover ${areas} areas, from languages to delivery practices.`,
          },
        };
      return {
        score: clamp(areas / 4, 0, 1),
        recommendation: {
          title: 'Show the breadth of your work',
          detail:
            'Mention testing, delivery and collaboration practices alongside languages and frameworks.',
        },
      };
    },
  },
  {
    id: 'CLR-01',
    summary: 'Length falls between 300 and 900 words.',
    category: 'clarity',
    severity: 'medium',
    evaluate: ({ wordCount }) => {
      const detail = `The resume has about ${wordCount} words.`;
      if (wordCount >= 300 && wordCount <= 900)
        return {
          score: 1,
          strength: {
            title: 'Appropriate length',
            detail: `${detail} That fits one to two pages.`,
          },
        };
      if (wordCount < 300) {
        return {
          score: clamp((wordCount / 300) ** 2, 0, 1),
          issue: {
            title: 'Resume is very short',
            detail: `${detail} Reviewers may lack the context to judge your experience.`,
          },
          recommendation: {
            title: 'Add context to each role',
            detail:
              'Describe the product, your scope and two or three results for every recent position.',
          },
        };
      }
      return {
        score: clamp(1 - (wordCount - 900) / 900, 0.2, 1),
        issue: { title: 'Resume is long', detail: `${detail} Most reviewers skim the first page.` },
        recommendation: {
          title: 'Trim older and minor items',
          detail: 'Keep the last ten years in detail and summarize earlier roles in one line each.',
        },
      };
    },
  },
  {
    id: 'CLR-02',
    summary: 'Bullets stay under 32 words.',
    category: 'clarity',
    severity: 'low',
    evaluate: ({ longBullets }) =>
      longBullets === 0
        ? { score: 1 }
        : {
            score: clamp(1 - longBullets * 0.2, 0, 1),
            issue: {
              title: 'Some bullets are hard to scan',
              detail: `${plural(longBullets, 'bullet')} run longer than 32 words.`,
            },
            recommendation: {
              title: 'Keep bullets to one or two lines',
              detail:
                'Split long bullets into the action and the result, or move details to an interview conversation.',
            },
          },
  },
  {
    id: 'CLR-03',
    summary: 'The text avoids "I", "me" and "my".',
    category: 'clarity',
    severity: 'low',
    evaluate: ({ firstPersonCount }) =>
      firstPersonCount <= 1
        ? { score: 1 }
        : {
            score: clamp(1 - (firstPersonCount - 1) * 0.15, 0, 1),
            issue: {
              title: 'Written in the first person',
              detail: `Found ${plural(firstPersonCount, 'use')} of "I", "me" or "my".`,
            },
            recommendation: {
              title: 'Drop the pronouns',
              detail:
                'Resume bullets read more directly without "I" or "my": "Led the migration" instead of "I led the migration".',
            },
          },
  },
  {
    id: 'CLR-04',
    summary: 'The summary, if present, stays under 70 words.',
    category: 'clarity',
    severity: 'low',
    evaluate: ({ summaryWordCount }) => {
      if (summaryWordCount === null) {
        return {
          score: 0.6,
          recommendation: {
            title: 'Consider a two-line summary',
            detail:
              'A short summary with your role, years of experience and focus area frames everything below it.',
          },
        };
      }
      if (summaryWordCount <= 70)
        return {
          score: 1,
          strength: {
            title: 'Concise summary',
            detail: `Your summary is ${summaryWordCount} words: quick to read and to the point.`,
          },
        };
      return {
        score: 0.5,
        issue: {
          title: 'Summary could be more concise',
          detail: `Your summary is ${summaryWordCount} words long.`,
        },
        recommendation: {
          title: 'Shorten the summary',
          detail:
            'Aim for two or three sentences, under 70 words: who you are, what you build and what you are looking for.',
        },
      };
    },
  },
  {
    id: 'EXP-01',
    summary: 'Roles carry start and end dates.',
    category: 'experience',
    severity: 'high',
    evaluate: ({ experience }) => {
      if (experience.datedRoles === 0) {
        return {
          score: 0.2,
          issue: {
            title: 'No dates on your roles',
            detail: 'No date ranges such as "Mar 2021 – Present" were found.',
          },
          recommendation: {
            title: 'Add start and end dates',
            detail:
              'Use a consistent "Mon YYYY – Mon YYYY" format for every role so your experience can be read at a glance.',
          },
        };
      }
      return {
        score: 1,
        strength: {
          title: 'Dated work history',
          detail: `${plural(experience.datedRoles, 'dated role')}, about ${experience.estimatedYears} years of experience in total.`,
        },
      };
    },
  },
  {
    id: 'CMP-01',
    summary: 'A LinkedIn, GitHub or portfolio link is included.',
    category: 'completeness',
    severity: 'medium',
    evaluate: ({ hasProfileLink }) =>
      hasProfileLink
        ? {
            score: 1,
            strength: {
              title: 'Professional links included',
              detail: 'A LinkedIn, GitHub or portfolio link lets reviewers see more of your work.',
            },
          }
        : {
            score: 0.3,
            recommendation: {
              title: 'Link to your work',
              detail: 'Add a LinkedIn profile, GitHub account or portfolio URL in the header.',
            },
          },
  },
  {
    id: 'CMP-02',
    summary: 'Projects or certifications add evidence beyond job titles.',
    category: 'completeness',
    severity: 'low',
    evaluate: ({ sections }) =>
      sections.has('projects') || sections.has('certifications')
        ? { score: 1 }
        : {
            score: 0.6,
            recommendation: {
              title: 'Show work beyond your job titles',
              detail:
                'A short "Projects" section with one or two relevant projects adds evidence for the skills you list.',
            },
          },
  },
];
