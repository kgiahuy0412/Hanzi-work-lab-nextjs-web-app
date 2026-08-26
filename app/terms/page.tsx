import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Điều khoản sử dụng",
  description: "Điều khoản sử dụng dịch vụ học tiếng Trung Himi Chinese.",
};

export default function TermsPage() {
  return <main className="legal-page"><article className="legal-card">
    <span className="legal-kicker">Himi Chinese · cập nhật 07/08/2026</span>
    <h1>Điều khoản sử dụng</h1>
    <p className="legal-lead">Các điều khoản dưới đây giúp bạn hiểu phạm vi của bản beta và cách sử dụng nội dung học tập trên Himi Chinese.</p>

    <section><h2>1. Tài khoản người học</h2><p>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập và cung cấp email hợp lệ. Không chia sẻ tài khoản hoặc sử dụng dịch vụ để can thiệp vào tài khoản của người khác.</p></section>
    <section><h2>2. Nội dung học tập</h2><p>Bài học, audio, hình ảnh và trò chơi được cung cấp cho mục đích học tập cá nhân. Bạn không được sao chép, bán lại hoặc phát hành lại toàn bộ nội dung khi chưa có sự đồng ý bằng văn bản.</p></section>
    <section><h2>3. Trạng thái beta</h2><p>Himi Chinese đang trong giai đoạn beta. Nội dung, tiến độ và một số tính năng có thể được điều chỉnh để cải thiện chất lượng. Thanh toán chưa được mở ở thời điểm cập nhật này.</p></section>
    <section><h2>4. Sử dụng phù hợp</h2><p>Không khai thác lỗi, gửi dữ liệu độc hại, làm gián đoạn dịch vụ hoặc tự động thu thập nội dung trái phép. Chúng tôi có thể khóa tài khoản vi phạm để bảo vệ hệ thống và người học khác.</p></section>
    <section><h2>5. Liên hệ</h2><p>Nếu cần hỗ trợ về tài khoản hoặc nội dung, hãy gửi email đến <a href="mailto:giahuy041204@gmail.com">giahuy041204@gmail.com</a>.</p></section>
  </article></main>;
}
