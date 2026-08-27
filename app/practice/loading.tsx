import { HimiSectionBanner } from "@/components/himi-section-banner";

export default function PracticeLoading() {
  return <main aria-busy="true" className="learner-dashboard practice-dashboard practice-route-loading">
    <span className="sr-only" role="status">Đang chuẩn bị Kho ca làm…</span>
    <div className="practice-dashboard-frame">
      <div aria-hidden="true" className="work-practice-layout is-catalog">
        <section className="work-practice-main practice-loading-main">
          <div className="practice-banner-shell">
            <HimiSectionBanner
              description="Nghe tình huống công việc, phản xạ bằng tiếng Trung và sửa từng câu theo nhịp của bạn."
              titleId="practice-loading-title"
              titleLines={["Luyện đúng cảnh.", "Nói tự nhiên hơn."]}
              variant="practice"
            />
          </div>
          <div className="practice-loading-tabs">
            {Array.from({ length: 7 }, (_, index) => <span className="skeleton-block" key={index} />)}
          </div>
          <div className="practice-loading-feature">
            <div>
              <span className="skeleton-block" />
              <span className="skeleton-block" />
              <span className="skeleton-block" />
              <span className="skeleton-block" />
              <span className="skeleton-block" />
            </div>
            <span className="skeleton-block" />
          </div>
          <div className="practice-loading-rows">
            {Array.from({ length: 3 }, (_, index) => <span className="skeleton-block" key={index} />)}
          </div>
        </section>
      </div>
    </div>
  </main>;
}
