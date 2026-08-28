# Listening Lesson Design QA

## Evidence

- Source visual truth: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-94218c96-d1e4-4989-90d8-b0dc94cf6d2a.png`
- Browser-rendered implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/artifacts/listening-session-desktop.png`
- Normalized side-by-side comparison: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/artifacts/listening-session-comparison.png`
- Desktop catalog evidence: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/artifacts/listening-catalog-desktop.png`
- Mobile catalog evidence: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/artifacts/listening-catalog-mobile.png`
- Mobile session evidence: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/artifacts/listening-session-mobile.png`

## Normalization

- Source pixels: 1176 × 729.
- Desktop browser viewport: 1276 × 920 CSS pixels at device scale factor 1.
- Captured implementation session region: 958 × 612 pixels/CSS pixels.
- Comparison density: both images normalized to 729 pixels high while preserving aspect ratio; source is shown on the left and implementation on the right.
- State: HSK 1, lesson 1, question 1/10, score 0, normal speed, no answer selected.

## Full-view comparison

The complete session card is visible in both images. The implementation preserves the reference hierarchy and composition: back control and lesson title at top left, counter and score at top right, thin coral progress line, centered instruction, circular teal replay control with a coral waveform icon, speed control, and a two-by-two answer grid. The implementation intentionally displays the selected lesson title (`Từ vựng cơ bản`) rather than the generic exercise name because the new catalog flow requires lesson identity.

## Focused-region comparison

A separate crop was not needed because the normalized comparison already isolates the complete session card at a scale where header typography, progress, audio controls, answer labels, borders, radii, and spacing are readable. The mobile captures separately validate responsive behavior.

## Required fidelity surfaces

- Fonts and typography: the application’s existing font family and weights remain consistent with the HiMi shell; hierarchy, line height, and compact UI labels closely match the reference.
- Spacing and layout rhythm: header alignment, central audio stage, answer grid, radii, and vertical rhythm match the reference proportions. The desktop card is narrower because it sits inside the existing learner sidebar shell, which is an intentional product constraint.
- Colors and visual tokens: deep teal, coral progress/waveform, pale teal borders, white surface, and subtle green shadow match the source palette.
- Image and icon fidelity: the session contains no raster illustration in the reference. Controls use the existing Lucide icon library, including a real waveform icon; there are no handcrafted SVGs, emoji, placeholder assets, or CSS-drawn icons.
- Copy and content: the instructional and control copy matches the Vietnamese reference. Lesson-specific title and randomized HSK vocabulary are intentional functional additions.

## Interaction and responsive checks

- Selecting HSK 4 updates the catalog to four HSK 4 lessons without changing route.
- Selecting lesson 2 opens `HSK 4 · Giao tiếp hằng ngày` with ten questions and four answer choices.
- Wrong-answer feedback appears with an icon, the correct word, pinyin, meaning, and a learner-paced next action.
- Advancing updates the counter to question 2/10.
- Returning keeps the selected HSK group and displays four lessons.
- Desktop console check reported no warnings or errors.
- At 390 × 844, level cards use two columns, lessons use one column, answers use one column, the waveform remains inside the card, and the page remains scrollable above the persistent mobile navigation.
- Progress exposes `role="progressbar"`, its bounds, and the current numeric value.

## Comparison history

### Iteration 1

- Finding: [P2] Opening a lesson after scrolling to the catalog retained the previous scroll offset, clipping the session header beneath the fixed top bar.
- Fix: added a view-change scroll synchronization that resets non-catalog views to the top of the page.
- Post-fix evidence: `artifacts/listening-session-desktop.png` shows the complete card with a clear top margin; browser measurement reported `scrollY: 0` and the session surface beginning below the header.

### Iteration 2

- Finding: no remaining P0, P1, or P2 differences. The initial comparison included a pointer-hover tint on one answer, so the pointer was moved outside the component and the neutral state was recaptured for accurate comparison.
- Post-fix evidence: `artifacts/listening-session-comparison.png` shows all four answer cards in their neutral state.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] The implementation’s lesson title is slightly longer than the generic reference title; this is intentional and may wrap sooner for future long lesson names.

final result: passed
