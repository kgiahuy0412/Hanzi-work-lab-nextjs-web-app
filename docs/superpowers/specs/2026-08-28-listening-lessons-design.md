# Listening Lessons Design

Date: 2026-08-28
Status: Approved visual direction; implementation plan pending

## Goal

Extend the Listening Studio from a direct level-to-session flow into a three-step learning flow:

1. Select an HSK level.
2. Select one of four listening lessons for that level.
3. Complete a ten-question “listen and choose the Han character” session matching the supplied reference.

The feature must remain inside the existing `/listening` experience and preserve the current learner shell, sidebar, typography, colors, spacing, and responsive behavior.

## Approved Product Direction

Each of the seven existing level groups receives four lessons, for 28 lessons total:

1. Basic vocabulary
2. Daily communication
3. People and everyday life
4. Mixed review

All lessons use the same core exercise format: play a Chinese word or phrase and choose the matching Han character from four options. Content and distractor difficulty increase by level and lesson.

## User Flow

### 1. Level selection

The existing HSK cards remain the entry point. Selecting a card updates the active level and reveals its lesson list on the same page. The page scrolls or focuses the lesson section when appropriate, without navigating to a new route.

### 2. Lesson selection

The lesson section shows four cards for the active level. Each card contains:

- lesson number and title;
- short topic description;
- vocabulary count;
- ten-question session length;
- completion or best-score state when available;
- a clear action to begin the lesson.

Changing the HSK level replaces the visible lesson list with the four lessons belonging to the newly selected level.

### 3. Listening session

Selecting a lesson opens the focused learning interface represented by the supplied reference:

- back button;
- level and lesson title;
- question counter and horizontal progress bar;
- current correct-answer count;
- instruction text;
- large replay-audio control with waveform indicator;
- normal/slow playback toggle;
- four Han-character answer choices in a two-column grid;
- selected, correct, and incorrect feedback states;
- progression to the next question;
- final results state after question ten.

The back button returns to the lesson list for the same HSK level. Leaving a session resets only the active attempt and does not change the selected level.

## Interaction Details

- Audio plays when the session question appears where browser autoplay policy allows; the replay button is always available.
- The speed control switches between normal and slow speech playback and clearly reflects the active setting.
- An answer can be submitted once per question.
- Correct and incorrect states are visually distinguishable without relying on color alone; iconography and concise labels reinforce the result.
- The next-question action appears after feedback so the learner controls the pace.
- Keyboard focus, visible focus rings, and semantic buttons are retained for all interactive elements.
- On narrow screens, answers collapse to a single column and session controls remain comfortably tappable.

## Content Model

Introduce a lesson layer beneath each existing listening level.

Each lesson should include:

- stable `id`;
- `levelId` association;
- lesson number;
- Vietnamese title and description;
- exercise type fixed to `listen-select-hanzi` for this release;
- vocabulary entries with Hanzi, pinyin, Vietnamese meaning, and speech text;
- optional completion metadata derived from local progress state.

Each session contains ten questions. A lesson may have ten or more vocabulary entries. Wrong options come from the same lesson first and then from the same level when additional distractors are needed. The correct answer must appear exactly once, and choices must not contain duplicates.

## State Model

The Listening Studio view state expands to:

- `intro`: hero, level picker, and lesson list;
- `session`: active lesson attempt;
- `complete`: session results.

Additional state tracks the selected level, selected lesson, generated question set, current question index, score, selected answer, feedback state, and playback speed. Derived state should be preferred over duplicated counters.

## Visual Direction

The implementation should match the existing HiMi design system and the supplied exercise reference:

- white learning surface with a soft shadow and generous radius;
- deep teal for headings and primary controls;
- coral progress indication;
- pale teal borders and neutral backgrounds;
- restrained motion for feedback and progress changes;
- existing icon library rather than custom-drawn assets.

The lesson cards should visually relate to the existing HSK level cards, while making the hierarchy clear: level first, lesson second, question third.

## Progress and Persistence

For this release, lesson completion and best score may be stored locally in the browser. Progress is keyed by lesson ID. The UI must still work when local storage is unavailable; persistence failure must not block a session.

## Error and Fallback Behavior

- If speech synthesis is unavailable, keep the interface usable and show a concise Vietnamese message explaining that audio cannot be played in the current browser.
- If a lesson has insufficient unique distractors, draw from its parent level while preserving unique choices.
- If lesson data cannot produce a valid question set, do not start a broken session; return to the lesson list with a recoverable message.

## Verification Criteria

The feature is complete when:

- all seven level groups display four distinct lessons;
- clicking a level displays only that level’s lessons;
- clicking any lesson starts the matching ten-question session;
- session title, progress, score, audio replay, speed control, answers, feedback, back navigation, and completion screen work;
- the session layout visually matches the supplied reference within the existing application shell;
- desktop and mobile layouts remain usable;
- existing Listening Studio behavior outside the new lesson layer does not regress;
- automated tests cover the level-to-lesson-to-session flow and question-generation invariants;
- a browser verification pass confirms the primary flow and responsive layout.

## Out of Scope

- new routes for individual lessons;
- backend persistence or account synchronization;
- downloadable audio files or a new recording pipeline;
- exercise formats other than listening and selecting Han characters;
- authoring tools for administrators;
- redesigning the global learner sidebar or header.
