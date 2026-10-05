import { type Metadata } from 'next';

import { absoluteUrl, siteConfig } from '@/config/site';

type PageMetadataInput = {
  /** Path inside the app, e.g. '/' or '/docs/api'. */
  path: string;
  /** Page title; the layout template appends the product name. Omit to use the default title. */
  title?: string;
  description: string;
};

/**
 * Complete metadata for an indexable page. Next.js merges metadata shallowly, so a page that
 * sets `openGraph` must repeat every Open Graph field, including the shared social image.
 */
export function pageMetadata({ path, title, description }: PageMetadataInput): Metadata {
  const url = absoluteUrl(path);
  const socialTitle = title
    ? `${title} · ${siteConfig.name}`
    : `${siteConfig.name} by ${siteConfig.company.name}`;
  const image = {
    url: absoluteUrl('/opengraph-image'),
    width: 1200,
    height: 630,
    alt: `${siteConfig.name} by ${siteConfig.company.name}: explainable resume scoring`,
  };

  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      url,
      title: socialTitle,
      description,
      siteName: `${siteConfig.name} by ${siteConfig.company.name}`,
      locale: siteConfig.locale,
      images: [image],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@folderit',
      title: socialTitle,
      description,
      images: [image.url],
    },
  };
}
