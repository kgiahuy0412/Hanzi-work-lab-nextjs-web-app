"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { ArrowRight, Award, CheckCircle2, Crown, Gamepad2, Headphones } from "lucide-react";
import { LessonChallengePanel } from "@/components/lesson-challenge";
import { LessonPhrasebook } from "@/components/lesson-phrasebook";
import { LessonPronunciationCoach } from "@/components/lesson-pronunciation-coach";
import { LessonVocabularyDeck } from "@/components/lesson-vocabulary-deck";
import { RoleplayDialogue } from "@/components/roleplay-dialogue";
import { VideoLearningPlayer } from "@/components/video-learning-player";
import type { Course, LessonAccess, LessonDetail, LessonProgressState, LessonSummary } from "@/lib/content-types";
import { withDailySessionFlow, type DailyRecommendation } from "@/lib/daily-session";
import { getLessonScenarioVideo } from "@/lib/video-library";

type LessonTab = "Tình huống" | "Từ vựng" | "Cụm từ" | "Nghe & nói" | "Hội thoại" | "Ghi chú" | "Kiểm tra";

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
  const scenarioVideo = getLessonScenarioVideo(course.slug, lesson.slug);
  const practiceLines = lesson.phrases?.length ? lesson.phrases : lesson.dialogue;
  const learningTabs: LessonTab[] = [
    "Từ vựng",
    "Cụm từ",
    "Nghe & nói",
    ...(lesson.dialogue.length ? ["Hội thoại" as const] : []),
    ...(lesson.notes.length ? ["Ghi chú" as const] : []),
  ];
  const baseTabs: LessonTab[] = scenarioVideo ? ["Tình huống", ...learningTabs] : learningTabs;
  const [tab, setTab] = useState<LessonTab>(scenarioVideo ? "Tình huống" : "Từ vựng");
  const [challengePassed, setChallengePassed] = useState(!lesson.challenge);
  const tabs = lesson.challenge ? [...baseTabs, "Kiểm tra" as const] : baseTabs;
  const lessonNumber = lesson.order + 1;
  const tabIndex = tabs.indexOf(tab);
  const completed = progress?.completionPercent === 100;
  const requiresChallengePass = Boolean(lesson.challenge) && !challengePassed;
  const lessonHref = `/learn/${course.slug}?lesson=${lesson.slug}`;
  const returnTo = dailyFlow ? withDailySessionFlow(lessonHref) : lessonHref;
  const completionReturnTo = dailyFlow ? `${returnTo}#daily-next` : returnTo;
  const dailyNextKind = dailyNextStep?.href.startsWith("/practice")
    ? "practice"
    : dailyNextStep?.href.startsWith("/games")
      ? "game"
      : "summary";
  const DailyNextIcon = dailyNextKind === "practice" ? Headphones : dailyNextKind === "game" ? Gamepad2 : Award;
  const continueToPhrases = useCallback(() => setTab("Cụm từ"), []);
  const continueToPronunciation = useCallback(() => setTab("Nghe & nói"), []);

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

  return <section className="lesson-main">
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
      </div> : <div className={`lesson-content-card${tab === "Từ vựng" || tab === "Cụm từ" ? " lesson-content-card-vocabulary" : ""}${tab === "Tình huống" ? " lesson-content-card-video" : ""}`}>
        <div className="lesson-tab-panel-viewport">
          <div
              aria-labelledby={`lesson-tab-${tabIndex}`}
              className="lesson-tab-panel"
              id={`lesson-panel-${tabIndex}`}
              key={tab}
              role="tabpanel"
            >
              {tab === "Tình huống" && scenarioVideo ? <section className="lesson-scenario-video">
                <div className="lesson-scenario-video-heading"><div><span className="section-kicker">Tình huống mở đầu</span><h2>{scenarioVideo.title}</h2><p>{scenarioVideo.summary}</p></div></div>
                <VideoLearningPlayer compact video={scenarioVideo} />
              </section> : null}
              {tab === "Từ vựng" ? <LessonVocabularyDeck authenticated={authenticated} onFinished={continueToPhrases} words={lesson.vocabulary} /> : null}
              {tab === "Cụm từ" ? <LessonPhrasebook dialogue={practiceLines} notes={lesson.notes} onFinished={continueToPronunciation} words={lesson.vocabulary} /> : null}
              {tab === "Nghe & nói" ? <LessonPronunciationCoach dialogue={practiceLines} words={lesson.vocabulary} /> : null}
              {tab === "Hội thoại" ? <RoleplayDialogue courseTitle={course.title} lines={lesson.dialogue} situation={lesson.situation} /> : null}
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
  </section>;
}
