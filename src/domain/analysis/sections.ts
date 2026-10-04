import { SECTION_IDS, type SectionId } from '@/lib/validation/analysis';

import { words } from './text';

const HEADINGS: Record<SectionId, readonly string[]> = {
  summary: [
    'summary',
    'professional summary',
    'profile',
    'about',
    'about me',
    'objective',
    'career objective',
  ],
  experience: [
    'experience',
    'work experience',
    'professional experience',
    'employment',
    'employment history',
    'work history',
    'career history',
  ],
  education: ['education', 'academic background', 'education and training'],
  skills: [
    'skills',
    'technical skills',
    'core skills',
    'technologies',
    'tech stack',
    'core competencies',
    'tools',
    'skills and tools',
  ],
  projects: ['projects', 'selected projects', 'personal projects', 'open source'],
  certifications: ['certifications', 'certificates', 'licenses and certifications', 'courses'],
};

export type Section = { id: SectionId; heading: string; lines: string[] };

function headingId(line: string): SectionId | null {
  if (words(line).length > 4) return null;
  const key = line
    .toLowerCase()
    .replace(/[:|]+$/, '')
    .replace(/&/g, 'and')
    .trim();
  for (const id of SECTION_IDS) {
    if (HEADINGS[id].includes(key)) return id;
  }
  return null;
}

/**
 * Splits resume lines into known sections. Lines before the first recognized heading belong
 * to the header (name, contact, title) and are returned separately.
 */
export function splitSections(lines: readonly string[]): { header: string[]; sections: Section[] } {
  const header: string[] = [];
  const sections: Section[] = [];
  let current: Section | null = null;

  for (const line of lines) {
    const id = headingId(line);
    if (id) {
      current = { id, heading: line, lines: [] };
      sections.push(current);
    } else if (current) {
      current.lines.push(line);
    } else {
      header.push(line);
    }
  }

  return { header, sections };
}

export function sectionText(sections: readonly Section[], id: SectionId): string {
  return sections
    .filter((section) => section.id === id)
    .flatMap((section) => section.lines)
    .join('\n');
}
