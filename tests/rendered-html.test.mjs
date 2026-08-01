import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("home page contains the HanziWork daily learning dashboard", async () => {
  const source = await read("app/page.tsx");
  assert.match(source, /Bài học hôm nay/);
  assert.match(source, /Bắt đầu bài học/);
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
  assert.match(hub, /Bắt đầu xử lý ca/);
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
