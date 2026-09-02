import Image from "next/image";
import Link from "next/link";
import {
  BookOpen,
  Check,
  CheckSquare2,
  ChevronRight,
  Circle,
  Clock3,
  Crown,
  Lightbulb,
  LockKeyhole,
  RefreshCw,
} from "lucide-react";
import type { CourseRoadmap as CourseRoadmapModel, RoadmapLesson, RoadmapModule } from "@/lib/course-roadmap";
import type { Course } from "@/lib/content-types";
import { getCourseVisual } from "@/lib/course-visuals";

function formatMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (!hours) return `${remainder} phút`;
  if (!remainder) return `${hours} giờ`;
  return `${hours} giờ ${remainder} phút`;
}

function LessonStateIcon({ lesson }: { lesson: RoadmapLesson }) {
  if (lesson.status === "completed") return <Check aria-hidden="true" size={14} strokeWidth={3} />;
  if (lesson.status === "current") return <Circle aria-hidden="true" size={19} />;
  return <LockKeyhole aria-hidden="true" size={16} />;
}

function RoadmapLessonRow({
  lesson,
  lessonNumber,
}: {
  lesson: RoadmapLesson;
  lessonNumber: number;
}) {
  const copy = <>
    <span className="roadmap-lesson-state"><LessonStateIcon lesson={lesson} /></span>
    <span className="roadmap-lesson-copy">
      <span>Bài {String(lessonNumber).padStart(2, "0")}</span>
      <i aria-hidden="true">·</i>
      <strong>{lesson.title}</strong>
    </span>
    <span className="roadmap-lesson-minutes">{lesson.estimatedMinutes} phút</span>
  </>;

  if (lesson.status === "current" && lesson.href) {
    return <div className="roadmap-lesson-row is-current">
      {copy}
      <Link aria-current="step" className="roadmap-lesson-cta" href={lesson.href} prefetch>
        Bắt đầu bài học
      </Link>
      <ChevronRight aria-hidden="true" className="roadmap-lesson-chevron" size={19} />
    </div>;
  }

  if (lesson.status === "vip_locked") {
    return <div className="roadmap-lesson-row is-vip-locked">
      {copy}
      <Link className="roadmap-lesson-vip" href="/vip"><Crown aria-hidden="true" size={15} /> Mở khóa VIP</Link>
      <ChevronRight aria-hidden="true" className="roadmap-lesson-chevron" size={19} />
    </div>;
  }

  if (lesson.href) {
    return <Link className={`roadmap-lesson-row is-${lesson.status}`} href={lesson.href} prefetch>
      {copy}
      <ChevronRight aria-hidden="true" className="roadmap-lesson-chevron" size={19} />
    </Link>;
  }

  return <div aria-disabled="true" className={`roadmap-lesson-row is-${lesson.status}`}>
    {copy}
    <ChevronRight aria-hidden="true" className="roadmap-lesson-chevron" size={19} />
  </div>;
}

function StageStatus({ module }: { module: RoadmapModule }) {
  if (module.status === "completed") return <span className="roadmap-stage-status is-completed"><Check aria-hidden="true" size={14} /> Đã hoàn thành</span>;
  if (module.status === "active") {
    const blocked = module.lessons.some((lesson) => lesson.status === "vip_locked");
    return blocked
      ? <span className="roadmap-stage-status is-vip"><Crown aria-hidden="true" size={14} /> Cần VIP</span>
      : <span className="roadmap-stage-status is-active">Đang học</span>;
  }
  return <span className="roadmap-stage-status is-locked"><LockKeyhole aria-hidden="true" size={14} /> Khóa</span>;
}

function StageMarker({ module, index }: { module: RoadmapModule; index: number }) {
  return <span className={`roadmap-stage-marker is-${module.status}`}>
    {module.status === "completed" ? <Check aria-hidden="true" size={22} strokeWidth={2.6} /> : index + 1}
  </span>;
}

function RoadmapStage({
  course,
  index,
  module,
}: {
  course: Course;
  index: number;
  module: RoadmapModule;
}) {
  const visual = getCourseVisual(course.slug);
  const summary = <div className="roadmap-stage-summary">
    <div className="roadmap-stage-image">
      <Image
        alt=""
        fill
        sizes="176px"
        src={visual.src}
        style={{ objectPosition: `${18 + (index * 21)}% center` }}
        unoptimized
      />
    </div>
    <div className="roadmap-stage-copy">
      <h2>{module.title}</h2>
      <p>{module.completedLessons} / {module.lessons.length} bài đã hoàn thành</p>
    </div>
    <StageStatus module={module} />
  </div>;

  return <div className={`roadmap-stage is-${module.status}`}>
    <div aria-hidden="true" className="roadmap-stage-rail"><StageMarker index={index} module={module} /></div>
    {module.status === "locked" ? <article className="roadmap-stage-card">{summary}</article> : <details className="roadmap-stage-card" open={module.status === "active"}>
      <summary>{summary}<ChevronRight aria-hidden="true" className="roadmap-stage-expand" size={20} /></summary>
      <div className="roadmap-lesson-list">
        {module.lessons.map((lesson) => <RoadmapLessonRow
          key={lesson.slug}
          lesson={lesson}
          lessonNumber={lesson.order + 1}
        />)}
      </div>
    </details>}
  </div>;
}

export function CourseRoadmap({
  authenticated,
  course,
  roadmap,
}: {
  authenticated: boolean;
  course: Course;
  roadmap: CourseRoadmapModel;
}) {
  const complete = roadmap.completedLessons === roadmap.totalLessons && roadmap.totalLessons > 0;
  const coachCopy = complete
    ? "Bạn đã hoàn thành toàn bộ lộ trình. Hãy quay lại ôn những bài cần củng cố."
    : roadmap.blockedByVip
      ? "Mở khóa VIP để tiếp tục chặng chuyên sâu và lưu trọn tiến độ học."
      : `Hoàn thành ${roadmap.remainingLessonsInActiveModule} bài nữa để mở chặng tiếp theo`;

  return <main aria-label={`Chi tiết lộ trình ${course.title}`} className="course-roadmap-page">
    <div className="section-shell course-roadmap-shell">
      <header className="course-roadmap-header">
        <div>
          <span className="course-roadmap-eyebrow">Lộ trình học</span>
          <h1>Lộ trình {course.title}</h1>
          <div className="course-roadmap-progress-row">
            <strong>{roadmap.completedLessons} / {roadmap.totalLessons} bài</strong>
            <span className="course-roadmap-progress-track">
              <span style={{ width: `${roadmap.progressPercent}%` }} />
            </span>
            <small>{roadmap.progressPercent}%</small>
          </div>
        </div>
        <Link className="course-roadmap-switch" href="/courses"><RefreshCw aria-hidden="true" size={17} /> Đổi lộ trình</Link>
      </header>

      <div className="course-roadmap-layout">
        <section aria-label="Các chặng trong lộ trình" className="course-roadmap-stages">
          {roadmap.modules.map((module, index) => <RoadmapStage
            course={course}
            index={index}
            key={module.slug}
            module={module}
          />)}
        </section>

        <aside className="course-roadmap-aside">
          <section className="course-roadmap-overview">
            <h2>Tổng quan lộ trình</h2>
            <div className="roadmap-overview-stat">
              <span><Clock3 aria-hidden="true" size={27} /></span>
              <p>Tổng thời gian ước tính<strong>{formatMinutes(roadmap.totalMinutes)}</strong></p>
            </div>
            <div className="roadmap-overview-stat">
              <span><CheckSquare2 aria-hidden="true" size={27} /></span>
              <p>Đã hoàn thành<strong>{roadmap.completedModules} / {roadmap.modules.length} chặng</strong></p>
            </div>
            <div className="roadmap-overview-stat">
              <span><BookOpen aria-hidden="true" size={28} /></span>
              <p>Tiến độ tổng<strong>{roadmap.completedLessons} / {roadmap.totalLessons} bài</strong></p>
            </div>
            {!authenticated ? <Link className="roadmap-signin-note" href={`/login?returnTo=/courses/${course.slug}`}>
              Đăng nhập để lưu nhịp học <ChevronRight aria-hidden="true" size={16} />
            </Link> : null}
          </section>

          <section className={`course-roadmap-coach${roadmap.blockedByVip ? " is-vip" : ""}`}>
            <Image
              alt="Himi nhắc bạn về mục tiêu tiếp theo"
              className="course-roadmap-coach-image"
              height={190}
              src="/assets/mascot/himi-v2/himi-wave.webp"
              unoptimized
              width={190}
            />
            <div className="course-roadmap-coach-bubble">
              <Lightbulb aria-hidden="true" size={23} />
              <p>{coachCopy}</p>
              {roadmap.blockedByVip ? <Link href="/vip">Xem quyền lợi VIP <ChevronRight aria-hidden="true" size={15} /></Link> : null}
            </div>
          </section>
        </aside>
      </div>
    </div>
  </main>;
}
