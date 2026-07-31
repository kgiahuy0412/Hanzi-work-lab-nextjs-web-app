# Đặc tả sản phẩm HanziWork

## Mục tiêu MVP

Giúp người đi làm học vốn từ tiếng Trung theo đúng tình huống nghề nghiệp trong các phiên 10–15 phút. MVP ưu tiên những ngành ít rủi ro nội dung: giao tiếp công sở, văn phòng/hành chính, nhà máy cơ bản, kho vận, bán hàng/chăm sóc khách, nhà hàng/dịch vụ và thương mại điện tử.

Không triển khai kế toán, pháp lý, y tế hoặc chấm điểm phát âm bằng AI trong giai đoạn đầu.

## Quyền miễn phí và VIP

| Khả năng | Miễn phí | VIP |
| --- | --- | --- |
| Bài học đầu mỗi lộ trình | 3–5 bài | Toàn bộ |
| Xem từ vựng, ví dụ | Có | Có |
| Hội thoại tình huống | Một phần | Toàn bộ |
| Luyện flashcard | Giới hạn lượt/ngày | Không giới hạn |
| Ôn theo từ khó/làm sai | Cơ bản | Đầy đủ |
| Theo dõi tiến độ | 30 ngày gần nhất | Toàn bộ thời gian |
| Nội dung ngành mới | Học thử | Bao gồm trong kỳ VIP |

Không nên khóa toàn bộ trải nghiệm miễn phí. Người học cần hoàn thành được một bài mẫu trước khi được đề nghị nâng cấp.

## Kiến trúc đề xuất

- Web và API: Next.js App Router.
- Cơ sở dữ liệu: PostgreSQL + Drizzle ORM.
- Xác thực: email/mật khẩu hoặc nhà cung cấp OAuth; phân quyền learner/editor/reviewer/admin.
- Thanh toán: tạo đơn có mã tham chiếu riêng, hiển thị QR SePay, xác minh webhook phía server, sau đó kích hoạt subscription trong một transaction.
- Tệp âm thanh/hình: object storage; trong MVP có thể dùng audio thu sẵn hoặc TTS được kiểm duyệt.
- Flutter APK giai đoạn sau gọi cùng API, không sao chép logic thanh toán vào app.

## Tiêu chí hoàn thành trước khi mở bán

1. Đăng nhập, quên mật khẩu và xác minh email hoạt động.
2. Quyền truy cập miễn phí/VIP được kiểm tra ở server, không chỉ ẩn nút trên giao diện.
3. Webhook thanh toán có chữ ký, idempotency và nhật ký đối soát.
4. Admin có xác thực và nhật ký thay đổi.
5. Có thông tin chủ sở hữu, điều khoản sử dụng, bảo mật, hoàn tiền và kênh hỗ trợ.
6. Sao lưu PostgreSQL, theo dõi lỗi và cảnh báo thanh toán bất thường.

## Roadmap

### Giai đoạn 1 — kiểm chứng (0–3 tháng)

- 3 lộ trình đầu, khoảng 50–80 bài.
- Đăng nhập, tiến độ, flashcard, VIP và Admin nội dung tối thiểu.
- Thu thập chỉ số: hoàn thành bài đầu, quay lại ngày 7, chuyển đổi VIP, hoàn tiền.

### Giai đoạn 2 — tăng giữ chân (3–6 tháng)

- Ôn lặp lại ngắt quãng tốt hơn, mục tiêu tuần, thông báo nhắc học.
- Tải audio chuẩn, báo lỗi nội dung, yêu thích từ vựng.
- Mở rộng nhà hàng/dịch vụ và thương mại điện tử.

### Giai đoạn 3 — đa nền tảng (sau khi web có tín hiệu tốt)

- Flutter Android trước, sau đó iOS nếu cần.
- Học offline, đồng bộ tiến độ, deep link tới bài học.
- Chỉ cân nhắc luyện nói/AI sau khi đo được nhu cầu và chi phí vận hành.
