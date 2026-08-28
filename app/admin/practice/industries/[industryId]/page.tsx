import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminConsoleHeader, AdminNotice, PracticeIndustryForm, PracticeScenarioForm, StatusBadge } from "@/components/admin-console";
import { requirePracticeStaffUser } from "@/lib/admin-auth";
import { getAdminPracticeIndustry } from "@/lib/admin-practice-service";
import { canAuthorPractice } from "@/lib/practice-workflow";
import {
  createPracticeScenarioAction,
  deletePracticeIndustryAction,
  updatePracticeIndustryAction,
} from "../../../actions";

export const metadata: Metadata = { title: "Nhóm ngành Luyện ca" };

export default async function AdminPracticeIndustryPage({ params, searchParams }: {
  params: Promise<{ industryId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ industryId }, query, user] = await Promise.all([params, searchParams, requirePracticeStaffUser()]);
  const data = await getAdminPracticeIndustry(industryId);
  if (!data) notFound();
  const nextOrder = data.scenarios.reduce((highest, scenario) => Math.max(highest, scenario.sortOrder), -1) + 1;

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader
      backHref="/admin/practice"
      description={`${data.scenarios.length} ca · ${data.scenarios.filter((scenario) => scenario.status === "published").length} đang xuất bản`}
      eyebrow="Nhóm Luyện ca"
      title={data.industry.label}
      userName={user.displayName}
      userRole={user.role}
    />
    <AdminNotice error={query.error} success={query.success} />
    {user.role === "admin" ? <div className="admin-detail-grid">
      <section className="admin-panel"><div className="panel-heading"><h2>Thông tin nhóm</h2><StatusBadge status={data.industry.status} /></div><PracticeIndustryForm action={updatePracticeIndustryAction} industry={data.industry} submitLabel="Lưu nhóm ngành" /></section>
      <aside className="admin-panel danger-panel"><h2>Xóa cứng</h2><p>Chỉ xóa được nhóm draft/review chưa có ca. Nhóm đã xuất bản nên chuyển sang Lưu trữ.</p><form action={deletePracticeIndustryAction} className="admin-delete-form"><input name="industryId" type="hidden" value={data.industry.id} /><label><input name="confirmDelete" type="checkbox" value="DELETE" /> Tôi hiểu dữ liệu sẽ bị xóa</label><button className="button button-danger" type="submit">Xóa nhóm ngành</button></form></aside>
    </div> : <section className="admin-panel practice-industry-summary"><div className="panel-heading"><h2>Phạm vi làm việc</h2><StatusBadge status={data.industry.status} /></div><p>{data.industry.description}</p></section>}
    <div className="admin-content-grid modules-section">
      {canAuthorPractice(user.role) ? <section className="admin-panel"><div className="panel-heading"><h2>Tạo ca luyện</h2><span>Ca mới luôn bắt đầu ở Bản nháp</span></div><PracticeScenarioForm action={createPracticeScenarioAction} industries={[{ id: data.industry.id, label: data.industry.label, slug: data.industry.slug }]} nextOrder={nextOrder} submitLabel="Tạo ca luyện" /></section> : <section className="admin-panel practice-role-card"><div className="panel-heading"><h2>Chế độ kiểm duyệt</h2><span>Không chỉnh sửa nội dung</span></div><p>Chọn một ca ở trạng thái Chờ duyệt để nghe từng audio và quyết định xuất bản hoặc trả về bản nháp.</p></section>}
      <section className="admin-panel"><div className="panel-heading"><h2>{data.scenarios.length} ca</h2><span>Theo thứ tự hiển thị</span></div><div className="admin-record-list practice-admin-list">{data.scenarios.length ? data.scenarios.map((scenario) => <Link href={`/admin/practice/scenarios/${scenario.id}`} key={scenario.id} prefetch={false}><span><strong>{scenario.title}</strong><small>{scenario.slug} · {scenario.durationMinutes} phút · {scenario.exerciseCount} lượt nghe · {scenario.attemptCount} lượt làm · {scenario.isFree ? "Miễn phí" : "VIP"}</small>{scenario.status === "review" ? <small className="practice-review-list-note">{scenario.reviewerId ? `Reviewer: ${scenario.reviewerName || scenario.reviewerEmail}` : "Chưa có reviewer"}{scenario.reviewDueAt ? ` · Hạn ${scenario.reviewDueAt.toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}` : ""}</small> : null}</span><StatusBadge status={scenario.status} /></Link>) : <p className="admin-empty">Chưa có ca nào trong nhóm này.</p>}</div></section>
    </div>
  </div></main>;
}
