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

# Design QA — Listening immersive banner

## Comparison target

- Source visual truth: `design-qa-course-mascot-lowered-banner.png`, the approved Himi panoramic banner family.
- Generated background asset: `public/assets/backgrounds/himi-listening-hero-2k.webp`.
- Implementation desktop: `design-qa-listening-banner-new.png`.
- Focused implementation crop: `design-qa-listening-banner-crop.png`.
- Side-by-side comparison evidence: `design-qa-listening-banner-comparison.png`.
- Mobile implementation: `design-qa-listening-banner-mobile.png`.
- Route and state: `/listening`, intro state, HSK 1 selected.

## Viewports and normalization

- Source visual truth: 1475 × 400 px.
- Desktop browser viewport request: 1440 × 900 CSS px; in-app Browser content canvas: 1427 px wide.
- Desktop implementation screenshot: 1427 × 1015 px; focused banner crop: 1224 × 352 px.
- Mobile browser viewport request: 390 × 844; in-app Browser content canvas: 488 CSS px due host density scaling; screenshot: 594 × 1055 px.
- Density normalization: the source was proportionally scaled to 1224 × 332 and padded to 1224 × 352; the focused implementation remained 1224 × 352. The two equal-size regions were placed side by side without stretching.

## Full-view comparison evidence

The desktop capture keeps the approved family composition: strong two-line teal heading in a quiet left field, bright realistic workplace imagery through the middle, current Himi animation on the right, soft radius and restrained shadow. The listening variant changes only the route-specific scene to headphones, an audio device and light-wave imagery. The primary listening CTA is intentionally retained inside the banner so the existing exercise flow remains reachable.

## Focused comparison evidence

`design-qa-listening-banner-comparison.png` places the approved course banner and the new listening banner in one normalized image. It confirms matching headline scale, left-to-right visual balance, bright palette, mascot scale, edge radius and image sharpness. The new route-specific headphones remain clear behind Himi rather than being obscured or cropped.

## Required fidelity surfaces

- Fonts and typography: the shared Himi heading, body font stack, weight, line height and tight display tracking are inherited from `HimiSectionBanner`; Vietnamese diacritics remain crisp at desktop and mobile sizes.
- Spacing and layout rhythm: the desktop banner uses the same shared grid, padding, radius and visual proportions as Courses, Practice, Videos and VIP. Mobile stacks copy and action content above the mascot without clipping.
- Colors and visual tokens: the established white, forest teal and coral action palette is preserved; the listening asset adds only pale blue/mint sound-wave accents.
- Image quality and asset fidelity: the generated background is a purpose-built 2048 × 512 WebP rather than an enlarged screenshot. Headphones, audio device and background remain sharp; current Himi uses the existing animated GIF with the static reduced-motion fallback.
- Copy and content: the new title and description communicate focused listening practice; the original 10-question, four-mode, 5–7-minute facts and “Bắt đầu nghe” action remain intact.

## Interaction and accessibility verification

- Selecting HSK 2 updates the level state, then “Bắt đầu nghe” enters the listening session and displays the first “Chọn Hán tự bạn vừa nghe” prompt.
- “Rời lượt nghe” returns to the intro banner.
- Banner heading remains connected through `aria-labelledby`; facts retain an accessible label and decorative Himi stays hidden from assistive technology.
- Desktop and mobile canvases have no document-level horizontal overflow.
- Browser warning/error log checked after the interaction flow: none.

## Findings

- No actionable P0, P1 or P2 differences remain.

## Comparison history

- Initial implementation replaced the standalone listening hero with the shared immersive banner, added the route-specific 2K background and preserved the start action inside the banner.
- Final desktop and mobile checks found no clipping, overflow, fuzzy assets or blocked controls, so no P0/P1/P2 fix loop was required.

## Follow-up polish

- P3: the mobile banner is intentionally taller than the other catalog banners because it contains the core start action and session facts.

## Implementation checklist

- [x] Match the approved bright panoramic Himi banner family.
- [x] Use a dedicated 2048 × 512 listening background.
- [x] Preserve the listening CTA, facts, level selection and session flow.
- [x] Verify desktop, mobile, reduced-motion fallback, interactions and console output.

final result: passed

---

# Design QA — Immersive banner family for Practice, Video and VIP

## Comparison target

- Source visual truth: `design-qa-course-mascot-lowered-final.png`, the approved live Career-route banner selected by the user as the banner-family reference.
- Practice desktop: `design-qa-practice-banner-new.png`.
- Video desktop: `design-qa-video-banner-new.png`.
- VIP desktop: `design-qa-vip-banner-new.png`.
- Practice mobile: `design-qa-practice-banner-mobile.png`.
- Video mobile: `design-qa-videos-banner-mobile.png`.
- VIP mobile: `design-qa-vip-banner-mobile.png`.
- Full family comparison: `design-qa-immersive-banner-family-comparison.png`.
- Routes and state: `/practice` catalog mode, `/videos` unfiltered library, `/vip` anonymous learner.

## Viewports and normalization

- Desktop CSS viewport: 1292 × 760. The in-app browser captured at 1.25 density.
- Source and VIP banner captures: 1475 × 400 px. Practice and Video banner captures: 1594 × 400 px because those route shells are wider.
- Family comparison normalizes every banner to a 1475 × 400 px slot, preserving aspect ratio and padding the two wider route captures vertically rather than stretching them.
- Mobile browser inner width: 488 CSS px at the same density. Captures are 564 × 506 px (Practice), 561 × 415 px (Video) and 556 × 454 px (VIP), reflecting each route shell's existing responsive width and content height.

## Full-view comparison evidence

`design-qa-immersive-banner-family-comparison.png` places the approved Career banner first, followed by Practice, Video and VIP. All four retain the same quiet editorial copy zone, panoramic scene, dark-teal two-line heading, supporting copy, rounded frame, current red-scarf Himi and floor-anchored animation. The three new scenes are intentionally content-specific: microphone and conversation studio for Practice, screen/camera/audio equipment for Video, and a warm premium library for VIP.

## Focused comparison evidence

The desktop banner crops are large enough to read the headline, paragraph, Himi face, scarf and mission board, so no additional micro-crop is needed. The mobile captures separately confirm that the text card, background focal point and mascot remain independently readable after stacking.

## Required fidelity surfaces

- Fonts and typography: all variants reuse the approved Geist stack, display weight, letter spacing, two-line hierarchy and responsive wrapping from the Career banner.
- Spacing and layout rhythm: desktop banners share 318–320px height, copy/visual grid tracks, 26px radius and identical mascot scale; mobile uses the existing 332px minimum with the text surface separated from the art.
- Colors and visual tokens: white, teal, ice blue and coral remain consistent. Practice adds mint, Video adds sky blue, and VIP adds restrained champagne gold without introducing a dark premium theme.
- Image quality and asset fidelity: each background is a purpose-built 2048 × 512 WebP. All variants use the approved 560 × 560 current-Himi transparent GIF and the matching static PNG for reduced-motion users.
- Copy and content: every description states the real purpose of its route; no fake buttons, plan claims or duplicate workflow explanations were added.

## Interaction and accessibility verification

- Practice: selecting the exact `Nhà máy` tab updates `aria-selected` from `Văn phòng` to `Nhà máy`.
- Video: the `Mua sắm` filter returns one card; searching `ga tàu` returns one matching video.
- VIP: four plan cards remain rendered and all three anonymous upgrade links still target `/login?returnTo=%2Fvip`.
- All three banners retain semantic labelled headers with live HTML text; the backdrop and mascot remain decorative.
- Mobile routes report no document-level horizontal overflow (`scrollWidth` 475 vs `innerWidth` 488).
- Browser development logs contain debug/info messages only; no warning or error entries were recorded.

## Findings and comparison history

- Iteration 1: Practice and Video immediately matched the current-Himi reference, but VIP retained the retired success mascot because a later equal-specificity selector overrode the shared asset.
- Fix: removed the obsolete VIP-specific mascot override. The post-fix desktop capture confirms VIP now uses the current red-scarf, mission-board Himi.
- Final comparison: no actionable P0, P1 or P2 differences remain.

## Follow-up polish

- P3: dedicated per-route Himi props could be explored later, but the shared current mascot is the user's approved identity and produces the strongest family consistency now.

## Implementation checklist

- [x] Generate and install three sharp 2048 × 512 route-specific backdrops.
- [x] Replace old Practice, Video and VIP headers with the shared immersive banner system.
- [x] Use current animated Himi and reduced-motion fallback everywhere.
- [x] Preserve Practice tabs, Video search/filter and VIP plan/login flows.
- [x] Verify desktop, mobile, overflow and browser logs.

final result: passed

---

# Design QA — Career-route banner with animated Himi

## Comparison target

- Banner source visual truth: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-4824ef9e-ce14-467e-8ddb-64926f1fc3d1.png`.
- Current Himi identity source: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-b7ea609b-e089-4a60-b146-173993736e9f.png`.
- Implementation desktop: `design-qa-course-current-himi-desktop.png`.
- Implementation mobile: `design-qa-course-current-himi-mobile.png`.
- Current-Himi focused comparison: `design-qa-course-current-himi-comparison.png`.
- Mascot vertical-position source: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-c83ee611-0ce5-42d8-ad35-3facc95af334.png`.
- Mascot lowered implementation: `design-qa-course-mascot-lowered-final.png`.
- Mascot vertical-position comparison: `design-qa-course-mascot-lowered-comparison.png`.
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

`design-qa-course-mascot-lowered-comparison.png` places the user's high-position screenshot above the revised live banner. The source was normalized from 1615 × 562 px to the implementation's 1475 px width; the implementation banner was captured from a 1292 × 760 CSS viewport at 1.25 density. Himi now sits visibly lower, keeps a small safe margin above the head throughout the five-pixel float animation, and remains anchored to the banner floor without changing scale or horizontal placement.

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
- Iteration 3: the current mascot sat too high and its hair could touch the banner crop during the upward float frame. Desktop bottom offset moved from `-24px` to `-68px` (`-58px` at the 1120px breakpoint), with proportionally smaller adjustments on tablet and mobile. The post-fix comparison confirms the full head remains visible and the mascot sits lower without affecting text, filters or background composition.
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
