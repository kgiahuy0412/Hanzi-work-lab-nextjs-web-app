# Design QA — HanziWork direction 3

## Source of truth

- Selected direction: `docs/design-target/selected-option-3.png`
- Same-frame comparison: `docs/design-qa/comparison-source-vs-build.png`
- Desktop verification: 1440 × 1024 class viewport
- Mobile verification: 390 × 844 class viewport

## Fidelity review

The implementation preserves the selected concept's narrow learning rail, quiet cream workspace, pine/mint palette, large “today's lesson” module, review queue, weekly rhythm card, and a single dominant start action. The mobile adaptation intentionally replaces the rail and right column with one reading column and a fixed four-item bottom navigation.

Intentional differences:

- The learner name and demo lesson copy use the project owner's Vietnamese prototype data.
- Audio controls are visibly unavailable instead of simulating playback because audio files do not exist yet.
- The implemented lesson card is slightly taller to keep Vietnamese and Chinese content readable at 390 px.

## Route checks

| Route | Desktop | Mobile | Interaction |
| --- | --- | --- | --- |
| `/` | Passed | Passed | Primary lesson CTA and navigation targets present |
| `/courses` | Passed | Passed | Search and filter chips work; active state has `aria-pressed` |
| `/learn/van-phong-hanh-chinh` | Passed | Passed | Tabs work; unavailable audio is disabled and labelled |
| `/practice` | Passed | Passed | Rating actions stay disabled until the card is revealed |
| `/vip` | Passed | Passed | Prototype CTA states that it opens the purchase process |
| `/admin` | Passed | Passed | Tables scroll safely on narrow screens |

## Severity audit

- P0: none.
- P1: none.
- P2: none remaining after responsive and interaction fixes.

## Automated verification

- ESLint: passed.
- TypeScript `--noEmit`: passed.
- Rendered HTML tests: 3/3 passed.
- Production build: passed.
- Browser interaction smoke test: practice flip → self-rating → next card passed.

final result: passed
