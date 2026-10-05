import { type MetadataRoute } from 'next';

import { absoluteUrl } from '@/config/site';

/** Only public, indexable pages. The tool pages are marked noindex and left out. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl('/'), changeFrequency: 'monthly', priority: 1 },
    { url: absoluteUrl('/docs/api'), changeFrequency: 'monthly', priority: 0.6 },
  ];
}
