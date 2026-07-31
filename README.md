# HanziWork

Prototype web responsive cho sản phẩm học tiếng Trung chuyên ngành dành cho người đi làm. Giao diện được viết trực tiếp bằng Next.js nên có thể tiếp tục phát triển thành sản phẩm thật, không cần chuyển lại từ Figma.

## Các màn hình đã có

- `/` — trang chủ và nhịp học hôm nay.
- `/courses` — tìm kiếm, lọc 7 lộ trình ngành.
- `/learn/van-phong-hanh-chinh` — bài học tương tác gồm từ vựng, hội thoại và ghi chú.
- `/practice` — flashcard tự đánh giá, không dùng chấm phát âm AI.
- `/vip` — ba gói đề xuất, quy trình SePay và khung chính sách.
- `/admin` — dashboard vận hành và quy trình duyệt nội dung mẫu.

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
- `app/` chứa các route; `components/` chứa thành phần giao diện và phần tương tác.
- `lib/course-data.ts` là dữ liệu mẫu; có thể thay bằng truy vấn PostgreSQL ở giai đoạn backend.
- `docs/` mô tả phạm vi MVP, quy trình và roadmap.

## Nối PostgreSQL sau này

1. Sao chép `.env.example` thành `.env.local`.
2. Điền `DATABASE_URL` của cơ sở dữ liệu PostgreSQL.
3. Chạy `npm run db:generate` để sinh migration từ schema.
4. Thay dữ liệu mẫu trong `lib/course-data.ts` bằng repository gọi `getDb()` từ `db/index.ts`.

Prototype hiện chưa kết nối đăng nhập, SePay hoặc nhận tiền thật. Không đưa khóa API vào Git và không bật thanh toán trước khi hoàn thành thông tin chủ thể kinh doanh, điều khoản sử dụng, bảo mật và hoàn tiền.
