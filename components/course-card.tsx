import Link from "next/link";
import { ArrowUpRight, BookOpen, Clock3 } from "lucide-react";
import type { Course } from "@/lib/course-data";

export function CourseCard({ course }: { course: Course }) {
  return <Link className="course-card" href={`/learn/${course.slug}`}>
    <div className="course-cover" style={{ "--course-bg": course.color, "--course-ink": course.ink } as React.CSSProperties}><span className="course-tag">{course.level}</span><span className="course-hanzi" lang="zh">{course.hanzi}</span></div>
    <div className="course-body"><h3>{course.title}</h3><span className="course-chinese" lang="zh">{course.chineseTitle}</span><p className="course-description">{course.description}</p><div className="course-meta"><span><BookOpen size={14} /> {course.lessons} bài</span><span><Clock3 size={14} /> {course.minutes} phút</span></div><div className="course-card-footer"><span className="free-label">{course.freeLessons} bài học thử</span><span className="icon-link"><ArrowUpRight size={18} /></span></div></div>
  </Link>;
}
