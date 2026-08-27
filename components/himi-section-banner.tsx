import {
  BookOpenCheck,
  BriefcaseBusiness,
  Crown,
  Headphones,
  MessageCircleMore,
  Route,
  Sparkles,
  Target,
  Volume2,
  type LucideIcon,
} from "lucide-react";

export type HimiBannerVariant = "courses" | "practice" | "vip";

const bannerIcons: Record<HimiBannerVariant, [LucideIcon, LucideIcon, LucideIcon]> = {
  courses: [Route, BookOpenCheck, BriefcaseBusiness],
  practice: [MessageCircleMore, Volume2, Headphones],
  vip: [Crown, Sparkles, Target],
};

export function HimiSectionBanner({
  titleLines,
  titleId,
  variant,
  description,
  className = "",
}: {
  titleLines: [string, string];
  titleId: string;
  variant: HimiBannerVariant;
  description?: string;
  className?: string;
}) {
  const [FirstIcon, SecondIcon, ThirdIcon] = bannerIcons[variant];
  const isCourses = variant === "courses";

  return <header aria-labelledby={titleId} className={`himi-section-banner is-${variant} ${className}`.trim()}>
    <div className="himi-section-banner-copy">
      <h1 id={titleId}><span>{titleLines[0]}</span><span>{titleLines[1]}</span></h1>
      {description ? <p>{description}</p> : null}
    </div>
    <div aria-hidden="true" className="himi-section-banner-visual">
      {isCourses ? <span className="himi-section-banner-mascot himi-course-banner-mascot" /> : <>
        <span className="himi-banner-orbit himi-banner-orbit-one" />
        <span className="himi-banner-orbit himi-banner-orbit-two" />
        <div className="himi-banner-motif">
          <span className="himi-banner-token token-one"><FirstIcon size={23} /></span>
          <span className="himi-banner-token token-two"><SecondIcon size={23} /></span>
          <span className="himi-banner-token token-three"><ThirdIcon size={23} /></span>
        </div>
        <span className="himi-banner-spark spark-one" />
        <span className="himi-banner-spark spark-two" />
        <span className="himi-section-banner-mascot" />
      </>}
    </div>
  </header>;
}
