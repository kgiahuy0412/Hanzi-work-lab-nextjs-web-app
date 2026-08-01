# Audit luồng Luyện ca trước khi chuyển sang audio-first

## Phạm vi

Luồng mẫu miễn phí “Báo tiến độ khi sắp trễ hạn” trên desktop, từ màn chọn ca đến trạng thái đã chọn đáp án.

## Mục tiêu người dùng

Nghe một phản hồi tiếng Trung, phán đoán phản hồi có phù hợp với tình huống công việc hay không, rồi hiểu vì sao.

## Các bước đã kiểm tra

1. **Chọn ca — Tốt.** Bối cảnh, câu trọng tâm, thời lượng và quyền truy cập đều rõ. CTA bắt đầu dễ thấy.
2. **Làm câu — Cần thay đổi.** Toàn bộ chữ Trung và ba đáp án xuất hiện trước khi nghe, nên người học chủ yếu nhận mặt chữ thay vì luyện tai. Cột thông tin bên phải cũng cạnh tranh sự chú ý trong lúc làm câu.
3. **Nhận phản hồi — Khá tốt.** Trạng thái đúng/sai và giải thích rõ, nhưng chưa hé lộ theo thứ tự nghe → phán đoán → bản chép.

## Rủi ro khả dụng và tiếp cận

- Nút và tiến độ đã có cấu trúc semantic tốt.
- Trạng thái cũ không có bước audio bắt buộc, trạng thái “đang phát/đã nghe” hay phương án nghe chậm.
- Ảnh chụp không đủ để kết luận về điều hướng bàn phím, trình đọc màn hình hoặc chất lượng giọng đọc; các phần này cần kiểm tra trực tiếp sau khi triển khai.

## Hướng xử lý

- Giấu bản chép trước khi trả lời.
- Chỉ mở Đúng/Sai sau khi audio kết thúc.
- Tách phiên luyện khỏi cột tóm tắt để tạo chế độ tập trung.
- Cho nghe lại, nghe chậm và dùng phím D/S.
- Sau lựa chọn mới hiện câu vừa nghe, câu phù hợp hơn và giải thích ngắn.
