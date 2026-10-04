import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AxisMeter } from '@/components/specimen/axis-meter';
import { ScoreSpecimen, weightForScore } from '@/components/specimen/score-specimen';
import { Notice } from '@/components/ui/feedback';
import { FindingList } from '@/features/resumes/components/report/findings';

describe('AxisMeter', () => {
  it('exposes its value as an accessible meter', () => {
    render(<AxisMeter label="Impact" value={72} detail="Weight 25%" />);
    const meter = screen.getByRole('meter', { name: 'Impact' });
    expect(meter.getAttribute('aria-valuenow')).toBe('72');
    expect(meter.getAttribute('aria-valuemax')).toBe('100');
  });

  it('clamps the visual ratio but reports the real value', () => {
    render(<AxisMeter label="Overflow" value={140} />);
    const meter = screen.getByRole('meter', { name: 'Overflow' });
    expect(meter.style.getPropertyValue('--ratio')).toBe('1');
  });
});

describe('ScoreSpecimen', () => {
  it('maps the score to a font weight between 260 and 820', () => {
    expect(weightForScore(0)).toBe(260);
    expect(weightForScore(50)).toBe(540);
    expect(weightForScore(100)).toBe(820);
    expect(weightForScore(140)).toBe(820);
  });

  it('states the score and grade in words', () => {
    render(<ScoreSpecimen score={86} grade="excellent" />);
    expect(screen.getByText(/Score/).textContent).toContain('86');
    expect(screen.getByText('Excellent')).toBeTruthy();
  });
});

describe('Notice', () => {
  it('announces errors as alerts and information as status', () => {
    render(
      <>
        <Notice tone="error" title="Upload failed" />
        <Notice title="Heads up" />
      </>,
    );
    expect(screen.getByRole('alert').textContent).toContain('Upload failed');
    expect(screen.getByRole('status').textContent).toContain('Heads up');
  });
});

describe('FindingList', () => {
  it('shows each finding with its rule and the empty state when there are none', () => {
    const { rerender } = render(
      <FindingList
        title="Issues"
        kind="issue"
        empty="No issues found."
        findings={[
          {
            ruleId: 'IMP-01',
            category: 'impact',
            severity: 'high',
            title: 'Few measurable achievements',
            detail: '1 of 8 bullets.',
          },
        ]}
      />,
    );
    expect(screen.getByText('Few measurable achievements')).toBeTruthy();
    expect(screen.getByText(/IMP-01 · impact · High severity/)).toBeTruthy();

    rerender(<FindingList title="Issues" kind="issue" empty="No issues found." findings={[]} />);
    expect(screen.getByText('No issues found.')).toBeTruthy();
  });
});
