import Link from "next/link";
import { Headphones, MessagesSquare } from "lucide-react";

type ListeningMode = "levels" | "scenario";

const modes = [
  {
    description: "Nghe từ và câu theo HSK",
    href: "/listening",
    icon: Headphones,
    id: "levels" as const,
    label: "Theo cấp độ HSK",
  },
  {
    description: "Phản xạ hội thoại công việc",
    href: "/listening?mode=scenario",
    icon: MessagesSquare,
    id: "scenario" as const,
    label: "Theo tình huống",
  },
];

export function ListeningModeSwitcher({ activeMode }: { activeMode: ListeningMode }) {
  return (
    <nav aria-label="Chế độ Nghe và phản xạ" className="listening-mode-switcher">
      {modes.map(({ description, href, icon: Icon, id, label }) => {
        const active = activeMode === id;
        return (
          <Link
            aria-current={active ? "page" : undefined}
            className={active ? "is-active" : undefined}
            href={href}
            key={id}
            prefetch
          >
            <span className="listening-mode-icon"><Icon aria-hidden="true" size={21} /></span>
            <span className="listening-mode-copy">
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
