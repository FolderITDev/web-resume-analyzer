---
name: Resume Analyzer
description: Type Specimen — a resume read like a variable-font specimen sheet.
colors:
  paper: '#fafaf8'
  surface: '#f0f0ee'
  raised: '#ffffff'
  ink: '#0d0d0d'
  ink-2: '#45474c'
  ink-3: '#66696e'
  rule: '#d8d8d6'
  rule-strong: '#86898f'
  accent: '#1e40af'
  accent-strong: '#172f86'
  accent-soft: '#e7ecf8'
  danger: '#b42318'
  danger-soft: '#fbecea'
typography:
  display:
    fontFamily: 'Mona Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(2.75rem, 1.5rem + 4.4vw, 4.75rem)'
    fontWeight: 460
    lineHeight: 1.02
    letterSpacing: '-0.035em'
  title:
    fontFamily: 'Mona Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(2rem, 1.45rem + 2.2vw, 3.25rem)'
    fontWeight: 460
    lineHeight: 1.04
    letterSpacing: '-0.025em'
  heading:
    fontFamily: 'Mona Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.375rem, 1.2rem + 0.7vw, 1.75rem)'
    fontWeight: 540
    lineHeight: 1.2
    letterSpacing: '-0.012em'
  lead:
    fontFamily: 'Mona Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: 'clamp(1.0625rem, 1rem + 0.3vw, 1.1875rem)'
    fontWeight: 400
    lineHeight: 1.6
  body:
    fontFamily: 'Mona Sans Variable, ui-sans-serif, system-ui, sans-serif'
    fontSize: '0.9375rem'
    fontWeight: 400
    lineHeight: 1.6
  readout:
    fontFamily: 'Martian Mono Variable, ui-monospace, monospace'
    fontSize: '0.75rem'
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: '0.04em'
rounded:
  xs: '2px'
  sm: '4px'
spacing:
  gutter-mobile: '20px'
  gutter: '32px'
  section: '112px'
components:
  button-primary:
    backgroundColor: '{colors.accent}'
    textColor: '{colors.raised}'
    rounded: '{rounded.xs}'
    height: '44px'
    padding: '0 20px'
  button-primary-hover:
    backgroundColor: '{colors.accent-strong}'
  button-secondary:
    textColor: '{colors.ink}'
    rounded: '{rounded.xs}'
    height: '44px'
    padding: '0 20px'
  input:
    backgroundColor: '{colors.raised}'
    textColor: '{colors.ink}'
    rounded: '{rounded.xs}'
    height: '44px'
    padding: '0 14px'
---

# Resume Analyzer design system

## Overview

**Creative North Star: "The specimen sheet."** A type foundry shows a typeface by setting it large, measuring it on axes and laying out every glyph in a grid. Resume Analyzer shows a resume the same way: the score is a numeral whose weight is the score, categories are axis sliders, skills are glyph cells and the pipeline is a waterfall that gains weight as it runs.

The register is serious enterprise software: paper, ink and one cobalt; hairline rules instead of boxes and shadows; typography doing all the hierarchy. Motion is reserved for the moment a value settles.

**Key Characteristics:**

- Paper ground, ink type, a single cobalt accent for the active value and the primary action.
- Hairline rules separate everything; there are no cards and almost no shadows.
- Mona Sans carries every word; its weight axis carries meaning.
- Martian Mono appears only for measurements, rule IDs and code.
- Square corners (2 px) and generous, consistent gutters.

## Colors

Restrained strategy: neutrals plus one accent. The light appearance is the only appearance, chosen for the use scene: a person at a desk, in daylight, reading a document.

### Primary

- **Cobalt** `accent` `#1e40af`: the primary button, the active axis value, the current navigation item, skills a job asks for. 8.35:1 on paper. `accent-strong` `#172f86` is its hover and pressed state; `accent-soft` `#e7ecf8` is the selected filter and the focus halo.

### Neutral

- **Paper** `#fafaf8` page ground; **Surface** `#f0f0ee` alternating section bands and skeletons; **Raised** `#ffffff` fields and the drop zone.
- **Ink** `#0d0d0d` (18.6:1) primary text; **Ink 2** `#45474c` (8.9:1) secondary text; **Ink 3** `#66696e` (5.27:1 on paper, 4.83:1 on surface) metadata and placeholders.
- **Rule** `#d8d8d6` hairlines between items; **Rule strong** `#86898f` (3.36:1) field and control borders.
- **Danger** `#b42318` on **danger soft** `#fbecea` (5.73:1): errors only.

### Named Rules

**The One Accent Rule.** Cobalt marks exactly one thing per region: the action to take or the value being read. Status never introduces a second hue; it uses words and icons.

**The Words First Rule.** Every state is written: _Excellent_, _Missing_, _High severity_, _in progress_. Color and weight reinforce it, never replace it.

## Typography

Mona Sans Variable (weight 200–900, width 75–125%) for all text; Martian Mono Variable for readouts. Both are self-hosted from `src/app/fonts` through `next/font/local`.

### Hierarchy

| Role             | Size                                                                             | Weight                  | Use                               |
| ---------------- | -------------------------------------------------------------------------------- | ----------------------- | --------------------------------- |
| Specimen numeral | clamp(7.5rem, 3rem + 16vw, 17rem) hero, clamp(6rem, 4.5rem + 7vw, 9.5rem) report | 260–820, from the score | The score                         |
| Display          | clamp(2.75rem, 1.5rem + 4.4vw, 4.75rem)                                          | 460                     | Landing headline                  |
| Title            | `text-title`                                                                     | 460                     | Page and section titles           |
| Heading          | `text-heading`                                                                   | 520–540                 | Report blocks, finding lists      |
| Lead             | `text-lead`                                                                      | 400                     | Intros under titles, at most 60ch |
| Body             | 0.9375–1rem                                                                      | 400                     | Paragraphs, table cells           |
| Readout          | 0.75rem mono, uppercase, +0.04em                                                 | 400                     | Scores, weights, rule IDs, counts |

### Named Rules

**The Weight Is Data Rule.** Font weight encodes value where a value exists: the score numeral (`weightForScore`), history scores, the pipeline waterfall (240 → 800) and the current stage (700). Never vary weight for decoration elsewhere.

**The Readout Rule.** Monospace is for things that are measured or identified: `86 / 100`, `WEIGHT 20%`, `IMP-01`, `3.0 KB`, code. It is never used for prose, labels of actions, or headings.

## Layout

- Content max width 90rem with a 20 px gutter on phones and 32 px from `sm` up.
- Sections are separated by a full-width rule (ink for major breaks, `rule` for minor ones) and 80–112 px of space; alternating sections use the `surface` band.
- Section headings sit on a two-column grid on large screens: title left, lead paragraph right, aligned to the baseline end.
- Lists are ruled rows, not cards. Grids of cells (skills) draw shared hairlines with a left and top border on the container and right and bottom borders on cells.
- Tables scroll inside a focusable region on small screens; the page never scrolls horizontally.
- On phones, the skills grid folds after 16 cells behind "Show all"; the folded cells stay in the document.

## Elevation & Depth

Flat by default. Depth comes from rules and the surface band, not shadows. The only shadow is on axis knobs (`0 1px 3px rgb(13 13 13 / 0.25)`), so a knob reads as sitting on its track. Focus uses a 2 px cobalt outline, or a 3 px `accent-soft` halo on fields.

## Shapes

Corners are 2 px (`rounded-xs`) for buttons, fields, chips and the drop zone, and 4 px at most. Axis knobs and status dots are the only circles.

## Components

### Buttons

- **Primary:** cobalt fill, white label at weight 560, 44 px tall (36 px small), trailing arrow icon. Hover darkens to `accent-strong`; press scales to 0.97 over 150 ms.
- **Secondary:** 1 px ink border, ink label, `surface` fill on hover.
- **Quiet:** no border, `ink-2` label, `surface` on hover. Used for secondary actions next to a primary one.
- **Danger:** danger outline and label; appears only after an inline confirmation step.

### Inputs / Fields

`Field` wires label, optional marker, hint and error. Controls are 44 px tall on `raised` with a `rule-strong` border; focus turns the border cobalt with an `accent-soft` halo; invalid fields switch both to danger, and the error replaces the hint and is referenced by `aria-describedby`.

### Navigation

Public header: wordmark with the "Resume scoring by Folder IT" descriptor, text links, and a secondary "Analyze a resume" button. Tool header: sticky on paper with a hairline; the current section is weight 580 with a 2 px cobalt underline on the header's bottom rule.

### Score specimen (signature)

`ScoreSpecimen`: a readout line (`SCORE 86 / 100 · WGHT 742`), the numeral at the weight its score maps to, and a vertical axis with a cobalt fill and knob at the score. On first paint the weight settles from 200 and the knob rises from 0 with `@starting-style` (1.1 s, ease-out); the number itself never counts up.

### Axis meter (signature)

`AxisMeter`: label and value, an optional mono detail, and a 1 px track with a cobalt fill and knob. It is a `role="meter"` with its value; fill and knob sweep in with transforms (700 ms, staggered 60 ms) using container query units so nothing overflows.

### Glyph grid

Skills as cells: name at weight 440 (600 when filtered or matched), category and mentions as a readout. Matched job skills are cobalt; missing ones are light weight with a dashed underline and the word _Missing_.

### Pipeline waterfall

Stage names set large, gaining weight from first to last stage. In the live progress view, done stages are 480 with a check, the current stage is 700 with a pulsing cobalt dot, pending stages are 260 in `ink-3`.

### Feedback

`Notice` for inline messages (alert role for errors, status for information), `EmptyState` as a ruled band with one sentence and one action, and `Skeleton` blocks in `surface` that match the final layout.

## Do's and Don'ts

### Do:

- Do let the score, categories and pipeline carry their value in weight and position, with the number always visible.
- Do separate content with hairline rules and space.
- Do write status in words, and keep rule IDs next to every finding.
- Do animate only transform, opacity and font weight, with the strong ease-out `cubic-bezier(0.23, 1, 0.32, 1)`, and keep UI transitions at or under 300 ms except first-paint value settles.
- Do design loading, empty, error and success for every remote operation.

### Don't:

- Don't add a second accent color or color-code categories.
- Don't wrap content in cards, add drop shadows or round corners beyond 4 px.
- Don't put a small label or eyebrow above a heading.
- Don't use monospace for prose or as a "technical" costume.
- Don't count numbers up or animate anything the person triggers dozens of times.
- Don't use gradients, glass effects or decorative imagery.
