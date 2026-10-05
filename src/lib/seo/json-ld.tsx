import { absoluteUrl, siteConfig } from '@/config/site';

type JsonLdObject = Record<string, unknown>;

/**
 * Renders schema.org data. `<` is escaped so content can never close the script element.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  );
}

const ORGANIZATION_ID = `${siteConfig.company.url}/#organization`;

export function organizationJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORGANIZATION_ID,
    name: siteConfig.company.name,
    url: siteConfig.company.url,
    logo: siteConfig.company.logoUrl,
    description: siteConfig.company.description,
    sameAs: siteConfig.company.sameAs,
    knowsAbout: [
      'Custom software development',
      'Web application development',
      'Full-stack development',
      'Mobile application development',
      'Business applications',
      'AI software development',
    ],
  };
}

export function webApplicationJsonLd(): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'SoftwareApplication'],
    '@id': `${absoluteUrl('/')}#application`,
    name: siteConfig.name,
    url: absoluteUrl('/'),
    description: siteConfig.shortDescription,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Any (web browser)',
    browserRequirements: 'Requires JavaScript and a modern browser.',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: [
      'PDF and DOCX resume upload',
      'Deterministic, rule-based resume scoring',
      'Skill and experience detection',
      'Job description matching',
      'REST API with OpenAPI 3.1 documentation',
    ],
    softwareHelp: absoluteUrl('/docs/api'),
    codeRepository: siteConfig.repositoryUrl,
    programmingLanguage: ['TypeScript', 'SQL'],
    creator: { '@id': ORGANIZATION_ID },
    publisher: { '@id': ORGANIZATION_ID },
  };
}

export function breadcrumbJsonLd(items: readonly { name: string; url: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function faqJsonLd(faqs: readonly { question: string; answer: string }[]): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  };
}
