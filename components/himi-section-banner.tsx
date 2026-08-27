import type { ReactNode } from "react";
import Image from "next/image";
import "@/app/himi-section-banner.css";

export type HimiBannerVariant = "courses" | "practice" | "listening" | "videos" | "vip";

const bannerBackgrounds: Record<HimiBannerVariant, string> = {
  courses: "/assets/courses/himi-career-hero-background-2k.webp",
  practice: "/assets/backgrounds/himi-practice-hero-2k.webp",
  listening: "/assets/backgrounds/himi-listening-hero-2k.webp",
  videos: "/assets/backgrounds/himi-video-hero-2k.webp",
  vip: "/assets/backgrounds/himi-vip-hero-2k.webp",
};

export function HimiSectionBanner({
  titleLines,
  titleId,
  variant,
  description,
  actions,
  className = "",
}: {
  titleLines: [string, string];
  titleId: string;
  variant: HimiBannerVariant;
  description?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return <header aria-labelledby={titleId} className={`himi-section-banner is-immersive is-${variant} ${className}`.trim()}>
    <Image
      alt=""
      aria-hidden="true"
      className="himi-section-banner-background"
      fill
      priority
      sizes="(max-width: 720px) 100vw, calc(100vw - 88px)"
      src={bannerBackgrounds[variant]}
      unoptimized
    />
    <div className="himi-section-banner-copy">
      <h1 id={titleId}><span>{titleLines[0]}</span><span>{titleLines[1]}</span></h1>
      {description ? <p>{description}</p> : null}
      {actions ? <div className="himi-section-banner-actions">{actions}</div> : null}
    </div>
    <div aria-hidden="true" className="himi-section-banner-visual">
      <span className={`himi-section-banner-mascot himi-immersive-banner-mascot himi-${variant}-banner-mascot`} />
    </div>
  </header>;
}
