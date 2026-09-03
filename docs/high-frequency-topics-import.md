# Tích hợp dữ liệu 27 chủ đề tần suất cao

## Kết luận

File `lesson-high-frequency-v1-27-topics.js` phù hợp để hiển thị trong khu vực **Lộ trình → Chủ đề**, nhưng phù hợp nhất dưới dạng một lộ trình riêng thay vì trộn trực tiếp vào các lộ trình ngành như Văn phòng hoặc Nhà máy.

Lý do: nguồn có 27 chủ đề, gồm 15 chủ đề đời sống và 12 chủ đề tình huống. Chỉ một phần nhỏ mang tính chuyên ngành (công sở, nhà máy, thương mại điện tử), nên việc phân tán chúng vào bảy lộ trình ngành hiện tại sẽ làm nội dung mất cân đối và khó theo dõi nguồn.

## Dữ liệu đã dùng

- 27 chủ đề được chuyển thành 27 bài học.
- 735 mục `word` được chuyển thành thẻ từ vựng.
- 270 mục `sentence` được chuyển thành câu mẫu cho phần Cụm từ và Nghe & nói.
- Audio tốc độ thường của 735 từ được đưa vào `public/audio`; giao diện hiện chưa có điều khiển tốc độ chậm nên không sao chép bản slow.
- Hai `batch_id` của nguồn được giữ thành hai chặng: **Giao tiếp hằng ngày** và **Giao tiếp theo tình huống**.

Các trường trùng nghĩa (`hanzi`/`chinese_text`, `vietnamese`/`vi`, `tone`/`pinyin`, nhiều biến thể đường dẫn audio) và dữ liệu phân đoạn từ trong câu không được đưa vào bản compact vì giao diện hiện không sử dụng.

## Trường giao diện được suy ra

Nguồn không có thời lượng, quyền học thử, mô tả bài hoặc cấp độ hợp lệ (`levelRange` của 15 bài đầu là `???`). Bản tích hợp dùng quy ước hiện tại của web:

- Thời lượng: làm tròn lên theo 2 mục nội dung/phút, thành 18 hoặc 20 phút/bài.
- Học thử: 6 bài đầu, đồng nhất với các lộ trình đang có.
- Cấp độ thẻ lộ trình: `Theo chủ đề`.
- Mô tả bài: tạo từ số lượng từ và câu thật của từng chủ đề.

Nguồn chỉ có các câu độc lập, không có hội thoại theo lượt, ghi chú ngữ pháp hoặc bài kiểm tra. Vì vậy các câu được hiển thị ở Cụm từ/Nghe & nói và không được giả lập thành hội thoại nhập vai.

## Nhập lại dữ liệu

```powershell
npm run content:high-frequency:import -- "D:\duong-dan\lesson-high-frequency-v1-27-topics.js"
```

Trình nhập chỉ đọc mảng JSON trong wrapper, không thực thi JavaScript nguồn. File compact được ghi vào `content/high-frequency-topics.json` và audio từ vựng tốc độ thường được sao chép theo đúng đường dẫn public.

