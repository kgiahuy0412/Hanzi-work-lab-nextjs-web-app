# Listening Lessons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add four lesson cards to every Listening Studio HSK level and open a ten-question listen-and-select-Hanzi session when a lesson is chosen.

**Architecture:** Keep the feature on the existing `/listening` client page. Extend the content domain with a lesson layer, move randomized question/progress logic into pure testable modules, then let `ListeningStudio` orchestrate the catalog, session, completion, speech synthesis, and local persistence states. Reuse the current application shell and Listening Studio CSS rather than creating routes or a parallel design system.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.9, Lucide React, Web Speech API, browser `localStorage`, Node test runner, CSS.

**Spec:** `docs/superpowers/specs/2026-08-28-listening-lessons-design.md`

## Global Constraints

- Keep the complete flow inside the existing `/listening` route.
- Preserve the current learner shell, sidebar, typography, colors, spacing, and responsive behavior.
- Provide exactly four lessons for each of the seven existing HSK level groups, for 28 lessons total.
- Use only the `listen-select-hanzi` exercise format in this release.
- Every session contains exactly ten questions and four unique Hanzi choices per question.
- The correct answer appears exactly once in every choice set.
- Persist completion and best score locally, but never block learning when storage is unavailable.
- Use the existing Lucide icon library; do not add handcrafted SVG or placeholder assets.
- Do not add backend persistence, new lesson routes, downloadable audio, admin authoring, or global navigation redesign.

---

## File Structure

- Modify `lib/listening-content.ts`: own level vocabulary, lesson metadata, lesson-to-word relationships, and content lookup helpers.
- Create `lib/listening-session.ts`: own deterministic round generation and unique choice construction.
- Create `lib/listening-progress.ts`: own parsing and updating versioned local lesson progress.
- Modify `components/listening-studio.tsx`: orchestrate level selection, lesson catalog, session, speech, answers, completion, and persistence.
- Modify `app/listening-studio.css`: style the lesson catalog and align the fixed Hanzi session with the approved reference on desktop and mobile.
- Create `tests/listening-session.test.mjs`: unit-test content invariants, round generation, distractors, and progress parsing/updating.
- Modify `tests/rendered-html.test.mjs`: assert that the route exposes the approved level → lesson → fixed-session source structure.

### Shared interfaces

The tasks below use these exact public interfaces:

```ts
export type ListeningExerciseType = "listen-select-hanzi";

export type ListeningLesson = {
  id: string;
  levelId: string;
  order: number;
  title: string;
  description: string;
  exerciseType: ListeningExerciseType;
  wordIds: string[];
};

export type ListeningLevel = {
  id: string;
  label: string;
  title: string;
  description: string;
  words: ListeningWord[];
  lessons: ListeningLesson[];
};

export type ListeningQuestion = {
  id: string;
  word: ListeningWord;
  choices: string[];
};

export type ListeningLessonProgress = {
  bestScore: number;
  attempts: number;
  completedAt: string | null;
};

export type ListeningProgress = Record<string, ListeningLessonProgress>;
```

---

### Task 1: Add the 28-lesson content model

**Files:**
- Modify: `lib/listening-content.ts`
- Create: `tests/listening-session.test.mjs`

**Interfaces:**
- Consumes: existing `ListeningWord` fields `id`, `hanzi`, `pinyin`, `meaning`, and `example`.
- Produces: `ListeningExerciseType`, `ListeningLesson`, `ListeningLevel.lessons`, `getListeningLevel(levelId)`, `getListeningLesson(levelId, lessonId)`, and `getListeningLessonWords(level, lesson)`.

- [ ] **Step 1: Write the failing content-invariant tests**

Create `tests/listening-session.test.mjs` with these initial tests:

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  getListeningLessonWords,
  listeningLevels,
} from "../lib/listening-content.ts";

test("listening content exposes four valid lessons for every HSK group", () => {
  assert.equal(listeningLevels.length, 7);
  assert.equal(listeningLevels.flatMap((level) => level.lessons).length, 28);

  for (const level of listeningLevels) {
    assert.equal(level.lessons.length, 4, level.id);
    assert.equal(new Set(level.lessons.map((lesson) => lesson.id)).size, 4, level.id);
    assert.ok(level.words.length >= 12, `${level.id} needs a useful word pool`);

    for (const [index, lesson] of level.lessons.entries()) {
      assert.equal(lesson.levelId, level.id);
      assert.equal(lesson.order, index + 1);
      assert.equal(lesson.exerciseType, "listen-select-hanzi");
      assert.equal(lesson.wordIds.length, 8);
      assert.equal(new Set(lesson.wordIds).size, 8);
      assert.equal(getListeningLessonWords(level, lesson).length, 8);
    }
  }
});

test("lesson word references always resolve inside their parent level", () => {
  for (const level of listeningLevels) {
    const ids = new Set(level.words.map((word) => word.id));
    for (const lesson of level.lessons) {
      assert.deepEqual(
        lesson.wordIds.filter((wordId) => !ids.has(wordId)),
        [],
        `${lesson.id} contains an unknown word`,
      );
    }
  }
});
```

- [ ] **Step 2: Run the content tests and verify they fail**

Run:

```bash
node --experimental-strip-types --test tests/listening-session.test.mjs
```

Expected: FAIL because `ListeningLevel` has no `lessons` and `getListeningLessonWords` is not exported.

- [ ] **Step 3: Add the lesson types, lookup helpers, and standard lesson builder**

In `lib/listening-content.ts`, add the shared interfaces and use this exact lesson blueprint:

```ts
const LESSON_BLUEPRINTS = [
  {
    title: "Từ vựng cơ bản",
    description: "Nghe và nhận diện những từ nền tảng của cấp độ.",
    indexes: [0, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    title: "Giao tiếp hằng ngày",
    description: "Luyện các từ thường gặp trong hội thoại hằng ngày.",
    indexes: [4, 5, 6, 7, 8, 9, 10, 11],
  },
  {
    title: "Con người và đời sống",
    description: "Bắt âm từ vựng về con người, công việc và sinh hoạt.",
    indexes: [0, 2, 4, 6, 8, 9, 10, 11],
  },
  {
    title: "Ôn tập tổng hợp",
    description: "Trộn từ trong cấp độ để củng cố phản xạ nghe.",
    indexes: [1, 3, 5, 7, 8, 9, 10, 11],
  },
] as const;

function createLessons(levelId: string, words: ListeningWord[]): ListeningLesson[] {
  return LESSON_BLUEPRINTS.map((blueprint, index) => ({
    id: `${levelId}-lesson-${index + 1}`,
    levelId,
    order: index + 1,
    title: blueprint.title,
    description: blueprint.description,
    exerciseType: "listen-select-hanzi",
    wordIds: blueprint.indexes.map((wordIndex) => words[wordIndex].id),
  }));
}

export function getListeningLevel(levelId: string): ListeningLevel | undefined {
  return listeningLevels.find((level) => level.id === levelId);
}

export function getListeningLesson(levelId: string, lessonId: string): ListeningLesson | undefined {
  return getListeningLevel(levelId)?.lessons.find((lesson) => lesson.id === lessonId);
}

export function getListeningLessonWords(level: ListeningLevel, lesson: ListeningLesson): ListeningWord[] {
  const wordsById = new Map(level.words.map((word) => [word.id, word]));
  return lesson.wordIds.flatMap((wordId) => {
    const word = wordsById.get(wordId);
    return word ? [word] : [];
  });
}
```

Build each level as a local object with `words`, then return `{ ...level, lessons: createLessons(level.id, level.words) }`. This keeps the lesson references adjacent to the content while avoiding four copies of the same vocabulary object.

- [ ] **Step 4: Expand every level to a 12-word pool**

Keep the existing eight entries and append these exact entries, including their examples:

```ts
const additionalWordsByLevel = {
  "hsk-1": [
    { id: "h1-father", hanzi: "爸爸", pinyin: "bà ba", meaning: "bố", example: "我爸爸在家。" },
    { id: "h1-mother", hanzi: "妈妈", pinyin: "mā ma", meaning: "mẹ", example: "妈妈喜欢喝茶。" },
    { id: "h1-friend", hanzi: "朋友", pinyin: "péng you", meaning: "bạn bè", example: "他是我的朋友。" },
    { id: "h1-home", hanzi: "家", pinyin: "jiā", meaning: "nhà", example: "我现在回家。" },
  ],
  "hsk-2": [
    { id: "h2-time", hanzi: "时间", pinyin: "shí jiān", meaning: "thời gian", example: "我们还有时间。" },
    { id: "h2-today", hanzi: "今天", pinyin: "jīn tiān", meaning: "hôm nay", example: "今天天气很好。" },
    { id: "h2-tomorrow", hanzi: "明天", pinyin: "míng tiān", meaning: "ngày mai", example: "我们明天见。" },
    { id: "h2-work", hanzi: "工作", pinyin: "gōng zuò", meaning: "công việc", example: "他在北京工作。" },
  ],
  "hsk-3": [
    { id: "h3-plan", hanzi: "计划", pinyin: "jì huà", meaning: "kế hoạch", example: "这个计划很清楚。" },
    { id: "h3-change", hanzi: "变化", pinyin: "biàn huà", meaning: "thay đổi", example: "城市发生了很大变化。" },
    { id: "h3-opportunity", hanzi: "机会", pinyin: "jī huì", meaning: "cơ hội", example: "这是一个好机会。" },
    { id: "h3-relationship", hanzi: "关系", pinyin: "guān xi", meaning: "mối quan hệ", example: "他们的关系很好。" },
  ],
  "hsk-4": [
    { id: "h4-situation", hanzi: "情况", pinyin: "qíng kuàng", meaning: "tình hình", example: "请介绍一下情况。" },
    { id: "h4-process", hanzi: "过程", pinyin: "guò chéng", meaning: "quá trình", example: "学习是一个过程。" },
    { id: "h4-result", hanzi: "结果", pinyin: "jié guǒ", meaning: "kết quả", example: "结果比我们想得好。" },
    { id: "h4-quality", hanzi: "质量", pinyin: "zhì liàng", meaning: "chất lượng", example: "产品质量很重要。" },
  ],
  "hsk-5": [
    { id: "h5-development", hanzi: "发展", pinyin: "fā zhǎn", meaning: "phát triển", example: "公司发展得很快。" },
    { id: "h5-management", hanzi: "管理", pinyin: "guǎn lǐ", meaning: "quản lý", example: "她负责团队管理。" },
    { id: "h5-responsibility", hanzi: "责任", pinyin: "zé rèn", meaning: "trách nhiệm", example: "每个人都有责任。" },
    { id: "h5-cooperation", hanzi: "合作", pinyin: "hé zuò", meaning: "hợp tác", example: "希望我们合作顺利。" },
  ],
  "hsk-6": [
    { id: "h6-mechanism", hanzi: "机制", pinyin: "jī zhì", meaning: "cơ chế", example: "我们要完善工作机制。" },
    { id: "h6-plan", hanzi: "方案", pinyin: "fāng àn", meaning: "phương án", example: "这个方案值得考虑。" },
    { id: "h6-challenge", hanzi: "挑战", pinyin: "tiǎo zhàn", meaning: "thách thức", example: "团队正在面对新的挑战。" },
    { id: "h6-viewpoint", hanzi: "观点", pinyin: "guān diǎn", meaning: "quan điểm", example: "我同意你的观点。" },
  ],
  "hsk-7-9": [
    { id: "h7-pattern", hanzi: "格局", pinyin: "gé jú", meaning: "cục diện", example: "行业格局正在改变。" },
    { id: "h7-paradigm", hanzi: "范式", pinyin: "fàn shì", meaning: "hệ hình", example: "技术推动了生产范式转型。" },
    { id: "h7-consensus", hanzi: "共识", pinyin: "gòng shí", meaning: "đồng thuận", example: "双方逐渐形成了共识。" },
    { id: "h7-game", hanzi: "博弈", pinyin: "bó yì", meaning: "cuộc đấu chiến lược", example: "各方仍在持续博弈。" },
  ],
} satisfies Record<string, ListeningWord[]>;
```

Append the matching array to each level’s existing `words` before calling `createLessons`.

- [ ] **Step 5: Run the content tests and verify they pass**

Run:

```bash
node --experimental-strip-types --test tests/listening-session.test.mjs
```

Expected: 2 tests PASS.

- [ ] **Step 6: Commit the content layer**

```bash
git add lib/listening-content.ts tests/listening-session.test.mjs
git commit -m "feat: add listening lesson catalog data"
```

---

### Task 2: Build deterministic questions and resilient local progress

**Files:**
- Create: `lib/listening-session.ts`
- Create: `lib/listening-progress.ts`
- Modify: `tests/listening-session.test.mjs`

**Interfaces:**
- Consumes: `ListeningLevel`, `ListeningLesson`, `ListeningWord`, and `getListeningLessonWords` from Task 1.
- Produces: `buildListeningRound(level, lesson, length?, random?)`, `LISTENING_PROGRESS_KEY`, `parseListeningProgress(raw)`, and `recordListeningResult(progress, lessonId, score, total, completedAt?)`.

- [ ] **Step 1: Add failing round-generation tests**

Append:

```js
import { buildListeningRound } from "../lib/listening-session.ts";

test("a lesson round contains ten valid questions with four unique choices", () => {
  const level = listeningLevels[0];
  const lesson = level.lessons[0];
  const round = buildListeningRound(level, lesson, 10, () => 0.25);

  assert.equal(round.length, 10);
  for (const question of round) {
    assert.equal(question.choices.length, 4);
    assert.equal(new Set(question.choices).size, 4);
    assert.equal(question.choices.filter((choice) => choice === question.word.hanzi).length, 1);
    assert.ok(lesson.wordIds.includes(question.word.id));
  }
});

test("round generation rejects lesson data that cannot supply four unique choices", () => {
  const level = {
    ...listeningLevels[0],
    words: listeningLevels[0].words.slice(0, 3),
  };
  const lesson = { ...level.lessons[0], wordIds: level.words.map((word) => word.id) };
  assert.throws(() => buildListeningRound(level, lesson), /four unique Hanzi choices/i);
});
```

- [ ] **Step 2: Add failing progress tests**

Append:

```js
import {
  parseListeningProgress,
  recordListeningResult,
} from "../lib/listening-progress.ts";

test("malformed local listening progress safely falls back to an empty record", () => {
  assert.deepEqual(parseListeningProgress(null), {});
  assert.deepEqual(parseListeningProgress("not-json"), {});
  assert.deepEqual(parseListeningProgress('{"lesson":{"bestScore":"10"}}'), {});
});

test("recording a result preserves the best score and increments attempts", () => {
  const first = recordListeningResult({}, "hsk-1-lesson-1", 7, 10, "2026-08-28T00:00:00.000Z");
  const second = recordListeningResult(first, "hsk-1-lesson-1", 5, 10, "2026-08-29T00:00:00.000Z");
  assert.deepEqual(second["hsk-1-lesson-1"], {
    bestScore: 7,
    attempts: 2,
    completedAt: "2026-08-29T00:00:00.000Z",
  });
});
```

- [ ] **Step 3: Run the focused tests and verify they fail**

Run:

```bash
node --experimental-strip-types --test tests/listening-session.test.mjs
```

Expected: the content tests pass; the new imports or assertions fail because the two modules do not exist.

- [ ] **Step 4: Implement `lib/listening-session.ts`**

Use Fisher-Yates shuffling with an injectable random function so tests are repeatable. The implementation contract is:

```ts
import {
  getListeningLessonWords,
  type ListeningLesson,
  type ListeningLevel,
  type ListeningWord,
} from "./listening-content.ts";

export type ListeningQuestion = {
  id: string;
  word: ListeningWord;
  choices: string[];
};

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function buildListeningRound(
  level: ListeningLevel,
  lesson: ListeningLesson,
  length = 10,
  random: () => number = Math.random,
): ListeningQuestion[] {
  const lessonWords = getListeningLessonWords(level, lesson);
  const uniqueHanzi = new Set(level.words.map((word) => word.hanzi));
  if (lessonWords.length === 0) throw new Error("Listening lesson has no valid words.");
  if (uniqueHanzi.size < 4) throw new Error("Listening level needs four unique Hanzi choices.");

  const targets = shuffle(lessonWords, random);
  return Array.from({ length }, (_, index) => {
    const word = targets[index % targets.length];
    const distractors = shuffle(
      level.words.filter((candidate) => candidate.hanzi !== word.hanzi),
      random,
    ).map((candidate) => candidate.hanzi);
    const choices = shuffle([...new Set([word.hanzi, ...distractors])].slice(0, 4), random);
    return { id: `${lesson.id}-question-${index + 1}-${word.id}`, word, choices };
  });
}
```

- [ ] **Step 5: Implement `lib/listening-progress.ts`**

Use a versioned storage key and strict runtime parsing:

```ts
export const LISTENING_PROGRESS_KEY = "himi-listening-progress:v1";

export type ListeningLessonProgress = {
  bestScore: number;
  attempts: number;
  completedAt: string | null;
};

export type ListeningProgress = Record<string, ListeningLessonProgress>;

function isListeningLessonProgress(value: unknown): value is ListeningLessonProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const candidate = value as Partial<ListeningLessonProgress>;
  return typeof candidate.bestScore === "number"
    && Number.isFinite(candidate.bestScore)
    && typeof candidate.attempts === "number"
    && Number.isInteger(candidate.attempts)
    && (candidate.completedAt === null || typeof candidate.completedAt === "string");
}

export function parseListeningProgress(raw: string | null): ListeningProgress {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const entries = Object.entries(value).filter(
      (entry): entry is [string, ListeningLessonProgress] => isListeningLessonProgress(entry[1]),
    );
    return entries.length === Object.keys(value).length ? Object.fromEntries(entries) : {};
  } catch {
    return {};
  }
}

export function recordListeningResult(
  progress: ListeningProgress,
  lessonId: string,
  score: number,
  total: number,
  completedAt = new Date().toISOString(),
): ListeningProgress {
  const previous = progress[lessonId];
  const boundedScore = Math.max(0, Math.min(total, Math.round(score)));
  return {
    ...progress,
    [lessonId]: {
      bestScore: Math.max(previous?.bestScore ?? 0, boundedScore),
      attempts: (previous?.attempts ?? 0) + 1,
      completedAt,
    },
  };
}
```

- [ ] **Step 6: Run the focused tests and verify they pass**

Run:

```bash
node --experimental-strip-types --test tests/listening-session.test.mjs
```

Expected: all 6 tests PASS.

- [ ] **Step 7: Commit the pure session logic**

```bash
git add lib/listening-session.ts lib/listening-progress.ts tests/listening-session.test.mjs
git commit -m "feat: add listening session engine"
```

---

### Task 3: Add the level-to-lesson catalog flow

**Files:**
- Modify: `components/listening-studio.tsx`
- Modify: `app/listening-studio.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `ListeningProgress`, `LISTENING_PROGRESS_KEY`, `parseListeningProgress`, and the 28 lessons from Tasks 1–2.
- Produces: the `.listening-lesson-section`, `.listening-lesson-grid`, and `.listening-lesson-card` UI; `selectLevel(levelId)` and a compiling catalog-stage `startLesson(lessonId)` handler that Task 4 replaces with lesson-specific question generation.

- [ ] **Step 1: Write the failing source-level flow test**

Append this test to `tests/rendered-html.test.mjs`:

```js
test("listening route flows from seven HSK groups to four lessons and one Hanzi listening session", async () => {
  const [page, studio, content, styles] = await Promise.all([
    read("app/listening/page.tsx"),
    read("components/listening-studio.tsx"),
    read("lib/listening-content.ts"),
    read("app/listening-studio.css"),
  ]);

  assert.match(page, /ListeningStudio/);
  assert.match(studio, /listening-lesson-section/);
  assert.match(studio, /currentLevel\.lessons\.map/);
  assert.match(studio, /startLesson\(lesson\.id\)/);
  assert.match(studio, /LISTENING_PROGRESS_KEY/);
  assert.match(studio, /Chọn bài luyện nghe/);
  assert.match(content, /listen-select-hanzi/);
  assert.match(styles, /\.listening-lesson-grid/);
  assert.match(styles, /\.listening-lesson-card/);
});
```

- [ ] **Step 2: Run the source-level test and verify it fails**

Run:

```bash
node --experimental-strip-types --test --test-name-pattern="listening route flows" tests/rendered-html.test.mjs
```

Expected: FAIL because the lesson catalog selectors and fixed exercise copy are absent.

- [ ] **Step 3: Refactor the intro state and imports**

In `components/listening-studio.tsx`:

- import `BookOpen`, `CircleCheck`, and `Play` from Lucide;
- keep the existing mode imports until Task 4 so this intermediate commit remains runnable;
- import `getListeningLesson` and the progress helpers;
- add `selectedLessonId: string | null`, `progress: ListeningProgress`, `catalogMessage: string`, and a `lessonSectionRef`;
- derive `currentLesson` with `getListeningLesson(selectedLevel, selectedLessonId ?? "")`.

Load progress once without breaking the page when storage is unavailable:

```ts
useEffect(() => {
  try {
    setProgress(parseListeningProgress(window.localStorage.getItem(LISTENING_PROGRESS_KEY)));
  } catch {
    setProgress({});
  }
}, []);
```

- [ ] **Step 4: Make level selection reveal the matching lesson catalog**

Use these handlers:

```ts
const revealLessonSection = () => {
  window.setTimeout(() => lessonSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
};

const selectLevel = (levelId: string) => {
  setSelectedLevel(levelId);
  setSelectedLessonId(null);
  setCatalogMessage("");
  revealLessonSection();
};
```

Change each level card to call `selectLevel(level.id)`. Change the hero CTA from starting a random round to focusing the lesson area; its label becomes `Chọn bài luyện nghe`.

Keep the current session runnable at this checkpoint with this temporary catalog handler:

```ts
const startLesson = (lessonId: string) => {
  const lesson = getListeningLesson(selectedLevel, lessonId);
  if (!lesson) {
    setCatalogMessage("Không tìm thấy bài học này. Hãy chọn lại một bài khác.");
    return;
  }
  setSelectedLessonId(lesson.id);
  setCatalogMessage("");
  startRound();
};
```

Task 4 replaces this handler with lesson-specific `ListeningQuestion[]` generation and removes the old four-mode code.

- [ ] **Step 5: Replace the four-mode marketing section with four lesson cards**

Render directly after the level picker:

```tsx
<section className="listening-lesson-section" aria-labelledby="listening-lesson-title" ref={lessonSectionRef}>
  <div className="listening-section-heading">
    <div>
      <span className="listening-section-kicker">{currentLevel.label} · 4 bài học</span>
      <h2 id="listening-lesson-title">Chọn bài luyện nghe</h2>
      <p>Nghe từng từ và chọn đúng Hán tự trong bốn đáp án.</p>
    </div>
    <span>10 câu/bài · khoảng 5 phút</span>
  </div>
  {catalogMessage ? <p className="listening-catalog-message" role="status">{catalogMessage}</p> : null}
  <div className="listening-lesson-grid">
    {currentLevel.lessons.map((lesson) => {
      const saved = progress[lesson.id];
      return (
        <article className="listening-lesson-card" key={lesson.id}>
          <div className="listening-lesson-icon"><BookOpen aria-hidden="true" size={22} /></div>
          <span>Bài {String(lesson.order).padStart(2, "0")}</span>
          <h3>{lesson.title}</h3>
          <p>{lesson.description}</p>
          <div className="listening-lesson-meta">
            <span>{lesson.wordIds.length} từ</span><span>10 câu</span>
            {saved ? <span><CircleCheck aria-hidden="true" size={15} /> Tốt nhất {saved.bestScore}/10</span> : null}
          </div>
          <button onClick={() => startLesson(lesson.id)} type="button">
            <Play aria-hidden="true" size={17} /> {saved ? "Luyện lại" : "Bắt đầu bài"}
          </button>
        </article>
      );
    })}
  </div>
</section>
```

- [ ] **Step 6: Add catalog CSS using the existing visual tokens**

Add `.listening-lesson-section` to the shared width rule. Use a four-column desktop grid, pale teal borders, white cards, and teal/coral actions:

```css
.listening-lesson-section {
  width: min(1320px, 100%);
  margin: clamp(34px, 5vw, 60px) auto 0;
  scroll-margin-top: 110px;
}

.listening-section-kicker {
  color: var(--listening-teal);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.listening-lesson-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.listening-lesson-card {
  min-width: 0;
  min-height: 286px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  border: 1px solid #dbe7e2;
  border-radius: 18px;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 14px 34px rgba(18, 75, 65, .07);
}

.listening-lesson-card > button {
  min-height: 44px;
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #fff;
  border: 0;
  border-radius: 12px;
  background: var(--listening-teal);
  font: inherit;
  font-weight: 760;
  cursor: pointer;
}

.listening-lesson-icon {
  width: 46px;
  height: 46px;
  margin-bottom: 18px;
  display: grid;
  place-items: center;
  color: var(--listening-teal);
  border-radius: 14px;
  background: #e4f6f2;
}

.listening-lesson-card > span {
  color: #789089;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.listening-lesson-card h3 {
  margin: 7px 0 0;
  color: var(--listening-ink);
  font-size: 20px;
  letter-spacing: -.02em;
}

.listening-lesson-card > p {
  margin: 9px 0 16px;
  color: var(--listening-muted);
  font-size: 13px;
  line-height: 1.55;
}

.listening-lesson-meta {
  margin-bottom: 17px;
  display: flex;
  flex-wrap: wrap;
  gap: 7px 12px;
  color: #668078;
  font-size: 12px;
  font-weight: 700;
}

.listening-lesson-meta span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.listening-lesson-card:hover {
  border-color: #9ed4ca;
  box-shadow: 0 18px 40px rgba(18, 75, 65, .11);
  transform: translateY(-2px);
}

.listening-catalog-message {
  margin: 0 0 14px;
  padding: 12px 14px;
  color: #9a4743;
  border: 1px solid #f1b4af;
  border-radius: 12px;
  background: #fff1ef;
}
```

Add `transition: border-color 180ms ease, box-shadow 180ms ease, transform 180ms ease` to `.listening-lesson-card`. Include `.listening-lesson-card > button` in the existing focus-visible selector. At `max-width: 900px`, set `.listening-lesson-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }`. At `max-width: 720px`, set `.listening-lesson-grid { grid-template-columns: 1fr; }` and `.listening-lesson-card { min-height: 0; }`.

- [ ] **Step 7: Run tests and verify the catalog task passes**

Run:

```bash
node --experimental-strip-types --test tests/listening-session.test.mjs
node --experimental-strip-types --test --test-name-pattern="listening route flows" tests/rendered-html.test.mjs
```

Expected: all focused tests PASS.

- [ ] **Step 8: Commit the catalog flow**

```bash
git add components/listening-studio.tsx app/listening-studio.css tests/rendered-html.test.mjs
git commit -m "feat: add listening lesson picker"
```

---

### Task 4: Wire the fixed Hanzi session, completion, and persistence

**Files:**
- Modify: `components/listening-studio.tsx`
- Modify: `app/listening-studio.css`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: `buildListeningRound` and `ListeningQuestion` from Task 2; `startLesson(lessonId)` from Task 3; local progress helpers from Task 2.
- Produces: a fully working level → lesson → session → results → lesson-list flow.

- [ ] **Step 1: Strengthen the failing source-level session assertions**

Add these assertions inside the listening route test from Task 3:

```js
assert.match(studio, /buildListeningRound/);
assert.match(studio, /recordListeningResult/);
assert.match(studio, /currentLesson\.title/);
assert.match(studio, /question\.choices\.map/);
assert.match(studio, /aria-valuenow=\{questionIndex \+ 1\}/);
assert.match(studio, /Danh sách bài học/);
assert.match(studio, /Không thể tạo bài luyện này/);
assert.match(studio, /Chọn Hán tự bạn vừa nghe/);
assert.doesNotMatch(studio, /MODE_SEQUENCE|ListeningMode|listening-typing-form/);
```

- [ ] **Step 2: Run the focused test and verify the new assertions fail**

Run:

```bash
node --experimental-strip-types --test --test-name-pattern="listening route flows" tests/rendered-html.test.mjs
```

Expected: FAIL until the fixed session engine and completion copy are wired into the component.

- [ ] **Step 3: Replace word-only round state with prebuilt questions**

Use:

```ts
const ROUND_LENGTH = 10;
const [round, setRound] = useState<ListeningQuestion[]>([]);
const question = round[questionIndex];
const currentWord = question?.word;
```

At the same time, remove `ListeningMode`, `MODE_SEQUENCE`, `MODE_CONTENT`, `normalizePinyin`, `normalizeHanzi`, `checkTypedAnswer`, the `FormEvent` type import, and the `AudioLines` and `Keyboard` imports. Keep `SlidersHorizontal` as the speed-control icon.

Implement `startLesson` exactly around Task 1’s lookups and Task 2’s builder:

```ts
const startLesson = (lessonId: string) => {
  const lesson = getListeningLesson(selectedLevel, lessonId);
  if (!lesson) {
    setCatalogMessage("Không tìm thấy bài học này. Hãy chọn lại một bài khác.");
    return;
  }
  try {
    const nextRound = buildListeningRound(currentLevel, lesson, ROUND_LENGTH);
    setSelectedLessonId(lesson.id);
    setRound(nextRound);
    setQuestionIndex(0);
    setScore(0);
    setAnswer("");
    setStatus("idle");
    setCatalogMessage("");
    setView("session");
    window.setTimeout(() => playWord(nextRound[0].word), 120);
  } catch {
    setCatalogMessage("Không thể tạo bài luyện này. Hãy chọn lại một bài khác.");
    setView("intro");
  }
};
```

`playWord` always speaks `word.hanzi`; remove the mode parameter and keep rates `0.58` and `0.76`.

- [ ] **Step 4: Render only the approved four-choice Hanzi interaction**

Use `question.choices.map` and compare each choice with `currentWord.hanzi`. Remove the typing form and meaning/pinyin/dictation branches. The question stage copy becomes `Chọn Hán tự bạn vừa nghe`, and the header title becomes:

```tsx
<strong>{currentLevel.label} · {currentLesson.title}</strong>
```

Make the progress bar semantic:

```tsx
<div
  aria-label={`Tiến độ ${questionIndex + 1} trên ${ROUND_LENGTH}`}
  aria-valuemax={ROUND_LENGTH}
  aria-valuemin={1}
  aria-valuenow={questionIndex + 1}
  className="listening-progress"
  role="progressbar"
>
  <span style={{ transform: `scaleX(${progress / 100})` }} />
</div>
```

Keep the large audio button, waveform, replay label, speed toggle, correct/incorrect icons and labels, and learner-paced next button from the current implementation.

- [ ] **Step 5: Preserve lesson context when navigating back**

Create:

```ts
const returnToLessons = () => {
  window.speechSynthesis?.cancel();
  setView("intro");
  setRound([]);
  setQuestionIndex(0);
  setAnswer("");
  setStatus("idle");
  revealLessonSection();
};
```

Use it for the session back button and the secondary completion button labeled `Danh sách bài học`. Do not clear `selectedLevel` or `selectedLessonId`.

- [ ] **Step 6: Save progress when question ten is completed**

When `nextQuestion` reaches the final question, the immediate `setScore` from `commitAnswer` has already rendered before the learner can press the feedback button. Save the current `score` exactly once, then update state and local storage:

```ts
const saveResult = (lessonId: string, finalScore: number) => {
  setProgress((current) => {
    const next = recordListeningResult(current, lessonId, finalScore, ROUND_LENGTH);
    try {
      window.localStorage.setItem(LISTENING_PROGRESS_KEY, JSON.stringify(next));
    } catch {
      // Storage is optional; in-memory progress still updates.
    }
    return next;
  });
};
```

Use this final branch in `nextQuestion`:

```ts
if (questionIndex === round.length - 1) {
  window.speechSynthesis?.cancel();
  if (currentLesson) saveResult(currentLesson.id, score);
  setView("complete");
  return;
}
```

The completion screen’s primary action calls `startLesson(currentLesson.id)` and is labeled `Luyện lại bài này`.

- [ ] **Step 7: Tighten session CSS to the reference**

Keep the existing white card, teal audio circle, coral progress, pale borders, two-column choices, and mobile single-column breakpoint. Update only visible mismatches found against the reference:

- use `width: min(1100px, 100%)` for `.listening-session`;
- keep the answer area inside the same card;
- maintain at least `44px` interactive targets;
- add icon-plus-label result states so color is not the only signal;
- ensure the waveform does not overflow at widths below 420px;
- keep reduced-motion rules for the waveform and transitions.

- [ ] **Step 8: Run focused tests, type checking, and lint**

Run:

```bash
node --experimental-strip-types --test tests/listening-session.test.mjs
node --experimental-strip-types --test --test-name-pattern="listening route flows" tests/rendered-html.test.mjs
npx tsc --noEmit
npm run lint
```

Expected: all tests PASS, TypeScript exits 0, and ESLint exits 0.

- [ ] **Step 9: Commit the session flow**

```bash
git add components/listening-studio.tsx app/listening-studio.css tests/rendered-html.test.mjs
git commit -m "feat: connect listening lessons to practice"
```

---

### Task 5: Full regression and visual verification

**Files:**
- Modify only files from Tasks 1–4 if verification exposes a concrete defect.

**Interfaces:**
- Consumes: the complete `/listening` implementation.
- Produces: passing repository checks and a visually verified desktop/mobile flow in the user’s in-app browser.

- [ ] **Step 1: Run the full automated suite**

Run:

```bash
npm test
npm run build
```

Expected: the full test suite passes and the production build completes without TypeScript, import, or rendering errors.

- [ ] **Step 2: Start or reuse the local development server**

Use the existing project’s `npm run dev` command. Verify the server URL from its terminal output instead of assuming a port.

- [ ] **Step 3: Verify the desktop primary journey in the user’s in-app browser**

At a desktop viewport matching the supplied browser evidence:

1. Open `/listening`.
2. Select HSK 1 and confirm exactly four lesson cards appear.
3. Select HSK 4 and confirm the cards update to HSK 4 without a route change.
4. Start lesson 2 and confirm the title contains `HSK 4 · Giao tiếp hằng ngày`.
5. Replay audio, toggle slow speed, select a wrong answer, and confirm explicit wrong feedback.
6. Continue and select a correct answer, confirming score and progress update.
7. Use back and confirm the HSK 4 lesson list remains selected.
8. Complete a lesson, confirm results, return to the catalog, and confirm the best score appears on that lesson card.
9. Reload and confirm the locally stored best score remains visible.

- [ ] **Step 4: Verify responsive and accessibility behavior**

At a mobile viewport around 390 × 844:

- level cards remain usable in two columns;
- lesson cards render in one column;
- the audio control and waveform remain inside the session card;
- answer choices render in one column;
- focus rings are visible when keyboard navigation is used;
- progress exposes `role="progressbar"` and the current numeric value;
- correct and wrong states include an icon and text label.

- [ ] **Step 5: Compare the session visually with the supplied reference**

Capture the implemented session at the same state as the reference: question 1/10, score 0, normal speed, no answer selected. Place the reference and implementation screenshots together in one comparison view. Check card width, header alignment, progress thickness, audio-button scale, waveform position, vertical spacing, choice dimensions, borders, radii, font weight, and mobile overflow. Fix concrete mismatches, then capture and compare once more.

- [ ] **Step 6: Re-run checks after any visual fixes**

Run:

```bash
node --experimental-strip-types --test tests/listening-session.test.mjs
node --experimental-strip-types --test --test-name-pattern="listening route flows" tests/rendered-html.test.mjs
npx tsc --noEmit
npm run lint
npm run build
```

Expected: every command exits 0.

- [ ] **Step 7: Commit verification fixes if any files changed**

```bash
git add lib/listening-content.ts lib/listening-session.ts lib/listening-progress.ts components/listening-studio.tsx app/listening-studio.css tests/listening-session.test.mjs tests/rendered-html.test.mjs
git commit -m "fix: polish listening lesson experience"
```

If verification required no file changes, do not create an empty commit.
