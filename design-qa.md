# Design QA — Admin console redesign

- Source visual truth: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-6856b9f3-0c8c-4966-a626-9db090ae3b45.png`
- Rendered desktop evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\artifacts\admin-redesign-dashboard-final.png`
- Rendered mobile evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\artifacts\admin-redesign-dashboard-mobile-final.png`
- Combined comparison: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\artifacts\admin-redesign-comparison.png`
- State: authenticated admin dashboard with live repository data
- Browser: Codex in-app browser
- Desktop CSS viewport: 1800 × 1187, device scale factor 0.8
- Mobile CSS viewport used for responsive inspection: 487 × 1055, device scale factor 0.8
- Source pixels: 833 × 625
- Desktop implementation pixels: 2250 × 1484
- Mobile implementation pixels: 609 × 2813
- Density normalization: the reference is a downscaled marketing-style desktop mock. The comparison therefore evaluates proportional information density, sidebar/content split, KPI strip, table rhythm, and surface treatment instead of equating raw source pixels to CSS pixels.

## Full-view comparison evidence

The combined comparison places the supplied CRM reference and the rendered admin dashboard in one view. Both use a persistent left navigation rail, a restrained white/soft-gray palette, a segmented metric row, dense tabular content, thin dividers, compact typography, and a single warm accent color. The implementation retains Himi branding and maps the visual hierarchy to the product's real concepts: users, VIP access, published lessons, learning paths, workflow stages, and audit events.

## Focused region comparison evidence

The top navigation, KPI strip, course table, and workflow panel were inspected at full resolution. Icon stroke weight and alignment are consistent through the existing icon library; KPI values, column headers, state chips, and row separators remain readable without decorative substitutes. At the mobile breakpoint, the navigation becomes a horizontal icon rail, KPI cells stack, content panels become one column, and the course table scrolls inside its panel. Geometry inspection confirmed a 487 px viewport with no page-level horizontal overflow; the table's 540 px width is contained by its own 449 px horizontal scroller.

## Required fidelity surfaces

- Fonts and typography: the existing sans-serif stack is retained with a compact CRM scale. Eyebrows, page headings, metric labels, values, table headers, and supporting copy have distinct weights and line heights without clipping.
- Spacing and layout: the 234 px desktop sidebar, 112 px top bar, four-part KPI strip, two-column operations grid, and dense 50 px table rows follow the reference hierarchy. Panels use subtle 1 px borders and minimal shadow.
- Colors and tokens: white surfaces and neutral gray dividers dominate; Himi orange is limited to selection, icon accents, and key actions. Published status remains semantic green.
- Content and data: every existing admin data surface remains present. Dashboard values render from the current database: 7 users, 0 active VIP memberships, 168 published lessons, and 7 learning paths.
- Icons and assets: Himi's existing real brand image is used. Interface icons come from the existing icon library rather than CSS drawings, emoji, or inline SVG approximations.
- Accessibility: navigation exposes `aria-current`, forms retain their labels and semantic controls, links/buttons remain keyboard-native, and mobile controls keep practical tap targets. No new motion was introduced.

## Comparison history

### Iteration 1

- Finding [P2, responsiveness]: at 487 px CSS width, table min-content sizing expanded the grid track to 542.5 px and caused page-level horizontal overflow (`document.scrollWidth = 555`).
- Fix: set admin grid children and panels to `min-width: 0`; contain the 540 px table in a dedicated horizontal scroller with bounded width and inline overscroll containment.
- Post-fix evidence: page-level `scrollWidth` is 475–487 px, both panels are 451 px wide, the second panel starts below the first, and the table alone reports `scrollWidth = 540` inside a 449 px scroller.

### Iteration 2

- Finding [P2, regression coverage]: the rendered HTML test expected the subscriptions link inside `admin-console.tsx`, but navigation was intentionally extracted into `admin-navigation.tsx` for active-route behavior.
- Fix: update the test to inspect both the shell and navigation component while preserving the original assertion that `/admin/subscriptions` is rendered by the admin UI.
- Post-fix evidence: 92/92 tests pass.

## Findings

No actionable P0, P1, or P2 differences remain. The implementation intentionally preserves Himi terminology, real data, and existing admin workflows instead of copying the reference's lead-management content.

## Primary interactions tested

- Sidebar link navigation from dashboard to `/admin/courses`.
- Active-route state updates to “Lộ trình & bài học”.
- Existing course form remains rendered with 10 inputs, 1 select, 1 textarea, 11 labels, and its submit control.
- Dashboard renders all 7 course rows, four KPI values, workflow stages, and six audit events.
- Desktop has no horizontal overflow.
- Mobile page has no horizontal overflow; the dense table remains independently scrollable.
- Browser console checked after navigation: no warnings or errors.
- Automated verification: tests, lint, production build, and diff whitespace check.

final result: passed
