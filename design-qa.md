# Design QA — Registration success mascot

- Source visual truth: `C:\Users\Windows\Documents\INDIVIDUAL PROJECT\hanziwork\design-references\auth-register-success-option-1.png`
- Rendered desktop evidence: `C:\Users\Windows\Documents\INDIVIDUAL PROJECT\hanziwork\qa-register-success-desktop.png`
- Rendered mobile evidence: `C:\Users\Windows\Documents\INDIVIDUAL PROJECT\hanziwork\qa-register-success-mobile.png`
- Combined comparison: `C:\Users\Windows\Documents\INDIVIDUAL PROJECT\hanziwork\qa-register-success-comparison.png`
- State: successful learner registration, settled after the celebration entrance animation
- Browser: Codex in-app browser
- Desktop viewport: 1280 × 720 CSS px, device scale factor 1
- Mobile viewport: 390 × 844 CSS px, device scale factor 1
- Source pixels: 1254 × 1254
- Desktop implementation pixels: 1280 × 720
- Mobile implementation pixels: 390 × 844
- Density normalization: the source was scaled into a 720 × 720 comparison panel beside the 1280 × 720 desktop implementation. Aspect ratio was preserved and the source panel was padded with the same warm-cream background.

## Full-view comparison evidence

The combined comparison preserves the selected jumping pose, closed happy eyes, raised wings, teal scarf and H medallion, navy/cream body palette, and coral/teal/yellow confetti. The implementation intentionally reduces the mascot scale to leave a clear success message below it while preserving the source hierarchy. The final overlay is fully opaque, so the earlier pointing mascot and form do not remain visible.

## Focused region comparison evidence

A separate focused crop was not needed: at both 1280 × 720 and 390 × 844, the mascot and all three copy lines occupy the central majority of the capture and remain readable at full-view scale. The transparent asset edges, face, scarf, medallion, feet, and surrounding confetti were inspected directly in the full-resolution browser capture.

## Required fidelity surfaces

- Fonts and typography: HanziWork's existing sans-serif stack is retained. The small uppercase success label, large headline, and muted transition copy produce a clear three-level hierarchy without clipping or wrapping at either viewport.
- Spacing and layout rhythm: the mascot and copy are optically centered. Desktop and mobile retain balanced negative space; no horizontal overflow remains and the success state locks underlying page scrolling.
- Colors and visual tokens: warm cream `#fffaf0`, deep green copy, and teal accent reuse the existing authentication palette and match the selected mascot artwork.
- Image quality and asset fidelity: the selected raster artwork was used directly, converted to a transparent production asset rather than recreated in CSS. The 1254 × 1254 source remains sharp at the rendered sizes and shows no visible magenta halo or crop.
- Copy and content: “Đăng ký thành công!” describes the completed action, while “Đang đưa bạn tới bước xác minh email...” sets the correct next-step expectation.

## Comparison history

### Iteration 1

- Finding [P2]: the first overlay used a 97% opaque cream surface, allowing the old pointing mascot and registration form to remain faintly visible.
- Fix: changed the success overlay to solid `#fffaf0`.
- Post-fix evidence: `qa-register-success-desktop.png` shows only the happy jumping mascot and success copy.

### Iteration 2

- Finding [P2]: the 390 × 844 capture showed a scrollbar from the taller underlying registration scene, despite the success content itself fitting the viewport.
- Fix: disabled body scrolling while `.auth-register-is-success` is active.
- Post-fix evidence: `qa-register-success-mobile.png` has no visible scrollbar or horizontal overflow, and all mascot/confetti/copy content remains visible.

## Findings

No actionable P0, P1, or P2 differences remain.

## Primary interactions tested

- Development-only success-state preview renders the same production success component without creating a test account or sending an email.
- Desktop and mobile responsive states render without clipping or horizontal overflow.
- The existing registration endpoint still supports progressive-enhancement redirects and now also returns structured JSON for the animated client flow.
- Browser console checked: no warnings or errors in the verified success state.

## Implementation checklist

- [x] Use selected option 1 artwork as a real transparent asset.
- [x] Preload the success asset on the registration page.
- [x] Trigger celebration only after the registration API confirms success.
- [x] Redirect to email verification after the 1.9-second celebration.
- [x] Keep existing walking and password-cover animations outside the success state.
- [x] Verify desktop and mobile layout.
- [x] Run tests, lint, and production build.

final result: passed
