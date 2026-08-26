import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chính sách bảo mật",
  description: "Cách Himi Chinese thu thập và sử dụng dữ liệu học tập của người dùng.",
};

export default function PrivacyPage() {
  return <main className="legal-page"><article className="legal-card">
    <span className="legal-kicker">Himi Chinese · cập nhật 07/08/2026</span>
    <h1>Chính sách bảo mật</h1>
    <p className="legal-lead">Himi Chinese chỉ thu thập dữ liệu cần thiết để vận hành tài khoản, đồng bộ tiến độ và cải thiện trải nghiệm học tập.</p>

    <section><h2>1. Dữ liệu được lưu</h2><p>Khi đăng ký, hệ thống lưu email, tên hiển thị, mật khẩu đã được băm, phiên đăng nhập, tiến độ bài học, lịch ôn, kết quả Luyện ca và trò chơi.</p></section>
    <section><h2>2. Mục đích sử dụng</h2><p>Dữ liệu được dùng để xác thực tài khoản, mở đúng quyền truy cập, đồng bộ giữa các thiết bị, đề xuất nội dung tiếp theo và phát hiện lỗi vận hành.</p></section>
    <section><h2>3. Người dùng chưa đăng nhập</h2><p>Một số kết quả dùng thử được lưu trong bộ nhớ cục bộ của trình duyệt. Bạn có thể xóa chúng bằng cách xóa dữ liệu trang web trong trình duyệt.</p></section>
    <section><h2>4. Bảo mật và thời gian lưu</h2><p>Phiên đăng nhập dùng cookie chỉ dành cho HTTP và mật khẩu không được lưu ở dạng văn bản thuần. Dữ liệu được giữ trong thời gian tài khoản còn hoạt động hoặc khi cần đáp ứng yêu cầu vận hành hợp pháp.</p></section>
    <section><h2>5. Quyền của bạn</h2><p>Bạn có thể yêu cầu kiểm tra, chỉnh sửa hoặc xóa dữ liệu tài khoản bằng cách liên hệ <a href="mailto:giahuy041204@gmail.com">giahuy041204@gmail.com</a>.</p></section>
  </article></main>;
}
