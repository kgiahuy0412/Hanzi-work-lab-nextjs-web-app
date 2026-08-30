"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronRight, Search } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import { HskCourseCard } from "@/components/hsk-course-card";
import type { Course } from "@/lib/content-types";

const filters = ["Tất cả", "Nền tảng", "Văn phòng", "Nhà máy", "Logistics", "Kinh doanh", "Dịch vụ"];
const ease = [0.22, 1, 0.36, 1] as const;

export function CourseExplorer({
  courses,
  includeHskCard = false,
}: {
  courses: Course[];
  includeHskCard?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const reduceMotion = useReducedMotion();
  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesFilter = filter === "Tất cả" || course.category === filter;
      const haystack = `${course.title} ${course.chineseTitle} ${course.description}`.toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [courses, filter, query]);
  const normalizedQuery = query.trim().toLowerCase();
  const showHskCard = includeHskCard
    && (filter === "Tất cả" || filter === "Nền tảng")
    && (!normalizedQuery || "giáo trình hsk 汉语水平考试 cấp độ nền tảng".includes(normalizedQuery));
  const availableCount = visibleCourses.filter((course) => course.availability === "available").length + (showHskCard ? 1 : 0);
  const resultCount = visibleCourses.length + (showHskCard ? 1 : 0);

  return <section className="section-shell explorer">
    <div className="explorer-toolbar">
      <label className="search-box"><Search aria-hidden="true" size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm ngành hoặc kỹ năng cần học..." aria-label="Tìm lộ trình" /></label>
      <div className="filter-scroll-wrap">
        <div className="filter-list" aria-label="Lọc theo nhóm ngành. Trên điện thoại, vuốt ngang để xem thêm lựa chọn." role="group">{filters.map((item) => <motion.button
          aria-pressed={filter === item}
          className={`filter-chip ${filter === item ? "active" : ""}`}
          key={item}
          onClick={() => setFilter(item)}
          tabIndex={0}
          type="button"
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        >{item}</motion.button>)}</div>
        <span aria-hidden="true" className="filter-scroll-cue"><ChevronRight size={17} /></span>
      </div>
    </div>
    <motion.p animate={{ opacity: 1 }} aria-live="polite" className="explorer-count" initial={false} key={`${resultCount}-${availableCount}`}>{availableCount} lộ trình đang mở · {resultCount - availableCount} lộ trình trong kế hoạch</motion.p>
    <AnimatePresence initial={false} mode="popLayout">
      {resultCount ? <motion.div className="course-grid" layout key="course-grid">{showHskCard ? <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="course-motion-item"
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 10 }}
        key="hsk-curriculum"
        layout
        transition={{ duration: 0.2, ease }}
      ><HskCourseCard /></motion.div> : null}{visibleCourses.map((course, index) => <motion.div
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="course-motion-item"
        exit={reduceMotion ? undefined : { opacity: 0, scale: 0.985, y: -6 }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.985, y: 10 }}
        key={course.slug}
        layout
        transition={{ duration: 0.2, delay: reduceMotion ? 0 : Math.min(index * 0.035, 0.18), ease }}
      ><CourseCard course={course} priority={index < 3} /></motion.div>)}</motion.div> : <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="empty-state"
        exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        key="empty-state"
        transition={{ duration: 0.2, ease }}
      ><h2>Chưa tìm thấy lộ trình</h2><p>Thử một từ khóa khác hoặc chọn “Tất cả”.</p></motion.div>}
    </AnimatePresence>
  </section>;
}
