import Link from "next/link";
import { BookOpen, Crown, House, Layers3 } from "lucide-react";

export function MobileNav() {
  return <nav className="mobile-nav" aria-label="Điều hướng di động"><Link href="/" prefetch={false}><House size={18} /><span>Trang chủ</span></Link><Link href="/courses" prefetch={false}><Layers3 size={18} /><span>Lộ trình</span></Link><Link href="/practice" prefetch={false}><BookOpen size={18} /><span>Luyện tập</span></Link><Link href="/vip" prefetch={false}><Crown size={18} /><span>VIP</span></Link></nav>;
}
