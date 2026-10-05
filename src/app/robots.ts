import { type MetadataRoute } from 'next';

import { absoluteUrl, BASE_PATH } from '@/config/site';

/**
 * Served at /apps/resume-analyzer/robots.txt for standalone deployments. Under folderit.net the
 * root robots.txt applies; it should list this app's sitemap (see the README).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: [`${BASE_PATH}/api/`] }],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
