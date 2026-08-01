export default function PracticeLoading() {
  return <main aria-busy="true" className="learner-dashboard practice-dashboard practice-route-loading">
    <span className="sr-only" role="status">Đang chuẩn bị Kho ca làm…</span>
    <div className="practice-dashboard-frame">
      <div aria-hidden="true" className="work-practice-layout">
        <section className="work-practice-main practice-loading-main">
          <div className="learner-page-header practice-page-intro practice-loading-header">
            <div className="learner-page-header-copy">
              <span className="skeleton-block" />
              <span className="skeleton-block" />
              <span className="skeleton-block" />
              <span className="skeleton-block" />
            </div>
          </div>
          <div className="practice-loading-tabs">
            {Array.from({ length: 4 }, (_, index) => <span className="skeleton-block" key={index} />)}
          </div>
          <div className="practice-case-card practice-loading-card">
            <span className="skeleton-block" />
            <span className="skeleton-block" />
            <span className="skeleton-block" />
            <span className="skeleton-block" />
          </div>
        </section>
        <aside className="work-practice-aside practice-loading-aside">
          {Array.from({ length: 3 }, (_, index) => <span className="skeleton-block" key={index} />)}
        </aside>
      </div>
    </div>
  </main>;
}
