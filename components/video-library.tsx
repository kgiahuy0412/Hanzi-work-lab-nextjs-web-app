"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { ArrowRight, Captions, CirclePlay, Search } from "lucide-react";
import { HimiSectionBanner } from "@/components/himi-section-banner";
import type { LearningVideo } from "@/lib/video-library";

function VideoCard({ video }: { video: LearningVideo }) {
  return <article className="learning-video-card">
    <Link className="learning-video-thumbnail" href={`/videos/${video.slug}`} aria-label={`Mở video ${video.title}`}>
      <Image alt="" fill sizes="(max-width: 720px) 100vw, (max-width: 1120px) 50vw, 33vw" src={video.thumbnailUrl} unoptimized={video.source === "youtube"} />
      <span className="video-source-badge">{video.source === "himi" ? "Himi Original" : "YouTube tuyển chọn"}</span>
      <span className="video-card-play"><CirclePlay aria-hidden="true" size={25} /></span>
    </Link>
    <div className="learning-video-card-body">
      <div className="video-card-meta"><span>{video.level}</span><span>{video.category}</span>{video.sentenceCount ? <span>{video.sentenceCount} câu</span> : video.durationLabel ? <span>{video.durationLabel}</span> : null}</div>
      <h3><Link href={`/videos/${video.slug}`}>{video.title}</Link></h3>
      <p>{video.summary}</p>
      <div className="video-card-footer"><span>{video.authorName ?? (video.source === "himi" ? "Himi Chinese" : "")}</span><Link href={`/videos/${video.slug}`}>Học với video <ArrowRight aria-hidden="true" size={15} /></Link></div>
    </div>
  </article>;
}

export function VideoLibrary({ videos }: { videos: LearningVideo[] }) {
  const categories = ["Tất cả", ...Array.from(new Set(videos.map((video) => video.category)))];
  const [category, setCategory] = useState("Tất cả");
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("vi-VN");
  const filtered = useMemo(() => videos.filter((video) => {
    const matchesCategory = category === "Tất cả" || video.category === category;
    const haystack = `${video.title} ${video.originalTitle ?? ""} ${video.summary} ${video.level}`.toLocaleLowerCase("vi-VN");
    return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
  }), [videos, category, normalizedQuery]);

  return <main className="video-library-page">
    <div className="video-library-shell">
      <HimiSectionBanner
        description="Xem tình huống thật, nghe từng câu rõ hơn và luyện lại ngay trong phòng học tương tác."
        titleId="video-library-title"
        titleLines={["Nghe dễ hơn.", "Nhớ lâu hơn."]}
        variant="videos"
      />

      <section className="video-catalog" aria-labelledby="video-catalog-title">
        <h2 className="sr-only" id="video-catalog-title">Thư viện video tuyển chọn</h2>
        <div className="video-catalog-tools">
          <form role="search" onSubmit={(event) => event.preventDefault()}><Search aria-hidden="true" size={18} /><label className="sr-only" htmlFor="video-search">Tìm video</label><input id="video-search" onChange={(event) => setQuery(event.target.value)} placeholder="Tìm chủ đề hoặc trình độ…" type="search" value={query} /></form>
          <div className="video-category-filters" aria-label="Lọc theo chủ đề">{categories.map((item) => <button aria-pressed={category === item} className={category === item ? "active" : ""} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}</div>
        </div>
        <div aria-live="polite" className="video-result-count"><Captions aria-hidden="true" size={15} /><span>{filtered.length} video phù hợp</span></div>
        {filtered.length ? <div className="learning-video-grid">{filtered.map((video) => <VideoCard key={video.slug} video={video} />)}</div> : <div className="video-empty-state"><Search aria-hidden="true" size={28} /><h3>Chưa tìm thấy video phù hợp</h3><p>Thử từ khóa ngắn hơn hoặc chọn “Tất cả”.</p><button onClick={() => { setCategory("Tất cả"); setQuery(""); }} type="button">Xóa bộ lọc</button></div>}
      </section>
    </div>
  </main>;
}
