export type GameWord = {
  id: string;
  hanzi: string;
  pinyin: string;
  meaning: string;
  example: string;
  lane: number;
  duration: number;
};

export const gameWords: GameWord[] = [
  { id: "hello", hanzi: "你好", pinyin: "nǐ hǎo", meaning: "xin chào", example: "你好，很高兴认识您。", lane: 24, duration: 10.8 },
  { id: "thanks", hanzi: "谢谢", pinyin: "xiè xie", meaning: "cảm ơn", example: "谢谢您的帮助。", lane: 58, duration: 10.2 },
  { id: "colleague", hanzi: "同事", pinyin: "tóng shì", meaning: "đồng nghiệp", example: "她是我的同事。", lane: 74, duration: 9.7 },
  { id: "meeting", hanzi: "开会", pinyin: "kāi huì", meaning: "họp", example: "我们下午三点开会。", lane: 38, duration: 9.4 },
  { id: "progress", hanzi: "进度", pinyin: "jìn dù", meaning: "tiến độ", example: "我来汇报一下进度。", lane: 66, duration: 9 },
  { id: "report", hanzi: "报告", pinyin: "bào gào", meaning: "báo cáo", example: "报告已经发给您了。", lane: 29, duration: 8.8 },
  { id: "confirm", hanzi: "确认", pinyin: "què rèn", meaning: "xác nhận", example: "请您确认一下时间。", lane: 79, duration: 8.6 },
  { id: "customer", hanzi: "客户", pinyin: "kè hù", meaning: "khách hàng", example: "客户正在会议室等您。", lane: 46, duration: 8.4 },
  { id: "document", hanzi: "文件", pinyin: "wén jiàn", meaning: "tài liệu", example: "文件我已经准备好了。", lane: 70, duration: 8.2 },
  { id: "overtime", hanzi: "加班", pinyin: "jiā bān", meaning: "tăng ca", example: "今天需要加班吗？", lane: 33, duration: 8 },
  { id: "complete", hanzi: "完成", pinyin: "wán chéng", meaning: "hoàn thành", example: "任务已经完成了。", lane: 61, duration: 7.8 },
  { id: "hard-work", hanzi: "辛苦了", pinyin: "xīn kǔ le", meaning: "bạn vất vả rồi", example: "今天大家辛苦了。", lane: 42, duration: 7.6 },
];

export const gameRoundWords = gameWords.slice(0, 6);

export function speakChinese(value: string, rate = 0.78): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(value);
  utterance.lang = "zh-CN";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
  return true;
}
