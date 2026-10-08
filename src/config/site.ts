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
    /** The logo folderit.net publishes for its Organization, so both describe one entity. */
    logoUrl: 'https://folderit.net/wp-content/uploads/2023/12/LOGO3-e1703096962202.jpg',
    description:
      'Folder IT is a nearshore software development company that builds custom web and mobile applications, business platforms and AI-ready engineering teams for U.S. companies.',
    sameAs: [
      'https://www.linkedin.com/company/folderit',
      'https://www.instagram.com/folderit.social/',
      'https://x.com/folderit',
      'https://www.youtube.com/@folderit',
      'https://www.tiktok.com/@folder_it',
      'https://www.facebook.com/folderit.social',
      'https://github.com/FolderITDev',
    ],
  },
} as const;

/** Public origin without a trailing slash, from SITE_ORIGIN; the development server when unset. */
export function siteOrigin(): string {
  return (process.env.SITE_ORIGIN ?? 'http://localhost:3010').replace(/\/+$/, '');
}

/** Absolute URL for a path inside the app, e.g. absoluteUrl('/analyze'). */
export function absoluteUrl(path = '/'): string {
  const suffix = path === '/' ? '' : path;
  return `${siteOrigin()}${BASE_PATH}${suffix}`;
}
