import lesson01 from "../content/hsk1-textbook-json/lessons/lesson-01.json" with { type: "json" };
import lesson02 from "../content/hsk1-textbook-json/lessons/lesson-02.json" with { type: "json" };
import lesson03 from "../content/hsk1-textbook-json/lessons/lesson-03.json" with { type: "json" };
import lesson04 from "../content/hsk1-textbook-json/lessons/lesson-04.json" with { type: "json" };
import lesson05 from "../content/hsk1-textbook-json/lessons/lesson-05.json" with { type: "json" };
import lesson06 from "../content/hsk1-textbook-json/lessons/lesson-06.json" with { type: "json" };
import lesson07 from "../content/hsk1-textbook-json/lessons/lesson-07.json" with { type: "json" };
import lesson08 from "../content/hsk1-textbook-json/lessons/lesson-08.json" with { type: "json" };
import lesson09 from "../content/hsk1-textbook-json/lessons/lesson-09.json" with { type: "json" };
import lesson10 from "../content/hsk1-textbook-json/lessons/lesson-10.json" with { type: "json" };
import lesson11 from "../content/hsk1-textbook-json/lessons/lesson-11.json" with { type: "json" };
import lesson12 from "../content/hsk1-textbook-json/lessons/lesson-12.json" with { type: "json" };
import lesson13 from "../content/hsk1-textbook-json/lessons/lesson-13.json" with { type: "json" };
import lesson14 from "../content/hsk1-textbook-json/lessons/lesson-14.json" with { type: "json" };
import lesson15 from "../content/hsk1-textbook-json/lessons/lesson-15.json" with { type: "json" };

export type HskTopicIcon = "message" | "people" | "clock" | "food" | "travel" | "work" | "book" | "globe";

export type HskCurriculumLesson = {
  id: string;
  lessonNumber: number;
  title: string;
  vocabulary: number;
  grammar: number;
  dialogues: number;
  writing: number;
  minutes: number;
  guidedSteps: number;
  available: boolean;
};

export type HskCurriculumTopic = {
  id: string;
  title: string;
  icon: HskTopicIcon;
  lessons: HskCurriculumLesson[];
};

export type HskCurriculumLevel = {
  id: string;
  label: string;
  symbol: string;
  description: string;
  topics: HskCurriculumTopic[];
};

function toSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function makeLessons(
  levelId: string,
  titles: string[],
  baseVocabulary: number,
): HskCurriculumLesson[] {
  return titles.map((title, index) => ({
    id: `${levelId}-${toSlug(title)}`,
    lessonNumber: index + 1,
    title,
    vocabulary: baseVocabulary + (index % 3),
    grammar: 2 + (index % 2),
    dialogues: 1 + (index % 2),
    writing: 0,
    minutes: 12 + (index % 3),
    guidedSteps: 0,
    available: false,
  }));
}

function makeTopic(
  levelId: string,
  id: string,
  title: string,
  icon: HskTopicIcon,
  lessonTitles: string[],
  baseVocabulary: number,
): HskCurriculumTopic {
  return {
    id,
    title,
    icon,
    lessons: makeLessons(levelId, lessonTitles, baseVocabulary),
  };
}

type RawTextbookLesson = {
  slug: string;
  metadata: {
    lessonNumber: number;
    titleVi: string;
    estimatedMinutes: number;
  };
  sections: Array<{
    type: string;
    itemRefs?: string[];
  }>;
};

const RAW_HSK_1_LESSONS = [
  lesson01,
  lesson02,
  lesson03,
  lesson04,
  lesson05,
  lesson06,
  lesson07,
  lesson08,
  lesson09,
  lesson10,
  lesson11,
  lesson12,
  lesson13,
  lesson14,
  lesson15,
] as unknown as RawTextbookLesson[];

function sectionCount(lesson: RawTextbookLesson, type: string): number {
  return lesson.sections.find((section) => section.type === type)?.itemRefs?.length ?? 0;
}

const HSK_1_TEXTBOOK_LESSONS: HskCurriculumLesson[] = RAW_HSK_1_LESSONS.map((lesson) => {
  const vocabulary = sectionCount(lesson, "vocabulary");
  const grammar = sectionCount(lesson, "grammar");
  const dialogues = sectionCount(lesson, "dialogue");
  const writing = sectionCount(lesson, "writing");
  const assessments = sectionCount(lesson, "practice");
  const pronunciationSteps = sectionCount(lesson, "pronunciation") > 0 ? 1 : 0;
  return {
    id: lesson.slug,
    lessonNumber: lesson.metadata.lessonNumber,
    title: lesson.metadata.titleVi,
    vocabulary,
    grammar,
    dialogues,
    writing,
    minutes: lesson.metadata.estimatedMinutes,
    guidedSteps: vocabulary + grammar + dialogues + pronunciationSteps + assessments + 3,
    available: true,
  };
});

function textbookTopic(
  id: string,
  title: string,
  icon: HskTopicIcon,
  startIndex: number,
  endIndex: number,
): HskCurriculumTopic {
  return {
    id,
    title,
    icon,
    lessons: HSK_1_TEXTBOOK_LESSONS.slice(startIndex, endIndex),
  };
}

export const HSK_CURRICULUM: HskCurriculumLevel[] = [
  {
    id: "hsk-1",
    label: "HSK 1",
    symbol: "壹",
    description: "15 bài từ Giáo trình chuẩn HSK 1, từ chào hỏi đến giao tiếp hằng ngày.",
    topics: [
      textbookTopic("nen-tang-lam-quen", "Nền tảng & Làm quen", "message", 0, 5),
      textbookTopic("giao-tiep-hang-ngay", "Giao tiếp hằng ngày", "people", 5, 10),
      textbookTopic("thoi-gian-hoat-dong", "Thời gian & Hoạt động", "clock", 10, 15),
    ],
  },
  {
    id: "hsk-2",
    label: "HSK 2",
    symbol: "贰",
    description: "Mở rộng hội thoại hằng ngày và diễn đạt nhu cầu rõ hơn.",
    topics: [
      makeTopic("hsk-2", "sinh-hoat-hang-ngay", "Sinh hoạt hằng ngày", "clock", ["Một ngày của tôi", "Thói quen buổi sáng", "Việc nhà", "Ôn tập sinh hoạt"], 13),
      makeTopic("hsk-2", "di-chuyen-thanh-pho", "Di chuyển trong thành phố", "travel", ["Hỏi đường", "Đi xe buýt", "Gọi taxi", "Đến đúng địa điểm"], 12),
      makeTopic("hsk-2", "suc-khoe-co-ban", "Sức khỏe cơ bản", "people", ["Nói về cơ thể", "Mô tả triệu chứng", "Đi khám bệnh", "Lời khuyên sức khỏe"], 14),
      makeTopic("hsk-2", "ke-hoach-loi-moi", "Kế hoạch & Lời mời", "message", ["Rủ bạn đi chơi", "Sắp xếp thời gian", "Đồng ý và từ chối", "Thay đổi kế hoạch"], 13),
    ],
  },
  {
    id: "hsk-3",
    label: "HSK 3",
    symbol: "叁",
    description: "Kết nối ý trong những tình huống học tập, công việc và du lịch.",
    topics: [
      makeTopic("hsk-3", "hoc-tap-cong-viec", "Học tập & Công việc", "work", ["Môi trường học tập", "Trao đổi công việc", "Kế hoạch trong ngày", "Báo cáo tiến độ"], 16),
      makeTopic("hsk-3", "du-lich-dich-vu", "Du lịch & Dịch vụ", "travel", ["Đặt phòng", "Làm thủ tục", "Hỏi thông tin", "Xử lý thay đổi"], 15),
      makeTopic("hsk-3", "cam-xuc-trai-nghiem", "Cảm xúc & Trải nghiệm", "message", ["Miêu tả cảm xúc", "Kể một trải nghiệm", "Đưa ra nhận xét", "An ủi và động viên"], 15),
      makeTopic("hsk-3", "giao-tiep-xa-hoi", "Giao tiếp xã hội", "people", ["Gặp gỡ bạn mới", "Trao đổi sở thích", "Đề xuất hoạt động", "Giữ liên lạc"], 16),
    ],
  },
  {
    id: "hsk-4",
    label: "HSK 4",
    symbol: "肆",
    description: "Theo kịp hội thoại tự nhiên và trình bày quan điểm có cấu trúc.",
    topics: [
      makeTopic("hsk-4", "cong-viec-chuyen-nghiep", "Công việc chuyên nghiệp", "work", ["Phân công nhiệm vụ", "Sắp xếp cuộc họp", "Giải quyết vấn đề", "Tổng kết dự án"], 18),
      makeTopic("hsk-4", "tin-tuc-xa-hoi", "Tin tức & Xã hội", "globe", ["Đọc tin ngắn", "Tóm tắt sự kiện", "Nêu nguyên nhân", "Trao đổi ảnh hưởng"], 18),
      makeTopic("hsk-4", "quan-diem-thao-luan", "Quan điểm & Thảo luận", "message", ["Nêu quan điểm", "Đồng tình có điều kiện", "Phản biện lịch sự", "Đi đến kết luận"], 17),
      makeTopic("hsk-4", "dich-vu-khieu-nai", "Dịch vụ & Khiếu nại", "people", ["Mô tả sự cố", "Yêu cầu hỗ trợ", "Đề xuất giải pháp", "Xác nhận kết quả"], 18),
    ],
  },
  {
    id: "hsk-5",
    label: "HSK 5",
    symbol: "伍",
    description: "Xử lý văn bản dài hơn, lập luận nhiều lớp và ngôn ngữ công việc.",
    topics: [
      makeTopic("hsk-5", "thuyet-trinh-lap-luan", "Thuyết trình & Lập luận", "message", ["Mở đầu thuyết trình", "Sắp xếp luận điểm", "Dùng ví dụ thuyết phục", "Kết luận và hỏi đáp"], 21),
      makeTopic("hsk-5", "kinh-te-kinh-doanh", "Kinh tế & Kinh doanh", "work", ["Đọc xu hướng", "Trao đổi số liệu", "Đánh giá phương án", "Dự báo kết quả"], 20),
      makeTopic("hsk-5", "van-hoa-truyen-thong", "Văn hóa & Truyền thông", "globe", ["Phân tích một bài báo", "So sánh quan điểm", "Tóm tắt nội dung", "Viết phản hồi"], 20),
      makeTopic("hsk-5", "van-ban-hoc-thuat", "Văn bản học thuật", "book", ["Đọc ý chính", "Nhận diện lập luận", "Ghi chú có hệ thống", "Viết đoạn tổng hợp"], 22),
    ],
  },
  {
    id: "hsk-6",
    label: "HSK 6",
    symbol: "陆",
    description: "Hiểu sắc thái, tổng hợp thông tin và diễn đạt chuyên sâu.",
    topics: [
      makeTopic("hsk-6", "ngon-ngu-hoc-thuat", "Ngôn ngữ học thuật", "book", ["Khái niệm trừu tượng", "Quan hệ nhân quả", "So sánh học thuật", "Tổng hợp nguồn"], 24),
      makeTopic("hsk-6", "phan-tich-xa-hoi", "Phân tích xã hội", "globe", ["Đọc dữ liệu xã hội", "Giải thích hiện tượng", "Đánh giá tác động", "Đề xuất chính sách"], 23),
      makeTopic("hsk-6", "quan-tri-chien-luoc", "Quản trị & Chiến lược", "work", ["Xác định ưu tiên", "Phân bổ nguồn lực", "Quản trị rủi ro", "Đánh giá hiệu quả"], 24),
      makeTopic("hsk-6", "tranh-luan-nang-cao", "Tranh luận nâng cao", "message", ["Xây dựng lập trường", "Phân tích phản đề", "Bảo vệ luận điểm", "Điều phối thảo luận"], 23),
    ],
  },
  {
    id: "hsk-7-9",
    label: "HSK 7–9",
    symbol: "柒",
    description: "Vận dụng tiếng Trung trong nghiên cứu và bối cảnh chuyên môn phức tạp.",
    topics: [
      makeTopic("hsk-7-9", "nghien-cuu-chuyen-sau", "Nghiên cứu chuyên sâu", "book", ["Đặt câu hỏi nghiên cứu", "Đọc tài liệu chuyên ngành", "Phân tích phương pháp", "Trình bày phát hiện"], 28),
      makeTopic("hsk-7-9", "dam-phan-ngoai-giao", "Đàm phán & Ngoại giao", "people", ["Xác lập lợi ích", "Đọc hàm ý", "Xử lý bế tắc", "Soạn thỏa thuận"], 27),
      makeTopic("hsk-7-9", "kinh-te-vi-mo", "Kinh tế vĩ mô", "work", ["Đọc chỉ báo kinh tế", "Phân tích chu kỳ", "Đánh giá chính sách", "Dự báo kịch bản"], 28),
      makeTopic("hsk-7-9", "khoa-hoc-cong-nghe", "Khoa học & Công nghệ", "globe", ["Mô tả đổi mới", "Phân tích tác động", "Tranh luận đạo đức", "Viết báo cáo chuyên môn"], 29),
    ],
  },
];

export function getHskCurriculumLevel(levelId: string) {
  return HSK_CURRICULUM.find((level) => level.id === levelId);
}
