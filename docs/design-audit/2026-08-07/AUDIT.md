# Audit sản phẩm HanziWork — 07/08/2026

## Kết luận ngắn

HanziWork đã có đủ bề rộng để đưa cho nhóm beta dùng thử: 7 lộ trình, bài học, ôn tập, Luyện ca và game Tập viết. Điểm cần cải thiện lớn nhất hiện không phải là thêm tính năng mới, mà là khép kín một vòng học có dữ liệu, audio đáng tin và lời mời nâng cấp rõ ràng.

UI hiện đã có cá tính và phần Luyện ca là điểm khác biệt mạnh nhất. Tuy nhiên hành trình bị chia thành các “đảo”: điều hướng toàn cục biến mất ở nhiều route, tiến độ Luyện ca/game chỉ nằm trên thiết bị, audio phần lớn dựa vào giọng hệ thống, trang VIP chưa phải một trang bán hàng, và chưa có analytics để biết người dùng rơi ở đâu.

## Hành trình được kiểm tra

| Bước | Bề mặt | Sức khỏe | Nhận định |
| --- | --- | --- | --- |
| 1 | Học hôm nay / ôn flashcard | Khá | Trải nghiệm có thương hiệu, thao tác nhớ/quên rõ. Thiếu một lời dẫn cho người mới và cấu trúc heading chính. |
| 2 | Chọn lộ trình | Khá | Ảnh chủ đề và phân loại tốt. Thiếu gợi ý “phù hợp với bạn”, các thẻ khá giống nhau và bộ lọc mobile chưa báo hiệu cuộn ngang. |
| 3 | Không gian bài học | Tốt | Flashcard, mục lục, khóa VIP và phím tắt rõ. Tiến độ bài học tổng thể chưa thật dễ hiểu; audio dự phòng vẫn là giọng hệ thống. |
| 4 | Kho Luyện ca | Tốt, cần nối dữ liệu | Bối cảnh công việc và CTA mạnh. Ngày hiển thị đang được viết cứng và tiến độ chưa gắn với tài khoản. |
| 5 | Phiên nghe — Đúng/Sai — phản hồi | Tốt nhất | Đây là vòng lặp khác biệt nhất: nghe trước, quyết định, rồi mới mở bản chép lời và giải thích. Thời lượng 8 giây đang viết cứng nên có thể lệch với audio thực tế. |
| 6 | Game / Tập viết | Khá | Vui, dễ nhớ, responsive ổn. Phong cách trẻ hơn phần “tiếng Trung công việc”; cần luôn gắn trò chơi với mục tiêu nghề nghiệp và tiến độ người dùng. |
| 7 | VIP | Yếu | Chưa có giá, một gói chủ lực, bằng chứng giá trị hay CTA chuyển đổi. Nhiều gói đặt ngang nhau gây quá tải lựa chọn. |
| 8 | Đăng ký và độ tin cậy | Khá về form, yếu về launch | Form sạch. Copy vẫn nói “chuẩn bị lưu tiến độ” dù tính năng đã có; Điều khoản/Bảo mật chưa có trang riêng và footer vẫn gọi sản phẩm là prototype. |

## Vấn đề ưu tiên

### P0 — nên sửa trước khi mời beta rộng hơn

1. **Khôi phục điều hướng nhất quán trên các route chính.** `LearnerAppShell` đang chủ động ẩn navigation trên `/courses`, `/learn`, `/practice`, `/games`, `/writing`. Điều này phá dòng chuyển nhanh giữa Lộ trình, Luyện ca và Tập viết, đặc biệt trên mobile.
2. **Đưa tiến độ Luyện ca và game lên server theo user.** Hiện hai phần dùng `localStorage`, trong khi bài học và ôn tập đã có dữ liệu server. Người dùng đăng nhập nhưng vẫn mất nhịp khi đổi thiết bị.
3. **Chuẩn hóa audio.** Dùng file thu âm/giọng đã duyệt, lưu duration thật và chỉ dùng Web Speech như phương án dự phòng có nhãn rõ. Với sản phẩm học ngôn ngữ, đây là chất lượng lõi chứ không phải polish.
4. **Sửa các lỗi làm giảm độ tin cậy.** Ngày Luyện ca đang viết cứng `03/08/2026`; thời lượng audio viết cứng 8 giây; copy đăng ký đã lỗi thời; Điều khoản/Bảo mật trỏ chung vào section VIP; footer còn ghi “prototype”.
5. **Gắn analytics cho vòng học đầu tiên.** Chưa thấy event tracking. Cần đo tối thiểu: xem home → chọn ngành → bắt đầu bài miễn phí → hoàn thành bài → bắt đầu Luyện ca → hoàn thành Luyện ca → quay lại D1/D7 → mở offer VIP.

### P1 — biến các màn hình thành một sản phẩm liền mạch

1. Tạo “Phiên 10 phút hôm nay” hợp nhất: từ cần ôn, bài đang học dở, một ca luyện được đề xuất và một game ngắn.
2. Sau đăng ký, hỏi mục tiêu nghề nghiệp/ngành và trình độ ngắn gọn để đề xuất lộ trình thay vì bắt người dùng tự so 7 thẻ gần giống nhau.
3. Đưa kết quả bài học, Luyện ca và game vào cùng dashboard; cho thấy vì sao hệ thống đề xuất bước tiếp theo.
4. Thêm quy trình biên tập/duyệt nội dung và audio bởi người biết tiếng Trung và ngữ cảnh ngành trước khi bán VIP.
5. Giữ mascot chủ yếu ở khu game; các bề mặt học nghề, auth và VIP tiếp tục dùng ngôn ngữ hình ảnh trưởng thành hơn.

### P2 — kiểm chứng giá trị trước khi tích hợp thanh toán

1. Thiết kế lại VIP thành một offer chủ lực, ví dụ “Bộ Văn phòng 30 ngày”, có đối tượng phù hợp, đầu ra, nội dung mở khóa, giá thử nghiệm và CTA đăng ký beta/nhận thông báo.
2. Mời 10–20 người dùng mục tiêu học đủ một vòng; phỏng vấn ngắn sau phiên và xem dữ liệu D1/D7.
3. Chỉ triển khai SePay sandbox/webhook sau khi đã có offer, giá, chính sách hoàn tiền, Terms/Privacy và tín hiệu người dùng thật sự muốn trả tiền.

## Đề xuất gói triển khai tiếp theo

Tên gói: **Khép kín phiên học đầu tiên**.

- Ngày 1–2: điều hướng nhất quán, ngày/thời lượng động, copy và link chính sách, heading/a11y cơ bản, affordance bộ lọc mobile.
- Ngày 3–6: bảng/API `practice_attempts`, `game_attempts`, tổng hợp phiên hôm nay theo user và đồng bộ đa thiết bị.
- Ngày 7–8: event analytics cho funnel chính, dashboard tiếp tục học và QA anonymous/authenticated/mobile.
- Song song: chuẩn bị bộ audio đã duyệt cho một lộ trình chủ lực và 10–20 ca luyện tốt nhất.

Sau gói này mới nên làm trang offer VIP + waitlist; thanh toán đứng sau một vòng beta có dữ liệu.

## Dấu vết kỹ thuật đáng chú ý

- Điều hướng bị ẩn: `components/learner-app-shell.tsx:44`.
- Tiến độ Luyện ca lưu cục bộ và ngày viết cứng: `components/work-practice-hub.tsx:42-43`.
- Thời lượng audio viết cứng: `components/work-practice-hub.tsx:410`.
- Tiến độ game lưu cục bộ: `components/game-center.tsx:59`.
- Fallback Web Speech: `components/work-practice-hub.tsx:192`, `components/lesson-vocabulary-deck.tsx:122`, `lib/game-content.ts:31`.
- Link pháp lý và trạng thái prototype: `components/site-footer.tsx:9-12`.
- Trang VIP dùng “Giá beta”: `app/vip/page.tsx:8-14`.

## Kiểm tra kỹ thuật

- TypeScript: đạt.
- Automated tests: 49/49 đạt.
- ESLint: 0 lỗi, 1 cảnh báo do `<img>` trong `components/work-practice-hub.tsx:552`; nên chuyển sang `next/image` hoặc loader phù hợp để giảm LCP/băng thông.
- Console trình duyệt trong hành trình audit: không ghi nhận warning/error.

## Giới hạn bằng chứng

Audit dựa trên code hiện tại và hành trình anonymous ở desktop/mobile. Chưa tạo tài khoản thật, chưa kiểm tra email, thanh toán, screen reader đầy đủ, thiết bị thật, chất lượng audio qua nhiều trình duyệt hoặc tải mạng chậm. Các điểm đó cần một vòng QA riêng trước public beta.

## Ảnh đã duyệt

- `01-home-desktop.png`
- `03-lesson-desktop.png`
- `07-practice-feedback-desktop.png`
- `08-games-desktop.png`
- `10-vip-desktop.png`
- `11-home-mobile-accepted.png`
- `12-courses-mobile.png`
- `13-games-mobile.png`
- `14-vip-mobile.png`
- `15-register-default.png`
