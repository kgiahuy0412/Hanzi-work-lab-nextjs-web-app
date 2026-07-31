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

## 2. Mua và kích hoạt VIP qua SePay

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

Mỗi lần xuất bản tạo một `content_versions` snapshot. Mọi thay đổi quyền, VIP, giá và hoàn tiền được ghi vào `audit_logs`.
