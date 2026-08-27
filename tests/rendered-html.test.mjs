import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home page contains the Himi Chinese daily review studio", async () => {
  const [page, studio, verifyEmail] = await Promise.all([
    read("app/page.tsx"),
    read("components/review-home-studio.tsx"),
    read("app/api/auth/verify-email/route.ts"),
  ]);
  assert.match(page, /ReviewHomeStudio/);
  assert.match(page, /verified=\{params\.verified === "1"\}/);
  assert.match(page, /getDailySessionSource/);
  assert.match(page, /buildDailySession/);
  assert.match(studio, /Phiên 10 phút hôm nay/);
  assert.match(studio, /Email đã xác minh\. Chào mừng bạn đến Himi Chinese\./);
  assert.match(verifyEmail, /new URL\("\/\?verified=1"/);
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
  assert.match(files[1], /getVipUpgradeOverview/);
  assert.match(files[1], /Gửi yêu cầu kích hoạt/);
  assert.match(files[1], /beta thủ công và chưa thu tiền tự động/);
  assert.match(files[1], /Từ yêu cầu đến lúc bắt đầu học/);
  assert.match(files[2], /Tổng quan vận hành/);
});

test("VIP activation requests stay single-pending and approve atomically", async () => {
  const [schema, learnerActions, adminActions, requestService, adminPage, account] = await Promise.all([
    read("db/schema.ts"),
    read("app/vip/actions.ts"),
    read("app/admin/actions.ts"),
    read("lib/vip-activation-request-service.ts"),
    read("app/admin/subscriptions/page.tsx"),
    read("app/account/page.tsx"),
  ]);
  assert.match(schema, /vip_activation_request_status/);
  assert.match(schema, /vip_activation_requests_user_pending_uq/);
  assert.match(learnerActions, /requestVipActivationAction/);
  assert.match(learnerActions, /cancelVipActivationRequestAction/);
  assert.match(adminActions, /approveVipActivationRequestAction/);
  assert.match(adminActions, /rejectVipActivationRequestAction/);
  assert.match(requestService, /grantOrExtendVipAccessInTransaction/);
  assert.match(requestService, /admin\.vip_activation_request\.approved/);
  assert.match(requestService, /admin\.vip_activation_request\.rejected/);
  assert.match(adminPage, /Hàng đợi kích hoạt/);
  assert.match(account, /getPendingVipActivationRequest/);
});

test("in-app notifications are user-scoped, readable and linked to VIP decisions", async () => {
  const [schema, service, actions, page, shell, authSession, vipService] = await Promise.all([
    read("db/schema.ts"),
    read("lib/notification-service.ts"),
    read("app/notifications/actions.ts"),
    read("app/notifications/page.tsx"),
    read("components/learner-app-shell.tsx"),
    read("lib/auth-session.ts"),
    read("lib/vip-activation-request-service.ts"),
  ]);
  assert.match(schema, /notifications_user_type_entity_uq/);
  assert.match(schema, /notifications_user_read_created_idx/);
  assert.match(service, /eq\(notifications\.userId, userId\)/);
  assert.match(service, /safeReturnTo\(notification\.href/);
  assert.match(actions, /getCurrentUser/);
  assert.match(actions, /markAllUserNotificationsRead/);
  assert.match(page, /Hộp thư của bạn/);
  assert.match(page, /openNotificationAction/);
  assert.match(shell, /topbar-notification-count/);
  assert.match(shell, /href=\{notificationsHref\}/);
  assert.match(authSession, /unreadNotificationCount/);
  assert.match(vipService, /vip_request_approved/);
  assert.match(vipService, /vip_request_rejected/);
});

test("production start uses the Cloudflare runtime with an absolute local env file", async () => {
  const [packageJsonSource, startScript, database] = await Promise.all([
    read("package.json"),
    read("scripts/start-production.ts"),
    read("db/index.ts"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.equal(
    packageJson.scripts.start,
    "node --experimental-strip-types scripts/start-production.ts",
  );
  assert.match(startScript, /node_modules", "wrangler", "bin", "wrangler\.js/);
  assert.match(startScript, /"--config",\s*workerConfig/);
  assert.match(startScript, /"--env-file",\s*environmentFile/);
  assert.match(startScript, /resolve\(projectRoot, filename\)/);
  assert.match(startScript, /process\.env\.PORT/);
  assert.match(database, /replaceAll\(configuredUrl, "\[DATABASE_URL\]"\)/);
  assert.match(database, /params: \[redacted\]/);
});

test("health endpoint checks PostgreSQL without exposing configuration details", async () => {
  const route = await read("app/api/health/route.ts");

  assert.match(route, /readDb/);
  assert.match(route, /select 1 as ready/);
  assert.match(route, /database: "ok"/);
  assert.match(route, /database: "error"/);
  assert.match(route, /status: 503/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /DATABASE_URL|error\.message|String\(error\)/);
});

test("staging deployment keeps secrets out of source and uses secure auth settings", async () => {
  const [packageJsonSource, wrangler, secretScript] = await Promise.all([
    read("package.json"),
    read("wrangler.jsonc"),
    read("scripts/configure-staging-secrets.ts"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.equal(
    packageJson.scripts["deploy:staging"],
    "npm run build && wrangler deploy --name hanziwork-staging",
  );
  assert.match(packageJson.scripts.lint, /--ignore-pattern \.wrangler/);
  assert.match(wrangler, /"name": "hanziwork-staging"/);
  assert.match(wrangler, /"observability"/);
  assert.match(secretScript, /AUTH_COOKIE_SECURE: "1"/);
  assert.match(secretScript, /AUTH_TRUST_CF_CONNECTING_IP: "1"/);
  assert.match(secretScript, /AUTH_TRUST_X_FORWARDED_FOR: "0"/);
  assert.match(secretScript, /child\.stdin\.end\(JSON\.stringify\(secrets\)\)/);
  assert.doesNotMatch(wrangler, /DATABASE_URL|AUTH_SECRET|CLOUDINARY_URL/);
});

test("staging verification covers auth, VIP, notifications, audio and fixture cleanup", async () => {
  const [packageJsonSource, verification] = await Promise.all([
    read("package.json"),
    read("scripts/verify-staging.ts"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.match(packageJson.scripts["verify:staging"], /scripts\/verify-staging\.ts/);
  assert.match(verification, /\/api\/auth\/login/);
  assert.match(verification, /\/api\/auth\/register/);
  assert.match(verification, /vip_request_approved/);
  assert.match(verification, /VIP đã được kích hoạt/);
  assert.match(verification, /practice-audio/);
  assert.match(verification, /cloudinary\.com/);
  assert.match(verification, /finally \{/);
  assert.match(verification, /qaUsersRemaining/);
  assert.doesNotMatch(verification, /console\.log\([^)]*password|console\.log\([^)]*Cookie/);
});

test("password migration audit reports only aggregate algorithm counts", async () => {
  const [packageJsonSource, auditScript] = await Promise.all([
    read("package.json"),
    read("scripts/audit-password-hashes.ts"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.match(packageJson.scripts["auth:password-audit"], /audit-password-hashes\.ts/);
  assert.match(auditScript, /split_part/);
  assert.match(auditScript, /count\(\*\)::int/);
  assert.match(auditScript, /role: users\.role/);
  assert.doesNotMatch(auditScript, /users\.email|select\(\{[^}]*email/);
});

test("legacy password migration verifies the current password before rehashing", async () => {
  const [packageJsonSource, migration] = await Promise.all([
    read("package.json"),
    read("scripts/migrate-account-password.ts"),
  ]);
  const packageJson = JSON.parse(packageJsonSource);

  assert.match(packageJson.scripts["auth:password-migrate"], /migrate-account-password\.ts/);
  assert.match(migration, /verifyPassword\(currentPassword, user\.passwordHash\)/);
  assert.match(migration, /hashPassword\(currentPassword\)/);
  assert.match(migration, /delete\(authSessions\)/);
  assert.match(migration, /update\(authTokens\)/);
  assert.doesNotMatch(migration, /console\.log\([^)]*currentPassword/);
});

test("admin can grant, extend and revoke VIP while learners see their live entitlement", async () => {
  const [page, actions, service, account, access, consoleHeader, consoleNavigation] = await Promise.all([
    read("app/admin/subscriptions/page.tsx"),
    read("app/admin/actions.ts"),
    read("lib/admin-subscription-service.ts"),
    read("app/account/page.tsx"),
    read("lib/lesson-access.ts"),
    read("components/admin-console.tsx"),
    read("components/admin-navigation.tsx"),
  ]);
  assert.match(page, /VIP & Thanh toán/);
  assert.match(page, /grantOrExtendVipAction/);
  assert.match(page, /revokeVipAction/);
  assert.match(actions, /requireAdminUser/);
  assert.match(service, /for\("update"\)/);
  assert.match(service, /admin\.subscription\.granted/);
  assert.match(service, /admin\.subscription\.extended/);
  assert.match(service, /admin\.subscription\.revoked/);
  assert.match(account, /getActiveVipSubscription/);
  assert.match(account, /Quyền VIP có hiệu lực đến/);
  assert.match(access, /getActiveVipSubscription/);
  assert.match(consoleHeader, /AdminNavigation/);
  assert.match(consoleHeader, /prefetch=\{false\}/);
  assert.match(consoleNavigation, /href: "\/admin\/subscriptions"/);
  assert.match(consoleNavigation, /prefetch=\{false\}/);
  assert.match(consoleNavigation, /getAdminPrefetchHrefs/);
  assert.match(consoleNavigation, /requestIdleCallback/);
  assert.match(consoleNavigation, /router\.prefetch\(href\)/);
  assert.match(consoleNavigation, /onMouseEnter=\{\(\) => prepareRoute\(href\)\}/);
  assert.match(consoleNavigation, /onFocus=\{\(\) => prepareRoute\(href\)\}/);
});

test("admin business console exposes dashboard, users, VIP payments and analytics", async () => {
  const [dashboard, users, vip, analytics, loading, actions, exportRoute, schema] = await Promise.all([
    read("app/admin/page.tsx"),
    read("app/admin/users/page.tsx"),
    read("app/admin/subscriptions/page.tsx"),
    read("app/admin/analytics/page.tsx"),
    read("app/admin/loading.tsx"),
    read("app/admin/actions.ts"),
    read("app/api/admin/users/export/route.ts"),
    read("db/schema.ts"),
  ]);

  assert.match(dashboard, /Doanh thu/);
  assert.match(dashboard, /Hoạt động gần đây/);
  assert.match(dashboard, /Giao dịch gần đây/);
  assert.match(users, /Tên người dùng hoặc email/);
  assert.match(users, /Xuất Excel/);
  assert.match(users, /Nâng cấp/);
  assert.match(vip, /createVipPlanAction/);
  assert.match(vip, /Lịch sử giao dịch/);
  assert.match(analytics, /Đồ thị người dùng/);
  assert.match(analytics, /Đồ thị doanh thu/);
  assert.match(loading, /Đang tải dữ liệu quản trị/);
  assert.match(actions, /deleteAdminUserAction/);
  assert.match(actions, /toggleVipPlanAction/);
  assert.match(exportRoute, /text\/csv/);
  assert.match(schema, /discountPercent/);
  assert.match(schema, /promotionLabel/);
});

test("account page uses the approved profile-first layout without learning progress", async () => {
  const [account, session] = await Promise.all([
    read("app/account/page.tsx"),
    read("lib/auth-session.ts"),
  ]);

  assert.match(account, /Tài khoản của tôi/);
  assert.match(account, /account-profile-hero/);
  assert.match(account, /Thông tin tài khoản/);
  assert.match(account, /Tài khoản &amp; bảo mật/);
  assert.match(account, /Ngày tham gia/);
  assert.match(account, /account-security-details/);
  assert.doesNotMatch(account, /getLearningSummary/);
  assert.doesNotMatch(account, /Tiến độ học tập|Tiếp tục phiên hôm nay/);
  assert.match(session, /createdAt: users\.createdAt/);
});

test("layout provides Vietnamese metadata", async () => {
  const source = await read("app/layout.tsx");
  assert.match(source, /Himi Chinese — Tiếng Trung cho người đi làm/);
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
  const [shell, coursesLoading, practiceLoading, lessons, siteHeader, siteFooter, mobileNav] = await Promise.all([
    read("components/learner-app-shell.tsx"),
    read("app/courses/loading.tsx"),
    read("app/practice/loading.tsx"),
    read("lib/lesson-repository.ts"),
    read("components/site-header.tsx"),
    read("components/site-footer.tsx"),
    read("components/mobile-nav.tsx"),
  ]);
  assert.match(shell, /router\.prefetch/);
  assert.match(shell, /if \(isStandaloneRoute\(pathname\)\) return;/);
  assert.match(shell, /route-transition-progress/);
  assert.match(shell, /pendingHref/);
  assert.match(siteHeader, /prefetch=\{false\}/);
  assert.match(siteFooter, /prefetch=\{false\}/);
  assert.match(mobileNav, /prefetch=\{false\}/);
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
