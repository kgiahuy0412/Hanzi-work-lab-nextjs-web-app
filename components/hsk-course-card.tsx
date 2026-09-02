import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Layers3 } from "lucide-react";
import { HSK_CURRICULUM } from "@/lib/hsk-curriculum";

const hskLessonCount = HSK_CURRICULUM.reduce(
  (levelTotal, level) => levelTotal + level.topics.reduce(
    (topicTotal, topic) => topicTotal + topic.lessons.length,
    0,
  ),
  0,
);

export function HskCourseCard() {
  return <Link className="course-card hsk-entry-card" href="/courses?view=hsk" prefetch>
    <div className="course-cover hsk-entry-cover">
      <Image
        alt="Himi mới học chữ Hán theo giáo trình HSK tại bàn học"
        className="course-cover-image hsk-entry-cover-image"
        fill
        priority
        sizes="(max-width: 720px) calc(100vw - 30px), (max-width: 980px) 50vw, 33vw"
        src="/assets/courses/himi-concepts/himi-hsk-curriculum-v2.png"
        unoptimized
      />
      <span className="course-cover-shade" aria-hidden="true" />
      <span className="course-tag">HSK 1–9</span>
      <span className="course-hanzi hsk-entry-hanzi" lang="zh-CN">汉</span>
    </div>
    <div className="course-body">
      <h2>Giáo trình HSK</h2>
      <span className="course-chinese" lang="zh-CN">汉语水平考试</span>
      <p className="course-description">Học tuần tự theo cấp độ, chủ đề và bài học để xây nền tảng tiếng Trung vững chắc.</p>
      <div className="course-meta">
        <span><BookOpen aria-hidden="true" size={14} /> {hskLessonCount} bài</span>
        <span><Layers3 aria-hidden="true" size={14} /> {HSK_CURRICULUM.length} cấp độ</span>
      </div>
      <div className="course-card-footer">
        <span className="free-label">Bắt đầu từ HSK 1</span>
        <span aria-hidden="true" className="icon-link"><ArrowUpRight size={18} /></span>
      </div>
    </div>
  </Link>;
}
