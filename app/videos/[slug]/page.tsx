import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Lightbulb } from "lucide-react";
import { VideoLearningPlayer } from "@/components/video-learning-player";
import { findVideoBySlug, learningVideos } from "@/lib/video-library";
import { curatedYoutubeVideoTranscripts } from "@/lib/youtube-video-transcripts.curated";
import { youtubeVideoTranscripts } from "@/lib/youtube-video-transcripts.generated";

export function generateStaticParams() {
  return learningVideos.map((video) => ({ slug: video.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const video = findVideoBySlug(slug);
  if (!video) return {};
  return { title: video.title, description: video.summary };
}

export default async function VideoDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const video = findVideoBySlug(slug);
  if (!video) notFound();
  const transcript = video.youtubeId
    ? curatedYoutubeVideoTranscripts[video.youtubeId] ?? youtubeVideoTranscripts[video.youtubeId]
    : video.transcript;
  const playableVideo = transcript ? { ...video, transcript } : video;
  const related = learningVideos.filter((item) => item.slug !== video.slug).slice(0, 3);
  const sourceUrl = video.youtubeId ? `https://www.youtube.com/watch?v=${video.youtubeId}` : null;
  const hasInteractiveTranscript = Boolean(transcript?.length);

  const aboutCard = <section className="video-about-card"><span className="section-kicker">Về video này</span><h2>Học có mục tiêu, không chỉ xem</h2><p>{video.description}</p>{video.source === "youtube" ? <div className="video-rights-note"><ExternalLink aria-hidden="true" size={17} /><div><strong>Nội dung từ kênh gốc</strong><p>Himi dùng trình phát YouTube chính thức và lớp công cụ học tập riêng. Video và quyền nội dung thuộc về tác giả.</p>{sourceUrl ? <a href={sourceUrl} rel="noreferrer" target="_blank">Mở video gốc trên YouTube <ArrowRight aria-hidden="true" size={14} /></a> : null}</div></div> : null}</section>;

  const studySidebar = <aside className="video-study-sidebar" aria-label="Hướng dẫn học video">
    <section><span className="video-sidebar-icon"><CheckCircle2 aria-hidden="true" size={20} /></span><h2>Sau video, bạn sẽ</h2><ul>{video.learningGoals.map((goal) => <li key={goal}>{goal}</li>)}</ul></section>
    <section><span className="video-sidebar-icon is-warm"><Lightbulb aria-hidden="true" size={20} /></span><h2>Cách học gợi ý</h2><ol>{video.practicePrompts.map((prompt, index) => <li key={prompt}><span>{index + 1}</span>{prompt}</li>)}</ol></section>
    {video.lessonBinding ? <section className="video-lesson-link"><span className="section-kicker">Học chuyên sâu</span><h2>Video đã có trong lộ trình</h2><p>Học thêm từ vựng, hội thoại và bài kiểm tra cùng tình huống.</p><Link href={`/learn/${video.lessonBinding.courseSlug}?lesson=${video.lessonBinding.lessonSlug}`}>Mở bài học <ArrowRight aria-hidden="true" size={15} /></Link></section> : null}
  </aside>;

  return <main className={`video-detail-page${hasInteractiveTranscript ? " is-study-studio" : ""}`}>
    <div className="video-detail-shell">
      <header className={`video-detail-header${hasInteractiveTranscript ? " is-compact" : ""}`}>
        <div className="video-detail-heading">
          <Link aria-label="Trở về thư viện video" className="video-detail-back" href="/videos"><ArrowLeft aria-hidden="true" size={20} /></Link>
          <div className="video-detail-heading-copy"><h1>{video.title}</h1>{video.originalTitle ? <p>{video.originalTitle}</p> : <p>{video.summary}</p>}</div>
        </div>
        <div className="video-detail-meta"><span>{video.level}</span><span>{video.category}</span><span>{video.contentType}</span>{video.sentenceCount ? <span>{video.sentenceCount} câu</span> : video.durationLabel ? <span>{video.durationLabel}</span> : null}</div>
      </header>

      {hasInteractiveTranscript
        ? <VideoLearningPlayer video={playableVideo} />
        : <div className="video-detail-layout"><div className="video-detail-main"><VideoLearningPlayer video={playableVideo} />{aboutCard}</div>{studySidebar}</div>}

      <section className="related-video-section" aria-labelledby="related-video-title"><div><span className="section-kicker">Học tiếp</span><h2 id="related-video-title">Video khác dành cho bạn</h2></div><div className="related-video-list">{related.map((item) => <Link href={`/videos/${item.slug}`} key={item.slug}><Image alt="" height={105} src={item.thumbnailUrl} unoptimized width={168} /><span><small>{item.level} · {item.category}</small><strong>{item.title}</strong></span><ArrowRight aria-hidden="true" size={17} /></Link>)}</div></section>
    </div>
  </main>;
}
