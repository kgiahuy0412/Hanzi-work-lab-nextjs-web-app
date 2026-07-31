import Link from "next/link";
import { Menu, UserRound } from "lucide-react";

const navItems = [{ href: "/courses", label: "Lộ trình" }, { href: "/practice", label: "Luyện tập" }, { href: "/vip", label: "HanziWork VIP" }, { href: "/admin", label: "Admin mẫu" }];

export function SiteHeader() {
  return <header className="site-header"><div className="section-shell header-inner">
    <Link className="brand" href="/" aria-label="HanziWork - Trang chủ"><span className="brand-mark" lang="zh">汉</span><span>HanziWork</span></Link>
    <nav className="desktop-nav" aria-label="Điều hướng chính">{navItems.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav>
    <div className="header-actions">
      <Link className="header-login" href="/learn/van-phong-hanh-chinh"><UserRound size={17} /> Đăng nhập</Link><Link className="button button-primary button-small" href="/courses">Học miễn phí</Link>
      <details className="mobile-menu"><summary aria-label="Mở menu"><Menu size={20} /></summary><nav className="mobile-menu-panel" aria-label="Điều hướng trên máy tính bảng">{navItems.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}</nav></details>
    </div>
  </div></header>;
}
