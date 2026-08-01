# HanziWork

Prototype web responsive cho sản phẩm học tiếng Trung chuyên ngành dành cho người đi làm. Giao diện được viết trực tiếp bằng Next.js nên có thể tiếp tục phát triển thành sản phẩm thật, không cần chuyển lại từ Figma.

> Bắt đầu một task Codex mới: đọc `CODEX_START_HERE.md` trước. Tệp này chứa toàn bộ bối cảnh cuộc trao đổi, quyết định sản phẩm, trạng thái triển khai và prompt bàn giao.

## Các màn hình đã có

- `/` — trang chủ và nhịp học hôm nay.
- `/courses` — tìm kiếm, lọc 7 lộ trình ngành.
- `/learn/[slug]` — bài học tương tác của bảy chuyên ngành đang mở, gồm từ vựng, hội thoại, ghi chú và kiểm tra module.
- `/practice` — “Kho ca làm” theo 7 ngành với 22 tình huống, ca mẫu miễn phí/VIP, chấm từng lượt và nhánh flashcard ôn nhanh.
- `/vip` — học thử, bảy gói lộ trình mua một lần, VIP thư viện dự kiến và khung chính sách.
- `/admin` — dashboard vận hành đọc số liệu thật từ PostgreSQL.
- `/admin/courses` — CRUD lộ trình; các trang chi tiết quản lý module và bài học.
- `/admin/vocabulary` — CRUD kho từ vựng dùng chung và số bài đang liên kết.
- `/login`, `/register`, `/account` — đăng nhập, đăng ký learner và quản lý mật khẩu.
- `/verify-email`, `/forgot-password`, `/reset-password` — xác minh email và khôi phục tài khoản bằng token một lần.
- `/admin/login` — cổng đăng nhập riêng về giao diện cho quản trị viên; dùng chung hệ thống tài khoản và session.

Các trang học viên `/`, `/courses`, `/learn/*`, `/practice`, `/vip` và `/account` dùng chung một application shell: sidebar pine + top bar trên laptop, bottom navigation bốn mục trên điện thoại. Route đăng nhập/xác minh mật khẩu và toàn bộ `/admin/*` giữ layout riêng để không trộn luồng học với luồng vận hành.

## Chạy dự án

Yêu cầu Node.js từ 22.13 trở lên.

```bash
npm install
npm run dev
```

Sau đó mở địa chỉ được in trong terminal. Thường là `http://localhost:3000`; nếu cổng này bận, hệ thống tự chuyển sang cổng tiếp theo.

Kiểm tra trước khi đưa code lên môi trường thật:

```bash
npm run lint
npm test
npm run build
```

## Công nghệ và cấu trúc

- Next.js App Router + React + TypeScript.
- CSS responsive dùng chung, tối ưu cho laptop, iOS và Android.
- PostgreSQL + Drizzle ORM được thiết kế sẵn trong `db/schema.ts`.
- Kết nối PostgreSQL runtime được tạo theo từng thao tác để tương thích giới hạn I/O theo request của Cloudflare/Vinext; script CLI vẫn dùng client riêng và đóng sau khi chạy.
- `app/` chứa các route; `components/` chứa thành phần giao diện và phần tương tác.
- `lib/course-data.ts` chỉ còn catalog demo/fallback; nội dung bài học dùng `lib/lesson-repository.ts` và kiểu dữ liệu chung ở `lib/content-types.ts`.
- `lib/lesson-access.ts` kiểm tra quyền miễn phí/VIP ở server trước khi repository đọc nội dung bài bị khóa.
- `lib/auth-session.ts` và `lib/auth-service.ts` quản lý session PostgreSQL, mật khẩu và DTO người dùng phía server.
- `lib/progress-repository.ts` lưu lần mở/hoàn thành bài và kết quả flashcard; `lib/review-scheduler.ts` tính lịch ôn tiếp theo.
- `docs/` mô tả phạm vi MVP, quy trình và roadmap.

## Điều hướng và ảnh lộ trình

- Shared learner nav chủ động prefetch bốn route chính khi trình duyệt rảnh, đồng thời prefetch lại khi hover/focus. Active state và thanh tiến trình phản hồi ngay khi bấm.
- `/courses` và `/practice` có route loading UI. Header `/courses` render trước, catalog PostgreSQL được stream qua Suspense; vocabulary công khai của Kho ca làm được cache 5 phút theo quyền free/VIP.
- Bảy ảnh chủ đề nằm tại `public/assets/courses/`, đều là WebP 2048 × 730 đã tối ưu. Mapping slug → ảnh/alt text nằm ở `lib/course-visuals.ts`.
- Ảnh và so sánh responsive được lưu tại `docs/design-qa/course-library-*.png` và `docs/design-qa/course-covers-contact-sheet.webp`.

## Nối PostgreSQL

1. Sao chép `.env.example` thành `.env.local`.
2. Điền `DATABASE_URL` của cơ sở dữ liệu PostgreSQL.
3. Chạy `npm run db:migrate` để áp dụng các migration trong `drizzle/`.
4. Chạy `npm run db:seed` để seed idempotent 7 lộ trình MVP, 3 gói VIP, 28 module thuộc bảy chuyên ngành đang mở, 168 bài cùng 1.008 từ vựng mẫu.
5. Khởi động lại ứng dụng. `/courses`, `/learn/[slug]` và `/practice` sẽ đọc dữ liệu đã xuất bản từ PostgreSQL.

Khi chưa có `DATABASE_URL`, ứng dụng tự dùng catalog demo để frontend vẫn chạy được. Sau mỗi lần sửa `db/schema.ts`, chạy `npm run db:generate` để tạo migration mới rồi kiểm tra SQL trước khi migrate.

Sáu bài đầu của mỗi lộ trình đang mở là miễn phí; 18 bài chuyên sâu còn lại yêu cầu VIP. Việc kiểm tra quyền diễn ra ở server và nội dung bài VIP không được gửi xuống client ẩn danh. Tiến độ và lịch ôn đã lưu theo người dùng; SePay và nhận tiền thật vẫn chưa được kết nối. Không đưa khóa API vào Git và không bật thanh toán trước khi hoàn thành thông tin chủ thể kinh doanh, điều khoản sử dụng, bảo mật và hoàn tiền.

## Tài khoản và quyền quản trị

- Đăng ký công khai luôn tạo vai trò `learner`; không có endpoint đăng ký admin.
- `/admin` đọc session và vai trò hiện hành từ PostgreSQL trước khi render. Learner bị chuyển về `/admin/login`.
- Mật khẩu dùng PBKDF2-HMAC-SHA256 với salt riêng; session cookie là `HttpOnly`, `SameSite=Lax`, bật `Secure` ở production và chỉ token hash được lưu trong DB.
- Learner mới không nhận session cho tới khi xác minh email. Token xác minh hết hạn sau 24 giờ; token đặt lại mật khẩu hết hạn sau 30 phút, chỉ dùng một lần và chỉ lưu dạng hash.
- Đăng nhập và các endpoint gửi token có rate-limit trong PostgreSQL. IP/email trong bộ đếm và `audit_logs` dùng HMAC với `AUTH_SECRET`, không lưu giá trị thô.
- Đặt lại hoặc đổi mật khẩu thu hồi toàn bộ session cũ. Sự kiện đăng nhập, xác minh, reset và logout được ghi vào `audit_logs`.
- Để tạo hoặc xoay tài khoản admin, đặt tạm `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_DISPLAY_NAME` trong môi trường của terminal rồi chạy `npm run admin:create`. Script cũng thu hồi các session cũ của tài khoản đó. Không ghi các biến này vào Git.
- `AUTH_COOKIE_SECURE` mặc định đi theo `NODE_ENV`. Chỉ đặt `0` khi chạy production build qua HTTP trên máy local; môi trường HTTPS thật phải để trống hoặc đặt `1`.

## Admin CRUD nội dung

- Chỉ session có vai trò `admin` mới mở trang hoặc gọi Server Action CRUD.
- Lộ trình → module → bài học được chỉnh sửa trực tiếp trên PostgreSQL. Lesson editor quản lý từ vựng liên kết, hội thoại, ghi chú, trạng thái miễn phí/VIP và tạo một `content_versions` mới sau mỗi lần lưu.
- Kho từ vựng hỗ trợ tạo, tìm, sửa và xem số bài đang sử dụng.
- Mọi mutation ghi `audit_logs` trong cùng transaction. Bộ đếm bài, phút học và bài miễn phí của lộ trình được tính lại sau khi thay đổi bài.
- Xóa cứng chỉ dành cho bản nháp an toàn: module phải rỗng, bài draft/review không có tiến độ, từ vựng không còn liên kết/lịch ôn. Nội dung đã xuất bản nên chuyển sang `archived`.

## Email xác minh và đặt lại mật khẩu

- Production cần `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `RESEND_API_KEY` và `RESEND_FROM_EMAIL`. Địa chỉ gửi phải thuộc domain đã xác minh với Resend.
- Khi chạy development mà chưa có Resend, link xác minh/reset được in vào terminal để kiểm thử; production thiếu cấu hình sẽ báo lỗi và không giả vờ đã gửi thành công.
- Trên Vercel, ứng dụng chỉ tin `x-forwarded-for` do nền tảng ghi đè. Nếu tự triển khai sau reverse proxy hoặc Cloudflare, chỉ bật `AUTH_TRUST_X_FORWARDED_FOR=1` hoặc `AUTH_TRUST_CF_CONNECTING_IP=1` khi proxy thực sự ghi đè header từ client.
- Chạy `npm run auth:cleanup` định kỳ để xóa session/token hết hạn và bộ đếm rate-limit cũ.

## Tiến độ học và lịch ôn

- Khi người dùng đăng nhập mở bài miễn phí hoặc bài VIP hợp lệ, `last_opened_at` được cập nhật trong `lesson_progress`.
- Nút “Hoàn thành bài” ghi 100%, `completed_at` và giữ trạng thái sau khi tải lại/đăng nhập lại.
- Hai lựa chọn flashcard ghi vào `review_items`, cập nhật số lần đúng/sai, hệ số ghi nhớ, khoảng cách và `next_review_at`.
- `/practice` ưu tiên từ chưa học hoặc đã đến lịch ôn; từ vừa đánh giá được tạm rời hàng đợi đến lần ôn tiếp theo. Kho ca làm có 8 tình huống thử miễn phí và khóa phần bài tập của ca VIP ở server; người chưa có VIP chỉ nhận metadata, bối cảnh và câu mẫu, không nhận đáp án bài tập trả phí.
- Dashboard và trang tài khoản hiển thị số bài đã mở/hoàn thành từ DB. Người chưa đăng nhập vẫn học thử nhưng tiến độ không được ghi.

Đăng nhập, xác minh email, reset mật khẩu, rate-limit, RBAC, tiến độ bài học, lịch ôn, Admin CRUD và Kho ca làm responsive đã hoạt động. Bước tiếp theo hợp lý là lưu lịch sử xử lý ca theo tài khoản và đưa tình huống vào Admin CRUD; Resend có thể để sau khi có domain gửi thật.
