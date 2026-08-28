export type WritingCharacterGroup = "daily" | "work";

export type WritingCharacter = {
  hanzi: string;
  pinyin: string;
  meaning: string;
  strokes: number;
  groups: WritingCharacterGroup[];
};

export type WritingTopic = {
  slug: string;
  level: `HSK ${1 | 2 | 3 | 4 | 5 | 6}`;
  title: string;
  summary: string;
  duration: string;
  outcomes: string[];
  characters: WritingCharacter[];
};

export const WRITING_TOPICS: WritingTopic[] = [
  {
    slug: "hsk-1",
    level: "HSK 1",
    title: "Nét cơ bản và lời chào",
    summary: "Làm quen ô chữ điền, thứ tự nét và sáu chữ nền tảng dùng trong giao tiếp hằng ngày.",
    duration: "12 phút",
    outcomes: ["Nhận biết tám nét cơ bản", "Viết đúng từ trên xuống dưới", "Tự viết sáu chữ không cần mẫu"],
    characters: [
      { hanzi: "你", pinyin: "nǐ", meaning: "bạn", strokes: 7, groups: ["daily"] },
      { hanzi: "好", pinyin: "hǎo", meaning: "tốt, khỏe", strokes: 6, groups: ["daily"] },
      { hanzi: "我", pinyin: "wǒ", meaning: "tôi", strokes: 7, groups: ["daily"] },
      { hanzi: "是", pinyin: "shì", meaning: "là", strokes: 9, groups: ["daily"] },
      { hanzi: "谢", pinyin: "xiè", meaning: "cảm ơn", strokes: 12, groups: ["daily"] },
      { hanzi: "请", pinyin: "qǐng", meaning: "mời, vui lòng", strokes: 10, groups: ["daily"] },
    ],
  },
  {
    slug: "hsk-2",
    level: "HSK 2",
    title: "Chữ Hán trong công việc",
    summary: "Luyện các bộ thủ và chữ thường xuất hiện khi nói về tiến độ, báo cáo và tài liệu.",
    duration: "14 phút",
    outcomes: ["Nhận diện bộ nhân và bộ ngôn", "Giữ đúng tỷ lệ trái–phải", "Viết trọn sáu chữ công việc"],
    characters: [
      { hanzi: "作", pinyin: "zuò", meaning: "làm, thực hiện", strokes: 7, groups: ["work"] },
      { hanzi: "进", pinyin: "jìn", meaning: "tiến, đi vào", strokes: 7, groups: ["work"] },
      { hanzi: "度", pinyin: "dù", meaning: "mức độ, tiến độ", strokes: 9, groups: ["work"] },
      { hanzi: "报", pinyin: "bào", meaning: "báo cáo", strokes: 7, groups: ["work"] },
      { hanzi: "表", pinyin: "biǎo", meaning: "biểu mẫu", strokes: 8, groups: ["work"] },
      { hanzi: "件", pinyin: "jiàn", meaning: "tệp; lượng từ", strokes: 6, groups: ["work"] },
    ],
  },
  {
    slug: "hsk-3",
    level: "HSK 3",
    title: "Nhịp chữ trong đời sống",
    summary: "Kết hợp nét và bộ thủ trong các chữ dùng để nói về học tập, du lịch và nhu cầu hằng ngày.",
    duration: "15 phút",
    outcomes: ["Điều chỉnh khoảng cách giữa các bộ", "Viết nét bao quanh đúng thứ tự", "Tự sửa nét chưa cân đối"],
    characters: [
      { hanzi: "练", pinyin: "liàn", meaning: "luyện tập", strokes: 8, groups: ["daily"] },
      { hanzi: "习", pinyin: "xí", meaning: "học, ôn tập", strokes: 3, groups: ["daily"] },
      { hanzi: "旅", pinyin: "lǚ", meaning: "du lịch", strokes: 10, groups: ["daily"] },
      { hanzi: "游", pinyin: "yóu", meaning: "đi chơi, bơi", strokes: 12, groups: ["daily"] },
      { hanzi: "需", pinyin: "xū", meaning: "cần", strokes: 14, groups: ["work"] },
      { hanzi: "要", pinyin: "yào", meaning: "muốn, cần", strokes: 9, groups: ["daily", "work"] },
    ],
  },
  {
    slug: "hsk-4",
    level: "HSK 4",
    title: "Cấu trúc chữ ghép",
    summary: "Luyện bố cục chữ phức hợp qua nhóm từ kinh nghiệm, thảo luận và giải quyết vấn đề.",
    duration: "17 phút",
    outcomes: ["Tách chữ thành thành phần dễ nhớ", "Cân bằng cấu trúc trái–phải", "Hoàn thiện chữ nhiều nét rõ ràng"],
    characters: [
      { hanzi: "经", pinyin: "jīng", meaning: "trải qua, kinh", strokes: 8, groups: ["work"] },
      { hanzi: "验", pinyin: "yàn", meaning: "kiểm tra, kinh nghiệm", strokes: 10, groups: ["work"] },
      { hanzi: "议", pinyin: "yì", meaning: "thảo luận, ý kiến", strokes: 5, groups: ["work"] },
      { hanzi: "解", pinyin: "jiě", meaning: "giải thích, giải quyết", strokes: 13, groups: ["daily", "work"] },
      { hanzi: "决", pinyin: "jué", meaning: "quyết định", strokes: 6, groups: ["work"] },
      { hanzi: "题", pinyin: "tí", meaning: "vấn đề, đề bài", strokes: 15, groups: ["daily", "work"] },
    ],
  },
  {
    slug: "hsk-5",
    level: "HSK 5",
    title: "Từ vựng chuyên sâu",
    summary: "Rèn độ chính xác với nhóm chữ về trách nhiệm, hiệu suất và quản lý trong môi trường làm việc.",
    duration: "18 phút",
    outcomes: ["Kiểm soát nét móc và nét gập", "Giữ tâm chữ ổn định", "Viết liền mạch chữ có nhiều thành phần"],
    characters: [
      { hanzi: "责", pinyin: "zé", meaning: "trách nhiệm", strokes: 8, groups: ["work"] },
      { hanzi: "任", pinyin: "rèn", meaning: "nhiệm vụ, đảm nhiệm", strokes: 6, groups: ["work"] },
      { hanzi: "效", pinyin: "xiào", meaning: "hiệu quả", strokes: 10, groups: ["work"] },
      { hanzi: "率", pinyin: "lǜ", meaning: "tỷ lệ, hiệu suất", strokes: 11, groups: ["work"] },
      { hanzi: "管", pinyin: "guǎn", meaning: "quản lý", strokes: 14, groups: ["work"] },
      { hanzi: "理", pinyin: "lǐ", meaning: "xử lý, lý lẽ", strokes: 11, groups: ["daily", "work"] },
    ],
  },
  {
    slug: "hsk-6",
    level: "HSK 6",
    title: "Viết chữ theo tư duy chiến lược",
    summary: "Hoàn thiện khả năng viết độc lập với nhóm chữ trừu tượng dùng trong phân tích và đổi mới.",
    duration: "20 phút",
    outcomes: ["Ghi nhớ chữ bằng cấu trúc nghĩa", "Duy trì nhịp viết ở chữ khó", "Tự viết và đánh giá toàn bộ bài"],
    characters: [
      { hanzi: "战", pinyin: "zhàn", meaning: "chiến đấu, chiến", strokes: 9, groups: ["work"] },
      { hanzi: "略", pinyin: "lüè", meaning: "chiến lược, lược", strokes: 11, groups: ["work"] },
      { hanzi: "趋", pinyin: "qū", meaning: "hướng tới, xu hướng", strokes: 12, groups: ["work"] },
      { hanzi: "势", pinyin: "shì", meaning: "thế, xu thế", strokes: 8, groups: ["work"] },
      { hanzi: "创", pinyin: "chuàng", meaning: "sáng tạo, lập nên", strokes: 6, groups: ["work"] },
      { hanzi: "新", pinyin: "xīn", meaning: "mới", strokes: 13, groups: ["daily", "work"] },
    ],
  },
];

export function getWritingTopic(slug: string): WritingTopic | undefined {
  return WRITING_TOPICS.find((topic) => topic.slug === slug);
}
