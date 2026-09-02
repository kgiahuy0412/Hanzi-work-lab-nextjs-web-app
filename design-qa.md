# Mobile Homepage — Option 1 Design QA

## Evidence

- Source visual truth: `C:/Users/Windows/.codex/generated_images/019fb6fe-431e-7c62-917c-2abef5ccee3c/exec-cf67e350-3072-496c-99b4-a661a24388a4.png`
- Browser-rendered implementation: `C:/Users/Windows/Documents/INDIVIDUAL PROJECT/hanziwork/artifacts/design-qa/home-option-1-mobile.png`
- Combined source/implementation comparison: `C:/Users/Windows/Documents/INDIVIDUAL PROJECT/hanziwork/artifacts/design-qa/home-option-1-comparison.png`
- First implementation iteration: `C:/Users/Windows/Documents/INDIVIDUAL PROJECT/hanziwork/artifacts/design-qa/home-option-1-mobile-iteration-1.png`
- Route: `http://localhost:3000/`

## Normalization

- Source pixels: 852 × 1846.
- Implementation pixels: 390 × 844.
- Browser viewport: 390 × 844 CSS pixels at device scale factor 1.
- Comparison normalization: source downsampled to 390 × 844; implementation retained at native capture size.
- State: anonymous learner, mobile navigation visible, animated home hero active, one live dialogue card visible.

## Full-view comparison

The selected mockup and implementation were combined side by side at the same normalized viewport. The implementation matches the selected hierarchy and rhythm: three-line Be Vietnam Pro headline, coral `Homi`, concise one-line support copy, coral primary CTA, orange route action, full-height city scene, live dialogue, mascot, and six-item mobile navigation.

The implementation intentionally preserves the user's existing production background and animated Himi asset rather than replacing them with the generated mockup's altered illustration. This creates small subject-scale and dialogue-content differences while keeping the selected composition and requested product assets.

## Focused comparison

The hero's upper half was inspected in the combined image. The headline wraps exactly as selected—`Học tiếng Trung / vui hết ý / cùng Homi.`—with clear contrast, no clipping, and no horizontal overflow. The background now continues behind the copy and controls instead of starting at a separate hard horizontal boundary.

## Required fidelity surfaces

- Fonts and typography: Roboto 800 is loaded with the Vietnamese subset for clean stacked diacritics; the supporting copy remains in the product's Inter family.
- Spacing and layout rhythm: headline, support copy, CTA, route action, dialogue, characters, mascot, and fixed navigation remain distinct at 390 × 844.
- Colors and tokens: mascot black, Himi coral, orange secondary action, and existing navigation surfaces are preserved.
- Image quality and asset fidelity: the existing responsive 1536/2K/4K city assets and corrected animated Himi GIF are reused directly; no placeholder or CSS-drawn visual was introduced.
- Copy and content: the selected headline and concise support sentence are present verbatim.

## Interaction and responsive checks

- The primary CTA navigates to `/listening?mode=scenario` and browser back returns to the homepage.
- The implementation has `scrollWidth: 390` at the 390px viewport, so no horizontal overflow is present.
- The six-item mobile navigation remains visible above the safe area.
- The browser console contains no warnings or application errors beyond normal Vite/React development messages.
- Production build, focused homepage tests, and lint for the edited TypeScript/test files pass.

## Comparison history

### Iteration 1

- Finding: [P2] The image began below the support copy with a visible horizontal boundary, so the upper copy area still read as a separate white slab.
- Fix: extended the existing responsive artwork through the entire hero, adjusted its mobile focal point, and moved the dialogue card to retain the selected vertical rhythm.
- Evidence: `home-option-1-mobile-iteration-1.png`.

### Iteration 2

- Finding: no remaining actionable P0, P1, or P2 visual or interaction differences. Production-image subject scale and rotating dialogue copy differ intentionally from the generated visual.
- Evidence: `home-option-1-comparison.png`.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] None required for the selected option.

final result: passed

---

# HSK Guided Lesson Design QA

## Evidence

- Source visual truth: `C:/Users/DELL/AppData/Local/Temp/hsk-reference-audit/12-guided-play-same-viewport.png`
- User-selected header reference: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-8e6a899b-abd6-480a-8ca4-574edce30be1.png`
- Final implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-hsk-guided-final.png`
- Additional vocabulary implementation state: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-hsk-guided-vocabulary-desktop.png`
- Route: `http://localhost:3000/hsk/1/hsk-1-lam-quen-lan-dau/play`

## Normalization

- Source and final implementation captures: 1269 × 714 pixels.
- Browser viewport: 1269 × 714 CSS pixels at device scale factor 1.
- State: guided lesson introduction, step 1 of 18, pinyin visible, 1× playback selected.
- The third-party source's promotional sale strip is excluded from fidelity requirements because it is marketing chrome, not part of the selected lesson feature.

## Full-view comparison

The source and implementation were opened together at the same viewport and interaction state. The implementation preserves the selected feature hierarchy: close action, long progress bar, step counter, pinyin toggle, three playback speeds, seven learning-section pills, focused lesson content, and fixed previous/next navigation.

The introduction content intentionally uses Himi's existing mint/teal tokens, rounded learning cards, and product copy. This keeps the new flow consistent with the rest of the user's site while retaining the reference interaction model.

## Focused-region comparison

The selected target is the top learning bar. It is fully readable at native resolution in the full-view comparison, so an additional enlarged crop was not needed. The final bar matches the control order, labels, selected states, compact spacing, and progress affordance shown in the user-selected reference.

## Required fidelity surfaces

- Fonts and typography: existing Himi sans-serif and Chinese serif fallbacks are preserved; hierarchy, weights, line-height, tab labels, counters, and pinyin remain readable without clipping.
- Spacing and layout rhythm: the two-row sticky header, centered content, fixed footer, pill radii, card spacing, and full-width progress rhythm match the reference interaction pattern.
- Colors and visual tokens: Himi's approved teal/mint system replaces Hanbeego's red next-button accent intentionally; semantic selected, disabled, correct, and incorrect states are consistent.
- Image quality and asset fidelity: the selected reference contains UI icons rather than raster imagery. Icons use the product's existing icon library; no placeholder art or copied third-party assets are present.
- Copy and content: all seven reference stages are present with correct counts: 1 introduction, 11 vocabulary, 2 grammar, 1 dialogue, 1 writing, 1 practice, and 1 completion step.

## Interaction and responsive checks

- Section pills jump to steps 1, 2, 13, 15, 16, 17, and 18 as expected.
- Previous/next navigation advances individual vocabulary and grammar steps; ArrowLeft and ArrowRight use the same navigation function.
- Pinyin visibility and 0.75×/1×/1.25× playback controls update their pressed states.
- Vocabulary includes pronunciation, meaning, character/radical hints, and example audio.
- Grammar, full dialogue, per-turn audio, interactive Hanzi Writer modes, answer feedback, and completion links were exercised in the Browser.
- Progress is restored from versioned local storage and reaches 100% at the completion step.
- Browser console contains no application errors after exercising the primary journey.
- Responsive rules stack learning cards and practice options, turn the section row into horizontal scrolling, and keep the footer controls visible on narrow screens.

## Comparison history

### Iteration 1

- Finding: [P2] The pinyin control rendered both “pīn” and a duplicate visible “pinyin” label, making the top bar denser than the selected reference.
- Fix: reduced the visible control to “pīn” and retained “Ẩn pinyin/Hiện pinyin” as the accessible button label.
- Post-fix evidence: `qa-hsk-guided-final.png` shows the compact single-label control at the same 1269 × 714 viewport.

### Iteration 2

- Finding: no remaining actionable P0, P1, or P2 visual or interaction differences. Himi-specific body styling and the absence of the source site's sale banner are intentional product-context differences.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] A future iteration could add a tiny section-completion checkmark animation without changing the current flow.

final result: passed

---

# Himi Brand Color Synchronization Design QA

## Evidence

- Current attachment checked: `C:/Users/DELL/Downloads/HSK 2 Sách bài tập.pdf` (169-page HSK 2 workbook; not a brand guideline).
- Source visual truth: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/pdfs/himi-brand-guidelines/page-4.png` (official Himi palette page rendered from the previously supplied brand guideline).
- Pre-fix account capture: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-audit-account-before.png`.
- Final account capture: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-audit-account-after.png`.
- Final notifications capture: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-audit-notifications-after.png`.
- Combined source/implementation comparison: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/current-brand-pass/brand-guideline-account-comparison.png`.
- Current multi-page review sheet: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/current-brand-pass/contact-sheet.png`.
- Preview: `http://localhost:3103/`.

## Normalization

- Brand guideline render: 993 × 1404 pixels; the comparison uses the palette and typography section at the top of the page.
- Browser viewport: 1269 × 714 CSS pixels at device scale factor 1.
- Account full-page capture: 1269 × 1108 pixels before and after.
- Notifications full-page capture: 1269 × 868 pixels before and after.
- Combined comparison: 1520 × 544 pixels, with the source palette and the final account implementation scaled into equal-width cells.
- State: authenticated learner shell with empty notifications and a free account.

## Full-view comparison

The official source defines Himi red `#FF4C3B`, orange `#FF8E2D`, mascot black `#222222`, and white `#FFFFFF`. The final account page now applies these colors to its avatar, headings, account actions, membership surface, icons, dividers, and decorative mascot. The notifications page and shared learner headers use the same red/black/white hierarchy. Green remains only where it communicates a functional success state such as verified or approved.

The current review sheet covers Home, Courses, Listening, Games, Videos, Writing, VIP, Writing Practice, Account, and Notifications. Each route loaded successfully and the Writing Practice board remained available after the theme update.

## Focused-region comparison

The account hero was compared directly against the official palette in the combined image. The former teal avatar, teal headings, teal membership band, and teal line icons were removed. The final hero uses a red-to-orange brand surface with white initials and the supplied Himi mascot asset on a white field.

## Required fidelity surfaces

- Fonts and typography: the existing Inter content font is preserved and matches the guideline's approved secondary font. The requested color pass does not alter type sizes, wrapping, or hierarchy.
- Spacing and layout rhythm: no grid, spacing, radius, responsive breakpoint, or content-density changes were introduced.
- Colors and visual tokens: the official four-color palette drives shared learner headers, account chrome, notifications, calls to action, and page accents. Semantic success green is intentionally retained only for status meaning.
- Image quality and asset fidelity: the teal dashboard decoration on Account was replaced with the existing high-resolution Himi mascot asset; no placeholder or code-drawn illustration was introduced.
- Copy and content: labels, profile data, actions, navigation, and notification text are unchanged.

## Comparison history

### Iteration 1

- Finding: [P1] Account still used the former teal visual system in the avatar, headings, membership band, icons, and decorative dashboard background.
- Fix: mapped the remaining account chrome to Himi red, orange, black, white, warm soft surfaces, and the supplied mascot artwork.
- Post-fix evidence: `brand-audit-account-after.png` and `brand-guideline-account-comparison.png`.

- Finding: [P2] Shared learner headers and the Notifications header still contained direct teal declarations that bypassed the global brand tokens.
- Fix: added a shared learner-header mapping and branded Notifications surfaces while preserving semantic success/error colors.
- Post-fix evidence: `brand-audit-notifications-after.png` and `contact-sheet.png`.

### Iteration 2

- Finding: no remaining actionable P0, P1, or P2 color mismatches in the reviewed page families.

## Findings

No actionable P0, P1, or P2 findings remain for the requested site-wide brand color synchronization.

## Follow-up polish

- [P3] A future typography pass could introduce Nunito Bold for display headings, as named by the guideline, without changing the completed color work.

final result: passed

---

# Learner Account Menu Design QA

## Evidence

- Source visual truth path: user-attached account-menu reference in Browser Comment 1 (276 × 345 pixels).
- Source page context: user-attached Himi home screenshot at an 842 × 706 viewport with the authenticated user chip selected.
- Browser-rendered implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-account-menu-open.png`.
- Focused implementation crop: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-account-menu-crop.png`.
- Route: `http://localhost:3002/`.

## Normalization

- Browser viewport: 842 × 706 CSS pixels at device scale factor 1.
- Source menu crop: 276 × 345 pixels.
- Implementation menu: 276 × 347.4 CSS pixels; focused capture is 276 pixels wide with no horizontal scaling.
- State: authenticated user “Gia Huy”, account popover open beneath the top-right user chip.

## Full-view comparison

The user-provided home screenshot and the browser-rendered implementation were inspected together in the same open-menu state. The menu remains anchored to the selected chip, stays inside the viewport, overlays the hero without moving the header, and preserves the existing rail and topbar composition.

## Focused-region comparison

The user-provided 276-pixel menu reference and `qa-account-menu-crop.png` were compared at equal width. The implementation matches the reference hierarchy, left alignment, rounded white surface, border, elevation, five icon rows, identity divider, and separated red logout action. The red outline around “Giới thiệu bạn bè” in the supplied image is treated as annotation markup rather than product chrome.

## Required fidelity surfaces

- Fonts and typography: the existing Himi Inter stack is retained; the identity, email, menu labels, weights, truncation, and line heights match the compact reference hierarchy without wrapping.
- Spacing and layout rhythm: menu width is exactly 276px; the final 347.4px height is within 2.4px of the 345px source crop. Header, row, divider, radius, and shadow rhythm are visually aligned.
- Colors and visual tokens: the white surface, charcoal labels/icons, subtle gray dividers, and semantic red logout action match the source while using the product's current tokens.
- Image quality and asset fidelity: the target contains no raster assets. All visible controls use the installed Lucide icon set; no placeholder, CSS-drawn, inline SVG, or generated imagery was introduced.
- Copy and content: all source labels are present in order, with the authenticated user's real display name and email supplied by the server.

## Interaction and responsive checks

- Clicking the user chip toggles `aria-expanded` and exposes the labeled account dialog.
- Selecting a navigation item closes the menu; clicking outside also closes it.
- Escape closes the menu and restores focus to the user chip.
- Closed content is inert and hidden from assistive navigation.
- Logout remains a real POST action to the existing auth endpoint and was not submitted during QA.
- No menu-specific console errors were observed. A pre-existing home-hero motion hydration warning remains outside this component's scope.
- Lint, the focused learner-navigation test, production build, and diff whitespace validation pass.

## Comparison history

### Iteration 1

- Finding: [P2] The first browser capture measured 362.4px tall, about 17px taller than the selected reference because the navigation and logout padding were too generous.
- Fix: tightened only the menu row and logout vertical padding while retaining 40px minimum action targets and the 276px source width.
- Post-fix evidence: `qa-account-menu-crop.png` measures 276 × 347.4 CSS pixels and visually matches the source density.

### Iteration 2

- Finding: no remaining actionable P0, P1, or P2 differences in the requested open-menu state.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] Referral sharing and install/download behavior can be connected when those product flows are defined; the requested menu presentation does not require new routes.

final result: passed

---

# Forgot Password Auth Scene Design QA

## Evidence

- Source visual truth path: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-4eb1e492-a4b3-46df-bfe9-194a88614d2b.png`.
- Forgot-password content reference: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-261fc4ca-2b25-48b2-a0a7-353451c9320c.png`.
- Browser-rendered desktop implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-forgot-password-desktop.png`.
- Browser-rendered mobile implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-forgot-password-mobile.png`.
- Full-view comparison: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-forgot-password-comparison.png`.
- Focused card comparison: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-forgot-password-card-comparison.png`.
- Route: `http://[::1]:3103/forgot-password`.

## Normalization

- Source scene and desktop implementation: 1904 × 886 pixels.
- Desktop browser viewport: 1904 × 886 CSS pixels at device scale factor 1.
- Mobile browser viewport: 390 × 844 CSS pixels at device scale factor 1.
- State: initial forgot-password request form with no server notice; email field empty and submit action enabled.
- The source scene contains login content while the implementation contains the requested forgot-password content. Card content height is therefore expected to differ; scene geometry, card styling, controls, and shared navigation are the fidelity targets.

## Full-view comparison

The source and implementation were combined at equal pixel dimensions and reviewed together. The forgot-password screen now uses the same full-canvas satchel scene, Himi wordmark, home control, centered card placement, warm cream surface, coral action, mint icon treatment, and responsive crop as login and registration. The shorter card is intentional because the forgot-password task has one input rather than two login inputs and two account links.

## Focused-region comparison

The card crops were combined at native resolution. Heading family and optical weight, descriptive-copy width, input height and radius, icon placement, coral button styling, divider, link treatment, card border, and shadow match the existing learner-auth component because the route now renders that shared component directly.

## Required fidelity surfaces

- Fonts and typography: the shared learner-auth heading, label, input, button, and link styles are reused without a route-specific override; Vietnamese copy wraps cleanly at desktop and mobile widths.
- Spacing and layout rhythm: desktop card placement aligns with the login reference; the one-field task naturally reduces card height. At 390px width, the 348.8px card stays within the viewport and all controls remain visible.
- Colors and visual tokens: the implementation uses the same cream canvas, warm card surface, coral primary action, mint/teal input icon, muted description, and brand wordmark as login and registration.
- Image quality and asset fidelity: the existing high-resolution `login-bag-scene.webp` and `login-bag-scene-mobile.webp` assets are reused directly. No placeholder, CSS drawing, or replacement illustration was introduced.
- Copy and content: the email guidance, field label, “Gửi liên kết đặt lại” action, sent confirmation, and “Quay lại đăng nhập” link preserve the original forgot-password flow.

## Interaction and responsive checks

- The form action remains `/api/auth/forgot-password`, uses a required email input, and retains browser email semantics.
- “Quay lại đăng nhập” navigates to login; “Quên mật khẩu?” returns to the forgot-password route.
- The `sent=1` status remains wired to the existing privacy-preserving confirmation copy.
- At 390 × 844, there is no horizontal overflow and the illustration remains visible below the card.
- Browser console inspection found no warnings or application errors after exercising the navigation flow.
- Production build and the focused forgot-password test pass. The full repository test run has five unrelated pre-existing rendered-copy failures in areas outside authentication.

## Comparison history

### Iteration 1

- Finding: no actionable P0, P1, or P2 visual or interaction differences. The content-specific card height is an expected consequence of replacing the login form with the shorter forgot-password task.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] None required for the requested shared-scene treatment.

final result: passed

---

# HSK Flashcard Session Design QA

## Evidence

- Source visual truth path: user-attached `Browser Comment 1 / additional image` (conversation attachment; no local filesystem path was exposed).
- Browser-rendered implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-hsk-flashcard-session.png`.
- Responsive implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/qa-hsk-flashcard-session-mobile.png`.
- Route: `http://localhost:3002/hsk/1/hsk-1-lam-quen-lan-dau/flashcard`.

## Normalization

- Source and desktop implementation captures: 1870 × 843 pixels.
- Browser viewport: 1870 × 843 CSS pixels at device scale factor 1 for the implementation capture.
- State: second card, first card rated “Đã nhớ”, score 160, remembered count 1, front face visible.
- The source uses a six-word game deck (`2 / 6`); the implementation intentionally uses all 11 words from the selected HSK lesson (`2 / 11`).

## Full-view comparison

The source attachment and final browser capture were reviewed together at the same pixel dimensions and interaction state. The implementation matches the selected full-screen composition: isolated white canvas, upper-left back control, upper-right three-card HUD, centered teal flashcard, pronunciation and self-rating controls, lower-left Himi mascot, and centered tip pill.

The main desktop geometry is aligned to the source: the flashcard renders at 724 × 400 CSS pixels at approximately x573/y149, the back control at x64/y38, the rating row at x573/y672, and the tip at y765. The different Hanzi and denominator are expected because the screen is bound to the current lesson rather than the six-word demo data shown in the source.

## Focused-region comparison

The card/HUD/control cluster was inspected at native resolution. Border thickness, cream frame, teal fill, rounded corners, soft lower shadow, compact uppercase labels, disabled rating treatment, icon family, and metric hierarchy follow the reference. No additional crop was needed because these details remain legible in the 1870 × 843 capture.

## Required fidelity surfaces

- Fonts and typography: the existing Himi sans-serif and Chinese fallbacks preserve the source hierarchy, uppercase micro-labels, bold metric values, large Hanzi, and compact Vietnamese controls without clipping.
- Spacing and layout rhythm: card dimensions, HUD placement, back control, mascot anchoring, rating-row width, tip baseline, radii, and soft elevation match the reference proportions.
- Colors and visual tokens: teal learning surfaces, cream borders, warm-white canvas, amber score icon, mint remembered icon, and muted disabled actions match the source palette and maintain semantic contrast.
- Image quality and asset fidelity: the implementation reuses the existing high-resolution transparent Himi flashcard mascot asset from `public/assets/games/flashcard-penguin-cutout.png`; no placeholder, CSS drawing, emoji, or approximated illustration is used.
- Copy and content: all visible source functions are represented with lesson-appropriate Vietnamese copy; actual HSK vocabulary, pronunciation, meaning, example sentence, and 11-word count replace the demo content intentionally.

## Interaction and responsive checks

- Clicking the overview “Flashcard” link navigates to the dedicated immersive route.
- The card flips between Hanzi and meaning/pinyin/example faces.
- “Cần ôn lại” and “Đã nhớ” remain disabled until the card is flipped.
- Rating advances the deck; “Đã nhớ” updates score and remembered count and persists vocabulary progress.
- Pronunciation uses Chinese speech synthesis.
- The completion view offers restart and return-to-lesson actions.
- At 390 × 844, the card and persistent controls fit without horizontal overflow; the mascot no longer overlaps the rating buttons.
- Browser console inspection found no application errors.

## Comparison history

### Iteration 1

- Finding: [P2] At 390px width, the default immersive-game mascot position overlapped the left rating button.
- Fix: added a Flashcard-session-specific mobile position and size so the mascot sits in the open space between pronunciation and rating controls.
- Post-fix evidence: `qa-hsk-flashcard-session-mobile.png` shows the mascot clear of both persistent actions.

### Iteration 2

- Finding: no remaining actionable P0, P1, or P2 visual or interaction differences. Lesson-specific vocabulary content and the `2 / 11` denominator are intentional product-data differences.

## Findings

No actionable P0, P1, or P2 findings remain.

## Follow-up polish

- [P3] A subtle score-count animation could make successful ratings feel more celebratory without changing the selected layout.

final result: passed

---

# Brand Surface White Copy Design QA

## Evidence

- Source visual truth: `C:/Users/DELL/AppData/Local/Temp/codex-clipboard-60717b13-ec40-43de-b53f-81713eb3bc8c.png`
- Browser-rendered implementation: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-white-copy/implementation-writing-nav.png`
- Combined focused comparison: `D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-white-copy/comparison-writing-nav.png`
- Route and state: `http://localhost:3103/writing`, desktop learner rail expanded, practice submenu open, active “Luyện viết” item.

## Normalization

- Source crop: 133 × 60 pixels; its original viewport and density were not supplied.
- Implementation crop: 185 × 64 pixels from a 1280px-wide browser viewport at device scale factor 1.
- Rendered active control: 159.2 × 44 CSS pixels.
- The source and implementation were normalized into equal 185 × 80 comparison cells. Because the source is a tight crop, the comparison is limited to the requested foreground/background treatment rather than page layout.

## Full-view comparison

The attached source does not contain a full page, so it cannot establish page-level layout truth. The implementation was still inspected at desktop and mobile sizes across the existing site shell; this change does not alter spacing, sizing, typography, content, or responsive layout.

## Focused-region comparison

The combined comparison shows the requested change directly: the source uses black copy and a black icon on the solid Himi red control, while the implementation keeps the same red surface and changes both copy and icon to white. The active-state radius, label, icon family, and control hierarchy remain intact.

## Required fidelity surfaces

- Fonts and typography: family, weight, size, line height, and label wrapping are unchanged.
- Spacing and layout rhythm: no dimensions, gaps, padding, radii, or elevation were changed.
- Colors and visual tokens: `--himi-on-red` and `--himi-on-orange` now resolve to `#FFFFFF`; pale brand surfaces retain dark copy, while solid red/orange controls use white copy.
- Image quality and asset fidelity: no raster assets, logos, or illustrations were changed; existing library icons inherit the new white foreground.
- Copy and content: labels and page content are unchanged.

## Interaction and responsive checks

- The desktop and mobile practice menus open normally.
- The active “Luyện viết” item renders white text and icon on Himi red.
- Saturated brand-surface scans found no dark-copy violations on representative HSK, Writing, Listening, Games, Video, VIP, and Admin routes.
- Brand-theme tests, lint, production build, and diff whitespace validation pass.

## Comparison history

### Iteration 1

- Finding: [P1] Solid red/orange brand controls used black copy and icons, contrary to the user-selected visual direction.
- Fix: changed the shared on-brand foreground tokens to white and corrected shell/game overrides that bypassed those tokens.
- Post-fix evidence: `comparison-writing-nav.png` shows white copy and icon on the unchanged red control.

### Iteration 2

- Finding: [P2] A few pale-red controls inherited the new white token even though they were not saturated brand surfaces.
- Fix: kept pale secondary and HSK selection surfaces on dark/red copy, and used solid red plus white copy for active learner-navigation controls.
- Post-fix evidence: focused browser checks and saturated-surface scans report no remaining dark-copy violations.

## Findings

No actionable P0, P1, or P2 findings remain for the requested white-on-brand color update.

## Follow-up polish

- [P3] White on the official bright orange has lower contrast than dark copy; retain the requested white treatment only for larger or bold control labels.

final result: passed
