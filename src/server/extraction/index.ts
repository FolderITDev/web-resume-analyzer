import mammoth from 'mammoth';
import { extractText as extractPdfText } from 'unpdf';

import { type FileType } from '@/lib/validation/analysis';

import { ExtractionError } from '../errors';

const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-
const ZIP_MAGIC = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04

function startsWith(bytes: Uint8Array, magic: readonly number[]): boolean {
  return magic.every((byte, index) => bytes[index] === byte);
}

/**
 * Identifies the file from its bytes, never from its name or the browser's MIME type.
 * A ZIP is only accepted as DOCX if it contains the Word document part.
 */
export function sniffFileType(bytes: Uint8Array): FileType | null {
  if (startsWith(bytes, PDF_MAGIC)) return 'pdf';
  if (startsWith(bytes, ZIP_MAGIC)) {
    const head = new TextDecoder('latin1').decode(
      bytes.subarray(0, Math.min(bytes.length, 64 * 1024)),
    );
    if (head.includes('word/')) return 'docx';
  }
  return null;
}

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  '#39': "'",
  nbsp: ' ',
};

/** Converts mammoth's HTML to text, keeping list items as bullets and blocks as lines. */
export function docxHtmlToText(html: string): string {
  return html
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|h[1-6]|li|tr)>|<br\s*\/?>/gi, '\n')
    .replace(/<\/t[dh]>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, name: string) => ENTITIES[name] ?? '');
}

async function extractPdf(bytes: Uint8Array): Promise<string> {
  try {
    const { text } = await extractPdfText(bytes, { mergePages: true });
    return text;
  } catch {
    throw new ExtractionError(
      'unreadable_file',
      'The PDF could not be opened. It may be damaged or password protected.',
    );
  }
}

async function extractDocx(bytes: Uint8Array): Promise<string> {
  try {
    const { value } = await mammoth.convertToHtml({ buffer: Buffer.from(bytes) });
    return docxHtmlToText(value);
  } catch {
    throw new ExtractionError(
      'unreadable_file',
      'The DOCX file could not be opened. It may be damaged.',
    );
  }
}

/** Extracts plain text. Image-only documents fail with a message the person can act on. */
export async function extractText(bytes: Uint8Array, type: FileType): Promise<string> {
  // pdf.js may detach the buffer it is given, so it always receives its own copy.
  const text = type === 'pdf' ? await extractPdf(bytes.slice()) : await extractDocx(bytes);
  if (text.replace(/\s+/g, '').length < 80) {
    throw new ExtractionError(
      'no_text_found',
      'No readable text was found. Scanned or image-only documents cannot be analyzed; export the resume as a text PDF or DOCX.',
    );
  }
  return text;
}
