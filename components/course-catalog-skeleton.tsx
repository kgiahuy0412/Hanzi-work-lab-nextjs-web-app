export function CourseGridSkeleton() {
  return <section aria-hidden="true" className="section-shell explorer course-catalog-skeleton">
    <div className="explorer-toolbar">
      <span className="skeleton-block course-skeleton-search" />
      <div className="course-skeleton-filters">
        {Array.from({ length: 5 }, (_, index) => <span className="skeleton-block" key={index} />)}
      </div>
    </div>
    <span className="skeleton-block course-skeleton-count" />
    <div className="course-grid">
      {Array.from({ length: 6 }, (_, index) => <article className="course-card course-skeleton-card" key={index}>
        <span className="skeleton-block course-skeleton-cover" />
        <div className="course-body">
          <span className="skeleton-block" />
          <span className="skeleton-block" />
          <span className="skeleton-block" />
          <span className="skeleton-block" />
        </div>
      </article>)}
    </div>
  </section>;
}

export function CoursesPageSkeleton() {
  return <main aria-busy="true" className="course-library-page hsk-curriculum-page">
    <span className="sr-only" role="status">Đang tải danh sách lộ trình…</span>
    <header aria-hidden="true" className="section-shell industry-course-heading course-catalog-heading course-catalog-heading-skeleton">
      <span className="skeleton-block" />
      <span className="skeleton-block" />
      <span className="skeleton-block" />
    </header>
    <CourseGridSkeleton />
  </main>;
}
