export default function LessonLoading() {
  return <main aria-busy="true" className="lesson-page">
    <span className="sr-only" role="status">Đang tải bài học…</span>
    <div className="section-shell">
      <div aria-hidden="true" className="lesson-breadcrumb lesson-loading-breadcrumb skeleton-block" />
      <section aria-hidden="true" className="lesson-main">
        <div className="lesson-header-card lesson-loading-header">
          <span className="skeleton-block" />
          <span className="skeleton-block" />
          <span className="skeleton-block" />
          <div className="lesson-loading-tabs"><span className="skeleton-block" /><span className="skeleton-block" /><span className="skeleton-block" /></div>
        </div>
        <div className="lesson-content-card lesson-loading-content">
          {Array.from({ length: 4 }, (_, index) => <div className="lesson-loading-row" key={index}>
            <span className="skeleton-block" />
            <span className="skeleton-block" />
            <span className="skeleton-block" />
          </div>)}
        </div>
      </section>
    </div>
  </main>;
}
