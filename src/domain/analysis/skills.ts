import { type DetectedSkill } from '@/lib/validation/analysis';

import { SKILLS, type SkillDefinition } from './skills-taxonomy';
import { escapeRegExp } from './text';

type Matcher = { skill: SkillDefinition; pattern: RegExp; length: number };

// Longest spellings run first and mask what they match, so "React Native" is not also
// counted as "React" and "Node.js" is not counted twice.
const MATCHERS: readonly Matcher[] = SKILLS.flatMap((skill) =>
  [skill.name.toLowerCase(), ...(skill.aliases ?? [])].map((spelling) => ({
    skill,
    length: spelling.length,
    pattern: new RegExp(
      `(?<![\\p{L}\\p{N}+#.])${escapeRegExp(spelling)}(?![\\p{L}\\p{N}+#])`,
      'giu',
    ),
  })),
).sort((a, b) => b.length - a.length);

/** Skills mentioned in the text, ordered by mentions and then by name. */
export function detectSkills(text: string): DetectedSkill[] {
  let remaining = text.toLowerCase();
  const counts = new Map<string, { skill: SkillDefinition; mentions: number }>();

  for (const { skill, pattern } of MATCHERS) {
    remaining = remaining.replace(pattern, (match) => {
      const entry = counts.get(skill.id) ?? { skill, mentions: 0 };
      entry.mentions += 1;
      counts.set(skill.id, entry);
      return ' '.repeat(match.length);
    });
  }

  return [...counts.values()]
    .map(({ skill, mentions }) => ({
      id: skill.id,
      name: skill.name,
      category: skill.category,
      mentions,
    }))
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name));
}
