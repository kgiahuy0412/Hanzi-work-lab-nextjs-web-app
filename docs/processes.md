# Quy trình nghiệp vụ (BPMN-ready)

Các sơ đồ dưới đây là đặc tả luồng để chuyển sang BPMN 2.0 khi đội phát triển cần mô hình hóa bằng Camunda Modeler hoặc bpmn.io.

## 1. Luồng học

```mermaid
flowchart LR
  A([Bắt đầu]) --> B[Chọn ngành]
  B --> C[Chọn bài]
  C --> D{Bài miễn phí hoặc có VIP?}
  D -- Có --> E[Học từ vựng]
  D -- Không --> F[Hiển thị quyền lợi VIP]
  F --> G{Mua VIP?}
  G -- Không --> B
  G -- Có --> H[Đi tới thanh toán]
  H --> E
  E --> I[Học hội thoại và ghi chú]
  I --> J[Đánh dấu hoàn thành]
  J --> K[Cập nhật tiến độ]
  K --> L[Tạo lịch ôn từ]
  L --> M([Gợi ý bài tiếp theo])
```

Quy tắc: quyền xem bài phải được xác nhận ở server. Khi hoàn thành, cập nhật `lesson_progress` và tạo/cập nhật `review_items` trong cùng một transaction.

## 2. Cấp, gia hạn và thu hồi VIP thủ công

Trước khi mở thanh toán, admin có thể vận hành entitlement tại `/admin/subscriptions`:

```mermaid
sequenceDiagram
  actor A as Admin
  participant W as HanziWork Console
  participant D as PostgreSQL
  actor U as Học viên

  A->>W: Chọn học viên đã xác minh + gói VIP
  W->>D: Khóa hàng user trong transaction
  D->>D: Hết hạn subscription cũ đã quá hạn
  alt Chưa có VIP hoạt động
    D->>D: Tạo subscription active từ hiện tại
  else Đang có VIP
    D->>D: Cộng duration vào ends_at hiện tại
  end
  D->>D: Ghi audit granted/extended
  W-->>A: Xác nhận thành công
  U->>W: Mở bài hoặc ca VIP
  W->>D: Kiểm tra status + starts_at + ends_at
  W-->>U: Chỉ trả nội dung khi entitlement hợp lệ
```

Thu hồi yêu cầu admin xác nhận rõ trên form. Server đổi mọi subscription đang hoạt động của học viên sang `cancelled`, đặt `ends_at` về thời điểm hiện tại và ghi `admin.subscription.revoked`. UI không phải nguồn quyết định quyền; Lộ trình, Luyện ca, media và trang tài khoản đều đọc cùng một kiểm tra subscription phía server.

## 2.1. Người học gửi yêu cầu kích hoạt VIP thủ công

```mermaid
sequenceDiagram
  actor U as Người học
  participant W as HanziWork
  participant D as PostgreSQL
  actor A as Admin

  U->>W: Chọn gói và gửi yêu cầu
  W->>D: Khóa user, tạo/cập nhật một request pending
  D-->>U: Hiển thị đang chờ ở VIP và Tài khoản
  alt Người học đổi ý
    U->>W: Đổi gói hoặc hủy
    W->>D: Cập nhật request + audit
  else Admin duyệt
    A->>W: Duyệt & kích hoạt
    W->>D: Khóa user + request
    D->>D: Cấp/gia hạn subscription và approve request trong cùng transaction
    D-->>U: Hiển thị VIP active và ngày hết hạn
  else Admin từ chối
    A->>W: Nhập lý do từ chối
    W->>D: Reject request + audit
  end
```

Mỗi người chỉ có tối đa một request `pending`; gửi lại gói khác sẽ cập nhật yêu cầu hiện tại thay vì tạo hàng đợi trùng. Luồng beta này không tự trừ tiền. Admin chỉ duyệt tài khoản learner đang hoạt động và đã xác minh email.

## 2.2. Thông báo trạng thái trong ứng dụng

```mermaid
sequenceDiagram
  actor A as Admin
  participant W as HanziWork
  participant D as PostgreSQL
  actor U as Người học

  A->>W: Duyệt hoặc từ chối yêu cầu VIP
  W->>D: Cập nhật request/subscription
  W->>D: Tạo notification trong cùng transaction
  D-->>U: Chuông hiển thị badge chưa đọc
  U->>W: Mở thông báo
  W->>D: Kiểm tra ownership + đặt read_at
  W-->>U: Chuyển tới Tài khoản hoặc VIP
```

Thông báo chỉ được đọc/đánh dấu bởi đúng user sở hữu. Liên kết đích luôn được chuẩn hóa thành đường dẫn nội bộ; badge chưa đọc được tính cùng truy vấn session để không phát sinh thêm database round-trip trên mọi route.

## 2.3. Mua và kích hoạt VIP qua SePay

```mermaid
sequenceDiagram
  actor U as Người học
  participant W as Web HanziWork
  participant D as PostgreSQL
  participant S as SePay/Ngân hàng

  U->>W: Chọn gói VIP
  W->>D: Tạo payment_order pending + mã duy nhất
  W-->>U: Hiển thị QR và thời gian hết hạn
  U->>S: Chuyển khoản đúng nội dung
  S->>W: Gửi webhook giao dịch
  W->>W: Xác minh chữ ký + số tiền + mã đơn
  W->>D: Khóa đơn, kiểm tra chưa xử lý
  W->>D: Ghi paid, tạo/kéo dài subscription
  D-->>W: Commit transaction
  W-->>U: Hiển thị VIP đã kích hoạt
```

Trường hợp ngoại lệ cần vào `manual_review`: sai số tiền, thiếu mã đơn, webhook trùng, đơn hết hạn hoặc giao dịch đã gắn với đơn khác. Tuyệt đối không kích hoạt chỉ dựa trên ảnh chụp chuyển khoản.

## 3. Biên soạn và xuất bản nội dung

```mermaid
flowchart LR
  subgraph Editor[Người biên soạn]
    A[Soạn từ, ví dụ, tình huống] --> B[Gửi duyệt]
  end
  subgraph Reviewer[Người duyệt tiếng Trung]
    C[Kiểm tra nghĩa, pinyin, ngữ cảnh] --> D{Đạt?}
  end
  subgraph Admin[Quản trị viên]
    E[Xem trước giao diện] --> F{Sẵn sàng?}
    G[Xuất bản phiên bản mới]
  end
  B --> C
  D -- Cần sửa --> A
  D -- Đạt --> E
  F -- Chưa --> A
  F -- Có --> G
```

Với Luyện ca, khi Editor gửi `draft → review`, hệ thống ghi thời điểm gửi và đưa ca vào hàng đợi. Admin gán reviewer đang hoạt động, mức ưu tiên và hạn duyệt; Reviewer cũng có thể tự nhận ca chưa phân công nhưng không thể lấy ca đang thuộc người khác. Reviewer chỉ được trả ca hoặc xuất bản sau khi đã nhận ca đó. Khi ca rời trạng thái `review`, hạn duyệt được đóng lại; mọi lần gán, nhận, bỏ nhận và chuyển trạng thái đều được ghi vào `audit_logs`.

### 3.1. Tải lên và duyệt audio Luyện ca

```mermaid
sequenceDiagram
  actor E as Editor
  participant W as HanziWork
  participant C as Cloudinary
  participant D as PostgreSQL
  actor R as Reviewer

  E->>W: Chọn file audio
  W-->>E: Trả chữ ký upload ngắn hạn
  E->>C: Upload trực tiếp resource_type=video
  C-->>E: Trả metadata + chữ ký phản hồi
  E->>W: Gửi metadata đã upload
  W->>W: Xác minh chữ ký, định dạng, dung lượng, thời lượng
  W->>D: Gắn asset và đặt QA=pending
  R->>W: Nghe audio trong ca được phân công
  R->>D: Duyệt hoặc yêu cầu thu lại + checklist lỗi
  alt Audio đạt
    D-->>W: QA=approved
    W-->>R: Mở điều kiện xuất bản audio
  else Cần thu lại
    D-->>W: QA=re_record
    W-->>E: Hiển thị lỗi và ghi chú cần sửa
  end
```

Quy tắc vận hành:

- `CLOUDINARY_API_SECRET` chỉ tồn tại phía server thông qua `CLOUDINARY_URL`; trình duyệt chỉ nhận chữ ký upload có thời hạn.
- Audio được gửi thẳng từ trình duyệt lên Cloudinary để không truyền file lớn qua server HanziWork. Cloudinary xử lý audio dưới `resource_type=video`.
- Route phát audio vẫn kiểm tra ca đã xuất bản và quyền miễn phí/VIP ở server; nếu asset nằm trên Cloudinary thì route trả redirect tạm thời sang CDN.
- Thay file hoặc thay transcript luôn đặt QA về `pending`. Học viên chỉ nhận audio `approved`; checklist xuất bản yêu cầu toàn bộ lượt nghe đã được duyệt.
- Asset PostgreSQL cũ vẫn hoạt động trong thời gian chuyển đổi. Sau khi có `CLOUDINARY_URL`, chạy `npm run practice:audio:migrate-cloudinary`; chỉ khi upload và ghi metadata thành công script mới xóa blob cũ khỏi PostgreSQL.

Mỗi lần xuất bản tạo một snapshot nội dung (`content_versions` hoặc `practice_scenario_versions`). Mọi thay đổi quyền, VIP, giá và hoàn tiền được ghi vào `audit_logs`.
