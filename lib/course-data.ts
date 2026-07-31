export type Vocabulary = { hanzi: string; pinyin: string; meaning: string; example: string; translation: string };
export type Course = { slug: string; category: string; title: string; chineseTitle: string; hanzi: string; description: string; lessons: number; minutes: number; freeLessons: number; level: string; color: string; ink: string };

export const courses: Course[] = [
  { slug: "van-phong-hanh-chinh", category: "Văn phòng", title: "Văn phòng & hành chính", chineseTitle: "办公室与行政", hanzi: "办", description: "Giao việc, họp, báo cáo tiến độ và xử lý các công việc hành chính thường ngày.", lessons: 24, minutes: 280, freeLessons: 4, level: "Cơ bản", color: "#dcebe2", ink: "#176b5b" },
  { slug: "nha-may-san-xuat", category: "Nhà máy", title: "Nhà máy & sản xuất", chineseTitle: "工厂与生产", hanzi: "产", description: "Ca làm, quy trình sản xuất, thiết bị cơ bản và trao đổi lỗi thường gặp.", lessons: 20, minutes: 235, freeLessons: 3, level: "Cơ bản", color: "#e8e2d5", ink: "#685a3e" },
  { slug: "kho-van-logistics", category: "Logistics", title: "Kho vận & logistics", chineseTitle: "仓储与物流", hanzi: "仓", description: "Nhập xuất kho, đóng gói, kiểm đếm và theo dõi tình trạng giao hàng.", lessons: 22, minutes: 250, freeLessons: 3, level: "Cơ bản", color: "#dae8ed", ink: "#356675" },
  { slug: "ban-hang-cham-soc-khach-hang", category: "Kinh doanh", title: "Bán hàng & chăm sóc khách", chineseTitle: "销售与客户服务", hanzi: "客", description: "Tư vấn nhu cầu, báo giá, phản hồi khách hàng và theo dõi đơn hàng.", lessons: 26, minutes: 310, freeLessons: 4, level: "Cơ bản", color: "#f0dfd9", ink: "#8b554c" },
  { slug: "nha-hang-dich-vu", category: "Dịch vụ", title: "Nhà hàng & dịch vụ", chineseTitle: "餐饮与服务", hanzi: "餐", description: "Đón khách, gọi món, xử lý yêu cầu và các tình huống phục vụ phổ biến.", lessons: 18, minutes: 205, freeLessons: 3, level: "Nhập môn", color: "#f2e7cb", ink: "#826124" },
  { slug: "thuong-mai-dien-tu", category: "Kinh doanh", title: "Thương mại điện tử", chineseTitle: "电子商务", hanzi: "商", description: "Sản phẩm, gian hàng, vận hành đơn và trao đổi với nhà cung cấp Trung Quốc.", lessons: 23, minutes: 265, freeLessons: 3, level: "Cơ bản", color: "#e3dfef", ink: "#63558c" },
  { slug: "giao-tiep-cong-so", category: "Nền tảng", title: "Giao tiếp công sở cốt lõi", chineseTitle: "职场基础沟通", hanzi: "职", description: "Các mẫu câu nền tảng có thể áp dụng chéo cho hầu hết môi trường làm việc.", lessons: 16, minutes: 180, freeLessons: 5, level: "Nhập môn", color: "#dce9dc", ink: "#3f7044" },
];

export const officeVocabulary: Vocabulary[] = [
  { hanzi: "进度", pinyin: "jìndù", meaning: "tiến độ", example: "项目进度怎么样？", translation: "Tiến độ dự án thế nào rồi?" },
  { hanzi: "按时", pinyin: "ànshí", meaning: "đúng giờ, đúng hạn", example: "请按时完成任务。", translation: "Hãy hoàn thành nhiệm vụ đúng hạn." },
  { hanzi: "汇报", pinyin: "huìbào", meaning: "báo cáo", example: "下午向经理汇报。", translation: "Buổi chiều báo cáo với quản lý." },
  { hanzi: "推迟", pinyin: "tuīchí", meaning: "trì hoãn", example: "会议推迟到明天。", translation: "Cuộc họp lùi sang ngày mai." },
];

export const dailyWords = [{ hanzi: "确认", pinyin: "quèrèn", meaning: "xác nhận" }, { hanzi: "安排", pinyin: "ānpái", meaning: "sắp xếp" }, { hanzi: "负责", pinyin: "fùzé", meaning: "phụ trách" }];
export const lessonTitles = ["Chào hỏi tại nơi làm việc", "Nhận và giao nhiệm vụ", "Sắp xếp lịch họp", "Viết và gửi báo cáo", "Theo dõi tiến độ công việc", "Xin hỗ trợ từ đồng nghiệp"];
export function getCourse(slug: string) { return courses.find((course) => course.slug === slug); }
