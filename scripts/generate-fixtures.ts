/**
 * Builds PDF and DOCX files from the example resumes. The output is committed: tests/fixtures
 * feeds the integration and end-to-end tests, and public/examples lets visitors try the analyzer
 * without uploading their own resume.
 *
 *   pnpm fixtures
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

import { EXAMPLE_RESUMES } from '../src/content/example-resumes';

const HEADINGS =
  /^(summary|professional summary|profile|about me|experience|work experience|professional experience|education|skills|technical skills|projects|certifications)$/i;
const BULLET = /^\s*[•\-]\s+/;

/** The first line of every example resume is the person's name. */
function authorOf(text: string): string {
  return text.split('\n', 1)[0] ?? '';
}

function titleOf(text: string): string {
  return `${authorOf(text)} — Resume`;
}

async function buildPdf(text: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(titleOf(text));
  pdf.setAuthor(authorOf(text));
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const [width, height, margin] = [612, 792, 56];
  let page = pdf.addPage([width, height]);
  let y = height - margin;

  const draw = (line: string, size: number, font = regular) => {
    if (y < margin) {
      page = pdf.addPage([width, height]);
      y = height - margin;
    }
    page.drawText(line, { x: margin, y, size, font, color: rgb(0.1, 0.1, 0.1) });
    y -= size * 1.45;
  };

  for (const raw of text.split('\n')) {
    const line = raw.trimEnd();
    if (!line) {
      y -= 6;
      continue;
    }
    const isHeading = HEADINGS.test(line.trim());
    const size = isHeading ? 12 : 10;
    const font = isHeading ? bold : regular;
    let current = '';
    for (const word of line.split(' ')) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > width - margin * 2) {
        draw(current, size, font);
        current = `  ${word}`;
      } else {
        current = candidate;
      }
    }
    draw(current, size, font);
  }
  return pdf.save();
}

async function buildDocx(text: string): Promise<Uint8Array> {
  const children = text.split('\n').map((raw) => {
    const line = raw.trim();
    if (HEADINGS.test(line)) return new Paragraph({ text: line, heading: HeadingLevel.HEADING_2 });
    if (BULLET.test(line))
      return new Paragraph({ text: line.replace(BULLET, ''), bullet: { level: 0 } });
    return new Paragraph({ children: [new TextRun(line)] });
  });
  const document = new Document({
    creator: authorOf(text),
    title: titleOf(text),
    sections: [{ children }],
  });
  return new Uint8Array(await Packer.toBuffer(document));
}

/** A valid PDF that only contains a drawn shape: stands in for a scanned, image-only resume. */
async function buildImageOnlyPdf(): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  page.drawRectangle({ x: 56, y: 600, width: 500, height: 120, color: rgb(0.85, 0.85, 0.85) });
  return pdf.save();
}

async function write(target: string, bytes: Uint8Array) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, bytes);
  console.log(`wrote ${target} (${bytes.byteLength} bytes)`);
}

for (const resume of EXAMPLE_RESUMES) {
  const pdf = await buildPdf(resume.text);
  const docx = await buildDocx(resume.text);
  await write(`tests/fixtures/${resume.slug}.pdf`, pdf);
  await write(`tests/fixtures/${resume.slug}.docx`, docx);
}

await write('tests/fixtures/image-only.pdf', await buildImageOnlyPdf());
await write(
  'tests/fixtures/not-a-resume.pdf',
  new TextEncoder().encode('This is plain text with a .pdf name.'),
);

const [first] = EXAMPLE_RESUMES;
const second = EXAMPLE_RESUMES.find((resume) => resume.slug === 'jordan-okafor');
if (first && second) {
  await write('public/examples/avery-lindqvist-resume.pdf', await buildPdf(first.text));
  await write('public/examples/jordan-okafor-cv.docx', await buildDocx(second.text));
}
