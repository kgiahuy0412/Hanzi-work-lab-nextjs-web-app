"use client";

import { useEffect, useRef, useState, type FocusEvent, type KeyboardEvent, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AudioLines,
  BarChart3,
  Bell,
  BookOpenText,
  BookOpen,
  BrainCircuit,
  ChevronDown,
  Clapperboard,
  Crown,
  Flame,
  Gamepad2,
  Headphones,
  Home,
  LibraryBig,
  Newspaper,
  PanelLeftClose,
  PanelLeftOpen,
  PenLine,
  Puzzle,
  Repeat2,
  Settings,
  Trophy,
  UsersRound,
  Wrench,
} from "lucide-react";
import { BrandLogoImage, BrandMark, BrandWordmark } from "@/components/brand-logo";
import "@/app/learner-navigation.css";

type LearnerShellUser = {
  displayName: string;
  role: "learner" | "editor" | "reviewer" | "admin";
  unreadNotificationCount: number;
} | null;

const learnerRailItems = [
  { href: "/", label: "Học tập", icon: Home, matches: (pathname: string) => pathname === "/" },
  { href: "/courses", label: "Lộ trình", icon: BookOpen, matches: (pathname: string) => pathname.startsWith("/courses") || pathname.startsWith("/learn") },
  { href: "/vip", label: "VIP", icon: BarChart3, matches: (pathname: string) => pathname.startsWith("/vip") },
];

const learnerPracticeItems = [
  { href: "/writing", label: "Luyện viết", icon: PenLine, matches: (pathname: string) => pathname.startsWith("/writing") },
  { href: "/videos", label: "Video", icon: Clapperboard, matches: (pathname: string) => pathname.startsWith("/videos") },
  { href: "/listening", label: "Luyện nghe", icon: AudioLines, matches: (pathname: string) => pathname.startsWith("/listening") },
];

const learnerCommunityItems = [
  { href: "/practice", label: "Luyện tập tổng hợp", icon: Repeat2, matches: (pathname: string) => pathname.startsWith("/practice") },
  { href: "/games", label: "Trò chơi", icon: Gamepad2, matches: (pathname: string) => pathname.startsWith("/games") },
  { href: "/stories", label: "Truyện song ngữ", icon: BookOpenText, matches: (pathname: string) => pathname.startsWith("/stories") },
  { href: "/materials", label: "Tài liệu học tập", icon: LibraryBig, matches: (pathname: string) => pathname.startsWith("/materials") },
  { href: "/tools", label: "Công cụ", icon: Wrench, matches: (pathname: string) => pathname.startsWith("/tools") },
  { href: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy, matches: (pathname: string) => pathname.startsWith("/leaderboard") },
  { href: "/friends", label: "Bạn bè", icon: UsersRound, matches: (pathname: string) => pathname.startsWith("/friends") },
  { href: "/blog", label: "Bài viết", icon: Newspaper, matches: (pathname: string) => pathname.startsWith("/blog") },
];

const standalonePrefixes = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/terms",
  "/privacy",
  "/_not-found",
];

function initials(value: string): string {
  return value
    .split(/\s+/u)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase("vi-VN") || "HW";
}

function isStandaloneRoute(pathname: string): boolean {
  return standalonePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPlainNavigation(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

export function LearnerAppShell({ children, user }: { children: ReactNode; user: LearnerShellUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [routeProgressCompleting, setRouteProgressCompleting] = useState(false);
  const [railExpanded, setRailExpanded] = useState(false);
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);
  const [communityMenuOpen, setCommunityMenuOpen] = useState(false);
  const practiceTriggerRef = useRef<HTMLButtonElement>(null);
  const practiceAutoExpandedRef = useRef(false);
  const routeProgressStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!pendingHref || pendingHref === pathname) return;
    const handle = window.setTimeout(() => {
      setPendingHref(null);
      setRouteProgressCompleting(false);
      routeProgressStartedAtRef.current = null;
    }, 5000);
    return () => window.clearTimeout(handle);
  }, [pathname, pendingHref]);

  useEffect(() => {
    if (!pendingHref || pendingHref !== pathname) return;

    const elapsed = performance.now() - (routeProgressStartedAtRef.current ?? performance.now());
    const completeDelay = Math.max(0, 760 - elapsed);
    let hideHandle: number | undefined;
    const completeHandle = window.setTimeout(() => {
      setRouteProgressCompleting(true);
      hideHandle = window.setTimeout(() => {
        setPendingHref(null);
        setRouteProgressCompleting(false);
        routeProgressStartedAtRef.current = null;
      }, 420);
    }, completeDelay);

    return () => {
      window.clearTimeout(completeHandle);
      if (hideHandle) window.clearTimeout(hideHandle);
    };
  }, [pathname, pendingHref]);

  const prepareRoute = (href: string) => router.prefetch(href);
  const beginRoute = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isPlainNavigation(event) || pathname === href) return;
    routeProgressStartedAtRef.current = event.timeStamp;
    setRouteProgressCompleting(false);
    setPendingHref(href);
  };
  const restoreAutoCollapsedRail = () => {
    if (!practiceAutoExpandedRef.current) return;
    practiceAutoExpandedRef.current = false;
    setRailExpanded(false);
  };
  const toggleRail = () => {
    practiceAutoExpandedRef.current = false;
    setPracticeMenuOpen(false);
    setCommunityMenuOpen(false);
    setRailExpanded(!railExpanded);
  };
  const togglePracticeMenu = () => {
    setCommunityMenuOpen(false);
    if (!railExpanded) {
      practiceAutoExpandedRef.current = true;
      setRailExpanded(true);
      setPracticeMenuOpen(true);
      return;
    }

    if (practiceAutoExpandedRef.current && practiceMenuOpen) {
      setPracticeMenuOpen(false);
      restoreAutoCollapsedRail();
      return;
    }

    setPracticeMenuOpen((current) => !current);
  };
  const selectPracticeRoute = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isPlainNavigation(event)) {
      setPracticeMenuOpen(false);
      restoreAutoCollapsedRail();
    }
    beginRoute(event, href);
  };
  const selectCommunityRoute = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    setCommunityMenuOpen(false);
    beginRoute(event, href);
  };
  const closePracticeMenuOnBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setPracticeMenuOpen(false);
      restoreAutoCollapsedRail();
    }
  };
  const closePracticeMenuOnEscape = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Escape") return;
    setPracticeMenuOpen(false);
    practiceTriggerRef.current?.focus();
    restoreAutoCollapsedRail();
  };

  if (isStandaloneRoute(pathname)) {
    return <div className="standalone-route-shell">{children}</div>;
  }

  const accountItem = user?.role === "admin"
    ? { href: "/admin", label: "Quản trị" }
    : { href: user ? "/account" : "/login", label: user ? "Tài khoản" : "Đăng nhập" };
  const profileHref = user ? "/account" : "/login";
  const notificationsHref = user ? "/notifications" : "/login?returnTo=%2Fnotifications";
  const displayName = user?.displayName ?? "Đăng nhập";
  const navigating = Boolean(pendingHref && pendingHref !== pathname);
  const routeArrived = Boolean(pendingHref && pendingHref === pathname);
  const routeProgressActive = navigating || (routeArrived && !routeProgressCompleting);
  const visualPathname = navigating && pendingHref ? pendingHref : pathname;
  const practiceSectionActive = learnerPracticeItems.some(({ matches }) => matches(visualPathname));
  const communitySectionActive = learnerCommunityItems.some(({ matches }) => matches(visualPathname));
  const renderRailItem = ({ href, label, icon: Icon, matches }: (typeof learnerRailItems)[number]) => {
    const active = matches(visualPathname);
    const pending = pendingHref === href;
    return (
      <Link
        aria-current={active ? "page" : undefined}
        className={`${active ? "active" : ""} ${pending ? "pending" : ""}`.trim()}
        href={href}
        key={href}
        onClick={(event) => beginRoute(event, href)}
        onFocus={() => prepareRoute(href)}
        onPointerEnter={() => prepareRoute(href)}
        prefetch={false}
        title={!railExpanded ? label : undefined}
      >
        <Icon aria-hidden="true" size={21} /><span>{label}</span>
      </Link>
    );
  };
  return (
    <div aria-busy={navigating} className={`learner-app-shell ${pathname === "/" ? "is-home-route" : ""} ${railExpanded ? "is-rail-expanded" : "is-rail-collapsed"}`.trim()}>
      <a className="skip-link" href="#learner-main-content">Bỏ qua điều hướng</a>
      <aside className="learn-rail" aria-label="Điều hướng học tập">
        <button
          aria-expanded={railExpanded}
          aria-label={railExpanded ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
          className="rail-toggle"
          onClick={toggleRail}
          title={railExpanded ? "Thu gọn" : "Mở rộng"}
          type="button"
        >
          {railExpanded ? <PanelLeftClose aria-hidden="true" size={20} /> : <PanelLeftOpen aria-hidden="true" size={20} />}
        </button>
        <Link className="rail-brand" href="/" aria-label="Himi Chinese - Trang chủ" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch={false}>
          <span className="rail-logo"><BrandLogoImage priority size={60} /></span>
          <BrandWordmark />
        </Link>
        <nav className="rail-nav">
          {learnerRailItems.slice(0, 2).map(renderRailItem)}
          <div
            className={`rail-practice-group ${practiceMenuOpen ? "is-open" : ""} ${practiceSectionActive ? "is-active" : ""}`.trim()}
            onBlur={closePracticeMenuOnBlur}
            onKeyDown={closePracticeMenuOnEscape}
          >
            <button
              aria-controls="rail-practice-menu"
              aria-expanded={practiceMenuOpen}
              className={`rail-practice-trigger ${practiceSectionActive ? "active" : ""}`.trim()}
              onClick={togglePracticeMenu}
              ref={practiceTriggerRef}
              title={!railExpanded ? "Luyện tập" : undefined}
              type="button"
            >
              <BrainCircuit aria-hidden="true" size={21} />
              <span>Luyện tập</span>
              <ChevronDown aria-hidden="true" className="rail-practice-chevron" size={16} />
            </button>
            <div className="rail-practice-menu" id="rail-practice-menu">
              <div className="rail-practice-menu-inner">
                {learnerPracticeItems.map(({ href, label, icon: Icon, matches }) => {
                  const active = matches(visualPathname);
                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`${active ? "active" : ""} ${pendingHref === href ? "pending" : ""}`.trim()}
                      href={href}
                      key={href}
                      onClick={(event) => selectPracticeRoute(event, href)}
                      onFocus={() => prepareRoute(href)}
                      onPointerEnter={() => prepareRoute(href)}
                      prefetch={false}
                    >
                      <Icon aria-hidden="true" size={18} /><span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          <div className={`rail-community-group ${communitySectionActive ? "is-active" : ""}`.trim()}>
            <button
              aria-controls="rail-community-menu"
              aria-expanded={railExpanded}
              className={`rail-community-trigger ${communitySectionActive ? "active" : ""}`.trim()}
              onClick={() => {
                practiceAutoExpandedRef.current = false;
                setPracticeMenuOpen(false);
                if (!railExpanded) setRailExpanded(true);
              }}
              title={!railExpanded ? "Tổng hợp" : undefined}
              type="button"
            >
              <Puzzle aria-hidden="true" size={21} />
              <span>Tổng hợp</span>
            </button>
            <div aria-label="Ôn luyện và cộng đồng" className="rail-community-menu" id="rail-community-menu">
              <p>Ôn luyện &amp; cộng đồng</p>
              <div className="rail-community-menu-inner">
                {learnerCommunityItems.map(({ href, label, icon: Icon, matches }) => {
                  const active = matches(visualPathname);
                  return (
                    <Link
                      aria-current={active ? "page" : undefined}
                      className={`${active ? "active" : ""} ${pendingHref === href ? "pending" : ""}`.trim()}
                      href={href}
                      key={href}
                      onClick={(event) => beginRoute(event, href)}
                      onFocus={() => prepareRoute(href)}
                      onPointerEnter={() => prepareRoute(href)}
                      prefetch={false}
                    >
                      <Icon aria-hidden="true" size={18} /><span>{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          {learnerRailItems.slice(2).map(renderRailItem)}
          <Link
            aria-current={visualPathname.startsWith(accountItem.href) ? "page" : undefined}
            className={visualPathname.startsWith(accountItem.href) ? "active" : ""}
            href={accountItem.href}
            onClick={(event) => beginRoute(event, accountItem.href)}
            onFocus={() => prepareRoute(accountItem.href)}
            onPointerEnter={() => prepareRoute(accountItem.href)}
            prefetch={false}
            title={!railExpanded ? accountItem.label : undefined}
          >
            <Settings aria-hidden="true" size={21} /><span>{accountItem.label}</span>
          </Link>
        </nav>
        <a className="rail-support" href="mailto:giahuy041204@gmail.com" title={!railExpanded ? "Hỗ trợ" : undefined}><Headphones aria-hidden="true" size={20} /><span>Hỗ trợ</span></a>
      </aside>

      <header className="learn-topbar">
        <Link aria-label="Himi Chinese - Trang chủ" className="brand" href="/" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch={false}><BrandMark priority /><BrandWordmark /></Link>
        <div className="topbar-actions">
          <span className="streak-chip"><Flame aria-hidden="true" size={17} /> {user ? "Tiếp tục nhịp học hôm nay" : "Đăng nhập để lưu nhịp học"}</span>
          <Link
            aria-label={user?.unreadNotificationCount ? `${user.unreadNotificationCount} thông báo chưa đọc` : "Thông báo"}
            className={`topbar-icon ${user?.unreadNotificationCount ? "has-notifications" : ""}`.trim()}
            href={notificationsHref}
            onClick={(event) => beginRoute(event, notificationsHref)}
            onPointerEnter={() => prepareRoute(notificationsHref)}
            prefetch={false}
            title="Thông báo"
          >
            <Bell aria-hidden="true" size={19} />
            {user?.unreadNotificationCount ? <span aria-hidden="true" className="topbar-notification-count">{Math.min(user.unreadNotificationCount, 99)}</span> : null}
          </Link>
          <Link aria-label={user ? `Mở tài khoản của ${displayName}` : "Đăng nhập"} className="user-chip" href={profileHref} onClick={(event) => beginRoute(event, profileHref)} onPointerEnter={() => prepareRoute(profileHref)} prefetch={false}>
            <span aria-hidden="true">{initials(displayName)}</span>
            <strong>{displayName}</strong>
          </Link>
        </div>
      </header>

      <div
        aria-hidden="true"
        className={`route-transition-progress ${routeProgressActive ? "active" : ""} ${routeProgressCompleting ? "complete" : ""}`.trim()}
      >
        <span />
      </div>
      <span aria-live="polite" className="sr-only" role="status">{navigating ? "Đang mở nội dung…" : ""}</span>

      <div className="learner-shell-content" id="learner-main-content" tabIndex={-1}>{children}</div>

      <nav className="learner-mobile-nav" aria-label="Điều hướng học tập trên điện thoại">
        <Link aria-current={visualPathname === "/" ? "page" : undefined} className={visualPathname === "/" ? "active" : ""} href="/" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch={false}><Home aria-hidden="true" size={20} /><span>Hôm nay</span></Link>
        <Link aria-current={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") ? "page" : undefined} className={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") ? "active" : ""} href="/courses" onClick={(event) => beginRoute(event, "/courses")} onPointerEnter={() => prepareRoute("/courses")} prefetch={false}><BookOpen aria-hidden="true" size={20} /><span>Lộ trình</span></Link>
        <div className={`mobile-practice-group ${practiceMenuOpen ? "is-open" : ""}`.trim()}>
          <button
            aria-controls="mobile-practice-menu"
            aria-expanded={practiceMenuOpen}
            aria-label="Mở các nội dung luyện tập"
            className={`mobile-practice-trigger ${practiceSectionActive ? "active" : ""}`.trim()}
            onClick={() => {
              setCommunityMenuOpen(false);
              setPracticeMenuOpen((current) => !current);
            }}
            type="button"
          >
            <BrainCircuit aria-hidden="true" size={20} /><span>Luyện tập</span>
          </button>
          <div aria-label="Nội dung luyện tập" className="mobile-practice-menu" id="mobile-practice-menu">
            {learnerPracticeItems.map(({ href, label, icon: Icon, matches }) => (
              <Link
                aria-current={matches(visualPathname) ? "page" : undefined}
                className={matches(visualPathname) ? "active" : ""}
                href={href}
                key={href}
                onClick={(event) => {
                  setPracticeMenuOpen(false);
                  beginRoute(event, href);
                }}
                onPointerEnter={() => prepareRoute(href)}
                prefetch={false}
              >
                <Icon aria-hidden="true" size={20} /><span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
        <div className={`mobile-community-group ${communityMenuOpen ? "is-open" : ""}`.trim()}>
          <button
            aria-controls="mobile-community-menu"
            aria-expanded={communityMenuOpen}
            aria-label="Mở nội dung tổng hợp"
            className={`mobile-community-trigger ${communitySectionActive ? "active" : ""}`.trim()}
            onClick={() => {
              setPracticeMenuOpen(false);
              setCommunityMenuOpen((current) => !current);
            }}
            type="button"
          >
            <Puzzle aria-hidden="true" size={20} /><span>Tổng hợp</span>
          </button>
          <div aria-label="Ôn luyện và cộng đồng" className="mobile-community-menu" id="mobile-community-menu">
            {learnerCommunityItems.map(({ href, label, icon: Icon, matches }) => (
              <Link
                aria-current={matches(visualPathname) ? "page" : undefined}
                className={matches(visualPathname) ? "active" : ""}
                href={href}
                key={href}
                onClick={(event) => selectCommunityRoute(event, href)}
                onPointerEnter={() => prepareRoute(href)}
                prefetch={false}
              >
                <Icon aria-hidden="true" size={19} /><span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
        <Link aria-current={visualPathname.startsWith("/vip") ? "page" : undefined} className={visualPathname.startsWith("/vip") ? "active" : ""} href="/vip" onClick={(event) => beginRoute(event, "/vip")} onPointerEnter={() => prepareRoute("/vip")} prefetch={false}><Crown aria-hidden="true" size={20} /><span>VIP</span></Link>
      </nav>
    </div>
  );
}
