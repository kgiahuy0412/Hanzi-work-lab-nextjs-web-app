# Dòng thời gian trao đổi và quyết định

Đây là bản tóm tắt theo thứ tự thời gian của cuộc trao đổi đã dẫn tới prototype hiện tại. Mục tiêu là giúp một task Codex mới hiểu “vì sao” sản phẩm và code đang có hình dạng như hiện nay.

## 1. Ý tưởng ban đầu và câu hỏi kinh doanh

1. Chủ dự án muốn làm một web app có mô hình tương tự `hoctrung.com` và hỏi có cần người đứng tên, đóng thuế hay ảnh hưởng tới bên tham khảo hay không.
2. Mô hình dự kiến là hai người cùng làm, bán gói VIP để người mua học được nhiều hơn; quy mô nhỏ và từng có giả định doanh thu dưới 1 tỷ đồng/năm có thể không phải nộp thuế.
3. Câu hỏi tiếp theo là cần cung cấp thông tin gì về `hoctrung.com` để phân tích.
4. Chủ dự án mô tả luồng tham khảo: đăng nhập → chọn gói → quét QR SePay → kích hoạt VIP → mở bài bị khóa; tiền được cho là chuyển tới tài khoản một nhân viên.
5. Chủ dự án cũng ghi nhận trang tham khảo không hiện tên chủ sở hữu, mã số thuế, địa chỉ, logo “Đã thông báo Bộ Công Thương”, Điều khoản sử dụng, Chính sách bảo mật hoặc Chính sách hoàn tiền.
6. Hai người sáng lập đều 22 tuổi và chưa từng đăng ký kinh doanh/thuế, nên cần một lộ trình dễ hiểu.
7. Câu hỏi về thời điểm đăng ký được đặt ra: có thể làm app xong rồi mới đăng ký hay không.

Quyết định rút ra: có thể làm prototype trước nhưng không nhận tiền thật/mở bán công khai khi chưa xác định chủ thể, nghĩa vụ thuế và các chính sách. Không coi “dưới 1 tỷ” là kết luận miễn thuế; phải kiểm tra luật hiện hành trước khi bán.

## 2. Định vị sản phẩm

8. Chủ dự án chọn hướng web học tiếng Trung chuyên ngành, tập trung người đang đi làm và người muốn học từ vựng của một ngành khác.
9. Hướng nền tảng là phát triển web/app responsive trước; Flutter APK làm song song về tư duy nhưng chỉ triển khai sau khi web có tín hiệu tốt.
10. Câu hỏi quan trọng là VIP sẽ mở khóa cụ thể những gì.
11. Chủ dự án không muốn làm phần nói theo và chấm điểm phát âm vì có thể cần mã nguồn mở/dịch vụ ngoài và phát sinh phí.
12. Chủ dự án cần nguồn từ vựng và tình huống cho nhiều ngành vì nền tảng cá nhân là IT, không am hiểu sâu các nghề khác.
13. Quyết định bắt đầu bằng ngành phổ thông, tránh kế toán, pháp lý và y tế.
14. Chủ dự án cũng từng hỏi về những ý tưởng web ở lĩnh vực khác, nhưng cuối cùng tiếp tục với HanziWork.

Quyết định rút ra: sản phẩm không cạnh tranh bằng AI phát âm ở MVP; giá trị nằm ở nội dung chuyên ngành có tình huống, phiên học ngắn, ôn tập và lộ trình nghề nghiệp.

## 3. Yêu cầu thiết kế và kiến trúc

15. Yêu cầu thiết kế đầy đủ từng trang web/app theo phong cách dễ học nhưng không quá cơ bản, đẹp, màu không gắt và responsive cho iOS, Android, laptop.
16. Đồng thời yêu cầu thiết kế PostgreSQL, Admin, BPMN quy trình học, chính sách VIP và danh sách tính năng tương lai.
17. Email chính được cung cấp là `giahuy041204@gmail.com`; tài khoản Codex/Figma dùng trong phiên là `huameizhongxin@gmail.com`.
18. File Figma được chia sẻ và đã cấp quyền, nhưng sau đó hướng triển khai chuyển sang prototype code để có thể chỉnh trực tiếp và generate thành giao diện thật.
19. Chủ dự án hỏi cách dùng prototype để thay đổi rồi áp dụng lên frontend, và hỏi backend có nên dùng Next.js hay không.

Quyết định rút ra: dùng Next.js cho web và API giai đoạn đầu, PostgreSQL + Drizzle cho dữ liệu, Flutter về sau dùng chung API. Prototype code là nền tảng thật để phát triển, không phải ảnh Figma phải viết lại từ đầu.

## 4. Prototype trong thư mục Individual Project

20. Chủ dự án yêu cầu triển khai trực tiếp trong `Documents\INDIVIDUAL PROJECT` và cho phép thao tác đầy đủ trong phạm vi project.
21. Prototype đầu tiên có các trang: home, lộ trình, bài học, ôn tập, VIP và Admin; chưa có audio thật.
22. Chủ dự án yêu cầu lộ trình phát triển, quy trình nghiệp vụ từng trang, giao diện đẹp hơn và tài liệu Word.
23. Trong các hướng hình ảnh, chủ dự án chọn “số 3” và yêu cầu responsive cả điện thoại lẫn laptop.
24. Sau đó yêu cầu background đẹp hơn, sáng hơn và nổi bật hơn vì bản cũ còn buồn.
25. Hai hình tham khảo cuối được yêu cầu kết hợp: một hình aqua sạch/sáng và một hình city/ivory ấm.
26. Bản kết hợp được duyệt với câu “ok triển khai bản này”.

## 5. Triển khai bản kết hợp

27. Trang chủ được căn lại theo hình duyệt: rail emerald, top bar, lesson card, CTA, review queue, weekly goal và VIP banner.
28. Asset nền riêng được tạo và lưu tại `public/assets/hanziwork-dashboard-background.png`.
29. Desktop được hiệu chỉnh theo khung hình nguồn 1487 × 1058.
30. Lần kiểm tra mobile đầu phát hiện tràn ngang; breakpoint được sửa để top bar/frame bắt đầu tại x=0, cột phụ chuyển thành một cột và document không vượt viewport.
31. CTA “Bắt đầu bài học” và bottom nav “Lộ trình” được kiểm tra bằng trình duyệt; không có lỗi console.
32. Test, lint và production build đều passed; `design-qa.md` kết thúc bằng `final result: passed`.

## 6. Yêu cầu bàn giao hiện tại

33. Chủ dự án muốn có thể tạo một task/project Codex mới, chỉ tới thư mục này và tiếp tục toàn bộ bối cảnh mà không kể lại từ đầu.
34. Vì vậy đã tạo `CODEX_START_HERE.md`, tệp dòng thời gian này, `docs/SESSION_CHANGELOG.md`, đồng thời sao chép hình chuẩn và bằng chứng QA vào trong project.

## 7. Những quyết định không nên tự ý đảo ngược

- Web-first; Flutter sau khi web có tín hiệu.
- Không chấm phát âm AI trong MVP.
- Không làm kế toán, pháp lý, y tế ở giai đoạn đầu.
- Không khóa sạch trải nghiệm miễn phí; phải có bài mẫu hoàn chỉnh.
- Quyền VIP phải kiểm tra ở server.
- Kích hoạt SePay qua webhook xác minh và idempotency, không dựa vào ảnh chụp.
- Không nhận tiền thật trước khi hoàn thiện chủ thể kinh doanh và chính sách.
- Giữ design language pine/ivory/aqua/coral/gold và hình chuẩn đã duyệt.
- Dùng code prototype hiện tại làm nền tảng; không khởi tạo lại từ đầu.

