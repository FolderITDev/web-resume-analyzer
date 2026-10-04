import './globals.css';

import { type Metadata, type Viewport } from 'next';

import { absoluteUrl, siteConfig } from '@/config/site';
import { cn } from '@/lib/cn';

import { martianMono, monaSans } from './fonts';

const title = `${siteConfig.name}: explainable resume scoring by Folder IT`;

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl('/')),
  title: { default: title, template: `%s · ${siteConfig.name}` },
  description: siteConfig.shortDescription,
  applicationName: siteConfig.name,
  authors: [{ name: siteConfig.company.name, url: siteConfig.company.url }],
  creator: siteConfig.company.name,
  publisher: siteConfig.company.name,
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    siteName: `${siteConfig.name} by ${siteConfig.company.name}`,
    locale: siteConfig.locale,
  },
  twitter: { card: 'summary_large_image', site: '@folderit', creator: '@folderit' },
};

export const viewport: Viewport = {
  themeColor: '#fafaf8',
  colorScheme: 'light',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={cn(monaSans.variable, martianMono.variable)}
    >
      <body className="min-h-dvh">
        <a
          href="#main"
          className="fixed top-3 left-3 z-50 -translate-y-20 rounded-xs bg-ink px-3 py-2 text-sm text-paper focus-visible:translate-y-0"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
