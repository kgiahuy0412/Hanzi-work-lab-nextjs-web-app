# Himi Stories — Design Specification

**Status:** Approved by the product owner

**Approved:** 2026-08-28

**Scope:** `/stories`, `/stories/[slug]`, Stories CMS, audio, access control, progress, quiz, and initial content

## 1. Purpose

Build a production-ready bilingual Chinese–Vietnamese story experience for Himi. The product should help Vietnamese learners acquire Chinese through short, contextual stories, with a particular emphasis on daily life and workplace communication.

The implementation may learn from the information architecture of Hanbeego's [story library](https://hanbeego.com/stories) and [sample reader](https://hanbeego.com/stories/story_HSK1_01): level-based discovery, sentence-level pinyin and translation, per-sentence audio, vocabulary, and comprehension checks. Himi must not copy Hanbeego's stories, titles, characters, wording, artwork, or visual identity. All learner-facing content and presentation must be original and consistent with Himi.

## 2. Approved product decisions

- Stories is a first-class content domain, separate from courses and lessons.
- The first release contains 12 original stories across HSK 1–3.
- HSK 1 has five stories, HSK 2 has four, and HSK 3 has three.
- Three HSK 1 stories are free; the remaining nine require active VIP access.
- Guests may read free stories without saved progress.
- Signed-in free users may save progress and quiz results for free stories.
- VIP users may read and save progress for all published stories.
- Every sentence requires approved audio stored through Cloudinary before publication.
- “Listen to the whole story” plays the sentence assets sequentially.
- Every story has exactly three comprehension questions.
- A score of at least two correct answers out of three completes the story.
- Completion XP is awarded only once per user and story. Retakes update results but do not repeatedly award completion XP.
- Stories must have a CMS with draft, review, published, and archived states.

## 3. Goals and non-goals

### Goals

- Make stories easy to discover by HSK level, category, access tier, and reading state.
- Provide a focused, accessible bilingual reader on desktop and mobile.
- Support sentence audio, continuous playback, vocabulary help, and reading preferences.
- Give the content team a safe authoring and review workflow.
- Enforce Free/VIP access on the server.
- Save reading position, best quiz result, attempts, completion, and XP safely.
- Keep the library route light: it must not fetch story bodies or audio assets.
- Establish a data model that can extend to HSK 4–9 without reshaping the course domain.

### Non-goals for the first release

- HSK 4–9 content.
- User comments, likes, public reviews, or social feeds.
- AI-generated stories inside the CMS.
- Offline audio downloads.
- Automated word segmentation or a dictionary popup for every Chinese word; only curated keywords are interactive.
- A native mobile application.
- Importing or scraping competitor content.
- Reusing course lessons as story records.

## 4. Information architecture

### Learner routes

- `/stories` — public story library and discovery surface.
- `/stories/[slug]` — story overview, reader, vocabulary, and quiz.
- `/login` and `/vip` — existing destinations used when authentication or subscription is required.

### CMS routes

- `/admin/stories` — story inventory, filters, completeness state, and workflow actions.
- `/admin/stories/new` — create a story draft.
- `/admin/stories/[id]` — edit metadata, sections, sentences, audio, keywords, and quiz.
- `/admin/stories/[id]/preview` — learner-mode preview for authorized content staff.

### Supporting endpoints/actions

- Server actions or protected route handlers for story CRUD and workflow transitions.
- A protected story-audio delivery endpoint that checks publication state and entitlement before issuing a short-lived Cloudinary delivery URL.
- Server actions for reading progress and quiz submission.

## 5. Data model

The authoring model is normalized. Public versions are immutable so edits to an already-published story cannot leak into the learner experience before re-review.

### `stories`

Stable identity and workflow owner for a story:

- `id`, `slug`
- `authorId`, `reviewerId`
- working metadata: `titleVi`, `titleZh`, `summaryVi`, `hskLevel`, `category`, `estimatedMinutes`, `coverUrl`, `isFree`
- `status`: existing `draft | review | published | archived` content status
- review metadata: priority, due date, requested date, reviewer notes
- current published version pointer/number
- sort order, published timestamp, created timestamp, updated timestamp

`slug` is unique and stable. HSK is stored in a form that can support levels 1–9 even though the first release exposes only 1–3. Category is a controlled key managed by the application rather than arbitrary display text.

### `story_sections`

- `id`, `storyId`
- Vietnamese section heading and optional Chinese heading
- `sortOrder`

Each story requires at least one section.

### `story_sentences`

- `id`, `sectionId`
- optional speaker label
- `hanzi`, `pinyin`, `translationVi`
- `audioAssetId`
- `sortOrder`

Sentence order is unique within its section. A publishable sentence requires non-empty Hanzi, pinyin, Vietnamese translation, and an approved audio asset.

### `story_audio_assets`

Uses the same Cloudinary upload and verification principles as practice audio without coupling Stories to practice-specific tables or URLs:

- file metadata, checksum, size, duration, MIME type
- Cloudinary asset ID, public ID, version, format, and secure delivery metadata
- review status, issues, notes, reviewer, and reviewed timestamp
- creator and created timestamp

Duplicate checksums should reuse an existing valid asset when safe. Removing or replacing an asset must not delete a file still referenced by another row or published version.

### `story_keywords`

- `id`, `storyId`
- optional source `sentenceId`
- `hanzi`, `pinyin`, `meaningVi`
- `sortOrder`

Keywords are curated by editors and are the only token-level elements that open a meaning card in the first release.

### `story_questions`

- `id`, `storyId`
- Vietnamese prompt, optional Chinese prompt
- explanation
- `sortOrder`

A story must have exactly three questions before review or publication.

### `story_question_options`

- `id`, `questionId`
- option text
- `isCorrect`
- `sortOrder`

Every question must have at least two options and exactly one correct option.

### `story_versions`

An immutable snapshot created at review/publish boundaries:

- `id`, `storyId`, `version`
- indexed public projection: HSK level, category, free/VIP, title, summary, cover, and reading time
- complete content snapshot covering sections, sentences, approved audio references, keywords, and quiz
- creator and created timestamp

The public repository reads the currently published version. CMS edits continue against working normalized rows. Publishing a corrected version atomically changes the current published pointer; readers never see a partially edited story.

### `story_progress`

- `userId`, `storyId` composite unique key
- published version last opened
- last sentence identity/order
- best score, attempt count, completion state
- first completed timestamp and last opened timestamp

If a new story version changes sentence order, resume position is clamped to a valid sentence. Prior completion remains recorded unless a future product decision explicitly introduces version-specific re-certification.

### `story_quiz_attempts`

- `id`, `userId`, `storyId`, published version
- answer snapshot, correct answer count, passed flag
- XP earned for this attempt
- completed timestamp

Quiz attempt creation, progress update, first-completion detection, and XP award occur in one transaction. Database constraints and transactional checks make completion XP idempotent.

### Key indexes and constraints

- unique story slug
- status and published date
- HSK, category, access tier, and sort order on the public version projection
- section order per story
- sentence order per section
- question and option order
- unique progress per user and story
- attempt history by user/story and completion time
- unique version number per story

## 6. Learner experience

### Story library

The page begins with a concise Himi-branded introduction and real counts for published stories, represented levels, and categories. The discovery area includes:

- search across Vietnamese and Chinese titles
- HSK 1, HSK 2, and HSK 3 filters
- category filter for daily life and workplace contexts
- Free/VIP filter
- signed-in reading-state filter: unread or completed
- URL-backed filters so states are shareable and survive navigation

Each card shows cover art, HSK, category, Chinese and Vietnamese titles, summary, estimated duration, access state, audio availability, and progress. Locked stories expose useful metadata and a clear VIP label but not protected story text.

The library query fetches only the current published version's card projection and the current user's small progress projection. It never fetches sections, sentences, quiz content, or audio URLs.

### Story reader

The header shows title, summary, HSK, category, duration, access state, and saved progress. A compact reader toolbar provides:

- pinyin visibility toggle
- Vietnamese translation visibility toggle
- play/pause whole story
- playback speed: `0.75x`, `1x`, `1.25x`
- resume from the saved sentence

Each sentence presents Hanzi as the primary text, with optional speaker, pinyin, and Vietnamese translation. Selecting the sentence plays its audio and marks it as active. Continuous playback advances in order, scrolls the active sentence into a sensible viewport position, and stops cleanly at the end.

Curated keywords within the sentence are interactive and open a compact meaning card. Keyboard users can move between sentences and activate playback. Mobile uses a single-column reader with large targets and a toolbar that remains reachable without covering text.

Pinyin, translation, and playback speed preferences are stored locally for guests and may later be synchronized to accounts. Reading position is saved only for authenticated users.

### Vocabulary and comprehension

After the story, the reader shows a recap of curated keywords, followed by three comprehension questions. All questions must be answered before submission.

The result view shows score, pass/fail state, correct answers, and short explanations. At least two correct answers completes the story. Retakes remain available; the best score and attempt count update, while completion XP is granted once. The completion view recommends a published story at the same level or one level higher, subject to access rules.

### Access states

- Guest + free story: full reader and quiz, no persisted server progress or XP.
- Guest + VIP story: metadata and upgrade/login invitation, no protected body.
- Free account + free story: full reader, persisted progress, quiz history, completion, and XP.
- Free account + VIP story: metadata and upgrade invitation.
- VIP account + any published story: full experience.
- Authorized content staff: preview of non-published working content through the CMS preview route.

Unknown slugs and unauthorized attempts to access unpublished content return `404` unless the current admin/reviewer is using the preview route.

## 7. CMS experience

### Inventory

`/admin/stories` shows real counts for draft, review, published, and archived content. Staff can search and filter by HSK, category, access tier, status, author, reviewer, and completeness. Each row surfaces missing sections, sentences, approved audio, keywords, or quiz validity.

### Editor

The story editor is divided into five clear areas:

1. Basic metadata: titles, slug, summary, HSK, category, cover, duration, and Free/VIP.
2. Story body: sections, sentence content, speaker, and deterministic ordering.
3. Audio: direct Cloudinary upload, progress, playback preview, replacement, and review state.
4. Keywords: Hanzi, pinyin, meaning, source sentence, and ordering.
5. Comprehension: three questions, options, correct answer, explanation, and ordering.

Actions save bounded sections rather than posting one unmanageably large form. The UI warns about unsaved changes and supports up/down ordering controls that work without drag-and-drop. Authorized staff can open a learner-mode preview.

### Workflow and permissions

- Editors/admins create and edit drafts.
- The server runs the full publish checklist before accepting a review request.
- A reviewer validates language, translation, answers, and every audio asset.
- Reviewers can approve or return work with actionable notes.
- Only authorized reviewer/admin roles can publish.
- Published records cannot be hard-deleted; they can be archived.
- A published story is edited as a working revision while the current published version remains live.
- Material workflow transitions are written to the existing audit log.
- Destructive deletion is limited to eligible drafts and requires dependency checks.

### Publication checklist

A story cannot enter review or publication unless:

- required metadata is complete and the slug is unique
- HSK and category are valid
- at least one section exists
- every section has at least one sentence
- every sentence has Hanzi, pinyin, translation, and approved audio
- at least one curated keyword exists
- exactly three valid questions exist
- every question has at least two options and exactly one correct answer
- access tier is explicitly set

## 8. Data flow and component boundaries

### Read flow

1. Server repository fetches only published story versions.
2. Server access service evaluates guest, free account, or VIP entitlement.
3. The library receives card projections; the reader receives the authorized published snapshot without permanent Cloudinary URLs.
4. A small client reader component owns playback, display preferences, active sentence, and quiz interaction.
5. Audio is requested on demand through the protected media endpoint.

### Write flow

1. CMS server actions authorize the staff role.
2. Input is normalized and validated on the server.
3. Repository/service functions execute bounded transactions.
4. Workflow transitions run completeness validation and audit logging.
5. Publication creates an immutable version and switches the public pointer atomically.

### Code boundaries

- schema and migration definitions in the existing database layer
- story domain types and validation functions independent of React
- learner repository for published catalog/detail/progress queries
- admin service for CRUD, completeness, workflow, and versions
- access service that reuses existing authentication and VIP checks
- focused server components for routes
- client components only where playback, preference toggles, ordering, upload, or quiz state require them

## 9. Performance design

- The library performs no story-body query and initiates no audio request.
- The reader does not preload all sentence audio.
- Only the current asset is requested; the next sentence may be prepared after playback begins.
- No separate `<audio>` instance is rendered for every sentence.
- Playback objects and event handlers are cleaned up on navigation and source changes.
- Public catalog data may be cached; entitlement and per-user progress must never enter a shared cache.
- Cover images use fixed dimensions and optimized responsive delivery.
- Filtering is server-backed and pagination-ready even though the first release has only 12 stories.
- Queries use explicit projections and the indexes listed in the data model.
- Client JavaScript is limited to the interactive reader, quiz, filters when needed, and CMS controls.

## 10. Security and privacy

- Free/VIP and publication checks occur server-side for HTML, data actions, quiz submission, and audio delivery.
- Protected story bodies are not embedded in locked-page HTML or client props.
- VIP audio uses short-lived signed delivery after entitlement checks; fixed Cloudinary URLs are not written into public markup.
- Signed URLs reduce casual sharing but cannot prevent a legitimately authorized user from capturing media already delivered to their device.
- CMS mutations require role authorization on every server action, not only hidden navigation.
- Upload completion verifies Cloudinary response signatures, expected intent, file type, size, checksum, and ownership context.
- Quiz scoring is performed from server-owned question data; the client never supplies the correct answer.
- Progress and attempts accept only the authenticated user's identity from the session.
- Logs and audit records must not contain signed media credentials or sensitive session data.

## 11. Error handling

- Missing or unpublished public story: `404`.
- Locked story: stable metadata page with login/upgrade actions, not a generic error.
- Audio delivery failure: retain readable content, show retry, and allow moving to other sentences.
- Continuous playback failure: stop at the failed sentence, identify it, and permit retry or manual continuation.
- Lost network during quiz: preserve current in-memory selections and enable resubmission.
- Duplicate quiz submission: idempotent server behavior prevents duplicate completion XP.
- Invalid or incomplete CMS input: field-level messages plus a summary; no partial transaction.
- Upload interruption: the draft remains valid, the failed asset is not attached, and upload can be retried.
- Publish race: transaction and current-version check prevent two conflicting versions from becoming current.

## 12. Accessibility and responsive behavior

- Reader, vocabulary cards, playback, and quiz are fully operable by keyboard.
- Active sentence, playback state, result state, and loading/error feedback have appropriate accessible names and live announcements.
- Correct, incorrect, locked, and completed states use text/icons in addition to color.
- Touch targets are appropriately sized, and the reader has no horizontal overflow at narrow mobile widths.
- Focus returns predictably after dialogs/popovers and quiz submission.
- Reduced-motion preferences disable nonessential scrolling/animation.
- Heading hierarchy, landmarks, labels, and contrast meet the conventions already used by Himi.

## 13. SEO

- `/stories` and every published story have descriptive, original metadata.
- Story titles combine Vietnamese title, Chinese title, and HSK level naturally.
- Stable canonical URLs use the story slug.
- Breadcrumb structured data connects Home → Stories → Story.
- Appropriate article/learning-content structured data is used only when its fields are truthful.
- Only current published versions appear in the sitemap.
- Locked pages index metadata but do not expose the protected body.
- Archived and non-published versions are excluded from indexing.

## 14. Initial content plan

The initial set contains 12 original Himi stories:

- HSK 1: five stories, including all three free stories
- HSK 2: four stories
- HSK 3: three stories

Topics are distributed across daily life, office work, sales, service, logistics, and production. Each story should contain:

- two or three sections
- approximately 8–15 sentences appropriate to its level
- sentence-level approved audio
- six to ten curated keywords
- exactly three comprehension questions
- one explicit communication objective

The editorial team must verify level suitability, pinyin, Vietnamese meaning, cultural clarity, and answer correctness. Audio may be human-recorded or produced by an approved high-quality source, but it must pass the same reviewer workflow before publication.

## 15. Test strategy

Implementation follows test-driven development. Each behavior begins with a failing test, receives the minimum implementation to pass, and is refactored only while the suite remains green.

### Domain and validation tests

- publication checklist, exact question count, correct-option constraints
- ordering and snapshot serialization
- HSK/category/access normalization
- quiz scoring and pass threshold
- first-completion and XP idempotency
- published-version switching and archive behavior

### Repository and authorization tests

- catalog returns only current published projections
- locked detail never returns protected content
- guest, free, VIP, editor, reviewer, and admin permissions
- progress upsert uniqueness and version-aware resume
- quiz transaction rollback and duplicate submission behavior
- protected audio entitlement and asset-review requirements

### Component and route tests

- search/filter URL behavior and empty states
- card access/progress states
- pinyin and translation toggles
- per-sentence and continuous playback state machine
- speed selection, failure recovery, and cleanup
- quiz selection, submission, result, and retake
- CMS completeness feedback and workflow actions

### Verification

- full automated test suite
- lint and TypeScript checks
- production build
- mobile and desktop route walkthroughs
- keyboard and screen-reader-oriented checks
- network inspection confirming no library audio/body fetch and on-demand reader audio
- Free/VIP and unpublished-content security checks

## 16. Acceptance criteria

The feature is ready to release only when:

- all learner and CMS routes in this specification exist and use real database data
- the 12 original stories exist as CMS-managed drafts
- at least the three free HSK 1 stories have passed content and audio review and can be published
- every published sentence has approved, working audio
- the library does not fetch story bodies or audio
- sentence playback and whole-story sequential playback work on desktop and mobile
- pinyin, translation, speed, keyword, and resume controls work as specified
- guest, free, VIP, and staff access rules are enforced server-side
- passing at two of three questions completes the story
- completion XP cannot be awarded more than once per user/story
- a published story remains stable while a new working revision is edited
- responsive and accessibility checks reveal no critical issues
- automated tests, lint, type checks, and production build pass

## 17. Risks and mitigations

- **Audio production becomes the release bottleneck.** Keep stories in draft until all sentence assets are approved; make CMS completeness visible at inventory level.
- **Versioning adds authoring complexity.** Limit the first version to one working revision plus one current published pointer and immutable version history.
- **Too many client audio objects increase memory/network use.** Use a single playback controller and on-demand asset resolution.
- **VIP content leaks through data serialization.** Separate metadata and protected detail repositories and test locked responses directly.
- **XP duplication from retries or concurrent requests.** Use one transaction, a first-completion condition, and database uniqueness/idempotency constraints.
- **Story content drifts above the claimed HSK level.** Require reviewer sign-off and a content checklist; automated vocabulary-level analysis can be added later but is not a first-release gate.

## 18. Rollout sequence

The later implementation plan should stage work so every phase remains verifiable:

1. domain validation and schema/migration
2. repositories, access rules, versions, progress, quiz, and XP
3. CMS inventory/editor/audio/review workflow
4. learner library and locked states
5. reader, audio controller, vocabulary, and quiz
6. original content seeding and audio review
7. SEO, accessibility, performance verification, and release checks

No production story should be published merely because the code path exists; publication remains gated by the approved content and audio checklist.
