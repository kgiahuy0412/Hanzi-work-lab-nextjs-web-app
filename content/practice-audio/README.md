# Audio mẫu cho Luyện ca

Thư mục này chứa bản TTS Quan thoại đã duyệt ở mức kỹ thuật cho toàn bộ ca miễn phí. Mỗi tệp được đặt theo `practice_exercises.slug`; `manifest.json` khóa transcript, giọng, thời lượng và checksum để seed không thể gắn nhầm audio.

Tạo lại các tệp bằng:

```bash
npm run practice:audio:generate -- --force
```

Giọng hiện dùng:

- `zh-CN-XiaoxiaoNeural`: văn phòng, bán hàng, nhà hàng và thương mại điện tử.
- `zh-CN-YunxiNeural`: nhà máy, kho vận và giao tiếp cốt lõi.
- Tốc độ `-8%` để câu vẫn tự nhiên nhưng dễ nghe với người mới.

Script chỉ phục vụ khâu biên tập. Ứng dụng không gọi dịch vụ TTS khi phát audio; người học nhận tệp đã lưu trong PostgreSQL qua media route có kiểm tra quyền.

Trước khi dùng trong bản thương mại, nên có người sử dụng Quan thoại thành thạo nghe duyệt phát âm, ngắt câu và mức tự nhiên. Admin có thể thay từng tệp mà seed sau đó không ghi đè bản đã thay.
