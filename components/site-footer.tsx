import Link from "next/link";
import { BrandMark, BrandWordmark } from "@/components/brand-logo";

export function SiteFooter() {
  return <footer className="site-footer"><div className="section-shell">
    <div className="footer-grid">
      <div className="footer-brand"><Link aria-label="Himi Chinese - Trang chủ" className="brand" href="/" prefetch={false}><BrandMark /><BrandWordmark /></Link><p>Tiếng Trung chuyên ngành theo tình huống thực tế, thiết kế riêng cho nhịp sống của người đi làm.</p></div>
      <nav className="footer-column" aria-label="Học tập"><strong>Học tập</strong><Link href="/courses" prefetch={false}>Lộ trình ngành</Link><Link href="/practice" prefetch={false}>Luyện tập</Link><Link href="/vip" prefetch={false}>Gói VIP</Link></nav>
      <nav className="footer-column" aria-label="Sản phẩm"><strong>Sản phẩm</strong><Link href="/practice" prefetch={false}>Kho Luyện ca</Link><Link href="/games" prefetch={false}>Trò chơi phản xạ</Link><Link href="/courses" prefetch={false}>Nội dung miễn phí</Link></nav>
      <nav className="footer-column" aria-label="Hỗ trợ"><strong>Hỗ trợ</strong><a href="mailto:giahuy041204@gmail.com">Liên hệ</a><Link href="/terms" prefetch={false}>Điều khoản</Link><Link href="/privacy" prefetch={false}>Bảo mật</Link></nav>
    </div>
    <div className="footer-bottom"><span>© 2026 Himi Chinese.</span><span>Sản phẩm đang trong giai đoạn beta và chưa mở thanh toán.</span></div>
  </div></footer>;
}
