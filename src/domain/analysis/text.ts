const BULLET_PREFIX = /^\s*(?:[•●▪◦■\-–—*·>]|\d{1,2}[.)])\s+/;

/** Normalizes extracted text: unified newlines, no control characters, collapsed spaces. */
export function normalizeText(raw: string): string {
  return raw
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function toLines(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export function words(text: string): string[] {
  return text.match(/[\p{L}\p{N}][\p{L}\p{N}'’+#.-]*/gu) ?? [];
}

export function isBullet(line: string): boolean {
  return BULLET_PREFIX.test(line);
}

export function stripBullet(line: string): string {
  return line.replace(BULLET_PREFIX, '').trim();
}

/** Lines that read as achievement statements: explicit bullets of reasonable length. */
export function bulletLines(lines: readonly string[]): string[] {
  return lines
    .filter(isBullet)
    .map(stripBullet)
    .filter((line) => words(line).length >= 3);
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function roundTo(value: number, decimals: number): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
