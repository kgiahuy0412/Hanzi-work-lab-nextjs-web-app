import Link from "next/link";

export function SiteFooter() {
  return <footer className="site-footer"><div className="section-shell">
    <div className="footer-grid">
      <div className="footer-brand"><Link className="brand" href="/"><span className="brand-mark" lang="zh">汉</span><span>HanziWork</span></Link><p>Tiếng Trung chuyên ngành theo tình huống thực tế, thiết kế riêng cho nhịp sống của người đi làm.</p></div>
      <nav className="footer-column" aria-label="Học tập"><strong>Học tập</strong><Link href="/courses">Lộ trình ngành</Link><Link href="/practice">Luyện tập</Link><Link href="/vip">Gói VIP</Link></nav>
      <nav className="footer-column" aria-label="Sản phẩm"><strong>Sản phẩm</strong><Link href="/admin">Đăng nhập quản trị</Link><Link href="/vip#chinh-sach">Chính sách VIP</Link><Link href="/courses">Nội dung miễn phí</Link></nav>
      <nav className="footer-column" aria-label="Hỗ trợ"><strong>Hỗ trợ</strong><a href="mailto:giahuy041204@gmail.com">Liên hệ</a><Link href="/vip#chinh-sach">Điều khoản</Link><Link href="/vip#chinh-sach">Bảo mật</Link></nav>
    </div>
    <div className="footer-bottom"><span>© 2026 HanziWork. Bản prototype sản phẩm.</span><span>Nội dung thanh toán hiện chỉ để minh họa trải nghiệm.</span></div>
  </div></footer>;
}
