# Nhật ký bàn giao phiên làm việc

## 2026-07-31 — Điều hướng nhanh, header mới và bảy ảnh chủ đề

### Phần đã thay đổi

- Learner nav chủ động prefetch bốn route chính lúc trình duyệt rảnh và khi hover/focus; active state đổi ngay khi bấm, kèm progress bar dưới top bar.
- Thêm loading UI riêng cho `/courses` và `/practice`. Trang lộ trình render header tĩnh trước rồi stream catalog qua Suspense, tránh chặn toàn màn hình vì PostgreSQL.
- Cache 5 phút danh sách vocabulary công khai của Kho ca làm theo `limit` và quyền free/VIP; hàng đợi ôn cá nhân vẫn truy vấn riêng theo `userId`.
- Thiết kế lại header `/courses` theo hướng editorial pine/ivory, hierarchy gọn hơn và responsive cho desktop/mobile.
- Tạo bảy ảnh chủ đề bằng ImageGen, tối ưu WebP 2048 × 730 còn 62–96 KB và gắn theo slug qua `lib/course-visuals.ts`.
- Thay các mảng màu cover bằng ảnh thật, giữ tag level/chữ Hán, alt text và trạng thái sắp ra mắt.

### Kiểm tra

- Browser desktop 1440 × 1050 và mobile 390 × 844: không tràn ngang, crop ảnh đúng, hero/filter/card/bottom nav không chồng nhau.
- Bảy asset và ba ảnh hero đều tải hoàn chỉnh; filter Nhà máy/Tất cả hoạt động; console cuối không có warning/error.
- Request local sau warm cache: khoảng 190–450 ms. Ảnh so sánh và contact sheet nằm trong `docs/design-qa/`.
- `npx tsc --noEmit`: passed.
- `npm test`: 37/37 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Bằng chứng QA

- `docs/design-qa/course-library-desktop.png`
- `docs/design-qa/course-library-mobile.png`
- `docs/design-qa/course-library-comparison.png`
- `docs/design-qa/course-covers-contact-sheet.webp`

## 2026-07-31 — Shared learner shell cho toàn bộ trang học viên

### Phần đã thay đổi

- Tách rail pine, top bar và bottom navigation khỏi riêng trang chủ thành `components/learner-app-shell.tsx`, được gắn một lần tại root layout.
- Áp dụng thống nhất cho `/`, `/courses`, `/learn/*`, `/practice`, `/vip` và `/account`; active state đi theo URL hiện tại, trong đó bài học thuộc mục “Lộ trình”.
- Gỡ chrome bị lặp khỏi trang chủ và Kho ca làm, đồng thời chuẩn hóa offset nội dung 100/78 px trên desktop/tablet và 68 px top bar + 78 px bottom nav trên mobile.
- Giữ riêng giao diện auth và `/admin/*`, nên luồng quản trị không bị lẫn sidebar học viên.
- Bằng chứng QA: `docs/design-qa/shared-shell-courses-desktop.png`, `docs/design-qa/shared-shell-courses-mobile.png` và `docs/design-qa/shared-shell-comparison.png`.

### Kiểm tra

- Browser desktop: trang chủ, lộ trình, Kho ca làm, bài học và VIP đều có đúng một rail/top bar; active state đúng và không tràn ngang.
- Browser mobile: rail ẩn, bottom navigation hiện, active state đúng và `scrollWidth` bằng `clientWidth` trên năm route học viên.
- `/login` và `/admin/login`: không có learner rail/top bar; site header/footer riêng vẫn hiển thị.
- Console: 0 warning/error trong các route đã rà.
- `npx tsc --noEmit`: passed.
- `npm test`: 29/29 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## 2026-07-31 — Kho ca làm responsive và luồng luyện tình huống

### Phần đã thay đổi

- Thay `/practice` dạng flashcard đơn bằng “Kho ca làm” theo hướng thiết kế số 2 đã duyệt: rail pine, typography gọn, nhiều khoảng trắng, tab ngành dạng text và trạng thái VIP tinh tế.
- Thêm 13 tình huống cho Văn phòng, Nhà máy, Kho vận và Bán hàng; mỗi ca có bối cảnh, câu Trung trọng tâm, pinyin, bản dịch, ba kỹ năng và ba lượt chọn có giải thích.
- Có 5 ca mẫu miễn phí (ít nhất một ca mỗi ngành). Repository phía server bỏ toàn bộ `exercises` khỏi DTO của ca VIP khi subscription không hợp lệ; client chỉ nhận phần xem trước và CTA nâng cấp.
- Thêm luồng xử lý ca hoàn chỉnh: tiến độ, chấm đúng/sai, giải thích ngay, kết quả cuối và số ca đã luyện lưu cục bộ trên thiết bị. Flashcard và lịch ôn PostgreSQL cũ được giữ trong nhánh “Từ cần ôn hôm nay”.
- Bổ sung thử thách tuần liên kết bài học, cột tóm tắt luyện tập và card quyền lợi VIP. Mobile dùng top bar gọn, tab cuộn ngang và bottom navigation; document 390 px không tràn ngang.
- Lưu hình chuẩn, ảnh desktop/mobile và ảnh so sánh tại `docs/design-target/practice-hub-modern.png` cùng `docs/design-qa/practice-hub-*.png`.

### Kiểm tra

- Browser E2E: mở ca miễn phí, chọn đáp án đúng, nhận giải thích, chuyển lượt; mở ca VIP thấy nudge nâng cấp và không có nút/đáp án bài tập trả phí.
- Desktop và mobile 390 × 844: passed; console không có warning/error.
- `npx tsc --noEmit`: passed.
- `npm test`: 24/24 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Bước tiếp theo

- Lưu lịch sử/điểm xử lý ca theo `userId`, sau đó đưa tình huống và thử thách tuần vào Admin CRUD để biên tập không cần sửa source.

## 2026-07-31 — Admin CRUD nội dung trên PostgreSQL

### Phần đã thay đổi

- Thay dashboard admin mẫu bằng số liệu thật: người dùng, VIP hoạt động, bài theo trạng thái, lộ trình và audit gần đây.
- Thêm CRUD lộ trình, module, bài học và kho từ vựng tại `/admin/courses`, các trang chi tiết lồng nhau và `/admin/vocabulary`.
- Lesson editor lưu hội thoại, ghi chú, trạng thái, bài miễn phí và liên kết `lesson_vocabulary`; mỗi lần lưu tạo một snapshot mới trong `content_versions`.
- Mọi Server Action kiểm tra session/role admin, giới hạn input phía server, chạy mutation và audit trong transaction, rồi revalidate/redirect về entity tương ứng.
- Thêm quy tắc xóa an toàn: không xóa course đã xuất bản/còn module, module còn bài, bài đã xuất bản/có tiến độ, hoặc từ còn liên kết/lịch ôn.
- Sửa kết nối DB theo request để tương thích Cloudflare/Vinext, tránh tái sử dụng stream PostgreSQL giữa hai request. Read có retry ngắn; write không tự retry để tránh lặp mutation.
- Thêm `key` theo entity cho các form không kiểm soát, ngăn dữ liệu course/module cũ bị giữ lại khi client navigation sang lesson editor.
- `.env.local` đã có `AUTH_SECRET` ngẫu nhiên và tùy chọn cookie local; tệp vẫn bị Git bỏ qua. Không cần migration mới cho Admin CRUD vì schema hiện có đã đủ.

### Kiểm tra

- Browser E2E trên Neon: tạo course → module → lesson → vocabulary; sửa nghĩa; lưu lesson thành `review`; tạo v2/v3; liên kết từ; xác nhận xóa từ bị chặn; gỡ liên kết rồi xóa sạch lesson/module/course/vocabulary.
- Dashboard cuối cùng có 7 lộ trình, 6 bài đã xuất bản, không còn draft/review hoặc nội dung kiểm thử; không overlay, không console error và không tràn ngang.
- Tài khoản, session, audit và rate-limit dùng cho E2E đã được xóa khỏi Neon.
- `npx tsc --noEmit`: passed.
- `npm test`: 20/20 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Bước tiếp theo

- Tách quyền `editor`/`reviewer` và siết transition xuất bản; sau đó thêm preview/khôi phục content version và bộ lọc audit.
- Resend để sau khi có domain gửi thật; không chặn việc tiếp tục hoàn thiện nội dung/admin.

## 2026-07-31 — Hoàn thiện auth production và khôi phục tài khoản

### Phần đã thay đổi

- Thêm migration `drizzle/0004_hesitant_cerise.sql`: `users.email_verified_at`, `auth_tokens` và `auth_rate_limits`; migration đã áp dụng thành công trên Neon. Hai tài khoản có sẵn được backfill xác minh để không bị khóa nhầm.
- Learner mới không còn nhận session ngay sau đăng ký. Email phải được xác minh bằng token ngẫu nhiên 256-bit, lưu dạng hash, dùng một lần và hết hạn sau 24 giờ.
- Thêm `/forgot-password` và `/reset-password`; token reset hết hạn sau 30 phút. Reset thành công xác nhận quyền sở hữu email, đổi mật khẩu và thu hồi toàn bộ session/token còn lại; token dùng lại bị từ chối.
- Thêm rate-limit PostgreSQL cho đăng nhập, đăng ký, gửi lại xác minh, quên mật khẩu, xác minh và reset. Lần đăng nhập sai thứ 9 trong cùng cặp email/IP bị chặn 15 phút và trả `Retry-After`.
- IP/email trong rate-limit và audit dùng HMAC-SHA256 với `AUTH_SECRET`; không lưu IP/email thô trong metadata bảo mật. Chỉ tin header proxy khi chạy trên Vercel hoặc khi bật rõ biến trust tương ứng.
- Tích hợp adapter gửi email qua Resend REST API với idempotency key. Development thiếu key in link vào terminal; production thiếu `RESEND_API_KEY`/`RESEND_FROM_EMAIL` sẽ fail rõ ràng.
- Ghi sự kiện đăng nhập, đăng ký, xác minh, reset/đổi mật khẩu và logout vào `audit_logs`. Thêm `npm run auth:cleanup` để dọn session/token/rate-limit cũ.
- Bật `allowImportingTsExtensions` để `npx tsc --noEmit` kiểm tra được toàn bộ cấu trúc import `.ts` hiện có.

### Kiểm tra

- Browser E2E: đăng ký → xác minh → logout → yêu cầu reset → đổi mật khẩu → token cũ bị từ chối → mật khẩu cũ thất bại → mật khẩu mới đăng nhập thành công.
- Rate-limit E2E: 8 lần sai trả thông báo chung; lần thứ 9 trả `rate_limited` và `Retry-After`.
- Không có console error, error overlay hoặc tràn ngang. Tài khoản, token, session, audit và rate-limit thử nghiệm đã được xóa khỏi Neon.
- Neon sau cleanup không còn user/token/session mang domain kiểm thử.
- `npx tsc --noEmit`: passed.
- `npm test`: 17/17 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Việc còn lại trước deploy production

- Tạo/kiểm tra domain gửi Resend và điền `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET` trong môi trường deploy.
- Lên lịch chạy `npm run auth:cleanup` và cấu hình cảnh báo theo `audit_logs`/lỗi gửi email.
- Sau đó phát triển Admin CRUD, editor/reviewer/publish trên dữ liệu thật.

## 2026-07-31 — Tiến độ bài học và lịch ôn theo người dùng

### Phần đã thay đổi

- Thêm `lib/progress-repository.ts` cho ba mutation phía server: ghi lần mở bài, hoàn thành bài và đánh giá từ vựng.
- `LessonWorkspace` đọc trạng thái từ `lesson_progress`, tự ghi `last_opened_at` khi người dùng hợp lệ mở bài và POST hoàn thành qua server. Trạng thái không còn chỉ tồn tại trong React state.
- Endpoint tiến độ xác thực session, kiểm tra bài đã xuất bản và kiểm tra quyền free/VIP trước khi ghi. Request trực tiếp không thể đánh dấu bài VIP bị khóa.
- Thêm `lib/review-scheduler.ts`: lựa chọn đúng/sai cập nhật state, ease score, interval, số lần đúng/sai và `next_review_at` trong `review_items`.
- `/practice` đối với người đăng nhập chỉ lấy từ miễn phí chưa có lịch hoặc đã đến hạn; từ vừa đánh giá rời hàng đợi tới lần ôn sau. Người ẩn danh vẫn dùng flashcard nhưng được báo rõ kết quả không lưu.
- Dashboard và `/account` hiển thị số bài mở/hoàn thành và hàng đợi ôn từ PostgreSQL thay cho các con số tiến độ cố định.
- Gom các truy vấn trang bài học vào một PostgreSQL client ngắn hạn theo request, vẫn giữ nội dung VIP chỉ được đọc sau khi quyền đã được xác nhận. Thời gian reload bài trong dev giảm từ khoảng 10 giây xuống khoảng 2,6 giây ở lượt kiểm tra.

### Kiểm tra

- Learner thử nghiệm mở bài tạo một dòng `lesson_progress`; hoàn thành ghi 100% và vẫn hiển thị “Đã hoàn thành” sau reload.
- Đánh giá “Tôi đã nhớ” tạo một `review_item`, `correct_count = 1`, `interval_days = 1` và ngày ôn ở tương lai.
- Dashboard hiển thị 1/6 bài hoàn thành và loại từ vừa ôn khỏi danh sách gợi ý.
- Tài khoản thử cùng progress/review đã được xóa cascade; không còn dữ liệu tiến độ kiểm thử trên Neon.
- Browser không có console error, error overlay hoặc tràn ngang.
- `npm test`: 16/16 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Bước tiếp theo

- Hoàn thiện auth production: xác minh email, quên/đặt lại mật khẩu và rate-limit đăng nhập.
- Sau đó phát triển Admin CRUD, editor/reviewer/publish và audit log trên dữ liệu thật.

## 2026-07-31 — Nền tảng đăng nhập, session và admin RBAC

### Phần đã thay đổi

- Thêm migration `drizzle/0003_flashy_juggernaut.sql` và bảng `auth_sessions`; migration đã áp dụng thành công trên Neon.
- Thêm đăng ký learner, đăng nhập, đăng xuất, trang tài khoản và đổi mật khẩu. Đăng ký công khai không nhận trường role và luôn tạo `learner`.
- Mật khẩu được hash bằng PBKDF2-HMAC-SHA256 600.000 vòng với salt ngẫu nhiên riêng. Session token 256-bit chỉ lưu dạng SHA-256 trong DB; cookie dùng `HttpOnly`, `SameSite=Lax`, `Path=/` và `Secure` ở production.
- Các POST auth kiểm tra cùng origin; return path được giới hạn về đường dẫn nội bộ để tránh open redirect. Thông báo đăng nhập không phân biệt email sai hay mật khẩu sai.
- `/admin/login` là giao diện riêng cho quản trị nhưng dùng chung session. `/admin` đọc vai trò hiện tại từ DB và chỉ chấp nhận `admin`.
- Header và dashboard nhận người dùng hiện hành; trang bài học truyền `userId` thật vào kiểm tra subscription VIP phía server.
- Thêm `npm run admin:create` để tạo/xoay admin đầu tiên và thu hồi session cũ. Neon hiện có đúng một tài khoản admin bootstrap; không lưu mật khẩu vào tệp dự án.
- Thay PostgreSQL client singleton runtime bằng client ngắn hạn cho từng thao tác đọc/ghi. Việc này khắc phục giới hạn I/O xuyên request của Cloudflare/Vinext phát hiện khi thử logout.

### Kiểm tra

- Anonymous mở `/admin` được chuyển tới `/admin/login`.
- Đăng ký learner hoạt động; learner mở `/admin` bị từ chối phía server.
- Admin đăng nhập bằng session thật và mở được HanziWork Console; đăng xuất thu hồi session DB và xóa cookie.
- Tài khoản learner dùng cho kiểm thử đã bị xóa; DB còn 1 user/admin và 0 session thử.
- Không có error overlay hoặc tràn ngang trên màn hình admin đã kiểm tra.
- `npm test`: 15/15 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Phần auth còn lại trước production

- Xác minh email và luồng quên/đặt lại mật khẩu qua email.
- Giới hạn/rate-limit các lần đăng nhập thất bại và giám sát bất thường.
- Chính sách hết hạn/dọn session định kỳ và audit sự kiện bảo mật.

## 2026-07-31 — Hoàn tất lát cắt “Văn phòng & hành chính”

### Phần đã thay đổi

- Thêm migration `drizzle/0002_reflective_lilandra.sql` cho slug ổn định của module và từ vựng; migration đã được áp dụng thành công trên PostgreSQL Neon.
- Mở rộng seed idempotent thành 1 module, 6 bài mẫu, 36 từ vựng và 36 liên kết bài–từ vựng. Mỗi bài có ví dụ, hội thoại và ghi chú; 5 bài đầu miễn phí, bài thứ 6 yêu cầu VIP.
- Thêm `lib/lesson-repository.ts`, `lib/lesson-access.ts` và các kiểu nội dung dùng chung. `LessonWorkspace` và `/practice` nay đọc dữ liệu xuất bản qua repository phía server thay vì dữ liệu cứng trong `lib/course-data.ts`.
- Quyền bài học được quyết định trước khi đọc nội dung: request ẩn danh không được nhận từ vựng, hội thoại hoặc ghi chú của bài VIP. Nhánh kiểm tra subscription đã sẵn sàng để nối `userId` khi triển khai authentication.
- Thêm một lần retry cho truy vấn chỉ đọc để chịu được lỗi kết nối pooler Neon thoáng qua; các truy vấn độc lập được thực hiện song song.
- Nút audio tiếp tục bị vô hiệu hóa cho tới khi có audio thật; trạng thái hoàn thành bài vẫn chỉ là cục bộ và ghi rõ sẽ được thay bằng tiến độ theo tài khoản.

### Kiểm tra

- Seed chạy thành công trên Neon với 6 bài, 36 từ vựng và 36 liên kết.
- Bài miễn phí hiển thị đủ từ vựng, hội thoại và ghi chú; bài VIP chỉ hiển thị màn hình khóa và không rò nội dung vào client.
- `/practice` tải 12 từ từ các bài miễn phí và thao tác lật/đánh giá flashcard hoạt động.
- Không có overlay lỗi, lỗi console hoặc tràn ngang trong các luồng browser đã thử.
- `npm test`: 10/10 passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Bước tiếp theo

- Triển khai đăng ký/đăng nhập và truyền `userId` thật vào kiểm tra quyền server.
- Lưu hoàn thành bài, đánh giá flashcard và lịch ôn theo người dùng.

## 2026-07-31 — Neon đã được khởi tạo

### Phần đã thực hiện

- Tạo `.env.local` cục bộ và xác nhận tệp được `.gitignore` loại khỏi Git; không ghi chuỗi kết nối vào tài liệu.
- Chạy `npm run db:migrate` thành công trên PostgreSQL Neon để tạo/cập nhật toàn bộ bảng và cột từ migration hiện có.
- Chạy `npm run db:seed` thành công.
- Kiểm tra trực tiếp: 14 bảng ứng dụng, 18 cột ở `courses`, không thiếu các cột catalog bắt buộc, 7 lộ trình `published` và 3 gói VIP active.
- Khởi chạy ứng dụng với `.env.local`; `/courses` và `/learn/van-phong-hanh-chinh` đều trả HTTP 200 bằng catalog PostgreSQL.

## 2026-07-31 — Bắt đầu nối PostgreSQL cho catalog

### Phần đã thay đổi

- Thêm `lib/course-repository.ts`: đọc lộ trình `published` từ PostgreSQL và dùng catalog demo khi chưa có `DATABASE_URL`.
- Chuyển `/courses` và `/learn/[slug]` sang repository bất đồng bộ; giao diện và nội dung hiển thị hiện tại được giữ nguyên.
- Bổ sung các trường trình bày/tổng quan cần cho course card vào `db/schema.ts` và migration `drizzle/0001_mushy_donald_blake.sql`.
- Thêm `db/seed.ts` và lệnh `npm run db:seed`; seed có thể chạy lặp lại cho 7 lộ trình MVP và 3 gói VIP mẫu.
- Thêm `npm run db:migrate`; cấu hình Drizzle đọc `.env.local` giống ứng dụng.
- Thêm test kiểm tra catalog, slug duy nhất, chính sách 3–5 bài miễn phí và fallback không cần DB.

### Kiểm tra

- Ứng dụng baseline chạy tại local và dashboard trả HTTP 200.
- `/courses`: HTTP 200.
- `/learn/van-phong-hanh-chinh`: HTTP 200.
- `/learn/khong-ton-tai`: HTTP 404.
- `npm test`: 6/6 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `npm run db:generate`: sinh migration thành công.

### Phần còn lại của tầng dữ liệu

- Chưa chạy migration/seed trên PostgreSQL thật vì workspace chưa có `.env.local` hoặc `DATABASE_URL`.
- Nội dung chi tiết trong `LessonWorkspace` và flashcard vẫn dùng dữ liệu demo; repository hiện mới nối catalog lộ trình.
- Chưa có authentication, tiến độ theo người dùng hoặc quyền VIP phía server.

## 2026-07-31 — Dashboard kết hợp đã triển khai

### Phần đã thay đổi

- Cập nhật `app/globals.css` để trang chủ bám sát hình thiết kế đã duyệt.
- Thêm asset nền thật tại `public/assets/hanziwork-dashboard-background.png`.
- Desktop: rail emerald, top bar kính mờ, vùng bài học 816 px và cột phụ 354 px.
- Mobile: top bar toàn chiều rộng, nội dung một cột, CTA nổi và bottom navigation.
- Sửa lỗi mobile tràn ngang 509 px trong viewport 390 px bằng cách đặt lại `left`, `margin-left`, chiều rộng frame và grid cột phụ.
- Giữ nguyên các route, dữ liệu mẫu và tương tác đã tồn tại; không viết lại TSX chỉ để thay giao diện.

### Tài sản thiết kế được lưu vào project

- `docs/design-target/approved-combined-dashboard.png` — hình chuẩn đã duyệt.
- `docs/design-qa/dashboard-combined-desktop.png` — ảnh desktop sau triển khai.
- `docs/design-qa/dashboard-combined-mobile.png` — ảnh mobile sau triển khai.
- `docs/design-qa/dashboard-combined-comparison.png` — hình nguồn và triển khai đặt cạnh nhau.

### Kiểm tra

- CTA bài học: passed.
- Điều hướng mobile tới `/courses`: passed.
- Console warning/error: không có.
- `npm test`: 3/3 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- Design QA: `final result: passed`.

### Trạng thái chưa làm

- Chưa có authentication thật.
- Chưa nối PostgreSQL runtime hoặc seed dữ liệu thật.
- Chưa tích hợp SePay/webhook.
- Chưa có audio thật.
- Chưa có email giao dịch, backup, monitoring hoặc production deployment.
- Chưa mở thanh toán thật.

### Ghi chú worktree

Trong lúc làm việc, tệp khóa tạm Word `docs/~$nziWork_Blueprint_v0.2.docx` xuất hiện ở trạng thái deleted khi Word đóng. Đây không phải nội dung sản phẩm và không được phục hồi hay xóa chủ động trong phiên này.
