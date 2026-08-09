import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home page contains the HanziWork daily review studio", async () => {
  const [page, studio] = await Promise.all([
    read("app/page.tsx"),
    read("components/review-home-studio.tsx"),
  ]);
  assert.match(page, /ReviewHomeStudio/);
  assert.match(page, /getDailySessionSource/);
  assert.match(page, /buildDailySession/);
  assert.match(studio, /Phiên 10 phút hôm nay/);
  assert.match(studio, /today-session-steps/);
  assert.match(studio, /dailySession\.totalSteps/);
  assert.match(studio, /swipe-review-demo\.gif/);
  assert.match(studio, /Câu dùng ngay/);
  assert.match(studio, /我马上跟进。/);
  assert.match(studio, /speechSynthesis/);
  assert.match(studio, /review-next-lesson[\s\S]*review-swipe-demo-below/);
  assert.doesNotMatch(studio, /Nhịp tuần này|review-week-rhythm/);
  assert.doesNotMatch(page, /getLearningSummary/);
  assert.match(studio, /onExitComplete=\{finishCardTransition\}/);
  assert.match(studio, /type: "spring", stiffness: 320/);
  assert.doesNotMatch(studio, /setTimeout\(advance, 360\)/);
  assert.doesNotMatch(studio, /review-session-summary/);
  assert.doesNotMatch(studio, /Phiên ôn hôm nay|Kéo là bắt đầu/);
  assert.doesNotMatch(studio, /Bắt đầu lượt ôn/);
});

test("prototype includes learner, VIP and admin routes", async () => {
  const files = await Promise.all([read("app/courses/page.tsx"), read("app/vip/page.tsx"), read("app/admin/page.tsx")]);
  assert.match(files[0], /CourseExplorer/);
  assert.match(files[1], /Mốc cần đạt trước khi nhận tiền/);
  assert.match(files[1], /Trọn lộ trình Nhà máy/);
  assert.match(files[1], /Trọn lộ trình Kho vận/);
  assert.match(files[1], /Trọn lộ trình Bán hàng/);
  assert.match(files[1], /Trọn lộ trình Nhà hàng/);
  assert.match(files[1], /Trọn lộ trình Thương mại điện tử/);
  assert.match(files[1], /Trọn lộ trình Giao tiếp cốt lõi/);
  assert.match(files[2], /Tổng quan vận hành/);
});

test("layout provides Vietnamese metadata", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /HanziWork — Tiếng Trung cho người đi làm/);
  assert.match(source, /<html lang="vi"/);
});

test("learner routes share one responsive application shell", async () => {
  const [layout, shell, home, practice] = await Promise.all([
    read("app/layout.tsx"),
    read("components/learner-app-shell.tsx"),
    read("app/page.tsx"),
    read("app/practice/page.tsx"),
  ]);
  assert.match(layout, /LearnerAppShell/);
  assert.match(shell, /usePathname/);
  assert.match(shell, /learner-shell-content/);
  assert.match(shell, /learner-mobile-nav/);
  assert.doesNotMatch(shell, /navigationHiddenPrefixes/);
  assert.doesNotMatch(shell, /is-navigation-hidden/);
  assert.match(shell, /"\/admin"/);
  assert.match(shell, /"\/login"/);
  assert.doesNotMatch(home, /className="learn-rail"/);
  assert.doesNotMatch(practice, /className="learn-rail"/);
});

test("practice route renders the work scenario hub", async () => {
  const [page, hub, repository] = await Promise.all([
    read("app/practice/page.tsx"),
    read("components/work-practice-hub.tsx"),
    read("lib/practice-repository.ts"),
  ]);
  assert.match(page, /WorkPracticeHub/);
  assert.match(hub, /Kho ca làm/);
  assert.match(hub, /Bắt đầu ca nghe/);
  assert.match(hub, /Đáp án mở sau khi audio kết thúc/);
  assert.match(hub, /Nghe chậm 0\.8×/);
  assert.match(hub, /chooseListeningAnswer\(true\)/);
  assert.match(hub, /chooseListeningAnswer\(false\)/);
  assert.match(hub, /\/api\/progress\/practice/);
  assert.match(hub, /Đang đo thời lượng/);
  assert.doesNotMatch(hub, /03\/08\/2026/);
  assert.doesNotMatch(hub, /0:00 — 0:08/);
  assert.match(repository, /exercises: locked \? null : scenario\.exercises/);
  assert.match(repository, /accessibleScenarioIds/);
  assert.match(repository, /practiceExercises/);
});

test("practice content has PostgreSQL schema, seed and authenticated admin CRUD", async () => {
  const [schema, seed, service, actions, page, scenarioEditor, uploader, uploadRoute, mediaRoute, cloudinary] = await Promise.all([
    read("db/schema.ts"),
    read("db/seed.ts"),
    read("lib/admin-practice-service.ts"),
    read("app/admin/actions.ts"),
    read("app/admin/practice/page.tsx"),
    read("app/admin/practice/scenarios/[scenarioId]/page.tsx"),
    read("components/practice-audio-uploader.tsx"),
    read("app/api/admin/practice-audio/route.ts"),
    read("app/api/media/practice-audio/[assetId]/route.ts"),
    read("lib/cloudinary-practice-audio.ts"),
  ]);
  assert.match(schema, /practice_industries/);
  assert.match(schema, /practice_scenarios/);
  assert.match(schema, /practice_exercises/);
  assert.match(schema, /practice_scenario_versions/);
  assert.match(schema, /practice_audio_assets/);
  assert.match(seed, /practiceScenarios/);
  assert.match(service, /createScenarioVersion/);
  assert.match(service, /practiceAttempts/);
  assert.match(actions, /requireAdminUser/);
  assert.match(actions, /createPracticeScenarioAction/);
  assert.match(page, /PracticeIndustryForm/);
  assert.match(scenarioEditor, /PracticeExerciseForm/);
  assert.match(scenarioEditor, /deletePracticeExerciseAction/);
  assert.match(uploader, /sha256/);
  assert.match(uploadRoute, /isSameOriginRequest/);
  assert.match(uploadRoute, /verifyPracticeAudioUploadResponse/);
  assert.match(uploader, /uploadDirectlyToCloudinary/);
  assert.match(cloudinary, /api_sign_request/);
  assert.match(mediaRoute, /getPracticeAudioPayload/);
  assert.match(mediaRoute, /Content-Range/);
});

test("games route renders the Cánh Cụt slice game and six video-inspired activities", async () => {
  const [page, legacyPage, center, game, shell, styles, content] = await Promise.all([
    read("app/games/page.tsx"),
    read("app/writing/page.tsx"),
    read("components/game-center.tsx"),
    read("components/writing-slice-game.tsx"),
    read("components/learner-app-shell.tsx"),
    read("app/globals.css"),
    read("lib/game-content.ts"),
  ]);
  assert.match(page, /GameCenter/);
  assert.match(legacyPage, /redirect\("\/games"\)/);
  assert.match(center, /Luyện chém từ/);
  assert.match(center, /Ghép cặp siêu tốc/);
  assert.match(center, /Nối nhanh chữ – âm/);
  assert.match(center, /Nghe và chọn đúng/);
  assert.match(center, /Viết chữ theo nghĩa/);
  assert.match(center, /Flashcard 3D/);
  assert.match(center, /Thử thách tổng hợp/);
  assert.match(center, /Hành trình phản xạ/);
  assert.match(center, /journey-map-desktop\.webp/);
  assert.match(center, /journey-map-mobile-long\.webp/);
  assert.match(center, /memory-penguin-cutout\.png/);
  assert.match(center, /connect-penguin-cutout\.png/);
  assert.match(center, /listen-penguin-cutout\.png/);
  assert.match(center, /write-penguin-cutout\.png/);
  assert.match(center, /flashcard-penguin-cutout\.png/);
  assert.match(center, /quiz-penguin-cutout\.png/);
  assert.match(center, /localStorage/);
  assert.match(center, /\/api\/progress\/game/);
  assert.match(center, /game-immersive-dashboard/);
  assert.match(game, /bamboo-landscape\.webp/);
  assert.match(game, /penguin-bamboo-warrior\.png/);
  assert.match(game, /penguin-bamboo-warrior-cape\.png/);
  assert.match(game, /bamboo-slice-burst\.png/);
  assert.match(game, /normalizeAnswer/);
  assert.match(game, /handleCorrect/);
  assert.match(game, /speechSynthesis/);
  assert.match(game, /writing-game-back/);
  assert.match(shell, /href: "\/games"/);
  assert.match(shell, /label: "Trò chơi"/);
  assert.doesNotMatch(shell, /navigationHiddenPrefixes/);
  assert.doesNotMatch(shell, /is-navigation-hidden/);
  assert.doesNotMatch(shell, /immersive-route-back/);
  assert.match(styles, /\.game-center-hero/);
  assert.match(styles, /\.game-card-visual/);
  assert.match(styles, /\.game-journey-stage/);
  assert.match(styles, /\.game-journey-station/);
  assert.match(styles, /\.memory-grid/);
  assert.match(styles, /\.flashcard-3d/);
  assert.match(styles, /:has\(\.game-immersive-dashboard\) \.learn-rail/);
  assert.doesNotMatch(styles, /\.learner-app-shell\.is-navigation-hidden \.learn-rail/);
  assert.match(styles, /@keyframes writing-word-fall/);
  assert.match(styles, /@keyframes writing-penguin-strike/);
  assert.match(styles, /@keyframes writing-penguin-cape-flutter/);
  assert.match(styles, /@keyframes writing-slice-impact/);
  assert.match(styles, /@keyframes writing-slice-left/);
  assert.equal((content.match(/id: "/g) ?? []).length, 12);
});

test("practice and game progress persist per authenticated learner", async () => {
  const [schema, repository, practiceRoute, gameRoute, practicePage, gamesPage] = await Promise.all([
    read("db/schema.ts"),
    read("lib/activity-progress-repository.ts"),
    read("app/api/progress/practice/route.ts"),
    read("app/api/progress/game/route.ts"),
    read("app/practice/page.tsx"),
    read("app/games/page.tsx"),
  ]);
  assert.match(schema, /practice_attempts/);
  assert.match(schema, /game_attempts/);
  assert.match(repository, /recordPracticeAttempt/);
  assert.match(repository, /recordGameAttempt/);
  assert.match(practiceRoute, /isSameOriginRequest/);
  assert.match(practiceRoute, /getCurrentUser/);
  assert.match(gameRoute, /isSameOriginRequest/);
  assert.match(gameRoute, /getCurrentUser/);
  assert.match(practicePage, /getPracticeProgress/);
  assert.match(gamesPage, /getGameProgress/);
});

test("daily session reads today's learner activity and deep-links each next step", async () => {
  const [repository, model, schema, lessonPage, lessonWorkspace, practicePage, practiceHub, gamesPage, gameCenter, reviewStudio] = await Promise.all([
    read("lib/daily-session-repository.ts"),
    read("lib/daily-session.ts"),
    read("db/schema.ts"),
    read("app/learn/[slug]/page.tsx"),
    read("components/lesson-workspace.tsx"),
    read("app/practice/page.tsx"),
    read("components/work-practice-hub.tsx"),
    read("app/games/page.tsx"),
    read("components/game-center.tsx"),
    read("components/review-home-studio.tsx"),
  ]);
  assert.match(repository, /vietnamDayRange/);
  assert.match(repository, /practiceAttempts/);
  assert.match(repository, /gameAttempts/);
  assert.match(model, /minutes: 2/);
  assert.match(model, /minutes: 4/);
  assert.match(model, /minutes: 3/);
  assert.match(model, /minutes: 1/);
  assert.match(model, /withDailySessionFlow/);
  assert.match(schema, /last_reviewed_at/);
  assert.match(lessonPage, /dailyFlow/);
  assert.match(lessonWorkspace, /Luyện ca tiếp theo/);
  assert.match(practicePage, /initialScenarioId/);
  assert.match(practiceHub, /03\/04 · Phản xạ 1 phút/);
  assert.match(gamesPage, /initialGameId/);
  assert.match(gameCenter, /daily-game-flow-action/);
  assert.match(gameCenter, /session=today#today-summary/);
  assert.match(reviewStudio, /4\/4 · Phiên hôm nay đã xong/);
  assert.match(reviewStudio, /today-session-summary/);
});

test("public trust pages and current account copy are present", async () => {
  const [footer, authCard, terms, privacy] = await Promise.all([
    read("components/site-footer.tsx"),
    read("components/auth-card.tsx"),
    read("app/terms/page.tsx"),
    read("app/privacy/page.tsx"),
  ]);
  assert.match(footer, /href="\/terms"/);
  assert.match(footer, /href="\/privacy"/);
  assert.doesNotMatch(footer, /Bản prototype sản phẩm/);
  assert.match(authCard, /đồng bộ bài học, Luyện ca, trò chơi và lịch ôn/);
  assert.match(terms, /Điều khoản sử dụng/);
  assert.match(privacy, /Chính sách bảo mật/);
});

test("learner navigation prefetches primary routes and exposes immediate loading feedback", async () => {
  const [shell, coursesLoading, practiceLoading, lessons] = await Promise.all([
    read("components/learner-app-shell.tsx"),
    read("app/courses/loading.tsx"),
    read("app/practice/loading.tsx"),
    read("lib/lesson-repository.ts"),
  ]);
  assert.match(shell, /router\.prefetch/);
  assert.match(shell, /route-transition-progress/);
  assert.match(shell, /pendingHref/);
  assert.match(coursesLoading, /CoursesPageSkeleton/);
  assert.match(practiceLoading, /Đang chuẩn bị Kho ca làm/);
  assert.match(lessons, /getCachedPublishedPracticeVocabulary/);
});

test("course library uses seven editorial topic covers and a streamed catalog", async () => {
  const [page, card, visuals] = await Promise.all([
    read("app/courses/page.tsx"),
    read("components/course-card.tsx"),
    read("lib/course-visuals.ts"),
  ]);
  assert.match(page, /Chọn đúng ngành, học đúng việc/);
  assert.match(page, /Suspense/);
  assert.match(card, /course-cover-image/);
  assert.match(card, /unoptimized/);
  assert.equal((visuals.match(/src: "\/assets\/courses\//g) ?? []).length, 7);
});

test("lesson vocabulary uses a focused interactive card deck", async () => {
  const [workspace, deck] = await Promise.all([
    read("components/lesson-workspace.tsx"),
    read("components/lesson-vocabulary-deck.tsx"),
  ]);
  assert.match(workspace, /LessonVocabularyDeck/);
  assert.doesNotMatch(workspace, /className="word-list"/);
  assert.match(deck, /speechSynthesis/);
  assert.match(deck, /Đã hiểu · Tiếp tục/);
  assert.match(deck, /ArrowLeft/);
  assert.match(deck, /ArrowRight/);
  assert.match(deck, /remembered: false/);
});

test("practice editorial workflow separates authoring, review, publishing, versions, assignments, and role management", async () => {
  const [workflow, queue, versions, actions, practicePage, scenarioPage, teamPage, auth] = await Promise.all([
    read("lib/practice-workflow.ts"),
    read("lib/practice-review-queue.ts"),
    read("lib/practice-version.ts"),
    read("app/admin/actions.ts"),
    read("app/admin/practice/page.tsx"),
    read("app/admin/practice/scenarios/[scenarioId]/page.tsx"),
    read("app/admin/team/page.tsx"),
    read("lib/admin-auth.ts"),
  ]);
  assert.match(workflow, /assessPracticeReadiness/);
  assert.match(workflow, /canTransitionPracticeScenario/);
  assert.match(workflow, /canTransitionAssignedPracticeScenario/);
  assert.match(queue, /parsePracticeReviewDueDate/);
  assert.match(versions, /preparePracticeVersionRestore/);
  assert.match(actions, /transitionPracticeScenarioAction/);
  assert.match(actions, /restorePracticeScenarioVersionAction/);
  assert.match(actions, /assignPracticeReviewAction/);
  assert.match(actions, /claimPracticeReviewAction/);
  assert.match(actions, /updateUserRoleAction/);
  assert.match(scenarioPage, /PracticeWorkflowPanel/);
  assert.match(scenarioPage, /PracticeReviewAssignmentPanel/);
  assert.match(practicePage, /PracticeReviewQueue/);
  assert.match(scenarioPage, /PracticeVersionHistory/);
  assert.match(scenarioPage, /canEditPracticeScenario/);
  assert.match(teamPage, /listAdminUsers/);
  assert.match(auth, /requirePracticeStaffUser/);
});
