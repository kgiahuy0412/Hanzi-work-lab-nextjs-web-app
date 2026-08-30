# Nhật ký bàn giao phiên làm việc

## 2026-08-29 — Chi tiết lộ trình cho 7 chuyên ngành

### Phần đã thay đổi

- Thêm route `/courses/[slug]` cho toàn bộ 7 chuyên ngành; thẻ khóa học tại `/courses` nay mở trang tổng quan lộ trình trước khi vào bài học.
- Tạo mô hình lộ trình dùng dữ liệu khóa học thật: 24 bài được chia thành 4 chặng, đồng bộ bài đã hoàn thành, bài kế tiếp, thời lượng, tỷ lệ tiến độ và quyền VIP của người học.
- Triển khai giao diện bám ảnh tham chiếu với timeline 4 chặng, chặng hiện tại mở 6 bài, trạng thái hoàn thành/đang học/khóa, CTA vào đúng bài, thẻ tổng quan và gợi ý từ Himi.
- Bổ sung responsive desktop/mobile, trạng thái đăng nhập và liên kết nâng cấp VIP. Mobile không tràn ngang và CTA chính giữ vùng chạm cao 44 px.
- Thêm test hồi quy cho mô hình tuần tự, rào VIP, fallback không database, liên kết từ danh mục và route tĩnh của cả 7 chuyên ngành.
- Hoàn tất Design QA bằng ảnh trình duyệt desktop/mobile và hai ảnh đối chiếu trực tiếp với nguồn; kết quả không còn khác biệt P0/P1/P2.

### Kiểm tra

- Test riêng lộ trình: 4/4 passed.
- HTTP smoke test: cả 7 route `/courses/[slug]` trả `200` và có giao diện lộ trình.
- `npm run build`: passed; route động `/courses/:slug` xuất hiện trong output.
- `npm run lint`: 0 errors; còn 1 warning không thuộc thay đổi này trong `tests/hsk-curriculum.test.mjs`.
- `npm test`: 118/122 passed; 4 assertion cũ trong `tests/rendered-html.test.mjs` đang không khớp các màn hình Home/Games đã được thay đổi độc lập.
- `npx tsc --noEmit`: còn 4 lỗi có sẵn trong `lib/admin-analytics-service.ts`; không có lỗi TypeScript từ các file lộ trình.

## 2026-08-10 — Staging Cloudflare và E2E xuyên suốt

### Phần đã thay đổi

- Thêm `wrangler.jsonc` cho Worker `hanziwork-staging`, `/api/health` kiểm tra cả ứng dụng và Neon nhưng không trả lỗi hay cấu hình nhạy cảm, cùng ba lệnh `deploy:staging`, `staging:secrets` và `verify:staging`.
- Secret staging chỉ được lấy từ `.env.local` và truyền qua stdin của Wrangler; source chỉ chứa allowlist tên biến. Cookie được ép `Secure`, chỉ tin `CF-Connecting-IP` trên Worker và không tin `x-forwarded-for`.
- Viết E2E HTTPS tạo learner/admin QA tạm rồi kiểm tra đăng ký, đăng nhập, RBAC, yêu cầu và duyệt VIP qua Server Actions thật, notification, entitlement và media route Cloudinary. Fixture được dọn trong `finally`, kể cả khi một boundary thất bại.
- Phát hiện Workerd từ chối PBKDF2 trên 100.000 vòng. Mật khẩu mới chuyển sang định dạng `pbkdf2-sha256-v2` gồm PBKDF2-HMAC-SHA256 100.000 vòng, salt riêng và HMAC pepper bằng `AUTH_SECRET`; verifier vẫn nhận diện hash legacy để Node local có thể đọc. Tài khoản mang hash 600.000 vòng cần đặt lại mật khẩu trước khi đăng nhập Worker.
- Server Action native render `multipart/form-data`; verifier đã dùng `FormData` giống trình duyệt thay vì giả lập bằng `application/x-www-form-urlencoded`.
- ESLint bỏ qua `.wrangler/` giống `dist/` và `.next/` vì đây là bundle generated sau deploy, không phải source cần lint.
- Thêm `auth:password-audit` chỉ thống kê số tài khoản theo phiên bản hash, không in email hoặc chuỗi hash, để lập kế hoạch đặt lại tài khoản legacy.
- Thêm `auth:password-migrate`: xác minh mật khẩu legacy bằng Node local, chỉ khi đúng mới rehash sang v2 trong transaction, thu hồi session/token cũ và không thay role/trạng thái tài khoản.

### Triển khai và kiểm tra

- Staging public: `https://hanziwork-staging.giahuy041204.workers.dev`, version đã kiểm tra: `d3d39950-b8b9-4189-ac72-52ddd660e6f8`.
- `/api/health` trả `200`, `status=ok`, `database=ok` sau khi nạp secret.
- E2E cuối qua toàn bộ route công khai, đăng ký thiếu Resend trả đúng trạng thái `delivery_failed` và không tạo session, learner/admin login, chặn learner khỏi admin, VIP `pending → approved`, unread notification, entitlement active và audio `307 → Cloudinary 200`.
- Log Worker không còn lỗi runtime/database/auth; cảnh báo gửi email là hành vi dự kiến vì staging chưa cấu hình Resend.
- `qaUsersRemaining`: 0.
- Audit hiện đếm 4 tài khoản còn dùng `pbkdf2-sha256` legacy; chưa tự đổi mật khẩu vì không có plaintext và không được phép đặt mật khẩu thay người dùng.
- `npm test`: 91/91 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## 2026-08-10 — Sửa production runtime cho PostgreSQL/Cloudflare

### Nguyên nhân và phần đã thay đổi

- Xác định lỗi `500` không nằm ở schema hay Neon: Cloudflare plugin đã bundle biến thể `postgres/cf`, nhưng `vinext start` lại nạp production bundle bằng Node. Node không xử lý được import `cloudflare:sockets` và trả `ERR_UNSUPPORTED_ESM_URL_SCHEME` cho mọi Server Component chạm database.
- Thay `npm start` bằng `scripts/start-production.ts`, phục vụ chính bundle trong Wrangler/Workerd để khớp target của `vite.config.ts`. Script kiểm tra build/CLI/env trước khi chạy, tự chọn `.env.local` hoặc `.env`, chuyển env thành đường dẫn tuyệt đối, mặc định cổng `3000` và vẫn nhận `--port` hoặc biến `PORT`.
- Có thể đặt `HANZIWORK_ENV_FILE` khi cần file môi trường khác. Script không in giá trị secret và không thay đổi quy trình build/deploy Cloudflare.
- Bổ sung log lỗi database ở lần thất bại cuối cùng; chuỗi kết nối và query params được che trước khi ghi log, đồng thời vẫn giữ mã lỗi/chuỗi `cause` để điều tra production.
- Thêm test hồi quy khóa lệnh start, Worker runtime, cách truyền env tuyệt đối và việc che thông tin nhạy cảm.

### Kiểm tra

- `npm start -- --port 4177` chạy production bundle thật trong Wrangler; `/`, `/vip`, `/courses`, `/practice`, `/games` đều trả `200`, `/writing` redirect đúng sang `/games`, `/notifications` redirect đúng sang đăng nhập khi chưa có session. Không còn lỗi database/runtime trong log.
- `npm test`: 85/85 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## 2026-08-10 — Trung tâm thông báo trong ứng dụng

### Phần đã thay đổi

- Thêm bảng `notifications` theo từng user với loại sự kiện, tiêu đề, nội dung, liên kết nội bộ, entity nguồn, thời điểm đọc và các index phục vụ unread feed; unique key ngăn tạo trùng một event cho cùng entity.
- Khi admin duyệt hoặc từ chối yêu cầu VIP, thông báo được tạo trong chính transaction xử lý request/subscription. Duyệt dẫn về `/account`; từ chối dẫn về `/vip` và hiển thị lý do admin đã nhập.
- Chuông trong `LearnerAppShell` nay dẫn tới `/notifications` và có badge số chưa đọc. Unread count được tính ngay trong truy vấn session hiện có để không thêm một lượt gọi Neon vào mọi lần chuyển trang.
- Thêm `/notifications` responsive với feed mới nhất, mở thông báo để tự đánh dấu đọc, đánh dấu từng mục hoặc toàn bộ đã đọc, trạng thái rỗng và kiểm tra ownership ở Server Actions.

### Dữ liệu và kiểm tra

- Migration `0013_empty_bloodaxe` đã áp dụng thành công lên Neon.
- HTTP E2E bằng learner/admin QA tạm đã qua: duyệt VIP tạo badge + thông báo approved; mở thông báo dẫn đúng `/account` và đặt `read_at`; từ chối tạo thông báo có lý do; “đọc tất cả” xóa badge. Toàn bộ dữ liệu QA đã được dọn.
- `npm test`: 84/84 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; output có route `/notifications`.
- `vinext dev` chạy đúng toàn bộ E2E. Lỗi production local được phát hiện ở lượt này và đã được xử lý bằng Worker runtime trong mục phía trên.

## 2026-08-10 — Yêu cầu kích hoạt VIP thủ công từ người học

### Phần đã thay đổi

- Chuyển `/vip` từ bảng giá tĩnh sang dữ liệu `vip_plans` thật. Người học đã đăng nhập có thể gửi yêu cầu kích hoạt/gia hạn, đổi gói khi đang chờ hoặc hủy yêu cầu; trang `/account` hiển thị yêu cầu pending và quyền VIP active cùng thời hạn thật.
- Thêm `vip_activation_requests` với trạng thái `pending/approved/rejected/cancelled`, liên kết user/plan/subscription/reviewer và unique index có điều kiện để mỗi người chỉ có một yêu cầu pending.
- Thêm hàng đợi tại `/admin/subscriptions`: admin xem người học, gói, thời điểm và ghi chú; có thể duyệt & kích hoạt hoặc từ chối kèm lý do.
- Thao tác duyệt gọi chung transaction cấp/gia hạn entitlement, sau đó cập nhật request và audit trong cùng transaction. Mọi thao tác gửi, đổi, hủy, duyệt và từ chối đều có audit log.
- Giao diện mới dùng Server Components/Server Actions, không thêm JavaScript client không cần thiết; desktop và mobile giữ cùng ngôn ngữ thiết kế sáng, ít khung.

### Dữ liệu và kiểm tra

- Migration `0012_magical_silver_centurion` đã áp dụng thành công lên Neon.
- HTTP E2E bằng learner/admin QA tạm đã qua đủ `pending → approved`, tạo đúng một subscription active, tạo mới rồi `cancelled`, tạo mới rồi `rejected` có lý do. Trang tài khoản và hàng đợi admin đều phản ánh dữ liệu thật; toàn bộ QA data đã được dọn.
- `npm test`: 83/83 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

## 2026-08-10 — Admin entitlement VIP và trạng thái tài khoản

### Phần đã thay đổi

- Thêm `/admin/subscriptions` cho admin tìm học viên, xem trạng thái hiện tại, cấp gói, gia hạn và thu hồi VIP. Học viên bị khóa hoặc chưa xác minh email không thể được cấp quyền.
- Tách `lib/vip-subscription.ts` làm nguồn kiểm tra entitlement dùng chung. Quyền chỉ hợp lệ khi `status=active`, đã đến `starts_at` và chưa qua `ends_at`; bài học và Luyện ca tiếp tục quyết định quyền ở server trước khi trả nội dung.
- Thêm transaction trong `lib/admin-subscription-service.ts`: khóa hàng user, tự đánh dấu subscription active đã quá hạn, gia hạn từ hạn hiện tại, gom trạng thái active trùng và ghi audit `admin.subscription.granted`, `extended`, `revoked`.
- Trang `/account` hiển thị gói thật, ngày hết hạn, số ngày còn lại và CTA phù hợp; không còn dòng mô tả kỹ thuật chung chung về subscription.
- Dashboard admin chỉ đếm VIP thực sự còn hiệu lực thay vì đếm mọi dòng có nhãn `active`.
- Không cần migration mới vì schema `vip_plans`, `subscriptions` và `audit_logs` hiện tại đã đủ cho luồng thủ công.

### Kiểm tra

- Neon E2E bằng hai tài khoản QA tạm: cấp VIP 1 tháng thành công; tài khoản hiển thị hạn 30 ngày và Kho Luyện ca trả `hasVip=true`, exercise VIP đầy đủ.
- Gia hạn gói 6 tháng giữ nguyên subscription và cộng đúng 180 ngày từ hạn cũ; audit có đủ `granted` rồi `extended`.
- Thu hồi đổi subscription sang `cancelled`; tài khoản trở về Gói miễn phí, Luyện ca trả `hasVip=false`, ca VIP `locked=true`, `exercises=null`. Khách ẩn danh nhận cùng DTO khóa.
- Toàn bộ user, session, subscription và audit QA tạm đã được dọn khỏi PostgreSQL.
- `npm test`: 82/82 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; route `/admin/subscriptions` được nhận diện trong output production.

## 2026-08-08 — Hoàn thiện audio cho 14 ca VIP

### Phần đã thay đổi

- Mở rộng generator và manifest từ 24 lượt miễn phí thành đủ 66 lượt Luyện ca; 24 MP3 cũ được giữ nguyên và chỉ tạo mới 42 MP3 VIP còn thiếu.
- Mở rộng `practice:audio:seed` và seed tổng để nhận toàn bộ manifest. Audio miễn phí giữ trạng thái `approved`; audio VIP mới luôn là `pending`, xóa sạch kết quả QA cũ nếu được gắn mới và không tự vượt qua bước nghe duyệt.
- Cập nhật test manifest để khóa quan hệ scenario/exercise/transcript/Đúng-Sai/checksum cho cả nội dung miễn phí lẫn VIP.
- Cho phép admin hoặc reviewer đã được phân công nghe duyệt audio `pending` ngay trên ca đã xuất bản. Điều này xử lý an toàn nội dung cũ: audio chưa duyệt vẫn bị server ẩn với học viên nhưng không cần gỡ cả ca chỉ để QA file mới.

### Dữ liệu và kiểm tra

- Đã gắn mới 42 audio, giữ nguyên 24 audio cũ và chuyển 42 file mới lên Cloudinary; PostgreSQL hiện có đủ 66/66 liên kết audio và 0 blob.
- Cloudinary Admin API trả đủ 66 asset MP3 dưới `hanziwork/practice-audio/legacy/`, tổng khoảng 1,22 MB.
- HEAD kiểm tra toàn bộ CDN đạt 66/66; tất cả trả tài nguyên audio hợp lệ.
- 8 ca miễn phí đạt đủ 7/7 điều kiện. Cả 14 ca VIP đạt 6/7 và chỉ còn thiếu điều kiện `audio_review`; 42 lượt VIP giữ `pending` để reviewer nghe thật.
- Script Cloudinary chạy lặp lại an toàn và không còn blob cần chuyển.

### Bước vận hành tiếp theo

- Người thành thạo Quan thoại nghe 42 lượt trong Admin, đánh dấu `Audio đạt` hoặc `Cần thu lại`. Không tự động duyệt chỉ dựa trên việc CDN/checksum hợp lệ.

## 2026-08-08 — Cloudinary CDN và QA audio Luyện ca

### Phần đã thay đổi

- Thêm luồng upload có chữ ký: trình duyệt tải audio thẳng lên Cloudinary, server chỉ cấp chữ ký và xác minh chữ ký phản hồi/metadata trước khi gắn asset. API secret không được gửi xuống client.
- Route media tiếp tục kiểm tra quyền miễn phí/VIP ở server rồi redirect sang Cloudinary CDN; cơ chế range-stream blob PostgreSQL cũ được giữ để chuyển đổi không gián đoạn.
- Mở rộng `practice_audio_assets` với metadata Cloudinary và `practice_exercises` với trạng thái QA `pending/approved/re_record`, checklist lỗi, ghi chú, reviewer và thời điểm duyệt.
- Thay file hoặc sửa transcript tự động đưa audio về chờ duyệt. Người học chỉ nhận audio đã duyệt; checklist xuất bản tăng thành 7 điều kiện và chặn xuất bản nếu còn audio chưa đạt.
- Trang kiểm duyệt có điều khiển nghe riêng cho từng lượt, checklist lỗi phát âm/tốc độ/độ rõ/tạp âm/sai transcript/ngữ điệu, cùng hai hành động “Audio đạt” và “Yêu cầu thu lại”. Editor nhìn thấy phản hồi để thu lại đúng lỗi.
- Thêm script idempotent `npm run practice:audio:migrate-cloudinary`; blob chỉ bị xóa khỏi PostgreSQL sau khi Cloudinary upload và cập nhật metadata thành công.

### Dữ liệu và cấu hình

- Migration `0011_talented_adam_warlock` đã áp dụng lên Neon. Dữ liệu hiện có: 24 audio PostgreSQL được backfill `approved`, 42 lượt chưa có audio giữ `pending`.
- `.env.example` khai báo `CLOUDINARY_URL`; credential thật chỉ nằm trong `.env.local` bị Git bỏ qua. Script migration đã được sửa để tự nạp `.env.local` giống các script quản trị khác.
- Đã chạy migration thật: 24/24 asset chuyển sang Cloudinary, `content` trong PostgreSQL đã về `null`, không thiếu CDN URL. Kiểm tra trực tiếp một asset trả HTTP 200 với `content-type: audio/mpeg`.
- Chạy script lần hai trả “Không còn audio database cần chuyển”, xác nhận quy trình idempotent.

### Kiểm tra

- Browser E2E bằng ca/tài khoản tạm: duyệt một audio, yêu cầu thu lại một audio, kiểm tra checklist xuất bản còn 6/7; desktop và mobile 390 px không tràn ngang, không có error overlay hoặc console warning/error.
- Nút upload/đổi file bị vô hiệu hóa đúng khi Cloudinary chưa cấu hình và hiển thị hướng dẫn thay vì thất bại âm thầm.
- Toàn bộ ca, tài khoản và audit QA tạm đã được dọn khỏi PostgreSQL.
- `npm test`: 77/77 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Bằng chứng QA

- `docs/design-qa/practice-audio-review-desktop-refined.png`
- `docs/design-qa/practice-audio-review-mobile.png`

## 2026-08-08 — Hàng đợi vận hành kiểm duyệt Luyện ca

### Phần đã thay đổi

- Thêm migration `0010_wandering_the_captain` và áp dụng lên Neon: `practice_scenarios` có reviewer phụ trách, ưu tiên `normal/high/urgent`, hạn duyệt và thời điểm gửi duyệt; ca review cũ được backfill mốc gửi từ `updated_at`.
- Thêm hàng đợi ngay đầu `/admin/practice`, sắp xếp ca khẩn/sắp đến hạn trước và hiển thị tổng số chờ duyệt, chưa nhận, quá hạn cùng checklist sẵn sàng xuất bản.
- Admin có thể gán reviewer/admin đang hoạt động, mức ưu tiên và hạn duyệt ở cả hàng đợi lẫn trang chi tiết. Reviewer chỉ thấy ca của mình và ca chưa phân công, có thể tự nhận hoặc bỏ nhận.
- Siết quyền ở server: reviewer không thể trả ca hoặc xuất bản khi chưa được phân công cho chính mình; ca đang thuộc reviewer khác không thể bị lấy. Mọi thao tác gán, nhận và bỏ nhận đều ghi `audit_logs`.
- Trang chi tiết có panel điều phối riêng; danh sách theo nhóm ngành hiển thị reviewer/hạn khi ca đang Chờ duyệt. Giao diện dùng hàng phân cách gọn, không thêm nhiều card lồng nhau và responsive cho mobile.

### Dữ liệu và kiểm tra

- Migration đã áp dụng thành công; Neon có đủ bốn cột review và index `practice_scenarios_review_queue_idx`.
- Browser E2E bằng fixture tạm: admin gán reviewer thành công; reviewer nhìn thấy đúng ca được gán, bỏ nhận rồi tự nhận lại; trang chi tiết chỉ mở nút trả về/xuất bản sau khi đã nhận.
- Desktop và mobile 390 px: không tràn ngang, không có error overlay hoặc console warning/error. Toàn bộ tài khoản, session, ca và audit QA tạm đã được dọn khỏi PostgreSQL sau kiểm tra.
- `npm test`: 74/74 passed.
- `npx tsc --noEmit`: passed.


## 2026-08-08 — Lịch sử trực quan và khôi phục phiên bản Luyện ca

### Phần đã thay đổi

- Thay danh sách phiên bản tối giản bằng timeline biên tập đầy đủ: số phiên bản, người thực hiện, vai trò, thời gian, ghi chú, trạng thái, tiêu đề, quyền miễn phí/VIP, số lượt nghe, độ phủ audio và bản xem nhanh từng lượt.
- Editor/admin có thể mở một phiên bản cũ và khôi phục khi ca đang ở Bản nháp. Reviewer vẫn xem được toàn bộ lịch sử nhưng không có quyền khôi phục.
- Khôi phục không ghi đè lịch sử: hệ thống tự tạo một snapshot an toàn của nội dung hiện tại, phục hồi nội dung/lượt nghe từ phiên bản được chọn rồi tạo thêm một phiên bản Bản nháp mới.
- Giữ nguyên slug, nhóm ngành và liên kết lịch sử làm bài khi khôi phục; mọi thao tác yêu cầu ghi chú và xác nhận, kiểm tra lại quyền ở server, đồng thời ghi audit log `admin.practice_scenario.version_restored`.
- Audio từng xuất hiện trong snapshot được giữ lại thay vì dọn như asset không dùng, giúp phiên bản cũ tiếp tục có thể phục hồi. Snapshot cũ trước khi có transcript/Đúng-Sai vẫn được đọc theo chế độ tương thích.
- Không cần migration mới vì bảng `practice_scenario_versions` hiện có đã lưu toàn bộ snapshot cần thiết.

### Kiểm tra

- Thực hiện khôi phục thật bằng tài khoản editor QA: tiêu đề/nội dung/lượt nghe quay đúng về v1, tạo v3 bảo toàn bản trước khôi phục và v4 làm Bản nháp mới.
- Browser desktop 1280 × 900 và mobile 390 × 844: timeline không tràn ngang, không có error overlay hoặc console error.
- Fixture tài khoản, ca luyện, phiên bản và audit QA đã được xóa khỏi PostgreSQL sau kiểm tra.
- `npm test`: 71/71 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.

### Bằng chứng QA

- `docs/design-qa/practice-version-history-desktop.png`
- `docs/design-qa/practice-version-history-mobile.png`

## 2026-08-08 — Quy trình biên tập và kiểm duyệt Luyện ca

### Phần đã thay đổi

- Tách quyền nội dung thành ba vai trò rõ ràng: `editor` tạo và sửa ca ở Bản nháp, `reviewer` nghe/đối chiếu rồi trả về hoặc xuất bản, `admin` quản lý toàn bộ quy trình và tài khoản nhân sự.
- Thêm workflow trạng thái có kiểm tra ở server: Bản nháp → Chờ duyệt → Đã xuất bản; nội dung bị khóa chỉnh sửa ngoài trạng thái Bản nháp và mọi lần chuyển trạng thái đều bắt buộc có ghi chú, tạo phiên bản và audit log.
- Thêm checklist 6 điều kiện trước khi xuất bản: nhóm ngành đang hoạt động, tối thiểu hai lượt nghe, đủ transcript, đủ audio, đáp án hợp lệ và có cả tình huống Đúng lẫn Sai.
- Thiết kế trang kiểm duyệt riêng để reviewer nghe từng audio, xem transcript, câu hỏi, phương án, đáp án và giải thích mà không thấy form chỉnh sửa.
- Thêm `/admin/team` để admin phân vai trò learner/editor/reviewer/admin cho tài khoản đã xác minh; chặn tự hạ quyền và chặn hạ quyền admin cuối cùng.
- Cho editor/reviewer đăng nhập qua cổng quản trị nhưng chỉ nhìn thấy phạm vi Luyện ca và Tài khoản; người chưa đăng nhập vẫn bị chặn ở server.
- Sửa truy vấn tổng hợp số ca theo nhóm ngành để số lượng ca và ca đang xuất bản hiển thị đúng trên màn hình tổng quan.

### Kiểm tra

- Browser QA desktop và mobile: reviewer chỉ thấy quyền kiểm duyệt, trang không tràn ngang; thao tác duyệt một ca đủ 6/6 điều kiện tạo đúng phiên bản xuất bản.
- Người chưa đăng nhập truy cập `/admin/practice` được chuyển về `/admin/login` kèm `returnTo` an toàn.
- Dữ liệu reviewer và ca QA tạm đã được xóa khỏi PostgreSQL sau kiểm tra.
- `npm test`: 67/67 passed.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm run build`: passed, gồm route mới `/admin/team`.

### Bằng chứng QA

- `docs/design-qa/practice-review-workflow-desktop.png`
- `docs/design-qa/practice-review-workflow-mobile.png`

## 2026-08-08 — Bộ audio Quan thoại cho toàn bộ ca miễn phí

### Phần đã thay đổi

- Tạo 24 tệp MP3 cho 8/8 ca Luyện ca miễn phí, tổng 66,5 giây và khoảng 390 KB. Dùng `zh-CN-XiaoxiaoNeural` cho văn phòng/dịch vụ và `zh-CN-YunxiNeural` cho nhà máy/kho vận/giao tiếp cốt lõi, tốc độ chậm nhẹ `-8%`.
- Thêm `content/practice-audio/manifest.json` khóa quan hệ scenario/exercise/transcript/đáp án/giọng/thời lượng/checksum; test sẽ thất bại nếu thiếu file, đổi nội dung hoặc gắn nhầm câu.
- Thêm `npm run practice:audio:generate` để tạo lại tài sản biên tập và `npm run practice:audio:seed` để nhập nhanh vào PostgreSQL mà không phải seed lại 168 bài học và hơn một nghìn mục từ.
- Tích hợp audio vào `db:seed` cho môi trường mới. Cả seed đầy đủ và seed audio chuyên dụng chỉ gắn khi exercise chưa có asset, nên không ghi đè bản thu mà admin đã thay thủ công.
- Sửa nhận diện frame MPEG không có ID3: MP3 Layer III và AAC ADTS giờ được phân loại đúng ở cả upload Admin lẫn seed.

### Dữ liệu và kiểm tra

- Neon: lần đầu gắn mới 24 audio; lần chạy lại gắn mới 0, giữ nguyên 24; 24/24 lượt miễn phí sẵn sàng.
- Runtime `/practice`: 200; route media công khai trả `206 Partial Content`, `audio/mpeg`, `Accept-Ranges: bytes` và đúng `Content-Range: bytes 0-127/22752`.
- `npm test`: 64/64 passed, gồm kiểm tra chữ ký file, checksum, thời lượng, transcript và độ phủ toàn bộ ca miễn phí.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- Tệp audio là bản TTS dùng cho MVP và vẫn cần người thành thạo Quan thoại nghe duyệt trước khi phát hành thương mại.

## 2026-08-08 — Upload, lưu trữ và phát audio thật cho Luyện ca

### Phần đã thay đổi

- Thêm bảng `practice_audio_assets` và migration `0009_faithful_post`; tệp audio được lưu bền trong Neon PostgreSQL dạng `bytea`, gắn với từng lượt nghe và có checksum SHA-256 để tránh lưu trùng.
- Admin có thể tải lên, nghe thử, thay thế hoặc gỡ audio ngay trong form lượt nghe tại `/admin/practice`. Tệp được kiểm tra chữ ký nhị phân ở server, giới hạn 8 MB và tối đa 5 phút; hỗ trợ MP3, WAV, M4A/MP4, AAC, OGG và WebM.
- Bổ sung `listening_text` và `is_statement_correct` vào từng exercise. Nội dung thực sự được nghe và đáp án Đúng/Sai giờ là dữ liệu biên tập rõ ràng, không còn phụ thuộc phép biến đổi ngẫu nhiên ở client.
- Thêm route media có kiểm tra quyền miễn phí/VIP/admin trước khi đọc nội dung tệp, hỗ trợ byte range/HTTP 206 để tua và phát ổn định. Audio VIP bị khóa không được trả về client.
- Player Luyện ca ưu tiên bản thu thật, preload lượt kế tiếp, giữ chế độ nghe chậm 0.78x và tự chuyển sang TTS thiết bị nếu bản thu lỗi hoặc exercise chưa có audio.
- Khi thay hoặc xóa audio, asset cũ chỉ bị dọn nếu không còn exercise nào sử dụng; mọi thao tác đều ghi audit log và phiên bản nội dung của ca.

### Dữ liệu và kiểm tra

- Migration đã áp dụng thành công lên Neon; seed idempotent giữ đủ 7 nhóm ngành, 22 ca và 66 lượt nghe.
- 66/66 lượt nghe có transcript và đáp án rõ ràng sau seed: 36 câu Đúng, 30 câu Sai.
- Kiểm tra ghi/đọc/xóa thực tế một blob WAV mẫu trong Neon thành công, đủ 12 byte.
- API upload không đăng nhập admin trả 403; media không tồn tại trả 404; `/practice` trả 200 trong kiểm tra runtime.
- `npx tsc --noEmit`: passed.
- `npm test`: 63/63 passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/api/admin/practice-audio` và `/api/media/practice-audio/:assetId` được nhận diện đầy đủ.

### Lưu ý vận hành

- Chưa seed các tệp thu âm thật. 66 lượt nghe hiện tiếp tục dùng TTS làm fallback cho đến khi admin tải bản thu tương ứng lên.
- PostgreSQL `bytea` là phương án MVP không cần domain hay dịch vụ lưu trữ ngoài. Khi thư viện audio tăng lớn, nên chuyển phần nội dung asset sang R2/S3 và giữ metadata/quyền truy cập trong PostgreSQL.

## 2026-08-08 — PostgreSQL và Admin CRUD hoàn chỉnh cho Luyện ca

### Phần đã thay đổi

- Thêm bốn bảng `practice_industries`, `practice_scenarios`, `practice_exercises`, `practice_scenario_versions`; giữ `practice_attempts.scenario_id` theo slug để tương thích lịch sử hiện có và mở rộng slug ngành lên 80 ký tự.
- Sinh và áp dụng migration `0007_medical_tempest` cùng `0008_wealthy_rogue` lên Neon.
- Seed idempotent toàn bộ dữ liệu Luyện ca hiện tại vào PostgreSQL: 7 nhóm ngành, 22 ca và 66 lượt nghe.
- Chuyển `lib/practice-repository.ts` sang đọc nội dung `published` từ PostgreSQL. Với người chưa có VIP, truy vấn exercise chỉ lấy ca miễn phí và DTO ca khóa luôn có `exercises: null`, nên đáp án trả phí không đi qua ranh giới server/client.
- Thêm Admin CRUD theo cấu trúc `/admin/practice` → nhóm ngành → ca luyện → lượt nghe, gồm trạng thái draft/review/published/archived, miễn phí/VIP, ảnh ngành, audio URL, câu hỏi, phương án, đáp án, giải thích và thứ tự.
- Mỗi lần tạo/cập nhật ca hoặc thay đổi lượt nghe đều tạo snapshot tăng phiên bản; mọi mutation xác thực role admin, chạy transaction và ghi `audit_logs`.
- Xóa cứng chỉ cho phép với draft/review an toàn. Không xóa ca có lịch sử làm bài; ca cần ít nhất hai lượt nghe mới được xuất bản. Đổi slug ca/ngành sẽ đồng bộ khóa logic trong lịch sử làm bài.
- Mở rộng ảnh/icon của Kho ca làm có fallback an toàn cho nhóm ngành được tạo mới từ admin.

### Kiểm tra

- PostgreSQL sau seed: 7 nhóm ngành, 22 ca, 66 lượt nghe.
- `/admin/practice` yêu cầu đăng nhập admin đúng như thiết kế; `/practice` đọc dữ liệu DB, hiển thị đủ 7 tab, ca miễn phí/VIP và không có console error.
- Browser desktop và mobile: trang Luyện ca không tràn ngang; sau warm-up server render khoảng 40 ms trong lần kiểm tra local.
- `npx tsc --noEmit`: passed.
- `npm test`: 60/60 passed.
- `npm run lint`: passed.
- `npm run build`: passed; ba route Admin Luyện ca được nhận diện đầy đủ.

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
