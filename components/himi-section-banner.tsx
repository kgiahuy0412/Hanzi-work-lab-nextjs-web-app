import type { ReactNode } from "react";

export type HimiBannerVariant = "courses" | "practice" | "listening" | "videos" | "writing" | "vip";

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
