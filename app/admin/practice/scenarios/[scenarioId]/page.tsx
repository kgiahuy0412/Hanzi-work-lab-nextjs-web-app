import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AdminConsoleHeader,
  AdminNotice,
  PracticeAudioReviewForm,
  PracticeExerciseForm,
  PracticeReviewAssignmentPanel,
  PracticeScenarioForm,
  PracticeVersionHistory,
  PracticeWorkflowPanel,
  StatusBadge,
} from "@/components/admin-console";
import { requirePracticeStaffUser } from "@/lib/admin-auth";
import { getAdminPracticeScenario } from "@/lib/admin-practice-service";
import { allowedPracticeTransitions, canEditPracticeScenario, canTransitionAssignedPracticeScenario } from "@/lib/practice-workflow";
import { canReviewPracticeAudio } from "@/lib/practice-audio-review";
import { isCloudinaryPracticeAudioConfigured } from "@/lib/cloudinary-practice-audio";
import {
  assignPracticeReviewAction,
  claimPracticeReviewAction,
  createPracticeExerciseAction,
  deletePracticeExerciseAction,
  deletePracticeScenarioAction,
  restorePracticeScenarioVersionAction,
  releasePracticeReviewAction,
  reviewPracticeExerciseAudioAction,
  transitionPracticeScenarioAction,
  updatePracticeExerciseAction,
  updatePracticeScenarioAction,
} from "../../../actions";

export const metadata: Metadata = { title: "Biên soạn ca Luyện ca" };

function optionsFrom(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

export default async function AdminPracticeScenarioPage({ params, searchParams }: {
  params: Promise<{ scenarioId: string }>;
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const [{ scenarioId }, query, user] = await Promise.all([params, searchParams, requirePracticeStaffUser()]);
  const data = await getAdminPracticeScenario(scenarioId);
  if (!data) notFound();
  const editable = canEditPracticeScenario(user.role, data.scenario.status);
  const actor = { id: user.id, role: user.role };
  const transitions = allowedPracticeTransitions(user.role, data.scenario.status)
    .filter((target) => canTransitionAssignedPracticeScenario(actor, data.scenario.reviewerId, data.scenario.status, target));
  const nextOrder = data.exercises.reduce((highest, exercise) => Math.max(highest, exercise.sortOrder), -1) + 1;
  const canReviewAudio = canReviewPracticeAudio(actor, data.scenario.status, data.scenario.reviewerId);
  const cloudinaryConfigured = isCloudinaryPracticeAudioConfigured();
  const exerciseEditor = <section className={`practice-exercise-editor ${editable ? "" : "is-review"}`} aria-label="Danh sách lượt nghe">
    <div className="panel-heading"><h2>{data.exercises.length} lượt nghe trong ca</h2><span>{editable ? "Đang biên soạn" : "Nghe và đối chiếu theo thứ tự"}</span></div>
    {data.exercises.length ? data.exercises.map((exercise, index) => editable ? <article className="admin-panel" key={exercise.id}>
      <div className="panel-heading"><h3>Lượt {index + 1} · {exercise.eyebrow}</h3><span>{exercise.slug}</span></div>
      <PracticeExerciseForm action={updatePracticeExerciseAction} cloudinaryConfigured={cloudinaryConfigured} exercise={exercise} nextOrder={index} scenarioId={data.scenario.id} submitLabel="Lưu lượt nghe" />
      <form action={deletePracticeExerciseAction} className="admin-delete-form compact"><input name="exerciseId" type="hidden" value={exercise.id} /><input name="scenarioId" type="hidden" value={data.scenario.id} /><label><input name="confirmDelete" type="checkbox" value="DELETE" /> Xác nhận xóa lượt nghe này</label><button className="button button-danger" type="submit">Xóa lượt nghe</button></form>
    </article> : <article className="admin-panel practice-review-exercise" key={exercise.id}>
      <div className="panel-heading"><h3>Lượt {index + 1} · {exercise.eyebrow}</h3><span className={exercise.isStatementCorrect ? "review-truth true" : "review-truth false"}>{exercise.isStatementCorrect ? "Đúng" : "Sai"}</span></div>
      {exercise.audioAssetId || exercise.audioUrl ? <audio controls preload="metadata" src={exercise.audioAssetId ? `/api/media/practice-audio/${exercise.audioAssetId}` : exercise.audioUrl ?? undefined} /> : <p className="admin-message error">Chưa có audio để kiểm duyệt.</p>}
      <div className="practice-review-transcript"><span>Transcript</span><strong lang="zh">{exercise.listeningText}</strong></div>
      <div className="practice-review-question"><span>Câu hỏi</span><p>{exercise.prompt}</p></div>
      <ol>{optionsFrom(exercise.options).map((option, optionIndex) => <li className={optionIndex === exercise.correctOption ? "correct" : ""} key={`${exercise.id}-${optionIndex}`}><span>{optionIndex + 1}</span><span lang="zh">{option}</span>{optionIndex === exercise.correctOption ? <strong>Đáp án</strong> : null}</li>)}</ol>
      <p className="practice-review-explanation"><strong>Giải thích:</strong> {exercise.explanation}</p>
      {exercise.audioAssetId && canReviewAudio ? <PracticeAudioReviewForm action={reviewPracticeExerciseAudioAction} exercise={{ ...exercise, audioAssetId: exercise.audioAssetId }} scenarioId={data.scenario.id} /> : null}
    </article>) : <p className="admin-empty">Ca chưa có lượt nghe. Trả về Bản nháp để bổ sung.</p>}
  </section>;

  return <main className="admin-page"><div className="section-shell">
    <AdminConsoleHeader
      backHref={`/admin/practice/industries/${data.scenario.industryId}`}
      description={`${data.scenario.industryLabel} · ${data.exercises.length} lượt nghe · ${data.scenario.attemptCount} lượt người học đã làm`}
      eyebrow={editable ? "Practice editor" : "Practice review"}
      title={data.scenario.title}
      userName={user.displayName}
      userRole={user.role}
    />
    <AdminNotice error={query.error} success={query.success} />
    <div className="admin-detail-grid lesson-layout">
      <div className="admin-practice-main-stack">
      {editable ? <section className="admin-panel"><div className="panel-heading"><h2>Nội dung ca</h2><StatusBadge status={data.scenario.status} /></div><PracticeScenarioForm action={updatePracticeScenarioAction} industries={data.industries} scenario={data.scenario} submitLabel="Lưu bản nháp và tạo phiên bản" /></section> : <section className="admin-panel practice-review-overview">
        <div className="panel-heading"><h2>Nội dung đang khóa</h2><StatusBadge status={data.scenario.status} /></div>
        <p className="practice-review-lead">{data.scenario.brief}</p>
        <dl><div><dt>Bối cảnh</dt><dd>{data.scenario.context}</dd></div><div><dt>Câu trọng tâm</dt><dd lang="zh">{data.scenario.sentenceZh}</dd></div><div><dt>Pinyin</dt><dd>{data.scenario.pinyin}</dd></div><div><dt>Dịch nghĩa</dt><dd>{data.scenario.translation}</dd></div></dl>
        {data.scenario.status === "published" ? <Link className="button button-secondary" href={`/practice?scenario=${data.scenario.slug}`} prefetch={false}>Mở bản người học →</Link> : <p className="admin-empty">Nội dung được khóa trong lúc chờ duyệt. Trả về Bản nháp nếu cần chỉnh sửa.</p>}
      </section>}
      {!editable ? exerciseEditor : null}
      </div>
      <div className="admin-side-stack">
        <PracticeReviewAssignmentPanel
          action={assignPracticeReviewAction}
          assignees={data.assignees}
          claimAction={claimPracticeReviewAction}
          item={{ ...data.scenario, readiness: data.readiness }}
          releaseAction={releasePracticeReviewAction}
          userId={user.id}
          userRole={user.role}
        />
        <PracticeWorkflowPanel action={transitionPracticeScenarioAction} readiness={data.readiness} scenarioId={data.scenario.id} status={data.scenario.status} transitions={transitions} />
        {editable ? <section className="admin-panel danger-panel"><h2>Xóa cứng</h2><p>Chỉ xóa được ca Bản nháp chưa có lượt làm.</p><form action={deletePracticeScenarioAction} className="admin-delete-form"><input name="scenarioId" type="hidden" value={data.scenario.id} /><input name="industryId" type="hidden" value={data.scenario.industryId} /><label><input name="confirmDelete" type="checkbox" value="DELETE" /> Tôi hiểu ca và các lượt nghe sẽ bị xóa</label><button className="button button-danger" type="submit">Xóa ca luyện</button></form></section> : null}
      </div>
    </div>
    {editable ? <section className="admin-panel practice-exercise-create"><div className="panel-heading"><h2>Thêm lượt nghe</h2><span>Hoàn thiện trước khi gửi kiểm duyệt</span></div><PracticeExerciseForm action={createPracticeExerciseAction} cloudinaryConfigured={cloudinaryConfigured} nextOrder={nextOrder} scenarioId={data.scenario.id} submitLabel="Thêm lượt nghe" /></section> : null}
    {editable ? exerciseEditor : null}
    <PracticeVersionHistory
      action={restorePracticeScenarioVersionAction}
      canRestore={editable}
      scenarioId={data.scenario.id}
      versionCount={data.versionCount}
      versions={data.versions}
    />
  </div></main>;
}
