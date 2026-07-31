import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { ArrowDown, BookOpenCheck, BriefcaseBusiness, Compass } from "lucide-react";
import { CourseGridSkeleton } from "@/components/course-catalog-skeleton";
import { CourseExplorer } from "@/components/course-explorer";
import { listPublishedCourses } from "@/lib/course-repository";

export const metadata: Metadata = { title: "Lộ trình chuyên ngành" };

async function CourseCatalog() {
  const courses = await listPublishedCourses();
  return <CourseExplorer courses={courses} />;
}

export default function CoursesPage() {
  return <main className="course-library-page">
    <section className="section-shell course-library-hero">
      <div className="course-hero-copy">
        <div className="course-hero-eyebrow"><Compass size={16} /> Thư viện lộ trình</div>
        <h1>Chọn đúng ngành.<br /><span>Bắt đầu từ ca làm thật.</span></h1>
        <p>Học những gì bạn sẽ thật sự nói tại văn phòng, nhà máy và kho vận — theo từng việc cần xử lý, không theo danh sách từ rời rạc.</p>
        <div className="course-hero-stats">
          <span><BriefcaseBusiness size={17} /><strong>07</strong> chuyên ngành</span>
          <span><BookOpenCheck size={17} /><strong>24</strong> bài học thử</span>
          <a href="#course-catalog"><ArrowDown size={16} /> Xem lộ trình</a>
        </div>
      </div>
      <div className="course-hero-media" aria-label="Một số môi trường làm việc có trong lộ trình">
        <div className="course-hero-image course-hero-image-main">
          <Image alt="Nhóm đồng nghiệp trao đổi trong buổi họp công việc" fill priority sizes="(max-width: 720px) calc(100vw - 30px), 42vw" src="/assets/courses/workplace-communication.webp" unoptimized />
        </div>
        <div className="course-hero-image">
          <Image alt="Nhân sự nhà máy kiểm tra máy móc" fill sizes="(max-width: 720px) 48vw, 21vw" src="/assets/courses/factory-production.webp" unoptimized />
        </div>
        <div className="course-hero-image">
          <Image alt="Nhân sự kho quét kiện hàng" fill sizes="(max-width: 720px) 48vw, 21vw" src="/assets/courses/warehouse-logistics.webp" unoptimized />
        </div>
        <div className="course-hero-caption"><span>Ngôn ngữ đi cùng bối cảnh</span><strong>Nhìn thấy việc cần làm trước khi học câu cần nói.</strong></div>
      </div>
    </section>
    <div id="course-catalog">
      <Suspense fallback={<CourseGridSkeleton />}><CourseCatalog /></Suspense>
    </div>
  </main>;
}
