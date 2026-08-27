export type DailyDialogueLine = {
  id: string;
  speaker: "a" | "b";
  roleChinese: string;
  roleVietnamese: string;
  hanzi: string;
  pinyin: string;
  vietnamese: string;
  keyword: string;
  audio: string;
};

export type DailyScenario = {
  id: string;
  compositionId: string;
  episode: string;
  eyebrow: string;
  title: string;
  titleAccent: string;
  summary: string;
  icon: string;
  accent: string;
  accentSoft: string;
  surface: string;
  landscape: string;
  lines: DailyDialogueLine[];
  quiz: {
    prompt: string;
    options: string[];
    correctIndex: number;
    feedback: string;
  };
};

export const dailyScenarios: DailyScenario[] = [
  {
    id: "convenience-store",
    compositionId: "HimiDailyConvenienceStore",
    episode: "Tình huống 02",
    eyebrow: "MUA SẮM HẰNG NGÀY",
    title: "Mua đồ ở",
    titleAccent: "cửa hàng tiện lợi",
    summary: "Từ chiếc túi đến lúc thanh toán — ba câu ngắn để bạn tự tin mua hàng.",
    icon: "🛍️",
    accent: "#f05d4f",
    accentSoft: "#ffe5de",
    surface: "#fff8ed",
    landscape: "linear-gradient(145deg, #fff8ed 0%, #fff1dc 46%, #ddf5eb 100%)",
    lines: [
      {
        id: "store-01",
        speaker: "a",
        roleChinese: "店员",
        roleVietnamese: "Nhân viên",
        hanzi: "您好，需要袋子吗？",
        pinyin: "nín hǎo, xūyào dàizi ma?",
        vietnamese: "Xin chào, bạn có cần túi không?",
        keyword: "袋子",
        audio: "audio/daily/store-01.mp3",
      },
      {
        id: "store-02",
        speaker: "b",
        roleChinese: "顾客",
        roleVietnamese: "Khách hàng",
        hanzi: "需要一个，谢谢。",
        pinyin: "xūyào yí ge, xièxie.",
        vietnamese: "Tôi cần một cái, cảm ơn.",
        keyword: "一个",
        audio: "audio/daily/store-02.mp3",
      },
      {
        id: "store-03",
        speaker: "b",
        roleChinese: "顾客",
        roleVietnamese: "Khách hàng",
        hanzi: "可以用手机支付吗？",
        pinyin: "kěyǐ yòng shǒujī zhīfù ma?",
        vietnamese: "Tôi có thể thanh toán bằng điện thoại không?",
        keyword: "手机支付",
        audio: "audio/daily/store-03.mp3",
      },
    ],
    quiz: {
      prompt: "Muốn hỏi có thể thanh toán bằng điện thoại không, bạn nói câu nào?",
      options: ["可以用手机支付吗？", "需要袋子吗？", "这个多少钱？"],
      correctIndex: 0,
      feedback: "Đúng rồi! 手机支付 là thanh toán bằng điện thoại.",
    },
  },
  {
    id: "restaurant",
    compositionId: "HimiDailyRestaurant",
    episode: "Tình huống 03",
    eyebrow: "ĂN UỐNG HẰNG NGÀY",
    title: "Gọi món và",
    titleAccent: "xin ít cay",
    summary: "Gọi đúng món, nói rõ khẩu vị và tận hưởng bữa ăn theo cách của bạn.",
    icon: "🍜",
    accent: "#e87d24",
    accentSoft: "#ffebc7",
    surface: "#fff9e9",
    landscape: "linear-gradient(145deg, #fff9e9 0%, #ffefd0 48%, #e5f5df 100%)",
    lines: [
      {
        id: "food-01",
        speaker: "a",
        roleChinese: "服务员",
        roleVietnamese: "Phục vụ",
        hanzi: "您好，想吃点儿什么？",
        pinyin: "nín hǎo, xiǎng chī diǎnr shénme?",
        vietnamese: "Xin chào, bạn muốn dùng món gì?",
        keyword: "吃",
        audio: "audio/daily/food-01.mp3",
      },
      {
        id: "food-02",
        speaker: "b",
        roleChinese: "顾客",
        roleVietnamese: "Khách hàng",
        hanzi: "我要一碗牛肉面。",
        pinyin: "wǒ yào yì wǎn niúròu miàn.",
        vietnamese: "Tôi muốn một tô mì bò.",
        keyword: "牛肉面",
        audio: "audio/daily/food-02.mp3",
      },
      {
        id: "food-03",
        speaker: "b",
        roleChinese: "顾客",
        roleVietnamese: "Khách hàng",
        hanzi: "请少放一点辣椒。",
        pinyin: "qǐng shǎo fàng yìdiǎn làjiāo.",
        vietnamese: "Vui lòng cho ít ớt thôi.",
        keyword: "少放",
        audio: "audio/daily/food-03.mp3",
      },
    ],
    quiz: {
      prompt: "Nếu muốn món ăn ít cay hơn, bạn sẽ nói câu nào?",
      options: ["我要一杯水。", "请少放一点辣椒。", "我不吃牛肉。"],
      correctIndex: 1,
      feedback: "Chính xác! 少放一点辣椒 nghĩa là cho ít ớt một chút.",
    },
  },
  {
    id: "metro",
    compositionId: "HimiDailyMetroDirections",
    episode: "Tình huống 04",
    eyebrow: "ĐI LẠI HẰNG NGÀY",
    title: "Hỏi đường đến",
    titleAccent: "ga tàu điện",
    summary: "Hỏi đường, nghe chỉ dẫn và xác nhận khoảng cách trong một phút.",
    icon: "🚇",
    accent: "#167f7a",
    accentSoft: "#d7f1ea",
    surface: "#f4fbf8",
    landscape: "linear-gradient(145deg, #f4fbf8 0%, #e0f5ee 48%, #e9efff 100%)",
    lines: [
      {
        id: "metro-01",
        speaker: "a",
        roleChinese: "游客",
        roleVietnamese: "Du khách",
        hanzi: "请问，地铁站怎么走？",
        pinyin: "qǐngwèn, dìtiě zhàn zěnme zǒu?",
        vietnamese: "Xin hỏi, đi đến ga tàu điện thế nào?",
        keyword: "地铁站",
        audio: "audio/daily/metro-01.mp3",
      },
      {
        id: "metro-02",
        speaker: "b",
        roleChinese: "路人",
        roleVietnamese: "Người đi đường",
        hanzi: "一直走，然后向右转。",
        pinyin: "yìzhí zǒu, ránhòu xiàng yòu zhuǎn.",
        vietnamese: "Đi thẳng, sau đó rẽ phải.",
        keyword: "向右转",
        audio: "audio/daily/metro-02.mp3",
      },
      {
        id: "metro-03",
        speaker: "a",
        roleChinese: "游客",
        roleVietnamese: "Du khách",
        hanzi: "离这里远吗？",
        pinyin: "lí zhèlǐ yuǎn ma?",
        vietnamese: "Có xa chỗ này không?",
        keyword: "远",
        audio: "audio/daily/metro-03.mp3",
      },
    ],
    quiz: {
      prompt: "Bạn muốn hỏi ga tàu điện đi lối nào. Câu nào phù hợp nhất?",
      options: ["地铁站怎么走？", "几点关门？", "可以坐这里吗？"],
      correctIndex: 0,
      feedback: "Rất tốt! 怎么走 là cách hỏi đường ngắn gọn và tự nhiên.",
    },
  },
];
