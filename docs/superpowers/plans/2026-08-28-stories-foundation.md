# Himi Stories Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the tested Stories domain, PostgreSQL schema, immutable published versions, access rules, progress/quiz persistence, and protected Cloudinary audio foundation.

**Architecture:** Authoring data stays normalized in story-owned tables, while immutable `story_versions` snapshots are the only public reading source. Pure domain functions own validation, scoring, readiness, and access decisions; Drizzle repositories own database queries and transactions; Cloudinary delivery remains behind entitlement-aware server code.

**Tech Stack:** Node.js 22.13+, TypeScript 5.9, Next.js 16 App Router, React 19, Drizzle ORM 0.45, PostgreSQL, Cloudinary, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-stories-design.md`

## Global Constraints

- Do not copy Hanbeego story text, titles, characters, artwork, or visual identity.
- Keep Stories independent from course/lesson and practice tables.
- Support HSK values 1–9 in the domain; expose only HSK 1–3 in the first learner release.
- Public reads use immutable published versions and never working authoring rows.
- Free/VIP, publication, quiz scoring, progress identity, and audio authorization are enforced on the server.
- Every publishable sentence requires non-empty Hanzi, pinyin, Vietnamese translation, and approved audio.
- Every publishable story requires exactly three valid questions and at least one keyword.
- Passing means at least two correct answers out of three.
- Completion XP is awarded once per user/story, even under duplicate or concurrent submissions.
- Do not introduce a new runtime dependency unless the existing stack cannot provide the behavior.
- Follow TDD: failing test, observed failure, minimal implementation, passing test, focused commit.
- The worktree already contains unrelated user changes; stage only files listed by the current task.

---

## File Structure

- `lib/story-types.ts` — shared learner, snapshot, progress, quiz, and filter types.
- `lib/story-domain.ts` — pure level/category guards, readiness assessment, scoring, and completion constants.
- `lib/story-version.ts` — creation and defensive parsing of immutable story snapshots.
- `lib/story-access.ts` — pure access decision plus database-backed VIP evaluation.
- `lib/story-repository.ts` — published catalog/detail reads and progress lookup.
- `lib/story-progress-repository.ts` — progress upsert and transactional quiz submission.
- `lib/story-audio-review.ts` — story audio states, issues, labels, and reviewer permission checks.
- `lib/story-audio-validation.ts` — audio limits and validation helpers.
- `lib/cloudinary-credentials.ts` — shared Cloudinary credential/configuration boundary.
- `lib/cloudinary-story-audio.ts` — authenticated story upload verification and expiring delivery URLs.
- `lib/story-audio-repository.ts` — entitlement-aware audio asset lookup.
- `db/schema.ts` — Drizzle story tables, enums, indexes, and constraints.
- `drizzle/0014_stories_foundation.sql` — generated PostgreSQL migration.
- `drizzle/meta/0014_snapshot.json` and `drizzle/meta/_journal.json` — generated migration metadata.
- `tests/story-domain.test.mjs` — domain/readiness/scoring tests.
- `tests/story-schema.test.mjs` — table and column contract tests.
- `tests/story-version.test.mjs` — snapshot parser tests.
- `tests/story-access.test.mjs` — access matrix tests.
- `tests/story-progress.test.mjs` — completion/XP decision tests.
- `tests/story-audio.test.mjs` — audio validation, review, and Cloudinary verification tests.
- `tests/story-repository.integration.test.mjs` — PostgreSQL publication, access, progress, quiz, and audio boundaries.

---

### Task 1: Define the Stories domain contract

**Files:**
- Create: `lib/story-types.ts`
- Create: `lib/story-domain.ts`
- Create: `tests/story-domain.test.mjs`

**Interfaces:**
- Produces: `StoryHskLevel`, `StoryCategory`, `StoryAccessState`, `StoryVersionSnapshot`, `StoryCatalogItem`, `StoryDetailResult`, `StoryProgressView`, `StoryQuizResult`, `StoryRecommendation`.
- Produces: `isStoryHskLevel(value)`, `isStoryCategory(value)`, `assessStoryReadiness(input)`, `scoreStoryQuiz(answerIndexes, questions)`, `STORY_COMPLETION_XP`.
- Consumed by: every later foundation, CMS, learner, and content task.

- [ ] **Step 1: Write the failing domain tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  STORY_COMPLETION_XP,
  assessStoryReadiness,
  isStoryCategory,
  isStoryHskLevel,
  scoreStoryQuiz,
} from "../lib/story-domain.ts";

const readyStory = {
  titleVi: "Ca sáng đầu tiên",
  titleZh: "第一次上早班",
  summaryVi: "An bắt đầu ca làm đầu tiên.",
  hskLevel: 1,
  category: "office",
  isFree: true,
  sections: [{
    titleVi: "Buổi sáng",
    sentences: [{ hanzi: "安今天上早班。", pinyin: "Ān jīntiān shàng zǎobān.", translationVi: "Hôm nay An làm ca sáng.", audioReviewStatus: "approved" }],
  }],
  keywords: [{ hanzi: "早班", pinyin: "zǎobān", meaningVi: "ca sáng" }],
  questions: [0, 1, 2].map((index) => ({
    promptVi: `Câu ${index + 1}`,
    explanationVi: "Giải thích",
    options: [{ text: "Đúng", isCorrect: true }, { text: "Sai", isCorrect: false }],
  })),
};

test("story levels and categories are bounded", () => {
  assert.equal(isStoryHskLevel(1), true);
  assert.equal(isStoryHskLevel(9), true);
  assert.equal(isStoryHskLevel(0), false);
  assert.equal(isStoryCategory("logistics"), true);
  assert.equal(isStoryCategory("unknown"), false);
});

test("readiness requires complete sentences, approved audio, keywords, and exactly three valid questions", () => {
  assert.equal(assessStoryReadiness(readyStory).ready, true);
  assert.equal(assessStoryReadiness({ ...readyStory, questions: readyStory.questions.slice(0, 2) }).ready, false);
  const missingAudio = structuredClone(readyStory);
  missingAudio.sections[0].sentences[0].audioReviewStatus = "pending";
  assert.equal(assessStoryReadiness(missingAudio).ready, false);
});

test("two correct answers pass and completion XP has one configured value", () => {
  const questions = readyStory.questions.map((question) => ({ ...question, correctOption: 0 }));
  assert.deepEqual(scoreStoryQuiz([0, 1, 0], questions), { correctAnswers: 2, totalQuestions: 3, passed: true });
  assert.equal(STORY_COMPLETION_XP, 100);
});
```

- [ ] **Step 2: Run the new test and observe the missing-module failure**

Run: `node --experimental-strip-types --test tests/story-domain.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `lib/story-domain.ts`.

- [ ] **Step 3: Create the domain types and pure functions**

```ts
// lib/story-domain.ts
export const storyHskLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const storyCategories = ["daily-life", "office", "sales", "service", "logistics", "production"] as const;
export const STORY_COMPLETION_XP = 100;

export function isStoryHskLevel(value: unknown): value is StoryHskLevel {
  return typeof value === "number" && storyHskLevels.includes(value as StoryHskLevel);
}

export function isStoryCategory(value: unknown): value is StoryCategory {
  return typeof value === "string" && storyCategories.includes(value as StoryCategory);
}

export function scoreStoryQuiz(answerIndexes: number[], questions: StoryQuestionForScoring[]) {
  const correctAnswers = questions.reduce(
    (total, question, index) => total + Number(answerIndexes[index] === question.correctOption),
    0,
  );
  return { correctAnswers, totalQuestions: questions.length, passed: questions.length === 3 && correctAnswers >= 2 };
}
```

Define `StoryReadinessItem` IDs exactly as `metadata`, `sections`, `sentences`, `audio`, `keywords`, `questions`, and `answers`. `assessStoryReadiness` returns `{ ready, passed, items }` and never throws for malformed arrays.

- [ ] **Step 4: Run the focused domain tests**

Run: `node --experimental-strip-types --test tests/story-domain.test.mjs`

Expected: PASS, 3 tests.

- [ ] **Step 5: Run the existing pure-domain suite**

Run: `node --experimental-strip-types --test --test-name-pattern="admin|practice|game" tests/*.test.mjs`

Expected: PASS with no regression in existing validation/workflow helpers.

- [ ] **Step 6: Commit the domain contract**

```bash
git add lib/story-types.ts lib/story-domain.ts tests/story-domain.test.mjs
git commit -m "feat: define stories domain contract"
```

---

### Task 2: Add the normalized Stories schema and migration

**Files:**
- Modify: `db/schema.ts`
- Create: `drizzle/0014_stories_foundation.sql`
- Create: `drizzle/meta/0014_snapshot.json`
- Modify: `drizzle/meta/_journal.json`
- Create: `tests/story-schema.test.mjs`

**Interfaces:**
- Consumes: `contentStatus`, `userRole`, and `users` from the existing schema.
- Produces: `stories`, `storySections`, `storySentences`, `storyAudioAssets`, `storyKeywords`, `storyQuestions`, `storyQuestionOptions`, `storyVersions`, `storyProgress`, `storyQuizAttempts`.
- Produces: `storyAudioReviewStatus` enum with `pending | approved | re_record`.

- [ ] **Step 1: Write the failing schema contract test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { getTableColumns, getTableName } from "drizzle-orm";
import {
  stories,
  storyAudioAssets,
  storyProgress,
  storyQuizAttempts,
  storySections,
  storySentences,
  storyVersions,
} from "../db/schema.ts";

test("stories schema exposes isolated normalized authoring and progress tables", () => {
  assert.equal(getTableName(stories), "stories");
  assert.equal(getTableName(storySections), "story_sections");
  assert.equal(getTableName(storySentences), "story_sentences");
  assert.equal(getTableName(storyAudioAssets), "story_audio_assets");
  assert.equal(getTableName(storyVersions), "story_versions");
  assert.equal(getTableName(storyProgress), "story_progress");
  assert.equal(getTableName(storyQuizAttempts), "story_quiz_attempts");
  assert.deepEqual(
    ["slug", "hskLevel", "category", "isFree", "status", "publishedVersion"].every((key) => key in getTableColumns(stories)),
    true,
  );
});
```

- [ ] **Step 2: Run the schema test and observe missing exports**

Run: `node --experimental-strip-types --test tests/story-schema.test.mjs`

Expected: FAIL because the story tables are not exported.

- [ ] **Step 3: Add the enum and tables to `db/schema.ts`**

Use UUID primary keys and these ownership rules:

```ts
export const storyAudioReviewStatus = pgEnum("story_audio_review_status", ["pending", "approved", "re_record"]);

export const stories = pgTable("stories", {
  id: uuid("id").defaultRandom().primaryKey(),
  authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
  reviewerId: uuid("reviewer_id").references(() => users.id, { onDelete: "set null" }),
  slug: varchar("slug", { length: 160 }).notNull(),
  titleVi: varchar("title_vi", { length: 200 }).notNull(),
  titleZh: varchar("title_zh", { length: 200 }).notNull(),
  summaryVi: text("summary_vi").notNull(),
  hskLevel: integer("hsk_level").notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  estimatedMinutes: integer("estimated_minutes").notNull().default(5),
  coverUrl: text("cover_url"),
  isFree: boolean("is_free").notNull().default(false),
  status: contentStatus("status").notNull().default("draft"),
  reviewPriority: varchar("review_priority", { length: 16 }).notNull().default("normal"),
  reviewDueAt: timestamp("review_due_at", { withTimezone: true }),
  reviewRequestedAt: timestamp("review_requested_at", { withTimezone: true }),
  reviewNotes: text("review_notes"),
  publishedVersion: integer("published_version"),
  sortOrder: integer("sort_order").notNull().default(0),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  uniqueIndex("stories_slug_uq").on(table.slug),
  index("stories_status_published_idx").on(table.status, table.publishedAt),
  index("stories_catalog_idx").on(table.hskLevel, table.category, table.isFree, table.sortOrder),
]);
```

Add foreign keys with `cascade` from story → authoring children, `restrict` from sentence → attached audio, and `cascade` from user/story → progress and attempts. Add a partial unique index on `(userId, storyId)` where `xpEarned > 0` so at most one quiz attempt can award completion XP.

Use these exact remaining table contracts:

```ts
storySections: id, storyId, titleVi, titleZh nullable, sortOrder
storySentences: id, sectionId, speaker nullable, hanzi, pinyin, translationVi, audioAssetId nullable, sortOrder
storyAudioAssets: id, originalName, mimeType, sizeBytes, durationMs nullable, checksumSha256,
  cloudinaryAssetId, cloudinaryPublicId, cloudinaryVersion, cloudinaryFormat,
  reviewStatus, reviewIssues jsonb, reviewNotes nullable, reviewedBy nullable,
  reviewedAt nullable, createdBy nullable, createdAt
storyKeywords: id, storyId, sentenceId nullable, hanzi, pinyin, meaningVi, sortOrder
storyQuestions: id, storyId, promptVi, promptZh nullable, explanationVi, sortOrder
storyQuestionOptions: id, questionId, text, isCorrect, sortOrder
storyVersions: id, storyId, version, hskLevel, category, isFree, titleVi, titleZh,
  summaryVi, coverUrl nullable, estimatedMinutes, snapshot jsonb, createdBy, createdAt
storyProgress: userId, storyId, publishedVersion, lastSentenceId nullable, bestScore,
  attemptCount, completedAt nullable, lastOpenedAt
storyQuizAttempts: id, userId, storyId, submissionId, publishedVersion, answers jsonb,
  correctAnswers, totalQuestions, passed, xpEarned, completedAt
```

Apply a primary key to `(storyProgress.userId, storyProgress.storyId)`, a unique index to `(storyQuizAttempts.userId, storyQuizAttempts.submissionId)`, and the partial first-XP index:

```ts
uniqueIndex("story_quiz_attempts_first_xp_uq")
  .on(table.userId, table.storyId)
  .where(sql`${table.xpEarned} > 0`)
```

- [ ] **Step 4: Run the schema test**

Run: `node --experimental-strip-types --test tests/story-schema.test.mjs`

Expected: PASS.

- [ ] **Step 5: Generate the named migration**

Run: `npm run db:generate -- --name stories_foundation`

Expected: creates `drizzle/0014_stories_foundation.sql`, `drizzle/meta/0014_snapshot.json`, and updates the journal. If Drizzle selects the next numeric prefix rather than `0014`, use the generated prefix consistently and update this plan's tracking note before committing.

- [ ] **Step 6: Inspect migration safety**

Run: `rg -n "DROP TABLE|DROP COLUMN|story_|stories" drizzle/0014_stories_foundation.sql`

Expected: story table and index creation is present; no existing table or column is dropped.

- [ ] **Step 7: Run schema and TypeScript verification**

Run: `node --experimental-strip-types --test tests/story-schema.test.mjs && npx tsc --noEmit`

Expected: both commands exit 0.

- [ ] **Step 8: Commit the schema**

```bash
git add db/schema.ts drizzle/0014_stories_foundation.sql drizzle/meta/0014_snapshot.json drizzle/meta/_journal.json tests/story-schema.test.mjs
git commit -m "feat: add stories database schema"
```

---

### Task 3: Build immutable story snapshot validation

**Files:**
- Create: `lib/story-version.ts`
- Create: `tests/story-version.test.mjs`

**Interfaces:**
- Consumes: `StoryVersionSnapshot` and nested types from `lib/story-types.ts`.
- Produces: `parseStoryVersionSnapshot(value: unknown): StoryVersionSnapshot | null`.
- Produces: `createStoryVersionSnapshot(input: StoryWorkingContent): StoryVersionSnapshot`.
- Consumed by: CMS publication, public repository, progress resume, content seeding.

- [ ] **Step 1: Write failing snapshot tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { createStoryVersionSnapshot, parseStoryVersionSnapshot } from "../lib/story-version.ts";

const working = {
  slug: "ca-sang-dau-tien",
  titleVi: "Ca sáng đầu tiên",
  titleZh: "第一次上早班",
  summaryVi: "An bắt đầu ca sáng.",
  hskLevel: 1,
  category: "office",
  estimatedMinutes: 5,
  coverUrl: null,
  isFree: true,
  sections: [{ id: "section-1", titleVi: "Buổi sáng", titleZh: null, sortOrder: 0, sentences: [{
    id: "sentence-1", speaker: "An", hanzi: "我今天上早班。", pinyin: "Wǒ jīntiān shàng zǎobān.", translationVi: "Hôm nay tôi làm ca sáng.", audioAssetId: "audio-1", sortOrder: 0,
  }] }],
  keywords: [{ id: "keyword-1", sentenceId: "sentence-1", hanzi: "早班", pinyin: "zǎobān", meaningVi: "ca sáng", sortOrder: 0 }],
  questions: [0, 1, 2].map((index) => ({ id: `question-${index}`, promptVi: `Câu ${index + 1}`, promptZh: null, explanationVi: "Giải thích", sortOrder: index, options: [{ id: `a-${index}`, text: "A", isCorrect: true, sortOrder: 0 }, { id: `b-${index}`, text: "B", isCorrect: false, sortOrder: 1 }] })),
};

test("story snapshot round-trips with stable ordered content", () => {
  const snapshot = createStoryVersionSnapshot(working);
  assert.deepEqual(parseStoryVersionSnapshot(structuredClone(snapshot)), snapshot);
});

test("story snapshot rejects missing protected content and ambiguous answers", () => {
  const snapshot = createStoryVersionSnapshot(working);
  snapshot.sections[0].sentences[0].audioAssetId = "";
  assert.equal(parseStoryVersionSnapshot(snapshot), null);
  const ambiguous = createStoryVersionSnapshot(working);
  ambiguous.questions[0].options[1].isCorrect = true;
  assert.equal(parseStoryVersionSnapshot(ambiguous), null);
});
```

- [ ] **Step 2: Run and observe the missing-module failure**

Run: `node --experimental-strip-types --test tests/story-version.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement defensive parsing and deterministic ordering**

```ts
export function createStoryVersionSnapshot(input: StoryWorkingContent): StoryVersionSnapshot {
  return {
    ...pickPublicMetadata(input),
    sections: [...input.sections]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((section) => ({ ...section, sentences: [...section.sentences].sort((a, b) => a.sortOrder - b.sortOrder) })),
    keywords: [...input.keywords].sort((a, b) => a.sortOrder - b.sortOrder),
    questions: [...input.questions]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((question) => ({ ...question, options: [...question.options].sort((a, b) => a.sortOrder - b.sortOrder) })),
  };
}
```

The parser must validate every scalar, HSK/category, exactly three questions, one correct option per question, unique IDs, keyword sentence references, non-empty audio IDs, and sorted integer orders. It must return `null` rather than throw on untrusted JSON.

- [ ] **Step 4: Run snapshot and domain tests**

Run: `node --experimental-strip-types --test tests/story-version.test.mjs tests/story-domain.test.mjs`

Expected: PASS.

- [ ] **Step 5: Commit snapshot support**

```bash
git add lib/story-version.ts tests/story-version.test.mjs
git commit -m "feat: validate immutable story versions"
```

---

### Task 4: Implement story access and published read repositories

**Files:**
- Create: `lib/story-access.ts`
- Create: `lib/story-repository.ts`
- Create: `tests/story-access.test.mjs`

**Interfaces:**
- Consumes: `hasActiveVipAccess(userId, database?)` from `lib/lesson-access.ts`.
- Produces: `resolveStoryAccess(input): StoryAccessState` with `free | vip | locked | preview | unavailable`.
- Produces: `getStoryAccess({ isFree, published, user, preview }, database?)`.
- Produces: `listPublishedStories(filters, userId?, database?): Promise<StoryCatalogItem[]>`.
- Produces: `getPublishedStory(slug, user, database?): Promise<StoryDetailResult>`.
- Produces: `getStoryProgress(userId, storyId, database?): Promise<StoryProgressView | null>`.

- [ ] **Step 1: Write the failing access matrix test**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { resolveStoryAccess } from "../lib/story-access.ts";

test("story access keeps unpublished and VIP bodies protected", () => {
  assert.equal(resolveStoryAccess({ published: false, isFree: true, signedIn: false, hasVip: false, staffPreview: false }), "unavailable");
  assert.equal(resolveStoryAccess({ published: true, isFree: true, signedIn: false, hasVip: false, staffPreview: false }), "free");
  assert.equal(resolveStoryAccess({ published: true, isFree: false, signedIn: true, hasVip: false, staffPreview: false }), "locked");
  assert.equal(resolveStoryAccess({ published: true, isFree: false, signedIn: true, hasVip: true, staffPreview: false }), "vip");
  assert.equal(resolveStoryAccess({ published: false, isFree: false, signedIn: true, hasVip: false, staffPreview: true }), "preview");
});
```

- [ ] **Step 2: Run and observe failure**

Run: `node --experimental-strip-types --test tests/story-access.test.mjs`

Expected: FAIL because `lib/story-access.ts` does not exist.

- [ ] **Step 3: Implement the pure access decision and server wrapper**

```ts
export function resolveStoryAccess(input: {
  published: boolean;
  isFree: boolean;
  signedIn: boolean;
  hasVip: boolean;
  staffPreview: boolean;
}): StoryAccessState {
  if (input.staffPreview) return "preview";
  if (!input.published) return "unavailable";
  if (input.isFree) return "free";
  if (input.signedIn && input.hasVip) return "vip";
  return "locked";
}
```

`getStoryAccess` computes `hasVip` only for a signed-in user opening a non-free published story. Staff preview is accepted only from an already-authorized CMS route and is never inferred from a query parameter.

- [ ] **Step 4: Implement explicit published repository projections**

`listPublishedStories` joins `stories` to `storyVersions` on `(storyId, publishedVersion)`, excludes `archived`, and selects only card projection columns plus the current user's progress. `getPublishedStory` first selects metadata/access, returns `{ kind: "locked", story }` without snapshot when locked, and parses the snapshot only for `free` or `vip` access.

Convert an authorized snapshot through `toStoryReaderView(snapshot)` before returning it. This projection removes every option's `isCorrect` flag; correct-answer data remains available only inside server repository/service code for quiz scoring.

```ts
export type StoryDetailResult =
  | { kind: "not_found" }
  | { kind: "locked"; story: StoryLockedView }
  | { kind: "ready"; story: StoryReaderView; progress: StoryProgressView | null };
```

- [ ] **Step 5: Run access and type checks**

Run: `node --experimental-strip-types --test tests/story-access.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 6: Commit access and read repositories**

```bash
git add lib/story-access.ts lib/story-repository.ts tests/story-access.test.mjs
git commit -m "feat: add published story access layer"
```

---

### Task 5: Add progress and idempotent quiz completion

**Files:**
- Create: `lib/story-progress.ts`
- Create: `lib/story-progress-repository.ts`
- Create: `tests/story-progress.test.mjs`

**Interfaces:**
- Consumes: `scoreStoryQuiz`, `STORY_COMPLETION_XP`, `getStoryAccess`, `storyProgress`, `storyQuizAttempts`.
- Produces: `decideStoryCompletion(previous, score): StoryCompletionDecision`.
- Produces: `saveStoryReadingPosition({ userId, storyId, version, sentenceId }, database?)`.
- Produces: `submitStoryQuiz({ userId, storySlug, submissionId, answerIndexes }, database?): Promise<StoryQuizResult>` where `userId` is `string | null`; null is accepted only for a published free story and never writes progress/attempt/XP.

- [ ] **Step 1: Write failing completion decision tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { decideStoryCompletion } from "../lib/story-progress.ts";

test("first passing attempt grants XP once", () => {
  assert.deepEqual(decideStoryCompletion({ completedAt: null, bestScore: 1 }, { correctAnswers: 2, passed: true }), {
    firstCompletion: true,
    xpEarned: 100,
    nextBestScore: 2,
  });
  assert.deepEqual(decideStoryCompletion({ completedAt: new Date("2026-08-28T00:00:00Z"), bestScore: 2 }, { correctAnswers: 3, passed: true }), {
    firstCompletion: false,
    xpEarned: 0,
    nextBestScore: 3,
  });
});

test("failing attempts update best score without completion XP", () => {
  assert.deepEqual(decideStoryCompletion({ completedAt: null, bestScore: 0 }, { correctAnswers: 1, passed: false }), {
    firstCompletion: false,
    xpEarned: 0,
    nextBestScore: 1,
  });
});
```

- [ ] **Step 2: Run and observe missing implementation**

Run: `node --experimental-strip-types --test tests/story-progress.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement the pure decision**

```ts
export function decideStoryCompletion(
  previous: { completedAt: Date | null; bestScore: number },
  score: { correctAnswers: number; passed: boolean },
): StoryCompletionDecision {
  const firstCompletion = score.passed && !previous.completedAt;
  return {
    firstCompletion,
    xpEarned: firstCompletion ? STORY_COMPLETION_XP : 0,
    nextBestScore: Math.max(previous.bestScore, score.correctAnswers),
  };
}
```

- [ ] **Step 4: Implement progress upsert validation**

`saveStoryReadingPosition` must confirm the user can read the current published version and the sentence ID exists in that parsed snapshot. Use `onConflictDoUpdate` on `(userId, storyId)` and update only `publishedVersion`, `lastSentenceId`, and `lastOpenedAt`.

- [ ] **Step 5: Implement transactional quiz submission**

For a guest submission, resolve a published free version, score from server-owned answers, and return explanations with `xpEarned: 0` without opening a transaction. For an authenticated submission, use one `writeDb(...transaction...)` call:

1. Resolve the published version and server-owned question answers.
2. Reject locked stories and malformed answer arrays.
3. Return the stored result if `(userId, submissionId)` already exists.
4. Lock or create the `(userId, storyId)` progress row.
5. Score on the server and compute the completion decision.
6. Insert the attempt and update progress.
7. Rely on the partial unique XP-award index as the final concurrency guard; on its conflict, repeat the transaction with `xpEarned: 0` and return the canonical stored state.

After scoring, query only public story-version projections to choose `StoryRecommendation`: first another accessible story at the same HSK level, then one level higher, excluding the completed story. Return `null` when no accessible candidate exists. The recommendation contains only slug, titles, HSK, access label, and duration.

- [ ] **Step 6: Run focused tests and TypeScript**

Run: `node --experimental-strip-types --test tests/story-progress.test.mjs tests/story-domain.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit progress persistence**

```bash
git add lib/story-progress.ts lib/story-progress-repository.ts tests/story-progress.test.mjs
git commit -m "feat: persist story progress and quiz results"
```

---

### Task 6: Add reviewed Cloudinary story audio and entitlement lookup

**Files:**
- Create: `lib/cloudinary-credentials.ts`
- Modify: `lib/cloudinary-practice-audio.ts`
- Create: `lib/story-audio-review.ts`
- Create: `lib/story-audio-validation.ts`
- Create: `lib/cloudinary-story-audio.ts`
- Create: `lib/story-audio-repository.ts`
- Create: `tests/story-audio.test.mjs`
- Modify: `tests/practice-audio.test.mjs`

**Interfaces:**
- Produces: `readCloudinaryCredentials`, `configureCloudinary` shared without changing practice behavior.
- Produces: `createStoryAudioUploadIntent(sentenceId, now)`, `verifyStoryAudioUploadResponse(value, sentenceId)`, `uploadStoryAudioBuffer(input)`, `createStoryAudioDeliveryUrl(publicId, format, expiresAt)`.
- Produces: `getStoryAudioDelivery(assetId, user, database?): Promise<{ url; expiresAt } | null>`.
- Produces: `canReviewStoryAudio(actor, storyStatus, reviewerId)` and bounded review issue parsing. The actor parameter is a structural `{ id: string; role: UserRole }`, so Foundation does not depend on the CMS workflow module created in the next plan.

- [ ] **Step 1: Extend tests with story-specific audio constraints**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { safeStoryAudioOriginalName } from "../lib/story-audio-validation.ts";
import { canReviewStoryAudio, parseStoryAudioReviewIssues } from "../lib/story-audio-review.ts";

test("story audio names are safe and review issues are bounded", () => {
  assert.equal(safeStoryAudioOriginalName("../câu-01.mp3"), "..-câu-01.mp3");
  assert.deepEqual(parseStoryAudioReviewIssues(["pronunciation", "unknown", "pronunciation"]), ["pronunciation"]);
});

test("only assigned reviewers or admins can approve story audio", () => {
  assert.equal(canReviewStoryAudio({ id: "reviewer-1", role: "reviewer" }, "review", "reviewer-1"), true);
  assert.equal(canReviewStoryAudio({ id: "reviewer-2", role: "reviewer" }, "review", "reviewer-1"), false);
  assert.equal(canReviewStoryAudio({ id: "admin-1", role: "admin" }, "published", null), true);
});
```

- [ ] **Step 2: Run and observe missing story audio modules**

Run: `node --experimental-strip-types --test tests/story-audio.test.mjs`

Expected: FAIL with missing-module errors.

- [ ] **Step 3: Extract shared Cloudinary credential handling without behavior changes**

Move credential parsing and `cloudinary.config` setup from `lib/cloudinary-practice-audio.ts` into `lib/cloudinary-credentials.ts`. Keep the existing practice exports as wrappers so every existing caller and test remains valid.

```ts
export function configureCloudinary(environment: NodeJS.ProcessEnv = process.env): CloudinaryCredentials {
  const credentials = readCloudinaryCredentials(environment);
  if (!credentials) throw new Error("Cloudinary chưa được cấu hình.");
  cloudinary.config({ cloud_name: credentials.cloudName, api_key: credentials.apiKey, api_secret: credentials.apiSecret, secure: true });
  return credentials;
}
```

- [ ] **Step 4: Implement authenticated story upload verification**

Story upload intents use:

```ts
const parameters = {
  allowed_formats: "mp3,wav,m4a,mp4,aac,ogg,webm",
  public_id: `hanziwork/story-audio/${sentenceId}/${randomUUID()}`,
  tags: "hanziwork,story-audio",
  timestamp: String(Math.floor(now / 1_000)),
  type: "authenticated",
};
```

Verification must require the `hanziwork/story-audio/<sentenceId>/` prefix, `resource_type: "video"`, authenticated delivery type, HTTPS Cloudinary host, maximum 8 MB, and maximum 60 seconds per sentence.

`uploadStoryAudioBuffer` is the server-side equivalent used by release tooling. It uploads with `resource_type: "video"`, `type: "authenticated"`, the story-audio prefix/tags, validates Cloudinary's signed response, and returns the same normalized asset metadata as direct-upload verification.

- [ ] **Step 5: Implement expiring delivery URL generation**

```ts
export function createStoryAudioDeliveryUrl(publicId: string, format: string, expiresAt: Date): string {
  configureCloudinary();
  return cloudinary.utils.private_download_url(publicId, format, {
    resource_type: "video",
    type: "authenticated",
    expires_at: Math.floor(expiresAt.getTime() / 1_000),
  });
}
```

Use a five-minute expiry. Do not store generated delivery URLs in PostgreSQL or logs. This follows Cloudinary's official time-limited access API for private/authenticated media: <https://cloudinary.com/documentation/control_access_to_media#providing_time_limited_access_to_private_media_assets>. Record the bandwidth tradeoff in code comments: Cloudinary advises against embedding `private_download_url` broadly because it bypasses ordinary CDN caching; the protected endpoint therefore creates it only after an explicit play request, never during library/detail rendering.

- [ ] **Step 6: Implement entitlement-aware audio lookup**

`getStoryAudioDelivery` must confirm the asset is approved and referenced by the current published version of a readable story, or that the caller is authorized staff previewing the working story. It returns `null` for unknown, unapproved, archived, locked, or unreferenced assets.

- [ ] **Step 7: Run story and existing practice audio tests**

Run: `node --experimental-strip-types --test tests/story-audio.test.mjs tests/practice-audio.test.mjs tests/practice-audio-review.test.mjs`

Expected: PASS with unchanged practice behavior.

- [ ] **Step 8: Run full static verification**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`

Expected: all commands exit 0.

- [ ] **Step 9: Commit the audio foundation**

```bash
git add lib/cloudinary-credentials.ts lib/cloudinary-practice-audio.ts lib/story-audio-review.ts lib/story-audio-validation.ts lib/cloudinary-story-audio.ts lib/story-audio-repository.ts tests/story-audio.test.mjs tests/practice-audio.test.mjs
git commit -m "feat: secure story audio delivery"
```

---

### Task 7: Prove repository boundaries against PostgreSQL

**Files:**
- Create: `tests/story-repository.integration.test.mjs`
- Create: `tests/helpers/story-integration-fixture.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: optional `database` arguments added to story read/progress/audio repositories.
- Produces: `test:stories:integration` script that runs only against the explicitly configured `.env.local` PostgreSQL database.

- [ ] **Step 1: Write the failing integration fixture test**

```js
import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { randomUUID } from "node:crypto";
import { getDb } from "../db/index.ts";
import { getPublishedStory, listPublishedStories } from "../lib/story-repository.ts";
import { submitStoryQuiz } from "../lib/story-progress-repository.ts";
import { createStoryIntegrationFixture } from "./helpers/story-integration-fixture.ts";

const db = getDb();
let fixture;
before(async () => { fixture = await createStoryIntegrationFixture(db); });
after(async () => { await fixture.cleanup(); });

test("catalog returns current versions and locked detail omits protected snapshot", async () => {
  const catalog = await listPublishedStories({ query: "", hsk: null, category: null, access: null, state: null }, undefined, db);
  assert.equal(catalog.some((item) => item.slug === fixture.freeSlug), true);
  const locked = await getPublishedStory(fixture.vipSlug, null, db);
  assert.equal(locked.kind, "locked");
  assert.equal("sections" in locked.story, false);
});

test("guest free quiz does not persist and authenticated duplicate submission awards XP once", async () => {
  const guest = await submitStoryQuiz({ userId: null, storySlug: fixture.freeSlug, submissionId: randomUUID(), answerIndexes: [0, 0, 0] }, db);
  assert.equal(guest.xpEarned, 0);
  const submissionId = randomUUID();
  const first = await submitStoryQuiz({ userId: fixture.freeUserId, storySlug: fixture.freeSlug, submissionId, answerIndexes: [0, 0, 0] }, db);
  const duplicate = await submitStoryQuiz({ userId: fixture.freeUserId, storySlug: fixture.freeSlug, submissionId, answerIndexes: [0, 0, 0] }, db);
  assert.equal(first.xpEarned, 100);
  assert.deepEqual(duplicate, first);
});
```

- [ ] **Step 2: Run and observe repository contract failures**

Run: `node --env-file=.env.local --experimental-strip-types --test tests/story-repository.integration.test.mjs`

Expected: FAIL until every repository accepts the injected database and all schema/migrations are applied.

- [ ] **Step 3: Create complete isolated PostgreSQL fixtures**

```ts
export async function createStoryIntegrationFixture(db: Database) {
  const suffix = randomUUID().slice(0, 8);
  const freeSlug = `integration-free-${suffix}`;
  const vipSlug = `integration-vip-${suffix}`;
  const [freeUser, vipUser] = await db.insert(users).values([
    { email: `story-free-${suffix}@example.test`, displayName: "Story Free", role: "learner" },
    { email: `story-vip-${suffix}@example.test`, displayName: "Story VIP", role: "learner" },
  ]).returning({ id: users.id });
  const [plan] = await db.insert(vipPlans).values({ code: `STORY_TEST_${suffix}`, name: "Story test", durationDays: 1, priceVnd: 0 }).returning({ id: vipPlans.id });
  await db.insert(subscriptions).values({ userId: vipUser.id, planId: plan.id, status: "active", startsAt: new Date(Date.now() - 60_000), endsAt: new Date(Date.now() + 86_400_000) });

  const makeSnapshot = (slug: string, isFree: boolean): StoryVersionSnapshot => ({
    slug,
    titleVi: isFree ? "Truyện kiểm thử miễn phí" : "Truyện kiểm thử VIP",
    titleZh: isFree ? "免费测试故事" : "会员测试故事",
    summaryVi: "Nội dung chỉ dùng trong kiểm thử tích hợp.",
    hskLevel: 1,
    category: "office",
    estimatedMinutes: 3,
    coverUrl: null,
    isFree,
    sections: [{ id: randomUUID(), titleVi: "Phần một", titleZh: "第一部分", sortOrder: 0, sentences: [{ id: randomUUID(), speaker: null, hanzi: "我今天上班。", pinyin: "Wǒ jīntiān shàngbān.", translationVi: "Hôm nay tôi đi làm.", audioAssetId: randomUUID(), sortOrder: 0 }] }],
    keywords: [{ id: randomUUID(), sentenceId: null, hanzi: "上班", pinyin: "shàngbān", meaningVi: "đi làm", sortOrder: 0 }],
    questions: [0, 1, 2].map((index) => ({ id: randomUUID(), promptVi: `Câu ${index + 1}`, promptZh: null, explanationVi: "Đáp án nằm trong câu chuyện.", sortOrder: index, options: [{ id: randomUUID(), text: "Đúng", isCorrect: true, sortOrder: 0 }, { id: randomUUID(), text: "Sai", isCorrect: false, sortOrder: 1 }] })),
  });

  const createdStoryIds: string[] = [];
  for (const [slug, isFree] of [[freeSlug, true], [vipSlug, false]] as const) {
    const snapshot = makeSnapshot(slug, isFree);
    snapshot.keywords[0].sentenceId = snapshot.sections[0].sentences[0].id;
    const [story] = await db.insert(stories).values({ slug, titleVi: snapshot.titleVi, titleZh: snapshot.titleZh, summaryVi: snapshot.summaryVi, hskLevel: 1, category: "office", estimatedMinutes: 3, isFree, status: "published", publishedVersion: 1, publishedAt: new Date() }).returning({ id: stories.id });
    createdStoryIds.push(story.id);
    await db.insert(storyVersions).values({ storyId: story.id, version: 1, hskLevel: 1, category: "office", isFree, titleVi: snapshot.titleVi, titleZh: snapshot.titleZh, summaryVi: snapshot.summaryVi, estimatedMinutes: 3, snapshot, createdBy: freeUser.id });
  }

  return {
    freeSlug,
    vipSlug,
    freeUserId: freeUser.id,
    vipUserId: vipUser.id,
    cleanup: async () => {
      for (const id of createdStoryIds) await db.delete(stories).where(eq(stories.id, id));
      await db.delete(users).where(inArray(users.id, [freeUser.id, vipUser.id]));
      await db.delete(vipPlans).where(eq(vipPlans.id, plan.id));
    },
  };
}
```

Import `randomUUID`, `eq`, `inArray`, the story/user/subscription tables, `Database`, and `StoryVersionSnapshot` explicitly in the helper. Cleanup order is stories → users → plan so foreign keys remain valid; user deletion cascades subscriptions/progress/attempts.

- [ ] **Step 4: Add optional database plumbing without changing production defaults**

Each repository uses the injected `Database` when supplied and falls back to `readDb`/`writeDb` otherwise. Keep the branching at the outer query/transaction boundary; do not duplicate the query body.

```ts
const run = (db: Database) => db.select(/* explicit projection */).from(stories);
return database ? run(database) : readDb(run);
```

- [ ] **Step 5: Complete publication/access/progress/quiz/audio integration cases**

Cover these database-backed cases with unique fixtures:

- draft without `publishedVersion` is absent from catalog/detail
- current published version appears even while working status is `draft`
- archived story is absent despite a version pointer
- guest/free/VIP access returns the correct discriminated result
- reader projection omits `isCorrect`
- progress upsert keeps one `(userId, storyId)` row
- duplicate `submissionId` returns the canonical attempt
- a second passing submission earns zero XP
- unapproved or unreferenced audio returns no delivery

- [ ] **Step 6: Add the dedicated package script**

```json
"test:stories:integration": "node --env-file=.env.local --experimental-strip-types --test tests/story-repository.integration.test.mjs"
```

Keep integration tests out of the default `npm test` command so environments without PostgreSQL do not fail unexpectedly; release gates must run both commands.

- [ ] **Step 7: Run unit, integration, and static verification**

Run: `npm test && npm run test:stories:integration && npm run lint && npx tsc --noEmit && npm run build`

Expected: all commands exit 0 and cleanup leaves no `integration-*` story/user rows.

- [ ] **Step 8: Commit integration coverage**

```bash
git add tests/story-repository.integration.test.mjs tests/helpers/story-integration-fixture.ts package.json lib/story-repository.ts lib/story-progress-repository.ts lib/story-audio-repository.ts
git commit -m "test: verify stories repository boundaries"
```

---

## Foundation Completion Gate

Before starting the CMS plan:

- [ ] Run `npm test` and confirm every existing and story test passes.
- [ ] Run `npm run test:stories:integration` and confirm PostgreSQL access/progress/audio boundaries pass.
- [ ] Run `npm run lint` and confirm zero errors.
- [ ] Run `npx tsc --noEmit` and confirm zero errors.
- [ ] Run `npm run build` and confirm the production build succeeds.
- [ ] Run `git status --short` and confirm only pre-existing unrelated user changes remain.
- [ ] Review `git log --oneline` and confirm Tasks 1–7 each have a focused commit.
