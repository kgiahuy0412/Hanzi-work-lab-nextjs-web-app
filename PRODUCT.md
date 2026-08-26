# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Người Việt đang đi làm hoặc chuẩn bị đi làm, cần học tiếng Trung thực dụng theo tình huống nghề nghiệp và thường chỉ có những khoảng thời gian học ngắn trong ngày.

## Product Purpose

Himi Chinese giúp người học xây dựng năng lực tiếng Trung dùng được trong công việc bằng các phiên học ngắn, lộ trình theo ngành và hoạt động luyện tập có phản hồi. Thành công nghĩa là người học biết việc cần làm tiếp theo, duy trì được nhịp học và có thể chuyển từ ghi nhớ từ vựng sang nghe, nói, đọc, viết và xử lý tình huống công việc.

## Positioning

Sản phẩm kết hợp một nhịp học hằng ngày khoảng 10 phút với bảy lộ trình nghề nghiệp, dùng cùng nội dung xuyên suốt bài học, ôn tập, luyện ca, nghe, viết, video và trò chơi thay vì tách chúng thành các kho bài rời rạc.

## Operating Context

- Trang chủ là dashboard học tập tổng hợp cho lộ trình, kỹ năng và tiến độ; phiên học 10 phút không phải cấu trúc bắt buộc hoặc trọng tâm của trang chủ.
- Người học có thể học thử khi chưa đăng nhập; tài khoản đã đăng nhập lưu tiến độ, lịch ôn và hoạt động hằng ngày.
- Nội dung gồm lộ trình, bài học, flashcard, luyện viết, video, luyện nghe, tình huống công việc, trò chơi và VIP.
- Giao diện phải hoạt động tốt trên laptop và trình duyệt điện thoại.

## Capabilities and Constraints

- Giữ nguyên các luồng đang hoạt động: phiên 10 phút, đánh giá flashcard, phát âm, lộ trình, luyện ca và điều hướng sang các khu học khác.
- Trang chủ mới cần tổng hợp nhiều tính năng hơn; hành động ưu tiên là tiếp tục nội dung phù hợp với tiến độ hiện tại, không phải bắt đầu một hành trình 10 phút cố định.
- Nội dung miễn phí và VIP được kiểm tra ở server; trang chủ không được làm lộ nội dung VIP cho người chưa có quyền.
- Dự án dùng Next.js/React/TypeScript, Tailwind CSS, Lucide React và Motion; dữ liệu thật có thể đến từ PostgreSQL, còn dữ liệu demo là fallback khi chạy local.

## Brand Commitments

- Tên sản phẩm: Himi Chinese.
- Định vị bằng lời: “Tiếng Trung cho người đi làm”.
- Linh vật Cánh Cụt Himi và bộ nhận diện logo hiện tại phải được giữ, với Himi là người đồng hành học tập chứ không chỉ là hình trang trí.
- Ngôn ngữ chính của giao diện là tiếng Việt; nội dung học dùng chữ Hán và pinyin.

## Evidence on Hand

- Logo và linh vật nằm trong `public/assets/brand/`.
- Bảy ảnh lộ trình có Himi nằm trong `public/assets/courses/himi-concepts/`.
- Trang chủ hiện tại và toàn bộ logic phiên học nằm trong `components/review-home-studio.tsx`.
- Dữ liệu lộ trình, tiến độ, lịch ôn và hoạt động học đã có trong các repository thuộc `lib/`.
- Chưa có testimonial, số liệu marketing hoặc benchmark đã được xác thực; thiết kế không được tự tạo những tuyên bố này.

## Product Principles

1. Luôn chỉ ra việc học tiếp theo thay vì bắt người dùng tự tìm.
2. Biến thời gian ngắn thành một phiên học trọn vẹn và có cảm giác tiến bộ.
3. Kết nối từ vựng với ngữ cảnh công việc và hoạt động thực hành.
4. Dùng Himi để hướng dẫn, khích lệ và giải thích trạng thái một cách có ích.
5. Cho phép khám phá nhiều tính năng mà không làm loãng hành động chính của ngày hôm nay.

## Accessibility & Inclusion

Giữ điều hướng bàn phím, nhãn truy cập, trạng thái focus rõ ràng, hỗ trợ `prefers-reduced-motion`, độ tương phản đủ đọc và bố cục responsive cho màn hình nhỏ.
