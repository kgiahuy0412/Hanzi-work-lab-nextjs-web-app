import type { Metadata } from "next";
import { AdminConsoleHeader, AdminNotice } from "@/components/admin-console";
import { requireAdminUser } from "@/lib/admin-auth";
import { listAdminUsers } from "@/lib/admin-user-service";
import { updateUserRoleAction } from "../actions";

export const metadata: Metadata = { title: "Đội nội dung" };

const roleLabels = {
  learner: "Học viên",
  editor: "Biên tập viên",
  reviewer: "Kiểm duyệt viên",
  admin: "Quản trị viên",
} as const;

export default async function AdminTeamPage({ searchParams }: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [user, query, team] = await Promise.all([requireAdminUser(), searchParams, listAdminUsers()]);
  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader
      description="Phân vai người soạn, người duyệt và quản trị. Tài khoản phải xác minh email trước khi nhận quyền nội dung."
      eyebrow="RBAC"
      title="Đội nội dung"
      userName={user.displayName}
    />
    <AdminNotice error={query.error} success={query.success} />
    <section className="admin-panel admin-team-panel">
      <div className="panel-heading"><h2>{team.length} tài khoản</h2><span>Không thể tự hạ quyền tài khoản đang đăng nhập</span></div>
      <div className="admin-team-list">{team.map((member) => {
        const locked = member.id === user.id || !member.emailVerifiedAt;
        return <article key={member.id}>
          <div><strong>{member.displayName || member.email}</strong><span>{member.email}</span><small>{member.emailVerifiedAt ? "Đã xác minh" : "Chưa xác minh"} · {member.isActive ? "Đang hoạt động" : "Đã khóa"}</small></div>
          <form action={updateUserRoleAction}>
            <input name="userId" type="hidden" value={member.id} />
            <label><span className="sr-only">Vai trò của {member.email}</span><select defaultValue={member.role} disabled={locked} name="role">
              {Object.entries(roleLabels).map(([role, label]) => <option key={role} value={role}>{label}</option>)}
            </select></label>
            <button className="button button-secondary" disabled={locked} type="submit">Cập nhật</button>
          </form>
        </article>;
      })}</div>
    </section>
  </div></main>;
}
