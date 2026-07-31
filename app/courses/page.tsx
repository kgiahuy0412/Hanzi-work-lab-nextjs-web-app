import type { Metadata } from "next";
import { Compass, Sparkles } from "lucide-react";
import { CourseExplorer } from "@/components/course-explorer";
import { courses } from "@/lib/course-data";

export const metadata: Metadata = { title: "Lộ trình chuyên ngành" };

export default function CoursesPage() {
  return <main>
    <section className="page-hero"><div className="section-shell page-hero-inner">
      <div><div className="eyebrow"><Compass size={16} /> Thư viện lộ trình</div><h1>Chọn một ngành, bắt đầu từ tình huống thật.</h1><p>Không cần học lan man. Chọn đúng môi trường công việc của bạn và xây vốn từ theo từng việc cần làm.</p></div>
      <div className="hero-note"><Sparkles size={22} /><div><strong>Có thể học thử trước</strong><span>Mỗi lộ trình có từ 3–5 bài miễn phí.</span></div></div>
    </div></section>
    <CourseExplorer courses={courses} />
  </main>;
}
