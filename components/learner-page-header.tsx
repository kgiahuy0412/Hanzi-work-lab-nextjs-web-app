import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function LearnerPageHeader({
  eyebrow,
  eyebrowIcon: EyebrowIcon,
  title,
  titleId,
  description,
  meta,
  aside,
  className = "",
}: {
  eyebrow: string;
  eyebrowIcon: LucideIcon;
  title: string;
  titleId?: string;
  description: string;
  meta?: ReactNode;
  aside?: ReactNode;
  className?: string;
}) {
  return (
    <header className={`learner-page-header ${aside ? "has-aside" : ""} ${className}`.trim()}>
      <div className="learner-page-header-copy">
        <span className="learner-page-header-eyebrow"><EyebrowIcon aria-hidden="true" size={15} />{eyebrow}</span>
        <h1 id={titleId}>{title}</h1>
        <p>{description}</p>
        {meta ? <div className="learner-page-header-meta">{meta}</div> : null}
      </div>
      {aside ? <div className="learner-page-header-aside">{aside}</div> : null}
    </header>
  );
}
