import type { LessonChallenge, UsageNote, Vocabulary } from "./content-types.ts";
import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";

type SalesWordInput = [slug: string, hanzi: string, pinyin: string, meaning: string, example: string, translation: string];
type SalesLine = [hanzi: string, pinyin: string, translation: string];

type SalesLessonInput = Omit<CourseLessonSeed, "content" | "vocabulary"> & {
  vocabulary: SalesWordInput[];
  need: SalesLine;
  response: SalesLine;
  notes: [UsageNote, UsageNote];
  challenge?: LessonChallenge;
};

const note = (title: string, pattern: string, explanation: string): UsageNote => ({ title, pattern, explanation });

function toVocabulary(input: SalesWordInput): Vocabulary {
  const [slug, hanzi, pinyin, meaning, example, translation] = input;
  return { slug: `sales-${slug}`, hanzi, pinyin, meaning, example, translation, audioUrl: null };
}

function createLesson(input: SalesLessonInput): CourseLessonSeed {
  const { need, response, challenge, notes, ...lesson } = input;
  return {
    ...lesson,
    vocabulary: lesson.vocabulary.map(toVocabulary),
    content: {
      dialogue: [
        { speaker: "A", hanzi: "客户现在最关心什么？", pinyin: "Kèhù xiànzài zuì guānxīn shénme?", translation: "Hiện tại khách hàng quan tâm nhất điều gì?" },
        { speaker: "B", hanzi: need[0], pinyin: need[1], translation: need[2] },
        { speaker: "A", hanzi: "我们应该怎么回复？", pinyin: "Wǒmen yīnggāi zěnme huífù?", translation: "Chúng ta nên phản hồi thế nào?" },
        { speaker: "B", hanzi: response[0], pinyin: response[1], translation: response[2] },
      ],
      notes,
      ...(challenge ? { challenge } : {}),
    },
  };
}

const consultingChallenge: LessonChallenge = {
  title: "Kiểm tra tư vấn nhu cầu",
  description: "Đạt 4/5 câu để chuyển sang báo giá và chốt đơn.",
  passScore: 4,
  questions: [
    { prompt: "您主要用在什么场景？ dùng để hỏi gì?", options: ["Bối cảnh sử dụng chính", "Ngày thanh toán", "Mã vận đơn"], correctOption: 0, explanation: "场景 là bối cảnh hoặc tình huống sử dụng sản phẩm." },
    { prompt: "预算范围 nghĩa là gì?", options: ["Khoảng ngân sách", "Phạm vi bảo hành", "Khu vực giao hàng"], correctOption: 0, explanation: "预算 là ngân sách; 范围 là phạm vi hoặc khoảng." },
    { prompt: "Khách cần dùng ngoài trời. Câu xác nhận nào phù hợp?", options: ["您需要适合户外使用的，对吗？", "这个一定最便宜。", "您不用考虑环境。"], correctOption: 0, explanation: "Nhắc lại nhu cầu rồi dùng 对吗 giúp xác nhận trước khi đề xuất." },
    { prompt: "性价比 cao mô tả điều gì?", options: ["Giá trị tốt so với chi phí", "Giá cao nhất", "Giao hàng nhanh nhất"], correctOption: 0, explanation: "性价比 nói về tương quan giữa hiệu năng/chất lượng và giá." },
    { prompt: "Khi chưa chắc sản phẩm có sẵn, nên nói gì?", options: ["我先确认库存再回复您。", "肯定有货。", "不用确认。"], correctOption: 0, explanation: "Xác minh tồn kho trước khi cam kết giúp tránh cung cấp thông tin sai." },
  ],
};

const quotationChallenge: LessonChallenge = {
  title: "Kiểm tra báo giá & chốt đơn",
  description: "Đạt 4/5 câu để chuyển sang theo dõi đơn và giao hàng.",
  passScore: 4,
  questions: [
    { prompt: "这份报价七天内有效 nghĩa là gì?", options: ["Báo giá có hiệu lực trong 7 ngày", "Báo giá gửi sau 7 ngày", "Đơn giao trong 7 ngày"], correctOption: 0, explanation: "七天内有效 là có hiệu lực trong vòng bảy ngày." },
    { prompt: "不含运费 nghĩa là gì?", options: ["Chưa gồm phí vận chuyển", "Miễn phí vận chuyển", "Chỉ gồm phí vận chuyển"], correctOption: 0, explanation: "不含 là không bao gồm; 运费 là phí vận chuyển." },
    { prompt: "Chiết khấu chỉ áp dụng từ 100 sản phẩm. Câu nào đúng?", options: ["满一百件可以申请折扣。", "每件都自动打折。", "折扣跟数量无关。"], correctOption: 0, explanation: "满一百件 diễn tả đạt ngưỡng một trăm sản phẩm." },
    { prompt: "定金 và 尾款 lần lượt là gì?", options: ["Tiền đặt cọc và tiền còn lại", "Thuế và vận chuyển", "Giá gốc và chiết khấu"], correctOption: 0, explanation: "定金 là tiền đặt cọc; 尾款 là khoản còn lại phải thanh toán." },
    { prompt: "Trước khi chốt đơn nên xác nhận gì?", options: ["型号、数量、价格和交期", "Chỉ tên khách", "Chỉ màu sản phẩm"], correctOption: 0, explanation: "Mẫu mã, số lượng, giá và thời gian giao là các điều kiện cốt lõi của đơn." },
  ],
};

const orderChallenge: LessonChallenge = {
  title: "Kiểm tra theo dõi đơn & giao hàng",
  description: "Đạt 4/5 câu để chuyển sang chăm sóc sau bán.",
  passScore: 4,
  questions: [
    { prompt: "订单号 dùng để làm gì?", options: ["Nhận diện và tra cứu đơn hàng", "Tính chiết khấu", "Gọi tên sản phẩm"], correctOption: 0, explanation: "订单号 là mã duy nhất dùng để kiểm tra trạng thái đơn." },
    { prompt: "预计周五发货 nghĩa là gì?", options: ["Dự kiến xuất/gửi hàng thứ Sáu", "Đã giao vào thứ Sáu", "Thứ Sáu mới đặt hàng"], correctOption: 0, explanation: "预计 thể hiện dự kiến; 发货 là gửi hoặc xuất hàng." },
    { prompt: "Khi một mã hàng bị thiếu, phản hồi nào phù hợp?", options: ["这款暂时缺货，我确认补货时间后回复您。", "所有商品都已发出。", "请忽略这个问题。"], correctOption: 0, explanation: "Nêu trạng thái thiếu hàng và hẹn mốc xác minh, không che giấu vấn đề." },
    { prompt: "Khách đổi số lượng sau khi đặt. Nên làm gì?", options: ["书面确认变更及影响", "Tự sửa mà không báo", "Hủy toàn bộ đơn ngay"], correctOption: 0, explanation: "Cần xác nhận bằng văn bản thay đổi và ảnh hưởng đến giá hoặc tiến độ." },
    { prompt: "签收前 nên nhắc khách kiểm tra gì?", options: ["数量和外包装", "Chỉ tên tài xế", "Chỉ phương thức thanh toán"], correctOption: 0, explanation: "Số lượng và bao bì ngoài cần được kiểm tra trước khi xác nhận nhận hàng." },
  ],
};

const serviceChallenge: LessonChallenge = {
  title: "Kiểm tra tổng hợp Bán hàng & chăm sóc khách",
  description: "Đạt 5/6 câu để hoàn thành lộ trình.",
  passScore: 5,
  questions: [
    { prompt: "Khách báo nhận sai mẫu. Câu mở đầu phù hợp là gì?", options: ["很抱歉给您带来不便，我先核实订单。", "这不是我们的问题。", "您一定看错了。"], correctOption: 0, explanation: "Ghi nhận bất tiện và xác minh dữ liệu trước khi kết luận trách nhiệm." },
    { prompt: "退换货 nghĩa là gì?", options: ["Trả hoặc đổi hàng", "Đặt thêm hàng", "Giao hàng từng phần"], correctOption: 0, explanation: "退货 là trả hàng; 换货 là đổi hàng." },
    { prompt: "保修期 mô tả điều gì?", options: ["Thời hạn bảo hành", "Thời hạn báo giá", "Thời gian vận chuyển"], correctOption: 0, explanation: "保修期 là khoảng thời gian bảo hành theo chính sách áp dụng." },
    { prompt: "Khi khách đang bức xúc, nên làm gì trước?", options: ["耐心听完并确认问题", "Ngắt lời để giải thích", "Hứa hoàn tiền ngay"], correctOption: 0, explanation: "Lắng nghe và xác nhận vấn đề giúp giảm hiểu lầm trước khi đưa phương án." },
    { prompt: "回访 thường được dùng để làm gì?", options: ["Hỏi lại trải nghiệm sau bán", "Tạo hóa đơn", "Kiểm kê kho"], correctOption: 0, explanation: "回访 là liên hệ lại để hỏi trải nghiệm hoặc kết quả sử dụng." },
    { prompt: "Khi xử lý đổi trả, bảo hành hoặc hoàn tiền, khóa học yêu cầu gì?", options: ["Theo chính sách đã duyệt và thẩm quyền thực tế", "Tự cam kết bất kỳ phương án nào", "Bỏ qua chứng từ"], correctOption: 0, explanation: "Nội dung hỗ trợ ngôn ngữ, không thay thế chính sách bán hàng hoặc phê duyệt của doanh nghiệp." },
  ],
};

export const salesModules: CourseModuleSeed[] = [
  { slug: "tu-van-nhu-cau", title: "Tư vấn nhu cầu", description: "Chào hỏi, làm rõ bối cảnh, ngân sách, tiêu chí và đề xuất giải pháp phù hợp." },
  { slug: "bao-gia-va-chot-don", title: "Báo giá & chốt đơn", description: "Gửi báo giá, giải thích chi phí, thương lượng điều kiện và xác nhận đơn." },
  { slug: "theo-doi-don-va-giao-hang", title: "Theo dõi đơn & giao hàng", description: "Xác nhận đơn, cập nhật tiến độ, xử lý thay đổi và phối hợp giao nhận." },
  { slug: "cham-soc-va-khieu-nai", title: "Chăm sóc sau bán & khiếu nại", description: "Tiếp nhận phản hồi, xác minh, đổi trả, bảo hành và duy trì quan hệ khách hàng." },
];

const salesLessonInputs: SalesLessonInput[] = [
  {
    moduleSlug: "tu-van-nhu-cau", slug: "chao-va-xac-dinh-nhu-cau", title: "Chào và xác định nhu cầu",
    summary: "Mở đầu lịch sự, xác nhận người liên hệ và lý do khách tìm đến.", situation: "Khách lần đầu hỏi sản phẩm", estimatedMinutes: 11, isFree: true,
    vocabulary: [
      ["l01-huanying", "欢迎", "huānyíng", "chào mừng", "欢迎您来咨询。", "Chào mừng anh/chị đến tìm hiểu."],
      ["l01-kehu", "客户", "kèhù", "khách hàng", "这位客户第一次联系我们。", "Khách hàng này lần đầu liên hệ."],
      ["l01-zixun", "咨询", "zīxún", "tư vấn, hỏi thông tin", "您想咨询哪款产品？", "Anh/chị muốn hỏi về sản phẩm nào?"],
      ["l01-xuqiu", "需求", "xūqiú", "nhu cầu", "我先了解一下您的需求。", "Tôi xin tìm hiểu nhu cầu của anh/chị trước."],
      ["l01-lianxiren", "联系人", "liánxìrén", "người liên hệ", "请问您是项目联系人吗？", "Anh/chị có phải người liên hệ của dự án không?"],
      ["l01-goutong", "沟通", "gōutōng", "trao đổi", "我们可以先电话沟通。", "Chúng ta có thể trao đổi qua điện thoại trước."],
    ],
    need: ["客户想先了解我们的产品。", "Kèhù xiǎng xiān liǎojiě wǒmen de chǎnpǐn.", "Khách muốn tìm hiểu sản phẩm của chúng ta trước."],
    response: ["我先确认他的用途和基本要求。", "Wǒ xiān quèrèn tā de yòngtú hé jīběn yāoqiú.", "Tôi sẽ xác nhận mục đích và yêu cầu cơ bản trước."],
    notes: [note("Xưng hô lịch sự", "您 + động từ", "Dùng 您 khi mới gặp hoặc khi cần giữ giọng tư vấn chuyên nghiệp."), note("Không giới thiệu quá sớm", "先了解需求，再推荐", "Tìm hiểu nhu cầu trước khi đề xuất giúp cuộc trao đổi tập trung hơn.")],
  },
  {
    moduleSlug: "tu-van-nhu-cau", slug: "hoi-muc-dich-va-boi-canh-su-dung", title: "Hỏi mục đích và bối cảnh sử dụng",
    summary: "Phân biệt môi trường sử dụng, người dùng và điều kiện vận hành chính.", situation: "Khách chưa nói rõ dùng sản phẩm ở đâu", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l02-yongtu", "用途", "yòngtú", "mục đích sử dụng", "请问主要用途是什么？", "Mục đích sử dụng chính là gì?"],
      ["l02-changjing", "场景", "chǎngjǐng", "bối cảnh sử dụng", "这个产品适合办公场景。", "Sản phẩm này phù hợp bối cảnh văn phòng."],
      ["l02-huwai", "户外", "hùwài", "ngoài trời", "您需要在户外使用吗？", "Anh/chị có cần dùng ngoài trời không?"],
      ["l02-shinei", "室内", "shìnèi", "trong nhà", "室内使用不需要防雨。", "Dùng trong nhà không cần chống mưa."],
      ["l02-yonghu", "用户", "yònghù", "người sử dụng", "最终用户是工厂员工。", "Người dùng cuối là nhân viên nhà máy."],
      ["l02-huanjing", "环境", "huánjìng", "môi trường", "使用环境温度比较高。", "Nhiệt độ môi trường sử dụng khá cao."],
    ],
    need: ["客户要在室外和潮湿环境中使用。", "Kèhù yào zài shìwài hé cháoshī huánjìng zhōng shǐyòng.", "Khách cần sử dụng ngoài trời và trong môi trường ẩm."],
    response: ["我会推荐适合这个使用场景的型号。", "Wǒ huì tuījiàn shìhé zhège shǐyòng chǎngjǐng de xínghào.", "Tôi sẽ đề xuất mẫu phù hợp bối cảnh này."],
    notes: [note("Đưa lựa chọn dễ trả lời", "是……还是……？", "Dùng hai lựa chọn rõ ràng để khách mô tả bối cảnh nhanh hơn."), note("Xác nhận điều kiện", "需要在……使用，对吗？", "Nhắc lại môi trường sử dụng trước khi đề xuất mẫu.")],
  },
  {
    moduleSlug: "tu-van-nhu-cau", slug: "xac-nhan-so-luong-va-ngan-sach", title: "Xác nhận số lượng và ngân sách",
    summary: "Hỏi số lượng dự kiến, khoảng ngân sách và thời điểm cần hàng mà không gây áp lực.", situation: "Khách cần một đề xuất trong giới hạn chi phí", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l03-shuliang", "数量", "shùliàng", "số lượng", "您预计需要多少数量？", "Anh/chị dự kiến cần số lượng bao nhiêu?"],
      ["l03-yusuan", "预算", "yùsuàn", "ngân sách", "项目预算大概是多少？", "Ngân sách dự án khoảng bao nhiêu?"],
      ["l03-fanwei", "范围", "fànwéi", "phạm vi, khoảng", "请告诉我预算范围。", "Hãy cho tôi biết khoảng ngân sách."],
      ["l03-pici", "批次", "pīcì", "đợt, lô", "可以分两个批次采购。", "Có thể mua theo hai đợt."],
      ["l03-jihua", "计划", "jìhuà", "kế hoạch", "您的采购计划是什么？", "Kế hoạch mua hàng của anh/chị là gì?"],
      ["l03-qixian", "期限", "qīxiàn", "thời hạn", "项目期限比较紧。", "Thời hạn dự án khá gấp."],
    ],
    need: ["客户需要一百件，预算也比较明确。", "Kèhù xūyào yìbǎi jiàn, yùsuàn yě bǐjiào míngquè.", "Khách cần 100 sản phẩm và ngân sách khá rõ."],
    response: ["我会按数量和预算准备两个方案。", "Wǒ huì àn shùliàng hé yùsuàn zhǔnbèi liǎng ge fāng'àn.", "Tôi sẽ chuẩn bị hai phương án theo số lượng và ngân sách."],
    notes: [note("Hỏi theo khoảng", "预算范围大概是……？", "Hỏi khoảng ngân sách thường dễ trả lời hơn yêu cầu một con số chính xác."), note("Tách nhu cầu và cam kết", "预计需要……", "预计 cho biết đây là dự kiến, chưa phải số lượng đặt hàng cuối cùng.")],
  },
  {
    moduleSlug: "tu-van-nhu-cau", slug: "gioi-thieu-tinh-nang-va-loi-ich", title: "Giới thiệu tính năng và lợi ích",
    summary: "Liên kết đặc điểm sản phẩm với lợi ích thực tế thay vì chỉ đọc thông số.", situation: "Khách hỏi điểm khác biệt của sản phẩm", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["l04-gongneng", "功能", "gōngnéng", "tính năng", "这个型号有自动提醒功能。", "Mẫu này có tính năng nhắc tự động."],
      ["l04-tedian", "特点", "tèdiǎn", "đặc điểm", "它的主要特点是操作简单。", "Đặc điểm chính là dễ thao tác."],
      ["l04-youdian", "优点", "yōudiǎn", "ưu điểm", "这款产品的优点是省电。", "Ưu điểm của sản phẩm này là tiết kiệm điện."],
      ["l04-xiaolv", "效率", "xiàolǜ", "hiệu suất", "它可以提高工作效率。", "Nó có thể nâng cao hiệu suất công việc."],
      ["l04-naijiu", "耐用", "nàiyòng", "bền", "这个材料比较耐用。", "Vật liệu này khá bền."],
      ["l04-bianyu", "便于", "biànyú", "thuận tiện cho", "这个设计便于清洁。", "Thiết kế này thuận tiện cho việc vệ sinh."],
    ],
    need: ["客户想知道这款产品能带来什么好处。", "Kèhù xiǎng zhīdào zhè kuǎn chǎnpǐn néng dàilái shénme hǎochu.", "Khách muốn biết sản phẩm mang lại lợi ích gì."],
    response: ["我会结合他的使用场景说明功能和效果。", "Wǒ huì jiéhé tā de shǐyòng chǎngjǐng shuōmíng gōngnéng hé xiàoguǒ.", "Tôi sẽ giải thích tính năng và hiệu quả theo bối cảnh sử dụng."],
    notes: [note("Từ tính năng đến lợi ích", "有……功能，可以……", "Nêu tính năng rồi nói kết quả thực tế giúp khách dễ đánh giá hơn."), note("Tránh tuyệt đối hóa", "比较 / 可以 / 有助于", "Dùng mức độ phù hợp, không nói 最好 hoặc 绝对 khi chưa có căn cứ.")],
  },
  {
    moduleSlug: "tu-van-nhu-cau", slug: "so-sanh-va-de-xuat-lua-chon", title: "So sánh và đề xuất lựa chọn",
    summary: "So sánh hai phương án theo tiêu chí rõ ràng và giải thích lý do đề xuất.", situation: "Khách phân vân giữa hai mẫu", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["l05-bijiao", "比较", "bǐjiào", "so sánh", "我们先比较两个型号。", "Chúng ta hãy so sánh hai mẫu trước."],
      ["l05-xinghao", "型号", "xínghào", "mẫu, model", "这个型号更适合户外。", "Mẫu này phù hợp ngoài trời hơn."],
      ["l05-guige", "规格", "guīgé", "quy cách", "两款产品的规格不同。", "Quy cách hai sản phẩm khác nhau."],
      ["l05-xingjiabi", "性价比", "xìngjiàbǐ", "giá trị so với chi phí", "这款的性价比更高。", "Mẫu này có giá trị so với chi phí tốt hơn."],
      ["l05-tuijian", "推荐", "tuījiàn", "đề xuất, giới thiệu", "我推荐第二个方案。", "Tôi đề xuất phương án thứ hai."],
      ["l05-shihe", "适合", "shìhé", "phù hợp", "它更适合您的预算。", "Nó phù hợp ngân sách của anh/chị hơn."],
    ],
    need: ["客户在两个型号之间还没有决定。", "Kèhù zài liǎng ge xínghào zhījiān hái méiyǒu juédìng.", "Khách vẫn chưa quyết định giữa hai mẫu."],
    response: ["我会按预算、功能和交期说明差别。", "Wǒ huì àn yùsuàn, gōngnéng hé jiāoqī shuōmíng chābié.", "Tôi sẽ giải thích khác biệt theo ngân sách, tính năng và thời gian giao."],
    notes: [note("So sánh theo tiêu chí", "A 比 B 更……", "Nêu rõ tiêu chí thay vì chỉ nói một mẫu tốt hơn."), note("Đề xuất có lý do", "根据您的……，我推荐……", "Gắn đề xuất với nhu cầu khách đã xác nhận.")],
  },
  {
    moduleSlug: "tu-van-nhu-cau", slug: "kiem-tra-tu-van-nhu-cau", title: "Kiểm tra: Tư vấn nhu cầu",
    summary: "Ôn cách hỏi bối cảnh, ngân sách, tiêu chí và đưa đề xuất có căn cứ.", situation: "Đánh giá cuối module 1", estimatedMinutes: 14, isFree: true,
    vocabulary: [
      ["l06-yixiang", "意向", "yìxiàng", "ý định, mức quan tâm", "客户有进一步了解的意向。", "Khách có ý định tìm hiểu thêm."],
      ["l06-yaoqiu", "要求", "yāoqiú", "yêu cầu", "请确认您的主要要求。", "Hãy xác nhận yêu cầu chính của anh/chị."],
      ["l06-youxian", "优先", "yōuxiān", "ưu tiên", "您优先考虑价格还是质量？", "Anh/chị ưu tiên giá hay chất lượng?"],
      ["l06-fangan", "方案", "fāng'àn", "phương án", "我们准备了两个方案。", "Chúng tôi đã chuẩn bị hai phương án."],
      ["l06-queren", "确认", "quèrèn", "xác nhận", "推荐前要确认需求。", "Cần xác nhận nhu cầu trước khi đề xuất."],
      ["l06-ziliao", "资料", "zīliào", "tài liệu", "我把产品资料发给您。", "Tôi gửi tài liệu sản phẩm cho anh/chị."],
    ],
    need: ["客户需要一个符合预算的户外方案。", "Kèhù xūyào yí ge fúhé yùsuàn de hùwài fāng'àn.", "Khách cần một phương án ngoài trời phù hợp ngân sách."],
    response: ["我先总结需求，再推荐合适的型号。", "Wǒ xiān zǒngjié xūqiú, zài tuījiàn héshì de xínghào.", "Tôi sẽ tổng hợp nhu cầu rồi đề xuất mẫu phù hợp."],
    notes: [note("Tóm tắt trước khi đề xuất", "您的需求是……，对吗？", "Một câu tóm tắt giúp hai bên sửa hiểu nhầm trước khi báo giá."), note("Tài liệu không thay thế tư vấn", "资料 + 重点说明", "Gửi tài liệu kèm các điểm liên quan trực tiếp đến nhu cầu của khách.")], challenge: consultingChallenge,
  },
  {
    moduleSlug: "bao-gia-va-chot-don", slug: "chuan-bi-va-gui-bao-gia", title: "Chuẩn bị và gửi báo giá",
    summary: "Xác nhận phiên bản báo giá, người nhận, thời hạn hiệu lực và tệp đính kèm.", situation: "Gửi báo giá chính thức", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l07-baojiadan", "报价单", "bàojiàdān", "bảng báo giá", "报价单已经准备好了。", "Bảng báo giá đã được chuẩn bị."],
      ["l07-fasong", "发送", "fāsòng", "gửi", "我今天下午发送报价。", "Chiều nay tôi gửi báo giá."],
      ["l07-fujian", "附件", "fùjiàn", "tệp đính kèm", "请查看邮件附件。", "Hãy xem tệp đính kèm email."],
      ["l07-banben", "版本", "bǎnběn", "phiên bản", "这是最新版本。", "Đây là phiên bản mới nhất."],
      ["l07-youxiaoqi", "有效期", "yǒuxiàoqī", "thời hạn hiệu lực", "报价有效期是七天。", "Báo giá có hiệu lực bảy ngày."],
      ["l07-shoujianren", "收件人", "shōujiànrén", "người nhận", "请确认收件人邮箱。", "Hãy xác nhận email người nhận."],
    ],
    need: ["客户今天需要正式报价单。", "Kèhù jīntiān xūyào zhèngshì bàojiàdān.", "Khách cần bảng báo giá chính thức trong hôm nay."],
    response: ["我会确认版本和收件人后发送。", "Wǒ huì quèrèn bǎnběn hé shōujiànrén hòu fāsòng.", "Tôi sẽ xác nhận phiên bản và người nhận rồi gửi."],
    notes: [note("Xác nhận đã gửi", "已经发给您了", "已经……了 cho biết hành động gửi đã hoàn tất."), note("Nêu thời hạn rõ", "报价在……内有效", "Ghi rõ thời hạn để tránh khách dùng báo giá đã hết hiệu lực.")],
  },
  {
    moduleSlug: "bao-gia-va-chot-don", slug: "giai-thich-gia-va-pham-vi", title: "Giải thích giá và phạm vi",
    summary: "Làm rõ đơn giá, thuế, vận chuyển và những hạng mục đã hoặc chưa bao gồm.", situation: "Khách hỏi vì sao tổng tiền khác dự kiến", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l08-danjia", "单价", "dānjià", "đơn giá", "这个单价按一百件计算。", "Đơn giá này tính theo 100 sản phẩm."],
      ["l08-zongjia", "总价", "zǒngjià", "tổng giá", "总价已经包含安装费。", "Tổng giá đã gồm phí lắp đặt."],
      ["l08-hanshui", "含税", "hánshuì", "đã gồm thuế", "这是含税价格。", "Đây là giá đã gồm thuế."],
      ["l08-weishui", "未税", "wèishuì", "chưa gồm thuế", "表格里显示的是未税价。", "Bảng hiển thị giá chưa thuế."],
      ["l08-yunfei", "运费", "yùnfèi", "phí vận chuyển", "报价不含运费。", "Báo giá chưa gồm phí vận chuyển."],
      ["l08-baohan", "包含", "bāohán", "bao gồm", "服务费包含培训。", "Phí dịch vụ gồm đào tạo."],
    ],
    need: ["客户想确认总价包含哪些费用。", "Kèhù xiǎng quèrèn zǒngjià bāohán nǎxiē fèiyòng.", "Khách muốn xác nhận tổng giá gồm những chi phí nào."],
    response: ["我会逐项说明税费、运费和服务费。", "Wǒ huì zhúxiàng shuōmíng shuìfèi, yùnfèi hé fúwùfèi.", "Tôi sẽ giải thích từng khoản thuế, vận chuyển và dịch vụ."],
    notes: [note("Nêu phần chưa gồm", "价格不含……", "Đặt 不含 trước loại phí để nói rõ phần ngoài báo giá."), note("Không tự diễn giải thuế", "以正式报价和发票要求为准", "Thuế và hóa đơn phải theo báo giá, quy định và bộ phận phụ trách thực tế.")],
  },
  {
    moduleSlug: "bao-gia-va-chot-don", slug: "thuong-luong-chiet-khau-va-dieu-kien", title: "Thương lượng chiết khấu và điều kiện",
    summary: "Trao đổi ngưỡng số lượng, chiết khấu và điều kiện áp dụng mà không tự ý cam kết.", situation: "Khách đề nghị giảm giá", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l09-zhekou", "折扣", "zhékòu", "chiết khấu", "这个折扣需要申请。", "Chiết khấu này cần được phê duyệt."],
      ["l09-youhui", "优惠", "yōuhuì", "ưu đãi", "目前有批量采购优惠。", "Hiện có ưu đãi mua số lượng lớn."],
      ["l09-qidingliang", "起订量", "qǐdìngliàng", "số lượng đặt tối thiểu", "这款产品的起订量是五十件。", "Số lượng đặt tối thiểu là 50."],
      ["l09-tiaojian", "条件", "tiáojiàn", "điều kiện", "优惠有数量条件。", "Ưu đãi có điều kiện số lượng."],
      ["l09-shenqing", "申请", "shēnqǐng", "xin phê duyệt", "我帮您申请特别价格。", "Tôi sẽ xin mức giá đặc biệt cho anh/chị."],
      ["l09-shenpi", "审批", "shěnpī", "phê duyệt", "价格还在审批中。", "Mức giá vẫn đang được phê duyệt."],
    ],
    need: ["客户希望数量增加后再优惠一些。", "Kèhù xīwàng shùliàng zēngjiā hòu zài yōuhuì yìxiē.", "Khách muốn được ưu đãi thêm khi tăng số lượng."],
    response: ["我先确认数量，再按政策申请折扣。", "Wǒ xiān quèrèn shùliàng, zài àn zhèngcè shēnqǐng zhékòu.", "Tôi sẽ xác nhận số lượng rồi xin chiết khấu theo chính sách."],
    notes: [note("Gắn ưu đãi với điều kiện", "满……可以……", "满 nêu ngưỡng cần đạt trước khi ưu đãi có thể áp dụng."), note("Không vượt thẩm quyền", "需要申请 / 等待审批", "Dùng các cụm này khi mức giá phải được phê duyệt.")],
  },
  {
    moduleSlug: "bao-gia-va-chot-don", slug: "xac-nhan-thanh-toan-va-cong-no", title: "Xác nhận thanh toán và công nợ",
    summary: "Làm rõ đặt cọc, số tiền còn lại, hạn thanh toán và phương thức chuyển tiền.", situation: "Thống nhất điều kiện thanh toán", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l10-fukuan", "付款", "fùkuǎn", "thanh toán", "请按合同约定付款。", "Hãy thanh toán theo thỏa thuận hợp đồng."],
      ["l10-dingjin", "定金", "dìngjīn", "tiền đặt cọc", "下单需要支付定金。", "Đặt hàng cần thanh toán tiền cọc."],
      ["l10-weikuan", "尾款", "wěikuǎn", "tiền còn lại", "尾款在发货前支付。", "Khoản còn lại thanh toán trước khi giao."],
      ["l10-zhangqi", "账期", "zhàngqī", "kỳ hạn công nợ", "账期需要财务确认。", "Kỳ hạn công nợ cần tài chính xác nhận."],
      ["l10-daozhang", "到账", "dàozhàng", "tiền vào tài khoản", "款项还没有到账。", "Khoản tiền chưa vào tài khoản."],
      ["l10-zhuanzhang", "转账", "zhuǎnzhàng", "chuyển khoản", "客户选择银行转账。", "Khách chọn chuyển khoản ngân hàng."],
    ],
    need: ["客户想确认定金比例和付款期限。", "Kèhù xiǎng quèrèn dìngjīn bǐlì hé fùkuǎn qīxiàn.", "Khách muốn xác nhận tỷ lệ đặt cọc và hạn thanh toán."],
    response: ["我会按合同条款逐项确认。", "Wǒ huì àn hétóng tiáokuǎn zhúxiàng quèrèn.", "Tôi sẽ xác nhận từng mục theo điều khoản hợp đồng."],
    notes: [note("Phân biệt hai khoản", "先付定金，……前付尾款", "Nêu thứ tự và mốc thanh toán giúp tránh hiểu nhầm."), note("Xác nhận tiền thực nhận", "以财务确认到账为准", "Không coi ảnh chuyển khoản là tiền đã vào nếu quy trình yêu cầu tài chính xác nhận.")],
  },
  {
    moduleSlug: "bao-gia-va-chot-don", slug: "chot-don-va-ban-giao-thong-tin", title: "Chốt đơn và bàn giao thông tin",
    summary: "Đọc lại mẫu, số lượng, giá, thời gian giao và đầu mối phụ trách trước khi tạo đơn.", situation: "Khách đồng ý đặt hàng", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l11-xiadan", "下单", "xiàdān", "đặt hàng", "客户确认今天下单。", "Khách xác nhận đặt hàng hôm nay."],
      ["l11-dingdan", "订单", "dìngdān", "đơn hàng", "订单信息已经确认。", "Thông tin đơn đã được xác nhận."],
      ["l11-jiaoqi", "交期", "jiāoqī", "thời gian giao", "标准交期是十个工作日。", "Thời gian giao tiêu chuẩn là 10 ngày làm việc."],
      ["l11-shouhuodizhi", "收货地址", "shōuhuò dìzhǐ", "địa chỉ nhận hàng", "请确认收货地址。", "Hãy xác nhận địa chỉ nhận hàng."],
      ["l11-beizhu", "备注", "bèizhù", "ghi chú", "特殊要求写在备注里。", "Yêu cầu đặc biệt được ghi trong ghi chú."],
      ["l11-jiaojie", "交接", "jiāojiē", "bàn giao", "我把订单交接给运营。", "Tôi bàn giao đơn cho bộ phận vận hành."],
    ],
    need: ["客户已经同意价格和交货时间。", "Kèhù yǐjīng tóngyì jiàgé hé jiāohuò shíjiān.", "Khách đã đồng ý giá và thời gian giao."],
    response: ["我会复述订单信息并书面确认。", "Wǒ huì fùshù dìngdān xìnxī bìng shūmiàn quèrèn.", "Tôi sẽ đọc lại thông tin đơn và xác nhận bằng văn bản."],
    notes: [note("Đọc lại bốn điểm", "型号、数量、价格、交期", "Đây là bốn thông tin tối thiểu cần đối chiếu trước khi tạo đơn."), note("Yêu cầu đặc biệt", "请写在备注里", "Ghi yêu cầu vào đơn giúp bộ phận sau không phụ thuộc vào trao đổi miệng.")],
  },
  {
    moduleSlug: "bao-gia-va-chot-don", slug: "kiem-tra-bao-gia-va-chot-don", title: "Kiểm tra: Báo giá & chốt đơn",
    summary: "Ôn phạm vi báo giá, điều kiện chiết khấu, thanh toán và xác nhận đơn.", situation: "Đánh giá cuối module 2", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l12-tiaokuan", "条款", "tiáokuǎn", "điều khoản", "请查看付款条款。", "Hãy xem điều khoản thanh toán."],
      ["l12-jiage", "价格", "jiàgé", "giá", "价格以正式报价为准。", "Giá theo báo giá chính thức."],
      ["l12-shuifei", "税费", "shuìfèi", "thuế và phí", "税费需要单独说明。", "Thuế phí cần được nói rõ riêng."],
      ["l12-hetong", "合同", "hétóng", "hợp đồng", "合同正在双方确认。", "Hợp đồng đang được hai bên xác nhận."],
      ["l12-qianzi", "签字", "qiānzì", "ký tên", "负责人确认后签字。", "Người phụ trách xác nhận rồi ký."],
      ["l12-shengxiao", "生效", "shēngxiào", "có hiệu lực", "合同签字后生效。", "Hợp đồng có hiệu lực sau khi ký."],
    ],
    need: ["客户准备签字，但要再确认费用范围。", "Kèhù zhǔnbèi qiānzì, dàn yào zài quèrèn fèiyòng fànwéi.", "Khách chuẩn bị ký nhưng muốn xác nhận lại phạm vi chi phí."],
    response: ["我会按正式报价和合同逐项核对。", "Wǒ huì àn zhèngshì bàojià hé hétóng zhúxiàng héduì.", "Tôi sẽ đối chiếu từng mục theo báo giá và hợp đồng chính thức."],
    notes: [note("Căn cứ chính thức", "以……为准", "Dùng khi cần nói tài liệu hoặc xác nhận nào là căn cứ cuối cùng."), note("Điều kiện hiệu lực", "……后生效", "Nêu rõ hành động cần hoàn thành trước khi thỏa thuận có hiệu lực.")], challenge: quotationChallenge,
  },
  {
    moduleSlug: "theo-doi-don-va-giao-hang", slug: "xac-nhan-don-va-ma-tra-cuu", title: "Xác nhận đơn và mã tra cứu",
    summary: "Gửi xác nhận đơn, mã đơn và đầu mối hỗ trợ để khách có thể tra cứu.", situation: "Đơn vừa được tạo trên hệ thống", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l13-dingdanhao", "订单号", "dìngdānhào", "mã đơn hàng", "您的订单号是A1024。", "Mã đơn của anh/chị là A1024."],
      ["l13-xitong", "系统", "xìtǒng", "hệ thống", "订单已经录入系统。", "Đơn đã được nhập vào hệ thống."],
      ["l13-zhuangtai", "状态", "zhuàngtài", "trạng thái", "您可以查询订单状态。", "Anh/chị có thể tra trạng thái đơn."],
      ["l13-chaxun", "查询", "cháxún", "tra cứu", "请用订单号查询。", "Hãy dùng mã đơn để tra cứu."],
      ["l13-kefu", "客服", "kèfú", "chăm sóc khách hàng", "如有问题请联系客服。", "Nếu có vấn đề hãy liên hệ CSKH."],
      ["l13-pingzheng", "凭证", "píngzhèng", "chứng từ, bằng chứng", "请保留订单凭证。", "Hãy giữ chứng từ đơn hàng."],
    ],
    need: ["客户需要订单号来查询进度。", "Kèhù xūyào dìngdānhào lái cháxún jìndù.", "Khách cần mã đơn để tra cứu tiến độ."],
    response: ["我会发送订单确认和查询方式。", "Wǒ huì fāsòng dìngdān quèrèn hé cháxún fāngshì.", "Tôi sẽ gửi xác nhận đơn và cách tra cứu."],
    notes: [note("Cung cấp mã trước", "您的订单号是……", "Đặt mã đơn ở đầu thông báo giúp khách lưu và tìm nhanh."), note("Một đầu mối rõ", "如有问题，请联系……", "Nêu kênh liên hệ phù hợp thay vì để khách tự tìm người phụ trách.")],
  },
  {
    moduleSlug: "theo-doi-don-va-giao-hang", slug: "cap-nhat-tien-do-chuan-bi-hang", title: "Cập nhật tiến độ chuẩn bị hàng",
    summary: "Báo trạng thái hiện tại, phần đã hoàn thành và mốc cập nhật tiếp theo.", situation: "Khách hỏi đơn đã chuẩn bị đến đâu", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l14-jindu", "进度", "jìndù", "tiến độ", "我来更新订单进度。", "Tôi cập nhật tiến độ đơn."],
      ["l14-beihuo", "备货", "bèihuò", "chuẩn bị hàng", "仓库正在备货。", "Kho đang chuẩn bị hàng."],
      ["l14-wancheng", "完成", "wánchéng", "hoàn thành", "备货已经完成百分之八十。", "Chuẩn bị hàng đã hoàn thành 80%."],
      ["l14-yuji", "预计", "yùjì", "dự kiến", "预计明天下午完成。", "Dự kiến hoàn thành chiều mai."],
      ["l14-gengxin", "更新", "gēngxīn", "cập nhật", "有变化我会及时更新。", "Nếu có thay đổi tôi sẽ cập nhật kịp thời."],
      ["l14-anpai", "安排", "ānpái", "sắp xếp", "发货安排没有变化。", "Kế hoạch gửi hàng không thay đổi."],
    ],
    need: ["客户想知道订单能否按计划发货。", "Kèhù xiǎng zhīdào dìngdān néngfǒu àn jìhuà fāhuò.", "Khách muốn biết đơn có thể gửi đúng kế hoạch không."],
    response: ["我会说明当前进度和下次更新时间。", "Wǒ huì shuōmíng dāngqián jìndù hé xià cì gēngxīn shíjiān.", "Tôi sẽ nêu tiến độ hiện tại và thời gian cập nhật tiếp theo."],
    notes: [note("Cập nhật ba phần", "当前状态 + 预计完成 + 下次更新", "Ba phần này giúp khách biết việc gì đang xảy ra và khi nào có tin mới."), note("Phân biệt dự kiến", "预计……", "预计 không phải cam kết chắc chắn; cần cập nhật khi điều kiện thay đổi.")],
  },
  {
    moduleSlug: "theo-doi-don-va-giao-hang", slug: "bao-thieu-hang-va-phuong-an-thay-the", title: "Báo thiếu hàng và phương án thay thế",
    summary: "Thông báo thiếu hàng sớm, nêu phạm vi ảnh hưởng và đề xuất lựa chọn thay thế.", situation: "Một mã trong đơn tạm hết hàng", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l15-quehuo", "缺货", "quēhuò", "thiếu, hết hàng", "这个型号暂时缺货。", "Mẫu này tạm hết hàng."],
      ["l15-buhuo", "补货", "bǔhuò", "bổ sung hàng", "预计下周补货。", "Dự kiến bổ sung hàng tuần sau."],
      ["l15-tidai", "替代", "tìdài", "thay thế", "我们有一个替代型号。", "Chúng tôi có một mẫu thay thế."],
      ["l15-fenpi", "分批", "fēnpī", "chia thành nhiều đợt", "订单可以分批发货。", "Đơn có thể gửi thành nhiều đợt."],
      ["l15-yingxiang", "影响", "yǐngxiǎng", "ảnh hưởng", "缺货会影响交期。", "Thiếu hàng sẽ ảnh hưởng thời gian giao."],
      ["l15-xuanze", "选择", "xuǎnzé", "lựa chọn", "请确认您选择哪个方案。", "Hãy xác nhận anh/chị chọn phương án nào."],
    ],
    need: ["客户的订单里有一款产品暂时缺货。", "Kèhù de dìngdān lǐ yǒu yì kuǎn chǎnpǐn zànshí quēhuò.", "Một sản phẩm trong đơn của khách tạm hết hàng."],
    response: ["我会说明影响并提供分批或替代方案。", "Wǒ huì shuōmíng yǐngxiǎng bìng tígōng fēnpī huò tìdài fāng'àn.", "Tôi sẽ nêu ảnh hưởng và đưa phương án giao từng phần hoặc thay thế."],
    notes: [note("Báo vấn đề kèm phương án", "暂时缺货，可以……", "Không chỉ thông báo hết hàng; hãy đưa lựa chọn khách có thể quyết định."), note("Không tự thay mã", "替代方案需要客户确认", "Mẫu thay thế phải được khách xác nhận khi có khác biệt về thông số hoặc giá.")],
  },
  {
    moduleSlug: "theo-doi-don-va-giao-hang", slug: "xu-ly-thay-doi-don-hang", title: "Xử lý thay đổi đơn hàng",
    summary: "Ghi nhận thay đổi số lượng, địa chỉ hoặc cấu hình và báo ảnh hưởng trước khi sửa đơn.", situation: "Khách muốn đổi đơn sau khi xác nhận", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l16-xiugai", "修改", "xiūgǎi", "chỉnh sửa", "客户申请修改订单。", "Khách đề nghị sửa đơn."],
      ["l16-biangeng", "变更", "biàngēng", "thay đổi", "变更会影响交期。", "Thay đổi sẽ ảnh hưởng thời gian giao."],
      ["l16-quxiao", "取消", "qǔxiāo", "hủy", "这个商品暂时不能取消。", "Sản phẩm này tạm thời không thể hủy."],
      ["l16-zhuimeng", "追加", "zhuījiā", "bổ sung thêm", "客户要追加二十件。", "Khách muốn bổ sung 20 sản phẩm."],
      ["l16-shumian", "书面", "shūmiàn", "bằng văn bản", "请书面确认变更。", "Hãy xác nhận thay đổi bằng văn bản."],
      ["l16-chongxin", "重新", "chóngxīn", "lại, làm lại", "需要重新计算价格。", "Cần tính lại giá."],
    ],
    need: ["客户要增加数量并更改收货地址。", "Kèhù yào zēngjiā shùliàng bìng gēnggǎi shōuhuò dìzhǐ.", "Khách muốn tăng số lượng và đổi địa chỉ nhận."],
    response: ["我会先确认对价格和交期的影响。", "Wǒ huì xiān quèrèn duì jiàgé hé jiāoqī de yǐngxiǎng.", "Tôi sẽ xác nhận ảnh hưởng đến giá và thời gian giao trước."],
    notes: [note("Xác nhận thay đổi", "请书面确认……", "Xác nhận bằng văn bản giúp các bộ phận dùng cùng một phiên bản đơn."), note("Báo ảnh hưởng trước", "变更可能影响……", "Nêu ảnh hưởng trước khi khách quyết định giữ hoặc sửa yêu cầu.")],
  },
  {
    moduleSlug: "theo-doi-don-va-giao-hang", slug: "xac-nhan-giao-hang-va-ky-nhan", title: "Xác nhận giao hàng và ký nhận",
    summary: "Báo lịch giao, thông tin nhận hàng và nhắc kiểm tra trước khi ký nhận.", situation: "Đơn chuẩn bị đến điểm giao", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l17-fahuo", "发货", "fāhuò", "gửi, xuất hàng", "订单今天已经发货。", "Đơn đã được gửi hôm nay."],
      ["l17-songda", "送达", "sòngdá", "giao đến", "预计明天上午送达。", "Dự kiến giao đến sáng mai."],
      ["l17-wuliu", "物流", "wùliú", "vận chuyển, logistics", "物流信息已经更新。", "Thông tin vận chuyển đã cập nhật."],
      ["l17-yundanhao", "运单号", "yùndānhào", "mã vận đơn", "这是您的运单号。", "Đây là mã vận đơn của anh/chị."],
      ["l17-qianshou", "签收", "qiānshōu", "ký nhận", "请检查后再签收。", "Hãy kiểm tra rồi mới ký nhận."],
      ["l17-waibaozhuang", "外包装", "wàibāozhuāng", "bao bì ngoài", "请检查外包装是否完好。", "Hãy kiểm tra bao bì ngoài có nguyên vẹn không."],
    ],
    need: ["客户需要确认明天的送货时间。", "Kèhù xūyào quèrèn míngtiān de sònghuò shíjiān.", "Khách cần xác nhận giờ giao ngày mai."],
    response: ["我会发送时间、运单号和签收提醒。", "Wǒ huì fāsòng shíjiān, yùndānhào hé qiānshōu tíxǐng.", "Tôi sẽ gửi thời gian, mã vận đơn và lưu ý ký nhận."],
    notes: [note("Phân biệt gửi và đến", "已经发货 / 预计送达", "发货 là đã gửi; 送达 là đã hoặc dự kiến giao tới nơi."), note("Nhắc kiểm tra", "请检查……后再签收", "Nhắc khách kiểm tra theo quy trình trước khi xác nhận nhận hàng.")],
  },
  {
    moduleSlug: "theo-doi-don-va-giao-hang", slug: "kiem-tra-theo-doi-don-va-giao-hang", title: "Kiểm tra: Theo dõi đơn & giao hàng",
    summary: "Ôn mã đơn, cập nhật tiến độ, thiếu hàng, thay đổi đơn và ký nhận.", situation: "Đánh giá cuối module 3", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l18-jiaofu", "交付", "jiāofù", "bàn giao, giao hàng", "项目按计划交付。", "Dự án được bàn giao đúng kế hoạch."],
      ["l18-yanchi", "延迟", "yánchí", "chậm, trì hoãn", "交付可能延迟一天。", "Việc giao có thể chậm một ngày."],
      ["l18-tongzhi", "通知", "tōngzhī", "thông báo", "有变化请及时通知客户。", "Có thay đổi hãy báo khách kịp thời."],
      ["l18-shouhuoren", "收货人", "shōuhuòrén", "người nhận hàng", "请确认收货人电话。", "Hãy xác nhận số điện thoại người nhận."],
      ["l18-yanshou", "验收", "yànshōu", "nghiệm thu", "客户将在现场验收。", "Khách sẽ nghiệm thu tại hiện trường."],
      ["l18-jilu", "记录", "jìlù", "ghi chép, biên bản", "异常情况要做好记录。", "Tình huống bất thường cần được ghi nhận."],
    ],
    need: ["客户担心订单不能按原计划交付。", "Kèhù dānxīn dìngdān bùnéng àn yuán jìhuà jiāofù.", "Khách lo đơn không thể giao theo kế hoạch ban đầu."],
    response: ["我会说明风险、最新时间和跟进安排。", "Wǒ huì shuōmíng fēngxiǎn, zuìxīn shíjiān hé gēnjìn ānpái.", "Tôi sẽ nêu rủi ro, thời gian mới nhất và kế hoạch theo dõi."],
    notes: [note("Báo chậm có mốc", "预计延迟……，新的时间是……", "Nêu mức chậm và mốc mới giúp khách điều chỉnh kế hoạch."), note("Ghi nhận ngoại lệ", "异常情况要记录", "Biên bản hoặc bằng chứng phải theo quy trình giao nhận của doanh nghiệp.")], challenge: orderChallenge,
  },
  {
    moduleSlug: "cham-soc-va-khieu-nai", slug: "tiep-nhan-phan-hoi-cua-khach", title: "Tiếp nhận phản hồi của khách",
    summary: "Lắng nghe đầy đủ, ghi nhận vấn đề và phân biệt phản hồi với kết luận trách nhiệm.", situation: "Khách liên hệ sau khi nhận hàng", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l19-fankui", "反馈", "fǎnkuì", "phản hồi", "谢谢您的反馈。", "Cảm ơn phản hồi của anh/chị."],
      ["l19-yijian", "意见", "yìjiàn", "ý kiến", "我们会认真听取您的意见。", "Chúng tôi sẽ nghiêm túc lắng nghe ý kiến."],
      ["l19-wenti", "问题", "wèntí", "vấn đề", "请详细说明问题。", "Hãy mô tả chi tiết vấn đề."],
      ["l19-qingkuang", "情况", "qíngkuàng", "tình hình", "我先了解具体情况。", "Tôi sẽ tìm hiểu tình hình cụ thể trước."],
      ["l19-jilu", "登记", "dēngjì", "ghi nhận, đăng ký", "我已经登记您的反馈。", "Tôi đã ghi nhận phản hồi."],
      ["l19-naixin", "耐心", "nàixīn", "kiên nhẫn", "请耐心听完客户的说明。", "Hãy kiên nhẫn nghe khách trình bày hết."],
    ],
    need: ["客户对收到的产品提出了意见。", "Kèhù duì shōudào de chǎnpǐn tíchū le yìjiàn.", "Khách có ý kiến về sản phẩm đã nhận."],
    response: ["我会先听完并记录具体问题。", "Wǒ huì xiān tīngwán bìng jìlù jùtǐ wèntí.", "Tôi sẽ nghe hết và ghi nhận vấn đề cụ thể trước."],
    notes: [note("Cảm ơn phản hồi", "谢谢您的反馈", "Câu này ghi nhận việc khách cung cấp thông tin, không đồng nghĩa nhận lỗi."), note("Không ngắt lời", "请您具体说明……", "Đặt câu hỏi sau khi khách trình bày giúp thu thập dữ kiện đầy đủ hơn.")],
  },
  {
    moduleSlug: "cham-soc-va-khieu-nai", slug: "xin-loi-va-xac-minh-thong-tin", title: "Xin lỗi và xác minh thông tin",
    summary: "Ghi nhận sự bất tiện, xin mã đơn và bằng chứng cần thiết trước khi kết luận.", situation: "Khách báo nhận sai hoặc thiếu hàng", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l20-baoqian", "抱歉", "bàoqiàn", "xin lỗi", "很抱歉给您带来不便。", "Rất xin lỗi vì đã gây bất tiện."],
      ["l20-bubian", "不便", "bùbiàn", "bất tiện", "感谢您说明这个不便。", "Cảm ơn anh/chị đã nói về bất tiện này."],
      ["l20-heshi", "核实", "héshí", "xác minh", "我马上核实订单。", "Tôi sẽ xác minh đơn ngay."],
      ["l20-zhengju", "证据", "zhèngjù", "bằng chứng", "请提供照片作为证据。", "Hãy cung cấp ảnh làm bằng chứng."],
      ["l20-zhaopian", "照片", "zhàopiàn", "ảnh", "请拍一下外包装照片。", "Hãy chụp ảnh bao bì ngoài."],
      ["l20-huifu", "回复", "huífù", "phản hồi", "我今天四点前回复您。", "Tôi sẽ phản hồi trước 4 giờ hôm nay."],
    ],
    need: ["客户说收到的型号和订单不一致。", "Kèhù shuō shōudào de xínghào hé dìngdān bù yízhì.", "Khách nói mẫu nhận được không khớp đơn."],
    response: ["我会先道歉，再核实订单和照片。", "Wǒ huì xiān dàoqiàn, zài héshí dìngdān hé zhàopiàn.", "Tôi sẽ xin lỗi trước rồi xác minh đơn và hình ảnh."],
    notes: [note("Xin lỗi vì bất tiện", "很抱歉给您带来不便", "Câu này thể hiện thái độ hỗ trợ mà chưa kết luận nguyên nhân."), note("Hẹn mốc phản hồi", "我会在……前回复您", "Một mốc cụ thể tốt hơn 请稍等 không có thời hạn.")],
  },
  {
    moduleSlug: "cham-soc-va-khieu-nai", slug: "xu-ly-doi-tra-va-bao-hanh", title: "Xử lý đổi trả và bảo hành",
    summary: "Giải thích điều kiện, chứng từ và quy trình đổi trả hoặc bảo hành theo chính sách.", situation: "Khách đề nghị đổi sản phẩm", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l21-tuihuo", "退货", "tuìhuò", "trả hàng", "客户申请退货。", "Khách đề nghị trả hàng."],
      ["l21-huanhuo", "换货", "huànhuò", "đổi hàng", "这个情况可以申请换货。", "Trường hợp này có thể xin đổi hàng."],
      ["l21-baoxiu", "保修", "bǎoxiū", "bảo hành", "产品提供一年保修。", "Sản phẩm được bảo hành một năm."],
      ["l21-baoxiuqi", "保修期", "bǎoxiūqī", "thời hạn bảo hành", "请确认是否还在保修期内。", "Hãy xác nhận còn trong hạn bảo hành không."],
      ["l21-zhengce", "政策", "zhèngcè", "chính sách", "退换货要按照公司政策。", "Đổi trả phải theo chính sách công ty."],
      ["l21-tiaojian", "符合条件", "fúhé tiáojiàn", "đáp ứng điều kiện", "这个订单符合换货条件。", "Đơn này đáp ứng điều kiện đổi hàng."],
    ],
    need: ["客户希望把有问题的产品换成新的。", "Kèhù xīwàng bǎ yǒu wèntí de chǎnpǐn huàn chéng xīn de.", "Khách muốn đổi sản phẩm có vấn đề sang sản phẩm mới."],
    response: ["我会核对保修期和换货条件。", "Wǒ huì héduì bǎoxiūqī hé huànhuò tiáojiàn.", "Tôi sẽ đối chiếu hạn bảo hành và điều kiện đổi hàng."],
    notes: [note("Nói khả năng, chưa cam kết", "可以申请……", "申请 cho biết yêu cầu sẽ được tiếp nhận và xét theo quy trình."), note("Theo chính sách", "按照……政策处理", "Không tự hứa đổi, trả hoặc hoàn tiền ngoài thẩm quyền.")],
  },
  {
    moduleSlug: "cham-soc-va-khieu-nai", slug: "xu-ly-khach-hang-buc-xuc", title: "Xử lý khách hàng bức xúc",
    summary: "Giữ bình tĩnh, tóm tắt vấn đề, đặt ranh giới giao tiếp và chuyển cấp khi cần.", situation: "Khách phàn nàn gay gắt qua điện thoại", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l22-buman", "不满", "bùmǎn", "không hài lòng", "我理解您对结果不满。", "Tôi hiểu anh/chị không hài lòng về kết quả."],
      ["l22-lijie", "理解", "lǐjiě", "hiểu", "我理解您的着急。", "Tôi hiểu sự sốt ruột của anh/chị."],
      ["l22-lengjing", "冷静", "lěngjìng", "bình tĩnh", "我们先冷静确认事实。", "Chúng ta bình tĩnh xác nhận sự việc trước."],
      ["l22-jiejue", "解决", "jiějué", "giải quyết", "我们正在寻找解决方案。", "Chúng tôi đang tìm phương án giải quyết."],
      ["l22-shengji", "升级", "shēngjí", "chuyển cấp", "这个问题需要升级处理。", "Vấn đề này cần chuyển cấp xử lý."],
      ["l22-fuzeren", "负责人", "fùzérén", "người phụ trách", "我会请负责人联系您。", "Tôi sẽ nhờ người phụ trách liên hệ."],
    ],
    need: ["客户因为延迟交货非常不满。", "Kèhù yīnwèi yánchí jiāohuò fēicháng bùmǎn.", "Khách rất không hài lòng vì giao hàng chậm."],
    response: ["我会确认诉求，并把问题升级给负责人。", "Wǒ huì quèrèn sùqiú, bìng bǎ wèntí shēngjí gěi fùzérén.", "Tôi sẽ xác nhận yêu cầu và chuyển vấn đề cho người phụ trách."],
    notes: [note("Ghi nhận cảm xúc", "我理解您……", "Ghi nhận cảm xúc không đồng nghĩa đồng ý mọi nhận định của khách."), note("Chuyển cấp có kỳ vọng", "我会请负责人在……前联系您", "Nêu ai sẽ liên hệ và trước thời điểm nào khi chuyển cấp.")],
  },
  {
    moduleSlug: "cham-soc-va-khieu-nai", slug: "hoi-lai-trai-nghiem-va-duy-tri-quan-he", title: "Hỏi lại trải nghiệm và duy trì quan hệ",
    summary: "Liên hệ sau bán, hỏi kết quả sử dụng và xác định nhu cầu hỗ trợ tiếp theo.", situation: "Theo dõi khách sau khi vấn đề được xử lý", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l23-huifang", "回访", "huífǎng", "liên hệ hỏi lại", "我今天做一次售后回访。", "Hôm nay tôi liên hệ hỏi lại sau bán."],
      ["l23-tiyan", "体验", "tǐyàn", "trải nghiệm", "您的使用体验怎么样？", "Trải nghiệm sử dụng của anh/chị thế nào?"],
      ["l23-manyidu", "满意度", "mǎnyìdù", "mức độ hài lòng", "我们会记录客户满意度。", "Chúng tôi sẽ ghi nhận mức hài lòng."],
      ["l23-shouhou", "售后", "shòuhòu", "sau bán hàng", "售后团队可以提供支持。", "Đội sau bán có thể hỗ trợ."],
      ["l23-gengjin", "跟进", "gēnjìn", "theo dõi tiếp", "我下周继续跟进。", "Tuần sau tôi tiếp tục theo dõi."],
      ["l23-changqi", "长期", "chángqī", "dài hạn", "我们希望建立长期合作。", "Chúng tôi mong xây dựng hợp tác dài hạn."],
    ],
    need: ["客户的问题已经处理，需要确认使用结果。", "Kèhù de wèntí yǐjīng chǔlǐ, xūyào quèrèn shǐyòng jiéguǒ.", "Vấn đề của khách đã xử lý, cần xác nhận kết quả sử dụng."],
    response: ["我会询问体验和是否还需要支持。", "Wǒ huì xúnwèn tǐyàn hé shìfǒu hái xūyào zhīchí.", "Tôi sẽ hỏi trải nghiệm và khách còn cần hỗ trợ không."],
    notes: [note("Câu hỏi mở sau bán", "使用体验怎么样？", "Câu hỏi mở giúp khách nói điều tốt và điều còn vướng."), note("Không ép mua thêm", "是否还需要支持？", "Ưu tiên kết quả sử dụng trước khi đề cập nhu cầu mới.")],
  },
  {
    moduleSlug: "cham-soc-va-khieu-nai", slug: "kiem-tra-tong-hop-ban-hang-cham-soc-khach", title: "Kiểm tra tổng hợp: Bán hàng & chăm sóc khách",
    summary: "Tổng hợp tư vấn, báo giá, theo dõi đơn, đổi trả và xử lý khiếu nại chuyên nghiệp.", situation: "Đánh giá cuối lộ trình", estimatedMinutes: 16, isFree: false,
    vocabulary: [
      ["l24-tousu", "投诉", "tóusù", "khiếu nại", "客户提交了正式投诉。", "Khách đã gửi khiếu nại chính thức."],
      ["l24-yuanyin", "原因", "yuányīn", "nguyên nhân", "我们正在调查问题原因。", "Chúng tôi đang điều tra nguyên nhân."],
      ["l24-chuli", "处理", "chǔlǐ", "xử lý", "这个问题正在处理中。", "Vấn đề này đang được xử lý."],
      ["l24-jieguo", "结果", "jiéguǒ", "kết quả", "有结果后马上通知您。", "Có kết quả sẽ báo anh/chị ngay."],
      ["l24-gaishan", "改善", "gǎishàn", "cải thiện", "我们会根据反馈改善服务。", "Chúng tôi sẽ cải thiện dịch vụ theo phản hồi."],
      ["l24-xinren", "信任", "xìnrèn", "niềm tin", "透明沟通有助于建立信任。", "Trao đổi minh bạch giúp xây dựng niềm tin."],
    ],
    need: ["客户要一个明确、符合政策的处理结果。", "Kèhù yào yí ge míngquè, fúhé zhèngcè de chǔlǐ jiéguǒ.", "Khách cần một kết quả xử lý rõ ràng, phù hợp chính sách."],
    response: ["我会说明事实、处理方案和完成时间。", "Wǒ huì shuōmíng shìshí, chǔlǐ fāng'àn hé wánchéng shíjiān.", "Tôi sẽ nêu sự việc, phương án xử lý và thời gian hoàn tất."],
    notes: [note("Kết thúc bằng hành động", "处理方案 + 负责人 + 完成时间", "Một phản hồi hoàn chỉnh cần phương án, người phụ trách và thời hạn."), note("Minh bạch trong giới hạn", "根据核实结果和政策处理", "Chỉ cam kết điều đã xác minh và nằm trong chính sách, thẩm quyền thực tế.")], challenge: serviceChallenge,
  },
];

export const salesLessons = salesLessonInputs.map(createLesson);

export const salesCourseStats = {
  lessons: salesLessons.length,
  minutes: salesLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: salesLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: new Set(salesLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.slug))).size,
  modules: salesModules.length,
};
