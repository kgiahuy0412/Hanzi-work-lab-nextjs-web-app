import Link from "next/link";
import { getCurrentUser } from "@/lib/auth-session";
import { listPracticeVocabulary } from "@/lib/lesson-repository";
import { getLearningSummary } from "@/lib/progress-repository";
import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  Lightbulb,
  LockKeyhole,
  MessageCircleMore,
  Play,
  Route,
  Target,
  Volume2,
  Zap,
} from "lucide-react";

const demoReviewWords = [
  ["进度", "jìndù", "tiến độ"],
  ["按时", "ànshí", "đúng hạn"],
  ["汇报", "huìbào", "báo cáo"],
  ["截止", "jiézhǐ", "hạn chót"],
  ["确认", "quèrèn", "xác nhận"],
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const displayName = user?.displayName ?? "bạn";
  const [summary, personalizedReviewWords] = user
    ? await Promise.all([getLearningSummary(user.id), listPracticeVocabulary(5, user.id)])
    : [{ completedLessons: 5, openedLessons: 5 }, []] as const;
  const reviewWords = user
    ? personalizedReviewWords.map((word) => [word.hanzi, word.pinyin, word.meaning] as const)
    : demoReviewWords;
  const completedLessons = Math.min(summary.completedLessons, 6);
  const progressPercent = Math.round(completedLessons / 6 * 100);
  return (
    <main className="learner-dashboard">
      <div className="learn-frame">
        <section className="learn-main-column">
          <div className="learn-greeting">
            <span>Chào buổi sáng, {displayName}</span>
            <h1>Hôm nay là một ngày tốt để tiến bộ.</h1>
          </div>

          <div className="learn-section-title">
            <div><span className="section-kicker">12 phút tập trung</span><h2>Bài học hôm nay</h2></div>
            <Link href="/courses">Xem lộ trình <ArrowRight size={16} /></Link>
          </div>

          <article className="today-lesson">
            <div className="today-lesson-heading">
              <div><span>Văn phòng & hành chính</span><h3>Theo dõi tiến độ công việc</h3><p>Học cách hỏi, cập nhật và nhắc về tiến độ một cách tự nhiên tại nơi làm việc.</p></div>
              <span className="lesson-order">Bài 05</span>
            </div>
            <div className="lesson-word-grid">
              <div className="lesson-character"><strong lang="zh">进度</strong><span>jìndù</span><small>tiến độ</small></div>
              <div className="lesson-context">
                <span>Ví dụ trong công việc</span>
                <strong lang="zh">请问这个项目的进度如何？</strong>
                <p>Xin hỏi tiến độ của dự án này thế nào rồi?</p>
                <button className="audio-soon" type="button" disabled title="Audio sẽ được bổ sung ở giai đoạn nội dung">
                  <Volume2 size={17} /> Nghe câu ví dụ <small>Sắp có</small>
                </button>
              </div>
            </div>
            <div className="today-lesson-meta">
              <span><Clock3 size={16} /> 12 phút</span>
              <span><BookOpen size={16} /> 6 mục học</span>
              <span><MessageCircleMore size={16} /> Hội thoại & thực hành</span>
            </div>
          </article>

          <Link className="start-lesson-button" href="/learn/van-phong-hanh-chinh"><Play size={18} fill="currentColor" /> Bắt đầu bài học <ArrowRight size={19} /></Link>

          <div className="learn-quick-actions">
            <Link href="/courses"><Route size={19} /><span>Xem lộ trình</span></Link>
            <Link href="/practice"><Zap size={19} /><span>Luyện tập nhanh</span></Link>
            <Link href="/practice"><Target size={19} /><span>Ôn tập thông minh</span></Link>
          </div>

          <article className="daily-tip">
            <span className="tip-icon"><Lightbulb size={20} /></span>
            <div><strong>Mẹo hôm nay</strong><p>Dùng <span lang="zh">进度</span> để cập nhật công việc: <span lang="zh">已完成、进行中、待处理</span> là ba cụm rất hữu ích.</p></div>
            <ArrowRight size={18} />
          </article>

          <section className="learning-trail">
            <div className="trail-heading"><h2>Lộ trình học tập</h2><Link href="/courses">Xem toàn bộ <ArrowRight size={15} /></Link></div>
            <div className="trail-steps">
              <span className="trail-step done"><i><Check size={15} /></i> Chào hỏi tại nơi làm việc</span>
              <span className="trail-line" />
              <span className="trail-step current"><i>5</i> Theo dõi tiến độ công việc</span>
              <span className="trail-line" />
              <span className="trail-step locked"><i>6</i> Xin hỗ trợ từ đồng nghiệp <LockKeyhole size={13} /></span>
            </div>
          </section>
        </section>

        <aside className="learn-aside-column">
          <section className="review-queue">
            <div className="aside-heading"><div><span className="section-kicker">Hôm nay</span><h2>Ôn {reviewWords.length} từ</h2></div><Link href="/practice">Xem tất cả</Link></div>
            <div className="review-list">
              {reviewWords.map(([hanzi, pinyin, meaning]) => (
                <div className="review-row" key={hanzi}><strong lang="zh">{hanzi}</strong><span>{pinyin}</span><small>{meaning}</small><button type="button" disabled aria-label={`Audio ${hanzi} sẽ bổ sung sau`}><Volume2 size={15} /></button></div>
              ))}
              {reviewWords.length === 0 ? <p className="review-empty">Bạn chưa có từ đến lịch ôn.</p> : null}
            </div>
            <Link className="review-button" href="/practice">Bắt đầu ôn tập ({reviewWords.length})</Link>
          </section>

          <section className="weekly-goal">
            <div className="aside-heading"><div><span className="section-kicker">Nhịp học</span><h2>Mục tiêu lộ trình</h2></div><span>{6 - completedLessons} bài còn lại</span></div>
            <div className="goal-score"><strong>{completedLessons}/6</strong><div><b>Hoàn thành {completedLessons} bài</b><span>Mục tiêu đầu tiên: 6 bài mẫu</span></div></div>
            <div className="goal-progress"><span style={{ width: `${progressPercent}%` }} /></div>
            <div className="week-dots" aria-label="Tiến độ sáu bài mẫu">
              {[1, 2, 3, 4, 5, 6].map((number) => number <= completedLessons ? <span className="done" key={number}><CheckCircle2 size={18} />B{number}</span> : <span key={number}><i />B{number}</span>)}
            </div>
          </section>

          <Link className="vip-mini-banner" href="/vip"><Crown size={21} /><div><strong>Mở toàn bộ lộ trình</strong><span>Học không giới hạn với VIP</span></div><ArrowRight size={18} /></Link>
        </aside>
      </div>

    </main>
  );
}
