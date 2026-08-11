# Design QA — Đăng nhập “Chiếc túi san hô”

## Nguồn và bằng chứng

- Video chuyển động tham chiếu: `C:/Users/Windows/Downloads/1786379438132_2299012107817654072_1234608406821690621.mp4`; contact sheet: `docs/design-target/login-video/motion-contact-sheet.png`.
- Phương án 2 đã được người dùng chọn: `docs/design-qa/login-satchel/source-selected.png`, 1472 × 1056 px.
- Implementation desktop: `docs/design-qa/login-satchel/implementation-desktop.png`, viewport 1472 × 1056 px.
- Implementation mobile: `docs/design-qa/login-satchel/implementation-mobile.png`, viewport 390 × 844 px, ảnh full-page.
- Đối chiếu source và implementation trong cùng một ảnh: `docs/design-qa/login-satchel/comparison-desktop.png`.

## Findings và lịch sử sửa

1. [P2] Lượt render đầu vẫn còn site header phía trên màn đăng nhập nên cảnh bị thấp, nền không phủ trọn viewport và form không còn cảm giác trồi từ túi. Đã ẩn site header/footer/mobile nav riêng khi có `.auth-page-login-scene`; ảnh desktop cuối xác nhận scene phủ kín 1472 × 1056.
2. [P2] Form cần ăn khớp miệng túi nhưng vẫn giữ vùng chạm và chữ rõ. Đã đặt form thành sheet ivory độc lập, dùng vị trí `clamp()` ở desktop, nhịp trồi 840 ms và biến thể compact cho màn hình thấp; không che mascot hoặc nút về trang chủ.
3. [P2] Mobile dùng asset portrait riêng và chuyển card về document flow. Phép đo DOM tại 390 px cho thấy `body.scrollWidth = innerWidth = 390`, card nằm từ x=12 đến x=378.4, input và CTA kết thúc ở x=355.6; không có overflow ngang.
4. [P2] Chuyển động được giới hạn vào phần mở màn: mascot đi ngang, scene hiện sau đó và sheet trồi lên; tất cả animation được tắt bằng `prefers-reduced-motion`. Sau intro, form đứng yên để người dùng nhập liệu không bị phân tâm.
- P0/P1/P2 còn lại: không.

## Fidelity, responsive và tương tác

- Fidelity: giữ đúng bố cục túi coral bên trái, form ivory đi lên từ túi, Cánh Cụt chỉ dẫn bên phải, đảo mint và nền kem; hierarchy, CTA coral và hai liên kết phụ bám sát phương án 2.
- Desktop: kiểm tra 1472 × 1056 và viewport mặc định 1265 × 710; form, túi, mascot, logo và nút về trang chủ đều nằm trong viewport, không xuất hiện thanh điều hướng cũ.
- Mobile: kiểm tra 390 × 844; dùng crop portrait riêng, logo và nút home vẫn truy cập được, form nằm trọn chiều ngang và phần minh họa tiếp tục ở dưới form.
- Tương tác: email/password nhận giá trị thử; nút đăng nhập enabled; form giữ action `/api/auth/login`; liên kết “Quên mật khẩu?” mở đúng `/forgot-password` và điều hướng quay lại `/login` thành công.
- Trình duyệt: 0 warning/error sau tải lại, nhập liệu và kiểm tra điều hướng.

## Kiểm tra kỹ thuật

- `npm run build`: passed; route `/login` có trong manifest và production Worker local phục vụ scene/asset mới.
- `npm test`: passed 91/91.
- `npx tsc --noEmit`: passed.
- `npx eslint components/auth-card.tsx`: passed, 0 warning/error.
- `git diff --check -- components/auth-card.tsx app/globals.css`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.

final result: passed

---

# Design QA — Hệ nền Fresh Mint Sky cho Trang chủ, Lộ trình và Luyện ca

## Nguồn và bằng chứng

- Phác thảo đã chọn: `C:/Users/Windows/.codex/generated_images/019fb6fe-431e-7c62-917c-2abef5ccee3c/exec-678afa65-2668-49a9-a3b0-81072d5e2b56.png`, `exec-c9bb97bf-228e-48fc-af49-e02ec9cab1fe.png`, `exec-3333e569-dbf6-464b-8101-347a8d9a12b5.png`.
- Render desktop: `docs/design-qa/fresh-mint-sky/home-desktop.png`, `courses-desktop.png`, `practice-desktop.png`.
- Render mobile: `docs/design-qa/fresh-mint-sky/home-mobile.png`, `courses-mobile.png`, `practice-mobile.png`.
- So sánh phác thảo và implementation trong cùng một ảnh: `docs/design-qa/fresh-mint-sky/compare-home.png`, `compare-courses.png`, `compare-practice.png`.

## Findings và lịch sử sửa

1. [P2] Lượt mobile đầu cho thấy nút quay lại che eyebrow ở Lộ trình và Luyện ca. Đã thêm vùng an toàn 48 px cho phần copy của hai header tại màn hình dưới 720 px; ảnh mobile cuối xác nhận nút và chữ tách rời, không còn chồng lấn.
2. [P2] Ba nền đầu vào là raster 1920 × 1080. Đã chuyển sang WebP chất lượng 84 và dùng từng asset riêng cho từng ngữ cảnh; tổng dung lượng khoảng 31 KB, không làm tăng đáng kể thời gian tải.
3. [P2] Nền Luyện ca cần tiếp tục đọc được ở phần danh sách dài. Đã dùng nền chính ở đầu trang và surface ivory bán đặc nhẹ cho danh sách, giữ hình và chữ rõ nhưng không làm mất hệ màu mint–sky.
4. Đối chiếu cuối cho thấy vị trí dải xanh trời, mint wave và các điểm màu bám sát phương án đã chọn; bố cục, ảnh nội dung, typography và chức năng hiện có được giữ nguyên.
- P0/P1/P2 còn lại: không.

## Fidelity, responsive và tương tác

- Desktop: Trang chủ, Lộ trình và Luyện ca không tràn ngang; nền phủ liền mạch, không lặp và không tạo khung rời.
- Mobile: dùng crop riêng theo breakpoint; card, hero và ảnh ngữ cảnh vẫn nằm trong viewport; bottom navigation của Trang chủ hoạt động bình thường.
- Tương tác: bộ lọc “Nhà máy” ở Lộ trình chuyển sang trạng thái `active`; tab “Nhà máy” ở Luyện ca chuyển `aria-selected=true`.
- Trình duyệt: 0 console error trên cả ba route ở desktop và mobile.

## Kiểm tra kỹ thuật

- `npm test`: passed 49/49.
- `npm run build`: passed; `/`, `/courses`, `/practice` có trong manifest.
- `npm run lint`: exit 0; còn 1 warning `<img>` có sẵn trong `components/work-practice-hub.tsx`, không phát sinh từ thay đổi nền.
- `git diff --check -- app/globals.css`: passed; chỉ có cảnh báo line-ending LF/CRLF của worktree Windows.

final result: passed

---

# Design QA — Loại bỏ viền ảnh và thu gọn trạm trò chơi

## Nguồn và bằng chứng

- Source visual truth tập trung: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-04e6b0d7-7877-4397-89e9-8bdc29b73903.png`, 312 × 251 px, trạng thái trạm 05 trước sửa.
- Source toàn màn: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-8d98b6fb-bca4-4463-be35-bbc447bdcf18.png`, 1600 × 1067 px.
- Implementation desktop: `docs/design-qa/game-journey-polish/desktop-final.jpg`, 1581 × 889 px từ viewport CSS 1600 × 900, DPR 1.
- Implementation mobile: `docs/design-qa/game-journey-polish/mobile-final.jpg`; viewport override trả về CSS 488 × 1055, DPR 0.8; crop tile đầu 469 × 1055, không tràn ngang.
- Full-view comparison: `docs/design-qa/game-journey-polish/full-reference-vs-final.jpg`, source bên trái và implementation bên phải.
- Focused comparison: `docs/design-qa/game-journey-polish/station-05-before-after.jpg`, trạng thái trước sửa bên trái và sau sửa bên phải ở cùng khung 340 × 270.

## Findings và lịch sử sửa

1. [P2] Ảnh WebP gốc có nền ivory hình chữ nhật; mask CSS chỉ làm nhòe mép nên vẫn đọc thành một “box” mờ. Đã tạo sáu PNG có alpha thật bằng flood-fill nền nối với mép ảnh, đổi catalog sang asset `*-penguin-cutout.png` và bỏ hoàn toàn mask/filter của ảnh. Bằng chứng sau sửa cho thấy trạm 05 chỉ còn nhân vật và đạo cụ, không còn khung ảnh.
2. [P2] Cụm station desktop 240 × 190 px và ảnh 210 × 140 px quá lớn, khiến tên gần sát hoặc rơi khỏi bệ. Đã chuyển sang kích thước responsive bằng `clamp`: station 184–208 px, ảnh 158–176 px, chiều cao 105–118 px; toàn cụm dịch lên 10 px và hover chỉ dịch thêm 4 px.
3. [P2] Sau khi thu nhỏ, tiêu đề và metadata cần nằm trong bệ ở nhiều cỡ desktop. Phép đo 1600 × 900 cho thấy sáu station đều còn trong stage, không overflow ngang; focused comparison xác nhận “Viết chữ theo nghĩa” và “Gợi nhớ · 4 phút” nằm trọn trong bệ.
4. [P2] Test HTML cũ khóa cứng tên WebP nên thất bại ở lượt đầu sau khi đổi sang PNG trong suốt. Đã cập nhật assertion sang sáu asset cutout; lượt cuối đạt 49/49.
- P0/P1/P2 còn lại: không.

## Fidelity surfaces

- Typography/copy: tên và metadata được giảm theo cùng tỷ lệ, vẫn rõ thứ bậc và không bị cắt; nội dung trò chơi không thay đổi.
- Spacing/layout: trạm nhỏ hơn khoảng 13–18%, được nâng 10 px; khoảng thở giữa hình, tên và mép bệ rõ hơn.
- Colors/tokens: giữ nguyên palette ivory–mint–pine–coral; không thêm viền, shadow hay gradient mới.
- Image quality: sáu PNG 960 × 640 giữ nguyên chi tiết mascot, đạo cụ và alpha thật; không còn halo/khung chữ nhật do mask CSS.
- Interaction/accessibility: accessible name/alt giữ nguyên; `Tiếp tục chơi` mở đúng Luyện chém từ và `Tất cả trò chơi` quay lại bản đồ; console 0 warning/error.

## Kiểm tra kỹ thuật

- `npm run build`: passed; `/games` có trong manifest.
- `npx tsc --noEmit`: passed.
- `npm test`: 49/49 passed.
- `npm run lint`: exit 0; còn 1 warning `<img>` có sẵn tại `components/work-practice-hub.tsx`, không thuộc Games.
- `git diff --check`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.

final result: passed

---

# Design QA — Hiệu chỉnh bản đồ Games theo phản hồi trực tiếp

## Nguồn và bằng chứng

- Ảnh phản hồi hiện trạng: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-8f0d89a9-32dc-49b9-97aa-1c9c38f83b76.png`.
- Ảnh mẫu đích: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-8d98b6fb-bca4-4463-be35-bbc447bdcf18.png`.
- Render desktop sau sửa: `docs/design-qa/game-journey-fix/desktop-default.png`.
- Render mobile sau sửa: `docs/design-qa/game-journey-fix/mobile-final.jpg`.
- Đối chiếu nguồn–implementation trong cùng một ảnh: `docs/design-qa/game-journey-fix/reference-vs-prototype.png` (nguồn bên trái, implementation bên phải).

## Findings và lịch sử sửa

1. [P2] Trang desktop cũ còn khoảng nền ngoài vì `game-center-shell` cộng thêm margin/padding lên shell chung. Đã thêm biến thể `game-journey-shell` full-bleed, bỏ border/radius/shadow của stage và cho bản đồ phủ kín vùng nội dung ngay dưới topbar.
2. [P2] Sáu thumbnail cũ có viền trắng, nền và shadow giống card nên không khớp ảnh mẫu. Đã bỏ toàn bộ khung trang trí, dùng mask mềm ở biên asset để hình minh họa hòa trực tiếp vào bệ bản đồ; badge số vẫn được giữ như source.
3. [P2] Tọa độ trạm cũ được đặt theo mép, không theo tâm bệ. Đã đo trực tiếp asset nền 1600 × 1067 và đặt tâm trạm 02–07 lần lượt tại `(57.1%,17.7%)`, `(78.8%,32.4%)`, `(82.6%,58.8%)`, `(64.9%,73.6%)`, `(39.8%,77.9%)`, `(14.3%,77.1%)`. Phép đo DOM sau render trả về đúng chính xác sáu tọa độ này.
4. [P2] Responsive được giữ tách biệt: tại ≤960 px, station trở về flow dọc dạng card, transform tọa độ desktop được reset và shell có padding an toàn. Viewport mobile CSS 390 × 844 có `scrollWidth <= innerWidth`, không tràn ngang.
5. Interaction đã kiểm tra: nút `Tiếp tục chơi` mở đúng màn Luyện chém từ; nút `Tất cả trò chơi` quay lại bản đồ và tiêu đề `Hành trình phản xạ` xuất hiện đúng một lần.
- P0/P1/P2 còn lại: không.

## Kiểm tra kỹ thuật

- Browser console: 0 warning/error trong luồng catalog → Luyện chém từ → catalog.
- `npm run build`: passed; `/games` có trong manifest.
- `npx tsc --noEmit`: passed.
- `npm test`: 49/49 passed.
- `npm run lint`: exit 0; còn 1 warning `<img>` có sẵn tại `components/work-practice-hub.tsx`, không thuộc Games.
- `git diff --check -- app/globals.css components/game-center.tsx`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.

final result: passed

---

# Design QA — Games “Hành trình phản xạ”

## Nguồn và bằng chứng

- Source visual truth: `docs/design-target/game-home-redesign/selected-journey-map.png` — phương án số 2 được người dùng chọn, 1487 × 1058 px.
- Asset nền desktop: `public/assets/games/journey-map-desktop.webp` — 1600 × 1067 px; asset nền mobile dài: `public/assets/games/journey-map-mobile-long.webp` — 768 × 2304 px.
- Implementation desktop cuối: `docs/design-qa/game-journey/desktop-final.png` — 1536 × 1024 px, crop tile đầu từ viewport CSS 1537 × 1024, DPR 0.8.
- Implementation mobile: `docs/design-qa/game-journey/mobile-top-final.png` và `mobile-bottom-final.png` — 488 × 1055 px, viewport override 390 × 844 được runtime quy đổi thành CSS 488 × 1055, DPR 0.8.
- Full-view comparison: `docs/design-qa/game-journey/comparison-full.jpg` — source bên trái, implementation bên phải. Source được chuẩn hóa về 1536 × 1024 để so cùng implementation.
- Focused comparison: `docs/design-qa/game-journey/comparison-focus.jpg` — vùng tiêu đề, tiến độ, trạm 01 và mascot được đặt cạnh nhau ở cùng tỷ lệ đọc.
- State kiểm thử: khách ẩn danh, tiến độ hiển thị 1/7 theo dữ liệu trình duyệt hiện có; catalog hành trình, chưa mở game tại thời điểm capture.

## Findings và lịch sử sửa

1. [P2] First pass: tiêu đề desktop bị xuống hai dòng do header rộng 390 px; progress pill bị đẩy xuống sát badge trạm 01. Evidence: `docs/design-qa/game-journey/desktop-first-pass.png`. Fix: mở header desktop lên 550 px và giữ headline một dòng; mobile trả về wrapping bình thường. Post-fix evidence: `desktop-pass-2.png` và `desktop-final.png`; title cao 60.75 px, progress y=303.25 và featured card y=369 nên không còn chồng lấn.
2. [P2] Responsive đã được xử lý trong implementation: sơ đồ tọa độ tuyệt đối của desktop không được ép vào mobile. Tại ≤960 px, sáu trạm chuyển thành flow dọc; ở viewport CSS 488 px, card rộng 419/402 px và `scrollWidth - clientWidth = 0`. Evidence: `mobile-top-final.png`, `mobile-bottom-final.png`.
3. [P3] Chấp nhận: mock dùng mascot chỉ tay chung, implementation dùng asset Cánh Cụt chiến binh tre hiện có cho “Luyện chém từ”. Đây là khác biệt chủ đích để giữ đúng mascot production và ngữ nghĩa trò chơi; tỷ lệ, màu mắt, khăn coral và chất liệu 3D vẫn cùng hệ.
- P0/P1/P2 còn lại: không.

## Fidelity surfaces

- Fonts/typography: giữ font HanziWork hiện có, display headline màu pine, tracking âm và body 11–15 px. Headline desktop một dòng như source; mobile wrap tự nhiên. Không có chữ bị cắt hoặc tràn.
- Spacing/layout rhythm: stage desktop cao 880 px, radius 30 px; header, trạm 01 và sáu station bám đúng nhịp trái–phải của source. Hàng dưới không va nhau; skill legend nằm tách ở góc phải. Mobile dùng khoảng cách 16 px và touch card cao tối thiểu 116 px.
- Colors/tokens: ivory, mint, pine, coral, pale yellow và lavender khớp direction đã chọn; không thêm gradient, neon hoặc glassmorphism. Trạng thái completed dùng mint nhạt có tương phản rõ.
- Image quality: nền map là WebP thật được tạo riêng, không phải CSS/div art. Sáu thumbnail dùng WebP 960 × 640 hiện có; mascot production dùng PNG thật. Ảnh sắc nét, crop ổn định và không có viền chroma/halo.
- Copy/content: giữ “Hành trình phản xạ”, “Mỗi trò chơi là một bước tiến.”, “Luyện chém từ”, “Tiếp tục chơi” và đầy đủ tên/kỹ năng/thời lượng của sáu trò còn lại. Không dùng lorem ipsum.
- Icons: icon line dùng hệ Lucide sẵn có của HanziWork, cùng stroke và kích thước; không có emoji, text glyph hay SVG tự vẽ.
- Interaction/accessibility: bảy trạm đều là button có accessible name; ảnh có alt tiếng Việt; focus-visible của hệ thống giữ nguyên; reduced-motion tắt float/transition. Đã mở “Ghép cặp siêu tốc” và quay lại “Hành trình phản xạ” thành công.

## Kiểm tra kỹ thuật và trình duyệt

- Desktop CSS 1537 × 1024, DPR 0.8: không overflow ngang; bảy vùng trò chơi hiển thị đầy đủ trong stage.
- Mobile CSS 488 × 1055, DPR 0.8: không overflow ngang; toàn bộ trạm 02–07 và skill legend cuộn tới được phía trên bottom navigation.
- Browser console: 0 warning/error trong luồng mở trạm và quay lại.
- `npm run build`: passed; `/games` và `/writing` có trong manifest.
- `npx tsc --noEmit`: passed.
- `npm test`: 49/49 passed.
- `npm run lint`: exit 0 sau khi bỏ ARIA không hợp lệ trên `<picture>`; còn một warning `<img>` có sẵn tại `components/work-practice-hub.tsx`, không thuộc Games.
- `git diff --check`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.

final result: passed

---

# Design QA — Bộ thumbnail chim cánh cụt cho 6 trò chơi

## Nguồn, art direction và bằng chứng

- Logo/mascot người dùng cung cấp được lưu làm nguồn đối chiếu tại `docs/design-target/game-thumbnails/penguin-mascot-reference.png`.
- Sáu ảnh được tạo mới bằng ImageGen theo cùng một art direction: chim cánh cụt 3D đồ chơi đất sét, đầu và thân tím mận, mặt/bụng kem, mắt xanh ngọc, mỏ cam, má hồng và khăn cổ coral; nền ivory–mint, không chữ, không logo và không watermark.
- Bộ nguồn đã được đặt cạnh nhau tại `docs/design-target/game-thumbnails/penguin-game-thumbnails-contact-sheet.webp`.
- Asset production dùng WebP 960 × 640 tại `public/assets/games/`: `memory-penguin.webp`, `connect-penguin.webp`, `listen-penguin.webp`, `write-penguin.webp`, `flashcard-penguin.webp`, `quiz-penguin.webp`.
- Bản render desktop: `docs/design-qa/game-thumbnails-desktop.png` và `docs/design-qa/game-thumbnails-desktop-bottom.png`.
- Bản render mobile đã chuẩn hóa tile capture: `docs/design-qa/game-thumbnails-mobile-normalized.png`.
- Đối chiếu nguồn–implementation trong cùng một ảnh: `docs/design-qa/game-thumbnails-comparison.jpg` — contact sheet bên trái, card thực tế bên phải.

## Kết quả đối chiếu và lịch sử sửa

1. P1 đã sửa trước QA: hướng hình gấu trúc ban đầu không khớp logo mới do người dùng cung cấp. Toàn bộ sáu ảnh được tạo lại với chim cánh cụt và không sử dụng asset gấu trúc trong sản phẩm.
2. P2 đã sửa: card cũ chỉ dùng ô icon nhỏ nên không tạo được cảm giác “không gian trò chơi”. Card mới dành phần đầu theo tỷ lệ 16:9 cho ảnh minh họa, giữ nội dung/meta/CTA ở phần thân và không làm ảnh hưởng luồng bấm mở game.
3. P2 responsive đã sửa: desktop dùng lưới 3 × 2; mobile chuyển thành một cột, card rộng 445 CSS px trong viewport kiểm thử 488 CSS px, `scrollWidth - clientWidth = 0`.
4. P3 chấp nhận: viewport override của in-app browser có tỷ lệ DPR 0.8 và nhân tile trong ảnh chụp. Ảnh mobile QA đã crop đúng tile đầu; phép đo DOM xác nhận không có overflow ngang.
5. Post-fix visual comparison: mascot, khăn cổ, màu mắt, tỷ lệ khuôn mặt và vật liệu 3D nhất quán ở cả sáu ảnh; hành động ghép, nối, nghe, viết, lật thẻ và thử thách đọc được ngay ở kích thước card.
- P0/P1/P2 còn lại: không.

## Fidelity và chất lượng sản phẩm

- Typography: giữ nguyên font, kích cỡ tiêu đề, mô tả và metadata của HanziWork; text không đè lên ảnh và không bị cắt trên desktop/mobile.
- Spacing/layout: radius 22 px, ảnh 16:9, nội dung có vùng thở rõ và CTA nằm cùng nhịp ở cuối card. Hai hàng desktop thẳng cột; mobile giữ khoảng cách đều giữa các card.
- Colors/surfaces: ảnh dùng ivory, mint, coral, lavender và vàng nhạt để ăn khớp nền game hiện có; không thêm gradient, CSS-art hoặc placeholder.
- Image quality: sáu ảnh gốc 960 × 640, WebP 31–48 KB, `object-fit: cover`; trình duyệt xác nhận cả sáu ảnh tải thành công với natural size 960 × 640.
- Copy/icon: title, mô tả, category, thời lượng, trạng thái đã chơi và Lucide icon vẫn rõ ràng; badge/index không che gương mặt hay hành động chính.
- Interaction/accessibility: toàn bộ card vẫn là button có accessible name “Chơi …”; thử mở “Ghép cặp siêu tốc” thành công và quay lại catalog được. Ảnh có alt tiếng Việt; motion ảnh tắt theo `prefers-reduced-motion`.

## Kiểm tra kỹ thuật

- Browser desktop 1600 × 900: sáu ảnh tải thành công, lưới 3 × 2, không overflow ngang.
- Browser mobile override 390 × 844 (runtime quy đổi thành 488 × 1055, DPR 0.8): lưới một cột, không overflow ngang; bottom navigation vẫn sử dụng được.
- Browser console: 0 warning/error.
- `npm run build`: passed; `/games` và `/writing` có trong manifest.
- `npx tsc --noEmit`: passed.
- `npm test`: 49/49 passed.
- `npm run lint`: exit 0; còn một warning `<img>` có sẵn tại `components/work-practice-hub.tsx`, không thuộc card trò chơi.
- `git diff --check`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.

final result: passed

---

# Design QA — Trung tâm Trò chơi HanziWork

## Nguồn, phạm vi và bằng chứng

- Nguồn chức năng: video người dùng cung cấp `FSave.com_Reels_Ngoc-Luong-on-Reels_Media_1052020050692000_001_1080p.mp4` (1920 × 1020, 154 giây).
- Video đã được đọc theo chuỗi trạng thái trong `docs/design-target/game-video/contact-sheet-01.jpg` đến `contact-sheet-05.jpg`; các chức năng nhận diện được gồm ghép cặp, nối chữ–pinyin, nghe chọn nghĩa, viết chữ theo nghĩa, flashcard và kiểm tra tổng hợp.
- Bản triển khai toàn màn hình: `docs/design-qa/game-center-desktop-final.png`.
- Bản responsive mobile: `docs/design-qa/game-center-mobile-final.png`; sân chém từ mobile: `docs/design-qa/game-slice-mobile.png`.
- Trò ghép cặp desktop: `docs/design-qa/game-memory-desktop-final.png`.
- So sánh video–trung tâm trò chơi trong cùng một ảnh: `docs/design-qa/comparison-video-to-game-center.jpg`.
- So sánh tập trung trò ghép cặp: `docs/design-qa/comparison-memory-game.jpg` — video bên trái, HanziWork bên phải.

## Kết quả đối chiếu và lịch sử sửa

1. P1 đã sửa: lần render đầu dùng `next/image` làm Vinext phát sinh lỗi tối ưu ảnh và bật overlay che Panda. Đã dùng trực tiếp PNG có sẵn trong `public/assets/writing/`; reload sau sửa không còn overlay và browser log không còn warning/error.
2. P2 đã sửa: các thẻ ghép cặp ban đầu chỉ có tên truy cập `?`, còn hai cột nối thiếu trạng thái được chọn. Đã thêm `aria-label`, `aria-pressed` và định danh ổn định cho từng thẻ/cặp.
3. P2 đã sửa: điều hướng cũ “Tập viết” không phản ánh phạm vi mới. Rail desktop và bottom nav hiện dùng “Trò chơi” với Lucide Gamepad2; `/writing` chuyển hướng an toàn sang `/games` để không làm hỏng bookmark cũ.
4. P2 responsive: dashboard chuyển từ hero hai cột sang một cột, catalog ba cột sang một cột, CTA full-width và game board tự thu về viewport. Phép đo cuối trên mobile là `scrollWidth = clientWidth = 386`, không tràn ngang; màn Panda cũng `scrollWidth = clientWidth = 386`.
5. P3 chấp nhận: in-app browser nhân tile khi chụp ở viewport override; ảnh QA cuối đã crop đúng tile đầu. Đây là lỗi capture, không phải layout — số đo DOM không có overflow và ảnh crop thể hiện đúng trạng thái nhìn thấy.

## Fidelity và chất lượng sản phẩm

- Layout: video gốc là một trang học cũ với tab công cụ; bản HanziWork giữ đúng cơ chế trò chơi nhưng tổ chức lại thành hub bảy game, một game nổi bật và sáu card phụ để phù hợp shell hiện có.
- Typography: dùng nguyên hệ chữ HanziWork; Hán tự là lớp chữ lớn nhất trong game, sau đó là pinyin/nghĩa/hướng dẫn. Không có chữ Việt hoặc chữ Hán bị cắt ở desktop/mobile.
- Colors/surfaces: giữ pine, teal, ivory, coral và vàng nhạt của sản phẩm; không thêm gradient, neon hoặc CSS-art.
- Imagery: tái sử dụng đúng Panda, nền tre và hiệu ứng chém PNG/WebP hiện có; không dùng placeholder hoặc hình vẽ bằng div/SVG. Panda có nền alpha sạch và crop vừa hero/mobile.
- Icons: toàn bộ Gamepad2, Volume2, Timer, Trophy, Link2, Headphones, Keyboard và trạng thái đúng/sai dùng chung Lucide, cùng stroke và căn giữa.
- Copy/content: 12 từ công việc thật, pinyin, nghĩa và câu ví dụ; không dùng lorem ipsum. Nội dung có thể dùng chung với lộ trình Văn phòng & hành chính.
- Motion/accessibility: hover/flip/slicing có `prefers-reduced-motion`; control là button/input có nhãn, focus target và tap target phù hợp mobile.

## Chức năng đã kiểm thử trên trình duyệt

- Luyện chém từ: bắt đầu lượt, gõ `ni hao`, Enter; tiến độ đổi `0/12 → 1/12`, điểm `0 → 100`, từ kế tiếp chuyển sang `谢谢`.
- Ghép cặp: ghép đủ bốn cặp; xuất hiện màn hoàn thành `1000 điểm`, hub đổi thành `1/7`, XP `500` và card có trạng thái đã chơi.
- Nối chữ–âm: chọn `你好` rồi `nǐ hǎo`; tiến độ đổi `0/5 → 1/5`.
- Nghe và chọn: nút phát âm hoạt động, chọn `xin chào`; nút “Câu tiếp theo” được bật.
- Viết chữ theo nghĩa: nhập `谢谢` cho “cảm ơn”; phản hồi chính xác hiển thị cùng pinyin.
- Flashcard 3D: lật thẻ rồi chấm “Đã nhớ”; tiến độ đổi `1/6 → 2/6`.
- Thử thách tổng hợp: chọn nghĩa đúng của `你好`; nút câu tiếp theo được bật.
- Route cũ `/writing` chuyển thành công tới `/games`; console cuối có 0 warning/error.

## Kiểm tra kỹ thuật

- `npx tsc --noEmit`: passed.
- `npm test`: 49/49 passed.
- `npm run lint`: exit 0; còn một warning `<img>` có sẵn tại `components/work-practice-hub.tsx`, không thuộc Trung tâm Trò chơi.
- `npm run build`: passed; `/games` và route tương thích `/writing` có trong manifest.
- `git diff --check`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.
- P0/P1/P2 còn lại: không.

final result: passed

---

# Design QA — Thu gọn “Câu dùng ngay” theo màn hình thực tế

## Nguồn, trạng thái và bằng chứng

- Source visual truth: `docs/design-target/home-daily-phrase-compact-request.png` — ảnh người dùng 1919 × 1079 px, gồm browser chrome và taskbar.
- Source đã chuẩn hóa: `docs/design-target/home-daily-phrase-compact-request-normalized.png` — crop vùng nội dung từ y=150, sau đó scale về 1537 × 697 px để khớp CSS viewport kiểm thử.
- Implementation desktop: `docs/design-qa/home-daily-phrase-compact-desktop.png` — CSS viewport 1537 × 697, DPR 0.8; capture gốc 1898 × 871 bị lặp tile bởi viewport capability và đã crop tile đầu về 1537 × 697 px.
- Implementation mobile: `docs/design-qa/home-daily-phrase-compact-mobile.png` — CSS viewport 390 × 844, DPR 0.8; capture gốc 464 × 1055 và crop tile đầu về 390 × 844 px.
- Full-view comparison: `docs/design-qa/home-daily-phrase-compact-comparison.png` — yêu cầu trước sửa bên trái, implementation sau sửa bên phải trong cùng một ảnh.
- Focused comparison: `docs/design-qa/home-daily-phrase-compact-focused-comparison.png` — panel cũ bên trái và panel đã thu gọn bên phải.
- State: trang chủ `/`, khách ẩn danh, thẻ ôn 1/5, chưa chọn mức ghi nhớ; mobile được cuộn để panel và các phần liên quan cùng xuất hiện.

## Findings và lịch sử sửa

- [P2] Panel desktop cũ chiếm quá nhiều vùng nhìn: track phụ rộng 410 px, panel cao 370 px; tại màn hình người dùng phần nội dung phía dưới bị đẩy ra khỏi vùng nhìn. Đã giảm track xuống 350 px và panel xuống 300 px, đồng thời giảm padding, cỡ chữ phụ và khoảng cách theo cùng tỷ lệ.
- [P2] Nhịp dọc cũ 26 px và hàng “Tiếp theo” cao 128 px làm GIF phía dưới khó xuất hiện trọn vẹn. Đã giảm gap còn 18 px và hàng tiếp theo còn 112 px. Sau sửa, panel kết thúc ở y=414, hàng tiếp theo ở y=544 và GIF ở y=640 trên viewport cao 697 px.
- Post-fix evidence: full-view và focused comparison nêu trên cho thấy panel nhỏ hơn rõ ràng nhưng vẫn giữ thứ bậc chữ, CTA và vùng phát âm.
- P0/P1/P2 còn lại: không.

## Fidelity và chất lượng

- Fonts/typography: giữ nguyên hệ font HanziWork và font CJK hiện có; Hán tự giảm có kiểm soát từ tối đa 54 px xuống 44 px, pinyin 17 px, nghĩa Việt 14 px. Không wrap hoặc cắt chữ ở desktop/mobile.
- Spacing/layout rhythm: padding panel 24/22 px, khoảng nhãn–Hán tự 18 px, action 50 px; radius, shadow và alignment giữ nguyên. Không có overflow ngang; ở mobile panel rộng 343 px, cao 286 px.
- Colors/tokens: giữ pine `#064f48`, coral, ivory và shadow hiện có; không thay palette hay thêm hiệu ứng trang trí.
- Image quality/assets: giữ đúng GIF sản phẩm dưới “Bài tiếp theo”; không thay bằng placeholder hoặc CSS-art. Capture mobile cho thấy GIF vẫn sắc nét và nằm trọn trong luồng.
- Icons: giữ Volume2 và ArrowRight từ Lucide, căn giữa và giữ touch target 50 px trên desktop; mobile CTA và audio vẫn đủ lớn để thao tác.
- Copy/content: giữ nguyên “Câu dùng ngay”, `我马上跟进。`, pinyin, nghĩa Việt và CTA `/practice`.

## Responsive, tương tác và kiểm thử

- Desktop theo màn hình người dùng: viewport CSS 1537 × 697; panel 350 × 300 tại x=1100/y=114, không tràn và không che “Bài tiếp theo” hay GIF.
- Mobile: viewport CSS 390 × 844; panel 343 × 286, action row rộng 301 px; `scrollWidth` 371 nhỏ hơn viewport 390 nên không tràn ngang.
- Nút phát âm hiển thị và click được; aria-live trả về “Đã phát âm xong.” CTA hiển thị và giữ đúng `href=/practice`.
- Browser interaction không phát sinh page error hoặc trạng thái hỏng; render sau thao tác vẫn ổn định. Công cụ browser hiện tại không cung cấp luồng console riêng, nên lỗi runtime còn được chặn bổ sung bằng lint, typecheck, test và production build.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm test`: 48/48 passed.
- `npm run build`: passed.
- `git diff --check`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.

final result: passed

---

# Design QA — Tập viết / Chém từ cùng Panda

## Nguồn, trạng thái và bằng chứng

- Khung tham chiếu do người dùng cung cấp: `docs/design-target/writing-slice-game/reference-screen.png` — 277 × 560 px.
- Chuỗi chuyển động trích từ video: `docs/design-target/writing-slice-game/motion-contact-sheet.png` — 1174 × 1549 px; bao gồm chữ rơi, Panda lao lên, chữ tách đôi và màn kết thúc.
- Bản desktop đang chơi: `docs/design-qa/writing-slice-game/desktop-playing-1600x900.png` — CSS viewport 1600 × 900, DPR 1 theo DOM.
- Bản desktop lúc Panda chém: `docs/design-qa/writing-slice-game/desktop-strike-1600x900.png` — cùng viewport và từ đầu tiên `你好 / nǐ hǎo`.
- Bản mobile sẵn sàng: `docs/design-qa/writing-slice-game/mobile-ready-390x844.png` — CSS viewport 390 × 844.
- Bản mobile lúc Panda chém: `docs/design-qa/writing-slice-game/mobile-strike-390x844.png` — cùng viewport.
- So sánh toàn màn hình trong cùng một ảnh: `docs/design-qa/writing-slice-game/comparison-reference-vs-web.png`.
- So sánh chuyển động trọng tâm trong cùng một ảnh: `docs/design-qa/writing-slice-game/comparison-motion-vs-strike.png`.

## Kết quả đối chiếu và lịch sử sửa

1. P2 pass 1: bố cục điện thoại của mẫu không thể bê nguyên sang desktop mà vẫn giữ shell HanziWork. Đã chuyển thành sân chơi ngang, giữ nền tre, đình, núi lớp, bảng từ xanh, mục tiêu vàng và Panda cầm gậy; phần từ hiện tại/hướng dẫn được đặt ở cột mở bên phải, không tạo thêm nhiều card.
2. P2 pass 2: hiệu ứng chém 920 ms quá nhanh, khó nhìn thấy Panda chạm mục tiêu và hai nửa chữ tách ra. Đã kéo chu kỳ phản hồi lên 1600 ms, Panda bay 1420 ms và hai nửa chữ tách 1050 ms với easing mềm.
3. P2 pass 3: bản desktop ban đầu cao hơn viewport 24 px. Đã giảm padding cuối trang; phép đo cuối là `scrollHeight = innerHeight = 900`, toàn bộ sân chơi và thanh nhập vừa một màn hình.
4. P2 pass 4: bản mobile cần giữ ô nhập sát ngón tay mà không che bottom nav. Đã đặt thanh nhập sticky ở trên nav, giữ tap target lớn; `scrollWidth = 371` nhỏ hơn `innerWidth = 390`, không tràn ngang.
5. Kiểm tra cuối trên ảnh so sánh: đúng sắc độ ivory/lime/pine của nguồn, cây tre và đình giữ vị trí nhận diện, Panda có cùng mũ vàng/khăn đỏ/gậy tre; khác biệt về tỉ lệ là chủ ý để thích nghi canvas web và hệ điều hướng hiện hữu.

## Tương tác và responsive

- Nút bắt đầu mở lượt 12 từ, tự focus ô nhập; chấp nhận pinyin có dấu hoặc không dấu.
- Gõ `ni hao` cho `你好` tự kích hoạt trạng thái `is-slicing`, tăng `100` điểm, chạy `writing-panda-strike` và `writing-slice-left/right`, rồi chuyển sang từ tiếp theo.
- Từ rơi theo lane và tốc độ riêng; chạm đất làm mất tim, reset combo và chuyển lượt; ba lần trượt mở trạng thái chơi lại.
- Có tạm dừng/tiếp tục, phát âm tiếng Trung bằng giọng thiết bị, combo, điểm, tim và trạng thái hoàn tất.
- Desktop 1600 × 900 và mobile 390 × 844 đều giữ thứ bậc rõ, không cắt chữ Việt/Hán tự và không tràn ngang.
- Browser console của `http://localhost:4174/writing`: 0 warning/error sau luồng bắt đầu → gõ đúng → Panda chém → chuyển từ.

## Kiểm tra kỹ thuật

- `npm run lint`: exit 0; còn 1 warning `<img>` tại `work-practice-hub.tsx` có sẵn từ phần Luyện ca, không thuộc route Tập viết.
- `npx tsc --noEmit`: passed.
- `npm test`: 49/49 passed, gồm test mới cho route, tài sản, navigation và ba animation chính.
- `npm run build`: passed; `/writing` có trong route manifest.
- P0 còn lại: không.
- P1 còn lại: không.
- P2 còn lại: không.

final result: passed

---

# Design QA — “Câu dùng ngay” trên trang chủ

## Nguồn, trạng thái và bằng chứng

- Visual target đã chọn và chỉnh theo phản hồi: `docs/design-target/home-daily-phrase-selected.png` — 1672 × 941 px; chuẩn hóa về 1600 × 900 chỉ cho bước đối chiếu.
- Bản triển khai desktop cuối: `docs/design-qa/home-daily-phrase-desktop-final.png` — viewport CSS 1600 × 900, DPR 1, ảnh 1600 × 900 px.
- So sánh toàn màn hình: `docs/design-qa/home-daily-phrase-comparison.png` — target bên trái, implementation bên phải.
- So sánh tập trung panel: `docs/design-qa/home-daily-phrase-focused-comparison.png` — crop 500 × 500 cho mỗi bên.
- Mobile: `docs/design-qa/home-daily-phrase-mobile-normalized.png` — viewport CSS 390 × 844, DPR 0.8; crop tile đầu về 390 × 844 px do capture capability lặp tile.
- Trạng thái: trang chủ `/`, khách ẩn danh, thẻ 1/5, chưa trả lời; mobile evidence được cuộn đến panel phụ.

## Kết quả đối chiếu và lịch sử sửa

- P2 pass 1 — panel triển khai ban đầu rộng 370 px, cao 386 px tại x=1142/y=124, nhỏ và thấp hơn target nên hierarchy chưa đủ nổi bật. Đã sửa track desktop thành panel 410 × 370 px tại x=1142/y=114; tỷ lệ, vị trí, radius và nhịp chữ sau sửa khớp target.
- P2 pass 1 — hàng “Tiếp theo” và GIF chưa bám đúng nhịp dọc mới. Đã tăng row bài tiếp theo lên 128 px và đặt GIF 210 × 76 px tại y=666, hoàn toàn bên dưới row kết thúc ở y=638.
- Post-fix evidence: `home-daily-phrase-desktop-final.png`, `home-daily-phrase-comparison.png` và focused comparison nêu trên.
- P0/P1/P2 còn lại: không.

## Fidelity và chất lượng

- Typography: giữ font HanziWork hiện có; nhãn uppercase, Hán tự 54 px, pinyin và nghĩa tạo đúng thứ bậc. Không wrap hoặc cắt chữ ở desktop/mobile.
- Spacing/layout: panel pine, audio tròn ivory và CTA coral giữ đúng bố cục editorial của target; desktop không tràn ngang. Mobile chuyển thành một cột, panel rộng 343 px và các nút giữ tap target lớn.
- Màu/token: dùng pine `#064f48`, ivory, coral và teal/blue hiện có; không thêm gradient hoặc decorative blob.
- Image quality: dùng đúng GIF và PNG reduced-motion đã có tại `public/assets/review/`, không placeholder hay CSS-art thay thế. GIF được chuyển thật xuống dưới “Bài tiếp theo” và lazy-load thay vì `priority`.
- Icons: Volume2 và ArrowRight dùng cùng thư viện Lucide hiện hữu; căn giữa, stroke nhất quán và có focus ring toàn cục.
- Copy/content: “Câu dùng ngay”, `我马上跟进。`, pinyin và nghĩa Việt thống nhất với mục tiêu luyện phản xạ công việc; CTA dẫn tới `/practice`.
- P3 chấp nhận: target hiển thị một frame GIF rõ cả ba thẻ, còn browser capture có thể bắt đúng frame chuyển động nên độ đậm từng thẻ khác nhau; asset thực tế là cùng GIF sản phẩm.

## Responsive, tương tác và kiểm thử

- Desktop: viewport 1600 × 900, `scrollWidth - clientWidth = 0`.
- Mobile: viewport 390 × 844, không tràn ngang; khi cuộn cuối trang, panel nằm y=216–546, bài tiếp theo y=562–666, GIF y=682–758 và thanh điều hướng cố định bắt đầu y=774 — còn 16 px khoảng an toàn.
- Nút âm thanh duy nhất hoạt động, aria-live trả về “Đã phát âm xong.”; trạng thái `aria-pressed` phản ánh lúc đang phát.
- CTA “Luyện phản xạ” điều hướng thành công đến `/practice`; các nút/card ôn tập hiện có tiếp tục hoạt động.
- Console sau reload và hành trình CTA: 0 error.
- Trang chủ bỏ truy vấn `getLearningSummary` không còn cần thiết; GIF phụ không còn tải `priority`, giảm công việc ban đầu.
- `npm run lint`: passed.
- `npx tsc --noEmit`: passed.
- `npm test`: 48/48 passed.
- `npm run build`: passed.
- `git diff --check`: passed (chỉ cảnh báo line-ending LF/CRLF của worktree Windows).

final result: passed

---

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
# Design QA — Phiên nghe Luyện ca theo thiết kế đã chọn

## Nguồn, trạng thái và bằng chứng

- Visual target: `docs/design-target/practice-listening-selected.png` — ảnh người dùng cung cấp, 1487 × 1058 px.
- Implementation desktop: `docs/design-qa/practice-selected/10-desktop-final-1600x900.png` — CSS viewport 1600 × 900, DPR 1.
- So sánh chung trong cùng một ảnh: `docs/design-qa/practice-selected/19-desktop-final-comparison.png` — target bên trái được crop theo tỷ lệ 16:9, implementation bên phải.
- Mobile đầu phiên: `docs/design-qa/practice-selected/16-mobile-final-390x844.png` — CSS viewport 390 × 844.
- Mobile vùng trả lời: `docs/design-qa/practice-selected/18-mobile-lower-390x844.png` — cùng viewport, cuộn đến hai lựa chọn và CTA.
- Trạng thái đối chiếu: `/practice`, khách ẩn danh, ca “Báo tiến độ khi sắp trễ hạn”, lượt 1/3, audio đã nghe xong, chưa chọn đáp án.

## Kết quả đối chiếu và lịch sử sửa

- P2 pass 1: phiên cũ còn dùng card bao quanh và chia quá nhiều khối. Đã chuyển sang canvas ivory mở, progress mảnh, ngữ cảnh bên trái và vùng nghe làm trọng tâm như target.
- P2 pass 2: biểu tượng phát lại và vùng trả lời nhỏ hơn target, nhịp dọc khiến câu hỏi lên hơi cao. Đã tăng kích thước icon, typography lựa chọn và chiều cao vùng nghe; câu hỏi và hai đáp án trở về đúng nhịp của mẫu.
- P2 pass 3: nội dung ngữ cảnh desktop chưa wrap giống target. Đã thu độ rộng đoạn mô tả nhưng giữ nguyên chiều rộng tiêu đề và khả năng đọc.
- P0/P1/P2 còn lại: không.

## Fidelity và responsive

- Typography: giữ hệ chữ HanziWork hiện có, heading chính lớn và gọn; chữ Việt không bị cắt, chữ trạng thái và progress vẫn rõ ở desktop/mobile.
- Layout: desktop giữ đúng thứ tự progress → ngữ cảnh/audio → câu hỏi → Đúng/Sai; mobile chuyển thành một luồng cuộn, không biến thành nhiều card nhỏ.
- Màu: ivory `#fafaf6`, pine/teal, mint nhạt và coral nhạt bám target; không thêm gradient, blob hoặc hiệu ứng trang trí.
- Icons: dùng Lucide hiện có cho nghe lại, tốc độ, đúng/sai và điều hướng; không dùng asset giả hoặc CSS-art.
- Mobile 390 × 844 có `body.scrollWidth = 371`, nhỏ hơn viewport 390 nên không tràn ngang. Hai đáp án xếp một cột, giữ tap target lớn và không bị bottom navigation che khi cuộn đến vùng trả lời.
- `prefers-reduced-motion` tắt pulse của audio; hover/focus không làm dịch bố cục.

## Tương tác và kiểm tra kỹ thuật

- Chọn “Đúng” hiển thị phản hồi chính xác, câu tiếng Trung và giải thích; `aria-pressed` và trạng thái disabled được cập nhật đúng.
- “Lượt tiếp theo” chuyển từ lượt 1/3 sang 2/3 và reset lựa chọn.
- Nút nghe lại gọi đúng luồng phát audio; môi trường preview rơi về trạng thái sẵn sàng mà không phát sinh lỗi.
- Browser console: 0 error sau luồng nghe → trả lời → sang lượt.
- `npm run lint`: passed.
- `npm test`: 48/48 passed.
- `npm run build`: passed.
- `git diff --check`: passed; chỉ có cảnh báo line-ending LF/CRLF của worktree Windows.

final result: passed

# Design QA — Nâng cấp hiệu ứng Panda chém chữ

## Nguồn và bằng chứng

- Visual truth: `docs/design-target/writing-slice-game/motion-contact-sheet.png` — 1174 × 1549 px, trích từ video người dùng cung cấp; trạng thái đối chiếu là Panda chạm chữ và chữ tách đôi.
- Asset hiệu ứng mới: `public/assets/writing/bamboo-slice-burst.png` — PNG alpha 1254 × 1254, gồm vệt gậy, điểm lóe, lá tre và mảnh giấy; nguồn chroma được lưu tại `docs/design-target/writing-slice-game/bamboo-slice-burst-chroma.png`.
- Implementation desktop: `docs/design-qa/writing-slice-game/motion-impact-1600x900.png` — CSS viewport 1600 × 900, DOM DPR 1; ảnh browser density được crop về đúng kích thước CSS để loại bỏ tiling của công cụ chụp.
- Implementation mobile: `docs/design-qa/writing-slice-game/motion-mobile-impact-390x844.png` — CSS viewport 390 × 844, cùng trạng thái va chạm.
- So sánh toàn cảnh và chuyển động trong cùng một ảnh: `docs/design-qa/writing-slice-game/comparison-motion-impact-v2.png`.
- Không cần focused crop riêng: vùng Panda/chữ/vệt chém đã đủ lớn và đọc rõ trong ảnh so sánh 2100 × 960.

## So sánh và lịch sử sửa

1. P2 pass 1: hiệu ứng cũ cho chữ biến mất ngay khi người dùng gõ đúng, trước khi Panda chạm mục tiêu; đường bay dùng `left/top` nên thiếu cảm giác lấy đà. Đã giữ nguyên mặt chữ đến thời điểm va chạm 0,86 giây và chuyển toàn bộ đường bay sang `translate3d` với ba mốc lấy đà → tiếp cận → chạm/giữ khung hình → thoát.
2. P2 pass 2: khoảnh khắc chạm còn thiếu phản hồi thị giác. Đã thêm asset vệt chém alpha, lá tre, điểm lóe, điểm số nổi, rung sân chơi 2 px và hai nửa bảng chữ rơi theo quán tính riêng.
3. P2 pass 3: ở mobile, lane đầu tiên 24% khiến Panda và vệt chém bị cắt ở cạnh trái. Đã giới hạn lane mobile trong 36–70%; ảnh sau sửa cho thấy impact box bắt đầu ở x = 9,8 px, Panda chỉ vượt cạnh 10,8 px do tư thế gậy và vẫn đọc rõ toàn bộ hành động.
4. Đối chiếu cuối: hướng chém chéo, điểm va chạm, lá tre và hai nửa chữ bám đúng nhịp video; khác biệt về tỉ lệ là chủ ý để phù hợp sân chơi ngang desktop và shell HanziWork.

## Năm bề mặt fidelity bắt buộc

- Typography: không thay đổi hệ chữ HanziWork; Hán tự, điểm số và label lượt vẫn rõ trong khung va chạm.
- Spacing/layout: desktop giữ `scrollHeight = innerHeight = 900`; mobile có `scrollWidth = 371 < innerWidth = 390`, không tràn ngang.
- Colors/tokens: vệt ivory/pale-yellow và lá bamboo-green hòa với nền hiện hữu, không dùng neon hoặc gradient CSS.
- Image quality: effect là raster alpha thật, mép trong suốt sạch, không còn chroma magenta thấy được; Panda và nền gốc không bị thay đổi.
- Copy/content: giữ nguyên hướng dẫn, pinyin, nghĩa, điểm, combo và mục tiêu của lượt luyện.

## Tương tác và kỹ thuật

- Gõ `ni hao` kích hoạt `is-slicing`; tại ảnh chụp, `writing-panda-strike` và `writing-slice-impact` đang chạy, impact opacity = 0,96, mặt chữ cũ đã tắt và hai nửa chữ có opacity = 0,99.
- Chu kỳ phản hồi kéo dài 1,78 giây để người dùng nhìn trọn va chạm trước khi chuyển từ; điểm tăng đúng `+100` ở lượt đầu.
- Browser console của `http://localhost:4174/writing`: 0 warning/error.
- `npx tsc --noEmit`: passed.
- `npm test`: 49/49 passed.
- `npm run lint`: exit 0; còn 1 warning `<img>` có sẵn tại phần Luyện ca, không thuộc hiệu ứng này.
- `npm run build`: passed.
- `git diff --check`: passed; chỉ có cảnh báo line-ending LF/CRLF của worktree Windows.
- P0/P1/P2 còn lại: không.

final result: passed

# Design QA — Màn chơi theo phương án số 2 “Đảo trò chơi Cánh Cụt”

## Nguồn, trạng thái và bằng chứng

- Visual target: phương án số 2 người dùng chọn, ảnh gốc 1672 × 941 px; được chuẩn hóa 1600 × 900 để so sánh.
- Implementation desktop: `docs/design-qa/game-session-mint-island/memory-desktop-1600x900.jpg` — CSS viewport 1600 × 900, trạng thái đầu trò “Ghép cặp siêu tốc”.
- So sánh toàn màn hình: `docs/design-qa/game-session-mint-island/comparison-memory-option-2.jpg` — target bên trái, implementation bên phải.
- So sánh tập trung header và bàn thẻ: `docs/design-qa/game-session-mint-island/comparison-memory-option-2-focused.jpg`.
- Implementation mobile: `docs/design-qa/game-session-mint-island/memory-mobile-390x844.jpg` — CSS viewport 390 × 844.

## Kết quả đối chiếu và lịch sử sửa

1. P1 pass 1: shell trò chơi cộng dồn `margin-left` với learner shell, làm desktop tràn ngang và lặp phần giao diện ở cạnh phải. Đã đưa game session về đúng hệ tọa độ của app shell; `scrollWidth = innerWidth = 1600`.
2. P1 pass 2: trên mobile, mở game từ vị trí cuối bản đồ giữ nguyên scroll cũ nên tiêu đề màn chơi nằm ngoài viewport. Đã reset scroll khi đổi game; kiểm tra sau sửa cho `scrollY = 0` và heading bắt đầu ở vùng nhìn thấy.
3. P2 pass 3: card chơi cũ còn mang cảm giác khung quản trị màu trắng. Đã chuyển toàn bộ sáu game sang canvas mint-island, ba ô chỉ số dạng tactile, mascot riêng theo game, thẻ pastel nổi và vùng hướng dẫn nổi nhẹ trên đảo.
4. Đối chiếu cuối: bố cục title trái/metric phải, đảo mint full màn hình, lưới 4 × 2, palette ivory–mint–coral–lavender–gold và mascot bám sát phương án số 2. Nút quay lại và dấu hỏi trên thẻ được giữ có chủ ý để game dùng được ngay.
5. P0/P1/P2 còn lại: không.

## Fidelity, responsive và accessibility

- Typography: giữ hệ chữ HanziWork, heading lớn nhưng không lấn metric; chữ Việt và Hán tự không bị cắt ở desktop/mobile.
- Layout: desktop không còn khung trắng bao ngoài; mobile 390 px đổi lưới thành 2 cột, `body.scrollWidth = 371 < innerWidth = 390`, không tràn ngang.
- Colors/surfaces: nền ivory, đảo mint và bốn màu thẻ pastel theo đúng hướng cute; không dùng gradient CSS, viền card nặng hoặc blob trang trí.
- Image quality: background game dùng WebP 1600 × 900 và mascot raster alpha có sẵn của HanziWork; crop rõ, không halo hoặc méo tỉ lệ.
- Icons: dùng Lucide đồng bộ cho tiến độ, điểm, lượt, quay lại và gợi ý.
- Tương tác: nút/thẻ là semantic button, có aria-label/aria-pressed, focus-visible, tap target lớn và `prefers-reduced-motion`.

## Tương tác và kiểm tra kỹ thuật

- Ghép `你好` với `xin chào`: hai thẻ chuyển `is-revealed is-matched`, bị khóa và tiến độ tăng từ 0/4 lên 1/4.
- “Nghe và chọn đúng”: chọn “B — xin chào” chuyển `is-correct`, metric đúng tăng và nút “Câu tiếp theo” được mở khóa.
- Browser console ở `/games`: 0 warning/error sau hai luồng thao tác.
- `npx eslint components/game-center.tsx`: passed.
- `npm test`: 49/49 passed.
- `npm run build`: passed.
- `git diff --check`: passed; chỉ có cảnh báo line-ending LF/CRLF của worktree Windows.

final result: passed

# Design QA — Vùng an toàn mascot cho sáu trò chơi

## Nguồn, trạng thái và bằng chứng

- Visual truth trước sửa: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-6c8b642d-ccca-4c16-ac1f-9e3788379e46.png`, 1781 × 764 px; trạng thái Flashcard 3D với mascot bị cắt ở mép dưới.
- Implementation desktop: `docs/design-qa/game-mascot-safe-zone/flashcard-desktop-1600x900.jpg`, CSS viewport 1600 × 900.
- Implementation mobile: `docs/design-qa/game-mascot-safe-zone/flashcard-mobile-390x844.jpg`, CSS viewport 390 × 844.
- Full-view comparison: `docs/design-qa/game-mascot-safe-zone/comparison-full-context.jpg`; nguồn trước sửa bên trái, implementation sau sửa bên phải. Nguồn được fit vào canvas 1600 × 900 để giữ nguyên tỷ lệ.
- Focused comparison: `docs/design-qa/game-mascot-safe-zone/comparison-mascot-focused.jpg`; vùng mascot trước sửa bên trái và sau sửa bên phải.

## Findings và lịch sử sửa

1. P1 pass 1: mascot dùng `bottom: 1.4%`, nên khi chiều cao world lớn hơn phần viewport đang nhìn thấy, phần thân dưới nằm ngoài màn hình. Đã đổi desktop sang safe offset `clamp(82px, 10vh, 112px)` và giữ nguyên kích thước mascot.
2. P2 pass 2: breakpoint mobile cũ chỉ cách đáy 10 px, khiến mascot bị bottom navigation che. Đã nâng lên 118 px ở tablet và 128 px ở màn ≤560 px.
3. Kiểm tra desktop cho cả Ghép cặp, Nối chữ–âm, Nghe, Viết, Flashcard và Tổng hợp trả về `fullyVisible: true`; hộp mascot nằm trong viewport từ y = 599,88 đến 794,79 px.
4. Kiểm tra mobile 390 × 844 sau sửa: mascot nằm từ y = 693,19 đến 766,81 px, cách mép trên bottom navigation 7,19 px và không bị cắt.
5. P0/P1/P2 còn lại: không.

## Fidelity và kỹ thuật

- Typography, copy, màu, icon và nội dung game không thay đổi.
- Raster mascot giữ nguyên tỉ lệ, độ sắc nét và alpha; chỉ thay đổi vị trí dọc theo breakpoint.
- Không phát sinh tràn ngang; mobile giữ `scrollWidth = 371 < innerWidth = 390`.
- Browser console ở `/games`: 0 warning/error.
- `npx eslint components/game-center.tsx`: passed.
- `npm test`: 49/49 passed.
- `npm run build`: passed.

final result: passed

# Design QA — Luyện chém từ với HUD trong khung game

## Nguồn, trạng thái và bằng chứng

- Source visual truth: `docs/design-target/writing-slice-game/crisp-hud-layout-selected.png`, 1672 × 945 px; phương án đã được người dùng chốt.
- Asset môi trường: `public/assets/writing/bamboo-garden-session-bg.webp`, nền tre–ivory–mint rõ nét được tạo riêng cho phần không gian bao quanh game.
- Implementation route: `/games`, trạng thái sẵn sàng của “Luyện chém từ”.
- Viewport dự kiến đối chiếu: desktop 1672 × 758 CSS px sau khi loại browser chrome và taskbar; responsive bổ sung tại 390 × 844 CSS px.
- Implementation screenshot: chưa thể chụp trong lượt này vì chính sách Browser Use chặn truy cập URL cục bộ `http://localhost:3000/games`.
- Full-view comparison: chưa có vì thiếu browser-rendered implementation screenshot.
- Focused comparison: chưa có vì thiếu browser-rendered implementation screenshot.

## Phần đã triển khai

1. Bỏ tiêu đề và mô tả nhìn thấy phía trên sân chơi; vẫn giữ `h1` ẩn để không mất tên trang cho trình đọc màn hình.
2. Đưa hai chỉ số “Đã chém” và “Điểm” vào góc phải phía trên của sân game bằng chip ivory đặc, không dùng blur.
3. Căn giữa cụm sân chơi và cột thông tin, giới hạn chiều cao theo viewport và thêm breakpoint cho màn thấp để tránh tràn khỏi màn hình.
4. Đổi lớp phủ trạng thái sẵn sàng sang nền ivory đặc, giúp Hán tự hiện tại, pinyin, luật chơi và điều khiển luôn rõ nét.
5. Bổ sung nền tre ngoài sân chơi và bố cục responsive; mobile thu gọn HUD, giữ khu nhập liệu và cột thông tin dễ đọc.

## Fidelity surfaces

- Typography/copy: giữ hệ chữ HanziWork và toàn bộ nội dung trò chơi; tiêu đề ngoài chỉ được ẩn trực quan theo yêu cầu.
- Spacing/layout: HUD nằm trong sân chơi; game layout được giới hạn 1320 px và căn giữa; có breakpoint riêng cho chiều cao dưới 820 px.
- Colors/tokens: giữ pine–teal–ivory; HUD và overlay dùng màu đặc để không làm mờ nội dung.
- Image quality: asset nền WebP 34 KB, không chữ, không giao diện và không placeholder; ảnh sân chơi/mascot production giữ nguyên.
- Copy/content: “Đã chém”, “Điểm”, từ hiện tại, pinyin, luật, mẹo và luồng nhập đáp án không thay đổi chức năng.

## Kiểm tra kỹ thuật

- `npx eslint components/writing-slice-game.tsx`: passed.
- `npm test`: 49/49 passed.
- `npm run build`: passed; `/games` có trong manifest.
- `git diff --check -- components/writing-slice-game.tsx app/globals.css`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.
- Primary browser interactions và console errors: chưa kiểm tra được do URL local bị Browser Use chặn.

## Findings và lịch sử

- Không phát hiện lỗi cú pháp, lint, test hoặc build.
- [P1 blocker] Chưa có browser-rendered screenshot và chưa thể đặt source/implementation trong cùng một comparison input. Cần reload `/games` trong trình duyệt local rồi chụp lại đúng viewport để hoàn tất visual QA.

final result: blocked

# Design QA — Chế độ toàn màn hình cho các trò chơi

## Nguồn, trạng thái và bằng chứng

- Source visual truth: `C:/Users/Windows/AppData/Local/Temp/codex-clipboard-21037e0d-cebd-4786-aef0-52c12e9c5c54.png`, 1792 × 867 px; trạng thái “Luyện chém từ” còn top navigation và thiếu nút quay lại nhìn thấy được.
- Implementation route: `/games`, trạng thái sau khi mở bất kỳ trạm trò chơi nào.
- Viewport mục tiêu: desktop 1792 × 867 CSS px; responsive mobile giữ game full viewport.
- Implementation screenshot: chưa thể chụp vì Browser Use không truy cập được URL cục bộ `http://localhost:3000/games` trong môi trường kiểm thử này.
- Full-view comparison: chưa có vì thiếu browser-rendered implementation screenshot.
- Focused comparison: chưa có vì thiếu browser-rendered implementation screenshot.

## Phần đã triển khai

1. Thêm trạng thái shell `game-immersive-dashboard` cho cả Luyện chém từ và sáu trò chơi còn lại.
2. Khi trạng thái này hiện diện, ẩn `learn-rail`, `learn-topbar`, `learner-mobile-nav` và route progress; phần game trở về `100dvh` và không còn offset trái/trên.
3. Bổ sung nút `writing-game-back` ở góc trái sân Luyện chém từ với z-index cao hơn overlay, luôn bấm được ở trạng thái sẵn sàng, đang chơi và kết quả.
4. Dịch nút tạm dừng sang phải để không chồng lên nút quay lại; loại bỏ khoảng đệm mobile trước đây dành cho bottom navigation.

## Fidelity surfaces

- Typography/copy: không thay đổi nội dung hay thứ bậc chữ của màn game.
- Spacing/layout: game dùng toàn bộ viewport; không còn khoảng trống dành cho top bar, rail hoặc bottom navigation.
- Colors/tokens: nút quay lại dùng đúng ivory–teal và shadow nhẹ của HUD các trò chơi còn lại.
- Image quality: nền tre, mascot và asset trò chơi được giữ nguyên, không crop hoặc nén lại.
- Copy/content: accessible label “Quay lại tất cả trò chơi” được giữ thống nhất cho cả bảy game.

## Kiểm tra kỹ thuật

- `npx eslint components/game-center.tsx components/writing-slice-game.tsx`: passed.
- `npm test`: 49/49 passed; đã thêm regression assertions cho immersive shell và nút quay lại.
- `npm run build`: passed; `/games` có trong manifest.
- `git diff --check`: passed; chỉ có cảnh báo LF/CRLF của worktree Windows.

## Findings và lịch sử

- [P1] Source còn top navigation và thiếu nút quay lại hiển thị ở trạng thái ready. Đã sửa bằng shell full viewport và back button riêng nằm trên overlay.
- [P1 blocker] Chưa có browser-rendered screenshot sau sửa để xác nhận trực quan nav đã biến mất và nút quay lại không bị che. Cần người dùng reload `/games` và cung cấp ảnh sau sửa để hoàn tất vòng visual QA.

final result: blocked

---

# Design QA — Chuyển động đăng nhập “bước chân + khung bay khỏi túi”

## Nguồn và bằng chứng

- Video chuyển động tham chiếu: `C:/Users/Windows/Downloads/1786379438132_2299012107817654072_1234608406821690621.mp4`; contact sheet gốc: `docs/design-target/login-video/motion-contact-sheet.png`.
- Chu kỳ bước chân 4 frame theo mascot production: `public/assets/auth/penguin-walk-cycle.png`; bản nền trong suốt: `docs/design-target/login-video/penguin-walk-cycle-transparent.png`.
- Chuỗi 8 mốc chuyển động desktop: `docs/design-qa/login-satchel/motion-v2/motion-contact-sheet.png`.
- Render hoàn tất: `docs/design-qa/login-satchel/implementation-desktop-motion-v2.png` và `docs/design-qa/login-satchel/implementation-mobile-motion-v2.png`.
- Đối chiếu source đã chọn và implementation: `docs/design-qa/login-satchel/comparison-desktop-motion-v2.png`.

## Findings và lịch sử sửa

1. [P1] CSS intro cũ bắt đầu ngay khi HTML/CSS được tải nên phần lớn chuyển động đã chạy xong trước khi route `/login` hiển thị. Đã chuyển sang kích hoạt bằng trạng thái client sau hai animation frame; tải mới và nút phát lại đều bắt đầu từ mốc 0 thật.
2. [P1] GIF mascot cũ chỉ thay đổi tư thế vẫy tay nên khi dịch ngang tạo cảm giác “lướt”. Đã thay bằng sprite 4 frame gồm chân trái, passing pose, chân phải và passing pose; frame đổi theo nhịp 540 ms, đi kèm bob thân và bóng chân co giãn.
3. [P1] Khung đăng nhập cũ xuất hiện quá sớm và chưa đọc được là đi ra từ trong túi. Đã đặt khung bắt đầu dưới viewport, thêm lớp foreground lấy đúng phần mép túi để che khung trong giai đoạn đầu, sau đó cho khung trồi lên với overshoot và settle nhẹ.
4. [P2] Đã thêm nút icon phát lại cạnh nút Home; nút có accessible name, focus-visible, hover/active và tự ẩn khi `prefers-reduced-motion: reduce`.
5. Desktop 1280 × 720 cho thấy rõ ba giai đoạn: mascot bước qua nền trống, scene/túi xuất hiện, form trồi từ sau mép túi. Mobile 390 × 844 giữ form trong chiều ngang, nút Home/phát lại không chồng nhau và intro vẫn chạy đúng thứ tự.
- P0/P1/P2 còn lại: không.

## Kiểm tra kỹ thuật và trình duyệt

- Browser console: 0 warning/error sau tải mới, phát lại intro và kiểm tra responsive.
- `npm run build`: passed; route `/login` và asset sprite được phục vụ trong production Worker local.
- `npm test`: passed 91/91.
- `npx tsc --noEmit`: passed.
- `npx eslint components/auth-card.tsx`: passed.
- `prefers-reduced-motion`: scene và form hiện tĩnh; walker, foreground mask và nút phát lại không hiển thị.

final result: passed

---

# Design QA — Motion đăng nhập v4: đi bộ → chỉ túi → khung xuất hiện

## Nguồn và bằng chứng

- Source visual truth: video `C:/Users/Windows/Downloads/1786379438132_2299012107817654072_1234608406821690621.mp4` và contact sheet `docs/design-target/login-video/motion-contact-sheet.png`.
- Source layout đã chọn: `docs/design-qa/login-satchel/source-selected.png`, 1487 × 1058 px.
- Sprite production 8 frame: `public/assets/auth/penguin-walk-cycle-v2.png`, 2560 × 420 px, PNG alpha; nguồn chroma và bản tách nền nằm tại `docs/design-target/login-video/penguin-walk-cycle-8f-chroma.png` và `penguin-walk-cycle-8f-transparent.png`.
- Implementation desktop: `docs/design-qa/login-satchel/implementation-desktop-motion-v4.png`, viewport 1280 × 720 CSS px, DPR 1.
- Implementation mobile: `docs/design-qa/login-satchel/implementation-mobile-motion-v4.png`, viewport 390 × 844 CSS px.
- Full-view comparison: `docs/design-qa/login-satchel/comparison-desktop-motion-v4.png`; source và implementation được thu cùng chiều cao tối đa 500 px để so bố cục.
- Motion comparison: `docs/design-qa/login-satchel/comparison-motion-v4.png`; chuỗi tham chiếu và 14 mốc implementation đặt trong cùng một ảnh.
- Focused motion evidence: `docs/design-qa/login-satchel/motion-v4/motion-contact-sheet.png`; mobile: `docs/design-qa/login-satchel/motion-v4/mobile-motion-contact-sheet.png`.

## Findings và lịch sử sửa

1. [P1] Bản v2 dùng 4 frame ở khoảng 7–8 fps nên chân đổi tư thế còn giật và đọc như một ảnh bị kéo ngang. Fix: tạo sprite 8 frame với hai pha tiếp đất, hai passing pose, hai pha thân hạ và hai pha nhấc chân; cadence cuối khoảng 10.4 fps, bob thân giảm từ 7 px xuống 3 px và bóng chân co nhẹ hơn. Evidence sau sửa: năm mốc đầu của `motion-v4/motion-contact-sheet.png` cho thấy chân đổi liên tục trong khi tâm cơ thể di chuyển đều.
2. [P1] Bản v2 làm walker biến mất rồi form trồi lên gần như ngay lập tức, không có quan hệ nhân quả. Fix: walker tăng dần theo phối cảnh, hòa vào đúng mascot lớn đang chỉ tay; scene hoàn tất trước form và giữ tư thế chỉ túi khoảng nửa giây rồi mới bắt đầu `auth-sheet-rise`.
3. [P2] Pass v3 bắt đầu crossfade hơi sớm nên tại một mốc có thể đọc thành hai Cánh Cụt cùng lúc. Evidence: `docs/design-qa/login-satchel/motion-v3/motion-contact-sheet.png`. Fix v4: dời scene reveal về cuối travel, tăng tỷ lệ walker trước khi hòa cảnh và rút crossfade còn 420 ms. Chuỗi v4 không còn frame trùng nhân vật rõ ràng.
4. [P2] Mobile cần giữ được cùng câu chuyện dù mascot cuối bị crop theo asset portrait. Fix: dùng travel keyframe riêng, baseline 18% viewport và điểm hòa ở 80vw; chuỗi mobile xác nhận ba trạng thái walking, pointing và form xuất hiện không chồng điều khiển.
5. P0/P1/P2 còn lại: không. P3 chấp nhận: source motion là video mobile có phong cách khác, nên implementation giữ mascot, palette và layout production của HanziWork thay vì sao chép nhân vật tham chiếu.

## Fidelity surfaces

- Typography/copy: không thay đổi font, hierarchy, nhãn form hoặc CTA.
- Spacing/layout: card vẫn đi đúng từ sau mép túi; desktop và mobile không phát sinh overflow ngang hoặc chồng nút Home/phát lại.
- Colors/tokens: giữ nguyên ivory–mint–coral–pine; animation không thêm màu hoặc hiệu ứng mới.
- Image quality: sprite v2 dùng PNG alpha thật, cạnh sạch, không nền chroma/halo; tám frame cùng camera, tỷ lệ, baseline và ánh sáng.
- Copy/content: action `/api/auth/login`, liên kết phụ, accessible name và nội dung đăng nhập giữ nguyên.

## Kiểm tra kỹ thuật và tương tác

- Tải mới và nút `Phát lại chuyển động` đều khởi động lại từ mốc 0; fix lint bằng cách reset motion trong event handler thay vì gọi đồng bộ trong effect.
- Browser console: 0 warning/error trên desktop và mobile.
- `npm run build`: passed; `/login` và asset `penguin-walk-cycle-v2.png` được production Worker local phục vụ.
- `npx eslint components/auth-card.tsx`: passed.
- `npx tsc --noEmit`: passed.
- `npm test`: passed 91/91.
- `git diff --check -- components/auth-card.tsx app/globals.css design-qa.md`: passed, chỉ có cảnh báo line-ending Windows.

final result: passed
