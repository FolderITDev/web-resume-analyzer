import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';

import { exampleReport } from '@/content/example-reports';

export const alt = 'Resume Analyzer by Folder IT: explainable resume scoring';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const fontsDir = path.join(process.cwd(), 'src/assets/og-fonts');
const [light, semibold, mono] = await Promise.all([
  readFile(path.join(fontsDir, 'mona-sans-latin-300-normal.woff')),
  readFile(path.join(fontsDir, 'mona-sans-latin-600-normal.woff')),
  readFile(path.join(fontsDir, 'martian-mono-latin-400-normal.woff')),
]);

/** Social card in the specimen style: the product name, one line and a weighted score. */
export default function OpengraphImage() {
  const { score } = exampleReport('diego-marquez');
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        background: '#fafaf8',
        color: '#0d0d0d',
        padding: 72,
        fontFamily: 'Mona Sans',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flex: 1,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontSize: 34, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Resume Analyzer
          </span>
          <span style={{ width: 1, height: 36, background: '#a9acb1' }} />
          <span style={{ fontSize: 22, color: '#45474c', whiteSpace: 'nowrap' }}>by Folder IT</span>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 76,
            fontWeight: 300,
            lineHeight: 1.04,
            letterSpacing: -2,
            maxWidth: 640,
          }}
        >
          Read your resume the way a reviewer does.
        </div>
        <div
          style={{
            display: 'flex',
            fontFamily: 'Martian Mono',
            fontSize: 18,
            color: '#66696e',
            letterSpacing: 1,
          }}
        >
          EXPLAINABLE SCORE · PDF AND DOCX · REST API
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 28,
          borderLeft: '1px solid #d8d8d6',
          paddingLeft: 48,
        }}
      >
        <span style={{ fontSize: 260, fontWeight: 600, lineHeight: 0.8, letterSpacing: -12 }}>
          {score}
        </span>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: 380,
            width: 16,
          }}
        >
          <div style={{ display: 'flex', flex: 100 - score, width: 1, background: '#d8d8d6' }} />
          <div
            style={{
              display: 'flex',
              width: 16,
              height: 16,
              borderRadius: 8,
              background: '#1e40af',
            }}
          />
          <div style={{ display: 'flex', flex: score, width: 2, background: '#1e40af' }} />
        </div>
      </div>
    </div>,
    {
      ...size,
      fonts: [
        { name: 'Mona Sans', data: light, weight: 300 },
        { name: 'Mona Sans', data: semibold, weight: 600 },
        { name: 'Martian Mono', data: mono, weight: 400 },
      ],
    },
  );
}
