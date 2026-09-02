"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  Clock3,
  Globe2,
  GraduationCap,
  MapPin,
  MessageCircle,
  Play,
  Route,
  Users,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import {
  type HskCurriculumLesson,
  type HskCurriculumLevel,
  type HskTopicIcon,
} from "@/lib/hsk-curriculum";
import {
  calculateHskLessonProgressFromCounts,
  getHskLessonProgressStorageKey,
  parseHskLessonProgress,
} from "@/lib/hsk-lesson-progress";

const topicIcons: Record<HskTopicIcon, LucideIcon> = {
  message: MessageCircle,
  people: Users,
  clock: Clock3,
  food: UtensilsCrossed,
  travel: MapPin,
  work: BriefcaseBusiness,
  book: BookOpen,
  globe: Globe2,
};

function LessonMeta({ lesson }: { lesson: HskCurriculumLesson }) {
  return <span className="hsk-lesson-meta">
    {lesson.vocabulary ? <span><BookOpen aria-hidden="true" size={14} /> {lesson.vocabulary} từ vựng</span> : null}
    {lesson.grammar ? <span><GraduationCap aria-hidden="true" size={14} /> {lesson.grammar} ngữ pháp</span> : null}
    {lesson.dialogues ? <span><MessageCircle aria-hidden="true" size={14} /> {lesson.dialogues} hội thoại</span> : null}
    {lesson.exercises ? <span><GraduationCap aria-hidden="true" size={14} /> {lesson.exercises} bài tập</span> : null}
  </span>;
}

export function HskCurriculumExplorer({
  catalogHref = "#course-catalog",
  curriculum,
}: {
  catalogHref?: string;
  curriculum: HskCurriculumLevel[];
}) {
  const visibleCurriculum = curriculum.filter((level) => level.id !== "hsk-7-9");
  const [activeLevelId, setActiveLevelId] = useState(curriculum[0].id);
  const activeLevel = curriculum.find((level) => level.id === activeLevelId) ?? curriculum[0];
  const [activeTopicId, setActiveTopicId] = useState(activeLevel.topics[0].id);
  const activeTopic = activeLevel.topics.find((topic) => topic.id === activeTopicId) ?? activeLevel.topics[0];
  const [activeLessonId, setActiveLessonId] = useState(activeTopic.lessons[0].id);
  const [lessonProgress, setLessonProgress] = useState<Record<string, number>>({});
  const totalLessons = activeLevel.topics.reduce((total, topic) => total + topic.lessons.length, 0);
  const completedActiveLessons = activeTopic.lessons.filter((lesson) => lessonProgress[lesson.id] === 100).length;

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next: Record<string, number> = {};
      for (const topic of activeLevel.topics) {
        for (const lesson of topic.lessons) {
          if (!lesson.available) continue;
          try {
            const stored = window.localStorage.getItem(getHskLessonProgressStorageKey(lesson.id));
            next[lesson.id] = calculateHskLessonProgressFromCounts({
              vocabulary: lesson.vocabulary,
              pronunciation: lesson.vocabulary,
              exercises: lesson.exercises ?? 0,
              scoredExercises: lesson.scoredExercises ?? lesson.kind !== "workbook",
              writing: lesson.writing,
              guidedSteps: lesson.guidedSteps,
            }, parseHskLessonProgress(stored));
          } catch {
            next[lesson.id] = 0;
          }
        }
      }
      setLessonProgress(next);
    }, 0);
    return () => window.clearTimeout(handle);
  }, [activeLevel]);

  const selectLevel = (levelId: string) => {
    const nextLevel = curriculum.find((level) => level.id === levelId);
    if (!nextLevel) return;
    setActiveLevelId(nextLevel.id);
    setActiveTopicId(nextLevel.topics[0].id);
    setActiveLessonId(nextLevel.topics[0].lessons[0].id);
  };

  const selectTopic = (topicId: string) => {
    const nextTopic = activeLevel.topics.find((topic) => topic.id === topicId);
    if (!nextTopic) return;
    setActiveTopicId(nextTopic.id);
    setActiveLessonId(nextTopic.lessons[0].id);
  };

  return <section className="section-shell hsk-curriculum" aria-labelledby="hsk-curriculum-title">
    <div aria-label="Chọn cấp độ HSK" className="hsk-level-tabs" role="group">
      {visibleCurriculum.map((level) => <button
        aria-pressed={activeLevel.id === level.id}
        className={activeLevel.id === level.id ? "is-active" : ""}
        key={level.id}
        onClick={() => selectLevel(level.id)}
        type="button"
      ><span lang="zh-CN">{level.symbol}</span><strong>{level.label}</strong></button>)}
    </div>

    <header className="hsk-curriculum-heading">
      <span className="hsk-heading-icon"><Route aria-hidden="true" size={24} /></span>
      <div>
        <span>Giáo trình HSK · {totalLessons} bài</span>
        <h1 id="hsk-curriculum-title">Lộ trình bài học {activeLevel.label}</h1>
        <p>Hoàn thành từng bài để mở khóa chủ đề tiếp theo.</p>
      </div>
      <Link className="hsk-industry-link" href={catalogHref}>Lộ trình theo ngành <ArrowRight aria-hidden="true" size={17} /></Link>
    </header>

    <div className="hsk-curriculum-layout">
      <aside aria-label={`Chủ đề ${activeLevel.label}`} className="hsk-topic-panel">
        <div className="hsk-topic-panel-header"><strong>Chủ đề</strong><strong>Tiến độ</strong></div>
        <div className="hsk-topic-list">
          {activeLevel.topics.map((topic) => {
            const Icon = topicIcons[topic.icon];
            const selected = topic.id === activeTopic.id;
            const completedLessons = topic.lessons.filter((lesson) => lessonProgress[lesson.id] === 100).length;
            return <button
              aria-pressed={selected}
              className={selected ? "is-active" : ""}
              key={topic.id}
              onClick={() => selectTopic(topic.id)}
              type="button"
            >
              <span className="hsk-topic-icon"><Icon aria-hidden="true" size={22} /></span>
              <span className="hsk-topic-copy"><strong>{topic.title}</strong><span><i style={{ width: `${(completedLessons / topic.lessons.length) * 100}%` }} /></span></span>
              <small>{completedLessons}/{topic.lessons.length}</small>
            </button>;
          })}
        </div>
      </aside>

      <section aria-labelledby="hsk-active-topic-title" className="hsk-lesson-panel">
        <header className="hsk-lesson-panel-header">
          <span className="hsk-topic-icon is-compact"><MessageCircle aria-hidden="true" size={22} /></span>
          <div><h2 id="hsk-active-topic-title">{activeTopic.title}</h2><p>{activeTopic.lessons.length} bài học · {completedActiveLessons} đã hoàn thành</p></div>
          <strong>{completedActiveLessons}/{activeTopic.lessons.length}</strong>
        </header>

        <div aria-live="polite" className="hsk-lesson-list">
          {activeTopic.lessons.map((lesson) => {
            const selected = lesson.id === activeLessonId;
            const lessonAvailable = lesson.available;
            const lessonHref = `/hsk/${activeLevel.id.replace(/^hsk-/, "")}/${lesson.id}`;
            const savedPercent = lessonProgress[lesson.id] ?? 0;
            return <article className={`hsk-lesson-row${selected ? " is-active" : ""}`} key={lesson.id}>
              {lessonAvailable ? <Link aria-label={`Bài ${lesson.lessonNumber}: ${lesson.title}`} className="hsk-lesson-select" href={lessonHref} prefetch>
                <span className="hsk-lesson-index">{selected ? <Play aria-hidden="true" fill="currentColor" size={20} /> : lesson.lessonNumber}</span>
                <span className="hsk-lesson-copy">
                  <strong>Bài {lesson.lessonNumber}: {lesson.title}</strong>
                  <LessonMeta lesson={lesson} />
                </span>
              </Link> : <button
                aria-label={`Bài ${lesson.lessonNumber}: ${lesson.title}`}
                aria-pressed={selected}
                className="hsk-lesson-select"
                onClick={() => setActiveLessonId(lesson.id)}
                type="button"
              >
                <span className="hsk-lesson-index">{lesson.lessonNumber}</span>
                <span className="hsk-lesson-copy">
                  <strong>Bài {lesson.lessonNumber}: {lesson.title}</strong>
                  <LessonMeta lesson={lesson} />
                </span>
              </button>}
              {selected && lessonAvailable ? <Link className="hsk-lesson-start" href={lessonHref} prefetch>
                <span>{savedPercent === 100 ? "Đã xong" : "Đang học"}</span><strong>{savedPercent}%</strong><Play aria-hidden="true" fill="currentColor" size={16} />
              </Link> : <span className="hsk-lesson-duration">{lessonAvailable ? `${lesson.minutes} phút` : "Sắp ra mắt"} <ChevronRight aria-hidden="true" size={19} /></span>}
            </article>;
          })}
        </div>
      </section>
    </div>
  </section>;
}
