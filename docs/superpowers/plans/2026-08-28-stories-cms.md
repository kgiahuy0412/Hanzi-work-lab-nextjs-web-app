# Himi Stories CMS Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver an authorized Himi Console workflow for creating, editing, reviewing, versioning, previewing, and publishing Stories with sentence-level Cloudinary audio.

**Architecture:** Pure workflow rules decide who may edit, review, or transition content. Focused admin query and mutation modules keep the database code reviewable, while thin server actions parse form data and redirect. The UI saves metadata and nested content in bounded forms, and publication atomically writes an immutable version from normalized authoring rows.

**Tech Stack:** Node.js 22.13+, TypeScript 5.9, Next.js 16 App Router and server actions, React 19, Drizzle ORM 0.45, PostgreSQL, Cloudinary, Lucide React, existing Himi admin CSS and Node test runner.

**Spec:** `docs/superpowers/specs/2026-08-28-stories-design.md`

## Global Constraints

- Complete `docs/superpowers/plans/2026-08-28-stories-foundation.md` first.
- Reuse the existing `learner | editor | reviewer | admin` roles and existing audit log.
- Editors/admins author drafts; assigned reviewers/admins review; reviewer/admin authorization is required for publication.
- A current published version remains learner-visible while a working revision is edited or reviewed.
- Published stories are archived rather than hard-deleted.
- Every server mutation rechecks role and state; hidden UI is not authorization.
- Audio upload completion verifies the Cloudinary signature and sentence ownership.
- Reviewer approval applies to the currently attached asset; replacing audio returns it to `pending`.
- Forms return specific Vietnamese errors and never commit partial nested updates.
- Follow TDD and commit only the files owned by the current task.

---

## File Structure

- `lib/story-workflow.ts` — staff roles, transitions, reviewer assignment, edit permissions.
- `lib/story-review-queue.ts` — queue ordering and assignment helpers.
- `lib/admin-story-types.ts` — explicit admin inputs, filters, views, and mutation errors.
- `lib/admin-story-query.ts` — inventory, detail, reviewers, completeness, and preview reads.
- `lib/admin-story-service.ts` — metadata/nested mutations, workflow transitions, version publication, deletion.
- `app/admin/stories/actions.ts` — thin form parsing and redirecting server actions.
- `app/api/admin/story-audio/route.ts` — sign, complete, and remove audio upload operations.
- `components/admin-story-console.tsx` — inventory, metadata, sections, sentences, keywords, questions, checklist, and workflow forms.
- `components/story-audio-uploader.tsx` — direct-to-Cloudinary sentence uploader.
- `app/admin/stories/page.tsx` — inventory and review queue.
- `app/admin/stories/new/page.tsx` — draft creation.
- `app/admin/stories/[storyId]/page.tsx` — bounded editor.
- `app/admin/stories/[storyId]/preview/page.tsx` — staff-only CMS-local bilingual preview shell.
- `app/admin/stories/stories-admin.css` — CMS-specific responsive styling.
- `app/admin/page.tsx` — Stories entry and real dashboard count.
- `components/admin-console.tsx` — shared status/audit presentation additions only.
- `tests/story-workflow.test.mjs` — role, transition, assignment, and readiness tests.
- `tests/admin-stories.test.mjs` — action parsing and source-level route contract tests.
- `tests/rendered-html.test.mjs` — sidebar/dashboard/admin route presence.

---

### Task 1: Define the Stories editorial workflow

**Files:**
- Create: `lib/story-workflow.ts`
- Create: `lib/story-review-queue.ts`
- Create: `tests/story-workflow.test.mjs`

**Interfaces:**
- Consumes: `ContentStatus`, `UserRole`, `StoryReadinessItem`.
- Produces: `StoryStaffRole`, `StoryWorkflowActor`, `isStoryStaffRole`, `canEditStory`, `allowedStoryTransitions`, `canTransitionAssignedStory`, `canReviewStoryAudio` integration.
- Produces: `storyReviewQueueRank(input, now)` and `canActOnAssignedStoryReview(role, actorId, reviewerId)`.
- Consumed by: admin query/service, actions, audio route, and UI.

- [ ] **Step 1: Write failing workflow tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import {
  allowedStoryTransitions,
  canEditStory,
  canTransitionAssignedStory,
  isStoryStaffRole,
} from "../lib/story-workflow.ts";

test("story staff roles and edit permissions are explicit", () => {
  assert.equal(isStoryStaffRole("learner"), false);
  assert.equal(isStoryStaffRole("editor"), true);
  assert.equal(canEditStory("editor", "draft"), true);
  assert.equal(canEditStory("editor", "review"), false);
  assert.equal(canEditStory("admin", "published"), false);
});

test("story transitions preserve review separation", () => {
  assert.deepEqual(allowedStoryTransitions("editor", "draft"), ["review"]);
  assert.deepEqual(allowedStoryTransitions("reviewer", "review"), ["draft", "published"]);
  assert.deepEqual(allowedStoryTransitions("admin", "published"), ["draft", "archived"]);
  assert.equal(canTransitionAssignedStory({ id: "reviewer-a", role: "reviewer" }, "reviewer-b", "review", "published"), false);
  assert.equal(canTransitionAssignedStory({ id: "reviewer-a", role: "reviewer" }, "reviewer-a", "review", "published"), true);
});
```

- [ ] **Step 2: Run and observe missing workflow modules**

Run: `node --experimental-strip-types --test tests/story-workflow.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implement role and transition rules**

```ts
export function allowedStoryTransitions(role: UserRole, status: ContentStatus): ContentStatus[] {
  if (role === "editor") return status === "draft" ? ["review"] : [];
  if (role === "reviewer") return status === "review" ? ["draft", "published"] : [];
  if (role !== "admin") return [];
  if (status === "draft") return ["review", "archived"];
  if (status === "review") return ["draft", "published"];
  if (status === "published") return ["draft", "archived"];
  return ["draft"];
}
```

`canEditStory` returns true only for editor/admin on `draft`. Returning a published story to draft keeps `publishedVersion` intact.

- [ ] **Step 4: Implement queue helpers**

Use priority weights `urgent: 0`, `high: 1`, `normal: 2`, `low: 3`; then overdue status; then due date; then request time. A reviewer may act only on their assigned item; an admin may act on any item.

- [ ] **Step 5: Run focused tests**

Run: `node --experimental-strip-types --test tests/story-workflow.test.mjs tests/practice-workflow.test.mjs tests/practice-review-queue.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit workflow rules**

```bash
git add lib/story-workflow.ts lib/story-review-queue.ts tests/story-workflow.test.mjs
git commit -m "feat: define stories editorial workflow"
```

---

### Task 2: Build admin inventory and metadata CRUD

**Files:**
- Create: `lib/admin-story-types.ts`
- Create: `lib/admin-story-query.ts`
- Create: `lib/admin-story-service.ts`
- Create: `tests/admin-stories.test.mjs`

**Interfaces:**
- Consumes: story tables, `assessStoryReadiness`, workflow actors, and existing `auditLogs`.
- Produces: `StoryMutationResult`, `AdminStoryInput`, `AdminStoryFilters`, `AdminStoryListItem`, `AdminStoryDetail`.
- Produces: `listAdminStories(filters, actor)`, `getAdminStory(storyId, actor)`, `listStoryReviewers()`.
- Produces: `createStory(input, actor)`, `updateStoryMetadata(storyId, input, actor)`, `deleteStoryDraft(storyId, actor)`.

- [ ] **Step 1: Add failing input-normalization tests**

```js
import assert from "node:assert/strict";
import test from "node:test";
import { parseStoryMetadataForm } from "../lib/admin-story-types.ts";

test("story metadata form normalizes slug and bounded values", () => {
  const form = new FormData();
  form.set("titleVi", "Ca sáng đầu tiên");
  form.set("titleZh", "第一次上早班");
  form.set("summaryVi", "Một buổi sáng đầu tiên ở văn phòng.");
  form.set("hskLevel", "1");
  form.set("category", "office");
  form.set("estimatedMinutes", "5");
  form.set("isFree", "on");
  const parsed = parseStoryMetadataForm(form);
  assert.equal(parsed?.slug, "ca-sang-dau-tien");
  assert.equal(parsed?.hskLevel, 1);
  assert.equal(parsed?.isFree, true);
});

test("story metadata rejects unsupported HSK and category", () => {
  const form = new FormData();
  form.set("titleVi", "Tên truyện");
  form.set("titleZh", "故事");
  form.set("summaryVi", "Mô tả hợp lệ");
  form.set("hskLevel", "10");
  form.set("category", "unknown");
  assert.equal(parseStoryMetadataForm(form), null);
});
```

- [ ] **Step 2: Run and observe missing input parser**

Run: `node --experimental-strip-types --test tests/admin-stories.test.mjs`

Expected: FAIL with missing export/module.

- [ ] **Step 3: Define exact admin types and parser**

```ts
export type StoryMutationError =
  | "not_found"
  | "forbidden"
  | "invalid_input"
  | "invalid_state"
  | "duplicate_slug"
  | "has_dependencies"
  | "not_ready"
  | "invalid_reviewer"
  | "review_assignment_required";

export type StoryMutationResult =
  | { ok: true; id: string }
  | { ok: false; error: StoryMutationError };
```

`parseStoryMetadataForm` uses the existing `valueString`, `valueInteger`, `normalizeSlug`, and `parseBoolean` helpers plus story domain guards. It accepts HSK 1–9 for CMS authoring.

- [ ] **Step 4: Implement explicit admin projections**

`listAdminStories` returns metadata, status, author/reviewer names, current published version, child counts, approved-audio count, completeness count, and updated date. `getAdminStory` loads ordered sections/sentences, audio metadata, keywords, questions/options, versions, and readiness.

- [ ] **Step 5: Implement create, update, and safe delete transactions**

```ts
export async function createStory(input: AdminStoryInput, actor: StoryWorkflowActor): Promise<StoryMutationResult> {
  if (actor.role !== "editor" && actor.role !== "admin") return { ok: false, error: "forbidden" };
  return writeDb((db) => db.transaction(async (tx) => {
    const collision = await tx.select({ id: stories.id }).from(stories).where(eq(stories.slug, input.slug)).limit(1);
    if (collision[0]) return { ok: false, error: "duplicate_slug" };
    const [created] = await tx.insert(stories).values({ ...input, authorId: actor.id, status: "draft" }).returning({ id: stories.id });
    await tx.insert(auditLogs).values({ actorId: actor.id, action: "admin.story.created", entityType: "story", entityId: created.id, metadata: { slug: input.slug } });
    return { ok: true, id: created.id };
  }));
}
```

`updateStoryMetadata` requires editable draft state. `deleteStoryDraft` requires draft status, no published version, no attempts/progress, and a confirmed delete action at the server-action layer.

- [ ] **Step 6: Run admin tests and TypeScript**

Run: `node --experimental-strip-types --test tests/admin-stories.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit inventory and metadata services**

```bash
git add lib/admin-story-types.ts lib/admin-story-query.ts lib/admin-story-service.ts tests/admin-stories.test.mjs
git commit -m "feat: add stories admin inventory"
```

---

### Task 3: Add bounded nested authoring mutations

**Files:**
- Modify: `lib/admin-story-types.ts`
- Modify: `lib/admin-story-service.ts`
- Modify: `tests/admin-stories.test.mjs`

**Interfaces:**
- Produces: parsers for `StorySectionInput`, `StorySentenceInput`, `StoryKeywordInput`, `StoryQuestionInput`.
- Produces: `create/update/delete/moveStorySection`, `create/update/delete/moveStorySentence`, `create/update/deleteStoryKeyword`, `create/update/deleteStoryQuestion`.
- Preserves: all mutation results and audit format from Task 2.

- [ ] **Step 1: Add failing nested parser tests**

```js
test("sentence parser requires Hanzi, pinyin, translation, and bounded order", () => {
  const form = new FormData();
  form.set("sectionId", "11111111-1111-4111-8111-111111111111");
  form.set("hanzi", "我今天上早班。");
  form.set("pinyin", "Wǒ jīntiān shàng zǎobān.");
  form.set("translationVi", "Hôm nay tôi làm ca sáng.");
  form.set("sortOrder", "0");
  assert.equal(parseStorySentenceForm(form)?.hanzi, "我今天上早班。");
  form.set("pinyin", "");
  assert.equal(parseStorySentenceForm(form), null);
});

test("question parser accepts exactly one correct option", () => {
  const form = validQuestionForm();
  assert.equal(parseStoryQuestionForm(form)?.options.length, 3);
  form.set("correctOption", "9");
  assert.equal(parseStoryQuestionForm(form), null);
});
```

- [ ] **Step 2: Run and observe missing parsers**

Run: `node --experimental-strip-types --test --test-name-pattern="sentence|question" tests/admin-stories.test.mjs`

Expected: FAIL with missing exports.

- [ ] **Step 3: Implement parsers with exact limits**

- Section title: 180 characters; optional Chinese title: 180.
- Speaker: optional, 120 characters.
- Hanzi, pinyin, translation: each required, 4,000 characters.
- Keyword Hanzi/pinyin: 200; meaning: 1,000.
- Question prompt/explanation: 4,000; 2–6 options; option text: 1,000.
- Sort order: integer 0–10,000.

- [ ] **Step 4: Implement child-ownership checks in every mutation**

Every nested transaction first joins the child to its parent story and confirms the story is editable by the actor. Updating a sentence with a changed Hanzi/pinyin/translation detaches its current audio asset and returns audio review to pending through the detached asset relationship; it never silently keeps an audio recording for changed text.

```ts
const story = await findEditableStoryForSentence(tx, sentenceId, actor);
if (!story) return { ok: false, error: "forbidden" };
await tx.update(storySentences).set({ ...input, audioAssetId: contentChanged ? null : existing.audioAssetId })
  .where(eq(storySentences.id, sentenceId));
```

- [ ] **Step 5: Implement deterministic movement**

Movement actions accept `direction: "up" | "down"`, select the adjacent sibling under the same parent, and swap orders inside one transaction. They never accept an arbitrary target story/section from the client.

- [ ] **Step 6: Run focused tests and full TypeScript**

Run: `node --experimental-strip-types --test tests/admin-stories.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 7: Commit nested authoring**

```bash
git add lib/admin-story-types.ts lib/admin-story-service.ts tests/admin-stories.test.mjs
git commit -m "feat: author structured story content"
```

---

### Task 4: Implement review assignment, publication, and immutable versions

**Files:**
- Modify: `lib/admin-story-query.ts`
- Modify: `lib/admin-story-service.ts`
- Modify: `tests/story-workflow.test.mjs`
- Modify: `tests/story-version.test.mjs`

**Interfaces:**
- Produces: `updateStoryReviewAssignment`, `claimStoryReview`, `releaseStoryReview`, `transitionStoryStatus`.
- Produces: `loadStoryWorkingContent(tx, storyId)` and `publishStoryVersion(tx, story, actor)`.
- Consumes: `createStoryVersionSnapshot`, `assessStoryReadiness`, `canTransitionAssignedStory`.

- [ ] **Step 1: Add failing publication invariant tests**

```js
test("publishing is unavailable when readiness fails", () => {
  assert.equal(canPublishStory({ role: "reviewer", assigned: true, readiness: { ready: false } }), false);
  assert.equal(canPublishStory({ role: "reviewer", assigned: true, readiness: { ready: true } }), true);
});

test("returning a published story to draft preserves its public version number", () => {
  assert.deepEqual(nextStoryPublicationState({ status: "published", publishedVersion: 3 }, "draft"), {
    status: "draft",
    publishedVersion: 3,
  });
});
```

- [ ] **Step 2: Run and observe failures**

Run: `node --experimental-strip-types --test tests/story-workflow.test.mjs tests/story-version.test.mjs`

Expected: FAIL for the new workflow helpers.

- [ ] **Step 3: Implement assignment and claim/release rules**

Only admins assign reviewer, priority, and due date. A reviewer may claim an unassigned review. Releasing clears only their own assignment. Each operation writes one audit event with prior/new assignment metadata.

- [ ] **Step 4: Implement the publication transaction**

```ts
const nextVersion = (story.publishedVersion ?? 0) + 1;
const snapshot = createStoryVersionSnapshot(await loadStoryWorkingContent(tx, story.id));
const readiness = assessStoryReadiness(snapshotToReadinessInput(snapshot, approvedAudioIds));
if (!readiness.ready) return { ok: false, error: "not_ready" };

await tx.insert(storyVersions).values({
  storyId: story.id,
  version: nextVersion,
  hskLevel: snapshot.hskLevel,
  category: snapshot.category,
  isFree: snapshot.isFree,
  titleVi: snapshot.titleVi,
  titleZh: snapshot.titleZh,
  summaryVi: snapshot.summaryVi,
  coverUrl: snapshot.coverUrl,
  estimatedMinutes: snapshot.estimatedMinutes,
  snapshot,
  createdBy: actor.id,
});
await tx.update(stories).set({ status: "published", publishedVersion: nextVersion, publishedAt: new Date(), updatedAt: new Date() })
  .where(and(eq(stories.id, story.id), eq(stories.status, "review")));
```

Require the conditional update to affect one row; otherwise return `invalid_state`. A draft update after publication leaves the version row untouched.

- [ ] **Step 5: Implement archive and re-review behavior**

Archiving hides the story without deleting versions/progress. Returning `published → draft` preserves `publishedVersion`, and public repositories continue to serve it until a new version is published or the story is archived.

- [ ] **Step 6: Run workflow, version, and domain tests**

Run: `node --experimental-strip-types --test tests/story-workflow.test.mjs tests/story-version.test.mjs tests/story-domain.test.mjs`

Expected: PASS.

- [ ] **Step 7: Commit workflow persistence**

```bash
git add lib/admin-story-query.ts lib/admin-story-service.ts tests/story-workflow.test.mjs tests/story-version.test.mjs
git commit -m "feat: publish immutable story versions"
```

---

### Task 5: Add story audio upload and review operations

**Files:**
- Create: `app/api/admin/story-audio/route.ts`
- Create: `components/story-audio-uploader.tsx`
- Modify: `lib/admin-story-service.ts`
- Modify: `tests/story-audio.test.mjs`
- Modify: `tests/admin-stories.test.mjs`

**Interfaces:**
- Consumes: Foundation audio upload/verification helpers and `StoryWorkflowActor`.
- Produces: `getStorySentenceAudioUploadPermission`, `attachStorySentenceAudio`, `removeStorySentenceAudio`, `reviewStorySentenceAudio`.
- API body actions: `sign`, `complete`; DELETE body contains `sentenceId`.
- Uploader props: `{ sentenceId, initialAsset, cloudinaryConfigured }`.

- [ ] **Step 1: Add failing authorization and attachment tests**

```js
test("audio upload permission is limited to editable story sentences", () => {
  assert.equal(canAttachStoryAudio({ role: "editor", storyStatus: "draft", ownsSentence: true }), true);
  assert.equal(canAttachStoryAudio({ role: "editor", storyStatus: "review", ownsSentence: true }), false);
  assert.equal(canAttachStoryAudio({ role: "learner", storyStatus: "draft", ownsSentence: true }), false);
});

test("replacing sentence audio always returns review to pending", () => {
  assert.deepEqual(nextStoryAudioReviewState("approved", true), { status: "pending", issues: [], notes: null, reviewedBy: null, reviewedAt: null });
});
```

- [ ] **Step 2: Run and observe failures**

Run: `node --experimental-strip-types --test --test-name-pattern="audio" tests/story-audio.test.mjs tests/admin-stories.test.mjs`

Expected: FAIL for new helpers.

- [ ] **Step 3: Implement service transactions**

Attachment validates sentence ownership, expected Cloudinary prefix/signature/checksum, and current story state. It inserts or reuses the asset by checksum, attaches it only if the sentence still belongs to the same editable draft, resets review fields, and audits the operation. Removal deletes Cloudinary content only after checking working sentences and every published version snapshot for references.

- [ ] **Step 4: Implement the same-origin protected API route**

```ts
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const staff = await requireStoryStaffUser();
  const body = await safeJsonRecord(request);
  if (body.action === "sign") return signStoryAudio(body, staff);
  if (body.action === "complete") return completeStoryAudio(body, staff);
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
```

Return `404` for inaccessible sentence IDs, `400` for invalid upload responses, and `409` when the draft changed between signing and attachment.

- [ ] **Step 5: Build the focused uploader**

Reuse the interaction model of `PracticeAudioUploader` but call `/api/admin/story-audio`, label the owner as a story sentence, accept the same MIME types, enforce 8 MB client-side, show review status, and avoid rendering an upload button before the sentence exists.

- [ ] **Step 6: Add reviewer controls**

The sentence row shows `approved` or `re_record`, bounded issue checkboxes (`pronunciation`, `speed`, `clarity`, `background_noise`, `transcript_mismatch`, `tone`), and notes. Only an assigned reviewer/admin sees the review form.

- [ ] **Step 7: Run audio, admin, and TypeScript checks**

Run: `node --experimental-strip-types --test tests/story-audio.test.mjs tests/admin-stories.test.mjs tests/practice-audio.test.mjs && npx tsc --noEmit`

Expected: PASS.

- [ ] **Step 8: Commit CMS audio support**

```bash
git add app/api/admin/story-audio/route.ts components/story-audio-uploader.tsx lib/admin-story-service.ts tests/story-audio.test.mjs tests/admin-stories.test.mjs
git commit -m "feat: manage reviewed story audio"
```

---

### Task 6: Add thin Stories server actions

**Files:**
- Modify: `lib/admin-auth.ts`
- Create: `app/admin/stories/actions.ts`
- Modify: `tests/admin-stories.test.mjs`

**Interfaces:**
- Produces: `requireStoryStaffUser()` with `/admin/stories` return path.
- Produces: metadata, section, sentence, keyword, question, assignment, transition, audio review, movement, and delete server actions.
- Consumes: all parsers and services from Tasks 1–5.

- [ ] **Step 1: Add a failing source-contract test**

```js
import { readFile } from "node:fs/promises";

test("story admin actions authorize staff and delegate to services", async () => {
  const source = await readFile(new URL("../app/admin/stories/actions.ts", import.meta.url), "utf8");
  assert.match(source, /requireStoryStaffUser/);
  assert.match(source, /createStoryAction/);
  assert.match(source, /transitionStoryAction/);
  assert.match(source, /reviewStoryAudioAction/);
  assert.doesNotMatch(source, /from\("stories"\)|insert\(stories\)|update\(stories\)/);
});
```

- [ ] **Step 2: Run and observe the missing action file**

Run: `node --experimental-strip-types --test --test-name-pattern="admin actions" tests/admin-stories.test.mjs`

Expected: FAIL because the action file does not exist.

- [ ] **Step 3: Add `requireStoryStaffUser`**

Authenticate with `getCurrentUser`, redirect anonymous users to `/admin/login?error=required&returnTo=/admin/stories`, and redirect non-staff users away from the console. Return the typed `editor | reviewer | admin` user.

- [ ] **Step 4: Implement thin action wrappers**

Each action follows this pattern:

```ts
export async function updateStoryMetadataAction(formData: FormData) {
  const staff = await requireStoryStaffUser();
  const storyId = valueString(formData, "storyId", 40);
  const input = parseStoryMetadataForm(formData);
  if (!isUuid(storyId) || !input) invalidStoryPath(storyId);
  const result = await updateStoryMetadata(storyId, input, { id: staff.id, role: staff.role });
  storyResultRedirect(result, `/admin/stories/${storyId}`);
}
```

Destructive actions require `confirmDelete=DELETE`. Transition actions require a non-empty change note. Assignment actions require admin role through their service even though the UI also hides them.

- [ ] **Step 5: Run action tests and lint**

Run: `node --experimental-strip-types --test tests/admin-stories.test.mjs && npm run lint`

Expected: PASS.

- [ ] **Step 6: Commit server actions**

```bash
git add lib/admin-auth.ts app/admin/stories/actions.ts tests/admin-stories.test.mjs
git commit -m "feat: add stories admin actions"
```

---

### Task 7: Build the CMS inventory and editor UI

**Files:**
- Create: `components/admin-story-console.tsx`
- Create: `app/admin/stories/page.tsx`
- Create: `app/admin/stories/new/page.tsx`
- Create: `app/admin/stories/[storyId]/page.tsx`
- Create: `app/admin/stories/[storyId]/preview/page.tsx`
- Create: `app/admin/stories/stories-admin.css`
- Modify: `tests/rendered-html.test.mjs`
- Modify: `tests/admin-stories.test.mjs`

**Interfaces:**
- Consumes: admin query views and all server actions.
- Produces: `StoryMetadataForm`, `StorySectionEditor`, `StorySentenceEditor`, `StoryKeywordEditor`, `StoryQuestionEditor`, `StoryReadinessPanel`, `StoryWorkflowPanel`, `StoryVersionHistory`, `AdminStoryPreview`.
- Preview consumes a working `StoryVersionSnapshot`, renders through `AdminStoryPreview`, and does not depend on learner components from the next plan or use public repository access.

- [ ] **Step 1: Add failing route/component source checks**

```js
test("stories CMS has inventory, bounded editor, and preview routes", async () => {
  const files = await Promise.all([
    "../app/admin/stories/page.tsx",
    "../app/admin/stories/new/page.tsx",
    "../app/admin/stories/[storyId]/page.tsx",
    "../app/admin/stories/[storyId]/preview/page.tsx",
    "../components/admin-story-console.tsx",
  ].map((path) => readFile(new URL(path, import.meta.url), "utf8")));
  assert.match(files[0], /listAdminStories/);
  assert.match(files[2], /StorySentenceEditor/);
  assert.match(files[3], /preview/i);
  assert.match(files[4], /StoryReadinessPanel/);
});
```

- [ ] **Step 2: Run and observe missing routes**

Run: `node --experimental-strip-types --test --test-name-pattern="CMS" tests/admin-stories.test.mjs`

Expected: FAIL because the CMS routes/components do not exist.

- [ ] **Step 3: Build the inventory page**

Use `AdminConsoleHeader`, `StatusBadge`, semantic tables, GET filters, real status counts, readiness progress, reviewer, and last update. Provide links to create, edit, preview, and the review queue. Avoid client JavaScript for filters.

- [ ] **Step 4: Build the bounded editor components**

Render separate forms for metadata, each section, each sentence, each keyword, and each question. Use buttons for up/down ordering, explicit save status, and a browser `beforeunload` warning only for forms with detected changes. Do not submit the entire story tree from one form.

- [ ] **Step 5: Add checklist, workflow, and version history**

The readiness panel uses the server-calculated items and disables review/publish actions when `ready` is false. Workflow forms show assignment, priority, due date, notes, and allowed transitions. Version history is read-only in this release and links to its version number/date/author.

- [ ] **Step 6: Add authorized preview**

The preview page calls `requireStoryStaffUser`, loads working content, creates a non-persisted snapshot, and renders `AdminStoryPreview` from `components/admin-story-console.tsx`. The preview displays ordered Hanzi, pinyin, Vietnamese translation, keywords, questions, and CMS-authorized audio controls without importing the learner reader that is created in the next plan. It must set robots metadata to `noindex, nofollow` and never use a query flag on the public story route.

- [ ] **Step 7: Add responsive admin styling**

Keep existing Himi admin tokens. At widths below 800px, tables scroll inside their own container, editor actions wrap, audio controls remain at least 44px high, and no fixed toolbar covers content.

- [ ] **Step 8: Run UI source tests, lint, and build**

Run: `node --experimental-strip-types --test tests/admin-stories.test.mjs tests/rendered-html.test.mjs && npm run lint && npm run build`

Expected: PASS.

- [ ] **Step 9: Commit the CMS UI**

```bash
git add components/admin-story-console.tsx app/admin/stories app/admin/stories/stories-admin.css tests/admin-stories.test.mjs tests/rendered-html.test.mjs
git commit -m "feat: build stories CMS interface"
```

---

### Task 8: Connect Stories to the admin dashboard and audit labels

**Files:**
- Modify: `app/admin/page.tsx`
- Modify: `lib/admin-content-service.ts`
- Modify: `components/admin-console.tsx`
- Modify: `tests/rendered-html.test.mjs`

**Interfaces:**
- Consumes: story status counts from the database.
- Produces: Stories dashboard card/link and Vietnamese labels for `admin.story.*` audit actions.

- [ ] **Step 1: Add a failing dashboard assertion**

```js
test("admin dashboard links to the Stories CMS", async () => {
  const source = await readFile(new URL("../app/admin/page.tsx", import.meta.url), "utf8");
  assert.match(source, /href="\/admin\/stories"/);
  assert.match(source, /Truyện/);
});
```

- [ ] **Step 2: Run and observe failure**

Run: `node --experimental-strip-types --test --test-name-pattern="Stories CMS" tests/rendered-html.test.mjs`

Expected: FAIL because the dashboard lacks the Stories link.

- [ ] **Step 3: Add real story counts and audit labels**

Extend `getAdminDashboard` with `storyStatuses` and add labels for created, updated, deleted, review assigned/claimed/released, status changed, version published, audio attached/removed/approved/re-record requested.

- [ ] **Step 4: Render a Stories dashboard entry**

Show total drafts/reviews/published and link to `/admin/stories`. Do not merge the count with published lessons.

- [ ] **Step 5: Run the complete CMS verification**

Run: `npm test && npm run lint && npx tsc --noEmit && npm run build`

Expected: every command exits 0.

- [ ] **Step 6: Commit dashboard integration**

```bash
git add app/admin/page.tsx lib/admin-content-service.ts components/admin-console.tsx tests/rendered-html.test.mjs
git commit -m "feat: expose stories in Himi Console"
```

---

## CMS Completion Gate

Before starting the learner plan:

- [ ] Start the app with `npm run dev` and open `/admin/stories` as editor, reviewer, and admin test accounts.
- [ ] Verify an editor can create a draft but cannot publish it.
- [ ] Verify an assigned reviewer can approve audio and publish a ready review.
- [ ] Verify an unassigned reviewer cannot act on another review.
- [ ] Verify editing a formerly published story leaves its existing public version intact.
- [ ] Verify replacing sentence text detaches stale audio.
- [ ] Verify archived/published stories cannot be hard-deleted.
- [ ] Run `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` successfully.
