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
  assert.match(studio, /swipe-review-demo\.gif/);
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
  assert.match(hub, /Phòng luyện công việc/);
  assert.match(hub, /Bắt đầu ca nghe/);
  assert.match(hub, /Đáp án mở sau khi audio kết thúc/);
  assert.match(hub, /Nghe chậm 0\.8×/);
  assert.match(hub, /chooseListeningAnswer\(true\)/);
  assert.match(hub, /chooseListeningAnswer\(false\)/);
  assert.match(repository, /exercises: locked \? null : scenario\.exercises/);
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
