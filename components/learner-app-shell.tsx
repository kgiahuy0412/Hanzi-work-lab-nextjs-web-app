"use client";

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  AudioLines,
  Bell,
  BookOpen,
  BrainCircuit,
  ChevronLeft,
  ChevronDown,
  Clapperboard,
  Crown,
  Flame,
  Gamepad2,
  Handshake,
  Home,
  LayoutGrid,
  LogOut,
  PenLine,
  Settings,
  Smartphone,
  Sparkles,
  UserRound,
} from "lucide-react";
import { BrandLogoImage, BrandMark, BrandWordmark } from "@/components/brand-logo";
import { getInternalNavigationHref } from "@/lib/navigation-progress";

type LearnerShellUser = {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  role: "learner" | "editor" | "reviewer" | "admin";
  unreadNotificationCount: number;
} | null;

const learnerRailItems = [
  { href: "/", label: "Học tập", icon: Home, matches: (pathname: string) => pathname === "/" },
  { href: "/courses", label: "Lộ trình", icon: BookOpen, matches: (pathname: string) => pathname.startsWith("/courses") || pathname.startsWith("/learn") || pathname.startsWith("/hsk") },
  { href: "/games", label: "Trò chơi", icon: Gamepad2, matches: (pathname: string) => pathname.startsWith("/games") },
];

const learnerPracticeItems = [
  { href: "/writing", label: "Luyện viết", icon: PenLine, matches: (pathname: string) => pathname.startsWith("/writing") },
  { href: "/videos", label: "Video", icon: Clapperboard, matches: (pathname: string) => pathname.startsWith("/videos") },
  { href: "/listening", label: "Nghe & phản xạ", icon: AudioLines, matches: (pathname: string) => pathname.startsWith("/listening") || pathname.startsWith("/practice") },
];

const learnerPrefetchItems = [...learnerRailItems, ...learnerPracticeItems];
const RAIL_STORAGE_KEY = "himi-learner-rail";

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

function UserChipAvatar({ avatarUrl, displayName }: { avatarUrl: string | null; displayName: string }) {
  return <span aria-hidden="true" className={`user-chip-avatar ${avatarUrl ? "has-image" : ""}`.trim()}>
    {avatarUrl
      ? <Image alt="" className="user-chip-avatar-image" fill sizes="42px" src={avatarUrl} unoptimized />
      : initials(displayName)}
  </span>;
}

function isStandaloneRoute(pathname: string): boolean {
  return standalonePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPlainNavigation(event: MouseEvent<HTMLElement>): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

export function LearnerAppShell({ children, user }: { children: ReactNode; user: LearnerShellUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [routeProgressCompleting, setRouteProgressCompleting] = useState(false);
  const [railExpanded, setRailExpanded] = useState(true);
  const [practiceMenuOpen, setPracticeMenuOpen] = useState(false);
  const [practiceTriggerSelected, setPracticeTriggerSelected] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [topbarAvatarUrl, setTopbarAvatarUrl] = useState(user?.avatarUrl ?? null);
  const practiceAutoExpandedRef = useRef(false);
  const routeProgressStartedAtRef = useRef<number | null>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const accountMenuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let handle: number | undefined;
    try {
      const storedPreference = window.localStorage.getItem(RAIL_STORAGE_KEY);
      if (storedPreference) {
        handle = window.setTimeout(() => setRailExpanded(storedPreference === "expanded"), 0);
      }
    } catch {
      // The expanded default remains usable when storage is unavailable.
    }
    return () => {
      if (handle) window.clearTimeout(handle);
    };
  }, []);

  useEffect(() => {
    const updateTopbarAvatar = (event: Event) => {
      const avatarUrl = (event as CustomEvent<{ avatarUrl?: unknown }>).detail?.avatarUrl;
      if (typeof avatarUrl === "string" && avatarUrl) setTopbarAvatarUrl(avatarUrl);
    };

    window.addEventListener("himi:avatar-updated", updateTopbarAvatar);
    return () => window.removeEventListener("himi:avatar-updated", updateTopbarAvatar);
  }, []);

  useEffect(() => {
    if (isStandaloneRoute(pathname)) return;
    const warmPrimaryRoutes = () => {
      for (const { href } of learnerPrefetchItems) router.prefetch(href);
    };
    const browserWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      const handle = browserWindow.requestIdleCallback(warmPrimaryRoutes, { timeout: 1800 });
      return () => browserWindow.cancelIdleCallback?.(handle);
    }

    const handle = window.setTimeout(warmPrimaryRoutes, 500);
    return () => window.clearTimeout(handle);
  }, [pathname, router]);

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

  useEffect(() => {
    if (!accountMenuOpen) return;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setAccountMenuOpen(false);
      accountMenuButtonRef.current?.focus();
    };

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsidePointer);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  const prepareRoute = (href: string) => router.prefetch(href);
  const beginRoute = (event: MouseEvent<HTMLElement>, href: string) => {
    if (!isPlainNavigation(event)) return;
    setPracticeTriggerSelected(false);
    if (pathname === href) return;
    routeProgressStartedAtRef.current = event.timeStamp;
    setRouteProgressCompleting(false);
    setPendingHref(href);
  };
  const captureContentNavigation = (event: MouseEvent<HTMLDivElement>) => {
    const href = getInternalNavigationHref(event);
    if (href) beginRoute(event, href);
  };
  const restoreAutoCollapsedRail = () => {
    if (!practiceAutoExpandedRef.current) return;
    practiceAutoExpandedRef.current = false;
    setRailExpanded(false);
  };
  const toggleRail = () => {
    practiceAutoExpandedRef.current = false;
    setRailExpanded((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(RAIL_STORAGE_KEY, next ? "expanded" : "collapsed");
      } catch {
        // The toggle still works for the current session without storage.
      }
      return next;
    });
  };
  const togglePracticeMenu = () => {
    if (!railExpanded) {
      practiceAutoExpandedRef.current = true;
      setRailExpanded(true);
      setPracticeMenuOpen(true);
      setPracticeTriggerSelected(true);
      return;
    }

    if (practiceMenuOpen) {
      setPracticeMenuOpen(false);
      setPracticeTriggerSelected(false);
      restoreAutoCollapsedRail();
      return;
    }

    setPracticeMenuOpen(true);
    setPracticeTriggerSelected(true);
  };
  const toggleMobilePracticeMenu = () => {
    const next = !practiceMenuOpen;
    setPracticeMenuOpen(next);
    setPracticeTriggerSelected(next);
  };
  const toggleAccountMenu = () => {
    setPracticeMenuOpen(false);
    setPracticeTriggerSelected(false);
    setAccountMenuOpen((current) => !current);
  };
  const closeAccountMenuAndNavigate = (event: MouseEvent<HTMLElement>, href: string) => {
    setAccountMenuOpen(false);
    beginRoute(event, href);
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
  const practiceTriggerActive = practiceSectionActive || practiceTriggerSelected;
  const renderRailItem = ({ href, label, icon: Icon, matches }: (typeof learnerRailItems)[number]) => {
    const active = !practiceTriggerSelected && matches(visualPathname);
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
        prefetch
        title={!railExpanded ? label : undefined}
      >
        <Icon aria-hidden="true" size={21} /><span>{label}</span>
      </Link>
    );
  };
  return (
    <div aria-busy={navigating} className={`learner-app-shell ${pathname === "/" ? "is-home-route" : ""} ${railExpanded ? "is-rail-expanded" : "is-rail-collapsed"}`.trim()} onClickCapture={captureContentNavigation}>
      <a className="skip-link" href="#learner-main-content">Bỏ qua điều hướng</a>
      <aside className="learn-rail" id="learner-navigation-rail" aria-label="Điều hướng học tập">
        <button
          aria-controls="learner-navigation-rail"
          aria-expanded={railExpanded}
          aria-label={railExpanded ? "Thu gọn thanh điều hướng" : "Mở rộng thanh điều hướng"}
          className="rail-toggle"
          onClick={toggleRail}
          title={railExpanded ? "Thu gọn" : "Mở rộng"}
          type="button"
        >
          <ChevronLeft aria-hidden="true" className="rail-toggle-icon" size={18} strokeWidth={3} />
        </button>
        <Link className="rail-brand" href="/" aria-label="Himi Chinese - Trang chủ" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch>
          <span className="rail-logo"><BrandLogoImage priority size={60} /></span>
          <BrandWordmark />
        </Link>
        <nav className="rail-nav">
          {learnerRailItems.slice(0, 2).map(renderRailItem)}
          <div
            className={`rail-practice-group ${practiceMenuOpen ? "is-open" : ""} ${practiceSectionActive ? "is-active" : ""}`.trim()}
          >
            <button
              aria-controls="rail-practice-menu"
              aria-expanded={practiceMenuOpen}
              className={`rail-practice-trigger ${practiceTriggerActive ? "active" : ""}`.trim()}
              onClick={togglePracticeMenu}
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
                      onClick={(event) => beginRoute(event, href)}
                      onFocus={() => prepareRoute(href)}
                      onPointerEnter={() => prepareRoute(href)}
                      prefetch
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
            prefetch
            title={!railExpanded ? accountItem.label : undefined}
          >
            <Settings aria-hidden="true" size={21} /><span>{accountItem.label}</span>
          </Link>
        </nav>
        <Link
          aria-label="Nâng cấp Pro - Mở trang VIP"
          className="rail-pro-card"
          href="/vip"
          onClick={(event) => beginRoute(event, "/vip")}
          onFocus={() => prepareRoute("/vip")}
          onPointerEnter={() => prepareRoute("/vip")}
          prefetch
        >
          <span className="rail-pro-crown"><Crown aria-hidden="true" size={25} strokeWidth={2.3} /></span>
          <span className="rail-pro-title">Nâng cấp <strong>Pro</strong></span>
          <span className="rail-pro-copy">Mở khóa toàn bộ bài học và luyện thi không giới hạn.</span>
          <span className="rail-pro-action">
            <Sparkles aria-hidden="true" size={14} />
            <span>Nâng cấp ngay</span>
            <span className="rail-pro-arrow"><ArrowRight aria-hidden="true" size={15} strokeWidth={2.5} /></span>
          </span>
        </Link>
      </aside>

      <header className="learn-topbar">
        <Link aria-label="Himi Chinese - Trang chủ" className="brand" href="/" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch><BrandMark priority /><BrandWordmark /></Link>
        <div className="topbar-actions">
          <span className="streak-chip"><Flame aria-hidden="true" size={17} /> {user ? "Tiếp tục nhịp học hôm nay" : "Đăng nhập để lưu nhịp học"}</span>
          <Link
            aria-label={user?.unreadNotificationCount ? `${user.unreadNotificationCount} thông báo chưa đọc` : "Thông báo"}
            className={`topbar-icon ${user?.unreadNotificationCount ? "has-notifications" : ""}`.trim()}
            href={notificationsHref}
            onClick={(event) => beginRoute(event, notificationsHref)}
            onPointerEnter={() => prepareRoute(notificationsHref)}
            prefetch
            title="Thông báo"
          >
            <Bell aria-hidden="true" size={19} />
            {user?.unreadNotificationCount ? <span aria-hidden="true" className="topbar-notification-count">{Math.min(user.unreadNotificationCount, 99)}</span> : null}
          </Link>
          {user ? <div className="account-menu-anchor" ref={accountMenuRef}>
            <button
              aria-controls="learner-account-menu"
              aria-expanded={accountMenuOpen}
              aria-haspopup="dialog"
              aria-label={`Mở tài khoản của ${displayName}`}
              className={`user-chip ${accountMenuOpen ? "is-open" : ""}`.trim()}
              onClick={toggleAccountMenu}
              ref={accountMenuButtonRef}
              type="button"
            >
              <UserChipAvatar avatarUrl={topbarAvatarUrl} displayName={displayName} />
              <strong>{displayName}</strong>
            </button>

            <div
              aria-hidden={!accountMenuOpen}
              aria-label="Menu tài khoản"
              className={`account-menu-popover ${accountMenuOpen ? "is-open" : ""}`.trim()}
              id="learner-account-menu"
              inert={!accountMenuOpen}
              role="dialog"
            >
              <div className="account-menu-identity">
                <strong>{displayName}</strong>
                <span>{user.email}</span>
              </div>
              <nav aria-label="Lối tắt tài khoản" className="account-menu-links">
                <Link href="/" onClick={(event) => closeAccountMenuAndNavigate(event, "/")} prefetch>
                  <LayoutGrid aria-hidden="true" size={20} /><span>Bảng học tập</span>
                </Link>
                <Link href="/account" onClick={(event) => closeAccountMenuAndNavigate(event, "/account")} prefetch>
                  <UserRound aria-hidden="true" size={20} /><span>Hồ sơ</span>
                </Link>
                <button onClick={() => setAccountMenuOpen(false)} type="button">
                  <Handshake aria-hidden="true" size={20} /><span>Giới thiệu bạn bè</span>
                </button>
                <Link href="/account#account-information" onClick={(event) => closeAccountMenuAndNavigate(event, "/account")} prefetch>
                  <Settings aria-hidden="true" size={20} /><span>Cài đặt</span>
                </Link>
                <button onClick={() => setAccountMenuOpen(false)} type="button">
                  <Smartphone aria-hidden="true" size={20} /><span>Tải ứng dụng</span>
                </button>
              </nav>
              <form action="/api/auth/logout" className="account-menu-logout" method="post">
                <input name="returnTo" type="hidden" value="/" />
                <button type="submit"><LogOut aria-hidden="true" size={20} /><span>Đăng xuất</span></button>
              </form>
            </div>
          </div> : <Link aria-label="Đăng nhập" className="user-chip" href={profileHref} onClick={(event) => beginRoute(event, profileHref)} onPointerEnter={() => prepareRoute(profileHref)} prefetch>
            <UserChipAvatar avatarUrl={null} displayName={displayName} />
            <strong>{displayName}</strong>
          </Link>}
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
        <Link aria-current={visualPathname === "/" ? "page" : undefined} className={visualPathname === "/" ? "active" : ""} href="/" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch><Home aria-hidden="true" size={20} /><span>Hôm nay</span></Link>
        <Link aria-current={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") || visualPathname.startsWith("/hsk") ? "page" : undefined} className={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") || visualPathname.startsWith("/hsk") ? "active" : ""} href="/courses" onClick={(event) => beginRoute(event, "/courses")} onPointerEnter={() => prepareRoute("/courses")} prefetch><BookOpen aria-hidden="true" size={20} /><span>Lộ trình</span></Link>
        <div className={`mobile-practice-group ${practiceMenuOpen ? "is-open" : ""}`.trim()}>
          <button
            aria-controls="mobile-practice-menu"
            aria-expanded={practiceMenuOpen}
            aria-label="Mở các nội dung luyện tập"
            className={`mobile-practice-trigger ${practiceTriggerActive ? "active" : ""}`.trim()}
            onClick={toggleMobilePracticeMenu}
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
                onClick={(event) => beginRoute(event, href)}
                onPointerEnter={() => prepareRoute(href)}
                prefetch
              >
                <Icon aria-hidden="true" size={20} /><span>{label}</span>
              </Link>
            ))}
          </div>
        </div>
        <Link aria-current={visualPathname.startsWith("/games") ? "page" : undefined} className={visualPathname.startsWith("/games") ? "active" : ""} href="/games" onClick={(event) => beginRoute(event, "/games")} onPointerEnter={() => prepareRoute("/games")} prefetch><Gamepad2 aria-hidden="true" size={20} /><span>Trò chơi</span></Link>
        <Link aria-current={visualPathname.startsWith("/vip") ? "page" : undefined} className={visualPathname.startsWith("/vip") ? "active" : ""} href="/vip" onClick={(event) => beginRoute(event, "/vip")} onPointerEnter={() => prepareRoute("/vip")} prefetch><Crown aria-hidden="true" size={20} /><span>VIP</span></Link>
        <Link aria-current={visualPathname.startsWith("/account") ? "page" : undefined} className={visualPathname.startsWith("/account") ? "active" : ""} href={profileHref} onClick={(event) => beginRoute(event, profileHref)} onPointerEnter={() => prepareRoute(profileHref)} prefetch><UserRound aria-hidden="true" size={20} /><span>Tài khoản</span></Link>
      </nav>
    </div>
  );
}
