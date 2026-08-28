"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpenText,
  Crown,
  Headphones,
  Languages,
  LayoutDashboard,
  LoaderCircle,
  UserCog,
  UsersRound,
} from "lucide-react";
import type { UserRole } from "@/lib/auth-service";

const navigationGroups = [
  {
    label: "Vận hành",
    items: [
      {
        href: "/admin",
        label: "Tổng quan",
        icon: LayoutDashboard,
        matches: (pathname: string) => pathname === "/admin",
      },
    ],
  },
  {
    label: "Nội dung học",
    items: [
      {
        href: "/admin/courses",
        label: "Lộ trình & bài học",
        icon: BookOpenText,
        matches: (pathname: string) => ["/admin/courses", "/admin/modules", "/admin/lessons"].some((prefix) => pathname.startsWith(prefix)),
      },
      {
        href: "/admin/vocabulary",
        label: "Kho từ vựng",
        icon: Languages,
        matches: (pathname: string) => pathname.startsWith("/admin/vocabulary"),
      },
      {
        href: "/admin/practice",
        label: "Kho Luyện ca",
        icon: Headphones,
        matches: (pathname: string) => pathname.startsWith("/admin/practice"),
      },
    ],
  },
  {
    label: "Kinh doanh & hệ thống",
    items: [
      {
        href: "/admin/users",
        label: "Người dùng",
        icon: UserCog,
        matches: (pathname: string) => pathname.startsWith("/admin/users"),
      },
      {
        href: "/admin/subscriptions",
        label: "VIP & Thanh toán",
        icon: Crown,
        matches: (pathname: string) => pathname.startsWith("/admin/subscriptions"),
      },
      {
        href: "/admin/analytics",
        label: "Thống kê",
        icon: BarChart3,
        matches: (pathname: string) => pathname.startsWith("/admin/analytics"),
      },
      {
        href: "/admin/team",
        label: "Đội nội dung",
        icon: UsersRound,
        matches: (pathname: string) => pathname.startsWith("/admin/team"),
      },
    ],
  },
] as const;

function canSeeItem(role: UserRole, href: string): boolean {
  return role === "admin" || href === "/admin/practice";
}

function getAdminPrefetchHrefs(role: UserRole): string[] {
  const hrefs: string[] = [];
  for (const group of navigationGroups) {
    for (const item of group.items) {
      if (canSeeItem(role, item.href)) hrefs.push(item.href);
    }
  }
  return hrefs;
}

function isPlainNavigation(event: MouseEvent<HTMLAnchorElement>): boolean {
  return event.button === 0 && !event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey;
}

export function AdminNavigation({ userRole }: { userRole: UserRole }) {
  const pathname = usePathname();
  const router = useRouter();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const navigating = Boolean(pendingHref && pathname !== pendingHref);

  useEffect(() => {
    const warmAdminRoutes = () => {
      for (const href of getAdminPrefetchHrefs(userRole)) {
        if (href !== pathname) router.prefetch(href);
      }
    };
    const browserWindow = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (browserWindow.requestIdleCallback) {
      const handle = browserWindow.requestIdleCallback(warmAdminRoutes, { timeout: 1_200 });
      return () => browserWindow.cancelIdleCallback?.(handle);
    }

    const handle = window.setTimeout(warmAdminRoutes, 250);
    return () => window.clearTimeout(handle);
  }, [pathname, router, userRole]);

  useEffect(() => {
    if (!pendingHref) return;
    const timeout = window.setTimeout(() => setPendingHref(null), 10_000);
    return () => window.clearTimeout(timeout);
  }, [pendingHref]);

  const beginNavigation = (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!isPlainNavigation(event) || pathname === href) return;
    setPendingHref(href);
  };
  const prepareRoute = (href: string) => router.prefetch(href);

  return <>
    <nav aria-busy={navigating} aria-label="Điều hướng Console" className="admin-nav">
    {navigationGroups.map((group) => {
      const items = group.items.filter((item) => canSeeItem(userRole, item.href));
      if (!items.length) return null;
      return <div className="admin-nav-group" key={group.label}>
        <span>{group.label}</span>
        <div>{items.map(({ href, icon: Icon, label, matches }) => {
          const active = matches(pathname);
          const pending = navigating && pendingHref === href;
          return <Link
            aria-current={active ? "page" : undefined}
            className={`${active ? "active" : ""} ${pending ? "pending" : ""}`.trim() || undefined}
            href={href}
            key={href}
            onClick={(event) => beginNavigation(event, href)}
            onFocus={() => prepareRoute(href)}
            onMouseEnter={() => prepareRoute(href)}
            onTouchStart={() => prepareRoute(href)}
            prefetch={false}
          >
            {pending ? <LoaderCircle aria-hidden="true" className="admin-nav-spinner" size={17} /> : <Icon aria-hidden="true" size={17} />}
            <span>{label}</span>
          </Link>;
        })}</div>
      </div>;
    })}
    </nav>
    <span aria-hidden="true" className={`admin-route-progress ${navigating ? "active" : ""}`}><span /></span>
    <span aria-live="polite" className="sr-only" role="status">{navigating ? "Đang tải trang quản trị…" : ""}</span>
  </>;
}
