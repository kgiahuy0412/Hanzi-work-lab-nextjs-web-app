"use client";

import { useEffect, useState, type MouseEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bell,
  BookOpen,
  Crown,
  Flame,
  Gamepad2,
  Headphones,
  Home,
  Repeat2,
  Settings,
} from "lucide-react";
import { BrandLogoImage, BrandMark, BrandWordmark } from "@/components/brand-logo";

type LearnerShellUser = {
  displayName: string;
  role: "learner" | "editor" | "reviewer" | "admin";
  unreadNotificationCount: number;
} | null;

const learnerRailItems = [
  { href: "/", label: "Học tập", icon: Home, matches: (pathname: string) => pathname === "/" },
  { href: "/courses", label: "Lộ trình", icon: BookOpen, matches: (pathname: string) => pathname.startsWith("/courses") || pathname.startsWith("/learn") },
  { href: "/practice", label: "Luyện ca", icon: Repeat2, matches: (pathname: string) => pathname.startsWith("/practice") },
  { href: "/games", label: "Trò chơi", icon: Gamepad2, matches: (pathname: string) => pathname.startsWith("/games") || pathname.startsWith("/writing") },
  { href: "/vip", label: "VIP", icon: BarChart3, matches: (pathname: string) => pathname.startsWith("/vip") },
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

  useEffect(() => {
    if (isStandaloneRoute(pathname)) return;
    const warmPrimaryRoutes = () => {
      for (const { href } of learnerRailItems) router.prefetch(href);
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
    if (!pendingHref) return;
    const handle = window.setTimeout(() => setPendingHref(null), 5000);
    return () => window.clearTimeout(handle);
  }, [pendingHref]);

  const prepareRoute = (href: string) => router.prefetch(href);
  const beginRoute = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isPlainNavigation(event) || pathname === href) return;
    setPendingHref(href);
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
  const visualPathname = navigating && pendingHref ? pendingHref : pathname;
  return (
    <div aria-busy={navigating} className="learner-app-shell">
      <a className="skip-link" href="#learner-main-content">Bỏ qua điều hướng</a>
      <aside className="learn-rail" aria-label="Điều hướng học tập">
        <Link className="rail-logo" href="/" aria-label="Himi Chinese - Trang chủ" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch><BrandLogoImage priority size={60} /></Link>
        <nav className="rail-nav">
          {learnerRailItems.map(({ href, label, icon: Icon, matches }) => {
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
                prefetch
              >
                <Icon aria-hidden="true" size={21} /><span>{label}</span>
              </Link>
            );
          })}
          <Link
            aria-current={visualPathname.startsWith(accountItem.href) ? "page" : undefined}
            className={visualPathname.startsWith(accountItem.href) ? "active" : ""}
            href={accountItem.href}
            onClick={(event) => beginRoute(event, accountItem.href)}
            onFocus={() => prepareRoute(accountItem.href)}
            onPointerEnter={() => prepareRoute(accountItem.href)}
            prefetch
          >
            <Settings aria-hidden="true" size={21} /><span>{accountItem.label}</span>
          </Link>
        </nav>
        <a className="rail-support" href="mailto:giahuy041204@gmail.com"><Headphones aria-hidden="true" size={20} /><span>Hỗ trợ</span></a>
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
          <Link aria-label={user ? `Mở tài khoản của ${displayName}` : "Đăng nhập"} className="user-chip" href={profileHref} onClick={(event) => beginRoute(event, profileHref)} onPointerEnter={() => prepareRoute(profileHref)} prefetch>
            <span aria-hidden="true">{initials(displayName)}</span>
            <strong>{displayName}</strong>
          </Link>
        </div>
      </header>

      <div aria-hidden="true" className={`route-transition-progress ${navigating ? "active" : ""}`}><span /></div>
      <span aria-live="polite" className="sr-only" role="status">{navigating ? "Đang mở nội dung…" : ""}</span>

      <div className="learner-shell-content" id="learner-main-content" tabIndex={-1}>{children}</div>

      <nav className="learner-mobile-nav" aria-label="Điều hướng học tập trên điện thoại">
        <Link aria-current={visualPathname === "/" ? "page" : undefined} className={visualPathname === "/" ? "active" : ""} href="/" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch><Home aria-hidden="true" size={20} /><span>Hôm nay</span></Link>
        <Link aria-current={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") ? "page" : undefined} className={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") ? "active" : ""} href="/courses" onClick={(event) => beginRoute(event, "/courses")} onPointerEnter={() => prepareRoute("/courses")} prefetch><BookOpen aria-hidden="true" size={20} /><span>Lộ trình</span></Link>
        <Link aria-current={visualPathname.startsWith("/practice") ? "page" : undefined} className={visualPathname.startsWith("/practice") ? "active" : ""} href="/practice" onClick={(event) => beginRoute(event, "/practice")} onPointerEnter={() => prepareRoute("/practice")} prefetch><Repeat2 aria-hidden="true" size={20} /><span>Luyện ca</span></Link>
        <Link aria-current={visualPathname.startsWith("/games") || visualPathname.startsWith("/writing") ? "page" : undefined} className={visualPathname.startsWith("/games") || visualPathname.startsWith("/writing") ? "active" : ""} href="/games" onClick={(event) => beginRoute(event, "/games")} onPointerEnter={() => prepareRoute("/games")} prefetch><Gamepad2 aria-hidden="true" size={20} /><span>Trò chơi</span></Link>
        <Link aria-current={visualPathname.startsWith("/vip") ? "page" : undefined} className={visualPathname.startsWith("/vip") ? "active" : ""} href="/vip" onClick={(event) => beginRoute(event, "/vip")} onPointerEnter={() => prepareRoute("/vip")} prefetch><Crown aria-hidden="true" size={20} /><span>VIP</span></Link>
      </nav>
    </div>
  );
}
