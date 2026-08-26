---
name: Himi Chinese
description: Tiếng Trung cho người đi làm, được dẫn dắt bằng những nhịp học ngắn và thân thiện.
colors:
  himi-teal: "#159f96"
  himi-teal-deep: "#087a72"
  pine: "#064f48"
  action-coral: "#ff5b55"
  progress-blue: "#1767e8"
  warm-canvas: "#f8f7f2"
  warm-surface: "#fffdf8"
  ink-navy: "#071a35"
  line-soft: "#d9dfda"
typography:
  display:
    fontFamily: "Geist, Segoe UI, Noto Sans SC, sans-serif"
    fontSize: "clamp(2rem, 4vw, 4rem)"
    fontWeight: 780
    lineHeight: 1.02
    letterSpacing: "-0.045em"
  body:
    fontFamily: "Geist, Segoe UI, Noto Sans SC, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Geist, Segoe UI, Noto Sans SC, sans-serif"
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
    backgroundColor: "{colors.action-coral}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
    padding: "0 18px"
    height: "50px"
  card-feature:
    backgroundColor: "{colors.himi-teal}"
    textColor: "#ffffff"
    rounded: "{rounded.feature}"
    padding: "28px 36px"
  chip-active:
    backgroundColor: "#e2f5f2"
    textColor: "{colors.himi-teal-deep}"
    rounded: "999px"
    padding: "8px 14px"
---

# Design System: Himi Chinese

## Overview

**Creative North Star: "The Himi Workday Studio"**

Himi Chinese feels like a bright, well-organized learning studio built into the learner's workday. It combines adult productivity with the warmth of a mascot-led coach: task state is always explicit, interaction is tactile without becoming childish, and Chinese content receives enough scale to remain memorable.

The system is light and calm at page scale, while saturated teal, coral, and blue identify the few moments that need action or concentration. Himi is useful—pointing to the next step, explaining a state, or celebrating progress—rather than scattered as decoration.

**Key Characteristics:**

- Warm white work surfaces with strong pine-colored text.
- Teal as the learning field, coral as the decisive action, blue as progress.
- Large Chinese characters paired with compact Vietnamese guidance.
- Rounded, tactile controls and soft ambient depth.
- Clear responsive reordering with one dominant action per view.

## Colors

The palette balances quiet workplace neutrals with three purposeful learning signals.

### Primary

- **Himi Teal:** the main interactive learning field and strongest brand surface.
- **Deep Himi Teal:** navigation, active states, focus guidance, and primary text links.

### Secondary

- **Action Coral:** decisive calls to action and the strongest response state.
- **Progress Blue:** active progress, the next step, and informational emphasis.

### Neutral

- **Warm Canvas:** the calm page ground behind learning modules.
- **Warm Surface:** cards, docks, and controls that sit above the canvas.
- **Ink Navy:** high-contrast instructional text and keyboard focus rings.
- **Soft Line:** separators and quiet structure where tonal grouping is insufficient.

**The Three Signals Rule.** Teal owns learning, coral owns action, and blue owns progress; do not assign them interchangeably inside one workflow.

## Typography

**Display Font:** Geist with Segoe UI fallback  
**Body Font:** Geist with Segoe UI fallback  
**Chinese Font:** Microsoft YaHei, PingFang SC, Noto Sans CJK SC

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

- **Learning lift** (`0 28px 58px rgba(25,85,82,.17), 0 6px 16px rgba(18,52,49,.09)`): active task or vocabulary surface.
- **Coach lift** (`0 24px 52px rgba(6,79,72,.20), 0 7px 16px rgba(7,26,53,.08)`): Himi guidance and daily phrase panels.

**The Earned Lift Rule.** No more than one main panel and one supporting coach panel should appear lifted in the same viewport.

## Shapes

Controls use gently rounded 13–16px corners; content panels use 21–24px. Pills are reserved for compact status, progress, and filter chips. Circular shapes belong to icons, avatars, and step markers. Hairline borders are quiet separators, not boxes around every region.

## Components

### Buttons

- **Shape:** tactile rounded rectangle (13–16px) with a minimum 44px height.
- **Primary:** coral on white for decisive learning actions; deep teal is used when coral would compete with a response state.
- **Hover / Focus:** a 2px upward lift may accompany hover; keyboard focus uses a clear navy or teal outline with offset.
- **Secondary / Ghost:** warm surface or transparent background with pine/teal text and a visible focus state.

### Chips

- **Style:** pale teal or warm neutral ground with dense, compact text.
- **State:** active chips use deep teal text and a stronger tonal fill; status chips do not imitate primary buttons.

### Cards / Containers

- **Corner Style:** 21–24px for feature panels, 16–18px for utilities.
- **Background:** warm surface, teal learning field, or pine coach field.
- **Shadow Strategy:** flat by default; refer to Earned Lift.
- **Border:** one soft line when needed to separate similar neutrals.
- **Internal Padding:** 18–36px depending on hierarchy.

### Inputs / Fields

- **Style:** white or warm-surface fill, soft line stroke, 13–16px corners.
- **Focus:** border shifts to deep teal and receives a visible outer outline.
- **Error / Disabled:** error copy is explicit; disabled controls keep readable labels and reduce opacity without removing state.

### Navigation

The desktop rail uses muted gray-green icons, a pale teal active field, and the Himi wordmark. The top bar stays visually quiet. Mobile navigation becomes a fixed bottom bar with icon-plus-label targets and a clearly colored active state.

### Learning Card

The learning card gives Hanzi dominant scale, then pinyin, meaning, workplace example, and three response choices. Motion supports card progression and drag feedback, while reduced-motion users receive immediate state changes.

## Do's and Don'ts

### Do:

- **Do** make the next useful action unmistakable within the first viewport.
- **Do** let Himi explain or guide a real learning state.
- **Do** use the three signal colors according to their named roles.
- **Do** keep Chinese, pinyin, and Vietnamese translation in a consistent reading ladder.

### Don't:

- **Don't** build a dashboard from many equal white cards with identical weight.
- **Don't** let a single flashcard obscure access to the rest of the product.
- **Don't** use mascot art as unrelated corner decoration.
- **Don't** stack multiple large shadows or saturated panels without a quiet field between them.
