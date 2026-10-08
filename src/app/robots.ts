import { type MetadataRoute } from 'next';

import { absoluteUrl, BASE_PATH } from '@/config/site';

/** Crawling rules for this app: its pages are open and its API stays out of the index. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        // The OpenAPI document is public reference material that llms.txt and the docs link to.
        allow: ['/', `${BASE_PATH}/api/openapi.json`],
        disallow: [`${BASE_PATH}/api/`],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
  };
}
