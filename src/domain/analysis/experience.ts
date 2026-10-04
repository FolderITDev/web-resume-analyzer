import { type Experience } from '@/lib/validation/analysis';

import { roundTo } from './text';

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const MONTH =
  '(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sept?(?:ember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';
const POINT = `(?:${MONTH}\\.?\\s+|(\\d{1,2})\\s*/\\s*)?((?:19|20)\\d{2})`;
const OPEN_END = '(present|current|now|today)';
const RANGE = new RegExp(`${POINT}\\s*(?:-|–|—|to|until)\\s*(?:${POINT}|${OPEN_END})`, 'gi');

export type DateRange = { start: number; end: number; open: boolean };

/** Month index since year 0, so ranges can be merged with integer arithmetic. */
function monthIndex(year: number, month: number): number {
  return year * 12 + month;
}

function parsePoint(
  monthName: string | undefined,
  monthNumber: string | undefined,
  year: string,
): number {
  const y = Number(year);
  if (monthName)
    return monthIndex(y, Math.max(0, MONTHS.indexOf(monthName.slice(0, 3).toLowerCase())));
  if (monthNumber) {
    const m = Number(monthNumber);
    if (m >= 1 && m <= 12) return monthIndex(y, m - 1);
  }
  return monthIndex(y, 0);
}

/**
 * Finds employment-style date ranges such as "Jan 2019 – Present", "2018 - 2021" or
 * "03/2017 to 06/2020". Ranges that end after the reference date are clamped to it, and
 * ranges that end before they start are ignored.
 */
export function findDateRanges(text: string, referenceDate: Date): DateRange[] {
  const now = monthIndex(referenceDate.getUTCFullYear(), referenceDate.getUTCMonth());
  const ranges: DateRange[] = [];

  for (const match of text.matchAll(RANGE)) {
    const [
      ,
      startMonthName,
      startMonthNumber,
      startYear,
      endMonthName,
      endMonthNumber,
      endYear,
      openEnd,
    ] = match;
    if (!startYear) continue;
    const start = parsePoint(startMonthName, startMonthNumber, startYear);
    const open = Boolean(openEnd);
    // A bare end year ("2018 - 2021") counts through the end of that year.
    const rawEnd = open
      ? now
      : endYear
        ? parsePoint(endMonthName, endMonthNumber, endYear) +
          (endMonthName || endMonthNumber ? 0 : 11)
        : start;
    const end = Math.min(rawEnd, now);
    if (end < start || start > now) continue;
    ranges.push({ start, end, open });
  }

  return ranges;
}

/** Total months covered by the ranges, counting overlapping roles once. */
export function mergedMonths(ranges: readonly DateRange[]): number {
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  let total = 0;
  let current: { start: number; end: number } | null = null;

  for (const range of sorted) {
    if (current && range.start <= current.end + 1) {
      current.end = Math.max(current.end, range.end);
    } else {
      if (current) total += current.end - current.start + 1;
      current = { start: range.start, end: range.end };
    }
  }
  if (current) total += current.end - current.start + 1;
  return total;
}

export function estimateExperience(experienceText: string, referenceDate: Date): Experience {
  const ranges = findDateRanges(experienceText, referenceDate);
  const earliest = ranges.length > 0 ? Math.min(...ranges.map((range) => range.start)) : null;
  return {
    estimatedYears: roundTo(mergedMonths(ranges) / 12, 1),
    datedRoles: ranges.length,
    earliestYear: earliest === null ? null : Math.floor(earliest / 12),
    hasCurrentRole: ranges.some((range) => range.open),
  };
}
