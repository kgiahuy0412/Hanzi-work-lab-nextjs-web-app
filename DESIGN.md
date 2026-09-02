---
name: Himi Chinese
description: Tiếng Trung cho người đi làm, được dẫn dắt bằng những nhịp học ngắn và thân thiện.
colors:
  himi-red: "#FF4C3B"
  himi-orange: "#FF8E2D"
  mascot-black: "#222222"
  clean-white: "#FFFFFF"
  red-soft: "#FFF0EE"
  orange-soft: "#FFF4E8"
  line-soft: "#E8E1DE"
typography:
  display:
    fontFamily: "Roboto"
    fontSize: "clamp(2rem, 4vw, 4rem)"
    fontWeight: 780
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Inter"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Inter"
    fontSize: "0.6875rem"
    fontWeight: 820
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  control: "13px"
  action: "16px"
  panel: "21px"
  feature: "24px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.himi-red}"
    textColor: "{colors.mascot-black}"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "50px"
  card-feature:
    backgroundColor: "{colors.clean-white}"
    textColor: "{colors.mascot-black}"
    rounded: "{rounded.feature}"
    padding: "28px 36px"
  chip-active:
    backgroundColor: "{colors.red-soft}"
    textColor: "{colors.mascot-black}"
    rounded: "999px"
    padding: "8px 14px"
---

# Design System: Himi Chinese

## Overview

**Creative North Star: "The Himi Workday Studio"**

Himi Chinese feels like a bright, well-organized learning studio built into the learner's workday. It combines adult productivity with the warmth of a mascot-led coach: task state is always explicit, interaction is tactile without becoming childish, and Chinese content receives enough scale to remain memorable.

The system is light and calm at page scale, while Himi Red and Himi Orange identify the few moments that need action or concentration. Himi is useful—pointing to the next step, explaining a state, or celebrating progress—rather than scattered as decoration.

**Key Characteristics:**

- Clean white work surfaces with strong mascot-black text.
- Himi Red as the decisive action and Himi Orange as the supporting accent.
- Large Chinese characters paired with compact Vietnamese guidance.
- Rounded, tactile controls and soft ambient depth.
- Clear responsive reordering with one dominant action per view.

## Colors

The palette follows the official Himi Chinese identity: energetic red, lively orange, mascot black, and clean white. Pale tints are derived only from red or orange for quiet surfaces.

### Primary

- **Himi Red (`#FF4C3B`):** primary calls to action, selected navigation, and the strongest branded emphasis.
- **Mascot Black (`#222222`):** headings, body copy, icons, and readable foreground text on saturated brand surfaces.

### Secondary

- **Himi Orange (`#FF8E2D`):** progress, supporting actions, highlights, and secondary navigation emphasis.
- **Derived red/orange tints:** selected rows, chips, helper panels, and focus halos.

### Neutral

- **Clean White (`#FFFFFF`):** the default page canvas and card surface.
- **Mascot Black (`#222222`):** the default text and icon color.
- **Warm Gray Line (`#E8E1DE`):** quiet separation between white surfaces.

**The Two Signals Rule.** Red owns the main action and selected state; orange owns supporting actions and progress. Black and white provide structure and legibility. Functional success/error colors may appear only when their meaning would otherwise be unclear.

## Typography

**Display Font:** Roboto
**Body Font:** Inter
**Chinese Font:** Inter

**Character:** Compact, contemporary sans-serif typography keeps the interface credible for adult learners. Chinese characters are allowed to become the visual headline while Vietnamese labels stay concise and operational.

### Hierarchy

- **Display** (780, fluid 32–64px, 1.02): dashboard greeting, current learning focus, and large Chinese vocabulary.
- **Headline** (760–780, 24–39px, 1.1): section titles and daily-session status.
- **Title** (720–780, 16–22px, 1.3): feature modules and next actions.
- **Body** (400–650, 14–16px, 1.55): explanations and learning context.
- **Label** (820, 10–11px, tracked uppercase): category, step, and state labels only.

**The Chinese Leads Rule.** When vocabulary or a practical phrase is the subject, the Hanzi is the largest typographic element; pinyin and Vietnamese translation form the reading ladder beneath it.

## Layout

Desktop learner surfaces live inside the persistent rail and top bar. Main content uses a wide centered canvas with a deliberate dominant region and supporting modules rather than an equal-card grid. Spacing follows an 8/12/18/24/32px rhythm. At tablet widths, secondary columns move below the primary task. On phones, modules become a single reading order above the persistent bottom navigation, with controls remaining at least 44px tall.

## Elevation & Depth

The system uses a hybrid of tonal layering and soft ambient shadows. Most utility modules remain flat or bordered; only the active learning object, important coach panel, or floating action earns a large diffuse shadow.

### Shadow Vocabulary

- **Learning lift** (`0 28px 58px rgba(255,76,59,.14), 0 6px 16px rgba(34,34,34,.08)`): active task or vocabulary surface.
- **Coach lift** (`0 24px 52px rgba(255,142,45,.16), 0 7px 16px rgba(34,34,34,.08)`): Himi guidance and daily phrase panels.

**The Earned Lift Rule.** No more than one main panel and one supporting coach panel should appear lifted in the same viewport.

## Shapes

Controls use gently rounded 13–16px corners; content panels use 21–24px. Pills are reserved for compact status, progress, and filter chips. Circular shapes belong to icons, avatars, and step markers. Hairline borders are quiet separators, not boxes around every region.

## Components

### Buttons

- **Shape:** tactile rounded rectangle (13–16px) with a minimum 44px height.
- **Primary:** Himi Red with white copy for decisive learning actions; solid Himi Orange controls also use white copy.
- **Hover / Focus:** a 2px upward lift may accompany hover; keyboard focus uses a mascot-black outline with a red halo.
- **Secondary / Ghost:** Himi Orange, a pale orange tint, or a white surface with black text.

### Chips

- **Style:** pale red/orange or white ground with dense, compact black text.
- **State:** active chips use Himi Red with mascot-black text; status chips do not imitate primary buttons.

### Cards / Containers

- **Corner Style:** 21–24px for feature panels, 16–18px for utilities.
- **Background:** clean white, a pale red tint, or a pale orange tint.
- **Shadow Strategy:** flat by default; refer to Earned Lift.
- **Border:** one soft line when needed to separate similar neutrals.
- **Internal Padding:** 18–36px depending on hierarchy.

### Inputs / Fields

- **Style:** white or warm-surface fill, soft line stroke, 13–16px corners.
- **Focus:** border shifts to Himi Red and receives a visible mascot-black outline with a red halo.
- **Error / Disabled:** error copy is explicit; disabled controls keep readable labels and reduce opacity without removing state.

### Navigation

The desktop rail uses muted black/gray icons, a pale red active field, and the Himi wordmark. The top bar stays visually quiet. Mobile navigation becomes a fixed bottom bar with icon-plus-label targets and a red active indicator.

### Learning Card

The learning card gives Hanzi dominant scale, then pinyin, meaning, workplace example, and three response choices. Motion supports card progression and drag feedback, while reduced-motion users receive immediate state changes.

## Do's and Don'ts

### Do:

- **Do** make the next useful action unmistakable within the first viewport.
- **Do** let Himi explain or guide a real learning state.
- **Do** use red for the main action, orange for supporting emphasis, and black/white for structure.
- **Do** keep Chinese, pinyin, and Vietnamese translation in a consistent reading ladder.

### Don't:

- **Don't** build a dashboard from many equal white cards with identical weight.
- **Don't** let a single flashcard obscure access to the rest of the product.
- **Don't** use mascot art as unrelated corner decoration.
- **Don't** stack multiple large shadows or saturated panels without a quiet field between them.
