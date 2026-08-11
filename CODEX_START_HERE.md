# Bắt đầu tại đây — HanziWork

Tệp này là gói bàn giao bối cảnh cho một task/project Codex mới. Không cần chép lại toàn bộ đoạn chat cũ: hãy trỏ Codex tới thư mục này và yêu cầu đọc tệp này trước khi sửa code.

Để xem diễn tiến đầy đủ theo thứ tự thời gian, đọc thêm `docs/CONVERSATION_TIMELINE.md`.

## Prompt dùng cho task Codex mới

Sao chép nguyên đoạn dưới đây:

```text
Hãy làm tiếp dự án HanziWork trong thư mục hiện tại. Trước khi hành động, đọc toàn bộ CODEX_START_HERE.md, docs/CONVERSATION_TIMELINE.md, README.md, docs/product-spec.md, docs/processes.md, docs/SESSION_CHANGELOG.md và design-qa.md. Sau đó kiểm tra git status và chạy ứng dụng hiện tại; không khởi tạo lại dự án, không thay giao diện đã duyệt và không xóa thay đổi chưa commit. Hình chuẩn trang chủ là docs/design-target/approved-combined-dashboard.png. Hãy tiếp tục từ trạng thái hiện tại và báo rõ những file bạn sửa.
```

Nếu task mới không mở đúng thư mục, đường dẫn hiện tại là:

```text
C:\Users\Windows\Documents\INDIVIDUAL PROJECT\hanziwork
```

## 1. Chủ dự án và tài liệu tham chiếu

- Tên hiển thị trong prototype: Gia Huy.
- Email chính: `giahuy041204@gmail.com`.
- Tài khoản Codex/Figma đã dùng: `huameizhongxin@gmail.com`.
- Figma ban đầu: `https://www.figma.com/design/PWz0J4lmrGq2s9nkYXUxDS/Untitled?node-id=0-1&t=t64nGXuJruaVIdSf-1`.
- Prototype code hiện tại mới là nguồn triển khai chính; Figma không còn là nơi duy nhất chứa thiết kế.
- Không lưu mật khẩu, token SePay, khóa API hoặc bí mật đăng nhập trong tài liệu hay Git.

## 2. Tầm nhìn sản phẩm đã thống nhất

HanziWork là web/app học tiếng Trung chuyên ngành cho người đang đi làm hoặc muốn chuyển sang một ngành khác. Khác biệt cốt lõi là học theo tình huống công việc thực tế trong các phiên ngắn 10–15 phút, không phải một ứng dụng tiếng Trung tổng quát.

Hướng triển khai là web-first, responsive cho laptop, iOS và Android. Khi web có tín hiệu tốt mới làm Flutter Android/APK dùng chung API; không xây hai backend riêng.

### Nhóm nội dung MVP

Ưu tiên các ngành dễ kiểm chứng và ít rủi ro:

1. Giao tiếp công sở.
2. Văn phòng và hành chính.
3. Nhà máy cơ bản.
4. Kho vận và logistics.
5. Bán hàng và chăm sóc khách hàng.
6. Nhà hàng và dịch vụ.
7. Thương mại điện tử.

Chưa làm kế toán, pháp lý và y tế vì nội dung sai có thể gây hậu quả lớn. Chưa làm tính năng nói theo/chấm điểm phát âm bằng AI trong MVP vì tăng chi phí, độ phức tạp và nghĩa vụ xử lý dữ liệu giọng nói.

Audio phát âm/câu ví dụ là tính năng cần có về sau, nhưng chỉ bật khi có file thật hoặc TTS đã được kiểm duyệt; không giả lập nút phát âm khi chưa có audio.

## 3. Bài học và trải nghiệm học

Một bài học nên gồm:

- 6–12 từ/cụm từ chuyên ngành: chữ Hán, pinyin, nghĩa Việt, audio khi có.
- Ví dụ đúng bối cảnh công việc, có bản dịch Việt.
- Hội thoại/tình huống ngắn.
- Ghi chú cách dùng và lỗi thường gặp.
- Flashcard tự đánh giá; không cần chấm phát âm.
- Đánh dấu hoàn thành, cập nhật tiến độ và tạo lịch ôn.

Luồng chính: chọn ngành → chọn bài → kiểm tra quyền miễn phí/VIP ở server → học từ → xem tình huống → hoàn thành → cập nhật tiến độ → tạo lịch ôn → gợi ý bài tiếp theo.

## 4. Chính sách miễn phí và VIP đã định hướng

Không khóa toàn bộ sản phẩm. Người mới phải học trọn vẹn được ít nhất một bài mẫu trước khi thấy đề nghị nâng cấp.

| Quyền lợi | Miễn phí | VIP |
| --- | --- | --- |
| Bài đầu mỗi lộ trình | 3–5 bài | Toàn bộ bài |
| Từ vựng và ví dụ | Có | Có |
| Hội thoại tình huống | Một phần | Toàn bộ |
| Flashcard | Giới hạn/ngày | Không giới hạn |
| Ôn từ khó/từ sai | Cơ bản | Đầy đủ |
| Lịch sử tiến độ | 30 ngày | Toàn bộ thời gian |
| Ngành mới | Học thử | Bao gồm trong kỳ VIP |

Mua VIP dự kiến: chọn gói → server tạo đơn và mã tham chiếu duy nhất → hiển thị QR SePay → người dùng chuyển khoản → webhook xác minh chữ ký, số tiền và mã đơn → transaction cập nhật đơn và subscription → mở khóa nội dung.

Luồng đang chạy trước khi có thanh toán: người học chọn gói thật ở `/vip` → gửi một yêu cầu pending → theo dõi/hủy tại `/vip` hoặc `/account` → admin duyệt/từ chối ở `/admin/subscriptions`. Khi duyệt, request và subscription được cập nhật trong cùng transaction; luồng này chưa tự trừ tiền.

Không kích hoạt VIP chỉ bằng ảnh chụp chuyển khoản. Sai số tiền, thiếu mã, webhook trùng hoặc đơn hết hạn phải vào hàng chờ `manual_review`.

## 5. Bối cảnh tham khảo hoctrung.com

Quan sát do chủ dự án cung cấp:

- Luồng mua: đăng nhập → chọn gói → quét QR SePay → kích hoạt VIP → mở bài bị khóa.
- Tài khoản nhận tiền được mô tả là tài khoản của một nhân viên.
- Chân trang không thấy tên chủ sở hữu, mã số thuế, địa chỉ hoặc logo/đường dẫn thông báo Bộ Công Thương.
- Không thấy sẵn Điều khoản sử dụng, Chính sách bảo mật và Chính sách hoàn tiền.

HanziWork chỉ dùng thông tin này để hiểu luồng sản phẩm, không sao chép các điểm thiếu minh bạch. Khi bán thật cần dùng chủ thể và tài khoản nhận tiền phù hợp, công khai thông tin đơn vị, hỗ trợ khách hàng và các chính sách cần thiết.

## 6. Ghi chú kinh doanh, thuế và tuân thủ

Hai người sáng lập đều 22 tuổi nên về nguyên tắc độ tuổi không phải trở ngại để đăng ký kinh doanh. Tuy nhiên các quy định thuế, hóa đơn điện tử, thương mại điện tử và ngưỡng doanh thu có thể thay đổi; không được dùng câu “dưới 1 tỷ/năm thì không nộp thuế” như một kết luận pháp lý.

Trước khi thu tiền thật phải kiểm tra lại quy định Việt Nam đang có hiệu lực và chọn mô hình phù hợp, thường là hộ kinh doanh hoặc doanh nghiệp. Cần xác định rõ:

- Ai là chủ thể đứng tên và chịu trách nhiệm.
- Tài khoản ngân hàng/QR dùng để nhận tiền.
- Đăng ký kinh doanh, mã số thuế và nghĩa vụ kê khai.
- Nghĩa vụ thông báo/đăng ký website thương mại điện tử nếu áp dụng.
- Điều khoản sử dụng, bảo mật, hoàn tiền, hỗ trợ và xử lý khiếu nại.
- Hóa đơn/chứng từ, đối soát SePay và lưu nhật ký giao dịch.

Có thể hoàn thiện prototype trước, nhưng nên hoàn tất phần chủ thể và tuân thủ trước khi mở bán công khai hoặc nhận tiền thật. Phần này chỉ là bối cảnh sản phẩm, không thay thế tư vấn pháp lý/kế toán cập nhật.

## 7. Các trang hiện có

- `/` — dashboard học hôm nay, ôn tập, mục tiêu tuần và CTA VIP.
- `/courses` — tìm kiếm/lọc lộ trình ngành.
- `/learn/van-phong-hanh-chinh` — không gian bài học gồm từ vựng, hội thoại và ghi chú.
- `/practice` — “Kho ca làm” responsive theo 4 ngành, ca miễn phí/VIP, bài tập xử lý từng lượt và flashcard ôn nhanh.
- `/vip` — gói VIP và mô tả quy trình mua.
- `/admin` — dashboard quản trị đọc thống kê và audit thật từ PostgreSQL.
- `/admin/courses` và các trang chi tiết — CRUD lộ trình, module, bài học.
- `/admin/vocabulary` và trang chi tiết — CRUD kho từ vựng dùng chung.

`/courses` và `/learn/[slug]` đã đi qua repository phía server. PostgreSQL Neon trong workspace đã được migrate và seed qua `.env.local` (tệp bị Git bỏ qua); nếu môi trường khác chưa có `DATABASE_URL` thì ứng dụng fallback sang catalog/nội dung mẫu cục bộ. Source nội dung “Văn phòng & hành chính” hiện tổ chức thành 4 module, 24 bài và 144 từ vựng; cần chạy lại seed ở môi trường chưa đồng bộ. `LessonWorkspace` và flashcard không còn đọc dữ liệu bài học từ `lib/course-data.ts`. Đăng ký/đăng nhập, xác minh email, quên/reset mật khẩu, rate-limit, session, RBAC, tiến độ, lịch ôn, Admin CRUD và Kho ca làm đã nối thật. Ca VIP được lọc ở server để không gửi đáp án trả phí xuống client chưa có quyền. Resend có thể cấu hình sau khi có domain; SePay chưa làm.

## 8. Thiết kế đã duyệt

Hướng hình ảnh cuối cùng kết hợp hai concept: bố cục học tập sáng, rõ ràng của bản aqua với không khí buổi sáng thành thị ấm áp của bản ivory/city.

- Màu chính: deep pine/emerald, ivory sáng, aqua nhẹ, điểm coral và gold.
- Không tương phản gắt; nội dung vẫn rõ và chuyên nghiệp, không quá cơ bản.
- Desktop có rail trái, top bar, cột bài học chính và cột ôn tập/mục tiêu/VIP.
- Mobile bỏ rail, chuyển một cột và dùng bottom navigation bốn mục.
- `LearnerAppShell` áp dụng chrome này cho toàn bộ route học viên: trang chủ, lộ trình, bài học, Kho ca làm, VIP và tài khoản. Auth và `/admin/*` chủ ý dùng layout riêng.
- Hình chuẩn: `docs/design-target/approved-combined-dashboard.png`.
- Ảnh triển khai: `docs/design-qa/dashboard-combined-desktop.png` và `docs/design-qa/dashboard-combined-mobile.png`.
- So sánh nguồn/triển khai: `docs/design-qa/dashboard-combined-comparison.png`.
- Asset nền runtime: `public/assets/hanziwork-dashboard-background.png`.
- `/courses` có header editorial mới và bảy ảnh chủ đề riêng tại `public/assets/courses/`; mapping slug/alt text ở `lib/course-visuals.ts`.
- Ảnh QA mới: `docs/design-qa/course-library-desktop.png`, `course-library-mobile.png`, `course-library-comparison.png` và `course-covers-contact-sheet.webp`.

Không thay palette, cấu trúc trang chủ hoặc asset nền nếu chưa được chủ dự án yêu cầu. Khi mở rộng trang khác, tái sử dụng cùng design language.

## 9. Kiến trúc kỹ thuật hiện tại

- Next.js App Router + React + TypeScript, chạy qua Vinext/Vite.
- CSS responsive tập trung ở `app/globals.css`.
- PostgreSQL + Drizzle ORM; schema ở `db/schema.ts`.
- Runtime tạo PostgreSQL client ngắn hạn trong từng thao tác đọc/ghi để không tái sử dụng I/O giữa request Cloudflare/Vinext; client singleton chỉ dành cho script CLI.
- Production local chạy bằng `npm start` sau `npm run build`; script dùng Wrangler/Workerd để khớp Cloudflare target và nạp `.env.local` bằng đường dẫn tuyệt đối. Không dùng trực tiếp `vinext start` cho bundle này vì Node không hỗ trợ module protocol `cloudflare:` của PostgreSQL driver đã bundle.
- Staging Cloudflare đã hoạt động tại Worker `hanziwork-staging`, có `/api/health` kiểm tra PostgreSQL, script nạp secret qua stdin và E2E tự dọn fixture. Hướng dẫn vận hành nằm trong `README.md`.
- Catalog và nội dung “Văn phòng & hành chính” đã có repository PostgreSQL, migration và seed idempotent; hướng dẫn chạy ở `README.md`.
- Quyền bài học được kiểm tra ở server: 6 bài đầu miễn phí; 18 bài chuyên sâu là VIP và nội dung bị khóa không được gửi xuống client ẩn danh.
- Auth dùng `users`, `auth_sessions`, `auth_tokens` và `auth_rate_limits`; đăng ký công khai chỉ tạo `learner`, yêu cầu xác minh email trước session, còn `/admin` yêu cầu vai trò `admin` từ DB. Mật khẩu mới dùng `pbkdf2-sha256-v2` với 100.000 vòng, salt riêng và HMAC pepper từ `AUTH_SECRET` để chạy đúng trên Workerd. Hash cũ 600.000 vòng cần được đặt lại trước khi tài khoản cũ đăng nhập Worker. Token xác minh/reset chỉ lưu hash, dùng một lần; IP/email trong rate-limit/audit dùng HMAC với `AUTH_SECRET`. Tài khoản admin đầu tiên đã được bootstrap trên Neon và mật khẩu tạm không được ghi vào repository/tài liệu.
- `lesson_progress` lưu lần mở và hoàn thành bài; `review_items` lưu kết quả tự đánh giá và ngày ôn tiếp theo. Dashboard/tài khoản đọc số liệu này theo session hiện hành.
- Admin CRUD quản lý course/module/lesson/vocabulary thật. Lesson editor ghi `content_versions`, liên kết `lesson_vocabulary`, tính lại thống kê course và ghi mọi mutation vào `audit_logs`; xóa cứng bị chặn khi có dữ liệu phụ thuộc hoặc nội dung đã xuất bản.
- `/admin/subscriptions` quản lý entitlement VIP thủ công cho học viên đã xác minh: cấp mới, gia hạn nối tiếp từ hạn hiện tại và thu hồi tức thì. Mutation khóa hàng người dùng trong transaction để tránh cộng trùng, đồng thời ghi audit riêng cho `granted/extended/revoked`. `/account` hiển thị tên gói, hạn dùng và số ngày còn lại từ subscription thật.
- `vip_activation_requests` khép kín bước nâng cấp trước thanh toán: mỗi learner có tối đa một yêu cầu pending, có thể đổi/hủy; admin duyệt hoặc từ chối kèm ghi chú. Duyệt và cấp/gia hạn subscription dùng cùng transaction; `/vip` và `/account` đều đọc trạng thái thật.
- `notifications` lưu hộp thư theo user. Duyệt/từ chối VIP tạo thông báo trong cùng transaction; chuông trong learner shell có unread badge, `/notifications` hỗ trợ mở/đọc từng mục hoặc đọc tất cả. Unread count nằm trong truy vấn session hiện có để không thêm một Neon round-trip khi chuyển trang.
- Luyện ca đọc 7 nhóm ngành, 22 ca và 66 lượt nghe từ PostgreSQL; đủ 66/66 MP3 đã nằm trên Cloudinary và không còn blob audio trong PostgreSQL. Trong đó 24 lượt miễn phí đã duyệt, 42 lượt VIP mới giữ `pending` để người thành thạo Quan thoại nghe duyệt trước khi phát cho học viên.
- Các vai trò `learner`, `editor`, `reviewer`, `admin` đã được triển khai. Hàng đợi kiểm duyệt Luyện ca có người phụ trách, ưu tiên, hạn/quá hạn; reviewer phải tự nhận hoặc được admin phân công trước khi duyệt.
- Mỗi audio Luyện ca có trạng thái QA `pending/approved/re_record`, checklist lỗi và ghi chú reviewer. Thay file hoặc sửa transcript sẽ đưa audio về `pending`; chỉ audio `approved` mới được phát cho học viên và mọi lượt phải đạt QA trước khi xuất bản ca.
- Các bảng đã thiết kế còn gồm `practice_industries`, `practice_scenarios`, `practice_exercises`, `practice_audio_assets`, `practice_scenario_versions`, `practice_attempts` và `game_attempts` ngoài các bảng học, auth, VIP, payment và audit ban đầu.
- Flutter sau này gọi chung API; không đặt logic xác minh thanh toán trong APK.

## 10. Trạng thái kiểm tra gần nhất

- CTA “Bắt đầu bài học” mở đúng `/learn/van-phong-hanh-chinh`.
- Mobile nav “Lộ trình” mở đúng `/courses`.
- Shared learner shell đã được rà trên `/`, `/courses`, `/learn/van-phong-hanh-chinh`, `/practice` và `/vip`: mỗi trang có đúng một rail/top bar, active state đúng; auth/admin không nhận shell học viên.
- Desktop được so sánh ở khung 1487 × 1058.
- Mobile được kiểm tra ở 390 × 844 và không còn tràn ngang. `/courses` có hero một cột, ảnh đúng crop và filter hoạt động.
- Shared learner nav prefetch route chính, đổi active state ngay khi bấm và có progress bar; `/courses`/`/practice` có loading UI, catalog course được stream sau hero.
- Console không có warning/error trong các luồng chính đã thử.
- Admin CRUD E2E đã chạy đủ tạo → sửa → version → liên kết từ → chặn xoá phụ thuộc → gỡ liên kết → xoá sạch trên Neon.
- Form editor được remount theo entity để không giữ nhầm `defaultValue` khi chuyển nhanh giữa course/module/lesson bằng client navigation.
- E2E quyền VIP đã chạy trên Neon: cấp 30 ngày → mở nội dung Lộ trình/Luyện ca → gia hạn thêm 180 ngày từ hạn cũ → thu hồi → server trả lại DTO khóa cho học viên và khách. Không có dữ liệu hoặc tài khoản kiểm thử còn lại.
- Staging Cloudflare đã deploy thành công. E2E từ HTTPS Worker đã qua health/Neon, route công khai, đăng ký khi chưa có Resend, đăng nhập learner/admin, RBAC, `pending → approved` VIP, unread notification, entitlement và audio redirect sang Cloudinary; fixture QA còn lại: 0.
- `npm run auth:password-audit` hiện báo 4 tài khoản dùng hash legacy 600.000 vòng. Chưa tự đổi vì hệ thống không có plaintext; cần đặt lại từng tài khoản trước khi dùng Worker thật.
- `npx tsc --noEmit`: passed.
- `npm test`: 91/91 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Báo cáo chính thức: `design-qa.md`, kết quả `final result: passed`.

## 11. Thứ tự phát triển đề xuất

1. Xoay lại Cloudinary key, mật khẩu Neon và `AUTH_SECRET` đã xuất hiện trong ảnh chụp; cập nhật `.env.local` bằng credential mới rồi kiểm tra đăng nhập/audio.
2. Cho người thành thạo Quan thoại nghe duyệt 42 audio VIP đang `pending`; cả 14 ca VIP hiện đạt 6/7 điều kiện và chỉ còn thiếu xác nhận chất lượng audio.
3. Mở rộng số ca VIP theo 7 nhóm ngành, ưu tiên ca khó/điểm đau nghề nghiệp thay vì tăng nội dung dàn trải.
4. Đặt lại mật khẩu cho tài khoản có hash cũ trước khi dùng staging/production; admin dùng `npm run admin:create`, learner dùng luồng reset sau khi có email hoặc quy trình hỗ trợ thủ công có xác minh.
5. Đo phễu `xem VIP → gửi yêu cầu → được duyệt → dùng nội dung VIP`, đồng thời mở rộng thông báo cho lịch ôn và ca sắp quá hạn.
6. Bổ sung preview/khôi phục phiên bản bài học và bộ lọc audit cho admin; Luyện ca đã có phiên bản/khôi phục riêng.
7. Khi có domain, cấu hình Resend, smoke-test email và lên lịch `npm run auth:cleanup`.
8. Hoàn thiện chủ thể kinh doanh, chính sách và quy trình hỗ trợ.
9. Tích hợp SePay sandbox/test, webhook idempotent và đối soát.
10. Kiểm thử bảo mật, backup, theo dõi lỗi rồi mới mở thanh toán thật.
11. Đo tỷ lệ hoàn thành bài đầu, quay lại ngày 7 và chuyển đổi VIP trước khi làm Flutter.

## 12. Quy tắc cho người/agent tiếp tục

- Không khởi tạo lại project và không thay Next.js bằng một prototype khác.
- Trước khi sửa, chạy `git status` và giữ nguyên thay đổi không thuộc task.
- Không commit secret; dùng `.env.local` và giữ `.env.example` chỉ chứa tên biến.
- Không bật thanh toán thật khi chưa có webhook an toàn và phần pháp lý/chính sách.
- Không đưa nội dung kế toán, pháp lý, y tế vào MVP nếu chưa có người chuyên môn duyệt.
- Không thêm chấm điểm giọng nói/AI khi chưa có yêu cầu và ngân sách rõ ràng.
- Mọi trang mới phải responsive cho laptop và màn hình điện thoại 390 px.
- Sau thay đổi lớn, chạy `npm test`, `npm run lint`, `npm run build` và cập nhật `docs/SESSION_CHANGELOG.md`.
