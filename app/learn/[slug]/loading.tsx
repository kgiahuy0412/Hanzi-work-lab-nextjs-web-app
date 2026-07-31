export default function LessonLoading() {
  return <main aria-busy="true" className="lesson-page">
    <span className="sr-only" role="status">Đang tải bài học…</span>
    <div className="section-shell">
      <div aria-hidden="true" className="lesson-breadcrumb lesson-loading-breadcrumb skeleton-block" />
      <div className="lesson-shell lesson-loading-shell">
        <aside aria-hidden="true" className="lesson-sidebar lesson-loading-sidebar">
          <div className="lesson-loading-sidebar-head">
            <span className="skeleton-block" />
            <span className="skeleton-block" />
            <span className="skeleton-block" />
          </div>
          <div className="lesson-loading-nav">
            {Array.from({ length: 5 }, (_, index) => <div className="lesson-loading-nav-item" key={index}>
              <span className="skeleton-block" />
              <span className="skeleton-block" />
            </div>)}
          </div>
        </aside>

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
    </div>
  </main>;
}
