# Himi Stories Learner Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static Stories landing page with a fast, responsive library and bilingual reader that enforces Free/VIP access, plays reviewed sentence audio, saves progress, and scores comprehension quizzes.

**Architecture:** Server Components query published card/detail projections and enforce access before serialization. URL-backed GET filters keep the library lightweight. One focused client reader owns preferences, one audio element, active-sentence state, debounced progress, and quiz UI; server endpoints own identity, entitlement, scoring, XP, and signed media delivery.

**Tech Stack:** Node.js 22.13+, TypeScript 5.9, Next.js 16 App Router, React 19, Drizzle ORM 0.45, PostgreSQL, Cloudinary, Lucide React, CSS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-stories-design.md`

## Global Constraints

- Complete the Foundation and CMS plans before this plan.
- Keep Himi's own brand, workplace emphasis, copy, and component language.
- `/stories` fetches card metadata and small progress only; no story snapshot and no audio URL.
- Locked pages never serialize sections, sentences, keywords, questions, answers, or audio references.
- Audio is requested only when the learner presses play; only the next sentence may be prepared after playback starts.
- Render one audio controller, not one `<audio>` per sentence.
- Guests can read/quiz free stories without server persistence.
- Signed-in users save only their own progress and submit only server-scored answers.
- Pinyin, translation, and speed preferences persist locally; server account settings remain unchanged.
- Mobile width 360px must have no horizontal overflow and no toolbar covering reader text.
- All interactive controls must be keyboard accessible and expose text/icon state in addition to color.
- Follow TDD and stage only task-owned files.

---

## File Structure

- `lib/story-search.ts` — query-string parsing and filter serialization.
- `lib/story-reader-state.ts` — pure reducer, sentence navigation, playback advancement, and preference parsing.
- `components/story-library.tsx` — server-rendered filters, statistics, result summary, and card grid.
- `components/story-card.tsx` — metadata/progress/access card.
- `components/story-locked.tsx` — safe login/VIP invitation without protected body.
- `components/story-reader-shell.tsx` — server-rendered authorized reading text used before interactive playback is added.
- `components/story-reader-client.tsx` — reader toolbar, sentence list, keyword cards, audio, and progress.
- `components/story-quiz-client.tsx` — guest and authenticated server-scored submission UI.
- `app/stories/page.tsx` — dynamic published library route.
- `app/stories/[slug]/page.tsx` — metadata, access gate, and reader route.
- `app/stories/loading.tsx` and `app/stories/[slug]/loading.tsx` — route skeletons.
- `app/stories/not-found.tsx` — Himi Stories-specific 404.
- `app/stories/stories.css` — learner library/reader styling.
- `app/api/media/story-audio/[assetId]/route.ts` — entitlement check and signed redirect.
- `app/api/progress/story/route.ts` — reading-position upsert.
- `app/api/progress/story/quiz/route.ts` — server-scored quiz submission.
- `app/sitemap.ts` — published story URLs.
- `tests/story-search.test.mjs` — filter parsing.
- `tests/story-reader.test.mjs` — reducer/playback/preferences.
- `tests/story-routes.test.mjs` — source contract for access, APIs, metadata, and sitemap.
- `tests/rendered-html.test.mjs` — route/sidebar regression coverage.

---

### Task 1: Implement URL-backed story search filters

**Files:**
- Create: `lib/story-search.ts`
- Create: `tests/story-search.test.mjs`
- Modify: `lib/story-types.ts`
- Modify: `lib/story-repository.ts`

**Interfaces:**
- Produces: `StoryLibraryFilters` with `query`, `hsk`, `category`, `access`, `state`.
- Produces: `parseStoryLibraryFilters(searchParams)`, `storyFilterHref(current, patch)`.
- Consumes: `listPublishedStories(filters, userId?)` from the Foundation plan.

- [ ] **Step 1: Write failing filter tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { parseStoryLibraryFilters, storyFilterHref } from "../lib/story-search.ts";

test("story filters accept only supported URL values", () => {
  assert.deepEqual(parseStoryLibraryFilters({ q: "  ca sáng  ", hsk: "2", category: "office", access: "free", state: "completed" }), {
    query: "ca sáng",
    hsk: 2,
    category: "office",
    access: "free",
    state: "completed",
  });
  assert.deepEqual(parseStoryLibraryFilters({ hsk: "10", category: "unknown", access: "all", state: "all" }), {
    query: "",
    hsk: null,
    category: null,
    access: null,
    state: null,
  });
});

test("changing one story filter preserves the others", () => {
  assert.equal(storyFilterHref({ query: "ca", hsk: 1, category: "office", access: null, state: null }, { hsk: 2 }), "/stories?q=ca&hsk=2&category=office");
});
```

- [ ] **Step 2: Run and observe missing module**

Run: `node --experimental-strip-types --test tests/story-search.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement parsing and stable serialization**

```ts
export function parseStoryLibraryFilters(input: Record<string, string | string[] | undefined>): StoryLibraryFilters {
  const hskValue = first(input.hsk);
  const hskNumber = Number(hskValue);
  return {
    query: first(input.q).trim().slice(0, 120),
    hsk: isStoryHskLevel(hskNumber) ? hskNumber : null,
    category: isStoryCategory(first(input.category)) ? first(input.category) as StoryCategory : null,
    access: first(input.access) === "free" || first(input.access) === "vip" ? first(input.access) as StoryAccessFilter : null,
    state: first(input.state) === "unread" || first(input.state) === "completed" ? first(input.state) as StoryStateFilter : null,
  };
}
```

Serialize parameters in fixed order `q`, `hsk`, `category`, `access`, `state` and omit empty/default values.

- [ ] **Step 4: Update repository predicates**

Apply title search to the indexed version projection's Chinese and Vietnamese titles. Apply level/category/access in SQL. Apply reading-state only when a user ID exists; guests requesting `state` receive unfiltered published results rather than an invented completion state.

- [ ] **Step 5: Run tests and TypeScript**

Run: `node --experimental-strip-types --test tests/story-search.test.mjs tests/story-access.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit filter behavior**

```bash
git add lib/story-search.ts lib/story-types.ts lib/story-repository.ts tests/story-search.test.mjs
git commit -m "feat: filter published story catalog"
```

---

### Task 2: Replace `/stories` with the real published library

**Files:**
- Modify: `app/stories/page.tsx`
- Create: `components/story-library.tsx`
- Create: `components/story-card.tsx`
- Create: `app/stories/loading.tsx`
- Create: `app/stories/stories.css`
- Create: `tests/story-routes.test.mjs`
- Modify: `components/community-hub-page.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `getCurrentUser`, `parseStoryLibraryFilters`, `listPublishedStories`.
- Produces: server-rendered `StoryLibrary({ items, filters, signedIn })` and `StoryCard({ item })`.
- Removes: static `contentByKind.stories` ownership from `CommunityHubPage`; other community pages remain unchanged.

- [ ] **Step 1: Add failing library route contract tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("stories route uses published repository data instead of static community cards", async () => {
  const page = await readFile(new URL("../app/stories/page.tsx", import.meta.url), "utf8");
  assert.match(page, /listPublishedStories/);
  assert.match(page, /parseStoryLibraryFilters/);
  assert.doesNotMatch(page, /CommunityHubPage/);
});

test("story cards never receive protected body or audio fields", async () => {
  const card = await readFile(new URL("../components/story-card.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(card, /sections|sentences|questions|audioAssetId|audioUrl/);
});
```

- [ ] **Step 2: Run and observe route failures**

Run: `node --experimental-strip-types --test tests/story-routes.test.mjs`

Expected: FAIL because `/stories` still renders `CommunityHubPage` and card files do not exist.

- [ ] **Step 3: Implement the server route**

```tsx
export default async function StoriesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()]);
  const filters = parseStoryLibraryFilters(params);
  const items = await listPublishedStories(filters, user?.id);
  return <StoryLibrary filters={filters} items={items} signedIn={Boolean(user)} />;
}
```

Export original metadata describing Himi's Chinese–Vietnamese HSK story library.

- [ ] **Step 4: Build semantic GET filters and real statistics**

Use a search form with GET method, labeled select controls, removable active-filter links, result count, and an empty state that preserves a “Clear filters” action. Statistics derive from the unfiltered published catalog counts returned alongside the query, not hard-coded numbers.

- [ ] **Step 5: Build metadata-only cards**

Cards show cover/fallback glyph, HSK, category label, Vietnamese/Chinese titles, summary, duration, audio badge, Free/VIP label, and progress. The CTA is “Đọc truyện”, “Đọc tiếp”, or “Xem quyền VIP” based on the card projection.

- [ ] **Step 6: Remove only the static Stories branch**

Refactor `CommunityPageKind` and `contentByKind` so `/materials`, `/tools`, `/leaderboard`, `/friends`, and `/blog` keep working. Do not delete their shared CSS or content.

- [ ] **Step 7: Add skeleton and first responsive styles**

Use reserved card/cover dimensions, a one-column mobile grid, two columns at tablet, three at desktop, and no animation that violates reduced-motion settings.

- [ ] **Step 8: Run route tests, rendered HTML tests, and build**

Run: `node --experimental-strip-types --test tests/story-routes.test.mjs tests/rendered-html.test.mjs && npm run build`

Expected: PASS.

- [ ] **Step 9: Commit the real library**

```bash
git add app/stories/page.tsx app/stories/loading.tsx app/stories/stories.css components/story-library.tsx components/story-card.tsx components/community-hub-page.tsx tests/story-routes.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: build published story library"
```

---

### Task 3: Add detail metadata and safe locked states

**Files:**
- Create: `app/stories/[slug]/page.tsx`
- Create: `app/stories/[slug]/loading.tsx`
- Create: `app/stories/not-found.tsx`
- Create: `components/story-locked.tsx`
- Create: `components/story-reader-shell.tsx`
- Modify: `tests/story-routes.test.mjs`

**Interfaces:**
- Consumes: `getPublishedStory(slug, user)` returning `not_found | locked | ready`.
- Produces: dynamic metadata, canonical URL, breadcrumb JSON-LD, locked state, reader handoff.
- Does not consume: CMS working content or preview query flags.

- [ ] **Step 1: Add failing detail safety tests**

```js
test("story detail handles not-found, locked, and ready results explicitly", async () => {
  const source = await readFile(new URL("../app/stories/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(source, /result\.kind === "not_found"/);
  assert.match(source, /result\.kind === "locked"/);
  assert.match(source, /StoryReaderShell/);
  assert.doesNotMatch(source, /preview=true|searchParams.*preview/);
});

test("locked story component has no protected content props", async () => {
  const source = await readFile(new URL("../components/story-locked.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /sections|sentences|questions|answers|audio/);
});
```

- [ ] **Step 2: Run and observe missing detail route**

Run: `node --experimental-strip-types --test --test-name-pattern="detail|locked" tests/story-routes.test.mjs`

Expected: FAIL because files are missing.

- [ ] **Step 3: Implement dynamic metadata from public projection only**

`generateMetadata` reads the published projection. Unknown/archived stories return noindex metadata. Locked stories use only title, summary, cover, HSK, and canonical URL; metadata never loads the snapshot.

- [ ] **Step 4: Implement route branches**

```tsx
const result = await getPublishedStory(slug, user);
if (result.kind === "not_found") notFound();
if (result.kind === "locked") return <StoryLocked story={result.story} signedIn={Boolean(user)} />;
return <StoryReaderShell progress={result.progress} story={result.story} />;
```

Render breadcrumb JSON-LD from public metadata. Escape JSON safely by serializing and replacing `<` with `\u003c` before `dangerouslySetInnerHTML`.

`StoryReaderShell` renders the complete authorized story as semantic static Hanzi/pinyin/translation sections and the keyword recap. It accepts the same `StoryReaderView` later consumed by the client reader, so Task 5 replaces the component without changing repository output. It never renders correct-answer flags.

- [ ] **Step 5: Build the friendly locked page and route skeletons**

Guests receive login and VIP explanation actions; signed-in free users receive the VIP action. Keep visible metadata useful and do not frame access as an application error.

- [ ] **Step 6: Run route tests and TypeScript**

Run: `node --experimental-strip-types --test tests/story-routes.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit the detail access shell**

```bash
git add app/stories/[slug] app/stories/not-found.tsx components/story-locked.tsx tests/story-routes.test.mjs
git commit -m "feat: add secure story detail routes"
```

---

### Task 4: Build the testable reader state machine

**Files:**
- Create: `lib/story-reader-state.ts`
- Create: `tests/story-reader.test.mjs`

**Interfaces:**
- Produces: `StoryReaderPreferences`, `StoryReaderState`, `StoryReaderAction`.
- Produces: `createStoryReaderState(sentenceIds, progress, preferences)`, `storyReaderReducer(state, action)`, `parseStoryReaderPreferences(value)`, `nextSentenceIndex(state, sentenceCount)`.
- Consumed by: `StoryReaderClient` and `StoryQuizClient`.

- [ ] **Step 1: Write failing reducer and preference tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createStoryReaderState, parseStoryReaderPreferences, storyReaderReducer } from "../lib/story-reader-state.ts";

test("reader resumes a valid saved sentence and clamps stale progress", () => {
  assert.equal(createStoryReaderState(["a", "b", "c"], { lastSentenceId: "b" }, null).activeIndex, 1);
  assert.equal(createStoryReaderState(["a", "b"], { lastSentenceId: "removed" }, null).activeIndex, 0);
});

test("continuous playback advances and stops at the last sentence", () => {
  let state = createStoryReaderState(["a", "b"], null, null);
  state = storyReaderReducer(state, { type: "play_all" });
  state = storyReaderReducer(state, { type: "audio_ended" });
  assert.equal(state.activeIndex, 1);
  state = storyReaderReducer(state, { type: "audio_ended" });
  assert.equal(state.playback, "idle");
});

test("reader preferences reject untrusted local storage values", () => {
  assert.deepEqual(parseStoryReaderPreferences({ showPinyin: false, showTranslation: true, speed: 1.25 }), { showPinyin: false, showTranslation: true, speed: 1.25 });
  assert.deepEqual(parseStoryReaderPreferences({ showPinyin: "no", speed: 4 }), { showPinyin: true, showTranslation: true, speed: 1 });
});
```

- [ ] **Step 2: Run and observe missing state module**

Run: `node --experimental-strip-types --test tests/story-reader.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure reducer**

Supported actions are `select`, `play_one`, `play_all`, `pause`, `audio_started`, `audio_ended`, `audio_failed`, `toggle_pinyin`, `toggle_translation`, and `set_speed`. Valid speeds are exactly `0.75`, `1`, and `1.25`.

```ts
case "audio_ended": {
  const hasNext = state.activeIndex + 1 < state.sentenceIds.length;
  if (state.playback === "continuous" && hasNext) return { ...state, activeIndex: state.activeIndex + 1, audioState: "loading" };
  return { ...state, playback: "idle", audioState: "idle" };
}
```

- [ ] **Step 4: Add error and cleanup cases**

An `audio_failed` action retains the active index, stops continuous playback, and stores a user-readable error token. Selecting a different sentence clears the error. Reducer state contains no `Audio`, DOM node, timer, or fetch object.

- [ ] **Step 5: Run focused tests**

Run: `node --experimental-strip-types --test tests/story-reader.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit the reader state machine**

```bash
git add lib/story-reader-state.ts tests/story-reader.test.mjs
git commit -m "feat: model story reader playback"
```

---

### Task 5: Implement on-demand audio delivery and the reader UI

**Files:**
- Create: `app/api/media/story-audio/[assetId]/route.ts`
- Create: `components/story-reader-client.tsx`
- Modify: `app/stories/[slug]/page.tsx`
- Delete: `components/story-reader-shell.tsx`
- Modify: `app/stories/stories.css`
- Modify: `tests/story-routes.test.mjs`
- Modify: `tests/story-reader.test.mjs`

**Interfaces:**
- Consumes: `getStoryAudioDelivery(assetId, user)`, reader reducer, authorized `StoryReaderView`.
- Produces: one-player sentence and continuous playback UI.
- Endpoint: `GET /api/media/story-audio/:assetId` → `307` short-lived signed Cloudinary URL or `404`.

- [ ] **Step 1: Add failing audio endpoint source tests**

```js
test("story audio endpoint authenticates and never exposes stored URLs directly", async () => {
  const source = await readFile(new URL("../app/api/media/story-audio/[assetId]/route.ts", import.meta.url), "utf8");
  assert.match(source, /getCurrentUser/);
  assert.match(source, /getStoryAudioDelivery/);
  assert.match(source, /status:\s*307/);
  assert.match(source, /private, no-store/);
  assert.doesNotMatch(source, /cloudinarySecureUrl/);
});
```

In the existing detail-route contract test, change the authorized branch assertion from `/StoryReaderShell/` to `/StoryReaderClient/`; keep all not-found, locked, and no-preview-query assertions unchanged.

- [ ] **Step 2: Run and observe the missing endpoint**

Run: `node --experimental-strip-types --test --test-name-pattern="audio endpoint" tests/story-routes.test.mjs`

Expected: FAIL because the endpoint is missing.

- [ ] **Step 3: Implement the protected redirect**

Validate UUID, load user and asset in parallel, call `getStoryAudioDelivery`, return `404` for every unauthorized state, and return a `307` with `Cache-Control: private, no-store`, `Location`, and `X-Content-Type-Options: nosniff` when authorized.

- [ ] **Step 4: Build one audio controller in `StoryReaderClient`**

```tsx
const audioRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => () => {
  audioRef.current?.pause();
  audioRef.current = null;
}, []);

async function playSentence(index: number, mode: "single" | "continuous") {
  const sentence = sentences[index];
  const audio = audioRef.current ?? new Audio();
  audioRef.current = audio;
  audio.src = `/api/media/story-audio/${sentence.audioAssetId}`;
  audio.playbackRate = state.preferences.speed;
  audio.onended = () => dispatch({ type: "audio_ended" });
  audio.onerror = () => dispatch({ type: "audio_failed", message: "Không thể phát câu này. Hãy thử lại." });
  dispatch({ type: mode === "continuous" ? "play_all" : "play_one", index });
  await audio.play();
}
```

The playback effect reacts to continuous `activeIndex` advancement without creating a second player. Abort stale playback with a monotonically increasing request token.

Replace `StoryReaderShell` in `app/stories/[slug]/page.tsx` with `StoryReaderClient`, then delete the shell after the client renders every semantic text/keyword state the shell provided.

- [ ] **Step 5: Render accessible reader controls and sentence rows**

Use buttons with `aria-pressed` for pinyin/translation, a labeled speed select, an `aria-live="polite"` status, `aria-current` on the active sentence, and keyboard shortcuts only when focus is not in an input/button/select. Space activates the focused sentence; ArrowUp/ArrowDown moves focus.

- [ ] **Step 6: Implement curated keyword cards**

Only known keyword ranges/labels from the snapshot render as buttons. The popover shows Hanzi, pinyin, and Vietnamese meaning, returns focus to its trigger when closed, and closes on Escape/outside pointer.

- [ ] **Step 7: Persist safe local preferences**

Read `himi.story.reader.preferences.v1` after hydration, parse defensively, and write only `{ showPinyin, showTranslation, speed }`. Do not store story content or signed URLs.

- [ ] **Step 8: Run reader, route, lint, and build checks**

Run: `node --experimental-strip-types --test tests/story-reader.test.mjs tests/story-routes.test.mjs && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 9: Commit the reader**

```bash
git add app/api/media/story-audio/[assetId]/route.ts components/story-reader-client.tsx components/story-reader-shell.tsx app/stories/[slug]/page.tsx app/stories/stories.css tests/story-routes.test.mjs tests/story-reader.test.mjs
git commit -m "feat: add bilingual story reader"
```

---

### Task 6: Save reading progress and submit server-scored quizzes

**Files:**
- Create: `app/api/progress/story/route.ts`
- Create: `app/api/progress/story/quiz/route.ts`
- Create: `components/story-quiz-client.tsx`
- Modify: `components/story-reader-client.tsx`
- Modify: `tests/story-routes.test.mjs`
- Modify: `tests/story-reader.test.mjs`

**Interfaces:**
- Consumes: `saveStoryReadingPosition`, `submitStoryQuiz`, `isSameOriginRequest`, current user.
- Progress body: `{ storyId, version, sentenceId }`; authentication is required.
- Quiz body: `{ storySlug, submissionId, answerIndexes }`; guests may submit only a published free story and receive no persistence/XP.
- Produces: persisted resume, result explanations, best score, attempt count, completion, and one-time XP display.

- [ ] **Step 1: Add failing API security checks**

```js
test("story progress requires auth while guest quiz remains server-scored", async () => {
  const [progress, quiz] = await Promise.all([
    readFile(new URL("../app/api/progress/story/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/progress/story/quiz/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(progress, /isSameOriginRequest/);
  assert.match(progress, /getCurrentUser/);
  assert.match(progress, /status:\s*401/);
  assert.match(quiz, /isSameOriginRequest/);
  assert.match(quiz, /getCurrentUser/);
  assert.doesNotMatch(quiz, /if\s*\(!user\).*status:\s*401/s);
  assert.match(quiz, /submitStoryQuiz/);
  assert.doesNotMatch(quiz, /correctOption.*request|body.*correctOption/);
});
```

- [ ] **Step 2: Run and observe missing APIs**

Run: `node --experimental-strip-types --test --test-name-pattern="progress APIs" tests/story-routes.test.mjs`

Expected: FAIL because the route files are missing.

- [ ] **Step 3: Implement bounded route handlers**

Both handlers reject cross-origin requests with 403. Progress rejects anonymous requests with 401 and validates UUIDs/current version. Quiz validates UUID `submissionId`, exactly three integer indexes in the range 0–5, and a slug up to 160 characters; server repository resolves actual questions and answers. With no user, `submitStoryQuiz` permits only a published free story, returns score/explanations with `xpEarned: 0`, and performs no insert. A locked or unpublished guest submission returns 404 so it cannot probe protected questions.

- [ ] **Step 4: Add debounced position saving**

In the authenticated reader, schedule a save 750ms after the active sentence changes. Cancel the timer on another change/unmount. On page hide, flush a pending valid position with the same JSON `fetch` request and `keepalive: true`. Guests do not call the endpoint.

- [ ] **Step 5: Build quiz selection and submission UI**

Store only selected option indexes and current result in component state. Require all three selections before enabling submit. Generate one `crypto.randomUUID()` per submission attempt and reuse it if the network response is uncertain; generate a new ID only after a definitive response or explicit retake.

```tsx
const response = await fetch("/api/progress/story/quiz", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ storySlug, submissionId: submissionIdRef.current, answerIndexes }),
});
```

Guests and authenticated learners both submit to the endpoint. The reader payload contains option IDs/text but no `isCorrect` flags; every result comes from server-owned answers. Guest results receive `xpEarned: 0` and no database write.

- [ ] **Step 6: Render result and recommendation states**

Show score, passed/try-again text, explanation per question, best score, one-time XP when nonzero, and a link to the recommended accessible story. Use explicit “Đúng”/“Chưa đúng” text and focus the result heading after submission.

On a network or 5xx failure, keep all selected answers and the current `submissionId`, show a retry action, and do not switch to the result state. On a definitive 4xx validation/access response, show the server message, keep selections for review, and create a new submission ID only when the learner explicitly starts a new attempt.

- [ ] **Step 7: Run focused tests and full build**

Run: `node --experimental-strip-types --test tests/story-reader.test.mjs tests/story-routes.test.mjs tests/story-progress.test.mjs && npm run build`

Expected: PASS.

- [ ] **Step 8: Commit progress and quiz UI**

```bash
git add app/api/progress/story components/story-quiz-client.tsx components/story-reader-client.tsx tests/story-routes.test.mjs tests/story-reader.test.mjs
git commit -m "feat: complete stories with quizzes"
```

---

### Task 7: Add sitemap, accessibility, and performance regression coverage

**Files:**
- Create: `app/sitemap.ts`
- Modify: `app/stories/stories.css`
- Modify: `components/story-library.tsx`
- Modify: `components/story-reader-client.tsx`
- Modify: `components/story-quiz-client.tsx`
- Modify: `tests/story-routes.test.mjs`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `listPublishedStorySlugs()` projection from `lib/story-repository.ts`.
- Produces: sitemap entries only for current published, non-archived story slugs.
- Produces: final responsive/accessibility/performance acceptance checks.

- [ ] **Step 1: Add failing sitemap and no-preload checks**

```js
test("story sitemap uses published slugs and library does not preload audio", async () => {
  const [sitemap, library, reader] = await Promise.all([
    readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8"),
    readFile(new URL("../components/story-library.tsx", import.meta.url), "utf8"),
    readFile(new URL("../components/story-reader-client.tsx", import.meta.url), "utf8"),
  ]);
  assert.match(sitemap, /listPublishedStorySlugs/);
  assert.doesNotMatch(library, /new Audio|<audio|story-audio/);
  assert.doesNotMatch(reader, /sentences\.map\([^)]*<audio/);
});
```

- [ ] **Step 2: Run and observe sitemap failure**

Run: `node --experimental-strip-types --test --test-name-pattern="sitemap" tests/story-routes.test.mjs`

Expected: FAIL because `app/sitemap.ts` does not exist.

- [ ] **Step 3: Add dynamic sitemap entries**

Include the site root, existing public routes, `/stories`, and every published story canonical URL. Use `NEXT_PUBLIC_APP_URL` through a safe existing-or-new URL helper and exclude drafts, reviews, archives, and version URLs.

- [ ] **Step 4: Finish responsive behavior**

At 360px: one card column; reader padding at least 16px; Hanzi wraps; toolbar uses wrapped/grid controls; quiz options fill width; no fixed widths above viewport. At desktop: cap reading measure near 760px while metadata can use a wider shell.

- [ ] **Step 5: Finish accessibility behavior**

Verify heading order, landmarks, visible focus, 44px touch targets, `aria-pressed`, `aria-live`, popover focus restoration, result focus, reduced motion, and color-independent states in source and manual checks.

- [ ] **Step 6: Run complete automated verification**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`

Expected: all commands exit 0.

- [ ] **Step 7: Run a network-focused browser check**

Start: `npm run dev`

Inspect `/stories` in browser developer tools:

- initial requests contain no `/api/media/story-audio/` request
- card payload contains no sentence/question data
- opening a free story does not request audio until Play is pressed
- continuous playback requests one current sentence and advances sequentially

- [ ] **Step 8: Run responsive and keyboard checks**

Verify `/stories` and one free reader at 360×800 and 1440×900. Tab through search, filters, cards, reader controls, sentences, keyword popover, quiz, and result. Confirm Escape closes the keyword card and reduced-motion mode prevents animated scrolling.

- [ ] **Step 9: Commit SEO and quality gates**

```bash
git add app/sitemap.ts app/stories/stories.css components/story-library.tsx components/story-reader-client.tsx components/story-quiz-client.tsx tests/story-routes.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: finish stories accessibility and SEO"
```

---

## Learner Experience Completion Gate

- [ ] Guest can search/filter and read a free story without persisted progress.
- [ ] Guest and free account cannot receive a VIP snapshot or audio redirect.
- [ ] Signed-in free user resumes and completes free stories.
- [ ] VIP user reads every published story.
- [ ] Passing 2/3 completes a story; retaking never repeats XP.
- [ ] Library makes no story body/audio request.
- [ ] Reader uses one audio controller and cleans it up on navigation.
- [ ] 360px and desktop layouts pass visual inspection without overflow.
- [ ] Keyboard and screen-reader-oriented state labels are present.
- [ ] `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
