# Himi Chinese — Báo tiến độ công việc

Video học tình huống dài 60 giây, được dựng bằng Remotion với hai bố cục:

- `HimiWorkProgressLandscape`: 1920 × 1080 cho website.
- `HimiWorkProgressPortrait`: 1080 × 1920 cho Reels/TikTok/Shorts.

## Nội dung

1. Giới thiệu tình huống.
2. Ba câu hội thoại có Hán tự, pinyin, tiếng Việt và khoảng nghỉ shadowing.
3. Ôn ba cụm từ trọng tâm.
4. Câu hỏi kiểm tra nhanh cuối video.

Video sử dụng linh vật chính thức của Himi Chinese và giọng đọc tiếng Trung tổng hợp. Không sử dụng hình ảnh hay âm thanh từ video tham khảo của bên thứ ba.

## Chạy và chỉnh sửa

```powershell
npm install
npm run dev
```

Toàn bộ thời gian và nội dung hội thoại nằm trong `src/data.ts`. Hai file âm thanh nằm trong `public/audio`.

## Xuất video

```powershell
npm run render:landscape
npm run render:portrait
```

Caption và metadata dùng cho trình phát trong ứng dụng nằm tại:

- `../../public/assets/videos/work-progress/himi-work-progress.captions.json`
- `../../public/assets/videos/work-progress/himi-work-progress.timeline.json`
