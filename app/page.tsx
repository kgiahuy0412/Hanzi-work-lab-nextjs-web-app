import { getCurrentUser } from "@/lib/auth-session";
import { listPracticeVocabulary } from "@/lib/lesson-repository";
import { getLearningSummary } from "@/lib/progress-repository";
import { ReviewHomeStudio } from "@/components/review-home-studio";
import type { Vocabulary } from "@/lib/content-types";

const demoReviewWords: Vocabulary[] = [
  { slug: "demo-jindu", hanzi: "进度", pinyin: "jìndù", meaning: "tiến độ", example: "请问这个项目的进度如何？", translation: "Xin hỏi tiến độ của dự án này thế nào rồi?", audioUrl: null },
  { slug: "demo-anshi", hanzi: "按时", pinyin: "ànshí", meaning: "đúng hạn", example: "我们会按时完成这份报告。", translation: "Chúng tôi sẽ hoàn thành báo cáo này đúng hạn.", audioUrl: null },
  { slug: "demo-huibao", hanzi: "汇报", pinyin: "huìbào", meaning: "báo cáo", example: "下午我向经理汇报工作。", translation: "Buổi chiều tôi báo cáo công việc với quản lý.", audioUrl: null },
  { slug: "demo-jiezhi", hanzi: "截止", pinyin: "jiézhǐ", meaning: "hạn chót", example: "报名截止时间是星期五。", translation: "Hạn chót đăng ký là thứ Sáu.", audioUrl: null },
  { slug: "demo-queren", hanzi: "确认", pinyin: "quèrèn", meaning: "xác nhận", example: "请确认一下会议时间。", translation: "Vui lòng xác nhận lại thời gian họp.", audioUrl: null },
];

export default async function HomePage() {
  const user = await getCurrentUser();
  const [summary, personalizedReviewWords] = user
    ? await Promise.all([getLearningSummary(user.id), listPracticeVocabulary(5, user.id)])
    : [{ completedLessons: 6, openedLessons: 6 }, [] as Vocabulary[]] as const;

  return <ReviewHomeStudio
    authenticated={Boolean(user)}
    completedLessons={summary.completedLessons}
    vocabulary={user ? personalizedReviewWords : demoReviewWords}
  />;
}
