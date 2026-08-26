import type { Metadata } from "next";
import Link from "next/link";
import { AdminConsoleHeader, AdminNotice, PracticeIndustryForm, PracticeReviewQueue, StatusBadge } from "@/components/admin-console";
import { requirePracticeStaffUser } from "@/lib/admin-auth";
import { getPracticeReviewDashboard, listAdminPracticeIndustries } from "@/lib/admin-practice-service";
import { assignPracticeReviewAction, claimPracticeReviewAction, createPracticeIndustryAction, releasePracticeReviewAction } from "../actions";

export const metadata: Metadata = { title: "Quản lý Luyện ca" };

export default async function AdminPracticePage({ searchParams }: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [user, query] = await Promise.all([
    requirePracticeStaffUser(),
    searchParams,
  ]);
  const [industries, reviewDashboard] = await Promise.all([
    listAdminPracticeIndustries(),
    getPracticeReviewDashboard({ id: user.id, role: user.role }),
  ]);

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader
      description="Quản lý nhóm ngành, ca nghe Đúng/Sai, quyền miễn phí/VIP và toàn bộ đáp án từ PostgreSQL."
      eyebrow="Practice CRUD"
      title="Kho Luyện ca"
      userName={user.displayName}
      userRole={user.role}
    />
    <AdminNotice error={query.error} success={query.success} />
    <PracticeReviewQueue
      action={assignPracticeReviewAction}
      assignees={reviewDashboard.assignees}
      claimAction={claimPracticeReviewAction}
      items={reviewDashboard.items}
      releaseAction={releasePracticeReviewAction}
      userId={user.id}
      userRole={user.role}
    />
    <div className="admin-content-grid">
      {user.role === "admin" ? <section className="admin-panel">
        <div className="panel-heading"><h2>Tạo nhóm ngành</h2><span>Mặc định bản nháp</span></div>
        <PracticeIndustryForm action={createPracticeIndustryAction} submitLabel="Tạo nhóm ngành" />
      </section> : <section className="admin-panel practice-role-card">
        <div className="panel-heading"><h2>{user.role === "editor" ? "Không gian biên tập" : "Hàng đợi kiểm duyệt"}</h2><span>{user.role === "editor" ? "Editor" : "Reviewer"}</span></div>
        <p>{user.role === "editor" ? "Mở một nhóm ngành để tạo ca mới hoặc tiếp tục sửa các ca ở trạng thái Bản nháp. Khi hoàn tất, gửi ca sang Chờ duyệt." : "Mở các ca Chờ duyệt để nghe audio, đối chiếu transcript và kiểm tra đáp án trước khi xuất bản hoặc trả lại bản nháp."}</p>
      </section>}
      <section className="admin-panel">
        <div className="panel-heading"><h2>{industries.length} nhóm ngành</h2><Link href="/practice" prefetch={false}>Xem trang người học →</Link></div>
        <div className="admin-record-list practice-admin-list">
          {industries.length ? industries.map((industry) => <Link href={`/admin/practice/industries/${industry.id}`} key={industry.id} prefetch={false}>
            <span><strong>{industry.label}</strong><small>{industry.slug} · {industry.scenarioCount} ca · {industry.publishedCount} đang xuất bản</small></span>
            <StatusBadge status={industry.status} />
          </Link>) : <p className="admin-empty">Chưa có nhóm ngành. Tạo nhóm đầu tiên để bắt đầu biên soạn ca luyện.</p>}
        </div>
      </section>
    </div>
  </div></main>;
}
