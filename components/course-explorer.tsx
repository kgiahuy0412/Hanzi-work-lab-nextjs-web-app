"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/course-card";
import type { Course } from "@/lib/course-data";

const filters = ["Tất cả", "Nền tảng", "Văn phòng", "Nhà máy", "Logistics", "Kinh doanh", "Dịch vụ"];

export function CourseExplorer({ courses }: { courses: Course[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("Tất cả");
  const visibleCourses = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesFilter = filter === "Tất cả" || course.category === filter;
      const haystack = `${course.title} ${course.chineseTitle} ${course.description}`.toLowerCase();
      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [courses, filter, query]);

  return <section className="section-shell explorer">
    <div className="explorer-toolbar">
      <label className="search-box"><Search size={19} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm ngành hoặc kỹ năng cần học..." aria-label="Tìm lộ trình" /></label>
      <div className="filter-list" aria-label="Lọc theo nhóm ngành">{filters.map((item) => <button aria-pressed={filter === item} className={`filter-chip ${filter === item ? "active" : ""}`} key={item} onClick={() => setFilter(item)} type="button">{item}</button>)}</div>
    </div>
    <p className="explorer-count">Hiển thị {visibleCourses.length} lộ trình phù hợp</p>
    {visibleCourses.length ? <div className="course-grid">{visibleCourses.map((course) => <CourseCard course={course} key={course.slug} />)}</div> : <div className="empty-state"><h2>Chưa tìm thấy lộ trình</h2><p>Thử một từ khóa khác hoặc chọn “Tất cả”.</p></div>}
  </section>;
}
