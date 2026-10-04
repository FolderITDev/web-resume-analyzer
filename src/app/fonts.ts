import localFont from 'next/font/local';

/** Mona Sans (SIL OFL 1.1), self-hosted with its weight and width axes. */
export const monaSans = localFont({
  src: './fonts/mona-sans-variable.woff2',
  variable: '--font-mona',
  weight: '200 900',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 125%' }],
});

/** Martian Mono (SIL OFL 1.1), used only for measurements, rule IDs and counts. */
export const martianMono = localFont({
  src: './fonts/martian-mono-variable.woff2',
  variable: '--font-martian',
  weight: '100 800',
  display: 'swap',
  declarations: [{ prop: 'font-stretch', value: '75% 112.5%' }],
});
