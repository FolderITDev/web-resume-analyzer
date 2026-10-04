/**
 * Public identity of the app. Every route is served below BASE_PATH and canonical URLs are
 * built from SITE_ORIGIN.
 */
export const BASE_PATH = '/apps/resume-analyzer';

export const siteConfig = {
  name: 'Resume Analyzer',
  shortDescription:
    'Upload a PDF or DOCX resume and get a scored, explainable report with skills, experience and a job description match.',
  repositoryUrl: 'https://github.com/FolderITDev/web-resume-analyzer',
  locale: 'en_US',
  company: {
    name: 'Folder IT',
    url: 'https://folderit.net',
    logoUrl: 'https://www.folderit.net/docs/Header.webp',
    description:
      'Folder IT is a nearshore software development company that builds custom web and mobile applications, business platforms and AI-ready engineering teams for U.S. companies.',
    sameAs: [
      'https://www.linkedin.com/company/folderit',
      'https://x.com/folderit',
      'https://www.youtube.com/@folderit',
      'https://github.com/FolderITDev',
    ],
  },
} as const;

/** Origin without a trailing slash, e.g. https://folderit.net. */
export function siteOrigin(): string {
  return (process.env.SITE_ORIGIN ?? 'https://folderit.net').replace(/\/+$/, '');
}

/** Absolute URL for a path inside the app, e.g. absoluteUrl('/analyze'). */
export function absoluteUrl(path = '/'): string {
  const suffix = path === '/' ? '' : path;
  return `${siteOrigin()}${BASE_PATH}${suffix}`;
}
