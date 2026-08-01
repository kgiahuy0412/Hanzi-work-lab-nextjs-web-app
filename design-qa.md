# Design QA — Thẻ từ vựng trung tâm cho từng bài học

## Nguồn, trạng thái và bằng chứng

- Thiết kế đã chọn: `docs/design-target/lesson-vocabulary-card-selected.png` — 1487 × 1058 px; được chuẩn hóa về 1440 × 1024 chỉ cho bước đối chiếu.
- Bản triển khai desktop: `docs/design-qa/lesson-vocabulary-card-desktop.png` — viewport CSS 1440 × 1024, DPR 0.8, ảnh đối chiếu 1440 × 1024 px.
- Bản responsive mobile: `docs/design-qa/lesson-vocabulary-card-mobile.png` — viewport CSS 390 × 844, DPR 0.8, không tràn ngang.
- Trạng thái mobile tập trung vào thẻ và CTA: `docs/design-qa/lesson-vocabulary-card-mobile-focused.png`.
- So sánh thiết kế và triển khai trong cùng một ảnh: `docs/design-qa/lesson-vocabulary-card-comparison.png` — thiết kế bên trái, triển khai bên phải.
- Trạng thái kiểm tra: khách ẩn danh, chuyên ngành Văn phòng & hành chính, bài 1/24, tab Từ vựng, từ 1/6.

## Kết quả đối chiếu thiết kế

- Layout: giữ đúng một thẻ trung tâm, hai lớp thẻ phía sau, điều hướng Trước/Tiếp theo, sáu đoạn tiến độ và CTA riêng bên dưới. Card triển khai rộng hơn thiết kế khoảng 1–2% nhưng vẫn giữ đúng hierarchy và không làm thay đổi nhịp đọc.
- Spacing: phần card trong triển khai thấp hơn bản thiết kế khoảng 20–30 px do giữ nguyên breadcrumb và header bài học hiện có. CTA vẫn nằm trong vùng nhìn thấy ở desktop; khoảng cách giữa card, progress và CTA nhất quán.
- Typography: giữ hệ chữ hiện có của HanziWork; Hán tự là điểm nhấn lớn nhất, sau đó là pinyin, nghĩa và ví dụ. Không có text bị cắt hoặc wrap lỗi ở desktop/mobile.
- Màu và surfaces: dùng đúng ivory, pine/teal và lớp đổ bóng mềm của sản phẩm; không thêm gradient, blob, CSS art hay asset giả.
- Icons: toàn bộ nút âm thanh, bookmark và mũi tên dùng cùng họ Lucide đang có trong dự án, đúng stroke và căn giữa.
- Nội dung: mỗi card chỉ hiển thị một từ thật của bài học cùng ví dụ và bản dịch; không dùng placeholder.

## Responsive, trạng thái và accessibility

- P1 đã sửa: danh sách 24 bài ban đầu chiếm quá nhiều chiều cao trên mobile. Sidebar hiện thu gọn thành nút “Bài 1 / 24”, mở/đóng được với `aria-expanded`.
- P2 đã sửa: card/CTA ban đầu sát vùng điều hướng mobile. Nhịp dọc mobile đã được rút gọn; trang cuộn tự nhiên, card cao khoảng 393 px và CTA vẫn truy cập được.
- Không tràn ngang: desktop và mobile đều có `scrollWidth - clientWidth = 0`.
- Card có thể focus; ArrowLeft/ArrowRight chuyển 01/06 ↔ 02/06, Enter tiếp tục. Các nút có nhãn truy cập, trạng thái lưu/đang phát, focus ring và tap target phù hợp.
- `prefers-reduced-motion` tắt card entrance, audio pulse và các chuyển động không thiết yếu.
- P3 chấp nhận: công cụ chụp mobile tạo capture lặp tile ở mép phải; ảnh bằng chứng được crop từ tile đầu. Kích thước viewport và overflow được đo trực tiếp trong trình duyệt.

## Tương tác và kiểm thử

- Âm thanh: phát từ `audioUrl` khi có và tự rơi về Speech Synthesis tiếng Trung; browser test nhận “Đã phát âm xong.”
- Lưu từ: khách ẩn danh chuyển đúng sang trạng thái `aria-pressed=true`; người đăng nhập tiếp tục dùng API ôn tập hiện có.
- Hành trình chính: nút CTA đi lần lượt đến 06/06 và lần nhấn cuối chuyển sang tab Hội thoại.
- Sidebar mobile mở/đóng đúng, điều hướng card bằng nút và bàn phím hoạt động, console có 0 error.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm test`: 48/48 passed.
- `npm run build`: passed.
- `git diff --check`: passed (chỉ có cảnh báo line-ending LF/CRLF của worktree Windows).
- P0/P1/P2 còn lại: không.

final result: passed

---

# Design QA — GIF thay pill và nâng trọng tâm flashcard

## Nguồn và bằng chứng

- Yêu cầu bố cục từ ảnh người dùng: `docs/design-target/review-studio-gif-layout-request.png` — 1920 × 1080 px, gồm browser chrome và trạng thái đăng nhập.
- Baseline trước khi chỉnh ở cùng trạng thái ẩn danh: `docs/design-qa/review-studio-gif-desktop.png` — 1581 × 889 px.
- Desktop sau chỉnh: `docs/design-qa/review-studio-gif-right-desktop.png` — browser viewport 1600 × 900 CSS px, ảnh 1600 × 900 px, density 1×.
- Mobile sau chỉnh: `docs/design-qa/review-studio-gif-right-mobile.png` — CSS viewport 390 × 844 px; ảnh bằng chứng đã crop từ tile đầu của capture capability về 371 × 844 px, không resize nội dung.
- Bản raw mobile để truy vết chuẩn hóa: `docs/design-qa/review-studio-gif-right-mobile-raw.png` — 464 × 1055 px.
- So sánh baseline và bản mới trong cùng một ảnh: `docs/design-qa/review-studio-gif-right-comparison.png`; bản mới được scale về 1581 × 889 chỉ để so sánh song song.
- Trạng thái: trang chủ `/`, khách ẩn danh, thẻ 1/5, chưa cuộn. Phần auth trong ảnh yêu cầu khác trạng thái nhưng không thuộc vùng bố cục được yêu cầu thay đổi.

## Kết quả đối chiếu

- Pill “Phiên ôn 5 từ” đã bị loại bỏ hoàn toàn khỏi DOM; tiến độ 1/5 chỉ còn trên chính flashcard.
- GIF đã chuyển từ đầu cột trái sang vùng bên phải trước đây dành cho pill. Ở desktop figure nằm tại x=1012, y=106, rộng 500 px; asset được canh phải nên không cạnh tranh với card.
- Flashcard desktop chuyển từ khoảng y=248 trong baseline lên y=190 và được căn giữa trong deck tại x=261. Cột “Nhịp tuần này” bắt đầu tại y=188 nhưng không chồng lấn vì nằm ở track phải riêng.
- Mobile: GIF kết thúc tại y=154; card bắt đầu tại y=160, rộng 309 px và kết thúc tại y=602 trong viewport đầu. Nhịp đọc rõ, không cần cuộn mới thấy đủ ba nút ghi nhớ.
- Không tràn ngang: desktop `scrollWidth = clientWidth = 1600`; mobile `scrollWidth = clientWidth = 371` trong vùng capture.

## Fidelity và chất lượng

- Typography: không đổi font, cấp chữ, weight hay hierarchy của thẻ; chữ Việt/CJK vẫn dùng fallback hiện có và không bị wrap mới.
- Spacing/layout: khoảng trống header giảm có chủ ý; card được nâng 58 px và căn giữa track, đúng yêu cầu nhưng vẫn giữ khoảng thở với GIF/cột phụ.
- Màu/token: giữ nguyên canvas ivory, teal, blue, coral và yellow; không phát sinh token hoặc hiệu ứng trang trí mới.
- Asset: dùng nguyên GIF/PNG HanziWork đã duyệt, không placeholder, không kéo méo, có ảnh tĩnh cho `prefers-reduced-motion`.
- Copy/content: chỉ gỡ nội dung session bị yêu cầu bỏ; từ vựng, ví dụ, nhịp tuần và bài tiếp theo không đổi.
- Focused region không cần ảnh cắt riêng vì GIF, card và cột phụ đều đọc rõ trong full-view comparison ở cùng trạng thái.

## Tương tác, lỗi và kiểm thử

- Kéo card sang phải trên mobile chuyển đúng từ 1 sang 2 mà không cần nút bắt đầu.
- Console sau khi tải lại bản desktop: 0 warning/error.
- `npm test`: 46/46 passed.
- `npm run lint`: passed.
- `tsc --noEmit`: passed.
- `npm run build`: passed.
- P0/P1/P2 còn lại: không.
- P3 chấp nhận: ảnh chụp mobile của capability phải crop tile đầu do lỗi lặp tile của công cụ; DOM metrics và trạng thái responsive đã được đo trực tiếp trong trình duyệt.

final result: passed

---

# Design QA — Review Studio với GIF thao tác

## Nguồn và bằng chứng

- Hướng thiết kế gốc: `docs/design-target/review-studio-selected.png`.
- GIF sản phẩm: `public/assets/review/swipe-review-demo.gif` — 600 × 216 px, 21 frame sau tối ưu, khoảng 396 KB.
- Ảnh tĩnh cho `prefers-reduced-motion`: `public/assets/review/swipe-review-demo.png`.
- Bốn keyframe kiểm tra chuyển động: `docs/design-qa/review-swipe-gif-frames.png`.
- Desktop: `docs/design-qa/review-studio-gif-desktop.png`.
- Mobile 390 × 844: `docs/design-qa/review-studio-gif-mobile.png`.
- So sánh cùng khung: `docs/design-qa/review-studio-gif-comparison.png`.

## Thay đổi và kiểm tra

- Đã gỡ hoàn toàn ngày/giờ, nhãn “Phiên ôn hôm nay”, panel “Cách ôn” và dòng hướng dẫn nhìn thấy bên dưới card.
- GIF được tạo từ chính card HanziWork đang chạy, mô phỏng lượt kéo sang phải và sang trái; không dùng stock/placeholder hoặc hình minh họa AI ngoài sản phẩm.
- Hướng dẫn thao tác vẫn có ở dạng `sr-only` và liên kết với card bằng `aria-describedby` cho người dùng trình đọc màn hình.
- Mobile: GIF cao 88 px; card kết thúc tại y=736 trong viewport cao 844 px; `scrollWidth` 371 trong `innerWidth` 390, không tràn ngang.
- Thao tác kéo trực tiếp vẫn chuyển từ thẻ 1 sang thẻ 2; console 0 warning/error.
- `npm test`: 46/46 passed; ESLint, TypeScript và production build đều passed.
- P0/P1/P2 còn lại: không.

final result: passed

---

# Design QA — Review Studio compact, drag-first

## Nguồn và bằng chứng

- Hướng thiết kế gốc: `docs/design-target/review-studio-selected.png`.
- Desktop sau tinh chỉnh: `docs/design-qa/review-studio-desktop-compact.png`.
- Mobile sau tinh chỉnh: `docs/design-qa/review-studio-mobile-compact.png` — CSS viewport 390 × 844 px.
- So sánh cùng khung: `docs/design-qa/review-studio-compact-comparison.png`.

## Thay đổi có chủ ý

- Theo phản hồi người dùng, card desktop giảm từ khoảng 710 × 620 xuống 620 × 550 px; mobile giảm còn 309 × 440 px. Đây là sai khác có chủ ý so với hình nguồn để giảm cảm giác chiếm màn hình.
- Loại bỏ hoàn toàn nút và trạng thái “Bắt đầu lượt ôn”. Card, ba nút ghi nhớ và phím mũi tên hoạt động ngay khi trang mở.
- Khối CTA xanh được thay bằng hướng dẫn “Kéo là bắt đầu”; mobile rút gọn còn 102 px và nêu rõ kéo phải/trái trước khi người dùng chạm vào thẻ.
- Nút đánh giá nằm trong viewport đầu ở mobile; nội dung card không overflow và document không tràn ngang.

## Kiểm tra hành vi và kỹ thuật

- Kéo trực tiếp thẻ đầu sang phải chuyển đúng sang từ thứ hai mà không qua bước bắt đầu.
- Nút “Nhớ” hoạt động ngay; console 0 warning/error.
- `npm test`: 46/46 passed.
- `npm run lint`: passed.
- `tsc --noEmit`: passed.
- `npm run build`: passed.
- P0/P1/P2 còn lại: không.

final result: passed

---

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

# Design QA — Review Studio số 1

## Nguồn và bằng chứng

- Hình đã chốt: `docs/design-target/review-studio-selected.png` — 1487 × 1058 px.
- Bản desktop: `docs/design-qa/review-studio-desktop.png` — trạng thái ẩn danh, thẻ đầu tiên, trước khi bắt đầu.
- Bản mobile: `docs/design-qa/review-studio-mobile.png` — CSS viewport 390 × 844 px.
- So sánh nguồn và bản build trong cùng một khung: `docs/design-qa/review-studio-comparison.png`.
- In-app browser mặc định chụp ở CSS viewport 1600 × 900; ảnh nguồn và ảnh build khác tỷ lệ khung nên fidelity được đánh giá theo bố cục, hierarchy và hành vi responsive thay vì ép kéo giãn raster.

## Phạm vi triển khai

- Trang `/` chuyển thành Review Studio: đồng hồ và ngày, tóm tắt phiên, bộ thẻ Trung–Việt, nhịp tuần, CTA bắt đầu và bài học kế tiếp.
- Người dùng thật nhận tối đa 5 từ đến lịch ôn và dữ liệu tiến độ từ PostgreSQL; khách ẩn danh có bộ 5 từ mẫu đầy đủ câu ví dụ.
- Tương tác chính hoạt động bằng nút, kéo ngang và phím mũi tên; kết quả đăng nhập được lưu qua API `/api/progress/review` hiện có.
- Chỉ dùng transform/opacity ngắn của Motion, có `prefers-reduced-motion`; không dùng hiệu ứng lật 3D hoặc chuỗi animation nặng.
- Desktop giữ rail bên trái; mobile chuyển sang bottom navigation và đưa CTA bắt đầu lên trước bộ thẻ.

## Lịch sử sửa lỗi

1. Lần 1 — P1 responsiveness: ở 390 px, `.review-studio-layout` chuyển sang flex nhưng vẫn kế thừa `align-items: start`, khiến card và các panel co còn 150–264 px. Đã đặt `align-items: stretch`; các khối cuối cùng rộng 343 px và không tràn ngang.
2. Lần 2 — P2 layout: pseudo-element rỗng trong heading tạo thêm grid item ở tablet. Đã loại bỏ để giữ thứ tự và nhịp dọc ổn định.
3. Lần 3 — behavior: kiểm tra CTA bắt đầu, nút “Nhớ”, phím ArrowLeft và chuyển từ 1 sang 2; tất cả đúng, console 0 warning/error.

## Kết quả kỹ thuật

- TypeScript `tsc --noEmit`: passed.
- ESLint toàn repository: passed.
- `npm test`: 46/46 passed.
- `npm run build`: passed.
- P0 còn lại: không.
- P1 còn lại: không.
- P2 còn lại: không.
- P3 chấp nhận: sai khác nhỏ về tỷ lệ khung chụp và raster font CJK giữa hình nguồn và browser; không ảnh hưởng layout hay thao tác.

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
