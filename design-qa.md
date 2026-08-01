# Design QA — HanziWork dashboard kết hợp

## Nguồn hình ảnh và bằng chứng

- Hình mẫu đã duyệt: `docs/design-target/approved-combined-dashboard.png`
- Ảnh triển khai desktop: `docs/design-qa/dashboard-combined-desktop.png`
- Ảnh so sánh cùng khung: `docs/design-qa/dashboard-combined-comparison.png`
- Ảnh triển khai mobile: `docs/design-qa/dashboard-combined-mobile.png`
- Trạng thái so sánh: trang chủ, dữ liệu mẫu Gia Huy, chưa cuộn.
- Desktop: hình nguồn 1487 × 1058 px; trình duyệt được hiệu chỉnh về 1488 × 1058 CSS px rồi chuẩn hóa ảnh về 1487 × 1058 px để so sánh cùng mật độ.
- Mobile: 390 × 844 CSS px; ảnh kiểm tra được chuẩn hóa về đúng 390 × 844 px.

## So sánh toàn màn hình và vùng trọng tâm

- Toàn màn hình desktop: rail 100 px, top bar 88 px, cột chính 816 px, cột phụ 354 px và khoảng cách 64 px bám sát hình mẫu.
- Vùng bài học: card tại x=190, y=315, rộng 816 px, cao 474 px; nút CTA tại x=190, y=804, rộng 816 px, cao 60 px.
- Vùng cột phải: hàng ôn tập tại x=1070, y=140, rộng 354 px, cao 465 px; mục tiêu tuần và banner VIP giữ đúng thứ tự, nhịp và độ rộng của hình mẫu.
- Mobile: rail được thay bằng thanh điều hướng dưới; card chuyển về một cột rộng 343 px; document không vượt chiều rộng khả dụng và không còn cuộn ngang.

## Lịch sử sửa lỗi theo mức độ

1. Lần 1 — P2, bố cục desktop bị nén theo chiều dọc: card bài học thấp hơn hình mẫu và cột phải bắt đầu quá sớm. Đã sửa grid, khoảng cách, chiều cao card, padding phần chính và vị trí cột phụ trong `app/globals.css`.
2. Lần 2 — P1, mobile bị tràn ngang: document rộng 509 px trong viewport 390 px; top bar và nội dung lệch 78 px; cột phụ vẫn chia hai. Đã đặt lại `left`, `margin-left`, chiều rộng frame và chuyển cột phụ về một cột trong breakpoint 720 px.
3. Lần 3 — kiểm tra sau sửa: viewport 390 × 844, frame/top bar nằm tại x=0, các card rộng 343 px, không còn lỗi console hay cảnh báo.

## Đánh giá fidelity

- Typography: phân cấp tiêu đề, nội dung Việt/Trung và độ đậm bám sát mẫu; chấp nhận khác biệt P3 nhỏ do raster hóa font hệ thống/CJK.
- Spacing và layout: desktop khớp các mốc chính; mobile giữ thứ tự đọc, khoảng chạm và không tràn ngang.
- Màu sắc và token: giữ đúng hướng ivory sáng, pine/emerald, aqua, coral và gold; tương phản rõ nhưng không gắt.
- Hình ảnh: dùng asset nền raster riêng, đúng chủ đề buổi sáng thành thị; không dùng placeholder, CSS art hoặc SVG tự vẽ để thay ảnh.
- Icon: dùng cùng họ icon Lucide hiện có, nét và kích thước nhất quán.
- Nội dung: giữ nguyên dữ liệu học tiếng Trung chuyên ngành, bài học hôm nay, ôn tập và chính sách mở khóa VIP của prototype.
- Accessibility: CTA và điều hướng là liên kết semantic; tap target mobile đủ lớn; trạng thái focus/hover hiện hữu; không phát sinh animation bắt buộc.

## Kiểm tra chức năng và kỹ thuật

- CTA “Bắt đầu bài học”: mở đúng `/learn/van-phong-hanh-chinh`.
- Mobile nav “Lộ trình”: mở đúng `/courses`.
- Console tại các luồng đã thử: không có warning/error.
- `npm test`: 3/3 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- P0 còn lại: không.
- P1 còn lại: không.
- P2 còn lại: không.
- P3 chấp nhận: sai khác quang học rất nhỏ của font và cách raster hóa nền giữa trình duyệt/hình mẫu.

final result: passed

---

# Design QA — Shared learner shell

## Nguồn và bằng chứng

- Nguồn design language: `docs/design-target/approved-combined-dashboard.png`.
- Trang kiểm chứng đại diện: `/courses`, vì trước thay đổi trang này dùng site header/footer chung và chưa có rail học viên.
- Ảnh desktop: `docs/design-qa/shared-shell-courses-desktop.png`.
- Ảnh mobile: `docs/design-qa/shared-shell-courses-mobile.png`.
- Ảnh đặt nguồn và triển khai cạnh nhau: `docs/design-qa/shared-shell-comparison.png`.
- Phạm vi fidelity là application chrome (rail pine, top bar, active state và mobile bottom nav); nội dung giữa homepage mẫu và trang lộ trình chủ ý khác nhau.

## So sánh và sửa lỗi

1. Lần 1 — P1: nếu giữ chrome trong từng page, trang chủ và Kho ca làm dễ xuất hiện rail/top bar kép khi mở rộng root layout. Đã gỡ markup lặp và chỉ render `LearnerAppShell` một lần.
2. Lần 2 — P2: các page cũ mang offset riêng 88/100 px nên có nguy cơ bị đẩy hai lần. Đã chuẩn hóa offset trong `.learner-shell-content` và override có phạm vi cho dashboard/Kho ca làm.
3. Lần 3 — kiểm tra responsive: dưới 720 px rail ẩn, top bar cao 68 px, bottom nav cao 62 px; năm route học viên đều có `scrollWidth === clientWidth`.

## Kiểm tra chức năng và kỹ thuật

- Desktop: `/`, `/courses`, `/practice`, `/learn/van-phong-hanh-chinh`, `/vip` có đúng 1 rail, 1 top bar và active state đúng.
- Mobile: cùng năm route có bottom navigation, active state đúng, nội dung chừa 78 px phía dưới và không tràn ngang.
- Auth/admin: `/login` và `/admin/login` có 0 learner rail/top bar; site header/footer riêng vẫn hiển thị.
- Trang bài học giữ sidebar danh sách bài bên trong mà không va với rail cấp ứng dụng.
- Console: 0 warning/error trong các route đã rà.
- `npx tsc --noEmit`: passed.
- `npm test`: 29/29 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- P0 còn lại: không.
- P1 còn lại: không.
- P2 còn lại: không.
- P3 chấp nhận: raster ảnh QA trong in-app browser có mật độ hiển thị 1.25×; ảnh đã được chuẩn hóa, không ảnh hưởng CSS layout hay breakpoint đo trực tiếp từ DOM.

final result: passed

---

# Design QA — Kho ca làm hiện đại

## Nguồn và trạng thái so sánh

- Hình đã duyệt: `docs/design-target/practice-hub-modern.png` — 1487 × 1058 px.
- Ảnh triển khai desktop: `docs/design-qa/practice-hub-desktop.png` — trạng thái ẩn danh, ngành Văn phòng, ca miễn phí đầu tiên, chưa cuộn.
- Ảnh triển khai mobile: `docs/design-qa/practice-hub-mobile.png` — viewport 390 × 844 CSS px, cùng trạng thái.
- Ảnh so sánh đặt cạnh nhau: `docs/design-qa/practice-hub-comparison.png`.

## So sánh và lịch sử sửa

1. Lần 1 — P2: top bar mobile làm chip trạng thái xuống ba dòng và cạnh tranh không gian với logo/tài khoản. Đã rút chip về nút biểu tượng 40 × 40 px dưới breakpoint 720 px.
2. Lần 2 — P2: headline desktop bị ép thành hai dòng sớm hơn hình mẫu. Đã nới vùng heading và giảm nhẹ cỡ cực đại; mobile vẫn giữ nhịp ba dòng dễ đọc.
3. Lần 3 — kiểm tra sau sửa: mobile dùng grid 343 px trong viewport 390 px, rail ẩn, bottom nav hiện, `scrollWidth` 371 px và không có tràn ngang.

## Đánh giá fidelity và chủ ý tinh chỉnh

- Giữ cấu trúc cốt lõi của hướng số 2: rail pine, tiêu đề lớn, bốn ngành, ca nổi bật, câu Trung trọng tâm, danh sách ca liên quan và utility rail bên phải.
- Phiên bản triển khai hiện đại hơn theo yêu cầu: giảm đường phân cách, dùng card lớn với hierarchy rõ, CTA gọn, các trạng thái VIP dùng gold trầm thay vì neon hoặc hiệu ứng “AI magic”.
- Cột phải tách thành nhịp luyện, thử thách tuần, quyền lợi VIP và chỉ báo ngành để nội dung dễ quét trên laptop; ở mobile các khối chuyển thành một cột sau ca chính.
- Typography Việt/Trung, độ tương phản, tap target, focus-visible và semantic button/tab/progressbar đều được kiểm tra.

## Kiểm tra chức năng và kỹ thuật

- Ca miễn phí: mở được, ba lựa chọn hiển thị, đáp án đúng đổi trạng thái, giải thích xuất hiện và nút lượt tiếp theo được bật.
- Ca VIP khi chưa có quyền: xem được preview/nudge; `scenario-options` có 0 phần tử và repository không serialize `exercises` trả phí.
- Nhánh flashcard: vẫn dùng `PracticeBoard` và API lưu lịch ôn hiện có.
- Console: 0 warning/error trong các trạng thái đã thử.
- `npx tsc --noEmit`: passed.
- `npm test`: 24/24 passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- P0 còn lại: không.
- P1 còn lại: không.
- P2 còn lại: không.
- P3 chấp nhận: sai khác nhỏ về raster font CJK và tỷ lệ ảnh chụp do mật độ hiển thị của trình duyệt.

final result: passed
# Design QA — HanziWork

## 2026-07-31 — Điều hướng nhanh và thư viện lộ trình có ảnh

### Nguồn thiết kế

- Hai ảnh người dùng cung cấp: heading `/courses` cũ và ba course card chỉ dùng mảng màu/chữ Hán.
- Ngôn ngữ thiết kế đã duyệt ở `docs/design-target/approved-combined-dashboard.png`: pine/ivory/aqua, nhiều khoảng trắng, editorial và không dùng hiệu ứng neon/AI.
- Ảnh đối chiếu nguồn–bản build: `docs/design-qa/course-library-comparison.png`.

### Phần đã kiểm tra

- Header mới giữ đúng cấu trúc trang lộ trình nhưng giảm cảm giác chữ quá khổ, thêm hierarchy, số liệu và ba ảnh bối cảnh thật.
- Bảy course card dùng bảy ảnh WebP riêng, crop 2.8:1, không có logo/chữ giả; alt text đầy đủ và ảnh tải thành công ở kích thước gốc 2048 × 730.
- Contact sheet toàn bộ asset: `docs/design-qa/course-covers-contact-sheet.webp`.
- Desktop 1440 × 1050: rail/top bar đúng offset, hero không cắt nội dung, toolbar và lưới ba cột thẳng hàng.
- Mobile 390 × 844: hero một cột, stats/CTA không chồng nhau, ảnh giữ được chủ thể, filter cuộn ngang và bottom nav không gây tràn ngang.
- Bộ lọc “Nhà máy” trả đúng một lộ trình; chuyển lại “Tất cả” khôi phục 4 lộ trình đang mở và 3 lộ trình kế hoạch.
- Console của tab kiểm thử cuối: 0 warning/error.

### Hiệu năng và phản hồi điều hướng

- Learner nav chủ động prefetch bốn route chính khi trình duyệt rảnh và khi hover/focus.
- Active state đổi ngay khi bấm; thanh tiến trình mảnh xuất hiện dưới top bar.
- `/courses` và `/practice` có `loading.tsx`; catalog `/courses` được stream sau hero tĩnh thay vì chặn toàn trang.
- Vocabulary ẩn danh trong Kho ca làm được cache 5 phút theo quyền free/VIP; dữ liệu lịch ôn theo user vẫn không dùng cache chung.
- Ảnh WebP sau tối ưu có dung lượng 62–96 KB/ảnh. Request local sau khi ấm cache đo được khoảng 190–450 ms; thời gian biên dịch nóng của Vinext dev được che bởi loading UI.

### Bằng chứng

- `docs/design-qa/course-library-desktop.png`
- `docs/design-qa/course-library-mobile.png`
- `docs/design-qa/course-library-comparison.png`
- `docs/design-qa/course-covers-contact-sheet.webp`

final result: passed
# Design QA — Compact learner headers

## Nguồn và bằng chứng

- Hướng thiết kế đã chốt: `C:/Users/Windows/.codex/generated_images/019fb6e7-dd73-7b02-b4c0-985adf7e3e85/exec-3486f816-5841-4b1f-b22b-26fcfeb25c8a.png` (1470 × 1070 px).
- Bản triển khai desktop: `docs/design-qa/course-library-compact-desktop.png` (1581 × 889 px).
- Bản triển khai mobile: `docs/design-qa/course-library-compact-mobile.png` (469 × 1055 px; ảnh chụp ở capability 390 × 844 với mật độ hiển thị của in-app browser).
- So sánh toàn màn hình: `docs/design-qa/course-library-compact-comparison.png`.
- So sánh vùng header và toolbar: `docs/design-qa/course-library-compact-header-comparison.png`.

## Phạm vi triển khai

- `/courses`: bỏ marketing hero tối và collage lớn; dùng header product-catalog nền ivory, tiêu đề sans-serif gọn, metadata thật, một ảnh bối cảnh và đưa bộ lọc/lưới khóa học lên cao hơn.
- `/practice`, `/vip`, `/account`: dùng chung `LearnerPageHeader`, cùng hệ typography, eyebrow, metadata và nhịp khoảng trắng.
- `/learn/:slug`: header bài học được làm phẳng, giảm card chrome và giữ hierarchy tương thích với shell học viên.
- Loading state của `/courses` và `/practice` đã được đồng bộ với cấu trúc header mới.
- Trang chủ giữ nguyên vì đã là thiết kế được duyệt; auth/admin giữ layout riêng theo đúng luồng sản phẩm.

## Lịch sử sửa lỗi theo mức độ

1. Lần 1 — P2: tiêu đề desktop hơi lớn và chiếm thêm một dòng. Đã giảm cỡ cực đại về 46 px, giữ một dòng ở desktop và hai dòng dễ đọc trên mobile.
2. Lần 2 — P2: chip “Tất cả” bị mất active state do selector cũ có độ ưu tiên cao hơn. Đã thêm selector theo phạm vi `.course-library-page` để giữ tương phản trắng/pine.
3. Lần 3 — P2: hàng filter mobile rộng hơn document 12 px. Đã bỏ chiều rộng cộng thêm và negative margin; filter vẫn cuộn ngang nội bộ nhưng `scrollWidth === clientWidth`.
4. Lần 4 — kiểm tra cuối: `/courses`, `/practice`, `/vip` và `/learn/van-phong-hanh-chinh` không tràn ngang ở desktop/mobile; `/account` chuyển đúng về đăng nhập khi chưa có phiên.

## Kiểm tra chức năng và kỹ thuật

- Tìm “kho” trả đúng “Kho vận & logistics”.
- Lọc “Văn phòng” trả đúng một lộ trình; chuyển lại “Tất cả” khôi phục danh sách.
- Browser log sau các luồng chỉ có Vite/React debug-info, không có warning/error.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `npm test`: 46/46 passed.
- `npm run build`: passed.
- P0 còn lại: không.
- P1 còn lại: không.
- P2 còn lại: không.
- P3 chấp nhận: sai khác nhỏ về raster font và mật độ ảnh chụp của in-app browser; không ảnh hưởng CSS layout hay breakpoint đo trực tiếp từ DOM.

final result: passed

---
