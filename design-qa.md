# Design QA — Home language portal with transparent header

## Comparison target

- Source visual truth: `design-references/home-transparent-header-full.png` with the focused header reference `design-references/home-transparent-header-crop.png`.
- Implementation desktop: `qa-home-transparent-header-desktop.png`.
- Implementation mobile: `qa-home-portal-mobile-final.png`.
- Full-view comparison: `qa-home-transparent-header-comparison.png`.
- Focused header comparison: `qa-home-transparent-header-focused.png`.
- Route and state: `/`, anonymous learner view, verification toast absent.

## Viewports and normalization

- Desktop source: 1487 × 1058 px.
- Desktop implementation: 1488 × 1058 px at a 1488 × 1058 CSS viewport.
- Mobile implementation: 390 × 844 px.
- Full comparison: source normalized by one pixel to 1488 × 1058 and placed beside the implementation without further resampling.

## Full-view comparison evidence

`qa-home-transparent-header-comparison.png` places the clarified source and the live homepage in one 2996 × 1058 image. The live build matches the reference composition: fully transparent home header, large three-line headline on the left, coral primary CTA, circular play CTA, Shanghai portal scene, floating language fragments and Himi at the lower right. The existing application rail and anonymous account state are intentionally retained because the request required all non-home product chrome and behavior to remain intact.

## Focused comparison evidence

`qa-home-transparent-header-focused.png` stacks the source header above the implementation header. The portal artwork remains visibly sharp through both headers. The implementation computes to `background: transparent`, `backdrop-filter: none`, a transparent bottom border and no box shadow, so the header does not blur or wash out the hero.

## Required fidelity surfaces

- Fonts and typography: the headline scale, dark-green weight, compact tracking and three-line wrap match the source; supporting copy and CTA hierarchy remain readable over the bright background.
- Spacing and layout rhythm: left copy, action row, portal center and Himi anchor follow the source proportions at desktop. Mobile stacks the copy above the art without horizontal overflow or document-level scroll.
- Colors and visual tokens: white, mist-blue, mint-teal and coral stay within the current Himi palette. The home topbar is fully transparent with no blur or overlay; other routes keep the existing header surface.
- Image quality and asset fidelity: the purpose-built hero contains an integrated Himi mascot, realistic Shanghai scene, light portal and floating Chinese language elements. It now ships as a responsive WebP set: 1536 × 1024 (242 KB), 2560 × 1707 (438 KB), and 3840 × 2560 (621 KB). The artwork remains transform-free, so the browser does not soften raster detail during animation.
- Copy and content: live HTML preserves “Nói tiếng Trung trong đời sống thật”, the supporting promise and both requested conversion actions; the removed continue-learning panel does not return.

## Interaction and accessibility verification

- “Bắt đầu luyện nói” links to `/practice` and “Xem lộ trình” successfully navigates to `/courses`.
- Links remain semantic, keyboard focus-visible and use live text rather than text baked into the image.
- `/courses` has no `is-home-route` class and retains its previous opaque header background and blur values.
- Desktop and mobile have no document-level horizontal or vertical overflow on the homepage.
- At the 1790 × 868 regression viewport, the hero reports the direct asset URL, `naturalWidth: 1536`, and `transform: none`; `qa-home-hero-sharp-comparison.png` records the before/after clarity change.
- Responsive-source verification: the browser selects `himi-language-portal-hero-2k.webp` at a 2560 px viewport and `himi-language-portal-hero-4k.webp` at a 4000 px viewport instead of downloading 4K for every device.
- Browser console warnings/errors checked after navigation: none.

## Findings and comparison history

- Iteration 1: the generated hero was missing several floating language fragments visible in the source. A second asset pass added the surrounding pinyin/Chinese bubbles while preserving the portal and mascot crop.
- Iteration 1 mobile: the shared shell reserved 92 px beneath the fixed mobile navigation, creating an unnecessary white scroll area. The home-only shell override removes that padding and keeps the final document at exactly 390 × 844.
- Iteration 2: the first implementation interpreted “mờ” as a translucent glass effect, which softened the artwork beneath the topbar. The clarified reference required no blur at all. The home-only topbar now removes its background, backdrop filter, border and shadow; the focused post-fix comparison shows the portal artwork remaining clear through the header.
- Iteration 3: the supplied browser capture exposed a second independent blur source. The image component served only a 640 × 427 optimized derivative and enlarged it to the hero, while the ambient motion applied a continuously changing fractional scale/translation. The implementation now serves the original 1536 × 1024 PNG and removes the raster transform. The post-fix wide capture makes the two people, skyline, language bubbles and Himi visibly sharper.
- Iteration 4: the hero was optimized for 2K/4K displays with Lanczos upscaling, restrained sharpening, high-quality WebP encoding and a width-descriptor `srcset`. Browser checks confirm that each large viewport receives the appropriate asset while smaller screens retain the lightweight 1536 px version.
- Final comparison: no actionable P0, P1 or P2 differences remain. The signed-in avatar/data shown in the concept is intentionally replaced by the app's real anonymous state.

## Implementation checklist

- [x] Apply a fully transparent, non-blurred header only to `/`.
- [x] Load the full-resolution hero directly and keep the raster layer transform-free.
- [x] Provide responsive 1536, 2K and 4K WebP sources and verify automatic browser selection.
- [x] Preserve navigation and styles on every other route.
- [x] Build the selected option 2 hero without a continue-learning panel.
- [x] Verify desktop and mobile layouts, CTA navigation and console output.
- [x] Run the full automated test suite and production build.

final result: passed

---

# Design QA — Career-route banner with animated Himi

## Comparison target

- Banner source visual truth: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-4824ef9e-ce14-467e-8ddb-64926f1fc3d1.png`.
- Current Himi identity source: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-b7ea609b-e089-4a60-b146-173993736e9f.png`.
- Implementation desktop: `design-qa-course-current-himi-desktop.png`.
- Implementation mobile: `design-qa-course-current-himi-mobile.png`.
- Current-Himi focused comparison: `design-qa-course-current-himi-comparison.png`.
- Full banner comparison: `design-qa-course-banner-comparison.png`.
- Route and state: `/courses`, anonymous learner, empty search, “Tất cả” filter active.

## Viewports and normalization

- Source: 1054 × 262 px.
- Desktop implementation: 1440 × 1024 px from a 1152 × 819 CSS viewport at the browser's 1.25 capture density.
- Mobile implementation: 488 × 1055 px from a 390 × 844 CSS viewport at the same density.
- Comparison image: source normalized to 1180 × 293 px; implementation banner cropped to 1180 × 320 px; both stacked without further resampling.

## Full-view comparison evidence

`design-qa-course-banner-comparison.png` places the supplied banner above the live implementation. The implementation preserves the white-left/editorial-copy and career-scene-right composition, dark-teal headline, light cyan energy treatment and large Himi focus. The three workplace selector boxes are intentionally absent, exactly as requested; the catalog search and filters remain below the hero as existing product controls. `design-qa-course-current-himi-comparison.png` separately verifies the corrected mascot against the user's current Himi reference.

## Focused comparison evidence

The focused stacked comparison confirms the current scarf-and-mission-board Himi identity rather than the retired school-character asset. Two live browser captures taken 650 ms apart changed 41,363 of 144,000 pixels in the mascot region (28.7%), confirming that the transparent Himi GIF is actually animating rather than displaying a static first frame.

## Required fidelity surfaces

- Fonts and typography: existing Himi font stack is retained; the headline keeps the source's compact heavy dark-teal hierarchy and two-line desktop wrap. Mobile reflows to four readable lines.
- Spacing and layout rhythm: the desktop banner keeps the source's wide panoramic proportion and rounded frame. Mobile separates the text with a quiet white reading surface while leaving the workplace art and mascot visible.
- Colors and visual tokens: white, ice blue, mint, teal and restrained coral align with the current bright Himi product palette.
- Image quality and asset fidelity: the environment backdrop is a purpose-built 2048 × 512 WebP. Himi uses a new purpose-built 560 × 560 transparent GIF with 32 frames over 3.2 seconds; a dedicated sharp PNG of the same current model is substituted for reduced-motion users.
- Copy and content: the headline matches the selected direction. Supporting copy no longer promises goal-box selection and now accurately introduces the industry-route catalog.

## Interaction and accessibility verification

- “Văn phòng” filtering reduces the catalog to the matching route and “Tất cả” restores the full catalog.
- Searching for “logistics” shows the logistics route and removes unrelated course headings; clearing restores seven routes.
- The banner remains a semantic labelled header with live HTML text; the mascot and backdrop are decorative.
- Reduced-motion CSS replaces the GIF with a static Himi PNG.
- The live `/courses` render returns HTTP 200 with no visible framework error overlay; targeted ESLint passes.

## Findings and comparison history

- Iteration 1: desktop heading wrapped into three lines because the first line exceeded the copy track. The final CSS preserves the source's intended two-line desktop wrap and releases it at the tablet breakpoint.
- Iteration 1 mobile: the panoramic crop placed detailed machinery directly behind the supporting copy. A compact white reading surface restored contrast without hiding the lower workplace scene or Himi.
- Iteration 2: the first animation reused the retired Himi school GIF. After the user supplied the current model, it was replaced with a newly generated base pose and waving pose that preserve the red-orange scarf, wink, soft 3D finish and mission board.
- Final comparison: no actionable P0, P1 or P2 differences remain. The removed selector boxes are intentional; the current Himi and mission board are now preserved in both animated and reduced-motion states.

## Follow-up polish

- P3: a future dedicated vertical workplace backdrop could reduce the amount of factory detail behind the mobile text, but the current responsive treatment is clear and usable.

## Implementation checklist

- [x] Remove the three workplace selector boxes from the banner.
- [x] Add a crisp office, factory and logistics panorama.
- [x] Replace the retired Himi animation with the current scarf-and-mission-board model.
- [x] Overlay a genuinely animated transparent Himi GIF.
- [x] Provide a reduced-motion static fallback.
- [x] Verify desktop, mobile, filtering and search.

final result: passed

---

# Design QA — Himi Original video learning room

## Comparison target

- Source visual truth: `qa-himi-learning-source-youtube-room.png` — the existing interactive room used by the five YouTube lessons, explicitly requested as the product pattern.
- Supporting source: `design-references/himi-original-video-cards-source.png` — the three Himi Original cards selected by the user.
- Implementation desktop: `qa-himi-learning-room-desktop.png`.
- Implementation mobile: `qa-himi-learning-room-mobile.png`.
- Full-view comparison: `qa-himi-learning-room-comparison.png`.
- Focused room comparison: `qa-himi-learning-room-focused-comparison.png`.

## Viewports and normalization

- Desktop source: 1587 × 893 px.
- Desktop implementation: 1587 × 893 px.
- Desktop state: default learning room, transcript visible, pinyin and Vietnamese translation visible, video not covered, typing mode off.
- Mobile implementation: 488 × 1055 px at the narrow in-app Browser breakpoint.
- Device density: browser-native captures; source and desktop implementation have equal pixel dimensions, so no resampling was used for the desktop comparison.

## Full-view comparison evidence

The side-by-side comparison shows the Himi room reuses the YouTube room's layout tracks, title hierarchy, metadata pills, video ratio, tool strip, learning switches, shadowing card, transcript header, transcript cards, radii, palette and responsive behavior. The only intended differences are the video asset, lesson title, metadata and transcript length.

## Focused comparison evidence

The focused crop confirms that the video frame and transcript panel preserve the same proportions and alignment. Tool buttons, pinyin/translation controls and the active transcript treatment match the existing product pattern. The Himi poster remains sharp and correctly cropped inside the native HTML5 player.

## Required fidelity surfaces

- Fonts and typography: existing Himi font stack, weights, line heights and hierarchy are inherited unchanged from the YouTube learning room; Chinese, pinyin and Vietnamese remain visually distinct and readable.
- Spacing and layout rhythm: desktop uses the same two-column studio grid and responsive breakpoints; mobile stacks the room without horizontal overflow and keeps the bottom navigation reachable.
- Colors and visual tokens: the shared teal, coral, cream, border and semantic state tokens remain identical to the existing room.
- Image quality and asset fidelity: all three supplied Himi MP4/poster pairs load successfully; related thumbnails were switched to their direct assets and verified complete in the browser.
- Copy and content: all three Himi titles, levels, categories, durations and three synchronized transcript lines match `lib/video-library.ts`.

## Interaction and accessibility verification

- All three Himi routes render `.youtube-study-studio.is-himi-source` with three transcript lines.
- Each MP4 reports `readyState: 4` and a duration of about 60.05 seconds.
- Clicking transcript line 2 seeks the local video to about 16.8 seconds and starts playback.
- Typing mode opens the dictation panel and preserves `scrollY: 0`.
- Pinyin, translation, transcript, cover-video, replay, repeat, auto-pause and large-video controls keep accessible labels and pressed states.
- Narrow layout has no document-level horizontal overflow.
- Browser console errors checked: none.

## Findings

- No actionable P0, P1 or P2 differences remain.

## Comparison history

- Initial implementation connected the local Himi player to the shared learning controller and exposed the full room only on standalone video routes.
- Final pass verified the three routes, direct transcript seeking, dictation state, desktop composition, mobile stacking and console output. No P0/P1/P2 fix loop was required after the final visual comparison.

## Follow-up polish

- P3: the transcript panel intentionally keeps the same height as long YouTube lessons, so three-line Himi lessons have more empty space. This preserves cross-library consistency and does not affect use.

## Implementation checklist

- [x] Reuse one interaction model for YouTube and Himi sources.
- [x] Keep compact lesson-embedded Himi videos unchanged.
- [x] Verify all three Himi Original routes.
- [x] Verify desktop and narrow responsive layouts.
- [x] Run TypeScript, ESLint and the complete automated test suite.

final result: passed

---

# Design QA — Six Himi industry covers

## Comparison target

- Source visual truth: `public/assets/courses/himi-concepts/` — the six approved Himi course-cover images.
- Implementation desktop: `design-qa-course-himi-desktop.png`.
- Implementation mobile: `design-qa-course-himi-mobile.png`.
- Focused source/implementation comparison: `design-qa-course-himi-comparison.png`.
- Route and state: `/courses`, all filters reset, anonymous learner view.

## Viewports and normalization

- Source assets: 2098–2103 × 748–750 px, panoramic ratio approximately 2.8:1.
- Desktop implementation capture: 2484 × 2306 px; browser CSS canvas 1987 px wide; browser-native density approximately 1.25.
- Desktop cover slot: 378 × 166 CSS px for each card.
- Mobile implementation capture: 594 × 4476 px; browser CSS canvas 475 px wide; browser-native density approximately 1.25.
- Mobile card width: 451 CSS px with no document-level horizontal overflow.

## Full-view comparison evidence

The desktop and mobile captures show all six Himi covers in the correct course order. The existing seventh “Giao tiếp công sở cốt lõi” course intentionally retains its original image. All six generated files load at their full natural dimensions after lazy loading is triggered.

## Focused comparison evidence

`design-qa-course-himi-comparison.png` places the six source assets and the rendered course grid in one comparison image. Himi’s face and role-specific action remain visible in each crop. The “Cơ bản” badge and Chinese character overlays remain legible without covering the mascot’s face or primary work prop.

## Required fidelity surfaces

- Fonts and typography: unchanged; course titles, Chinese subtitles and metadata retain the existing Himi type hierarchy.
- Spacing and layout rhythm: unchanged; three-column desktop and single-column mobile cards preserve existing widths, radii, gaps and content height.
- Colors and visual tokens: unchanged; the new covers add warm cream, sage, teal and coral while keeping the product’s white canvas and green UI tokens.
- Image quality and asset fidelity: all six images report complete with natural dimensions above 2098 × 748 px; no stretching, missing assets or placeholder states remain after normal lazy loading.
- Copy and content: accessible alt text now describes Himi’s distinct task in each of the six industries.

## Interaction and accessibility verification

- The “Văn phòng” filter reduces the course grid from seven cards to the correct one card, and “Tất cả” restores all seven.
- `/courses`, `/practice` and `/` load without a framework error overlay.
- Browser console warnings/errors checked on the course and practice routes: none.
- Desktop and mobile layouts have no document-level horizontal overflow.

## Findings

- No actionable P0, P1 or P2 differences remain.

## Comparison history

- Initial implementation replaced the six shared course mappings and the corresponding practice-industry mappings.
- First mobile full-page capture showed lazy-image placeholders below the fold; after scrolling through the normal page flow, all six Himi files loaded successfully. This was expected browser lazy loading, not a product defect.
- Final comparison confirmed correct crop, overlay clearance, image order and responsive behavior. No visual fix loop was required.

## Follow-up polish

- None required for this replacement pass.

## Implementation checklist

- [x] Map six approved Himi covers to six matching course slugs.
- [x] Reuse the same six covers in the practice industry mapping.
- [x] Preserve the seventh workplace-communication cover.
- [x] Verify desktop and mobile crops, filtering, lazy loading and console output.

final result: passed
