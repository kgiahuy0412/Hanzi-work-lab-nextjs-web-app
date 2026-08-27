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

---

# Design QA — Learner sidebar Pro card

- Source visual truth: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-311b189c-ca72-4a37-a395-67e0f16a7fa6.png`
- Expanded implementation evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-pro-expanded.png`
- Focused card evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-pro-card.png`
- Collapsed implementation evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-pro-collapsed.png`
- Revised menu evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-pro-no-vip-menu.png`
- Browser: Codex in-app browser
- CSS viewport: 1280 × 720; device scale factor: 1
- Source pixels: 1367 × 1150
- Expanded and collapsed implementation pixels: 1280 × 720
- Focused implementation pixels and CSS size: 191 × 185 pixels at 191.2 × 185.3 CSS px
- Density normalization: the source is a large standalone promotional card, while the implementation is its compact sidebar adaptation. Comparison therefore evaluates hierarchy, proportions, palette, icon treatment, copy, and CTA emphasis within the sidebar's 191 px content width.
- State: anonymous learner home page with the desktop rail expanded, then collapsed.

## Full-view comparison evidence

The source and focused browser capture were opened together in the same comparison input. The implementation retains the supplied card's airy mint surface, circular teal crown badge, dark heading with a teal “Pro” accent, centered support copy, and strong teal CTA with a sparkle and white arrow control. The full 1280 × 720 capture confirms that the card is anchored 20 px above the bottom of the expanded rail and does not obstruct the scrollable navigation.

## Focused region comparison evidence

The visual target is itself a single card, so the 191 × 185 element crop is the focused comparison. At the smallest tested desktop height of 720 px, the card remains fully visible with intact rounded corners, centered copy, and an unbroken CTA row.

## Required fidelity surfaces

- Fonts and typography: existing Himi sans-serif typography is retained; the compact heading, high-weight teal “Pro” accent, centered support copy, and uppercase CTA preserve the reference hierarchy without clipping.
- Spacing and layout rhythm: the card measures 191.2 × 185.3 CSS px, fills the expanded rail's available inner width, and sits at the rail bottom through `margin-top: auto`.
- Colors and visual tokens: a pale mint surface, teal badge/action, dark green heading, restrained border, and soft elevation map the reference palette to the existing learner navigation tokens.
- Image quality and asset fidelity: the crown, sparkle, and arrow use the project's existing icon library at native vector quality. No placeholder, emoji, handcrafted SVG, CSS drawing, or raster approximation was introduced.
- Copy and content: “Nâng cấp Pro”, the unlimited-learning benefit, and “Nâng cấp ngay” remain visible and readable within the compact card.
- Accessibility: the whole card is one keyboard-native link with a descriptive accessible name and a visible focus treatment.

## Comparison history

### Initial pass

- No actionable P0, P1, or P2 mismatch was found after comparing the source and focused implementation crop. The shorter support copy and reduced scale are intentional adaptations to the fixed 216 px expanded sidebar.

### Annotation pass — remove duplicate VIP menu entry

- Finding [P2, hierarchy]: the desktop rail repeated the VIP destination as both a standard menu item and the larger Pro upgrade card.
- Fix: remove the standard desktop VIP item while preserving the Pro card CTA and the separate mobile VIP navigation item.
- Post-fix evidence: the desktop rail labels are Học tập, Lộ trình, Luyện tập, Luyện ca, Trò chơi, and Đăng nhập; the Pro card remains visible and links to `/vip`.

## Findings

No actionable P0, P1, or P2 differences remain. Small type-size and density differences are required by the sidebar constraint and are classified as acceptable P3 variance.

## Primary interactions tested

- The card CTA navigates from `/` to `/vip`.
- Collapsing the rail changes it to 72 px and makes the Pro card non-visible with no reserved space.
- Expanding the rail restores the card at the bottom.
- Targeted Pro-card test passes; lint and production build pass.
- Full repository tests retain five unrelated pre-existing content expectation failures.
- Browser console contains the existing `ReviewHomeStudio` reduced-motion hydration mismatch; no card-originated error or warning was observed.

final result: passed

---

# Design QA — Route progress at viewport top

- Source visual truth: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-855a19ad-24b4-4170-8e3a-565ee2599225.png`
- Source header context: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-da051f0e-4f1f-4b8b-ba34-63c286396d8f.png`
- Rendered active-state evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-route-progress-top-active.png`
- Browser: Codex in-app browser
- Desktop CSS viewport: 906 × 706; captured region: 906 × 100; device scale factor: 1
- Mobile CSS viewport checked: 390 × 844; device scale factor: 1
- Source pixels: progress crop 1666 × 28; header crop 1920 × 100
- Implementation pixels: 906 × 100
- Density normalization: the reference and implementation use different viewport widths, so the comparison evaluates the requested invariant—the 4 px progress rail is fixed at `y = 0` and spans the complete viewport from `x = 0`—rather than equating horizontal animation length at different timestamps.
- State: authenticated learner navigation during the early active phase of a menu route transition.

## Full-view comparison evidence

The supplied progress crop, supplied header crop, and rendered active-state header were opened together in one comparison input. The implementation places the red route-progress rail on the absolute top edge of the viewport, above both the sidebar and header, while preserving the reference composition.

## Focused region comparison evidence

The target is itself a focused top-header region, so no additional crop was needed. Browser geometry reports `top = 0`, `left = 0`, and full viewport width with the desktop sidebar both expanded and collapsed. At the 390 px mobile viewport it also reports `top = 0`, `left = 0`, `height = 4`, and `position = fixed`.

## Required fidelity surfaces

- Fonts and typography: unchanged; the existing Inter typography and header hierarchy are preserved.
- Spacing and layout rhythm: the progress rail is fixed to the complete viewport at `top = 0`, `right = 0`, and `left = 0`, independent of sidebar width.
- Colors and visual tokens: the existing warm Himi red gradient, opacity treatment, glow, and 4 px thickness are preserved.
- Image quality and assets: no imagery or brand assets were changed.
- Copy and content: no text or navigation labels were changed.

## Comparison history

### Iteration 1

- Finding [P2, placement]: during desktop navigation, browser geometry placed the progress rail at `y = 85px`, aligned to the bottom of the header rather than the viewport top. Mobile CSS separately overrode it to `y = 66px`.
- Fix: set the shared progress rule to `top: 0` and remove the obsolete mobile top override, leaving the existing responsive left offset and animation untouched.
- Post-fix evidence: desktop menu navigation reports `top = 0` and `left = 204`; mobile menu navigation reports `top = 0` and `left = 0`. The active-state screenshot visibly places the red segment on the first pixel row above the header.

### Iteration 2

- Finding [P2, coverage]: the desktop rail still offset the progress element by the current sidebar width, leaving the top edge above the sidebar uncovered.
- Fix: override learner progress placement with `left: 0`, keeping `top: 0`, the maximum z-index, and the existing animation.
- Post-fix evidence: browser geometry reports `left = 0` and full viewport width with the sidebar expanded and collapsed. The revised active-state screenshot visibly carries the red line across the sidebar and header.

## Findings

No actionable P0, P1, or P2 differences remain for the requested progress-bar placement. The shorter visible red segment in the implementation screenshot is the early phase of the existing progress animation, not a layout mismatch.

## Primary interactions tested

- Desktop menu navigation from “Lộ trình” to “Học tập”.
- Mobile menu navigation from “Hôm nay” to “Lộ trình”.
- Progress geometry remains fixed at the viewport top at both breakpoints.
- Progress starts at the left viewport edge on desktop and mobile, including above the sidebar.
- Browser console checked after navigation: no warnings or errors.
- Relevant learner-navigation tests pass (2/2), lint passes, and the production build passes.
- The full repository test run remains red on five unrelated, pre-existing content expectation tests; none exercise the route-progress CSS.

final result: passed

---

# Design QA — Learner sidebar

- Source visual truth: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-03549a43-f7f4-4ba4-a27e-dbb9e31822c0.png`
- Expanded implementation evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-expanded.png`
- Collapsed implementation evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-collapsed.png`
- Full combined comparison: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-reference-comparison.png`
- Focused combined comparison: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-focused-comparison.png`
- Toggle-position sources: `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-f53824ad-f1eb-4b4b-9f1e-ecbde9e92af7.png` and `C:\Users\DELL\AppData\Local\Temp\codex-clipboard-5b810cc8-434c-4609-9610-3936a7fcb2cf.png`
- Toggle-position implementation evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-toggle-expanded.png` and `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-toggle-collapsed.png`
- Toggle-position combined comparison: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-toggle-comparison.png`
- Animation end-state evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-animation-expanded.png` and `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-animation-collapsed.png`
- Final toggle alignment evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-toggle-aligned.png`
- Practice-menu open evidence: `D:\Code\HiMi\Hanzi-work-lab-nextjs-web-app\qa-sidebar-practice-menu-open.png`
- Browser: Codex in-app browser
- CSS viewport: 1280 × 800; source image: 347 × 497
- State: authenticated learner home page with the admin navigation item visible
- Density normalization: the browser capture renders CSS geometry at 0.8 image pixels, so implementation crops were scaled by 1.25 before being placed beside the reference states.

## Full-view comparison evidence

The supplied image and both rendered sidebar states were placed in the same comparison canvas. The expanded rail matches the reference's 216 px width, white surface, compact Himi brand row, mint active item, teal selection marker, seven-item navigation rhythm, and black circular edge toggle. The collapsed rail matches the 72 px icon-only state while keeping the logo, active state, and toggle visible.

## Focused comparison evidence

The combined top-region comparison confirms the logo scale, wordmark baseline, active-row height, teal marker, icon alignment, label density, and toggle placement. Final browser geometry measured 216 × 800 for the expanded rail, 72 × 800 for the collapsed rail, 48 × 48 for the expanded logo, 42 × 42 for the collapsed logo, 179.2 × 44 for the active row, and 26 × 26 for the toggle.

## Comparison history

### Iteration 1

- Finding [P2, structure]: the existing desktop navigation began collapsed, kept a duplicate brand in the top bar, and included a lower support action not present in the reference.
- Fix: make the desktop rail expanded by default, hide the duplicate desktop top-bar brand, remove the support row, and persist the user's expanded/collapsed preference.
- Post-fix evidence: reload retains the selected rail state and both reference states are reproducible through the edge toggle.

### Iteration 2

- Finding [P2, alignment]: the first comparison placed the expanded navigation row 5–6 px too far left relative to the reference.
- Fix: rebalance the expanded navigation padding to 9 px left and 3 px right while retaining the reference row width.
- Post-fix evidence: the active row begins at x = 21 px with a width of 179.2 px; the source begins at approximately x = 23 px with a width of approximately 180 px.

### Iteration 3

- Finding [P2, state consistency]: the edge toggle used `top: 36px` while expanded but `top: 24px` while collapsed, causing a visible vertical jump during the rail transition.
- Fix: define `top: 24px` once on the shared `.rail-toggle` rule and remove the collapsed-only position override.
- Post-fix evidence: browser geometry reports `top = 24px` and a 26 × 26 px control in both expanded and collapsed states at the annotated 907 × 542 viewport. The combined focused comparison shows no remaining state-dependent vertical shift.

### Iteration 4

- Finding [P2, interaction polish]: rail width moved, but state-specific layout switches made the logo, labels, navigation rows, chevron, and toggle icon appear to snap between endpoints.
- Fix: synchronize structural transitions with a 360 ms shared easing curve, keep grid structures compatible across states, fade and clip labels instead of absolutely repositioning them, and rotate one persistent toggle icon. Reduced-motion mode retains a brief 180 ms spatial transition and 120 ms content transition.
- Post-fix evidence: browser-computed styles report 360 ms in normal CSS and 180 ms in the active reduced-motion environment; expanded and collapsed captures retain the approved endpoint geometry, including the shared 24 px toggle position.

### Iteration 5

- Finding [P2, alignment]: the shared toggle position prevented state-to-state jumping, but its center remained 5 px above the Himi logo and wordmark center (`37px` versus `42px`).
- Fix: move the shared toggle top position from 24 px to 29 px without adding state-specific overrides.
- Post-fix evidence: browser geometry at the annotated 1158 × 706 viewport reports `centerY = 42px` for the toggle, brand row, logo, and wordmark in both expanded and collapsed states.

### Iteration 6

- Finding [P2, interaction state]: opening “Luyện tập” did not mark its trigger active, and clicking it again set `aria-expanded=false` while `:focus-within` kept the submenu visibly open.
- Fix: derive the trigger's active state from the current practice route or `practiceMenuOpen`; make submenu visibility and chevron rotation depend only on `.is-open`; remove the practice-trigger hover styling and hover/focus submenu activation.
- Post-fix evidence: first click reports `aria-expanded=true`, `active=true`, `is-open=true`, and a visible 145 px submenu. Second click reports `aria-expanded=false`, `active=false`, `is-open=false`, `visibility=hidden`, and the collapsed 2 px container.

## Findings

No actionable P0, P1, or P2 sidebar differences remain. Small anti-aliasing and capture-density differences are non-functional P3 variance.

## Primary interactions tested

- Expanded/collapsed edge toggle and `aria-expanded` state.
- Toggle top position remains exactly 29 px in both states; its center matches the Himi brand row at 42 px.
- Rail width, main-content offset, brand, navigation rows, labels, chevron, and toggle icon transition as one coordinated sequence.
- “Luyện tập” opens and becomes active on click, closes on the next click, and no longer opens or highlights through hover.
- Expanded/collapsed preference persists after reload.
- Collapsed “Luyện tập” action expands the rail and opens its submenu.
- “Lộ trình” navigates to `/courses`.
- Existing mobile navigation remains present.
- Targeted learner-navigation test, component lint, production build, and diff whitespace check pass.
- Browser console: no sidebar-originated errors. The home page still emits an existing reduced-motion hydration mismatch in `ReviewHomeStudio`; it is outside this sidebar change.

final result: passed
