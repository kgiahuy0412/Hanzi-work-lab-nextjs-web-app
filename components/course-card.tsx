import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, BookOpen, CalendarClock, Clock3 } from "lucide-react";
import type { Course } from "@/lib/content-types";
import { getCourseVisual } from "@/lib/course-visuals";

export function CourseCard({ course, priority = false }: { course: Course; priority?: boolean }) {
  const visual = getCourseVisual(course.slug);
  const content = <>
    <div className="course-cover" style={{ "--course-bg": course.color, "--course-ink": course.ink } as React.CSSProperties}>
      <Image
        alt={visual.alt}
        className="course-cover-image"
        fill
        priority={priority}
        sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 980px) 50vw, 33vw"
        src={visual.src}
        style={{ objectPosition: visual.position }}
        unoptimized
      />
      <span className="course-cover-shade" aria-hidden="true" />
      <span className="course-tag">{course.level}</span>
      <span className="course-hanzi" lang="zh-CN">{course.hanzi}</span>
    </div>
    <div className="course-body"><h2>{course.title}</h2><span className="course-chinese" lang="zh-CN">{course.chineseTitle}</span><p className="course-description">{course.description}</p>{course.availability === "available" ? <><div className="course-meta"><span><BookOpen aria-hidden="true" size={14} /> {course.lessons} bài</span><span><Clock3 aria-hidden="true" size={14} /> {course.minutes} phút</span></div><div className="course-card-footer"><span className="free-label">{course.freeLessons} bài học thử</span><span aria-hidden="true" className="icon-link"><ArrowUpRight size={18} /></span></div></> : <><div className="course-meta course-coming-meta"><span><CalendarClock aria-hidden="true" size={14} /> Đang biên soạn theo lộ trình</span></div><div className="course-card-footer"><span className="coming-soon-label">Sắp ra mắt</span></div></>}</div>
  </>;

  return course.availability === "available"
    ? <Link className="course-card" href={`/courses/${course.slug}`} prefetch>{content}</Link>
    : <article className="course-card course-card-coming" aria-label={`${course.title} đang được biên soạn`}>{content}</article>;
}
