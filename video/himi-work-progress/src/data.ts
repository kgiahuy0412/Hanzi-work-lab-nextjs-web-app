export type DialogueLine = {
  id: string;
  speaker: "manager" | "employee";
  roleChinese: string;
  roleVietnamese: string;
  hanziBefore: string;
  keyword: string;
  hanziAfter: string;
  pinyin: string;
  vietnamese: string;
  audio: string;
  globalAudioStartMs: number;
  globalAudioEndMs: number;
};

export const DIALOGUES: DialogueLine[] = [
  {
    id: "line-01",
    speaker: "manager",
    roleChinese: "经理",
    roleVietnamese: "Quản lý",
    hanziBefore: "项目",
    keyword: "进展",
    hanziAfter: "怎么样了？",
    pinyin: "xiàngmù jìnzhǎn zěnmeyàng le?",
    vietnamese: "Dự án tiến triển thế nào rồi?",
    audio: "audio/line-01-manager.mp3",
    globalAudioStartMs: 5800,
    globalAudioEndMs: 8128,
  },
  {
    id: "line-02",
    speaker: "employee",
    roleChinese: "员工",
    roleVietnamese: "Nhân viên",
    hanziBefore: "已经完成",
    keyword: "百分之八十",
    hanziAfter: "了。",
    pinyin: "yǐjīng wánchéng bǎifēnzhī bāshí le.",
    vietnamese: "Đã hoàn thành 80% rồi.",
    audio: "audio/line-02-employee.mp3",
    globalAudioStartMs: 16800,
    globalAudioEndMs: 19440,
  },
  {
    id: "line-03",
    speaker: "employee",
    roleChinese: "员工",
    roleVietnamese: "Nhân viên",
    hanziBefore: "我今天",
    keyword: "下班前",
    hanziAfter: "发给您。",
    pinyin: "wǒ jīntiān xiàbān qián fā gěi nín.",
    vietnamese: "Tôi sẽ gửi cho anh/chị trước khi tan làm hôm nay.",
    audio: "audio/line-03-employee.mp3",
    globalAudioStartMs: 27800,
    globalAudioEndMs: 30344,
  },
];

export const FPS = 30;
export const TOTAL_FRAMES = 60 * FPS;
