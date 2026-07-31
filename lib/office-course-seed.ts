import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";
import { foundationChallenge, officeExpansionLessons, officeExpansionModules } from "./office-course-expansion.ts";

export type OfficeModuleSeed = CourseModuleSeed;
export type OfficeLessonSeed = CourseLessonSeed;

export const officeModule = {
  slug: "giao-tiep-van-phong-can-ban",
  title: "Giao tiếp văn phòng căn bản",
  description: "Sáu tình huống nền tảng từ ngày đầu nhận việc đến phối hợp cùng đồng nghiệp.",
};

const foundationOfficeLessons: Omit<OfficeLessonSeed, "moduleSlug">[] = [
  {
    slug: "chao-hoi-tai-noi-lam-viec",
    title: "Chào hỏi tại nơi làm việc",
    summary: "Giới thiệu bản thân, bộ phận và phạm vi công việc với đồng nghiệp mới.",
    situation: "Ngày đầu nhận việc",
    estimatedMinutes: 10,
    isFree: true,
    vocabulary: [
      { slug: "tongshi", hanzi: "同事", pinyin: "tóngshì", meaning: "đồng nghiệp", example: "她是我们部门的新同事。", translation: "Cô ấy là đồng nghiệp mới của bộ phận chúng tôi.", audioUrl: null },
      { slug: "bumen", hanzi: "部门", pinyin: "bùmén", meaning: "bộ phận, phòng ban", example: "你在哪个部门工作？", translation: "Bạn làm việc ở bộ phận nào?", audioUrl: null },
      { slug: "fuze", hanzi: "负责", pinyin: "fùzé", meaning: "phụ trách", example: "我负责客户服务。", translation: "Tôi phụ trách chăm sóc khách hàng.", audioUrl: null },
      { slug: "ruzhi", hanzi: "入职", pinyin: "rùzhí", meaning: "nhận việc, vào làm", example: "我今天正式入职。", translation: "Hôm nay tôi chính thức nhận việc.", audioUrl: null },
      { slug: "jieshao", hanzi: "介绍", pinyin: "jièshào", meaning: "giới thiệu", example: "请允许我介绍一下自己。", translation: "Xin cho phép tôi giới thiệu đôi chút về bản thân.", audioUrl: null },
      { slug: "qing-duo-guanzhao", hanzi: "请多关照", pinyin: "qǐng duō guānzhào", meaning: "mong được giúp đỡ", example: "我是新来的，请多关照。", translation: "Tôi là người mới, mong mọi người giúp đỡ.", audioUrl: null },
    ],
    content: {
      dialogue: [
        { speaker: "A", hanzi: "大家好，我是新来的同事，我叫安。", pinyin: "Dàjiā hǎo, wǒ shì xīn lái de tóngshì, wǒ jiào Ān.", translation: "Chào mọi người, tôi là đồng nghiệp mới, tôi tên An." },
        { speaker: "B", hanzi: "欢迎你！你在哪个部门工作？", pinyin: "Huānyíng nǐ! Nǐ zài nǎge bùmén gōngzuò?", translation: "Chào mừng bạn! Bạn làm việc ở bộ phận nào?" },
        { speaker: "A", hanzi: "我在行政部，负责办公室事务。", pinyin: "Wǒ zài xíngzhèng bù, fùzé bàngōngshì shìwù.", translation: "Tôi ở phòng hành chính, phụ trách công việc văn phòng." },
        { speaker: "B", hanzi: "好的，以后有问题可以找我。", pinyin: "Hǎo de, yǐhòu yǒu wèntí kěyǐ zhǎo wǒ.", translation: "Được, sau này có vấn đề bạn có thể tìm tôi." },
      ],
      notes: [
        { title: "Giới thiệu vai trò", pattern: "我负责……", explanation: "Dùng để nói ngắn gọn phần việc mình phụ trách. Có thể đặt tên khách hàng, dự án hoặc nghiệp vụ sau 负责." },
        { title: "Lời chào khi mới vào nhóm", pattern: "请多关照", explanation: "Cách nói lịch sự khi mới gia nhập. Trong môi trường thân mật có thể dùng 请大家多多关照 để hướng tới cả nhóm." },
      ],
    },
  },
  {
    slug: "nhan-va-giao-nhiem-vu",
    title: "Nhận và giao nhiệm vụ",
    summary: "Hiểu yêu cầu, mức độ ưu tiên và xác nhận thời hạn hoàn thành.",
    situation: "Quản lý giao việc",
    estimatedMinutes: 12,
    isFree: true,
    vocabulary: [
      { slug: "renwu", hanzi: "任务", pinyin: "rènwu", meaning: "nhiệm vụ", example: "今天有一个新任务。", translation: "Hôm nay có một nhiệm vụ mới.", audioUrl: null },
      { slug: "anpai", hanzi: "安排", pinyin: "ānpái", meaning: "sắp xếp, phân công", example: "经理安排我整理资料。", translation: "Quản lý phân công tôi sắp xếp tài liệu.", audioUrl: null },
      { slug: "jiezhiriqi", hanzi: "截止日期", pinyin: "jiézhǐ rìqī", meaning: "hạn chót", example: "这个任务的截止日期是周五。", translation: "Hạn chót của nhiệm vụ này là thứ Sáu.", audioUrl: null },
      { slug: "youxian-chuli", hanzi: "优先处理", pinyin: "yōuxiān chǔlǐ", meaning: "xử lý ưu tiên", example: "请优先处理客户的邮件。", translation: "Hãy ưu tiên xử lý email của khách hàng.", audioUrl: null },
      { slug: "tijiao", hanzi: "提交", pinyin: "tíjiāo", meaning: "nộp, gửi lên", example: "下班前请提交文件。", translation: "Vui lòng nộp tài liệu trước khi tan làm.", audioUrl: null },
      { slug: "queren", hanzi: "确认", pinyin: "quèrèn", meaning: "xác nhận", example: "我想确认一下具体要求。", translation: "Tôi muốn xác nhận lại yêu cầu cụ thể.", audioUrl: null },
    ],
    content: {
      dialogue: [
        { speaker: "A", hanzi: "小安，这份客户名单请你整理一下。", pinyin: "Xiǎo Ān, zhè fèn kèhù míngdān qǐng nǐ zhěnglǐ yíxià.", translation: "An, bạn hãy sắp xếp lại danh sách khách hàng này." },
        { speaker: "B", hanzi: "好的，请问截止日期是什么时候？", pinyin: "Hǎo de, qǐngwèn jiézhǐ rìqī shì shénme shíhou?", translation: "Vâng, xin hỏi hạn chót là khi nào?" },
        { speaker: "A", hanzi: "明天下午三点前提交，请优先处理。", pinyin: "Míngtiān xiàwǔ sān diǎn qián tíjiāo, qǐng yōuxiān chǔlǐ.", translation: "Hãy nộp trước 3 giờ chiều mai và ưu tiên xử lý." },
        { speaker: "B", hanzi: "明白，我整理好以后发给您确认。", pinyin: "Míngbai, wǒ zhěnglǐ hǎo yǐhòu fā gěi nín quèrèn.", translation: "Tôi hiểu rồi, sau khi sắp xếp xong tôi sẽ gửi anh/chị xác nhận." },
      ],
      notes: [
        { title: "Xác nhận thời hạn", pattern: "截止日期是什么时候？", explanation: "Nên hỏi rõ hạn chót ngay khi nhận việc. Với quản lý, thêm 请问 giúp câu hỏi lịch sự hơn." },
        { title: "Xác nhận đã hiểu", pattern: "明白，我会……", explanation: "Dùng 明白 rồi nhắc lại hành động và thời hạn để giảm hiểu nhầm khi nhận nhiệm vụ." },
      ],
    },
  },
  {
    slug: "sap-xep-lich-hop",
    title: "Sắp xếp lịch họp",
    summary: "Hỏi thời gian rảnh, gửi lời mời và xử lý yêu cầu đổi lịch.",
    situation: "Điều phối cuộc họp",
    estimatedMinutes: 11,
    isFree: true,
    vocabulary: [
      { slug: "huiyi", hanzi: "会议", pinyin: "huìyì", meaning: "cuộc họp", example: "我们下午有一个项目会议。", translation: "Chiều nay chúng ta có một cuộc họp dự án.", audioUrl: null },
      { slug: "richeng", hanzi: "日程", pinyin: "rìchéng", meaning: "lịch làm việc", example: "我先查看一下今天的日程。", translation: "Tôi kiểm tra lịch làm việc hôm nay trước.", audioUrl: null },
      { slug: "youkong", hanzi: "有空", pinyin: "yǒu kòng", meaning: "có thời gian rảnh", example: "您明天上午有空吗？", translation: "Sáng mai anh/chị có rảnh không?", audioUrl: null },
      { slug: "gaiqi", hanzi: "改期", pinyin: "gǎiqī", meaning: "đổi lịch", example: "客户希望把会议改期。", translation: "Khách hàng muốn đổi lịch cuộc họp.", audioUrl: null },
      { slug: "huiyishi", hanzi: "会议室", pinyin: "huìyìshì", meaning: "phòng họp", example: "三号会议室已经预订了。", translation: "Phòng họp số 3 đã được đặt.", audioUrl: null },
      { slug: "yaoqing", hanzi: "邀请", pinyin: "yāoqǐng", meaning: "mời, lời mời", example: "我已经发送了会议邀请。", translation: "Tôi đã gửi lời mời họp.", audioUrl: null },
    ],
    content: {
      dialogue: [
        { speaker: "A", hanzi: "王经理，您明天下午有空吗？", pinyin: "Wáng jīnglǐ, nín míngtiān xiàwǔ yǒu kòng ma?", translation: "Quản lý Vương, chiều mai anh có rảnh không?" },
        { speaker: "B", hanzi: "两点以后可以。有什么安排？", pinyin: "Liǎng diǎn yǐhòu kěyǐ. Yǒu shénme ānpái?", translation: "Sau 2 giờ thì được. Có lịch gì vậy?" },
        { speaker: "A", hanzi: "我们想开一个项目会议，三点可以吗？", pinyin: "Wǒmen xiǎng kāi yí ge xiàngmù huìyì, sān diǎn kěyǐ ma?", translation: "Chúng tôi muốn họp dự án, 3 giờ có được không?" },
        { speaker: "B", hanzi: "可以，请把会议邀请发给我。", pinyin: "Kěyǐ, qǐng bǎ huìyì yāoqǐng fā gěi wǒ.", translation: "Được, hãy gửi lời mời họp cho tôi." },
      ],
      notes: [
        { title: "Hỏi lịch một cách lịch sự", pattern: "您……有空吗？", explanation: "Dùng 您 khi hỏi quản lý hoặc khách hàng. Nên nêu rõ ngày và buổi để người nghe dễ xác nhận." },
        { title: "Đề xuất thời gian", pattern: "……点可以吗？", explanation: "Mẫu ngắn gọn để chốt giờ. Khi cần đổi lịch, dùng 把会议改到…… được hiểu là chuyển cuộc họp sang thời điểm mới." },
      ],
    },
  },
  {
    slug: "viet-va-gui-bao-cao",
    title: "Viết và gửi báo cáo",
    summary: "Trao đổi về dữ liệu, tệp đính kèm và yêu cầu chỉnh sửa báo cáo.",
    situation: "Gửi báo cáo tuần",
    estimatedMinutes: 12,
    isFree: true,
    vocabulary: [
      { slug: "baogao", hanzi: "报告", pinyin: "bàogào", meaning: "báo cáo", example: "本周报告已经完成了。", translation: "Báo cáo tuần này đã hoàn thành.", audioUrl: null },
      { slug: "shuju", hanzi: "数据", pinyin: "shùjù", meaning: "dữ liệu", example: "请检查一下销售数据。", translation: "Hãy kiểm tra lại dữ liệu bán hàng.", audioUrl: null },
      { slug: "fujian", hanzi: "附件", pinyin: "fùjiàn", meaning: "tệp đính kèm", example: "详细内容请查看附件。", translation: "Vui lòng xem nội dung chi tiết trong tệp đính kèm.", audioUrl: null },
      { slug: "zongjie", hanzi: "总结", pinyin: "zǒngjié", meaning: "tổng kết", example: "报告最后需要一个简短的总结。", translation: "Cuối báo cáo cần một phần tổng kết ngắn.", audioUrl: null },
      { slug: "fasong", hanzi: "发送", pinyin: "fāsòng", meaning: "gửi", example: "我现在把报告发送给您。", translation: "Bây giờ tôi gửi báo cáo cho anh/chị.", audioUrl: null },
      { slug: "xiugai", hanzi: "修改", pinyin: "xiūgǎi", meaning: "chỉnh sửa", example: "请根据意见修改报告。", translation: "Hãy chỉnh sửa báo cáo theo góp ý.", audioUrl: null },
    ],
    content: {
      dialogue: [
        { speaker: "A", hanzi: "本周的工作报告完成了吗？", pinyin: "Běn zhōu de gōngzuò bàogào wánchéng le ma?", translation: "Báo cáo công việc tuần này đã hoàn thành chưa?" },
        { speaker: "B", hanzi: "已经完成了，我正在检查数据。", pinyin: "Yǐjīng wánchéng le, wǒ zhèngzài jiǎnchá shùjù.", translation: "Đã hoàn thành rồi, tôi đang kiểm tra dữ liệu." },
        { speaker: "A", hanzi: "好的，请加上项目总结以后发给我。", pinyin: "Hǎo de, qǐng jiā shàng xiàngmù zǒngjié yǐhòu fā gěi wǒ.", translation: "Được, hãy thêm phần tổng kết dự án rồi gửi cho tôi." },
        { speaker: "B", hanzi: "没问题，我会把文件放在附件里。", pinyin: "Méi wèntí, wǒ huì bǎ wénjiàn fàng zài fùjiàn lǐ.", translation: "Không vấn đề, tôi sẽ để tài liệu trong tệp đính kèm." },
      ],
      notes: [
        { title: "Thông báo tệp đính kèm", pattern: "请查看附件", explanation: "Dùng trong email công việc để nhắc người nhận mở tệp. Có thể thêm 详细内容 ở đầu câu khi tệp chứa phần chi tiết." },
        { title: "Diễn tả hành động đang làm", pattern: "正在……", explanation: "正在 đặt trước động từ để nhấn mạnh hành động đang diễn ra, ví dụ 正在检查数据." },
      ],
    },
  },
  {
    slug: "theo-doi-tien-do-cong-viec",
    title: "Theo dõi tiến độ công việc",
    summary: "Hỏi, cập nhật và nhắc về tiến độ một cách tự nhiên tại nơi làm việc.",
    situation: "Cập nhật tiến độ dự án",
    estimatedMinutes: 12,
    isFree: true,
    vocabulary: [
      { slug: "jindu", hanzi: "进度", pinyin: "jìndù", meaning: "tiến độ", example: "项目进度怎么样？", translation: "Tiến độ dự án thế nào rồi?", audioUrl: null },
      { slug: "anshi", hanzi: "按时", pinyin: "ànshí", meaning: "đúng giờ, đúng hạn", example: "请按时完成任务。", translation: "Hãy hoàn thành nhiệm vụ đúng hạn.", audioUrl: null },
      { slug: "huibao", hanzi: "汇报", pinyin: "huìbào", meaning: "báo cáo, báo cáo lại", example: "下午向经理汇报。", translation: "Buổi chiều báo cáo với quản lý.", audioUrl: null },
      { slug: "tuichi", hanzi: "推迟", pinyin: "tuīchí", meaning: "trì hoãn", example: "会议推迟到明天。", translation: "Cuộc họp lùi sang ngày mai.", audioUrl: null },
      { slug: "yi-wancheng", hanzi: "已完成", pinyin: "yǐ wánchéng", meaning: "đã hoàn thành", example: "这个部分已完成。", translation: "Phần này đã hoàn thành.", audioUrl: null },
      { slug: "jinxingzhong", hanzi: "进行中", pinyin: "jìnxíng zhōng", meaning: "đang tiến hành", example: "测试工作还在进行中。", translation: "Công việc kiểm thử vẫn đang tiến hành.", audioUrl: null },
    ],
    content: {
      dialogue: [
        { speaker: "A", hanzi: "项目进度怎么样？", pinyin: "Xiàngmù jìndù zěnmeyàng?", translation: "Tiến độ dự án thế nào rồi?" },
        { speaker: "B", hanzi: "已经完成百分之八十了。", pinyin: "Yǐjīng wánchéng bǎifēnzhī bāshí le.", translation: "Đã hoàn thành 80% rồi." },
        { speaker: "A", hanzi: "可以按时完成吗？", pinyin: "Kěyǐ ànshí wánchéng ma?", translation: "Có thể hoàn thành đúng hạn không?" },
        { speaker: "B", hanzi: "没问题，明天下午向您汇报。", pinyin: "Méi wèntí, míngtiān xiàwǔ xiàng nín huìbào.", translation: "Không vấn đề, chiều mai tôi sẽ báo cáo anh/chị." },
      ],
      notes: [
        { title: "Hỏi tình trạng công việc", pattern: "……进度怎么样？", explanation: "Mẫu hỏi trực tiếp nhưng trung tính. Khi nói với quản lý hoặc khách hàng, có thể thêm 请问 ở đầu câu để lịch sự hơn." },
        { title: "Ba trạng thái hữu ích", pattern: "已完成 / 进行中 / 待处理", explanation: "Dùng ba cụm này để báo cáo nhanh: đã hoàn thành, đang tiến hành và chờ xử lý." },
      ],
    },
  },
  {
    slug: "xin-ho-tro-tu-dong-nghiep",
    title: "Xin hỗ trợ từ đồng nghiệp",
    summary: "Mô tả vấn đề, nhờ hỗ trợ và phản hồi lịch sự khi phối hợp công việc.",
    situation: "Gặp vướng mắc khi xử lý việc",
    estimatedMinutes: 11,
    isFree: false,
    vocabulary: [
      { slug: "xiezhu", hanzi: "协助", pinyin: "xiézhù", meaning: "hỗ trợ, phối hợp", example: "感谢您的协助。", translation: "Cảm ơn sự hỗ trợ của anh/chị.", audioUrl: null },
      { slug: "bangmang", hanzi: "帮忙", pinyin: "bāngmáng", meaning: "giúp đỡ", example: "你可以帮我一个忙吗？", translation: "Bạn có thể giúp tôi một việc không?", audioUrl: null },
      { slug: "yudao-wenti", hanzi: "遇到问题", pinyin: "yùdào wèntí", meaning: "gặp vấn đề", example: "我在导出文件时遇到问题。", translation: "Tôi gặp vấn đề khi xuất tệp.", audioUrl: null },
      { slug: "jiejue", hanzi: "解决", pinyin: "jiějué", meaning: "giải quyết", example: "我们一起解决这个问题。", translation: "Chúng ta cùng giải quyết vấn đề này.", audioUrl: null },
      { slug: "qingjiao", hanzi: "请教", pinyin: "qǐngjiào", meaning: "xin chỉ dẫn, hỏi ý kiến", example: "我想向你请教一个问题。", translation: "Tôi muốn xin bạn chỉ dẫn một vấn đề.", audioUrl: null },
      { slug: "mafan-ni-le", hanzi: "麻烦你了", pinyin: "máfan nǐ le", meaning: "làm phiền bạn rồi", example: "这件事麻烦你了。", translation: "Việc này làm phiền bạn rồi.", audioUrl: null },
    ],
    content: {
      dialogue: [
        { speaker: "A", hanzi: "不好意思，我想向你请教一个问题。", pinyin: "Bù hǎoyìsi, wǒ xiǎng xiàng nǐ qǐngjiào yí ge wèntí.", translation: "Xin lỗi, tôi muốn hỏi bạn một vấn đề." },
        { speaker: "B", hanzi: "可以，你遇到什么问题了？", pinyin: "Kěyǐ, nǐ yùdào shénme wèntí le?", translation: "Được, bạn gặp vấn đề gì?" },
        { speaker: "A", hanzi: "我不能导出这个文件，你可以帮忙看看吗？", pinyin: "Wǒ bù néng dǎochū zhège wénjiàn, nǐ kěyǐ bāngmáng kànkan ma?", translation: "Tôi không thể xuất tệp này, bạn có thể giúp xem không?" },
        { speaker: "B", hanzi: "没问题，我们一起解决。", pinyin: "Méi wèntí, wǒmen yìqǐ jiějué.", translation: "Không vấn đề, chúng ta cùng giải quyết." },
      ],
      notes: [
        { title: "Mở lời nhờ hỗ trợ", pattern: "我想向你请教……", explanation: "Lịch sự hơn hỏi thẳng. Với quản lý hoặc người chưa thân, đổi 你 thành 您." },
        { title: "Nêu rõ vấn đề", pattern: "我在……时遇到问题", explanation: "Đặt hành động sau 在 và trước 时 để mô tả chính xác lúc vấn đề xảy ra, giúp đồng nghiệp hỗ trợ nhanh hơn." },
      ],
    },
  },
];

export const officeModules: OfficeModuleSeed[] = [officeModule, ...officeExpansionModules];

export const officeLessons: OfficeLessonSeed[] = [
  ...foundationOfficeLessons.map((lesson, index) => ({
    ...lesson,
    moduleSlug: officeModule.slug,
    isFree: true,
    content: index === foundationOfficeLessons.length - 1
      ? { ...lesson.content, challenge: foundationChallenge }
      : lesson.content,
  })),
  ...officeExpansionLessons,
];

export const officeCourseStats = {
  lessons: officeLessons.length,
  minutes: officeLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: officeLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: new Set(officeLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.slug))).size,
  modules: officeModules.length,
};
