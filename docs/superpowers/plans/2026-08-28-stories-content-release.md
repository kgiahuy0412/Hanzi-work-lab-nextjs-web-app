# Himi Stories Content and Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Author and seed 12 original Himi stories, generate and upload sentence-level Chinese audio for review, publish the three approved free HSK 1 stories, and verify the complete release on staging.

**Architecture:** Original story source lives in typed seed bundles that are structurally validated before database writes. Database seeding creates only missing drafts so editorial changes are never overwritten. A local Edge TTS preparation script creates a checksummed manifest; a separate Cloudinary upload script attaches authenticated assets as pending review; publication remains a human reviewer action in the CMS.

**Tech Stack:** Node.js 22.13+, TypeScript 5.9, PostgreSQL/Drizzle, `@andresaya/edge-tts` through `npm exec`, ffprobe when available, Cloudinary, existing Himi CMS, Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-stories-design.md`

## Global Constraints

- Complete Foundation, CMS, and Learner Experience plans before this plan.
- Write 12 entirely original Himi stories; do not adapt or paraphrase competitor stories.
- Distribution is fixed: five HSK 1, four HSK 2, three HSK 3.
- Exactly three HSK 1 stories are free; all other stories are VIP.
- Each story has 2–3 sections, 8–15 sentences, 6–10 keywords, exactly three valid questions, and one explicit communication objective.
- Each sentence has Hanzi, tone-mark pinyin, natural Vietnamese translation, and a stable seed key.
- Generated audio is never auto-approved. A reviewer listens against Hanzi/pinyin and explicitly approves or requests re-recording.
- Do not commit generated MP3 files; commit the manifest and source content only.
- Seed commands are idempotent and never overwrite an existing CMS story.
- Publishing remains gated by the CMS readiness checklist.
- Follow TDD and use focused commits.

---

## Editorial Matrix

| HSK | Access | Slug | Vietnamese title | Chinese title | Category | Sentence target | Communication objective |
|---|---|---|---|---|---|---:|---|
| 1 | Free | `ca-sang-dau-tien` | Ca sáng đầu tiên | 第一次上早班 | office | 10 | Chào quản lý và hỏi việc cần làm |
| 1 | Free | `cuoc-hop-luc-chin-gio` | Cuộc họp lúc chín giờ | 九点的会议 | office | 9 | Xác nhận giờ và vật dụng cần mang |
| 1 | Free | `bua-trua-cung-dong-nghiep` | Bữa trưa cùng đồng nghiệp | 和同事一起吃午饭 | daily-life | 10 | Mời đi ăn và hỏi lựa chọn món |
| 1 | VIP | `chiec-the-nhan-vien-moi` | Chiếc thẻ nhân viên mới | 新工牌 | office | 8 | Hỏi nơi nhận và cách dùng thẻ |
| 1 | VIP | `goi-xe-sau-gio-lam` | Gọi xe sau giờ làm | 下班后叫车 | daily-life | 9 | Nói địa điểm đón và xác nhận xe |
| 2 | VIP | `mot-don-hang-gap` | Một đơn hàng gấp | 一份加急订单 | logistics | 12 | Xác nhận ưu tiên và hạn giao hàng |
| 2 | VIP | `vi-khach-quay-lai` | Vị khách quay lại | 回来的客人 | service | 11 | Nhận diện nhu cầu và đề xuất sản phẩm |
| 2 | VIP | `nhan-hang-o-cua-kho` | Nhận hàng ở cửa kho | 在仓库门口收货 | logistics | 12 | Đối chiếu số lượng và ghi nhận thiếu hàng |
| 2 | VIP | `doi-ca-cuoi-tuan` | Đổi ca cuối tuần | 周末换班 | production | 10 | Đề nghị đổi ca và xác nhận bàn giao |
| 3 | VIP | `bao-cao-can-sua-lai` | Báo cáo cần sửa lại | 需要修改的报告 | office | 13 | Tiếp nhận góp ý và xác nhận thời hạn sửa |
| 3 | VIP | `su-co-tren-day-chuyen` | Sự cố trên dây chuyền | 生产线上的问题 | production | 14 | Báo sự cố, dừng máy và phối hợp kiểm tra |
| 3 | VIP | `cuoc-goi-tu-khach-hang-xa` | Cuộc gọi từ khách hàng xa | 远方客户的电话 | sales | 13 | Làm rõ yêu cầu và hẹn phản hồi |

---

## File Structure

- `lib/story-seed-types.ts` — typed seed contract.
- `lib/story-seed-content.ts` — exports all 12 original story bundles.
- `tests/story-seed-content.test.mjs` — counts, uniqueness, structure, access, and text-quality invariants.
- `db/seed-stories.ts` — idempotent draft insertion transaction.
- `db/seed.ts` — calls the story seed after existing catalog/practice data.
- `scripts/generate-story-audio.ts` — local sentence MP3 generation and manifest creation.
- `scripts/upload-story-audio.ts` — verified authenticated Cloudinary upload and pending attachment.
- `scripts/audit-story-release.ts` — database/CMS release-readiness report.
- `content/story-audio/manifest.json` — checksummed generated-audio manifest.
- `.gitignore` — ignores generated story MP3 files while retaining the manifest.
- `package.json` — story content/audio/audit scripts.
- `.env.example` — documents Cloudinary requirement already used by the application.

---

### Task 1: Define and validate the seed content contract

**Files:**
- Create: `lib/story-seed-types.ts`
- Create: `lib/story-seed-content.ts`
- Create: `tests/story-seed-content.test.mjs`

**Interfaces:**
- Produces: `StorySeed`, `StorySeedSection`, `StorySeedSentence`, `StorySeedKeyword`, `StorySeedQuestion`.
- Produces: `StorySeedPlanItem` and `storySeedPlan: readonly StorySeedPlanItem[]` containing the approved 12-row editorial matrix.
- Consumes: `StoryHskLevel` and `StoryCategory`.

- [ ] **Step 1: Write failing seed collection tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { storySeedPlan } from "../lib/story-seed-content.ts";

test("initial story catalog has the approved level and access distribution", () => {
  assert.equal(storySeedPlan.length, 12);
  assert.deepEqual(storySeedPlan.reduce((counts, story) => ({ ...counts, [story.hskLevel]: (counts[story.hskLevel] ?? 0) + 1 }), {}), { 1: 5, 2: 4, 3: 3 });
  assert.equal(storySeedPlan.filter((story) => story.isFree).length, 3);
  assert.equal(storySeedPlan.every((story) => !story.isFree || story.hskLevel === 1), true);
});

test("approved story plan has unique slugs and explicit content targets", () => {
  assert.equal(new Set(storySeedPlan.map((story) => story.slug)).size, 12);
  assert.equal(storySeedPlan.every((story) => story.sentenceTarget >= 8 && story.sentenceTarget <= 15), true);
  assert.equal(storySeedPlan.every((story) => story.communicationObjectiveVi.length >= 20), true);
});
```

- [ ] **Step 2: Run and observe missing seed modules**

Run: `node --experimental-strip-types --test tests/story-seed-content.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Define the typed seed shape**

```ts
export type StorySeed = {
  slug: string;
  titleVi: string;
  titleZh: string;
  summaryVi: string;
  communicationObjectiveVi: string;
  hskLevel: StoryHskLevel;
  category: StoryCategory;
  estimatedMinutes: number;
  isFree: boolean;
  sections: StorySeedSection[];
  keywords: StorySeedKeyword[];
  questions: StorySeedQuestion[];
};

export type StorySeedPlanItem = Pick<StorySeed,
  "slug" | "titleVi" | "titleZh" | "communicationObjectiveVi" | "hskLevel" | "category" | "isFree"
> & { sentenceTarget: number };

export type StorySeedSentence = {
  key: string;
  speaker: string | null;
  hanzi: string;
  pinyin: string;
  translationVi: string;
};
```

Question options use `{ text: string; isCorrect: boolean }`; keywords use `{ sentenceKey, hanzi, pinyin, meaningVi }`.

- [ ] **Step 4: Create the 12-item `storySeedPlan` from the approved matrix**

Enter all 12 exact slugs/titles/categories/access/target values from the table above. The plan is immutable metadata and does not pretend incomplete rows are publishable `StorySeed` objects. Keep cover art outside this content plan so the learner card uses Himi's lightweight glyph/gradient fallback.

- [ ] **Step 5: Run and pass the seed-plan tests**

Run: `node --experimental-strip-types --test tests/story-seed-content.test.mjs`

Expected: PASS for distribution, uniqueness, sentence targets, and communication objectives.

- [ ] **Step 6: Commit the seed contract and approved matrix**

```bash
git add lib/story-seed-types.ts lib/story-seed-content.ts tests/story-seed-content.test.mjs
git commit -m "content: define initial story catalog"
```

---

### Task 2: Author the five original HSK 1 stories

**Files:**
- Modify: `lib/story-seed-content.ts`
- Modify: `tests/story-seed-content.test.mjs`

**Interfaces:**
- Produces: `hsk1StorySeeds: readonly StorySeed[]` with five complete entries matching the HSK 1 rows in the editorial matrix.
- Every sentence key follows `<story-slug>-sNN`, for example `ca-sang-dau-tien-s01`.

- [ ] **Step 1: Add HSK 1-specific failing expectations**

```js
test("HSK 1 stories stay short and use approved free titles", () => {
  const hsk1 = hsk1StorySeeds;
  assert.deepEqual(hsk1.filter((story) => story.isFree).map((story) => story.slug), [
    "ca-sang-dau-tien",
    "cuoc-hop-luc-chin-gio",
    "bua-trua-cung-dong-nghiep",
  ]);
  assert.equal(hsk1.every((story) => story.sections.length >= 2 && story.sections.length <= 3), true);
  assert.equal(hsk1.every((story) => story.questions.every((question) => question.options.length >= 2)), true);
});
```

- [ ] **Step 2: Run and observe incomplete HSK 1 content**

Run: `node --experimental-strip-types --test --test-name-pattern="HSK 1" tests/story-seed-content.test.mjs`

Expected: FAIL until all five HSK 1 stories are structurally complete.

- [ ] **Step 3: Write `ca-sang-dau-tien` and `cuoc-hop-luc-chin-gio`**

Use simple present-time workplace language, named speakers only where dialogue needs them, and 2–3 scenes. Keep each line independently playable. Include exactly three comprehension questions whose answers are stated or directly inferred from the story.

```ts
{
  slug: "ca-sang-dau-tien",
  titleVi: "Ca sáng đầu tiên",
  titleZh: "第一次上早班",
  summaryVi: "An đến công ty sớm, chào quản lý và hỏi công việc trong ca sáng đầu tiên.",
  communicationObjectiveVi: "Chào quản lý và hỏi việc cần làm",
  hskLevel: 1,
  category: "office",
  estimatedMinutes: 5,
  isFree: true,
  sections: [
    { titleVi: "Đến công ty", titleZh: "到公司", sentences: [
      { key: "ca-sang-dau-tien-s01", speaker: null, hanzi: "早上七点半，安到了公司。", pinyin: "Zǎoshang qī diǎn bàn, Ān dào le gōngsī.", translationVi: "Bảy giờ rưỡi sáng, An đã đến công ty." },
      { key: "ca-sang-dau-tien-s02", speaker: "An", hanzi: "经理，早上好！", pinyin: "Jīnglǐ, zǎoshang hǎo!", translationVi: "Quản lý, chào buổi sáng ạ!" },
      { key: "ca-sang-dau-tien-s03", speaker: "Quản lý", hanzi: "早上好！今天是你第一次上早班。", pinyin: "Zǎoshang hǎo! Jīntiān shì nǐ dì-yī cì shàng zǎobān.", translationVi: "Chào buổi sáng! Hôm nay là lần đầu em làm ca sáng." },
    ] },
    { titleVi: "Việc đầu tiên", titleZh: "第一件工作", sentences: [
      { key: "ca-sang-dau-tien-s04", speaker: "An", hanzi: "我今天先做什么？", pinyin: "Wǒ jīntiān xiān zuò shénme?", translationVi: "Hôm nay em làm việc gì trước ạ?" },
      { key: "ca-sang-dau-tien-s05", speaker: "Quản lý", hanzi: "你先开电脑。", pinyin: "Nǐ xiān kāi diànnǎo.", translationVi: "Em mở máy tính trước nhé." },
      { key: "ca-sang-dau-tien-s06", speaker: "Quản lý", hanzi: "然后看今天的工作表。", pinyin: "Ránhòu kàn jīntiān de gōngzuòbiǎo.", translationVi: "Sau đó xem bảng công việc hôm nay." },
      { key: "ca-sang-dau-tien-s07", speaker: "An", hanzi: "工作表在这里吗？", pinyin: "Gōngzuòbiǎo zài zhèlǐ ma?", translationVi: "Bảng công việc ở đây phải không ạ?" },
      { key: "ca-sang-dau-tien-s08", speaker: "Quản lý", hanzi: "对，在桌子上。", pinyin: "Duì, zài zhuōzi shàng.", translationVi: "Đúng rồi, ở trên bàn." },
      { key: "ca-sang-dau-tien-s09", speaker: "An", hanzi: "好的，我现在开始。", pinyin: "Hǎo de, wǒ xiànzài kāishǐ.", translationVi: "Vâng, bây giờ em bắt đầu ạ." },
      { key: "ca-sang-dau-tien-s10", speaker: "Quản lý", hanzi: "有问题就问我。", pinyin: "Yǒu wèntí jiù wèn wǒ.", translationVi: "Có vấn đề gì thì cứ hỏi tôi." },
    ] },
  ],
  keywords: [
    { sentenceKey: "ca-sang-dau-tien-s01", hanzi: "公司", pinyin: "gōngsī", meaningVi: "công ty" },
    { sentenceKey: "ca-sang-dau-tien-s03", hanzi: "早班", pinyin: "zǎobān", meaningVi: "ca sáng" },
    { sentenceKey: "ca-sang-dau-tien-s04", hanzi: "先", pinyin: "xiān", meaningVi: "trước, trước tiên" },
    { sentenceKey: "ca-sang-dau-tien-s05", hanzi: "电脑", pinyin: "diànnǎo", meaningVi: "máy tính" },
    { sentenceKey: "ca-sang-dau-tien-s06", hanzi: "然后", pinyin: "ránhòu", meaningVi: "sau đó" },
    { sentenceKey: "ca-sang-dau-tien-s06", hanzi: "工作表", pinyin: "gōngzuòbiǎo", meaningVi: "bảng công việc" },
    { sentenceKey: "ca-sang-dau-tien-s10", hanzi: "问题", pinyin: "wèntí", meaningVi: "vấn đề, câu hỏi" },
  ],
  questions: [
    { promptVi: "An đến công ty lúc mấy giờ?", explanationVi: "Câu đầu cho biết An đến lúc bảy giờ rưỡi sáng.", options: [{ text: "Bảy giờ", isCorrect: false }, { text: "Bảy giờ rưỡi", isCorrect: true }, { text: "Tám giờ", isCorrect: false }] },
    { promptVi: "Việc đầu tiên An cần làm là gì?", explanationVi: "Quản lý bảo An mở máy tính trước.", options: [{ text: "Mở máy tính", isCorrect: true }, { text: "Đi họp", isCorrect: false }, { text: "Gọi khách hàng", isCorrect: false }] },
    { promptVi: "Bảng công việc nằm ở đâu?", explanationVi: "Quản lý xác nhận bảng công việc ở trên bàn.", options: [{ text: "Trong túi", isCorrect: false }, { text: "Trên bàn", isCorrect: true }, { text: "Ngoài cửa", isCorrect: false }] },
  ],
}
```

- [ ] **Step 4: Write the remaining three HSK 1 stories**

Complete `bua-trua-cung-dong-nghiep`, `chiec-the-nhan-vien-moi`, and `goi-xe-sau-gio-lam` with the exact targets in the matrix. Keep grammar and vocabulary materially simple, avoid reproducing the sample plot or character relationships from the competitor, and use Himi workplace situations.

- [ ] **Step 5: Run the complete content validation**

Run: `node --experimental-strip-types --test tests/story-seed-content.test.mjs`

Expected: PASS for all seed-plan and HSK 1 content tests.

- [ ] **Step 6: Commit HSK 1 content**

```bash
git add lib/story-seed-content.ts tests/story-seed-content.test.mjs
git commit -m "content: author HSK 1 stories"
```

---

### Task 3: Author the seven original HSK 2–3 stories

**Files:**
- Modify: `lib/story-seed-content.ts`
- Modify: `tests/story-seed-content.test.mjs`

**Interfaces:**
- Produces: `hsk2StorySeeds`, `hsk3StorySeeds`, and `storySeeds = [...hsk1StorySeeds, ...hsk2StorySeeds, ...hsk3StorySeeds]` matching the matrix.

- [ ] **Step 1: Add level-specific failing checks**

```js
test("HSK 2 and HSK 3 content follows the approved workplace matrix", () => {
  const advanced = storySeeds.filter((story) => story.hskLevel >= 2);
  assert.deepEqual(advanced.map((story) => story.slug), [
    "mot-don-hang-gap",
    "vi-khach-quay-lai",
    "nhan-hang-o-cua-kho",
    "doi-ca-cuoi-tuan",
    "bao-cao-can-sua-lai",
    "su-co-tren-day-chuyen",
    "cuoc-goi-tu-khach-hang-xa",
  ]);
  assert.equal(advanced.every((story) => story.isFree === false), true);
  assert.equal(advanced.every((story) => story.communicationObjectiveVi.length >= 20), true);
});

test("complete story seeds have unique sentence keys and valid learning content", () => {
  assert.equal(storySeeds.length, 12);
  assert.equal(new Set(storySeeds.map((story) => story.slug)).size, 12);
  const toneMark = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/u;
  for (const story of storySeeds) {
    const sentences = story.sections.flatMap((section) => section.sentences);
    assert.equal(sentences.length >= 8 && sentences.length <= 15, true, story.slug);
    assert.equal(new Set(sentences.map((sentence) => sentence.key)).size, sentences.length, story.slug);
    assert.equal(sentences.every((sentence) => /[\p{Script=Han}]/u.test(sentence.hanzi) && toneMark.test(sentence.pinyin) && sentence.translationVi.trim()), true, story.slug);
    assert.equal(story.keywords.length >= 6 && story.keywords.length <= 10, true, story.slug);
    assert.equal(story.questions.length, 3, story.slug);
    assert.equal(story.questions.every((question) => question.options.filter((option) => option.isCorrect).length === 1), true, story.slug);
  }
});
```

- [ ] **Step 2: Run and observe incomplete advanced content**

Run: `node --experimental-strip-types --test --test-name-pattern="HSK 2 and HSK 3" tests/story-seed-content.test.mjs`

Expected: FAIL until the seven stories are complete.

- [ ] **Step 3: Write the four HSK 2 stories**

Use connected dialogue and basic workplace sequencing. Each question must be answerable from the story without outside professional knowledge. Logistics numbers/quantities must remain internally consistent between Hanzi, pinyin, translation, keywords, and quiz.

- [ ] **Step 4: Write the three HSK 3 stories**

Use longer exchanges, reasons, consequences, polite clarification, and coordination language while keeping each sentence short enough for focused audio. Avoid claims about safety procedures that could be mistaken for real industrial guidance; frame actions as story-specific workplace communication.

- [ ] **Step 5: Run all seed and domain tests**

Run: `node --experimental-strip-types --test tests/story-seed-content.test.mjs tests/story-domain.test.mjs tests/story-version.test.mjs`

Expected: PASS, including exactly 12 structurally ready content bundles before audio state is applied.

- [ ] **Step 6: Run a duplicate Chinese-line audit**

Run: `node --experimental-strip-types -e "import('./lib/story-seed-content.ts').then(({storySeeds})=>{const lines=storySeeds.flatMap(s=>s.sections.flatMap(x=>x.sentences.map(y=>[y.hanzi,s.slug])));const seen=new Map;for(const [line,slug] of lines){if(seen.has(line))console.log(line,seen.get(line),slug);else seen.set(line,slug)}})"`

Expected: no output except intentionally repeated greetings; review any output manually and rewrite accidental duplicates.

- [ ] **Step 7: Commit HSK 2–3 content**

```bash
git add lib/story-seed-content.ts tests/story-seed-content.test.mjs
git commit -m "content: author HSK 2 and HSK 3 stories"
```

---

### Task 4: Seed the 12 stories as non-destructive drafts

**Files:**
- Create: `db/seed-stories.ts`
- Modify: `db/seed.ts`
- Modify: `tests/story-seed-content.test.mjs`

**Interfaces:**
- Consumes: `storySeeds` and normalized story tables.
- Produces: `seedStories(tx): Promise<{ created: number; preserved: number }>`.
- Preserves: every existing story with a matching slug without updating metadata or children.

- [ ] **Step 1: Add a failing source contract test**

```js
test("story seed is non-destructive and creates drafts", async () => {
  const source = await readFile(new URL("../db/seed-stories.ts", import.meta.url), "utf8");
  assert.match(source, /onConflictDoNothing/);
  assert.match(source, /status:\s*"draft"/);
  assert.doesNotMatch(source, /onConflictDoUpdate/);
  assert.doesNotMatch(source, /status:\s*"published"/);
});
```

- [ ] **Step 2: Run and observe missing seed module**

Run: `node --experimental-strip-types --test --test-name-pattern="non-destructive" tests/story-seed-content.test.mjs`

Expected: FAIL because `db/seed-stories.ts` is missing.

- [ ] **Step 3: Implement a per-story transaction-safe insert**

```ts
const [created] = await tx.insert(stories).values({
  slug: seed.slug,
  titleVi: seed.titleVi,
  titleZh: seed.titleZh,
  summaryVi: seed.summaryVi,
  hskLevel: seed.hskLevel,
  category: seed.category,
  estimatedMinutes: seed.estimatedMinutes,
  isFree: seed.isFree,
  status: "draft",
  sortOrder,
}).onConflictDoNothing().returning({ id: stories.id });
if (!created) { preserved += 1; continue; }
```

Insert ordered sections/sentences first, map sentence keys to generated IDs, then insert keywords/questions/options. Leave every `audioAssetId` null and every story as draft.

- [ ] **Step 4: Integrate with the existing seed transaction**

Call `seedStories(tx)` after course/practice content is available but before the transaction closes. Log `Truyện: tạo mới X, giữ nguyên Y.` after success.

- [ ] **Step 5: Run tests and a database seed**

Run: `node --experimental-strip-types --test tests/story-seed-content.test.mjs && npm run db:seed`

Expected: first seed creates 12 stories; second `npm run db:seed` reports 0 created and 12 preserved.

- [ ] **Step 6: Commit draft seeding**

```bash
git add db/seed-stories.ts db/seed.ts tests/story-seed-content.test.mjs
git commit -m "content: seed stories as drafts"
```

---

### Task 5: Generate checksummed sentence audio locally

**Files:**
- Create: `scripts/generate-story-audio.ts`
- Create: `content/story-audio/manifest.json`
- Modify: `.gitignore`
- Modify: `package.json`
- Modify: `tests/story-audio.test.mjs`

**Interfaces:**
- Consumes: every sentence key/Hanzi from `storySeeds`.
- Produces: local `content/story-audio/<sentence-key>.mp3` files and manifest version 1.
- Package script: `story:audio:generate`.

- [ ] **Step 1: Add a failing generator source test**

```js
test("story audio generator covers every seed sentence and writes a checksum manifest", async () => {
  const source = await readFile(new URL("../scripts/generate-story-audio.ts", import.meta.url), "utf8");
  assert.match(source, /storySeeds/);
  assert.match(source, /createHash\("sha256"\)/);
  assert.match(source, /manifest\.json/);
  assert.match(source, /zh-CN-XiaoxiaoNeural|zh-CN-YunxiNeural/);
});
```

- [ ] **Step 2: Run and observe missing generator**

Run: `node --experimental-strip-types --test --test-name-pattern="generator" tests/story-audio.test.mjs`

Expected: FAIL because the script is missing.

- [ ] **Step 3: Implement deterministic Edge TTS generation**

Use the existing practice generator pattern. Choose voice by speaker parity or category while keeping one sentence in one file. Use rate `-8%`, preserve files unless `--force` is passed, validate MP3 magic bytes, measure duration with ffprobe when available, and include:

```ts
{
  storySlug,
  sentenceKey,
  hanzi,
  fileName,
  voice,
  rate,
  mimeType,
  sizeBytes,
  durationMs,
  checksumSha256,
}
```

The manifest must contain exactly one item for every seed sentence and reject duplicate keys.

- [ ] **Step 4: Keep binary audio out of Git**

Add:

```gitignore
/content/story-audio/*.mp3
!/content/story-audio/manifest.json
```

Do not ignore the manifest.

- [ ] **Step 5: Add the package script and generate audio**

```json
"story:audio:generate": "node --experimental-strip-types scripts/generate-story-audio.ts"
```

Run: `npm run story:audio:generate`

Expected: one valid MP3 per story sentence and `manifest.json` with matching count/checksums.

- [ ] **Step 6: Run generator and story content tests**

Run: `node --experimental-strip-types --test tests/story-audio.test.mjs tests/story-seed-content.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit the generator and manifest only**

```bash
git add scripts/generate-story-audio.ts content/story-audio/manifest.json .gitignore package.json tests/story-audio.test.mjs
git commit -m "build: generate story sentence audio"
```

Run `git status --short content/story-audio` and confirm no MP3 is staged.

---

### Task 6: Upload generated audio to Cloudinary as pending review

**Files:**
- Create: `scripts/upload-story-audio.ts`
- Modify: `package.json`
- Modify: `tests/story-audio.test.mjs`

**Interfaces:**
- Consumes: manifest, local MP3 files, story/sentence rows, `uploadStoryAudioBuffer` or the authenticated story Cloudinary helper.
- Produces: authenticated Cloudinary assets, `story_audio_assets` metadata, pending review state, and sentence attachment.
- Package script: `story:audio:upload`.

- [ ] **Step 1: Add a failing uploader safety test**

```js
test("story audio uploader verifies manifest and never auto-approves", async () => {
  const source = await readFile(new URL("../scripts/upload-story-audio.ts", import.meta.url), "utf8");
  assert.match(source, /checksumSha256/);
  assert.match(source, /audioReviewStatus:\s*"pending"/);
  assert.doesNotMatch(source, /audioReviewStatus:\s*"approved"/);
  assert.match(source, /transaction/);
});
```

- [ ] **Step 2: Run and observe missing uploader**

Run: `node --experimental-strip-types --test --test-name-pattern="uploader" tests/story-audio.test.mjs`

Expected: FAIL because the script is missing.

- [ ] **Step 3: Implement manifest/content/database verification**

For each item, verify story slug, sentence key, current Hanzi, local size, detected MIME, and SHA-256. Refuse to upload when the seed text and database sentence differ. Preserve an already-attached asset when its checksum matches.

- [ ] **Step 4: Upload with authenticated delivery and attach atomically**

Upload outside the database transaction, then insert/attach metadata inside a transaction only if the sentence remains unchanged. On database failure, delete the newly uploaded unreferenced Cloudinary asset. Set review fields to `pending`, empty issues, null notes/reviewer/date.

- [ ] **Step 5: Add package script and run upload**

```json
"story:audio:upload": "node --env-file=.env.local --experimental-strip-types scripts/upload-story-audio.ts"
```

Run: `npm run story:audio:upload`

Expected: all sentence rows have authenticated Cloudinary assets in `pending` review; rerunning preserves matching assets.

- [ ] **Step 6: Run tests and inspect a sample asset in CMS**

Run: `node --experimental-strip-types --test tests/story-audio.test.mjs && npm run build`

Open `/admin/stories/<sample-id>` and verify the player loads through the authorized CMS path, displays “Chờ nghe duyệt”, and does not expose a permanent public URL in page source.

- [ ] **Step 7: Commit the uploader**

```bash
git add scripts/upload-story-audio.ts package.json tests/story-audio.test.mjs
git commit -m "build: upload story audio for review"
```

---

### Task 7: Add release audit and publish the free set through CMS

**Files:**
- Create: `scripts/audit-story-release.ts`
- Modify: `package.json`
- Modify: `tests/story-seed-content.test.mjs`

**Interfaces:**
- Produces: `story:release:audit` command with nonzero exit when release gates fail.
- Consumes: current database stories, child counts, approved audio, published versions, access, and seed slugs.

- [ ] **Step 1: Add a failing release-audit source test**

```js
test("release audit checks drafts, free publication, audio, and versions", async () => {
  const source = await readFile(new URL("../scripts/audit-story-release.ts", import.meta.url), "utf8");
  assert.match(source, /storySeeds/);
  assert.match(source, /storyAudioAssets/);
  assert.match(source, /storyVersions/);
  assert.match(source, /process\.exitCode = 1/);
});
```

- [ ] **Step 2: Run and observe missing audit script**

Run: `node --experimental-strip-types --test --test-name-pattern="release audit" tests/story-seed-content.test.mjs`

Expected: FAIL because the script is missing.

- [ ] **Step 3: Implement a deterministic release report**

The script reports per story: status, version, sections, sentences, attached audio, approved audio, keywords, questions, readiness, and access tier. It fails when any of the 12 slugs is absent, when a published story is not ready, when fewer than three approved free HSK 1 stories are published, when no reviewed VIP story is published for locked-state verification, or when any published asset is unapproved.

- [ ] **Step 4: Add package script**

```json
"story:release:audit": "node --env-file=.env.local --experimental-strip-types scripts/audit-story-release.ts"
```

- [ ] **Step 5: Perform human editorial review in CMS**

For every sentence in the three free stories and the VIP canary `chiec-the-nhan-vien-moi`, the assigned reviewer checks:

- Hanzi matches intended meaning and claimed HSK difficulty.
- Tone-mark pinyin matches the Hanzi and neutral-tone conventions are consistent.
- Vietnamese translation is natural and complete.
- Audio pronunciation, tones, speed, clarity, noise, and transcript match are acceptable.
- Keywords point to a sentence that actually contains the word.
- Each quiz has one unambiguous correct answer and explanation.

Request re-recording for any failed audio, regenerate/upload that sentence, and approve only the replacement asset.

- [ ] **Step 6: Publish the approved free set and one VIP canary**

Use CMS transitions `draft → review → published` for:

- `ca-sang-dau-tien`
- `cuoc-hop-luc-chin-gio`
- `bua-trua-cung-dong-nghiep`

Keep every VIP story as draft or review until its own audio/content review is complete. Do not bypass readiness through SQL.

Also publish `chiec-the-nhan-vien-moi` only after the same complete review. It remains VIP and provides a deterministic published locked state for guest/free security verification. Keep the other eight VIP stories as drafts/reviews until their reviews complete.

- [ ] **Step 7: Run release audit and automated suite**

Run: `npm run story:release:audit && npm test && npm run lint && npx tsc --noEmit && npm run build`

Expected: all commands exit 0 and audit identifies exactly 12 managed stories with the three free stories plus the VIP canary published and ready.

- [ ] **Step 8: Commit the audit tooling**

```bash
git add scripts/audit-story-release.ts package.json tests/story-seed-content.test.mjs
git commit -m "build: audit stories release readiness"
```

Database publication state is deployment data and is not represented by this Git commit.

---

### Task 8: Verify staging end to end

**Files:**
- Modify: `scripts/verify-staging.ts`
- Modify: `tests/story-routes.test.mjs`

**Interfaces:**
- Extends: existing staging verification with library, free story, locked story, and security checks.

- [ ] **Step 1: Add failing staging verification source checks**

```js
test("staging verification includes stories library and access boundaries", async () => {
  const source = await readFile(new URL("../scripts/verify-staging.ts", import.meta.url), "utf8");
  assert.match(source, /\/stories/);
  assert.match(source, /ca-sang-dau-tien/);
  assert.match(source, /story-audio/);
});
```

- [ ] **Step 2: Run and observe missing coverage**

Run: `node --experimental-strip-types --test --test-name-pattern="staging verification" tests/story-routes.test.mjs`

Expected: FAIL until staging script includes Stories.

- [ ] **Step 3: Extend non-authenticated staging probes**

Verify `/stories` returns 200 and original metadata, `ca-sang-dau-tien` returns 200 with no permanent Cloudinary URL, `chiec-the-nhan-vien-moi` returns locked metadata without Chinese body sentences, unknown slug returns 404, and invalid audio UUID returns 404.

- [ ] **Step 4: Deploy and run staging verification**

Run: `npm run deploy:staging`

Run: `npm run verify:staging`

Expected: both commands exit 0.

- [ ] **Step 5: Perform authenticated staging checks**

Using free and VIP test accounts:

- free user can save/complete a free story and receives XP once
- repeated identical quiz submission returns the same result without extra XP
- free user cannot retrieve VIP body/audio
- VIP user can read and play a published VIP story if one has been reviewed/published
- reviewer preview works only under `/admin/stories/<id>/preview`

- [ ] **Step 6: Capture final responsive/network evidence**

At 360×800 and 1440×900, capture the library, free reader, quiz result, locked state, and CMS editor. In network logs confirm zero audio on library load and on-demand sentence audio only after playback.

- [ ] **Step 7: Run final local verification**

Run: `npm run story:release:audit && npm test && npm run lint && npx tsc --noEmit && npm run build && git status --short`

Expected: verification commands pass; status contains no unplanned generated MP3 or unrelated staged files.

- [ ] **Step 8: Commit staging coverage**

```bash
git add scripts/verify-staging.ts tests/story-routes.test.mjs
git commit -m "test: verify stories on staging"
```

---

## Release Completion Gate

- [ ] Twelve original story drafts exist in CMS with the approved distribution.
- [ ] Every seed sentence, keyword, and quiz passes structural tests.
- [ ] Generated MP3 files are not tracked by Git.
- [ ] Cloudinary assets are authenticated and initially pending review.
- [ ] Three free HSK 1 stories and the VIP canary have completed human content/audio review and are published.
- [ ] Published stories have immutable version snapshots.
- [ ] Release audit, full tests, lint, TypeScript, production build, and staging verification pass.
- [ ] Guest, free, VIP, editor, reviewer, and admin access checks pass.
- [ ] Library network inspection shows no body/audio overfetch.
- [ ] Final responsive and keyboard walkthroughs reveal no critical issue.
