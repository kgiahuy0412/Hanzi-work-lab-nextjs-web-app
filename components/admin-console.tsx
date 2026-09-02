import Link from "next/link";
import { ArrowLeft, ArrowUpRight, Bell, Check, Clock3, GitBranch, RotateCcw, UsersRound, X } from "lucide-react";
import { AdminNavigation } from "@/components/admin-navigation";
import { BrandLogoImage } from "@/components/brand-logo";
import { PracticeAudioUploader } from "@/components/practice-audio-uploader";
import type { ContentStatus } from "@/lib/admin-content-validation";
import type { UserRole } from "@/lib/auth-service";
import type { PracticeReadinessItem } from "@/lib/practice-workflow";
import type { PracticeScenarioSnapshot } from "@/lib/practice-version";
import {
  formatPracticeReviewDueDateInput,
  isPracticeReviewOverdue,
  type PracticeReviewPriority,
} from "@/lib/practice-review-queue";
import { serializeDialogue, serializeNotes, serializeStringList } from "@/lib/admin-content-validation";
import {
  practiceAudioReviewIssueLabels,
  practiceAudioReviewIssues,
  practiceAudioReviewStatusLabels,
  type PracticeAudioReviewIssue,
  type PracticeAudioReviewStatus,
} from "@/lib/practice-audio-review";

type FormAction = (formData: FormData) => void | Promise<void>;

const statusLabels: Record<ContentStatus, string> = {
  draft: "Bản nháp",
  review: "Chờ duyệt",
  published: "Đã xuất bản",
  archived: "Lưu trữ",
};

const errorMessages: Record<string, string> = {
  duplicate_slug: "Slug đã tồn tại trong phạm vi này. Hãy chọn slug khác.",
  invalid_input: "Dữ liệu chưa hợp lệ. Hãy kiểm tra các trường bắt buộc và định dạng nội dung.",
  invalid_parent: "Lộ trình hoặc module cha không còn tồn tại.",
  incomplete_content: "Ca cần ít nhất 2 lượt nghe hợp lệ trước khi xuất bản.",
  not_found: "Không tìm thấy bản ghi cần cập nhật.",
  unsafe_delete: "Không thể xóa cứng vì nội dung đã xuất bản hoặc đang có dữ liệu phụ thuộc. Hãy chuyển trạng thái sang Lưu trữ.",
  workflow_forbidden: "Vai trò hiện tại hoặc trạng thái của ca không cho phép thao tác này.",
  invalid_transition: "Không thể chuyển trạng thái theo hướng này. Hãy đi đúng quy trình biên soạn và kiểm duyệt.",
  review_not_ready: "Ca chưa đạt đủ checklist xuất bản. Hãy bổ sung nội dung còn thiếu và nghe duyệt toàn bộ audio.",
  role_change_forbidden: "Không thể đổi vai trò tài khoản này vì lý do an toàn hoặc tài khoản chưa xác minh.",
  invalid_version: "Phiên bản không còn hợp lệ, không thuộc ca này hoặc đang là bản mới nhất.",
  invalid_reviewer: "Người được chọn không còn là kiểm duyệt viên đang hoạt động.",
  review_assignment_forbidden: "Bạn không thể nhận hoặc thay đổi phân công của ca này.",
  review_assignment_required: "Hãy tự nhận ca này trước khi trả về Bản nháp hoặc duyệt xuất bản.",
  vip_target_ineligible: "Chỉ có thể cấp VIP cho học viên đang hoạt động và đã xác minh email.",
  vip_plan_inactive: "Gói VIP này không còn hoạt động.",
  vip_not_active: "Tài khoản này không có quyền VIP đang hoạt động.",
  vip_request_not_pending: "Yêu cầu này đã được xử lý hoặc đã bị hủy. Hãy tải lại hàng đợi.",
  vip_request_ineligible: "Tài khoản hiện không đủ điều kiện gửi yêu cầu VIP.",
  duplicate_code: "Mã gói VIP đã tồn tại. Hãy dùng một mã khác.",
  vip_plan_in_use: "Gói đã có đăng ký, yêu cầu hoặc giao dịch nên không thể xóa. Hãy chuyển sang Tạm ngưng.",
  user_delete_forbidden: "Không thể xóa tài khoản này. Chỉ học viên đang hoạt động và không phải tài khoản hiện tại mới được phép khóa.",
};

const successMessages: Record<string, string> = {
  audio_reviewed: "Đã lưu kết quả nghe duyệt audio.",
  created: "Đã tạo nội dung và ghi audit log.",
  deleted: "Đã xóa bản nháp an toàn và ghi audit log.",
  saved: "Đã lưu thay đổi và ghi audit log.",
  transitioned: "Đã chuyển trạng thái nội dung và ghi lại người thực hiện.",
  role_updated: "Đã cập nhật vai trò và ghi audit log.",
  version_restored: "Đã khôi phục nội dung thành một Bản nháp mới. Lịch sử trước đó vẫn được giữ nguyên.",
  review_assigned: "Đã cập nhật người phụ trách, ưu tiên và hạn duyệt.",
  review_claimed: "Bạn đã nhận ca này vào hàng đợi kiểm duyệt của mình.",
  review_released: "Đã trả ca về hàng đợi chưa phân công.",
  vip_granted: "Đã cấp hoặc gia hạn VIP và ghi audit log.",
  vip_revoked: "Đã thu hồi VIP và ghi audit log.",
  vip_request_approved: "Đã duyệt yêu cầu, kích hoạt VIP và ghi audit log.",
  vip_request_rejected: "Đã từ chối yêu cầu và lưu lý do vào audit log.",
  vip_plan_created: "Đã tạo gói VIP mới.",
  vip_plan_updated: "Đã cập nhật thông tin gói VIP.",
  vip_plan_status_updated: "Đã cập nhật trạng thái hiển thị của gói VIP.",
  vip_plan_deleted: "Đã xóa gói VIP chưa có dữ liệu liên quan.",
  user_deleted: "Đã khóa tài khoản, thu hồi phiên đăng nhập và giữ lại lịch sử giao dịch.",
};

const roleLabels: Record<UserRole, string> = {
  learner: "Học viên",
  editor: "Biên tập viên",
  reviewer: "Kiểm duyệt viên",
  admin: "Quản trị viên",
};

export function AdminConsoleHeader({ title, eyebrow, description, userName, userRole = "admin", backHref }: {
  title: string;
  eyebrow: string;
  description?: string;
  userName: string;
  userRole?: UserRole;
  backHref?: string;
}) {
  const userInitial = userName.trim().slice(0, 1).toLocaleUpperCase("vi-VN") || "H";

  return <>
    <aside className="admin-sidebar">
      <Link aria-label="Himi Chinese Console - Tổng quan" className="admin-sidebar-brand" href="/admin" prefetch={false}>
        <span><BrandLogoImage priority size={40} /></span>
        <div><strong>Himi Chinese</strong><small>Admin Console</small></div>
      </Link>
      <AdminNavigation userRole={userRole} />
      <div className="admin-sidebar-footer">
        <Link href="/account" prefetch={false}>
          <span aria-hidden="true" className="admin-user-avatar">{userInitial}</span>
          <span><strong>{userName}</strong><small>{roleLabels[userRole]}</small></span>
          <ArrowUpRight aria-hidden="true" size={14} />
        </Link>
      </div>
    </aside>
    <header className="admin-top">
      <div className="admin-title">
        {backHref ? <Link className="admin-back" href={backHref} prefetch={false}><ArrowLeft size={14} /> Quay lại</Link> : null}
        <span>{eyebrow}</span><h1>{title}</h1>{description ? <p>{description}</p> : null}
      </div>
      <div className="admin-top-actions">
        <Link aria-label="Thông báo" className="admin-icon-button" href="/notifications" prefetch={false} title="Thông báo"><Bell aria-hidden="true" size={17} /></Link>
        <Link className="button button-primary admin-learner-link" href="/" prefetch={false}>Trang người học <ArrowUpRight aria-hidden="true" size={15} /></Link>
      </div>
    </header>
  </>;
}

export function AdminNotice({ error, success }: { error?: string; success?: string }) {
  if (error && errorMessages[error]) return <p className="admin-message error" role="alert">{errorMessages[error]}</p>;
  if (success && successMessages[success]) return <p className="admin-message success" role="status">{successMessages[success]}</p>;
  return null;
}

export function StatusBadge({ status }: { status: ContentStatus }) {
  return <span className={`status ${status}`}>{statusLabels[status]}</span>;
}

const transitionLabels: Partial<Record<ContentStatus, string>> = {
  draft: "Trả về bản nháp",
  review: "Gửi kiểm duyệt",
  published: "Duyệt và xuất bản",
  archived: "Đưa vào lưu trữ",
};

export function PracticeWorkflowPanel({ action, scenarioId, status, readiness, transitions }: {
  action: FormAction;
  scenarioId: string;
  status: ContentStatus;
  readiness: { ready: boolean; passed: number; items: PracticeReadinessItem[] };
  transitions: ContentStatus[];
}) {
  return <section className="admin-panel practice-workflow-panel">
    <div className="panel-heading"><h2>Kiểm duyệt xuất bản</h2><StatusBadge status={status} /></div>
    <div className="practice-readiness-score"><strong>{readiness.passed}/{readiness.items.length}</strong><span>{readiness.ready ? "Đủ điều kiện xuất bản" : "Còn mục cần hoàn thiện"}</span></div>
    <div className="practice-readiness-list">{readiness.items.map((item) => <div className={item.passed ? "passed" : "missing"} key={item.id}>
      <span>{item.passed ? <Check size={14} /> : <X size={14} />}</span>
      <div><strong>{item.label}</strong><small>{item.detail}</small></div>
    </div>)}</div>
    {transitions.length ? <form action={action} className="practice-workflow-form">
      <input name="scenarioId" type="hidden" value={scenarioId} />
      <label>Ghi chú chuyển trạng thái<input maxLength={500} name="changeNote" placeholder="Nêu kết quả kiểm tra hoặc phần cần sửa" required /></label>
      <div>{transitions.map((target) => <button className={`button ${target === "published" ? "button-primary" : "button-secondary"}`} key={target} name="targetStatus" type="submit" value={target}>{transitionLabels[target]}</button>)}</div>
    </form> : <p className="admin-empty">Vai trò hiện tại không có bước chuyển trạng thái ở giai đoạn này.</p>}
  </section>;
}

const reviewPriorityLabels: Record<PracticeReviewPriority, string> = {
  normal: "Bình thường",
  high: "Ưu tiên cao",
  urgent: "Khẩn",
};

type PracticeReviewAssignee = {
  id: string;
  displayName: string | null;
  email: string;
  role: UserRole;
};

type PracticeReviewQueueItem = {
  id: string;
  slug: string;
  title: string;
  brief: string;
  isFree: boolean;
  industryLabel: string;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewerEmail: string | null;
  reviewPriority: string;
  reviewDueAt: Date | null;
  reviewRequestedAt: Date | null;
  readiness: { ready: boolean; passed: number; items: PracticeReadinessItem[] };
};

function reviewPriorityOf(value: string): PracticeReviewPriority {
  return value === "urgent" || value === "high" ? value : "normal";
}

function reviewDateLabel(value: Date | null): string {
  return value
    ? value.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "Asia/Ho_Chi_Minh" })
    : "Chưa đặt hạn";
}

function ReviewAssignmentFields({ assignees, item }: { assignees: PracticeReviewAssignee[]; item: PracticeReviewQueueItem }) {
  const priority = reviewPriorityOf(item.reviewPriority);
  return <>
    <label>Người phụ trách<select defaultValue={item.reviewerId ?? ""} name="reviewerId"><option value="">Chưa phân công</option>{assignees.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.displayName || assignee.email} · {assignee.role === "admin" ? "Admin" : "Reviewer"}</option>)}</select></label>
    <label>Ưu tiên<select defaultValue={priority} name="reviewPriority"><option value="normal">Bình thường</option><option value="high">Ưu tiên cao</option><option value="urgent">Khẩn</option></select></label>
    <label>Hạn duyệt<input defaultValue={formatPracticeReviewDueDateInput(item.reviewDueAt)} name="reviewDueDate" type="date" /></label>
  </>;
}

export function PracticeReviewQueue({
  action,
  assignees,
  claimAction,
  items,
  releaseAction,
  userId,
  userRole,
}: {
  action: FormAction;
  assignees: PracticeReviewAssignee[];
  claimAction: FormAction;
  items: PracticeReviewQueueItem[];
  releaseAction: FormAction;
  userId: string;
  userRole: UserRole;
}) {
  const overdueCount = items.filter((item) => isPracticeReviewOverdue("review", item.reviewDueAt)).length;
  const unassignedCount = items.filter((item) => !item.reviewerId).length;
  return <section className="admin-panel practice-review-queue" aria-labelledby="practice-review-queue-title">
    <div className="practice-review-queue-heading">
      <div><span>Vận hành kiểm duyệt</span><h2 id="practice-review-queue-title">Hàng đợi đang chờ xử lý</h2><p>Ca khẩn và ca sắp đến hạn được đưa lên trước. Reviewer chỉ thấy ca của mình cùng các ca chưa có người nhận.</p></div>
      <dl><div><dt>Chờ duyệt</dt><dd>{items.length}</dd></div><div><dt>Chưa nhận</dt><dd>{unassignedCount}</dd></div><div className={overdueCount ? "is-alert" : ""}><dt>Quá hạn</dt><dd>{overdueCount}</dd></div></dl>
    </div>
    <div className="practice-review-queue-list">
      {items.length ? items.map((item) => {
        const priority = reviewPriorityOf(item.reviewPriority);
        const overdue = isPracticeReviewOverdue("review", item.reviewDueAt);
        const assignedToCurrentUser = item.reviewerId === userId;
        return <article className={overdue ? "is-overdue" : ""} key={item.id}>
          <div className="practice-review-task-copy">
            <div className="practice-review-task-meta"><span className={`practice-review-priority ${priority}`}>{reviewPriorityLabels[priority]}</span><span>{item.industryLabel}</span><span>{item.isFree ? "Miễn phí" : "VIP"}</span></div>
            <Link href={`/admin/practice/scenarios/${item.id}`} prefetch={false}><strong>{item.title}</strong><span>{item.brief}</span></Link>
            <div className="practice-review-task-status"><span>{item.reviewerId ? `Phụ trách: ${item.reviewerName || item.reviewerEmail}` : "Chưa có người nhận"}</span><span className={overdue ? "overdue" : ""}><Clock3 size={12} /> {overdue ? "Quá hạn · " : ""}{reviewDateLabel(item.reviewDueAt)}</span><span>{item.readiness.passed}/{item.readiness.items.length} điều kiện xuất bản</span></div>
          </div>
          {userRole === "admin" ? <form action={action} className="practice-review-assignment-form">
            <input name="scenarioId" type="hidden" value={item.id} /><input name="returnPath" type="hidden" value="queue" />
            <ReviewAssignmentFields assignees={assignees} item={item} />
            <button className="button button-secondary" type="submit">Lưu phân công</button>
          </form> : userRole === "reviewer" ? <div className="practice-review-task-actions">
            {assignedToCurrentUser ? <><Link className="button button-primary" href={`/admin/practice/scenarios/${item.id}`} prefetch={false}>Mở kiểm duyệt</Link><form action={releaseAction}><input name="scenarioId" type="hidden" value={item.id} /><input name="returnPath" type="hidden" value="queue" /><button className="button button-secondary" type="submit">Bỏ nhận</button></form></> : <form action={claimAction}><input name="scenarioId" type="hidden" value={item.id} /><input name="returnPath" type="hidden" value="queue" /><button className="button button-primary" type="submit">Nhận ca này</button></form>}
          </div> : <Link className="button button-secondary" href={`/admin/practice/scenarios/${item.id}`} prefetch={false}>Xem trạng thái</Link>}
        </article>;
      }) : <p className="admin-empty">Không có ca nào đang chờ duyệt trong phạm vi của bạn.</p>}
    </div>
  </section>;
}

export function PracticeReviewAssignmentPanel({
  action,
  assignees,
  claimAction,
  item,
  releaseAction,
  userId,
  userRole,
}: {
  action: FormAction;
  assignees: PracticeReviewAssignee[];
  claimAction: FormAction;
  item: PracticeReviewQueueItem & { status: ContentStatus };
  releaseAction: FormAction;
  userId: string;
  userRole: UserRole;
}) {
  const active = item.status === "review";
  const assignedToCurrentUser = item.reviewerId === userId;
  const overdue = isPracticeReviewOverdue(item.status, item.reviewDueAt);
  return <section className="admin-panel practice-review-assignment-panel">
    <div className="panel-heading"><h2>Điều phối kiểm duyệt</h2><span className={`practice-review-priority ${reviewPriorityOf(item.reviewPriority)}`}>{reviewPriorityLabels[reviewPriorityOf(item.reviewPriority)]}</span></div>
    <div className="practice-review-owner"><UsersRound size={17} /><div><span>Người phụ trách</span><strong>{item.reviewerId ? item.reviewerName || item.reviewerEmail : "Chưa phân công"}</strong></div></div>
    <p className={overdue ? "practice-review-due is-overdue" : "practice-review-due"}><Clock3 size={14} /> {overdue ? "Đã quá hạn · " : ""}{reviewDateLabel(item.reviewDueAt)}</p>
    {active && userRole === "admin" ? <form action={action} className="practice-review-assignment-form detail">
      <input name="scenarioId" type="hidden" value={item.id} />
      <ReviewAssignmentFields assignees={assignees} item={item} />
      <button className="button button-secondary" type="submit">Cập nhật phân công</button>
    </form> : null}
    {active && userRole === "reviewer" ? <div className="practice-review-panel-actions">{assignedToCurrentUser ? <form action={releaseAction}><input name="scenarioId" type="hidden" value={item.id} /><button className="button button-secondary" type="submit">Bỏ nhận ca</button></form> : item.reviewerId ? <p className="admin-empty">Ca này đang thuộc hàng đợi của một reviewer khác.</p> : <form action={claimAction}><input name="scenarioId" type="hidden" value={item.id} /><button className="button button-primary" type="submit">Nhận ca để kiểm duyệt</button></form>}</div> : null}
    {!active ? <p className="admin-empty">Phân công chỉ chỉnh được khi ca ở trạng thái Chờ duyệt.</p> : null}
  </section>;
}

export function PracticeVersionHistory({ action, scenarioId, versions, versionCount, canRestore }: {
  action: FormAction;
  scenarioId: string;
  versionCount: number;
  canRestore: boolean;
  versions: Array<{
    id: string;
    version: number;
    snapshot: PracticeScenarioSnapshot | null;
    changeNote: string | null;
    creatorName: string | null;
    creatorEmail: string;
    creatorRole: UserRole;
    createdAt: Date;
  }>;
}) {
  return <section className="admin-panel practice-version-history" aria-labelledby="practice-version-title">
    <div className="panel-heading">
      <div><span className="practice-version-eyebrow"><GitBranch size={14} /> Lịch sử biên tập</span><h2 id="practice-version-title">Các phiên bản của ca</h2></div>
      <span>{versions.length < versionCount ? `${versions.length}/${versionCount} gần nhất` : `${versionCount} phiên bản`}</span>
    </div>
    <p className="practice-version-intro">Mỗi lần sửa hoặc chuyển trạng thái đều tạo một mốc độc lập. Khôi phục sẽ tạo thêm một Bản nháp mới, không ghi đè lịch sử.</p>
    <div className="practice-version-timeline">
      {versions.map((version, index) => {
        const snapshot = version.snapshot;
        const isLatest = index === 0;
        const audioCount = snapshot?.exercises.filter((exercise) => exercise.audioAssetId || exercise.audioUrl).length ?? 0;
        return <details className={`practice-version-item ${isLatest ? "is-latest" : ""}`} key={version.id} open={isLatest}>
          <summary>
            <span className="practice-version-node" aria-hidden="true" />
            <span className="practice-version-number">v{version.version}</span>
            <span className="practice-version-summary"><strong>{version.changeNote || "Không có ghi chú thay đổi"}</strong><small><Clock3 size={13} /> {version.createdAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })} · {version.creatorName || version.creatorEmail}</small></span>
            {isLatest ? <span className="practice-version-current">Bản hiện tại</span> : snapshot ? <StatusBadge status={snapshot.scenario.status} /> : <span className="practice-version-invalid">Không đọc được</span>}
          </summary>
          {snapshot ? <div className="practice-version-content">
            <div className="practice-version-overview">
              <div><span>Tiêu đề tại thời điểm này</span><strong>{snapshot.scenario.title}</strong><p>{snapshot.scenario.brief}</p></div>
              <dl>
                <div><dt>Lượt nghe</dt><dd>{snapshot.exercises.length}</dd></div>
                <div><dt>Có audio</dt><dd>{audioCount}/{snapshot.exercises.length}</dd></div>
                <div><dt>Quyền</dt><dd>{snapshot.scenario.isFree ? "Miễn phí" : "VIP"}</dd></div>
                <div><dt>Người sửa</dt><dd>{roleLabels[version.creatorRole]}</dd></div>
              </dl>
            </div>
            {snapshot.scenario.focus.length ? <div className="practice-version-focus">{snapshot.scenario.focus.map((focus, focusIndex) => <span key={`${focus}-${focusIndex}`}>{focus}</span>)}</div> : null}
            <div className="practice-version-exercises">
              {snapshot.exercises.map((exercise, exerciseIndex) => <div key={`${version.id}-${exercise.slug}`}>
                <span>{String(exerciseIndex + 1).padStart(2, "0")}</span>
                <div><strong>{exercise.eyebrow}</strong><small lang="zh">{exercise.listeningText || exercise.chinese || "Chưa có transcript"}</small></div>
                <b className="true">Đáp án {exercise.correctOption + 1}</b>
              </div>)}
            </div>
            {canRestore && !isLatest ? <form action={action} className="practice-version-restore-form">
              <input name="scenarioId" type="hidden" value={scenarioId} />
              <input name="versionId" type="hidden" value={version.id} />
              <div><strong>Khôi phục v{version.version} thành Bản nháp mới</strong><p>Slug, nhóm ngành và lịch sử người học hiện tại được giữ nguyên.</p></div>
              <label>Ghi chú khôi phục<textarea maxLength={500} name="changeNote" placeholder="Ví dụ: Quay lại nội dung trước lần sửa audio" required rows={2} /></label>
              <label className="practice-version-confirm"><input name="confirmDelete" required type="checkbox" value="DELETE" /> Tôi hiểu nội dung Bản nháp hiện tại sẽ được thay bằng nội dung của v{version.version}.</label>
              <button className="button button-secondary" type="submit"><RotateCcw size={15} /> Khôi phục phiên bản này</button>
            </form> : null}
          </div> : <p className="admin-empty">Snapshot cũ không còn tương thích nên chỉ được giữ để đối chiếu audit, không thể khôi phục.</p>}
        </details>;
      })}
      {!versions.length ? <p className="admin-empty">Chưa có phiên bản nào. Mốc đầu tiên sẽ xuất hiện sau khi lưu nội dung.</p> : null}
    </div>
  </section>;
}

export function CourseForm({ action, course, submitLabel }: {
  action: FormAction;
  course?: {
    id: string; slug: string; titleVi: string; titleZh: string; hanzi: string; category: string; description: string;
    level: string; themeColor: string; themeInk: string; status: ContentStatus; sortOrder: number;
  };
  submitLabel: string;
}) {
  return <form action={action} className="admin-form" key={course?.id ?? "new-course"}>
    {course ? <input name="courseId" type="hidden" value={course.id} /> : null}
    <div className="admin-form-grid two">
      <label>Tên tiếng Việt<input defaultValue={course?.titleVi} maxLength={180} name="titleVi" required /></label>
      <label>Tên tiếng Trung<input defaultValue={course?.titleZh} maxLength={180} name="titleZh" required /></label>
      <label>Slug<input defaultValue={course?.slug} maxLength={160} name="slug" placeholder="Tự tạo từ tên nếu để trống" /></label>
      <label>Chữ đại diện<input defaultValue={course?.hanzi} maxLength={12} name="hanzi" required /></label>
      <label>Nhóm nội dung<input defaultValue={course?.category} maxLength={100} name="category" required /></label>
      <label>Cấp độ<input defaultValue={course?.level} maxLength={40} name="level" required /></label>
      <label>Trạng thái<select defaultValue={course?.status ?? "draft"} name="status"><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label>
      <label>Thứ tự<input defaultValue={course?.sortOrder ?? 0} max={10000} min={0} name="sortOrder" type="number" /></label>
      <label>Màu nền<input defaultValue={course?.themeColor ?? "#dcebe2"} name="themeColor" type="color" /></label>
      <label>Màu chữ<input defaultValue={course?.themeInk ?? "#176b5b"} name="themeInk" type="color" /></label>
    </div>
    <label>Mô tả<textarea defaultValue={course?.description} maxLength={4000} name="description" required rows={4} /></label>
    <button className="button button-primary" type="submit">{submitLabel}</button>
  </form>;
}

export function ModuleForm({ action, courseId, module, submitLabel }: {
  action: FormAction;
  courseId: string;
  module?: { id: string; slug: string; title: string; description: string | null; sortOrder: number };
  submitLabel: string;
}) {
  return <form action={action} className="admin-form" key={module?.id ?? `new-module-${courseId}`}>
    <input name="courseId" type="hidden" value={courseId} />
    {module ? <input name="moduleId" type="hidden" value={module.id} /> : null}
    <div className="admin-form-grid two">
      <label>Tên module<input defaultValue={module?.title} maxLength={180} name="title" required /></label>
      <label>Slug<input defaultValue={module?.slug} maxLength={160} name="slug" placeholder="Tự tạo nếu để trống" /></label>
      <label>Thứ tự<input defaultValue={module?.sortOrder ?? 0} max={10000} min={0} name="sortOrder" type="number" /></label>
    </div>
    <label>Mô tả<textarea defaultValue={module?.description ?? ""} maxLength={4000} name="description" rows={3} /></label>
    <button className="button button-secondary" type="submit">{submitLabel}</button>
  </form>;
}

export function LessonCreateForm({ action, moduleId, nextOrder }: { action: FormAction; moduleId: string; nextOrder: number }) {
  return <form action={action} className="admin-form" key={`new-lesson-${moduleId}`}>
    <input name="moduleId" type="hidden" value={moduleId} />
    <div className="admin-form-grid two">
      <label>Tên bài học<input maxLength={180} name="title" required /></label>
      <label>Slug<input maxLength={160} name="slug" placeholder="Tự tạo nếu để trống" /></label>
      <label>Tình huống<input maxLength={180} name="situation" required /></label>
      <label>Thời lượng<input defaultValue={10} max={180} min={1} name="estimatedMinutes" type="number" /></label>
      <label>Trạng thái<select defaultValue="draft" name="status"><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Xuất bản</option></select></label>
      <label>Thứ tự<input defaultValue={nextOrder} max={10000} min={0} name="sortOrder" type="number" /></label>
    </div>
    <label>Tóm tắt<textarea maxLength={4000} name="summary" required rows={3} /></label>
    <label className="admin-check"><input name="isFree" type="checkbox" /> Bài miễn phí</label>
    <input name="changeNote" type="hidden" value="Tạo bài học từ Console" />
    <button className="button button-primary" type="submit">Tạo bài học</button>
  </form>;
}

export function LessonEditForm({ action, lesson, vocabulary, linkedVocabularyIds }: {
  action: FormAction;
  lesson: {
    id: string; moduleId: string; slug: string; title: string; summary: string | null; situation: string | null;
    estimatedMinutes: number; isFree: boolean; status: ContentStatus; sortOrder: number; content: unknown;
  };
  vocabulary: Array<{ id: string; hanzi: string; pinyin: string; meaningVi: string }>;
  linkedVocabularyIds: Set<string>;
}) {
  return <form action={action} className="admin-form lesson-editor" key={lesson.id}>
    <input name="lessonId" type="hidden" value={lesson.id} />
    <input name="moduleId" type="hidden" value={lesson.moduleId} />
    <div className="admin-form-grid two">
      <label>Tên bài học<input defaultValue={lesson.title} maxLength={180} name="title" required /></label>
      <label>Slug<input defaultValue={lesson.slug} maxLength={160} name="slug" required /></label>
      <label>Tình huống<input defaultValue={lesson.situation ?? ""} maxLength={180} name="situation" required /></label>
      <label>Thời lượng<input defaultValue={lesson.estimatedMinutes} max={180} min={1} name="estimatedMinutes" type="number" /></label>
      <label>Trạng thái<select defaultValue={lesson.status} name="status"><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label>
      <label>Thứ tự<input defaultValue={lesson.sortOrder} max={10000} min={0} name="sortOrder" type="number" /></label>
    </div>
    <label>Tóm tắt<textarea defaultValue={lesson.summary ?? ""} maxLength={4000} name="summary" required rows={3} /></label>
    <label className="admin-check"><input defaultChecked={lesson.isFree} name="isFree" type="checkbox" /> Bài miễn phí</label>
    <div className="admin-editor-help"><strong>Hội thoại</strong><span>Mỗi dòng: Người nói | Chữ Hán | Pinyin | Dịch Việt</span></div>
    <textarea defaultValue={serializeDialogue(lesson.content)} name="dialogue" placeholder="A | 你好 | Nǐ hǎo | Xin chào" rows={8} />
    <div className="admin-editor-help"><strong>Ghi chú</strong><span>Mỗi dòng: Tiêu đề | Mẫu câu | Giải thích</span></div>
    <textarea defaultValue={serializeNotes(lesson.content)} name="notes" placeholder="Cách chào | 您好 | Dùng trong ngữ cảnh lịch sự" rows={6} />
    <fieldset className="vocabulary-picker"><legend>Từ vựng trong bài ({vocabulary.length} từ có sẵn)</legend><div>{vocabulary.map((word) => <label key={word.id}><input defaultChecked={linkedVocabularyIds.has(word.id)} name="vocabularyIds" type="checkbox" value={word.id} /><span lang="zh">{word.hanzi}</span><small>{word.pinyin} · {word.meaningVi}</small></label>)}</div></fieldset>
    <label>Ghi chú thay đổi<input maxLength={500} name="changeNote" placeholder="Ví dụ: Sửa pinyin và bổ sung hội thoại" /></label>
    <button className="button button-primary" type="submit">Lưu bài học và tạo phiên bản</button>
  </form>;
}

export function VocabularyForm({ action, word, submitLabel }: {
  action: FormAction;
  word?: { id: string; slug: string; hanzi: string; pinyin: string; meaningVi: string; exampleZh: string | null; exampleVi: string | null; audioUrl: string | null; tags: unknown };
  submitLabel: string;
}) {
  const tags = Array.isArray(word?.tags) ? word.tags.filter((tag): tag is string => typeof tag === "string").join(", ") : "";
  return <form action={action} className="admin-form" key={word?.id ?? "new-vocabulary"}>
    {word ? <input name="vocabularyId" type="hidden" value={word.id} /> : null}
    <div className="admin-form-grid two">
      <label>Chữ Hán<input defaultValue={word?.hanzi} maxLength={120} name="hanzi" required /></label>
      <label>Pinyin<input defaultValue={word?.pinyin} maxLength={220} name="pinyin" required /></label>
      <label>Slug<input defaultValue={word?.slug} maxLength={180} name="slug" placeholder="Tự tạo từ pinyin nếu để trống" /></label>
      <label>Nghĩa tiếng Việt<input defaultValue={word?.meaningVi} maxLength={2000} name="meaningVi" required /></label>
    </div>
    <label>Ví dụ tiếng Trung<textarea defaultValue={word?.exampleZh ?? ""} maxLength={2000} name="exampleZh" rows={2} /></label>
    <label>Dịch ví dụ<textarea defaultValue={word?.exampleVi ?? ""} maxLength={2000} name="exampleVi" rows={2} /></label>
    <div className="admin-form-grid two"><label>Audio URL<input defaultValue={word?.audioUrl ?? ""} maxLength={2000} name="audioUrl" type="url" /></label><label>Tags, phân cách bằng dấu phẩy<input defaultValue={tags} maxLength={1000} name="tags" /></label></div>
    <button className="button button-primary" type="submit">{submitLabel}</button>
  </form>;
}

export function PracticeIndustryForm({ action, industry, submitLabel }: {
  action: FormAction;
  industry?: {
    id: string;
    slug: string;
    label: string;
    description: string;
    imageUrl: string | null;
    status: ContentStatus;
    sortOrder: number;
  };
  submitLabel: string;
}) {
  return <form action={action} className="admin-form" key={industry?.id ?? "new-practice-industry"}>
    {industry ? <input name="industryId" type="hidden" value={industry.id} /> : null}
    <div className="admin-form-grid two">
      <label>Tên nhóm ngành<input defaultValue={industry?.label} maxLength={120} name="label" required /></label>
      <label>Slug<input defaultValue={industry?.slug} maxLength={80} name="slug" placeholder="Tự tạo từ tên nếu để trống" /></label>
      <label>Trạng thái<select defaultValue={industry?.status ?? "draft"} name="status"><option value="draft">Bản nháp</option><option value="review">Chờ duyệt</option><option value="published">Xuất bản</option><option value="archived">Lưu trữ</option></select></label>
      <label>Thứ tự<input defaultValue={industry?.sortOrder ?? 0} max={10000} min={0} name="sortOrder" type="number" /></label>
    </div>
    <label>Mô tả<textarea defaultValue={industry?.description} maxLength={4000} name="description" required rows={3} /></label>
    <label>Ảnh bối cảnh<input defaultValue={industry?.imageUrl ?? ""} maxLength={2000} name="imageUrl" placeholder="/assets/practice/van-phong.webp hoặc https://…" /></label>
    <button className="button button-primary" type="submit">{submitLabel}</button>
  </form>;
}

export function PracticeScenarioForm({ action, scenario, industries, nextOrder = 0, submitLabel }: {
  action: FormAction;
  scenario?: {
    id: string;
    industryId: string;
    slug: string;
    title: string;
    brief: string;
    context: string;
    durationMinutes: number;
    level: string;
    isFree: boolean;
    sentenceZh: string;
    pinyin: string;
    translation: string;
    focus: unknown;
    status: ContentStatus;
    sortOrder: number;
  };
  industries: Array<{ id: string; label: string; slug: string }>;
  nextOrder?: number;
  submitLabel: string;
}) {
  return <form action={action} className="admin-form" key={scenario?.id ?? `new-practice-scenario-${industries[0]?.id ?? "none"}`}>
    {scenario ? <input name="scenarioId" type="hidden" value={scenario.id} /> : null}
    <div className="admin-form-grid two">
      <label>Nhóm ngành<select defaultValue={scenario?.industryId ?? industries[0]?.id} name="industryId" required>{industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.label} · {industry.slug}</option>)}</select></label>
      <label>Tên ca<input defaultValue={scenario?.title} maxLength={180} name="title" required /></label>
      <label>Slug<input defaultValue={scenario?.slug} maxLength={120} name="slug" placeholder="Tự tạo từ tên nếu để trống" /></label>
      <label>Cấp độ<input defaultValue={scenario?.level ?? "Thực tế"} list="practice-levels" maxLength={40} name="level" required /><datalist id="practice-levels"><option value="Cơ bản" /><option value="Thực tế" /><option value="Nâng cao" /></datalist></label>
      <label>Thời lượng (phút)<input defaultValue={scenario?.durationMinutes ?? 7} max={180} min={1} name="durationMinutes" type="number" /></label>
      <label>Thứ tự<input defaultValue={scenario?.sortOrder ?? nextOrder} max={10000} min={0} name="sortOrder" type="number" /></label>
      <input name="status" type="hidden" value={scenario?.status ?? "draft"} />
      <label className="admin-check"><input defaultChecked={scenario?.isFree} name="isFree" type="checkbox" /> Ca miễn phí</label>
    </div>
    <label>Tóm tắt ngắn<textarea defaultValue={scenario?.brief} maxLength={4000} name="brief" required rows={2} /></label>
    <label>Bối cảnh<textarea defaultValue={scenario?.context} maxLength={4000} name="context" required rows={3} /></label>
    <label>Câu trọng tâm tiếng Trung<textarea defaultValue={scenario?.sentenceZh} lang="zh" maxLength={4000} name="sentenceZh" required rows={2} /></label>
    <div className="admin-form-grid two">
      <label>Pinyin<textarea defaultValue={scenario?.pinyin} maxLength={4000} name="pinyin" required rows={2} /></label>
      <label>Dịch tiếng Việt<textarea defaultValue={scenario?.translation} maxLength={4000} name="translation" required rows={2} /></label>
    </div>
    <label>Trọng tâm, phân cách bằng dấu phẩy<input defaultValue={serializeStringList(scenario?.focus, ", ")} maxLength={2000} name="focus" placeholder="Báo sớm, Nêu mốc cụ thể, Giữ giọng chuyên nghiệp" required /></label>
    <label>Ghi chú phiên bản<input maxLength={500} name="changeNote" placeholder={scenario ? "Ví dụ: cập nhật câu trọng tâm và audio" : "Tạo ca luyện từ Console"} /></label>
    <button className="button button-primary" type="submit">{submitLabel}</button>
  </form>;
}

export function PracticeAudioReviewForm({ action, exercise, scenarioId }: {
  action: FormAction;
  exercise: {
    id: string;
    audioAssetId: string;
    audioReviewStatus: PracticeAudioReviewStatus;
    audioReviewIssues: unknown;
    audioReviewNotes: string | null;
    audioReviewedAt: Date | null;
  };
  scenarioId: string;
}) {
  const selectedIssues = new Set(Array.isArray(exercise.audioReviewIssues)
    ? exercise.audioReviewIssues.filter((issue): issue is PracticeAudioReviewIssue => practiceAudioReviewIssues.includes(issue as PracticeAudioReviewIssue))
    : []);
  return <form action={action} className="practice-audio-review-form">
    <input name="scenarioId" type="hidden" value={scenarioId} />
    <input name="exerciseId" type="hidden" value={exercise.id} />
    <input name="audioAssetId" type="hidden" value={exercise.audioAssetId} />
    <div className="practice-audio-review-form-heading">
      <div><span>Kiểm duyệt giọng đọc</span><strong>Nghe trọn câu rồi đối chiếu transcript</strong></div>
      <span className={`practice-audio-review-badge is-${exercise.audioReviewStatus}`}>{practiceAudioReviewStatusLabels[exercise.audioReviewStatus]}</span>
    </div>
    <fieldset>
      <legend>Đánh dấu lỗi nếu cần thu lại</legend>
      <div className="practice-audio-review-issues">
        {practiceAudioReviewIssues.map((issue) => <label key={issue}>
          <input defaultChecked={selectedIssues.has(issue)} name="audioReviewIssues" type="checkbox" value={issue} />
          <span>{practiceAudioReviewIssueLabels[issue]}</span>
        </label>)}
      </div>
    </fieldset>
    <label>Ghi chú cho biên tập viên<textarea defaultValue={exercise.audioReviewNotes ?? ""} maxLength={1000} name="audioReviewNotes" placeholder="Ví dụ: âm 'zh' ở cuối câu chưa rõ, nên thu lại chậm hơn một chút." rows={3} /></label>
    <div className="practice-audio-review-actions">
      <button className="button button-secondary" name="audioReviewStatus" type="submit" value="re_record"><RotateCcw size={15} /> Yêu cầu thu lại</button>
      <button className="button button-primary" name="audioReviewStatus" type="submit" value="approved"><Check size={15} /> Audio đạt</button>
    </div>
    {exercise.audioReviewedAt ? <small className="practice-audio-reviewed-at">Cập nhật gần nhất {exercise.audioReviewedAt.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}</small> : null}
  </form>;
}

export function PracticeExerciseForm({ action, exercise, scenarioId, nextOrder, submitLabel, cloudinaryConfigured = true }: {
  action: FormAction;
  exercise?: {
    id: string;
    audioAssetId: string | null;
    slug: string;
    eyebrow: string;
    prompt: string;
    chinese: string | null;
    listeningText: string | null;
    isStatementCorrect: boolean | null;
    audioUrl: string | null;
    options: unknown;
    correctOption: number;
    explanation: string;
    sortOrder: number;
    audioOriginalName: string | null;
    audioMimeType: string | null;
    audioSizeBytes: number | null;
    audioDurationMs: number | null;
    audioStorageProvider: string | null;
    audioReviewStatus: PracticeAudioReviewStatus;
    audioReviewIssues: unknown;
    audioReviewNotes: string | null;
    audioReviewedAt: Date | null;
  };
  scenarioId: string;
  nextOrder: number;
  submitLabel: string;
  cloudinaryConfigured?: boolean;
}) {
  return <form action={action} className="admin-form practice-exercise-form" key={exercise?.id ?? `new-exercise-${scenarioId}`}>
    <input name="scenarioId" type="hidden" value={scenarioId} />
    {exercise ? <input name="exerciseId" type="hidden" value={exercise.id} /> : null}
    <div className="admin-form-grid two">
      <label>Nhãn lượt nghe<input defaultValue={exercise?.eyebrow} maxLength={160} name="eyebrow" placeholder="Nghe và chọn nghĩa" required /></label>
      <label>Slug<input defaultValue={exercise?.slug} maxLength={120} name="slug" placeholder="Tự tạo nếu để trống" /></label>
      <label>Thứ tự<input defaultValue={exercise?.sortOrder ?? nextOrder} max={10000} min={0} name="sortOrder" type="number" /></label>
      <label>Đáp án đúng (số thứ tự)<input defaultValue={(exercise?.correctOption ?? 0) + 1} max={8} min={1} name="correctOption" type="number" required /></label>
    </div>
    <label>Câu hỏi<textarea defaultValue={exercise?.prompt} maxLength={4000} name="prompt" placeholder="Câu vừa nghe có nghĩa là gì?" required rows={2} /></label>
    <label>Câu tiếng Trung gợi ý<textarea defaultValue={exercise?.chinese ?? ""} lang="zh" maxLength={4000} name="chinese" rows={2} /></label>
    <label>Bản chép chính xác của audio<textarea defaultValue={exercise?.listeningText ?? ""} lang="zh" maxLength={4000} name="listeningText" placeholder="Nội dung người học sẽ thực sự nghe" required rows={2} /></label>
    <input name="isStatementCorrect" type="hidden" value="true" />
    <PracticeAudioUploader
      cloudinaryConfigured={cloudinaryConfigured}
      exerciseId={exercise?.id}
      initialAsset={exercise?.audioAssetId && exercise.audioOriginalName && exercise.audioMimeType && exercise.audioSizeBytes !== null
        ? {
          id: exercise.audioAssetId,
          url: `/api/media/practice-audio/${exercise.audioAssetId}`,
          originalName: exercise.audioOriginalName,
          mimeType: exercise.audioMimeType,
          sizeBytes: exercise.audioSizeBytes,
          durationMs: exercise.audioDurationMs,
          storageProvider: exercise.audioStorageProvider ?? "database",
          reviewStatus: exercise.audioReviewStatus,
          reviewIssues: Array.isArray(exercise.audioReviewIssues)
            ? exercise.audioReviewIssues.filter((issue): issue is PracticeAudioReviewIssue => practiceAudioReviewIssues.includes(issue as PracticeAudioReviewIssue))
            : [],
          reviewNotes: exercise.audioReviewNotes,
          reviewedAt: exercise.audioReviewedAt?.toISOString() ?? null,
        }
        : null}
    />
    <label>Audio URL cũ — chỉ giữ dữ liệu legacy<input defaultValue={exercise?.audioUrl ?? ""} maxLength={2000} name="audioUrl" placeholder="Audio mới cần upload qua Cloudinary để được kiểm duyệt" /></label>
    <label>Các nghĩa tiếng Việt — mỗi dòng một đáp án<textarea defaultValue={serializeStringList(exercise?.options)} maxLength={16000} name="options" placeholder={'Tiến độ có thể chậm một ngày.\nTiến độ đã hoàn thành sớm.\nNgày mai sẽ bắt đầu công việc.'} required rows={5} /></label>
    <label>Giải thích<textarea defaultValue={exercise?.explanation} maxLength={4000} name="explanation" required rows={3} /></label>
    <label>Ghi chú phiên bản<input maxLength={500} name="changeNote" placeholder={exercise ? "Nêu lý do chỉnh lượt nghe" : "Thêm lượt nghe vào ca"} /></label>
    <button className={`button ${exercise ? "button-secondary" : "button-primary"}`} type="submit">{submitLabel}</button>
  </form>;
}
