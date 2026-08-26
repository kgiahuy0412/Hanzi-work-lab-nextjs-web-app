export type VideoSource = "himi" | "youtube";

export type VideoTranscriptLine = {
  id: string;
  role: string;
  hanzi: string;
  pinyin: string;
  translation: string;
  keyword: string;
  startMs: number;
  endMs: number;
  sceneStartMs: number;
  sceneEndMs: number;
};

export type LearningVideo = {
  slug: string;
  title: string;
  originalTitle?: string;
  summary: string;
  description: string;
  source: VideoSource;
  category: string;
  level: string;
  contentType: string;
  durationLabel?: string;
  sentenceCount?: number;
  youtubeId?: string;
  authorName?: string;
  authorUrl?: string;
  thumbnailUrl: string;
  videoUrl?: string;
  posterUrl?: string;
  learningGoals: string[];
  practicePrompts: string[];
  transcript?: VideoTranscriptLine[];
  lessonBinding?: {
    courseSlug: string;
    lessonSlug: string;
  };
};

const workProgressTranscript: VideoTranscriptLine[] = [
  {
    id: "line-01",
    role: "Quản lý",
    hanzi: "项目进展怎么样了？",
    pinyin: "xiàngmù jìnzhǎn zěnmeyàng le?",
    translation: "Dự án tiến triển thế nào rồi?",
    keyword: "进展",
    startMs: 5800,
    endMs: 8128,
    sceneStartMs: 5000,
    sceneEndMs: 16000,
  },
  {
    id: "line-02",
    role: "Nhân viên",
    hanzi: "已经完成百分之八十了。",
    pinyin: "yǐjīng wánchéng bǎifēnzhī bāshí le.",
    translation: "Đã hoàn thành 80% rồi.",
    keyword: "百分之八十",
    startMs: 16800,
    endMs: 19440,
    sceneStartMs: 16000,
    sceneEndMs: 27000,
  },
  {
    id: "line-03",
    role: "Nhân viên",
    hanzi: "我今天下班前发给您。",
    pinyin: "wǒ jīntiān xiàbān qián fā gěi nín.",
    translation: "Tôi sẽ gửi cho anh/chị trước khi tan làm hôm nay.",
    keyword: "下班前",
    startMs: 27800,
    endMs: 30344,
    sceneStartMs: 27000,
    sceneEndMs: 38000,
  },
];

const dailyLifeVideos: LearningVideo[] = [
  {
    slug: "mua-do-o-cua-hang-tien-loi",
    title: "Mua đồ ở cửa hàng tiện lợi",
    summary: "Ba câu thiết yếu từ lúc nhận túi đến khi thanh toán bằng điện thoại.",
    description: "Một tình huống mua sắm ngắn do Himi sản xuất. Video có hai giọng Trung, khoảng nghỉ nói theo và phụ đề tương tác để bạn luyện từng câu.",
    source: "himi",
    category: "Mua sắm",
    level: "HSK 1",
    contentType: "Tình huống",
    durationLabel: "1 phút",
    authorName: "Himi Chinese",
    thumbnailUrl: "/assets/videos/daily-life/convenience-store/himi-convenience-store-poster-16x9.png",
    videoUrl: "/assets/videos/daily-life/convenience-store/himi-convenience-store-16x9.mp4",
    posterUrl: "/assets/videos/daily-life/convenience-store/himi-convenience-store-poster-16x9.png",
    learningGoals: ["Hỏi và trả lời về túi đựng", "Nói lời cảm ơn tự nhiên", "Hỏi cách thanh toán bằng điện thoại"],
    practicePrompts: ["Nghe câu đầu không nhìn pinyin.", "Bật lặp câu và nói theo trong khoảng nghỉ.", "Đổi 一个 thành số lượng bạn muốn mua."],
    transcript: [
      {id: "store-01", role: "Nhân viên", hanzi: "您好，需要袋子吗？", pinyin: "nín hǎo, xūyào dàizi ma?", translation: "Xin chào, bạn có cần túi không?", keyword: "袋子", startMs: 5800, endMs: 8152, sceneStartMs: 5000, sceneEndMs: 16000},
      {id: "store-02", role: "Khách hàng", hanzi: "需要一个，谢谢。", pinyin: "xūyào yí ge, xièxie.", translation: "Tôi cần một cái, cảm ơn.", keyword: "一个", startMs: 16800, endMs: 19344, sceneStartMs: 16000, sceneEndMs: 27000},
      {id: "store-03", role: "Khách hàng", hanzi: "可以用手机支付吗？", pinyin: "kěyǐ yòng shǒujī zhīfù ma?", translation: "Tôi có thể thanh toán bằng điện thoại không?", keyword: "手机支付", startMs: 27800, endMs: 30392, sceneStartMs: 27000, sceneEndMs: 38000},
    ],
  },
  {
    slug: "goi-mon-va-xin-it-cay",
    title: "Gọi món và xin ít cay",
    summary: "Gọi món, nói rõ khẩu vị và dùng bữa thoải mái chỉ với ba mẫu câu.",
    description: "Tình huống ăn uống Himi Original giúp bạn nghe lời chào của phục vụ, gọi mì bò và yêu cầu giảm độ cay theo cách lịch sự.",
    source: "himi",
    category: "Ăn uống",
    level: "HSK 1–2",
    contentType: "Tình huống",
    durationLabel: "1 phút",
    authorName: "Himi Chinese",
    thumbnailUrl: "/assets/videos/daily-life/restaurant/himi-restaurant-poster-16x9.png",
    videoUrl: "/assets/videos/daily-life/restaurant/himi-restaurant-16x9.mp4",
    posterUrl: "/assets/videos/daily-life/restaurant/himi-restaurant-poster-16x9.png",
    learningGoals: ["Hiểu câu hỏi gọi món", "Gọi một phần mì bò", "Yêu cầu cho ít ớt một cách lịch sự"],
    practicePrompts: ["Nghe và nhận ra từ chỉ món ăn.", "Nói theo từng câu đúng nhịp.", "Thay 牛肉面 bằng món bạn muốn gọi."],
    transcript: [
      {id: "food-01", role: "Phục vụ", hanzi: "您好，想吃点儿什么？", pinyin: "nín hǎo, xiǎng chī diǎnr shénme?", translation: "Xin chào, bạn muốn dùng món gì?", keyword: "吃", startMs: 5800, endMs: 8272, sceneStartMs: 5000, sceneEndMs: 16000},
      {id: "food-02", role: "Khách hàng", hanzi: "我要一碗牛肉面。", pinyin: "wǒ yào yì wǎn niúròu miàn.", translation: "Tôi muốn một tô mì bò.", keyword: "牛肉面", startMs: 16800, endMs: 19080, sceneStartMs: 16000, sceneEndMs: 27000},
      {id: "food-03", role: "Khách hàng", hanzi: "请少放一点辣椒。", pinyin: "qǐng shǎo fàng yìdiǎn làjiāo.", translation: "Vui lòng cho ít ớt thôi.", keyword: "少放", startMs: 27800, endMs: 30224, sceneStartMs: 27000, sceneEndMs: 38000},
    ],
  },
  {
    slug: "hoi-duong-den-ga-tau-dien",
    title: "Hỏi đường đến ga tàu điện",
    summary: "Hỏi đúng đường, nghe chỉ dẫn và xác nhận khoảng cách trong một phút.",
    description: "Tình huống đi lại do Himi sản xuất, tập trung vào ba phản xạ quan trọng: hỏi đường, hiểu hướng rẽ và hỏi xa hay gần.",
    source: "himi",
    category: "Đi lại",
    level: "HSK 2",
    contentType: "Tình huống",
    durationLabel: "1 phút",
    authorName: "Himi Chinese",
    thumbnailUrl: "/assets/videos/daily-life/metro/himi-metro-directions-poster-16x9.png",
    videoUrl: "/assets/videos/daily-life/metro/himi-metro-directions-16x9.mp4",
    posterUrl: "/assets/videos/daily-life/metro/himi-metro-directions-poster-16x9.png",
    learningGoals: ["Hỏi đường đến ga tàu điện", "Hiểu chỉ dẫn đi thẳng và rẽ phải", "Hỏi địa điểm có xa không"],
    practicePrompts: ["Nghe hướng đi rồi vẽ mũi tên.", "Lặp câu không nhìn pinyin.", "Đổi 地铁站 thành địa điểm bạn cần tìm."],
    transcript: [
      {id: "metro-01", role: "Du khách", hanzi: "请问，地铁站怎么走？", pinyin: "qǐngwèn, dìtiě zhàn zěnme zǒu?", translation: "Xin hỏi, đi đến ga tàu điện thế nào?", keyword: "地铁站", startMs: 5800, endMs: 8560, sceneStartMs: 5000, sceneEndMs: 16000},
      {id: "metro-02", role: "Người đi đường", hanzi: "一直走，然后向右转。", pinyin: "yìzhí zǒu, ránhòu xiàng yòu zhuǎn.", translation: "Đi thẳng, sau đó rẽ phải.", keyword: "向右转", startMs: 16800, endMs: 20016, sceneStartMs: 16000, sceneEndMs: 27000},
      {id: "metro-03", role: "Du khách", hanzi: "离这里远吗？", pinyin: "lí zhèlǐ yuǎn ma?", translation: "Có xa chỗ này không?", keyword: "远", startMs: 27800, endMs: 29600, sceneStartMs: 27000, sceneEndMs: 38000},
    ],
  },
];

const lessonScenarioVideos: LearningVideo[] = [
  {
    slug: "bao-tien-do-voi-quan-ly",
    title: "Báo tiến độ công việc với quản lý",
    summary: "Một tình huống văn phòng ngắn để nghe, nói theo và phản xạ với ba mẫu câu thiết yếu.",
    description: "Video Himi Original có phụ đề Hán tự, pinyin và tiếng Việt theo từng câu. Bạn có thể tua đến câu, nghe lại và lặp đoạn shadowing ngay trong bài học.",
    source: "himi",
    category: "Công sở",
    level: "HSK 2",
    contentType: "Tình huống",
    durationLabel: "1 phút",
    thumbnailUrl: "/assets/videos/work-progress/himi-work-progress-poster-16x9.png",
    videoUrl: "/assets/videos/work-progress/himi-work-progress-16x9.mp4",
    posterUrl: "/assets/videos/work-progress/himi-work-progress-poster-16x9.png",
    learningGoals: [
      "Hỏi tiến độ dự án một cách tự nhiên",
      "Báo phần trăm công việc đã hoàn thành",
      "Cam kết thời điểm gửi kết quả",
    ],
    practicePrompts: [
      "Nghe trọn câu trước khi nhìn pinyin.",
      "Bật lặp câu và nói theo trong khoảng nghỉ.",
      "Xem lại không phụ đề để tự kiểm tra.",
    ],
    transcript: workProgressTranscript,
    lessonBinding: {
      courseSlug: "van-phong-hanh-chinh",
      lessonSlug: "theo-doi-tien-do-cong-viec",
    },
  },
];

export const learningVideos: LearningVideo[] = [
  ...dailyLifeVideos,
  {
    slug: "am-thuc-duong-pho-trung-quoc",
    title: "Ẩm thực đường phố Trung Quốc",
    originalTitle: "中国街头小吃 | Chinese Street Food",
    summary: "Luyện nghe qua chủ đề món ăn đường phố và văn hóa ẩm thực quen thuộc tại Trung Quốc.",
    description: "Podcast tiếng Trung theo chủ đề đời sống, phù hợp để luyện nghe từ vựng món ăn và cách miêu tả trải nghiệm ẩm thực.",
    source: "youtube",
    category: "Văn hóa",
    level: "HSK 2",
    contentType: "Podcast",
    sentenceCount: 274,
    youtubeId: "GJanmMSj8QQ",
    authorName: "Chinese Podcast Station",
    authorUrl: "https://www.youtube.com/@ChinesePodcastStation101",
    thumbnailUrl: "https://i.ytimg.com/vi/GJanmMSj8QQ/hqdefault.jpg",
    learningGoals: ["Nhận biết từ vựng món ăn", "Luyện nghe đoạn kể chuyện dài", "Làm quen ngữ điệu hội thoại tự nhiên"],
    practicePrompts: ["Nghe lượt đầu không phụ đề.", "Ghi lại ba món ăn bạn nghe được.", "Tóm tắt nội dung bằng hai câu ngắn."],
  },
  {
    slug: "mot-ngay-cua-toi",
    title: "Một ngày của tôi",
    originalTitle: "我的一天 | My Day in Chinese",
    summary: "Theo dõi một ngày thường nhật với tốc độ nghe phù hợp cho người mới bắt đầu.",
    description: "Podcast nhập môn về lịch sinh hoạt, thời gian và các hoạt động hằng ngày bằng mẫu câu ngắn, dễ bắt chước.",
    source: "youtube",
    category: "Đời sống",
    level: "HSK 1",
    contentType: "Podcast",
    sentenceCount: 207,
    youtubeId: "LG7ysbsDf30",
    authorName: "Chinese Podcast Station",
    authorUrl: "https://www.youtube.com/@ChinesePodcastStation101",
    thumbnailUrl: "https://i.ytimg.com/vi/LG7ysbsDf30/hqdefault.jpg",
    learningGoals: ["Nói về lịch sinh hoạt", "Ôn cách diễn đạt thời gian", "Nghe các động từ thông dụng"],
    practicePrompts: ["Nghe và đánh dấu các mốc thời gian.", "Nói lại lịch của bạn theo mẫu.", "Shadowing một đoạn ngắn 30 giây."],
  },
  {
    slug: "vi-sao-hoc-mai-chua-noi-duoc",
    title: "Vì sao học mãi vẫn chưa nói được tiếng Trung?",
    originalTitle: "为什么你还不会说中文?",
    summary: "Một podcast phân tích những rào cản thường gặp khiến người học biết nhiều nhưng vẫn ngại nói.",
    description: "Nội dung tốc độ vừa phải, phù hợp để vừa luyện nghe vừa nhận ra cách xây thói quen luyện nói chủ động.",
    source: "youtube",
    category: "Kỹ năng",
    level: "HSK 3",
    contentType: "Podcast",
    sentenceCount: 208,
    youtubeId: "O6YPoFcJvvs",
    authorName: "Chinese Podcast Station",
    authorUrl: "https://www.youtube.com/@ChinesePodcastStation101",
    thumbnailUrl: "https://i.ytimg.com/vi/O6YPoFcJvvs/hqdefault.jpg",
    learningGoals: ["Nhận biết từ vựng về học tập", "Nghe lập luận dài hơn", "Xây thói quen phản xạ nói"],
    practicePrompts: ["Ghi lại nguyên nhân chính được nhắc đến.", "Dừng sau mỗi ý và nói lại.", "Chọn một thói quen để áp dụng hôm nay."],
  },
  {
    slug: "tieng-trung-trong-doi-song-hang-ngay",
    title: "Tiếng Trung trong đời sống hằng ngày",
    originalTitle: "生活中文 | Chinese for Everyday Life",
    summary: "Ôn các cách diễn đạt gần gũi thường xuất hiện trong giao tiếp hằng ngày.",
    description: "Podcast tổng hợp mẫu câu đời sống ở mức HSK 2–3, hữu ích cho việc mở rộng vốn từ theo ngữ cảnh.",
    source: "youtube",
    category: "Đời sống",
    level: "HSK 2–3",
    contentType: "Podcast",
    sentenceCount: 235,
    youtubeId: "M1BnUYEYeOg",
    authorName: "Chinese Podcast Station",
    authorUrl: "https://www.youtube.com/@ChinesePodcastStation101",
    thumbnailUrl: "https://i.ytimg.com/vi/M1BnUYEYeOg/hqdefault.jpg",
    learningGoals: ["Mở rộng cụm từ đời sống", "Nghe hiểu ý chính theo ngữ cảnh", "Bắt chước nhịp nói tự nhiên"],
    practicePrompts: ["Chia video thành các đoạn 3–5 phút.", "Chọn năm cụm từ dùng được ngay.", "Đặt câu mới cho từng cụm."],
  },
  {
    slug: "shadowing-giup-tien-bo-nhanh-hon",
    title: "Shadowing giúp tiếng Trung tiến bộ nhanh hơn",
    originalTitle: "跟读法让你中文进步更快",
    summary: "Hiểu cách luyện shadowing và biến việc nghe lặp lại thành phản xạ nói chủ động.",
    description: "Podcast hướng dẫn phương pháp nghe và nói đuổi theo, phù hợp cho người đã có nền tảng và muốn cải thiện độ trôi chảy.",
    source: "youtube",
    category: "Phương pháp",
    level: "HSK 3",
    contentType: "Podcast",
    sentenceCount: 180,
    youtubeId: "YGvbsy6VemA",
    authorName: "Chinese Podcast Station",
    authorUrl: "https://www.youtube.com/@ChinesePodcastStation101",
    thumbnailUrl: "https://i.ytimg.com/vi/YGvbsy6VemA/hqdefault.jpg",
    learningGoals: ["Hiểu đúng kỹ thuật shadowing", "Cải thiện nhịp và ngữ điệu", "Tạo lịch luyện nói ngắn mỗi ngày"],
    practicePrompts: ["Chọn đoạn 20–30 giây.", "Nghe ba lần trước khi nói theo.", "Thu âm và so sánh nhịp câu."],
  },
  {
    slug: "luyen-nghe-doc-sau-sau-thang",
    title: "Bạn hiểu được bao nhiêu sau 6 tháng học?",
    originalTitle: "Watch this if you've learned Chinese for 6 months - Chinese LISTENING and READING comprehension",
    summary: "Một bài kiểm tra nghe–đọc nhẹ nhàng để nhận ra phần bạn đã hiểu tốt và vốn từ còn yếu.",
    description: "Video luyện nghe và đọc hiểu bằng tiếng Trung, phù hợp khi bạn đã học nền tảng khoảng sáu tháng và muốn kiểm tra khả năng theo dõi nội dung liên tục.",
    source: "youtube",
    category: "Kiểm tra",
    level: "HSK 2–3",
    contentType: "Nghe & đọc",
    sentenceCount: 90,
    youtubeId: "JHxgGKMVIJA",
    authorName: "ShuoshuoChinese说说中文",
    authorUrl: "https://www.youtube.com/@ShuoshuoChinese",
    thumbnailUrl: "https://i.ytimg.com/vi/JHxgGKMVIJA/hqdefault.jpg",
    learningGoals: ["Kiểm tra khả năng nắm ý chính", "Luyện đọc cùng nội dung đang nghe", "Nhận diện nhóm từ cần ôn lại"],
    practicePrompts: ["Nghe lượt đầu không nhìn pinyin.", "Dừng sau mỗi ý và tự tóm tắt.", "Ghi lại năm từ bạn chưa nhận ra."],
  },
  {
    slug: "buoi-sang-bang-tieng-trung",
    title: "Một buổi sáng bằng tiếng Trung",
    originalTitle: "☀️ Can you understand this Chinese Vlog? | Slow Chinese Listening Practice for Beginners (HSK1-3)",
    summary: "Vlog nghe chậm về sinh hoạt buổi sáng, gần gũi và dễ luyện theo cho người mới.",
    description: "Một vlog đời sống với tốc độ nói rõ ràng, giúp bạn nghe từ vựng sinh hoạt và làm quen cách kể lại hoạt động hằng ngày bằng tiếng Trung.",
    source: "youtube",
    category: "Vlog",
    level: "HSK 1–3",
    contentType: "Nghe chậm",
    sentenceCount: 89,
    youtubeId: "V6SrjHDisDs",
    authorName: "ShuoshuoChinese说说中文",
    authorUrl: "https://www.youtube.com/@ShuoshuoChinese",
    thumbnailUrl: "https://i.ytimg.com/vi/V6SrjHDisDs/hqdefault.jpg",
    learningGoals: ["Nghe từ vựng sinh hoạt buổi sáng", "Nhận biết cấu trúc kể trình tự", "Làm quen lời nói đời thường"],
    practicePrompts: ["Nghe một lượt chỉ để nắm mạch.", "Nói theo ba câu bạn dùng được ngay.", "Kể lại buổi sáng của bạn trong 30 giây."],
  },
  {
    slug: "han-tu-dau-tien-trong-nam-phut",
    title: "Hán tự đầu tiên trong 5 phút",
    originalTitle: "Learn Your First Chinese Character in 5 Minutes with Yoyo Chinese (Part 1)",
    summary: "Bắt đầu làm quen Hán tự bằng một bài giảng ngắn, trực quan và không tạo áp lực ghi nhớ.",
    description: "Bài học nhập môn giải thích cách nhìn, hiểu và ghi nhớ Hán tự đầu tiên, phù hợp cho người mới bắt đầu từ con số không.",
    source: "youtube",
    category: "Hán tự",
    level: "Nhập môn",
    contentType: "Bài giảng",
    sentenceCount: 14,
    youtubeId: "mrxzgms3E1g",
    authorName: "Yoyo Chinese",
    authorUrl: "https://www.youtube.com/@YoyoChinese",
    thumbnailUrl: "https://i.ytimg.com/vi/mrxzgms3E1g/hqdefault.jpg",
    learningGoals: ["Hiểu Hán tự được cấu tạo như thế nào", "Gắn hình dạng với ý nghĩa", "Tạo cảm giác dễ tiếp cận khi mới học"],
    practicePrompts: ["Quan sát chữ trước khi nghe giải thích.", "Viết lại chữ ba lần có chủ đích.", "Tự nói lại ý nghĩa không nhìn ghi chú."],
  },
  {
    slug: "bai-hoc-tieng-trung-dau-tien",
    title: "Bài học tiếng Trung đầu tiên",
    originalTitle: "Why Mandarin Chinese is Easy to Learn - Yoyo Chinese",
    summary: "Nhìn cấu trúc câu và từ ghép để thấy tiếng Trung logic, dễ tiếp cận hơn bạn nghĩ.",
    description: "Bài giới thiệu dành cho người mới, giải thích trật tự câu, động từ không biến đổi và cách các từ quen thuộc kết hợp thành từ mới.",
    source: "youtube",
    category: "Nhập môn",
    level: "HSK 1",
    contentType: "Bài giảng",
    sentenceCount: 15,
    youtubeId: "AOEWadftWHA",
    authorName: "Yoyo Chinese",
    authorUrl: "https://www.youtube.com/@YoyoChinese",
    thumbnailUrl: "https://i.ytimg.com/vi/AOEWadftWHA/hqdefault.jpg",
    learningGoals: ["Hiểu trật tự câu cơ bản", "Nhận biết các từ ghép logic", "Ghi nhớ nhóm từ có chung thành phần"],
    practicePrompts: ["Nghe và sắp xếp lại câu mẫu.", "Đọc to các từ ghép xuất hiện trong video.", "Tự tạo một cặp từ có chung thành phần."],
  },
  {
    slug: "lac-duong-trong-thanh-pho",
    title: "Lạc giữa thành phố",
    originalTitle: "Lost in The City - Intermediate Chinese Listening Practice | Chinese Conversation | Slow Chinese",
    summary: "Theo chân một cô gái rời quê, tìm việc và dần nhận ra cuộc sống thành phố không giống tưởng tượng.",
    description: "Một câu chuyện nghe chậm dành cho trình độ trung cấp, giúp bạn theo dõi mạch kể dài và học cách diễn đạt lựa chọn, cảm xúc cùng trải nghiệm trưởng thành.",
    source: "youtube",
    category: "Câu chuyện",
    level: "HSK 3",
    contentType: "Nghe chậm",
    sentenceCount: 136,
    youtubeId: "uuUmhi2F0kc",
    authorName: "Mandarin Corner",
    authorUrl: "https://www.youtube.com/@MandarinCorner2",
    thumbnailUrl: "https://i.ytimg.com/vi/uuUmhi2F0kc/hqdefault.jpg",
    learningGoals: ["Theo dõi một câu chuyện dài hơn", "Học từ vựng về công việc và cảm xúc", "Luyện đoán nghĩa từ ngữ cảnh"],
    practicePrompts: ["Nghe lượt đầu và đoán diễn biến.", "Ghi lại ba quyết định quan trọng của nhân vật.", "Kể lại câu chuyện bằng năm câu ngắn."],
  },
];

export function findVideoBySlug(slug: string): LearningVideo | undefined {
  return learningVideos.find((video) => video.slug === slug);
}

export function getLessonScenarioVideo(courseSlug: string, lessonSlug: string): LearningVideo | undefined {
  return lessonScenarioVideos.find((video) => video.lessonBinding?.courseSlug === courseSlug && video.lessonBinding.lessonSlug === lessonSlug);
}
