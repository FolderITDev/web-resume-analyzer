import { type FileType } from '@/lib/validation/analysis';

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
