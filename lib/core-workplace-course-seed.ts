import type { LessonChallenge, UsageNote, Vocabulary } from "./content-types.ts";
import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";

type CoreWordInput = [slug: string, hanzi: string, pinyin: string, meaning: string, example: string, translation: string];
type CoreLine = [hanzi: string, pinyin: string, translation: string];

type CoreLessonInput = Omit<CourseLessonSeed, "content" | "vocabulary"> & {
  vocabulary: CoreWordInput[];
  request: CoreLine;
  response: CoreLine;
  notes: [UsageNote, UsageNote];
  challenge?: LessonChallenge;
};

const note = (title: string, pattern: string, explanation: string): UsageNote => ({ title, pattern, explanation });

function toVocabulary(input: CoreWordInput): Vocabulary {
  const [slug, hanzi, pinyin, meaning, example, translation] = input;
  return { slug: `core-${slug}`, hanzi, pinyin, meaning, example, translation, audioUrl: null };
}

function createLesson(input: CoreLessonInput): CourseLessonSeed {
  const { request, response, challenge, notes, ...lesson } = input;
  return {
    ...lesson,
    vocabulary: lesson.vocabulary.map(toVocabulary),
    content: {
      dialogue: [
        { speaker: "A", hanzi: "现在沟通到哪一步了？", pinyin: "Xiànzài gōutōng dào nǎ yí bù le?", translation: "Hiện việc trao đổi đang ở bước nào?" },
        { speaker: "B", hanzi: request[0], pinyin: request[1], translation: request[2] },
        { speaker: "A", hanzi: "接下来怎么说更清楚？", pinyin: "Jiēxiàlái zěnme shuō gèng qīngchu?", translation: "Tiếp theo nói thế nào sẽ rõ hơn?" },
        { speaker: "B", hanzi: response[0], pinyin: response[1], translation: response[2] },
      ],
      notes,
      ...(challenge ? { challenge } : {}),
    },
  };
}

const dailyChallenge: LessonChallenge = {
  title: "Kiểm tra giao tiếp hằng ngày",
  description: "Đạt 4/5 câu để chuyển sang hiểu việc và phối hợp.",
  passScore: 4,
  questions: [
    { prompt: "初次见面，cách mở đầu phù hợp là gì?", options: ["您好，很高兴认识您。", "你是谁？", "快点说。"], correctOption: 0, explanation: "您好 và 很高兴认识您 tạo lời chào lịch sự khi gặp lần đầu." },
    { prompt: "Khi chưa nghe rõ, nên nói gì?", options: ["不好意思，请再说一遍。", "算了，不用说。", "我肯定听懂了。"], correctOption: 0, explanation: "Xin người nói lặp lại tốt hơn giả vờ đã hiểu một thông tin công việc." },
    { prompt: "我的理解是…… dùng để làm gì?", options: ["Nói lại cách mình hiểu để xác nhận", "Từ chối nhiệm vụ", "Kết thúc cuộc gọi"], correctOption: 0, explanation: "Cấu trúc này cho người nghe cơ hội sửa điểm hiểu chưa đúng." },
    { prompt: "Câu nào hỏi địa điểm và thời gian rõ ràng?", options: ["请问几点、在哪里集合？", "什么时候都可以。", "我以后再看。"], correctOption: 0, explanation: "几点 và 在哪里 xác định hai thông tin cần cho việc có mặt đúng lúc." },
    { prompt: "Khi gọi người lớn tuổi hoặc khách hàng, 您 thể hiện điều gì?", options: ["Sự lịch sự và tôn trọng", "Số nhiều", "Quan hệ thân mật"], correctOption: 0, explanation: "您 là đại từ xưng hô lịch sự, phù hợp với người chưa thân hoặc cần thể hiện sự tôn trọng." },
  ],
};

const coordinationChallenge: LessonChallenge = {
  title: "Kiểm tra hiểu việc & phối hợp",
  description: "Đạt 4/5 câu để chuyển sang báo cáo và xử lý vấn đề.",
  passScore: 4,
  questions: [
    { prompt: "任务目标 nghĩa là gì?", options: ["Mục tiêu nhiệm vụ", "Người phụ trách", "Ngày nghỉ"], correctOption: 0, explanation: "任务 là nhiệm vụ; 目标 là mục tiêu cần đạt." },
    { prompt: "Khi có hai việc cùng gấp, nên hỏi thế nào?", options: ["请问哪个任务优先？", "两个都不做。", "我随便选一个。"], correctOption: 0, explanation: "Hỏi mức ưu tiên giúp quản lý xác nhận thứ tự thay vì nhân viên tự đoán." },
    { prompt: "负责 và 配合 khác nhau thế nào?", options: ["Chịu trách nhiệm chính và phối hợp hỗ trợ", "Bắt đầu và kết thúc", "Gửi và nhận"], correctOption: 0, explanation: "负责 là chịu trách nhiệm; 配合 là phối hợp theo phân công." },
    { prompt: "Câu nào xác nhận hạn chót?", options: ["最晚周五下午完成，对吗？", "以后再完成。", "时间不重要。"], correctOption: 0, explanation: "最晚 + thời điểm + 对吗 xác nhận mốc cuối cụ thể." },
    { prompt: "Khi phạm vi chưa rõ, nên làm gì?", options: ["Hỏi đầu ra, phạm vi và tiêu chuẩn", "Làm toàn bộ mọi thứ", "Chờ mà không thông báo"], correctOption: 0, explanation: "Ba nhóm câu hỏi giúp giảm làm sai hoặc làm vượt phạm vi." },
  ],
};

const issueChallenge: LessonChallenge = {
  title: "Kiểm tra báo cáo & xử lý vấn đề",
  description: "Đạt 4/5 câu để chuyển sang giao tiếp đa kênh.",
  passScore: 4,
  questions: [
    { prompt: "目前完成了百分之七十 nghĩa là gì?", options: ["Hiện đã hoàn thành 70%", "Còn 70% chưa làm", "Kế hoạch tăng 70%"], correctOption: 0, explanation: "目前 chỉ hiện tại; 完成了 cho biết phần việc đã hoàn thành." },
    { prompt: "遇到阻碍时 nên báo điều gì?", options: ["Vấn đề, ảnh hưởng và hỗ trợ cần thiết", "Chỉ nói có vấn đề", "Đợi đến khi trễ hạn"], correctOption: 0, explanation: "Báo đủ ba phần giúp người nhận quyết định nhanh hơn." },
    { prompt: "Khi chưa đủ thẩm quyền, câu nào phù hợp?", options: ["这个情况需要请负责人确认。", "我自己决定就行。", "不用告诉任何人。"], correctOption: 0, explanation: "Chuyển người phụ trách xác nhận giúp giữ đúng phạm vi trách nhiệm." },
    { prompt: "Phát hiện mình gửi sai tệp. Nên phản hồi thế nào?", options: ["很抱歉，我发错文件了，现在马上更正。", "不是我的问题。", "以后再说。"], correctOption: 0, explanation: "Câu này nhận lỗi cụ thể và nêu hành động sửa ngay." },
    { prompt: "备选方案 dùng để chỉ gì?", options: ["Phương án thay thế", "Bản ghi cuộc gọi", "Tiêu chuẩn kiểm tra"], correctOption: 0, explanation: "备选 là dự phòng; 方案 là phương án." },
  ],
};

const finalChallenge: LessonChallenge = {
  title: "Kiểm tra tổng hợp Giao tiếp công sở cốt lõi",
  description: "Đạt 5/6 câu để hoàn thành lộ trình.",
  passScore: 5,
  questions: [
    { prompt: "Tin nhắn công việc rõ nên có gì?", options: ["Bối cảnh, việc cần làm và thời hạn", "Chỉ một từ ‘gấp’", "Nhiều biểu tượng nhưng không có yêu cầu"], correctOption: 0, explanation: "Ba phần giúp người nhận hiểu vì sao được liên hệ và cần phản hồi thế nào." },
    { prompt: "Khi gọi điện, bước mở đầu phù hợp là gì?", options: ["Nói tên, bộ phận và mục đích cuộc gọi", "Hỏi ngay thông tin nhạy cảm", "Bật loa ngoài mà không báo"], correctOption: 0, explanation: "Giới thiệu ngắn giúp người nghe xác định người gọi và bối cảnh." },
    { prompt: "我补充一点 dùng trong họp để làm gì?", options: ["Bổ sung một ý", "Phản đối hoàn toàn", "Kết thúc họp"], correctOption: 0, explanation: "补充一点 là cách xin thêm một ý ngắn vào trao đổi." },
    { prompt: "Không đồng ý với đồng nghiệp, cách nào chuyên nghiệp?", options: ["我理解您的考虑，不过我有一个不同的看法。", "你完全错了。", "我不想听。"], correctOption: 0, explanation: "Ghi nhận góc nhìn trước khi nêu ý khác giúp tập trung vào vấn đề thay vì con người." },
    { prompt: "Bàn giao tốt cần nêu gì?", options: ["Trạng thái, việc còn lại, tài liệu và người liên hệ", "Chỉ nói đã bàn giao", "Chỉ gửi một ảnh"], correctOption: 0, explanation: "Các mục này giúp người nhận tiếp tục công việc mà không phải tìm lại bối cảnh." },
    { prompt: "Khi xử lý thông tin nhạy cảm, khóa học yêu cầu gì?", options: ["Dùng đúng kênh, quyền truy cập và chính sách tổ chức", "Gửi vào nhóm đông người cho nhanh", "Chụp màn hình chia sẻ tự do"], correctOption: 0, explanation: "Ngôn ngữ giao tiếp không thay thế quy định bảo mật và phân quyền của tổ chức." },
  ],
};

export const coreWorkplaceModules: CourseModuleSeed[] = [
  { slug: "giao-tiep-hang-ngay", title: "Giao tiếp hằng ngày", description: "Chào hỏi, giới thiệu, nghe lại, xác nhận ý hiểu và hỏi thông tin cơ bản tại nơi làm việc." },
  { slug: "hieu-viec-va-phoi-hop", title: "Hiểu việc & phối hợp", description: "Nhận nhiệm vụ, làm rõ mục tiêu, ưu tiên, phân công, thời hạn và tiêu chuẩn đầu ra." },
  { slug: "bao-cao-va-xu-ly-van-de", title: "Báo cáo & xử lý vấn đề", description: "Cập nhật tiến độ, báo trở ngại, xin hỗ trợ, nhận lỗi và đề xuất phương án." },
  { slug: "giao-tiep-da-kenh", title: "Giao tiếp đa kênh", description: "Nhắn tin, gọi điện, phát biểu trong họp, phản hồi khác biệt và bàn giao chuyên nghiệp." },
];

const coreWorkplaceLessonInputs: CoreLessonInput[] = [
  {
    moduleSlug: "giao-tiep-hang-ngay", slug: "chao-hoi-va-xung-ho-lich-su", title: "Chào hỏi và xưng hô lịch sự",
    summary: "Chọn lời chào, đại từ và cách gọi phù hợp khi gặp đồng nghiệp, quản lý hoặc khách.", situation: "Gặp một người mới tại nơi làm việc", estimatedMinutes: 11, isFree: true,
    vocabulary: [
      ["l01-ninhao", "您好", "nín hǎo", "xin chào lịch sự", "您好，我是新来的员工。", "Xin chào, tôi là nhân viên mới."],
      ["l01-chucijianmian", "初次见面", "chūcì jiànmiàn", "lần đầu gặp mặt", "初次见面，请多关照。", "Lần đầu gặp mặt, mong được giúp đỡ."],
      ["l01-tongshi", "同事", "tóngshì", "đồng nghiệp", "她是我们部门的新同事。", "Cô ấy là đồng nghiệp mới của bộ phận chúng tôi."],
      ["l01-lingdao", "领导", "lǐngdǎo", "quản lý, lãnh đạo", "领导正在和客户开会。", "Quản lý đang họp với khách."],
      ["l01-chenghu", "称呼", "chēnghu", "cách xưng hô", "请问我应该怎么称呼您？", "Xin hỏi tôi nên xưng hô với anh/chị thế nào?"],
      ["l01-guanzhao", "关照", "guānzhào", "giúp đỡ, chỉ dẫn", "以后请大家多多关照。", "Sau này mong mọi người giúp đỡ nhiều."],
    ],
    request: ["我今天第一次见部门负责人。", "Wǒ jīntiān dì yī cì jiàn bùmén fùzérén.", "Hôm nay tôi gặp người phụ trách bộ phận lần đầu."],
    response: ["我会先礼貌问好，再确认合适的称呼。", "Wǒ huì xiān lǐmào wènhǎo, zài quèrèn héshì de chēnghu.", "Tôi sẽ chào lịch sự rồi xác nhận cách xưng hô phù hợp."],
    notes: [note("您 và 你", "您好 / 你好", "您 lịch sự hơn; dùng với khách, người lớn tuổi hoặc người chưa thân."), note("Lời xã giao khi mới gặp", "初次见面，请多关照", "Câu này thể hiện thiện chí học hỏi, không phải yêu cầu giúp đỡ cụ thể.")],
  },
  {
    moduleSlug: "giao-tiep-hang-ngay", slug: "gioi-thieu-ten-vai-tro-va-bo-phan", title: "Giới thiệu tên, vai trò và bộ phận",
    summary: "Giới thiệu ngắn gọn mình là ai, thuộc nhóm nào và đang phụ trách việc gì.", situation: "Tham gia một nhóm phối hợp mới", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l02-ziwojieshao", "自我介绍", "zìwǒ jièshào", "tự giới thiệu", "我先做一个简单的自我介绍。", "Tôi xin tự giới thiệu ngắn gọn."],
      ["l02-xingming", "姓名", "xìngmíng", "họ tên", "请填写您的姓名。", "Hãy điền họ tên của anh/chị."],
      ["l02-bumen", "部门", "bùmén", "bộ phận", "我在运营部门工作。", "Tôi làm ở bộ phận vận hành."],
      ["l02-zhiwei", "职位", "zhíwèi", "vị trí công việc", "我的职位是项目助理。", "Vị trí của tôi là trợ lý dự án."],
      ["l02-fuze", "负责", "fùzé", "phụ trách", "我负责跟进客户订单。", "Tôi phụ trách theo dõi đơn của khách."],
      ["l02-jieru", "加入", "jiārù", "gia nhập", "我上周刚加入这个团队。", "Tuần trước tôi vừa gia nhập nhóm này."],
    ],
    request: ["新项目组的成员还不认识我。", "Xīn xiàngmù zǔ de chéngyuán hái bù rènshi wǒ.", "Các thành viên nhóm dự án mới chưa biết tôi."],
    response: ["我会说明姓名、部门和负责的工作。", "Wǒ huì shuōmíng xìngmíng, bùmén hé fùzé de gōngzuò.", "Tôi sẽ nêu tên, bộ phận và công việc phụ trách."],
    notes: [note("Giới thiệu ba phần", "我是…… / 我在…… / 我负责……", "Ba mẫu lần lượt nêu danh tính, nơi làm việc và trách nhiệm."), note("Giữ phần giới thiệu ngắn", "简单介绍一下", "Chọn thông tin liên quan trực tiếp đến nhóm đang phối hợp.")],
  },
  {
    moduleSlug: "giao-tiep-hang-ngay", slug: "xin-nhac-lai-va-noi-cham-hon", title: "Xin nhắc lại và nói chậm hơn",
    summary: "Chủ động báo chưa nghe rõ, xin lặp lại hoặc nói chậm mà không làm gián đoạn thiếu lịch sự.", situation: "Trao đổi trong môi trường nhiều tiếng ồn", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l03-tingqing", "听清", "tīngqīng", "nghe rõ", "刚才我没有听清。", "Vừa rồi tôi chưa nghe rõ."],
      ["l03-zaishuo", "再说一遍", "zài shuō yí biàn", "nói lại một lần", "请您再说一遍。", "Xin anh/chị nói lại một lần."],
      ["l03-mandian", "慢一点", "màn yìdiǎn", "chậm hơn một chút", "可以说慢一点吗？", "Có thể nói chậm hơn một chút không?"],
      ["l03-meitingdong", "没听懂", "méi tīngdǒng", "chưa nghe hiểu", "这个词我没听懂。", "Từ này tôi chưa nghe hiểu."],
      ["l03-shengyin", "声音", "shēngyīn", "âm thanh, giọng nói", "您的声音有一点小。", "Giọng của anh/chị hơi nhỏ."],
      ["l03-qingchu", "清楚", "qīngchu", "rõ ràng", "现在听得很清楚。", "Bây giờ nghe rất rõ."],
    ],
    request: ["现场太吵，我没有听清最后一句。", "Xiànchǎng tài chǎo, wǒ méiyǒu tīngqīng zuìhòu yí jù.", "Hiện trường quá ồn, tôi chưa nghe rõ câu cuối."],
    response: ["我会先说明情况，再请对方慢一点重复。", "Wǒ huì xiān shuōmíng qíngkuàng, zài qǐng duìfāng màn yìdiǎn chóngfù.", "Tôi sẽ nói rõ tình hình rồi nhờ đối phương lặp lại chậm hơn."],
    notes: [note("Xin lặp lại lịch sự", "不好意思，请再说一遍", "不好意思 làm mềm yêu cầu và cho biết bạn đang cố theo kịp trao đổi."), note("Nghe rõ khác hiểu rõ", "没听清 / 没听懂", "没听清 là không nghe rõ âm thanh; 没听懂 là nghe được nhưng chưa hiểu nghĩa.")],
  },
  {
    moduleSlug: "giao-tiep-hang-ngay", slug: "noi-lai-y-hieu-de-xac-nhan", title: "Nói lại ý hiểu để xác nhận",
    summary: "Tóm tắt lại nội dung vừa nghe và hỏi đối phương xác nhận đúng hay cần chỉnh.", situation: "Nhận một hướng dẫn bằng lời", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["l04-lijie", "理解", "lǐjiě", "hiểu", "我的理解是今天完成。", "Theo cách tôi hiểu là hoàn thành hôm nay."],
      ["l04-yisi", "意思", "yìsi", "ý, ý nghĩa", "您的意思是先检查，对吗？", "Ý anh/chị là kiểm tra trước, đúng không?"],
      ["l04-queren", "确认", "quèrèn", "xác nhận", "我想确认一下要求。", "Tôi muốn xác nhận lại yêu cầu."],
      ["l04-duima", "对吗", "duì ma", "đúng không", "明天上午提交，对吗？", "Nộp sáng mai, đúng không?"],
      ["l04-yibian", "也就是说", "yě jiùshì shuō", "nói cách khác", "也就是说，只需要改这一页。", "Nói cách khác, chỉ cần sửa trang này."],
      ["l04-wujie", "误解", "wùjiě", "hiểu lầm", "我们及时发现了误解。", "Chúng tôi đã phát hiện hiểu lầm kịp thời."],
    ],
    request: ["对方说了三个步骤，我怕自己理解错。", "Duìfāng shuō le sān ge bùzhòu, wǒ pà zìjǐ lǐjiě cuò.", "Đối phương nêu ba bước, tôi sợ mình hiểu sai."],
    response: ["我会按顺序复述，并请对方确认。", "Wǒ huì àn shùnxù fùshù, bìng qǐng duìfāng quèrèn.", "Tôi sẽ nhắc lại theo thứ tự và nhờ đối phương xác nhận."],
    notes: [note("Nói lại ý hiểu", "我的理解是……，对吗？", "Mẫu này giúp phát hiện sai lệch trước khi bắt đầu làm."), note("Tóm tắt bằng cách khác", "也就是说……", "Dùng khi muốn diễn đạt kết luận bằng lời ngắn và rõ hơn.")],
  },
  {
    moduleSlug: "giao-tiep-hang-ngay", slug: "hoi-thoi-gian-dia-diem-va-cach-lien-he", title: "Hỏi thời gian, địa điểm và cách liên hệ",
    summary: "Xác định lúc nào, ở đâu, gặp ai và dùng kênh nào cho một hoạt động công việc.", situation: "Chuẩn bị đến một điểm làm việc mới", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l05-shijian", "时间", "shíjiān", "thời gian", "请确认集合时间。", "Hãy xác nhận thời gian tập trung."],
      ["l05-didian", "地点", "dìdiǎn", "địa điểm", "培训地点在二楼。", "Địa điểm đào tạo ở tầng hai."],
      ["l05-jihe", "集合", "jíhé", "tập trung", "我们八点在门口集合。", "Chúng ta tập trung ở cửa lúc 8 giờ."],
      ["l05-lianxiren", "联系人", "liánxìrén", "người liên hệ", "现场联系人是王主管。", "Người liên hệ tại hiện trường là quản lý Vương."],
      ["l05-lianxifangshi", "联系方式", "liánxì fāngshì", "cách liên hệ", "请留下您的联系方式。", "Hãy để lại cách liên hệ của anh/chị."],
      ["l05-daoda", "到达", "dàodá", "đến nơi", "我预计七点五十分到达。", "Tôi dự kiến đến lúc 7 giờ 50."],
    ],
    request: ["通知里没有写集合地点和联系人。", "Tōngzhī lǐ méiyǒu xiě jíhé dìdiǎn hé liánxìrén.", "Thông báo chưa ghi địa điểm tập trung và người liên hệ."],
    response: ["我会一次问清时间、地点和联系方式。", "Wǒ huì yí cì wèn qīng shíjiān, dìdiǎn hé liánxì fāngshì.", "Tôi sẽ hỏi rõ thời gian, địa điểm và cách liên hệ trong một lượt."],
    notes: [note("Hỏi theo cụm", "几点、在哪里、联系谁？", "Ba câu hỏi ngắn giúp tránh sót thông tin thực hiện."), note("Báo giờ đến dự kiến", "预计……到达", "预计 cho biết đây là dự kiến, không phải xác nhận đã đến.")],
  },
  {
    moduleSlug: "giao-tiep-hang-ngay", slug: "kiem-tra-giao-tiep-hang-ngay", title: "Kiểm tra: Giao tiếp hằng ngày",
    summary: "Ôn chào hỏi, giới thiệu, nghe lại, xác nhận và hỏi thông tin cơ bản.", situation: "Đánh giá cuối module 1", estimatedMinutes: 14, isFree: true,
    vocabulary: [
      ["l06-rili", "礼貌", "lǐmào", "lịch sự", "礼貌表达有助于合作。", "Diễn đạt lịch sự giúp hợp tác."],
      ["l06-yuqiyu", "语气", "yǔqì", "ngữ điệu, sắc thái", "请注意说话的语气。", "Hãy chú ý sắc thái khi nói."],
      ["l06-chongfu", "重复", "chóngfù", "lặp lại", "我重复一下关键信息。", "Tôi xin lặp lại thông tin chính."],
      ["l06-guanjiandian", "关键点", "guānjiàn diǎn", "điểm chính", "请记住三个关键点。", "Hãy nhớ ba điểm chính."],
      ["l06-zhengque", "正确", "zhèngquè", "đúng, chính xác", "请确认信息是否正确。", "Hãy xác nhận thông tin có chính xác không."],
      ["l06-goutong", "沟通", "gōutōng", "giao tiếp, trao đổi", "清楚沟通可以减少错误。", "Trao đổi rõ giúp giảm sai sót."],
    ],
    request: ["我想检查自己能否听懂并确认基本信息。", "Wǒ xiǎng jiǎnchá zìjǐ néngfǒu tīngdǒng bìng quèrèn jīběn xìnxī.", "Tôi muốn kiểm tra khả năng nghe hiểu và xác nhận thông tin cơ bản."],
    response: ["我会抓住关键点，用礼貌语气重复确认。", "Wǒ huì zhuāzhù guānjiàn diǎn, yòng lǐmào yǔqì chóngfù quèrèn.", "Tôi sẽ nắm điểm chính và dùng giọng lịch sự để nhắc lại xác nhận."],
    notes: [note("Tập trung điểm chính", "时间 + 地点 + 人物 + 动作", "Bốn nhóm thông tin thường quyết định một việc có được thực hiện đúng hay không."), note("Lịch sự nhưng rõ", "不好意思 + 具体请求", "Lời mở mềm nên đi cùng yêu cầu cụ thể, không nói vòng quá dài.")], challenge: dailyChallenge,
  },
  {
    moduleSlug: "hieu-viec-va-phoi-hop", slug: "tiep-nhan-va-nhac-lai-nhiem-vu", title: "Tiếp nhận và nhắc lại nhiệm vụ",
    summary: "Ghi nhận nhiệm vụ, nhắc lại đầu ra và xác định bước đầu tiên cần làm.", situation: "Quản lý giao một việc mới", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l07-renwu", "任务", "rènwu", "nhiệm vụ", "我收到了新的任务。", "Tôi đã nhận nhiệm vụ mới."],
      ["l07-anpai", "安排", "ānpái", "sắp xếp, phân công", "谢谢您的安排。", "Cảm ơn sự phân công của anh/chị."],
      ["l07-jieshou", "接收", "jiēshōu", "tiếp nhận", "我已经接收相关资料。", "Tôi đã tiếp nhận tài liệu liên quan."],
      ["l07-wancheng", "完成", "wánchéng", "hoàn thành", "我会按要求完成。", "Tôi sẽ hoàn thành theo yêu cầu."],
      ["l07-buzhou", "步骤", "bùzhòu", "bước", "第一步是核对数据。", "Bước đầu tiên là đối chiếu dữ liệu."],
      ["l07-fushu", "复述", "fùshù", "nhắc lại bằng lời mình", "请复述一下任务内容。", "Hãy nhắc lại nội dung nhiệm vụ."],
    ],
    request: ["主管刚刚安排我整理一份清单。", "Zhǔguǎn gānggāng ānpái wǒ zhěnglǐ yí fèn qīngdān.", "Quản lý vừa giao tôi chuẩn bị một danh sách."],
    response: ["我会复述任务，并确认第一步要做什么。", "Wǒ huì fùshù rènwu, bìng quèrèn dì yī bù yào zuò shénme.", "Tôi sẽ nhắc lại nhiệm vụ và xác nhận bước đầu tiên."],
    notes: [note("Ghi nhận đã nhận việc", "收到，我先……", "收到 xác nhận đã tiếp nhận; vế sau cho thấy hành động bắt đầu."), note("Không chỉ nói đã hiểu", "复述任务内容", "Nhắc lại đầu ra cụ thể đáng tin hơn câu 我明白了 đơn lẻ.")],
  },
  {
    moduleSlug: "hieu-viec-va-phoi-hop", slug: "hoi-muc-tieu-va-ket-qua-mong-doi", title: "Hỏi mục tiêu và kết quả mong đợi",
    summary: "Làm rõ vì sao cần làm, người dùng kết quả và hình thức đầu ra mong muốn.", situation: "Nhiệm vụ được mô tả còn chung chung", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l08-mubiao", "目标", "mùbiāo", "mục tiêu", "这个任务的目标是什么？", "Mục tiêu nhiệm vụ này là gì?"],
      ["l08-jieguo", "结果", "jiéguǒ", "kết quả", "最终需要什么结果？", "Cuối cùng cần kết quả gì?"],
      ["l08-yongtu", "用途", "yòngtú", "mục đích sử dụng", "这份材料的用途是什么？", "Tài liệu này dùng vào mục đích gì?"],
      ["l08-shuchu", "输出", "shūchū", "đầu ra", "请确认输出格式。", "Hãy xác nhận định dạng đầu ra."],
      ["l08-xingshi", "形式", "xíngshì", "hình thức", "结果要以表格形式提交。", "Kết quả cần nộp dưới dạng bảng."],
      ["l08-shiyongzhe", "使用者", "shǐyòngzhě", "người sử dụng", "谁是这份报告的主要使用者？", "Ai là người dùng chính của báo cáo này?"],
    ],
    request: ["对方只说“准备一下资料”，没有说明用途。", "Duìfāng zhǐ shuō 'zhǔnbèi yíxià zīliào', méiyǒu shuōmíng yòngtú.", "Đối phương chỉ nói ‘chuẩn bị tài liệu’ mà chưa nêu mục đích."],
    response: ["我会询问目标、使用者和期望的输出形式。", "Wǒ huì xúnwèn mùbiāo, shǐyòngzhě hé qīwàng de shūchū xíngshì.", "Tôi sẽ hỏi mục tiêu, người sử dụng và dạng đầu ra mong muốn."],
    notes: [note("Hỏi mục tiêu", "这个任务是为了……吗？", "为了 dẫn vào mục đích, giúp xác nhận bối cảnh sử dụng kết quả."), note("Đầu ra có hình thức", "以……形式提交", "Dùng để xác định nộp dạng bảng, văn bản, ảnh hay cập nhật hệ thống.")],
  },
  {
    moduleSlug: "hieu-viec-va-phoi-hop", slug: "lam-ro-pham-vi-va-ngoai-le", title: "Làm rõ phạm vi và ngoại lệ",
    summary: "Xác định phần nào cần làm, phần nào không và trường hợp đặc biệt cần báo lại.", situation: "Công việc có nhiều nhóm dữ liệu", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l09-fanwei", "范围", "fànwéi", "phạm vi", "请确认处理范围。", "Hãy xác nhận phạm vi xử lý."],
      ["l09-baokuo", "包括", "bāokuò", "bao gồm", "这个范围包括两个部门。", "Phạm vi này gồm hai bộ phận."],
      ["l09-bubaokuo", "不包括", "bù bāokuò", "không bao gồm", "历史数据不包括在内。", "Dữ liệu lịch sử không nằm trong phạm vi."],
      ["l09-waili", "例外", "lìwài", "ngoại lệ", "特殊情况可以作为例外。", "Trường hợp đặc biệt có thể là ngoại lệ."],
      ["l09-bufen", "部分", "bùfen", "phần", "我先完成最重要的部分。", "Tôi sẽ hoàn thành phần quan trọng nhất trước."],
      ["l09-bianjie", "边界", "biānjiè", "ranh giới", "双方需要明确责任边界。", "Hai bên cần làm rõ ranh giới trách nhiệm."],
    ],
    request: ["我不确定是否要处理去年的数据。", "Wǒ bù quèdìng shìfǒu yào chǔlǐ qùnián de shùjù.", "Tôi chưa chắc có cần xử lý dữ liệu năm ngoái không."],
    response: ["我会确认范围包括什么，以及哪些情况例外。", "Wǒ huì quèrèn fànwéi bāokuò shénme, yǐjí nǎxiē qíngkuàng lìwài.", "Tôi sẽ xác nhận phạm vi gồm gì và trường hợp nào ngoại lệ."],
    notes: [note("Bao gồm và không bao gồm", "包括……，不包括……", "Nêu hai phía giúp ranh giới nhiệm vụ rõ hơn."), note("Ngoại lệ cần người xác nhận", "如果遇到……，请先确认", "Không tự mở rộng quy tắc từ một tình huống chưa được duyệt.")],
  },
  {
    moduleSlug: "hieu-viec-va-phoi-hop", slug: "xac-nhan-muc-do-uu-tien", title: "Xác nhận mức độ ưu tiên",
    summary: "So sánh mức gấp, mức quan trọng và ảnh hưởng để chốt thứ tự xử lý.", situation: "Hai yêu cầu đến cùng thời điểm", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l10-youxian", "优先", "yōuxiān", "ưu tiên", "请问哪个任务优先？", "Xin hỏi nhiệm vụ nào được ưu tiên?"],
      ["l10-jinji", "紧急", "jǐnjí", "khẩn cấp", "这是一个紧急问题。", "Đây là vấn đề khẩn cấp."],
      ["l10-zhongyao", "重要", "zhòngyào", "quan trọng", "这个客户非常重要。", "Khách hàng này rất quan trọng."],
      ["l10-shunxu", "顺序", "shùnxù", "thứ tự", "我们需要调整处理顺序。", "Chúng ta cần điều chỉnh thứ tự xử lý."],
      ["l10-chongtu", "冲突", "chōngtū", "xung đột", "两个任务的时间发生冲突。", "Thời gian hai nhiệm vụ bị xung đột."],
      ["l10-yingxiang", "影响", "yǐngxiǎng", "ảnh hưởng", "调整顺序会影响原计划。", "Điều chỉnh thứ tự sẽ ảnh hưởng kế hoạch cũ."],
    ],
    request: ["两个任务都标记为紧急，而且截止时间相同。", "Liǎng ge rènwu dōu biāojì wéi jǐnjí, érqiě jiézhǐ shíjiān xiāngtóng.", "Hai nhiệm vụ đều được đánh dấu khẩn và có cùng hạn."],
    response: ["我会说明冲突和影响，请负责人确认优先顺序。", "Wǒ huì shuōmíng chōngtū hé yǐngxiǎng, qǐng fùzérén quèrèn yōuxiān shùnxù.", "Tôi sẽ nêu xung đột, ảnh hưởng và nhờ người phụ trách xác nhận thứ tự ưu tiên."],
    notes: [note("Khẩn khác quan trọng", "紧急 / 重要", "紧急 nói về thời gian; 重要 nói về mức ảnh hưởng hoặc giá trị."), note("Báo hệ quả khi đổi ưu tiên", "这会影响……", "Giúp người quyết định hiểu phần việc nào sẽ bị lùi.")],
  },
  {
    moduleSlug: "hieu-viec-va-phoi-hop", slug: "phan-cong-va-xac-nhan-nguoi-phu-trach", title: "Phân công và xác nhận người phụ trách",
    summary: "Phân biệt người chịu trách nhiệm chính, người phối hợp và điểm bàn giao giữa các bên.", situation: "Một nhiệm vụ cần nhiều nhóm cùng làm", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l11-fuzeren", "负责人", "fùzérén", "người phụ trách", "这个任务的负责人是谁？", "Ai là người phụ trách nhiệm vụ này?"],
      ["l11-peihe", "配合", "pèihé", "phối hợp", "我们会配合提供数据。", "Chúng tôi sẽ phối hợp cung cấp dữ liệu."],
      ["l11-fengong", "分工", "fēngōng", "phân công", "请确认具体分工。", "Hãy xác nhận phân công cụ thể."],
      ["l11-zhichi", "支持", "zhīchí", "hỗ trợ", "技术团队会提供支持。", "Đội kỹ thuật sẽ hỗ trợ."],
      ["l11-jiekou", "对接人", "duìjiērén", "đầu mối phối hợp", "每个部门指定一名对接人。", "Mỗi bộ phận chỉ định một đầu mối."],
      ["l11-jiaojie", "交接点", "jiāojiē diǎn", "điểm bàn giao", "我们要明确流程的交接点。", "Chúng ta cần làm rõ điểm bàn giao của quy trình."],
    ],
    request: ["三个部门都参与，但还没有明确谁负责。", "Sān ge bùmén dōu cānyù, dàn hái méiyǒu míngquè shuí fùzé.", "Ba bộ phận cùng tham gia nhưng chưa rõ ai chịu trách nhiệm."],
    response: ["我会确认负责人、对接人和每个交接点。", "Wǒ huì quèrèn fùzérén, duìjiērén hé měi ge jiāojiē diǎn.", "Tôi sẽ xác nhận người phụ trách, đầu mối và từng điểm bàn giao."],
    notes: [note("Chịu trách nhiệm và hỗ trợ", "A 负责……，B 配合……", "Mẫu này phân biệt vai trò chính và vai trò hỗ trợ."), note("Một đầu mối rõ", "指定对接人", "Đầu mối không thay thế trách nhiệm của nhóm nhưng giúp luồng thông tin nhất quán.")],
  },
  {
    moduleSlug: "hieu-viec-va-phoi-hop", slug: "kiem-tra-hieu-viec-va-phoi-hop", title: "Kiểm tra: Hiểu việc & phối hợp",
    summary: "Ôn mục tiêu, phạm vi, ưu tiên, phân công, thời hạn và tiêu chuẩn hoàn thành.", situation: "Đánh giá cuối module 2", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l12-jiezhiriqi", "截止日期", "jiézhǐ rìqī", "hạn chót", "截止日期是本周五。", "Hạn chót là thứ Sáu tuần này."],
      ["l12-zuiwan", "最晚", "zuìwǎn", "muộn nhất", "最晚下午五点提交。", "Nộp muộn nhất lúc 5 giờ chiều."],
      ["l12-biaozhun", "标准", "biāozhǔn", "tiêu chuẩn", "完成标准已经确认。", "Tiêu chuẩn hoàn thành đã được xác nhận."],
      ["l12-yaoqiu", "要求", "yāoqiú", "yêu cầu", "请按照最新要求处理。", "Hãy xử lý theo yêu cầu mới nhất."],
      ["l12-yanqi", "延期", "yánqī", "gia hạn, trì hoãn", "如果需要延期，请提前说明。", "Nếu cần gia hạn, hãy báo trước."],
      ["l12-shumian", "书面确认", "shūmiàn quèrèn", "xác nhận bằng văn bản", "重要变更需要书面确认。", "Thay đổi quan trọng cần xác nhận bằng văn bản."],
    ],
    request: ["我们已经谈了任务，但还没有确认期限和标准。", "Wǒmen yǐjīng tán le rènwu, dàn hái méiyǒu quèrèn qīxiàn hé biāozhǔn.", "Chúng ta đã trao đổi nhiệm vụ nhưng chưa xác nhận thời hạn và tiêu chuẩn."],
    response: ["我会书面列出目标、分工、截止日期和完成标准。", "Wǒ huì shūmiàn lièchū mùbiāo, fēngōng, jiézhǐ rìqī hé wánchéng biāozhǔn.", "Tôi sẽ liệt kê bằng văn bản mục tiêu, phân công, hạn và tiêu chuẩn hoàn thành."],
    notes: [note("Hạn cuối cụ thể", "最晚 + 时间 + 完成", "最晚 nêu mốc cuối cùng có thể chấp nhận."), note("Thay đổi cần xác nhận", "请书面确认变更", "Các thay đổi quan trọng nên được lưu theo kênh và quy trình của tổ chức.")], challenge: coordinationChallenge,
  },
  {
    moduleSlug: "bao-cao-va-xu-ly-van-de", slug: "cap-nhat-tien-do-va-phan-tram-hoan-thanh", title: "Cập nhật tiến độ và phần trăm hoàn thành",
    summary: "Báo phần đã xong, phần đang làm, tỷ lệ hoàn thành và mốc cập nhật tiếp theo.", situation: "Quản lý hỏi trạng thái giữa ca", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l13-jindu", "进度", "jìndù", "tiến độ", "我来汇报一下当前进度。", "Tôi xin báo tiến độ hiện tại."],
      ["l13-muqian", "目前", "mùqián", "hiện tại", "目前已经完成一半。", "Hiện đã hoàn thành một nửa."],
      ["l13-wanchenglv", "完成率", "wánchénglǜ", "tỷ lệ hoàn thành", "完成率大约是百分之七十。", "Tỷ lệ hoàn thành khoảng 70%."],
      ["l13-yijing", "已经", "yǐjīng", "đã", "关键数据已经核对完了。", "Dữ liệu chính đã đối chiếu xong."],
      ["l13-zhengzai", "正在", "zhèngzài", "đang", "团队正在整理剩余部分。", "Nhóm đang xử lý phần còn lại."],
      ["l13-xiaci", "下次更新", "xià cì gēngxīn", "lần cập nhật tiếp theo", "下次更新时间是下午三点。", "Lần cập nhật tiếp theo là 3 giờ chiều."],
    ],
    request: ["主管想知道任务做到什么程度了。", "Zhǔguǎn xiǎng zhīdào rènwu zuò dào shénme chéngdù le.", "Quản lý muốn biết nhiệm vụ đã làm đến mức nào."],
    response: ["我会说已完成、正在处理和下次更新时间。", "Wǒ huì shuō yǐ wánchéng, zhèngzài chǔlǐ hé xià cì gēngxīn shíjiān.", "Tôi sẽ nêu phần đã xong, đang xử lý và mốc cập nhật tiếp theo."],
    notes: [note("Ba trạng thái", "已经…… / 正在…… / 接下来……", "Ba mẫu tạo một cập nhật có quá khứ, hiện tại và bước tiếp theo."), note("Phần trăm cần căn cứ", "完成率大约是……", "Dùng 大约 khi tỷ lệ là ước tính; dùng số chính xác khi có hệ thống ghi nhận.")],
  },
  {
    moduleSlug: "bao-cao-va-xu-ly-van-de", slug: "bao-tro-ngai-va-anh-huong", title: "Báo trở ngại và ảnh hưởng",
    summary: "Nêu điều đang chặn công việc, phần bị ảnh hưởng và mức độ khẩn cần xử lý.", situation: "Thiếu dữ liệu đầu vào", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l14-zuyi", "阻碍", "zǔ'ài", "trở ngại", "当前有一个主要阻碍。", "Hiện có một trở ngại chính."],
      ["l14-kunan", "困难", "kùnnan", "khó khăn", "我们遇到了一些技术困难。", "Chúng tôi gặp một số khó khăn kỹ thuật."],
      ["l14-queshao", "缺少", "quēshǎo", "thiếu", "目前缺少客户确认。", "Hiện còn thiếu xác nhận của khách."],
      ["l14-daozhi", "导致", "dǎozhì", "dẫn đến", "系统问题导致进度延迟。", "Vấn đề hệ thống dẫn đến chậm tiến độ."],
      ["l14-shouyingxiang", "受影响", "shòu yǐngxiǎng", "bị ảnh hưởng", "后续测试会受到影响。", "Kiểm thử tiếp theo sẽ bị ảnh hưởng."],
      ["l14-fengxian", "风险", "fēngxiǎn", "rủi ro", "如果不处理，会有延期风险。", "Nếu không xử lý sẽ có rủi ro trễ."],
    ],
    request: ["上游数据还没到，后面的检查无法开始。", "Shàngyóu shùjù hái méi dào, hòumiàn de jiǎnchá wúfǎ kāishǐ.", "Dữ liệu đầu vào chưa đến nên bước kiểm tra sau chưa thể bắt đầu."],
    response: ["我会说明阻碍、受影响的环节和延期风险。", "Wǒ huì shuōmíng zǔ'ài, shòu yǐngxiǎng de huánjié hé yánqī fēngxiǎn.", "Tôi sẽ nêu trở ngại, khâu bị ảnh hưởng và rủi ro trễ."],
    notes: [note("Nêu quan hệ nguyên nhân", "因为……，导致……", "Cấu trúc nối nguyên nhân đã biết với ảnh hưởng quan sát được."), note("Không suy đoán thành sự thật", "可能影响……", "Dùng 可能 khi ảnh hưởng chưa chắc chắn hoặc chưa được xác minh.")],
  },
  {
    moduleSlug: "bao-cao-va-xu-ly-van-de", slug: "xin-ho-tro-va-chuyen-cap", title: "Xin hỗ trợ và chuyển cấp",
    summary: "Nói rõ đã thử gì, cần ai hỗ trợ và khi nào phải chuyển người có thẩm quyền.", situation: "Vấn đề vượt phạm vi xử lý", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l15-bangzhu", "帮助", "bāngzhù", "giúp đỡ", "我需要您的帮助。", "Tôi cần sự giúp đỡ của anh/chị."],
      ["l15-xiezhu", "协助", "xiézhù", "hỗ trợ, phối hợp", "请技术人员协助检查。", "Hãy nhờ kỹ thuật hỗ trợ kiểm tra."],
      ["l15-quanxian", "权限", "quánxiàn", "quyền hạn", "我没有修改权限。", "Tôi không có quyền chỉnh sửa."],
      ["l15-shengji", "升级处理", "shēngjí chǔlǐ", "chuyển cấp xử lý", "这个问题需要升级处理。", "Vấn đề này cần chuyển cấp xử lý."],
      ["l15-jishu", "技术支持", "jìshù zhīchí", "hỗ trợ kỹ thuật", "我已经联系技术支持。", "Tôi đã liên hệ hỗ trợ kỹ thuật."],
      ["l15-pizhun", "批准", "pīzhǔn", "phê duyệt", "这个变更需要经理批准。", "Thay đổi này cần quản lý phê duyệt."],
    ],
    request: ["我已经检查过，但没有权限修改系统。", "Wǒ yǐjīng jiǎnchá guo, dàn méiyǒu quánxiàn xiūgǎi xìtǒng.", "Tôi đã kiểm tra nhưng không có quyền sửa hệ thống."],
    response: ["我会说明已完成的检查，并请有权限的人协助。", "Wǒ huì shuōmíng yǐ wánchéng de jiǎnchá, bìng qǐng yǒu quánxiàn de rén xiézhù.", "Tôi sẽ nêu việc đã kiểm tra và nhờ người có quyền hỗ trợ."],
    notes: [note("Xin hỗ trợ có bối cảnh", "我已经……，现在需要……", "Nêu phần đã thử giúp người hỗ trợ không phải lặp lại từ đầu."), note("Chuyển đúng thẩm quyền", "需要……批准 / 确认", "Không tự xử lý các quyết định an toàn, tài chính, pháp lý hoặc hệ thống vượt quyền.")],
  },
  {
    moduleSlug: "bao-cao-va-xu-ly-van-de", slug: "nhan-loi-va-sua-sai", title: "Nhận lỗi và sửa sai",
    summary: "Thừa nhận lỗi cụ thể, nêu ảnh hưởng, hành động khắc phục và cách ngăn lặp lại.", situation: "Gửi nhầm phiên bản tài liệu", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l16-cuowu", "错误", "cuòwù", "lỗi", "我发现了一个数据错误。", "Tôi phát hiện một lỗi dữ liệu."],
      ["l16-facuo", "发错", "fācuò", "gửi nhầm", "很抱歉，我发错文件了。", "Rất xin lỗi, tôi đã gửi nhầm tệp."],
      ["l16-daoqian", "道歉", "dàoqiàn", "xin lỗi", "我为这次失误道歉。", "Tôi xin lỗi về sai sót lần này."],
      ["l16-gengzheng", "更正", "gēngzhèng", "sửa lại", "我现在马上更正。", "Tôi sẽ sửa ngay bây giờ."],
      ["l16-wanhui", "挽回", "wǎnhuí", "khắc phục, cứu vãn", "我们正在采取措施挽回影响。", "Chúng tôi đang có biện pháp khắc phục ảnh hưởng."],
      ["l16-fangzhi", "防止", "fángzhǐ", "ngăn ngừa", "以后会增加检查，防止再次发生。", "Sau này sẽ tăng kiểm tra để ngăn tái diễn."],
    ],
    request: ["我把旧版本的文件发给了客户。", "Wǒ bǎ jiù bǎnběn de wénjiàn fā gěi le kèhù.", "Tôi đã gửi bản tệp cũ cho khách."],
    response: ["我会立即道歉、更正，并说明如何防止再次发生。", "Wǒ huì lìjí dàoqiàn, gēngzhèng, bìng shuōmíng rúhé fángzhǐ zàicì fāshēng.", "Tôi sẽ xin lỗi, sửa ngay và nêu cách ngăn tái diễn."],
    notes: [note("Xin lỗi có hành động", "很抱歉 + 具体错误 + 立即更正", "Một lời xin lỗi công việc cần nói lỗi gì và sẽ sửa thế nào."), note("Không che giấu ảnh hưởng", "已经影响……", "Báo trung thực dữ kiện đã xác minh và chuyển cấp khi lỗi có hậu quả nghiêm trọng.")],
  },
  {
    moduleSlug: "bao-cao-va-xu-ly-van-de", slug: "de-xuat-phuong-an-va-lua-chon-thay-the", title: "Đề xuất phương án và lựa chọn thay thế",
    summary: "Đưa một phương án chính, phương án dự phòng và điều kiện lựa chọn giữa chúng.", situation: "Kế hoạch ban đầu không còn khả thi", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l17-fangan", "方案", "fāng'àn", "phương án", "我有一个新的解决方案。", "Tôi có một phương án giải quyết mới."],
      ["l17-beixuan", "备选方案", "bèixuǎn fāng'àn", "phương án dự phòng", "我们还需要一个备选方案。", "Chúng ta cần thêm một phương án dự phòng."],
      ["l17-jianyi", "建议", "jiànyì", "đề xuất", "我建议先做小范围测试。", "Tôi đề xuất thử ở phạm vi nhỏ trước."],
      ["l17-kexing", "可行", "kěxíng", "khả thi", "这个方案目前比较可行。", "Phương án này hiện khá khả thi."],
      ["l17-youquedian", "优缺点", "yōuquēdiǎn", "ưu và nhược điểm", "我们先比较两个方案的优缺点。", "Chúng ta so sánh ưu nhược hai phương án trước."],
      ["l17-quanji", "权衡", "quánhéng", "cân nhắc đánh đổi", "需要在时间和成本之间权衡。", "Cần cân nhắc giữa thời gian và chi phí."],
    ],
    request: ["原来的计划赶不上截止日期。", "Yuánlái de jìhuà gǎn bu shàng jiézhǐ rìqī.", "Kế hoạch ban đầu không kịp hạn."],
    response: ["我会提出两个方案，并比较时间、成本和风险。", "Wǒ huì tíchū liǎng ge fāng'àn, bìng bǐjiào shíjiān, chéngběn hé fēngxiǎn.", "Tôi sẽ đưa hai phương án và so sánh thời gian, chi phí, rủi ro."],
    notes: [note("Đề xuất có lý do", "我建议……，因为……", "Vế 因为 giúp người nghe đánh giá căn cứ của đề xuất."), note("Không giấu đánh đổi", "优点是……，缺点是……", "Nêu cả hai phía giúp quyết định minh bạch hơn.")],
  },
  {
    moduleSlug: "bao-cao-va-xu-ly-van-de", slug: "kiem-tra-bao-cao-va-xu-ly-van-de", title: "Kiểm tra: Báo cáo & xử lý vấn đề",
    summary: "Ôn tiến độ, trở ngại, xin hỗ trợ, nhận lỗi và đề xuất phương án.", situation: "Đánh giá cuối module 3", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l18-huibao", "汇报", "huìbào", "báo cáo", "我向主管汇报最新情况。", "Tôi báo tình hình mới nhất với quản lý."],
      ["l18-xianzhuang", "现状", "xiànzhuàng", "hiện trạng", "请先说明当前现状。", "Hãy nêu hiện trạng trước."],
      ["l18-yuanyin", "原因", "yuányīn", "nguyên nhân", "团队正在调查原因。", "Nhóm đang điều tra nguyên nhân."],
      ["l18-xingdong", "行动项", "xíngdòng xiàng", "hạng mục hành động", "会议后有三个行动项。", "Sau cuộc họp có ba hạng mục hành động."],
      ["l18-yufang", "预防措施", "yùfáng cuòshī", "biện pháp phòng ngừa", "我们需要制定预防措施。", "Chúng ta cần xây biện pháp phòng ngừa."],
      ["l18-bihuan", "闭环", "bìhuán", "khép kín xử lý", "问题处理后要形成闭环。", "Sau xử lý vấn đề cần khép kín quy trình."],
    ],
    request: ["负责人需要一份完整的问题汇报。", "Fùzérén xūyào yí fèn wánzhěng de wèntí huìbào.", "Người phụ trách cần một báo cáo vấn đề đầy đủ."],
    response: ["我会按现状、影响、行动和预防措施来汇报。", "Wǒ huì àn xiànzhuàng, yǐngxiǎng, xíngdòng hé yùfáng cuòshī lái huìbào.", "Tôi sẽ báo theo hiện trạng, ảnh hưởng, hành động và phòng ngừa."],
    notes: [note("Cấu trúc báo vấn đề", "现状 + 影响 + 行动 + 下一步", "Bốn phần giữ báo cáo ngắn nhưng đủ để quyết định."), note("Khép kín không chỉ là sửa xong", "处理结果 + 预防措施", "Cần ghi kết quả và cách giảm khả năng lặp lại.")], challenge: issueChallenge,
  },
  {
    moduleSlug: "giao-tiep-da-kenh", slug: "nhan-tin-cong-viec-ro-rang", title: "Nhắn tin công việc rõ ràng",
    summary: "Viết tin nhắn có bối cảnh, yêu cầu, thời hạn và cách phản hồi mong muốn.", situation: "Gửi yêu cầu trong nhóm chat", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l19-xiaoxi", "消息", "xiāoxi", "tin nhắn", "我刚看到您的消息。", "Tôi vừa thấy tin nhắn của anh/chị."],
      ["l19-qunliao", "群聊", "qúnliáo", "nhóm chat", "请不要在群聊里发敏感信息。", "Không gửi thông tin nhạy cảm trong nhóm chat."],
      ["l19-beijing", "背景", "bèijǐng", "bối cảnh", "我先简单说明一下背景。", "Tôi xin nói ngắn về bối cảnh trước."],
      ["l19-qingqiu", "请求", "qǐngqiú", "yêu cầu, đề nghị", "请明确您的具体请求。", "Hãy nêu rõ đề nghị cụ thể."],
      ["l19-huifu", "回复", "huífù", "phản hồi", "请在今天下班前回复。", "Hãy phản hồi trước khi hết giờ hôm nay."],
      ["l19-aite", "提醒相关人", "tíxǐng xiāngguān rén", "nhắc đúng người liên quan", "请只提醒需要处理的人。", "Chỉ nhắc những người cần xử lý."],
    ],
    request: ["我要在群里请仓库今天确认数量。", "Wǒ yào zài qún lǐ qǐng cāngkù jīntiān quèrèn shùliàng.", "Tôi cần nhờ kho xác nhận số lượng hôm nay trong nhóm."],
    response: ["我会写清背景、数量范围和回复时间。", "Wǒ huì xiě qīng bèijǐng, shùliàng fànwéi hé huífù shíjiān.", "Tôi sẽ ghi rõ bối cảnh, phạm vi số lượng và thời gian phản hồi."],
    notes: [note("Tin nhắn ba phần", "背景 + 请求 + 截止时间", "Một tin ngắn vẫn cần đủ bối cảnh, hành động và mốc."), note("Không làm ồn cả nhóm", "提醒相关人", "Chỉ nhắc người cần tham gia và dùng kênh riêng cho dữ liệu nhạy cảm.")],
  },
  {
    moduleSlug: "giao-tiep-da-kenh", slug: "goi-dien-va-hop-truc-tuyen", title: "Gọi điện và họp trực tuyến",
    summary: "Mở đầu cuộc gọi, kiểm tra âm thanh, giữ lượt nói và chốt việc trước khi kết thúc.", situation: "Gọi nhanh cho một nhóm ở xa", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l20-dianhua", "电话", "diànhuà", "điện thoại", "我现在方便接电话。", "Bây giờ tôi tiện nghe điện thoại."],
      ["l20-shipinhuiyi", "视频会议", "shìpín huìyì", "họp trực tuyến", "视频会议九点开始。", "Họp trực tuyến bắt đầu lúc 9 giờ."],
      ["l20-maikefeng", "麦克风", "màikèfēng", "micro", "您的麦克风没有打开。", "Micro của anh/chị chưa bật."],
      ["l20-duanxian", "断线", "duànxiàn", "mất kết nối", "刚才网络断线了。", "Vừa rồi mạng bị mất kết nối."],
      ["l20-fangbian", "方便", "fāngbiàn", "thuận tiện", "现在方便说两分钟吗？", "Bây giờ có tiện nói hai phút không?"],
      ["l20-guaduan", "挂断", "guàduàn", "kết thúc cuộc gọi", "确认完行动项后再挂断。", "Xác nhận hành động rồi mới kết thúc cuộc gọi."],
    ],
    request: ["我需要临时打电话确认一个紧急变更。", "Wǒ xūyào línshí dǎ diànhuà quèrèn yí ge jǐnjí biàngēng.", "Tôi cần gọi đột xuất để xác nhận một thay đổi khẩn."],
    response: ["我会先问是否方便，再说明身份和来电目的。", "Wǒ huì xiān wèn shìfǒu fāngbiàn, zài shuōmíng shēnfèn hé láidiàn mùdì.", "Tôi sẽ hỏi có tiện không rồi nêu danh tính và mục đích gọi."],
    notes: [note("Xin phép trước cuộc gọi", "现在方便说……分钟吗？", "Nêu thời lượng giúp người nghe quyết định có thể trao đổi ngay không."), note("Kết thúc có xác nhận", "挂断前确认……", "Chốt hành động và mốc phản hồi trước khi kết thúc.")],
  },
  {
    moduleSlug: "giao-tiep-da-kenh", slug: "phat-bieu-va-bo-sung-trong-cuoc-hop", title: "Phát biểu và bổ sung trong cuộc họp",
    summary: "Xin lượt nói, trình bày một ý, bổ sung dữ kiện và đưa cuộc thảo luận trở lại trọng tâm.", situation: "Tham gia cuộc họp có nhiều bộ phận", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l21-fayan", "发言", "fāyán", "phát biểu", "我想就这个问题发言。", "Tôi muốn phát biểu về vấn đề này."],
      ["l21-buchong", "补充", "bǔchōng", "bổ sung", "我补充一点数据。", "Tôi bổ sung một chút dữ liệu."],
      ["l21-guandian", "观点", "guāndiǎn", "quan điểm", "我的观点和他不太一样。", "Quan điểm của tôi hơi khác anh ấy."],
      ["l21-zhongdian", "重点", "zhòngdiǎn", "trọng tâm", "我们回到今天的重点。", "Chúng ta quay lại trọng tâm hôm nay."],
      ["l21-daduan", "打断", "dǎduàn", "ngắt lời", "不好意思打断一下。", "Xin lỗi cho tôi ngắt lời một chút."],
      ["l21-zongjie", "总结", "zǒngjié", "tổng kết", "最后我简单总结一下。", "Cuối cùng tôi xin tổng kết ngắn."],
    ],
    request: ["讨论快结束了，但有一条关键数据还没提到。", "Tǎolùn kuài jiéshù le, dàn yǒu yì tiáo guānjiàn shùjù hái méi tídào.", "Thảo luận sắp kết thúc nhưng còn một dữ liệu quan trọng chưa được nêu."],
    response: ["我会礼貌请求补充，并直接说明数据和影响。", "Wǒ huì lǐmào qǐngqiú bǔchōng, bìng zhíjiē shuōmíng shùjù hé yǐngxiǎng.", "Tôi sẽ lịch sự xin bổ sung và nêu thẳng dữ liệu cùng ảnh hưởng."],
    notes: [note("Xin bổ sung", "我补充一点……", "Mẫu ngắn báo cho người nghe biết bạn thêm dữ kiện, không chuyển chủ đề."), note("Ngắt lời chỉ khi cần", "不好意思打断一下", "Nêu ngay lý do khẩn hoặc điểm cần sửa sau lời mở này.")],
  },
  {
    moduleSlug: "giao-tiep-da-kenh", slug: "phan-hoi-va-bay-to-khac-biet", title: "Phản hồi và bày tỏ khác biệt",
    summary: "Ghi nhận góc nhìn, nêu điểm đồng thuận và trình bày ý khác dựa trên dữ kiện.", situation: "Không đồng ý với phương án của đồng nghiệp", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l22-tongyi", "同意", "tóngyì", "đồng ý", "我同意这个方向。", "Tôi đồng ý với hướng này."],
      ["l22-baoliu", "保留意见", "bǎoliú yìjiàn", "bảo lưu ý kiến", "我对时间安排保留意见。", "Tôi bảo lưu ý kiến về lịch."],
      ["l22-buguo", "不过", "búguò", "tuy nhiên", "我理解您的考虑，不过还有一个风险。", "Tôi hiểu cân nhắc của anh/chị, tuy nhiên còn một rủi ro."],
      ["l22-kanfa", "看法", "kànfǎ", "cách nhìn, ý kiến", "我有一个不同的看法。", "Tôi có một góc nhìn khác."],
      ["l22-yiju", "依据", "yījù", "căn cứ", "这个判断的依据是什么？", "Căn cứ của nhận định này là gì?"],
      ["l22-gongshi", "共识", "gòngshí", "đồng thuận", "双方需要先找到共识。", "Hai bên cần tìm điểm đồng thuận trước."],
    ],
    request: ["我不认同直接上线，但不想让讨论变成争论。", "Wǒ bù rèntóng zhíjiē shàngxiàn, dàn bù xiǎng ràng tǎolùn biàn chéng zhēnglùn.", "Tôi không đồng ý đưa lên ngay nhưng không muốn trao đổi thành tranh cãi."],
    response: ["我会先说共同点，再用依据说明不同看法。", "Wǒ huì xiān shuō gòngtóng diǎn, zài yòng yījù shuōmíng bùtóng kànfǎ.", "Tôi sẽ nêu điểm chung trước rồi dùng căn cứ giải thích góc nhìn khác."],
    notes: [note("Khác ý không công kích", "我理解……，不过……", "Ghi nhận cân nhắc trước khi nêu rủi ro hoặc đề xuất khác."), note("Hỏi căn cứ", "请问这个判断的依据是？", "Tập trung vào dữ kiện và tiêu chí thay vì đánh giá người nói.")],
  },
  {
    moduleSlug: "giao-tiep-da-kenh", slug: "ban-giao-va-theo-doi-sau-trao-doi", title: "Bàn giao và theo dõi sau trao đổi",
    summary: "Chuyển trạng thái, việc còn lại, tài liệu, đầu mối và lịch theo dõi cho người tiếp nhận.", situation: "Đổi ca hoặc nghỉ phép", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l23-jiaoban", "交班", "jiāobān", "bàn giao ca", "下班前需要完成交班。", "Trước khi hết ca cần hoàn tất bàn giao."],
      ["l23-zhuangtai", "状态", "zhuàngtài", "trạng thái", "请说明每项工作的状态。", "Hãy nêu trạng thái từng việc."],
      ["l23-shengyu", "剩余事项", "shèngyú shìxiàng", "việc còn lại", "还有两个剩余事项。", "Còn hai việc chưa hoàn tất."],
      ["l23-fujian", "附件", "fùjiàn", "tệp đính kèm", "相关附件已经放在共享文件夹。", "Tệp liên quan đã để trong thư mục chung."],
      ["l23-gengjin", "跟进", "gēnjìn", "theo dõi tiếp", "请明天继续跟进。", "Hãy tiếp tục theo dõi vào ngày mai."],
      ["l23-jiedian", "跟进节点", "gēnjìn jiédiǎn", "mốc theo dõi", "下一个跟进节点是周三。", "Mốc theo dõi tiếp theo là thứ Tư."],
    ],
    request: ["我明天休假，需要把三项工作交给同事。", "Wǒ míngtiān xiūjià, xūyào bǎ sān xiàng gōngzuò jiāo gěi tóngshì.", "Ngày mai tôi nghỉ, cần bàn giao ba việc cho đồng nghiệp."],
    response: ["我会列出状态、剩余事项、附件和跟进节点。", "Wǒ huì lièchū zhuàngtài, shèngyú shìxiàng, fùjiàn hé gēnjìn jiédiǎn.", "Tôi sẽ liệt kê trạng thái, việc còn lại, tệp và mốc theo dõi."],
    notes: [note("Bàn giao theo cấu trúc", "状态 + 下一步 + 资料 + 联系人", "Bốn mục giúp người nhận tiếp tục mà không tìm lại bối cảnh."), note("Xác nhận đã tiếp nhận", "请确认收到", "Dùng với nội dung quan trọng; không mặc định việc gửi đồng nghĩa người nhận đã đọc.")],
  },
  {
    moduleSlug: "giao-tiep-da-kenh", slug: "kiem-tra-tong-hop-giao-tiep-cong-so-cot-loi", title: "Kiểm tra tổng hợp: Giao tiếp công sở cốt lõi",
    summary: "Tổng hợp nghe hiểu, nhận việc, phối hợp, báo vấn đề và giao tiếp đa kênh.", situation: "Đánh giá cuối lộ trình", estimatedMinutes: 16, isFree: false,
    vocabulary: [
      ["l24-zhiye", "职业表达", "zhíyè biǎodá", "diễn đạt chuyên nghiệp", "职业表达要清楚、准确。", "Diễn đạt chuyên nghiệp cần rõ và chính xác."],
      ["l24-zhunque", "准确", "zhǔnquè", "chính xác", "请准确说明时间和数量。", "Hãy nêu chính xác thời gian và số lượng."],
      ["l24-jianjie", "简洁", "jiǎnjié", "ngắn gọn", "这条消息很简洁。", "Tin nhắn này rất ngắn gọn."],
      ["l24-zunzhong", "尊重", "zūnzhòng", "tôn trọng", "不同意见也要互相尊重。", "Có ý kiến khác vẫn cần tôn trọng nhau."],
      ["l24-baomi", "保密", "bǎomì", "bảo mật", "客户资料需要严格保密。", "Dữ liệu khách hàng cần được bảo mật nghiêm ngặt."],
      ["l24-xinlai", "信赖", "xìnlài", "tin cậy", "清楚沟通有助于建立信赖。", "Trao đổi rõ giúp xây dựng sự tin cậy."],
    ],
    request: ["我要把一个复杂情况讲得清楚、简洁又专业。", "Wǒ yào bǎ yí ge fùzá qíngkuàng jiǎng de qīngchu, jiǎnjié yòu zhuānyè.", "Tôi cần trình bày một tình huống phức tạp rõ, gọn và chuyên nghiệp."],
    response: ["我会先说事实和影响，再说明行动、负责人和时间。", "Wǒ huì xiān shuō shìshí hé yǐngxiǎng, zài shuōmíng xíngdòng, fùzérén hé shíjiān.", "Tôi sẽ nêu sự việc và ảnh hưởng trước, rồi nói hành động, người phụ trách và thời gian."],
    notes: [note("Rõ và gọn", "事实 + 影响 + 行动 + 时间", "Cấu trúc này dùng được trong tin nhắn, cuộc gọi, họp và bàn giao."), note("Chọn đúng kênh", "按照权限和保密要求沟通", "Thông tin nhạy cảm phải đi đúng kênh, quyền truy cập và chính sách tổ chức.")], challenge: finalChallenge,
  },
];

export const coreWorkplaceLessons = coreWorkplaceLessonInputs.map(createLesson);

export const coreWorkplaceCourseStats = {
  lessons: coreWorkplaceLessons.length,
  minutes: coreWorkplaceLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: coreWorkplaceLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: new Set(coreWorkplaceLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.slug))).size,
  modules: coreWorkplaceModules.length,
};
