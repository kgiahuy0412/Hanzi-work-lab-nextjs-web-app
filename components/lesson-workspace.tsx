"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Award, CheckCircle2, ChevronDown, ChevronUp, Crown, Gamepad2, Headphones, LockKeyhole } from "lucide-react";
import { LessonChallengePanel } from "@/components/lesson-challenge";
import { LessonVocabularyDeck } from "@/components/lesson-vocabulary-deck";
import type { Course, LessonAccess, LessonDetail, LessonProgressState, LessonSummary } from "@/lib/content-types";
import { withDailySessionFlow, type DailyRecommendation } from "@/lib/daily-session";

type LessonTab = "Từ vựng" | "Hội thoại" | "Ghi chú" | "Kiểm tra";
const baseTabs: LessonTab[] = ["Từ vựng", "Hội thoại", "Ghi chú"];

export function LessonWorkspace({
  course,
  lessons,
  lesson,
  access,
  progress,
  authenticated,
  dailyFlow,
  dailyNextStep,
}: {
  course: Course;
  lessons: LessonSummary[];
  lesson: LessonDetail;
  access: LessonAccess;
  progress: LessonProgressState | null;
  authenticated: boolean;
  dailyFlow: boolean;
  dailyNextStep: DailyRecommendation | null;
}) {
  const [tab, setTab] = useState<LessonTab>("Từ vựng");
  const [pendingLesson, setPendingLesson] = useState<string | null>(null);
  const [challengePassed, setChallengePassed] = useState(!lesson.challenge);
  const [mobileLessonsOpen, setMobileLessonsOpen] = useState(false);
  const tabs = lesson.challenge ? [...baseTabs, "Kiểm tra" as const] : baseTabs;
  const moduleGroups = lessons.reduce<Array<{ slug: string; title: string; order: number; lessons: LessonSummary[] }>>((groups, item) => {
    const current = groups[groups.length - 1];
    if (!current || current.slug !== item.moduleSlug) {
      groups.push({ slug: item.moduleSlug, title: item.moduleTitle, order: item.moduleOrder, lessons: [item] });
    } else {
      current.lessons.push(item);
    }
    return groups;
  }, []);
  const lessonNumber = lesson.order + 1;
  const tabIndex = tabs.indexOf(tab);
  const completed = progress?.completionPercent === 100;
  const requiresChallengePass = Boolean(lesson.challenge) && !challengePassed;
  const viewerHasVip = access.source === "vip";
  const lessonHref = `/learn/${course.slug}?lesson=${lesson.slug}`;
  const returnTo = dailyFlow ? withDailySessionFlow(lessonHref) : lessonHref;
  const completionReturnTo = dailyFlow ? `${returnTo}#daily-next` : returnTo;
  const dailyNextKind = dailyNextStep?.href.startsWith("/practice")
    ? "practice"
    : dailyNextStep?.href.startsWith("/games")
      ? "game"
      : "summary";
  const DailyNextIcon = dailyNextKind === "practice" ? Headphones : dailyNextKind === "game" ? Gamepad2 : Award;
  const continueToDialogue = useCallback(() => setTab("Hội thoại"), []);

  useEffect(() => {
    if (!authenticated || !access.allowed) return;
    const timer = window.setTimeout(() => {
      void fetch("/api/progress/lesson/open", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courseSlug: course.slug, lessonSlug: lesson.slug }),
        keepalive: true,
      });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [access.allowed, authenticated, course.slug, lesson.slug]);

  return <div className="lesson-shell">
    <aside className="lesson-sidebar">
      <div className="lesson-sidebar-header"><span>Lộ trình đang học</span><h2>{course.title}</h2><p>{lessons.length} bài đã xuất bản · {lessons.filter((item) => item.isFree).length} bài học thử</p><button aria-controls="lesson-course-navigation" aria-expanded={mobileLessonsOpen} className="lesson-sidebar-toggle" onClick={() => setMobileLessonsOpen((open) => !open)} type="button"><span>Bài {lessonNumber} / {lessons.length}</span>{mobileLessonsOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</button></div>
      <nav className={`lesson-nav${mobileLessonsOpen ? " mobile-open" : ""}`} id="lesson-course-navigation" aria-label="Danh sách bài học">{moduleGroups.map((group) => <section className="lesson-module-group" key={group.slug}>
        <div className="lesson-module-title"><span>Module {group.order + 1}</span><strong>{group.title}</strong></div>
        {group.lessons.map((item) => {
          const active = item.slug === lesson.slug;
          const locked = !item.isFree && !viewerHasVip;
          const pending = pendingLesson === item.slug && item.slug !== lesson.slug;
          return <Link
            aria-busy={pending || undefined}
            aria-current={active ? "page" : undefined}
            className={`${active ? "active" : ""}${pending ? " pending" : ""}`}
            href={`/learn/${course.slug}?lesson=${item.slug}`}
            key={item.slug}
            onClick={() => {
              if (!active) setPendingLesson(item.slug);
            }}
            prefetch
          >
            <span className="lesson-number">{item.order + 1}</span>
            <span className="lesson-nav-copy"><strong>{item.title}</strong><span>{active ? "Đang học" : item.isFree ? "Học thử" : viewerHasVip ? "VIP đã mở" : "VIP"}</span></span>
            {pending ? <span aria-hidden="true" className="lesson-nav-spinner" /> : locked ? <LockKeyhole className="lesson-lock" size={14} /> : null}
          </Link>;
        })}
      </section>)}</nav>
    </aside>

    <section className="lesson-main">
      <div className="lesson-header-card">
        <div className="lesson-heading-row"><div><span className="section-kicker">Bài {String(lessonNumber).padStart(2, "0")} · {lesson.estimatedMinutes} phút · {lesson.situation}</span><h1>{lesson.title}</h1><p>{lesson.summary}</p></div><div className="lesson-progress-badge"><strong>{lessonNumber} / {lessons.length}</strong><span>Trong lộ trình</span></div></div>
        {access.allowed ? <div className="lesson-tabs" role="tablist" aria-label="Nội dung bài học">{tabs.map((item, index) => <button
          aria-controls={`lesson-panel-${index}`}
          aria-selected={tab === item}
          className={`lesson-tab ${tab === item ? "active" : ""}`}
          id={`lesson-tab-${index}`}
          key={item}
          onClick={() => setTab(item)}
          role="tab"
          type="button"
        >
          <span>{item}</span>
          {tab === item ? <span className="lesson-tab-indicator" /> : null}
        </button>)}</div> : null}
      </div>

      {!access.allowed ? <div className="lesson-content-card lesson-locked-panel">
        <span className="lesson-locked-icon"><Crown size={28} /></span>
        <span className="section-kicker">Nội dung VIP</span>
        <h2>Mở khóa bài học này</h2>
        <p>Server đã xác nhận đây không phải bài học miễn phí. Nội dung từ vựng, hội thoại và ghi chú chưa được gửi tới trình duyệt.</p>
        <Link className="button button-primary" href="/vip">Xem quyền lợi VIP</Link>
      </div> : <div className={`lesson-content-card${tab === "Từ vựng" ? " lesson-content-card-vocabulary" : ""}`}>
        <div className="lesson-tab-panel-viewport">
          <div
              aria-labelledby={`lesson-tab-${tabIndex}`}
              className="lesson-tab-panel"
              id={`lesson-panel-${tabIndex}`}
              key={tab}
              role="tabpanel"
            >
              {tab === "Từ vựng" ? <LessonVocabularyDeck authenticated={authenticated} onFinished={continueToDialogue} words={lesson.vocabulary} /> : null}
              {tab === "Hội thoại" ? <div className="dialogue">{lesson.dialogue.map((line, index) => <div className="dialogue-line" key={`${line.speaker}-${index}`}><strong lang="zh">{line.speaker}：{line.hanzi}</strong><small>{line.pinyin}</small><span>{line.translation}</span></div>)}</div> : null}
              {tab === "Ghi chú" ? <div className="lesson-note-list">{lesson.notes.map((note) => <article className="note-panel" key={note.pattern}><h3>{note.title}</h3><strong lang="zh">{note.pattern}</strong><p>{note.explanation}</p></article>)}</div> : null}
              {tab === "Kiểm tra" && lesson.challenge ? <LessonChallengePanel challenge={lesson.challenge} onPassed={setChallengePassed} /> : null}
            </div>
        </div>

        <div className="lesson-complete-row">
          <div className="lesson-complete-message"><p>{completed ? "Tốt lắm! Tiến độ hoàn thành đã được lưu vào tài khoản." : authenticated ? "Lần mở bài đã được ghi nhận. Hoàn thành để cập nhật tiến độ." : "Bạn vẫn có thể học thử; hãy đăng nhập để lưu tiến độ."}</p></div>
          {completed ? <button className="button button-secondary" disabled type="button"><CheckCircle2 size={18} /> Đã hoàn thành</button> : authenticated ? <form action="/api/progress/lesson/complete" method="post">
            <input name="courseSlug" type="hidden" value={course.slug} /><input name="lessonSlug" type="hidden" value={lesson.slug} /><input name="returnTo" type="hidden" value={completionReturnTo} />
            <button className="button button-primary" disabled={requiresChallengePass} type="submit"><CheckCircle2 size={18} /> {requiresChallengePass ? "Hoàn thành kiểm tra trước" : "Hoàn thành bài"}</button>
          </form> : requiresChallengePass ? <button className="button button-primary" disabled type="button"><CheckCircle2 size={18} /> Hoàn thành kiểm tra trước</button> : <Link className="button button-primary" href={`/login?returnTo=${encodeURIComponent(returnTo)}`}><CheckCircle2 size={18} /> Đăng nhập để lưu</Link>}
        </div>
        {completed && dailyFlow && dailyNextStep ? <section className="daily-flow-next-step" id="daily-next" aria-label="Bước tiếp theo trong phiên 10 phút">
          <span className="daily-flow-next-mark"><CheckCircle2 size={20} /></span>
          <div>
            <small>02/04 · Bài học đã xong</small>
            <strong>{dailyNextKind === "practice"
              ? "Tiếp tục với một ca nghe 3 phút"
              : dailyNextKind === "game"
                ? "Bước còn lại: phản xạ 1 phút"
                : "Bạn đã hoàn tất đủ bốn bước"}</strong>
            <p>{dailyNextStep.title}</p>
          </div>
          <Link className="button button-primary" href={withDailySessionFlow(dailyNextStep.href)} prefetch>
            <DailyNextIcon size={18} /> {dailyNextKind === "practice"
              ? "Luyện ca tiếp theo"
              : dailyNextKind === "game"
                ? "Chơi lượt phản xạ"
                : "Xem tổng kết 4/4"} <ArrowRight size={17} />
          </Link>
        </section> : null}
      </div>}
    </section>
  </div>;
}
