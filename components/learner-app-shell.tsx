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
  Headphones,
  Home,
  Repeat2,
  Settings,
} from "lucide-react";

type LearnerShellUser = {
  displayName: string;
  role: "learner" | "editor" | "reviewer" | "admin";
} | null;

const learnerRailItems = [
  { href: "/", label: "Học tập", icon: Home, matches: (pathname: string) => pathname === "/" },
  { href: "/courses", label: "Lộ trình", icon: BookOpen, matches: (pathname: string) => pathname.startsWith("/courses") || pathname.startsWith("/learn") },
  { href: "/practice", label: "Luyện ca", icon: Repeat2, matches: (pathname: string) => pathname.startsWith("/practice") },
  { href: "/vip", label: "VIP", icon: BarChart3, matches: (pathname: string) => pathname.startsWith("/vip") },
];

const standalonePrefixes = [
  "/admin",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
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
  }, [router]);

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
  const displayName = user?.displayName ?? "Đăng nhập";
  const navigating = Boolean(pendingHref && pendingHref !== pathname);
  const visualPathname = navigating && pendingHref ? pendingHref : pathname;

  return (
    <div className="learner-app-shell">
      <aside className="learn-rail" aria-label="Điều hướng học tập">
        <Link className="rail-logo" href="/" aria-label="HanziWork" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch><span lang="zh">汉</span></Link>
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
                <Icon size={21} /><span>{label}</span>
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
            <Settings size={21} /><span>{accountItem.label}</span>
          </Link>
        </nav>
        <a className="rail-support" href="mailto:giahuy041204@gmail.com"><Headphones size={20} /><span>Hỗ trợ</span></a>
      </aside>

      <header className="learn-topbar">
        <Link className="brand" href="/" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch><span className="brand-mark" lang="zh">汉</span><span>HanziWork</span></Link>
        <div className="topbar-actions">
          <span className="streak-chip"><Flame size={17} /> {user ? "Tiếp tục nhịp học hôm nay" : "Đăng nhập để lưu nhịp học"}</span>
          <button className="topbar-icon" type="button" aria-label="Thông báo" title="Thông báo"><Bell size={19} /></button>
          <Link className="user-chip" href={profileHref} onClick={(event) => beginRoute(event, profileHref)} onPointerEnter={() => prepareRoute(profileHref)} prefetch>
            <span>{initials(displayName)}</span>
            <strong>{displayName}</strong>
          </Link>
        </div>
      </header>

      <div aria-hidden="true" className={`route-transition-progress ${navigating ? "active" : ""}`}><span /></div>
      {navigating ? <span className="sr-only" role="status">Đang mở nội dung…</span> : null}

      <div className="learner-shell-content">{children}</div>

      <nav className="learner-mobile-nav" aria-label="Điều hướng học tập trên điện thoại">
        <Link aria-current={visualPathname === "/" ? "page" : undefined} className={visualPathname === "/" ? "active" : ""} href="/" onClick={(event) => beginRoute(event, "/")} onPointerEnter={() => prepareRoute("/")} prefetch><Home size={20} /><span>Hôm nay</span></Link>
        <Link aria-current={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") ? "page" : undefined} className={visualPathname.startsWith("/courses") || visualPathname.startsWith("/learn") ? "active" : ""} href="/courses" onClick={(event) => beginRoute(event, "/courses")} onPointerEnter={() => prepareRoute("/courses")} prefetch><BookOpen size={20} /><span>Lộ trình</span></Link>
        <Link aria-current={visualPathname.startsWith("/practice") ? "page" : undefined} className={visualPathname.startsWith("/practice") ? "active" : ""} href="/practice" onClick={(event) => beginRoute(event, "/practice")} onPointerEnter={() => prepareRoute("/practice")} prefetch><Repeat2 size={20} /><span>Luyện ca</span></Link>
        <Link aria-current={visualPathname.startsWith("/vip") ? "page" : undefined} className={visualPathname.startsWith("/vip") ? "active" : ""} href="/vip" onClick={(event) => beginRoute(event, "/vip")} onPointerEnter={() => prepareRoute("/vip")} prefetch><Crown size={20} /><span>VIP</span></Link>
      </nav>
    </div>
  );
}
