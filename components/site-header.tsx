import Link from "next/link";
import { LogOut, Menu, UserRound } from "lucide-react";
import { BrandMark, BrandWordmark } from "@/components/brand-logo";
import { getCurrentUser } from "@/lib/auth-session";

const publicNavItems = [{ href: "/courses", label: "Lộ trình" }, { href: "/practice", label: "Luyện tập" }, { href: "/vip", label: "Himi Chinese VIP" }];

export async function SiteHeader() {
  const user = await getCurrentUser();
  const navItems = user?.role === "admin" ? [...publicNavItems, { href: "/admin", label: "Quản trị" }] : publicNavItems;
  return <header className="site-header"><div className="section-shell header-inner">
    <Link className="brand" href="/" aria-label="Himi Chinese - Trang chủ" prefetch={false}><BrandMark priority /><BrandWordmark /></Link>
    <nav className="desktop-nav" aria-label="Điều hướng chính">{navItems.map((item) => <Link href={item.href} key={item.href} prefetch={false}>{item.label}</Link>)}</nav>
    <div className="header-actions">
      {user ? <><Link className="header-login" href="/account" prefetch={false}><UserRound size={17} /> {user.displayName}</Link><form action="/api/auth/logout" className="header-logout" method="post"><input name="returnTo" type="hidden" value="/" /><button aria-label="Đăng xuất" title="Đăng xuất" type="submit"><LogOut size={17} /></button></form></> : <Link className="header-login" href="/login" prefetch={false}><UserRound size={17} /> Đăng nhập</Link>}<Link className="button button-primary button-small" href="/courses" prefetch={false}>Học miễn phí</Link>
      <details className="mobile-menu"><summary aria-label="Mở menu"><Menu size={20} /></summary><nav className="mobile-menu-panel" aria-label="Điều hướng trên máy tính bảng">{navItems.map((item) => <Link href={item.href} key={item.href} prefetch={false}>{item.label}</Link>)}</nav></details>
    </div>
  </div></header>;
}

export function SiteHeaderFallback() {
  return <header className="site-header"><div className="section-shell header-inner">
    <Link className="brand" href="/" aria-label="Himi Chinese - Trang chủ" prefetch={false}><BrandMark priority /><BrandWordmark /></Link>
    <nav className="desktop-nav" aria-label="Điều hướng chính">{publicNavItems.map((item) => <Link href={item.href} key={item.href} prefetch={false}>{item.label}</Link>)}</nav>
    <div className="header-actions">
      <span aria-hidden="true" className="header-login header-account-skeleton skeleton-block" />
      <Link className="button button-primary button-small" href="/courses" prefetch={false}>Học miễn phí</Link>
      <details className="mobile-menu"><summary aria-label="Mở menu"><Menu size={20} /></summary><nav className="mobile-menu-panel" aria-label="Điều hướng trên máy tính bảng">{publicNavItems.map((item) => <Link href={item.href} key={item.href} prefetch={false}>{item.label}</Link>)}</nav></details>
    </div>
  </div></header>;
}
