export type ListeningWord = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
};

export type ListeningLevel = {
  id: string;
  label: string;
  title: string;
  description: string;
  words: ListeningWord[];
};

export const listeningLevels: ListeningLevel[] = [
  {
    id: "hsk-1",
    label: "HSK 1",
    title: "Khởi động",
    description: "Từ quen thuộc, câu ngắn và nhịp đọc chậm.",
    words: [
      { id: "h1-hello", hanzi: "你好", pinyin: "nǐ hǎo", meaning: "xin chào", example: "你好，很高兴认识你。" },
      { id: "h1-thanks", hanzi: "谢谢", pinyin: "xiè xie", meaning: "cảm ơn", example: "谢谢你的帮助。" },
      { id: "h1-bye", hanzi: "再见", pinyin: "zài jiàn", meaning: "tạm biệt", example: "老师，再见。" },
      { id: "h1-please", hanzi: "请", pinyin: "qǐng", meaning: "xin mời", example: "请坐在这里。" },
      { id: "h1-sorry", hanzi: "对不起", pinyin: "duì bu qǐ", meaning: "xin lỗi", example: "对不起，我来晚了。" },
      { id: "h1-okay", hanzi: "没关系", pinyin: "méi guān xi", meaning: "không sao", example: "没关系，我们等你。" },
      { id: "h1-water", hanzi: "水", pinyin: "shuǐ", meaning: "nước", example: "我想喝一杯水。" },
      { id: "h1-study", hanzi: "学习", pinyin: "xué xí", meaning: "học tập", example: "我每天学习中文。" },
    ],
  },
  {
    id: "hsk-2",
    label: "HSK 2",
    title: "Bắt âm",
    description: "Nhận diện cụm từ dài hơn và nối nghĩa theo ngữ cảnh.",
    words: [
      { id: "h2-because", hanzi: "因为", pinyin: "yīn wèi", meaning: "bởi vì", example: "因为下雨，我没有出去。" },
      { id: "h2-therefore", hanzi: "所以", pinyin: "suǒ yǐ", meaning: "cho nên", example: "今天很忙，所以我晚点回家。" },
      { id: "h2-maybe", hanzi: "可能", pinyin: "kě néng", meaning: "có thể", example: "他可能明天回来。" },
      { id: "h2-already", hanzi: "已经", pinyin: "yǐ jīng", meaning: "đã", example: "我已经吃过饭了。" },
      { id: "h2-feel", hanzi: "觉得", pinyin: "jué de", meaning: "cảm thấy", example: "我觉得这本书很好。" },
      { id: "h2-together", hanzi: "一起", pinyin: "yì qǐ", meaning: "cùng nhau", example: "我们一起去吃饭吧。" },
      { id: "h2-help", hanzi: "帮助", pinyin: "bāng zhù", meaning: "giúp đỡ", example: "谢谢你帮助我。" },
      { id: "h2-matter", hanzi: "事情", pinyin: "shì qing", meaning: "sự việc", example: "我有一件事情要告诉你。" },
    ],
  },
  {
    id: "hsk-3",
    label: "HSK 3",
    title: "Nối ý",
    description: "Nghe câu hoàn chỉnh và phân biệt các từ gần âm.",
    words: [
      { id: "h3-finally", hanzi: "终于", pinyin: "zhōng yú", meaning: "cuối cùng", example: "我们终于完成了任务。" },
      { id: "h3-habit", hanzi: "习惯", pinyin: "xí guàn", meaning: "thói quen", example: "我已经习惯早起了。" },
      { id: "h3-serious", hanzi: "认真", pinyin: "rèn zhēn", meaning: "nghiêm túc", example: "她工作得非常认真。" },
      { id: "h3-choose", hanzi: "选择", pinyin: "xuǎn zé", meaning: "lựa chọn", example: "你可以选择喜欢的课程。" },
      { id: "h3-influence", hanzi: "影响", pinyin: "yǐng xiǎng", meaning: "ảnh hưởng", example: "天气会影响我们的计划。" },
      { id: "h3-need", hanzi: "需要", pinyin: "xū yào", meaning: "cần", example: "我需要一点时间准备。" },
      { id: "h3-join", hanzi: "参加", pinyin: "cān jiā", meaning: "tham gia", example: "明天我参加一个会议。" },
      { id: "h3-discover", hanzi: "发现", pinyin: "fā xiàn", meaning: "phát hiện", example: "我发现这个方法很有效。" },
    ],
  },
  {
    id: "hsk-4",
    label: "HSK 4",
    title: "Hiểu ngữ cảnh",
    description: "Theo kịp hội thoại tự nhiên và thông tin chi tiết hơn.",
    words: [
      { id: "h4-arrange", hanzi: "安排", pinyin: "ān pái", meaning: "sắp xếp", example: "我来安排明天的行程。" },
      { id: "h4-responsible", hanzi: "负责", pinyin: "fù zé", meaning: "phụ trách", example: "她负责这个项目。" },
      { id: "h4-experience", hanzi: "经验", pinyin: "jīng yàn", meaning: "kinh nghiệm", example: "他有丰富的工作经验。" },
      { id: "h4-suggest", hanzi: "建议", pinyin: "jiàn yì", meaning: "đề xuất", example: "我建议我们先讨论一下。" },
      { id: "h4-smooth", hanzi: "顺利", pinyin: "shùn lì", meaning: "thuận lợi", example: "会议进行得很顺利。" },
      { id: "h4-suitable", hanzi: "适合", pinyin: "shì hé", meaning: "phù hợp", example: "这个时间比较适合大家。" },
      { id: "h4-solve", hanzi: "解决", pinyin: "jiě jué", meaning: "giải quyết", example: "我们会尽快解决问题。" },
      { id: "h4-understand", hanzi: "了解", pinyin: "liǎo jiě", meaning: "tìm hiểu", example: "我想了解一下具体情况。" },
    ],
  },
  {
    id: "hsk-5",
    label: "HSK 5",
    title: "Nghe chủ động",
    description: "Xử lý thông tin công việc và ý kiến nhiều lớp.",
    words: [
      { id: "h5-communicate", hanzi: "沟通", pinyin: "gōu tōng", meaning: "giao tiếp", example: "有问题我们可以及时沟通。" },
      { id: "h5-efficiency", hanzi: "效率", pinyin: "xiào lǜ", meaning: "hiệu suất", example: "这个工具提高了工作效率。" },
      { id: "h5-apply", hanzi: "申请", pinyin: "shēn qǐng", meaning: "đăng ký", example: "我已经提交了申请。" },
      { id: "h5-adjust", hanzi: "调整", pinyin: "tiáo zhěng", meaning: "điều chỉnh", example: "我们需要调整一下计划。" },
      { id: "h5-goal", hanzi: "目标", pinyin: "mù biāo", meaning: "mục tiêu", example: "团队已经明确了目标。" },
      { id: "h5-discuss", hanzi: "讨论", pinyin: "tǎo lùn", meaning: "thảo luận", example: "我们下午讨论这个问题。" },
      { id: "h5-prove", hanzi: "证明", pinyin: "zhèng míng", meaning: "chứng minh", example: "结果证明这个方向是对的。" },
      { id: "h5-confirm", hanzi: "确认", pinyin: "què rèn", meaning: "xác nhận", example: "请确认一下会议时间。" },
    ],
  },
  {
    id: "hsk-6",
    label: "HSK 6",
    title: "Bắt sắc thái",
    description: "Luyện từ trừu tượng và cách diễn đạt chuyên sâu.",
    words: [
      { id: "h6-coordinate", hanzi: "协调", pinyin: "xié tiáo", meaning: "điều phối", example: "我来协调各部门的工作。" },
      { id: "h6-undertake", hanzi: "承担", pinyin: "chéng dān", meaning: "đảm nhận", example: "团队愿意承担这个责任。" },
      { id: "h6-trend", hanzi: "趋势", pinyin: "qū shì", meaning: "xu hướng", example: "我们要关注市场趋势。" },
      { id: "h6-resource", hanzi: "资源", pinyin: "zī yuán", meaning: "nguồn lực", example: "项目需要更多资源支持。" },
      { id: "h6-evaluate", hanzi: "评估", pinyin: "píng gū", meaning: "đánh giá", example: "我们正在评估不同的方案。" },
      { id: "h6-execute", hanzi: "执行", pinyin: "zhí xíng", meaning: "thực hiện", example: "计划必须按时执行。" },
      { id: "h6-feedback", hanzi: "反馈", pinyin: "fǎn kuì", meaning: "phản hồi", example: "谢谢你提供详细的反馈。" },
      { id: "h6-strategy", hanzi: "策略", pinyin: "cè lüè", meaning: "chiến lược", example: "公司正在制定新的策略。" },
    ],
  },
  {
    id: "hsk-7-9",
    label: "HSK 7–9",
    title: "Nghe chuyên sâu",
    description: "Theo dõi lập luận, hàm ý và ngôn ngữ chuyên nghiệp.",
    words: [
      { id: "h7-balance", hanzi: "权衡", pinyin: "quán héng", meaning: "cân nhắc", example: "我们需要权衡成本和效果。" },
      { id: "h7-insight", hanzi: "洞察", pinyin: "dòng chá", meaning: "thấu hiểu", example: "数据帮助我们洞察用户需求。" },
      { id: "h7-iterate", hanzi: "迭代", pinyin: "dié dài", meaning: "cải tiến lặp", example: "产品将在下周继续迭代。" },
      { id: "h7-collaborate", hanzi: "协同", pinyin: "xié tóng", meaning: "phối hợp", example: "各部门需要协同完成任务。" },
      { id: "h7-anticipate", hanzi: "预判", pinyin: "yù pàn", meaning: "dự đoán trước", example: "我们要预判市场的变化。" },
      { id: "h7-review", hanzi: "复盘", pinyin: "fù pán", meaning: "xem xét lại", example: "项目结束后我们一起复盘。" },
      { id: "h7-resilience", hanzi: "韧性", pinyin: "rèn xìng", meaning: "khả năng phục hồi", example: "团队在压力下表现出很强的韧性。" },
      { id: "h7-bottleneck", hanzi: "瓶颈", pinyin: "píng jǐng", meaning: "nút thắt", example: "人才短缺是目前的主要瓶颈。" },
    ],
  },
];

export const listeningWords = listeningLevels.flatMap((level) => level.words);
