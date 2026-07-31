import type { LessonChallenge, UsageNote, Vocabulary } from "./content-types.ts";
import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";

type FactoryWordInput = [
  slug: string,
  hanzi: string,
  pinyin: string,
  meaning: string,
  example: string,
  translation: string,
];

type FactoryLine = [hanzi: string, pinyin: string, translation: string];

type FactoryLessonInput = Omit<CourseLessonSeed, "content" | "vocabulary"> & {
  vocabulary: FactoryWordInput[];
  status: FactoryLine;
  action: FactoryLine;
  notes: [UsageNote, UsageNote];
  challenge?: LessonChallenge;
};

function toVocabulary(input: FactoryWordInput): Vocabulary {
  const [slug, hanzi, pinyin, meaning, example, translation] = input;
  return { slug: `factory-${slug}`, hanzi, pinyin, meaning, example, translation, audioUrl: null };
}

function createLesson(input: FactoryLessonInput): CourseLessonSeed {
  const { status, action, challenge, notes, ...lesson } = input;
  return {
    ...lesson,
    vocabulary: lesson.vocabulary.map(toVocabulary),
    content: {
      dialogue: [
        { speaker: "A", hanzi: "现在是什么情况？", pinyin: "Xiànzài shì shénme qíngkuàng?", translation: "Hiện tại tình hình thế nào?" },
        { speaker: "B", hanzi: status[0], pinyin: status[1], translation: status[2] },
        { speaker: "A", hanzi: "下一步怎么处理？", pinyin: "Xià yí bù zěnme chǔlǐ?", translation: "Bước tiếp theo xử lý thế nào?" },
        { speaker: "B", hanzi: action[0], pinyin: action[1], translation: action[2] },
      ],
      notes,
      ...(challenge ? { challenge } : {}),
    },
  };
}

const safetyChallenge: LessonChallenge = {
  title: "Kiểm tra an toàn đầu ca",
  description: "Đạt 4/5 câu để chuyển sang nội dung vận hành và sản lượng.",
  passScore: 4,
  questions: [
    { prompt: "Máy phát ra tiếng bất thường. Hành động nào phù hợp nhất?", options: ["继续运行", "停机并报告", "提高速度"], correctOption: 1, explanation: "停机并报告 là dừng máy và báo cáo; không tiếp tục vận hành khi chưa xác định an toàn." },
    { prompt: "操作规程 nghĩa là gì?", options: ["Quy trình thao tác", "Kế hoạch nghỉ", "Phiếu giao hàng"], correctOption: 0, explanation: "操作规程 là quy trình hoặc quy định thao tác thiết bị." },
    { prompt: "Câu nào xác nhận cần kiểm tra áp suất trước khi mở van?", options: ["开阀门之前，要先检查压力，对吗？", "压力不用检查。", "先开阀门再说。"], correctOption: 0, explanation: "之前 là trước khi; mẫu câu nhắc lại thao tác và xin xác nhận." },
    { prompt: "进入车间前 cần làm gì?", options: ["穿戴劳保用品", "取下安全帽", "关闭警示灯"], correctOption: 0, explanation: "穿戴劳保用品 là mặc và đeo đầy đủ trang bị bảo hộ lao động." },
    { prompt: "急停按钮 được dùng trong trường hợp nào?", options: ["Tình huống cần dừng khẩn cấp", "Tăng tốc dây chuyền", "Ghi sản lượng"], correctOption: 0, explanation: "急停按钮 là nút dừng khẩn cấp; người học vẫn phải tuân thủ hướng dẫn tại nơi làm việc." },
  ],
};

const operationChallenge: LessonChallenge = {
  title: "Kiểm tra vận hành & sản lượng",
  description: "Đạt 4/5 câu để xác nhận bạn có thể báo trạng thái sản xuất rõ ràng.",
  passScore: 4,
  questions: [
    { prompt: "工单 cung cấp thông tin gì?", options: ["Lệnh sản xuất", "Phiếu nghỉ", "Biên bản họp"], correctOption: 0, explanation: "工单 là lệnh hoặc phiếu công việc dùng để tổ chức sản xuất." },
    { prompt: "缺料 nghĩa là gì?", options: ["Thiếu vật liệu", "Thừa nhân lực", "Máy chạy nhanh"], correctOption: 0, explanation: "缺料 mô tả tình trạng thiếu nguyên vật liệu để tiếp tục sản xuất." },
    { prompt: "Thông số vượt phạm vi tiêu chuẩn. Câu nào phù hợp?", options: ["参数超出标准范围。", "参数不用记录。", "产量已经包装。"], correctOption: 0, explanation: "超出标准范围 nghĩa là vượt ngoài phạm vi tiêu chuẩn." },
    { prompt: "首件确认 dùng khi nào?", options: ["Xác nhận sản phẩm đầu tiên sau khi đổi mã/đổi chuyền", "Kết thúc ca", "Nhập kho"], correctOption: 0, explanation: "首件 là sản phẩm đầu tiên; xác nhận giúp kiểm tra điều kiện trước khi chạy hàng loạt." },
    { prompt: "Câu nào báo đạt 90% kế hoạch?", options: ["完成率达到百分之九十。", "生产线停止九十次。", "还缺九十种材料。"], correctOption: 0, explanation: "完成率 là tỷ lệ hoàn thành; 百分之九十 là 90%." },
  ],
};

const qualityChallenge: LessonChallenge = {
  title: "Kiểm tra chất lượng & xử lý bất thường",
  description: "Đạt 4/5 câu để chuyển sang bàn giao và cải tiến.",
  passScore: 4,
  questions: [
    { prompt: "不合格品 phải được xử lý thế nào trước khi có quyết định?", options: ["隔离并贴标签", "混入合格品", "直接出货"], correctOption: 0, explanation: "Cách ly và gắn nhãn giúp tránh trộn lẫn; quy trình cụ thể phải theo SOP của nhà máy." },
    { prompt: "划痕 là loại lỗi nào?", options: ["Vết xước", "Sai số lượng", "Thiếu vật liệu"], correctOption: 0, explanation: "划痕 thường dùng để mô tả vết xước trên bề mặt." },
    { prompt: "返工 nghĩa là gì?", options: ["Làm lại/sửa lại", "Cho xuất hàng", "Đổi ca"], correctOption: 0, explanation: "返工 là thực hiện lại công đoạn để sản phẩm đáp ứng yêu cầu." },
    { prompt: "Lỗi lặp lại cần làm gì?", options: ["记录批号并追溯原因", "只口头提醒", "删除记录"], correctOption: 0, explanation: "Ghi số lô và truy xuất nguyên nhân giúp xác định phạm vi ảnh hưởng." },
    { prompt: "维修人员更换零件以后，应做什么?", options: ["确认设备状态再恢复生产", "立即提高速度", "跳过检查"], correctOption: 0, explanation: "Sau bảo trì cần xác nhận trạng thái thiết bị theo quy trình trước khi phục hồi sản xuất." },
  ],
};

const finalChallenge: LessonChallenge = {
  title: "Kiểm tra tổng hợp Nhà máy & sản xuất",
  description: "Đạt 5/6 câu để hoàn thành lộ trình và xác nhận khả năng giao tiếp theo tình huống.",
  passScore: 5,
  questions: [
    { prompt: "Nguyên tắc ưu tiên khi phát hiện nguy cơ an toàn là gì?", options: ["Dừng công việc và báo theo quy trình", "Tự sửa khi chưa được phép", "Chờ hết ca"], correctOption: 0, explanation: "An toàn và báo đúng cấp luôn được ưu tiên hơn sản lượng." },
    { prompt: "交接班 cần bao gồm nội dung nào?", options: ["Việc chưa xong và điểm cần theo dõi", "Chỉ tên người giao ca", "Chỉ sản lượng đạt"], correctOption: 0, explanation: "Bàn giao phải giúp ca sau tiếp tục công việc và kiểm soát rủi ro còn mở." },
    { prompt: "Câu nào báo lô đang chờ kiểm tra chất lượng?", options: ["这批产品还在等质检。", "这批产品已经出货。", "不用检查这批产品。"], correctOption: 0, explanation: "还在等质检 nghĩa là vẫn đang chờ kiểm tra chất lượng." },
    { prompt: "5S中 清扫 là gì?", options: ["Vệ sinh/quét dọn", "Đổi mã hàng", "Kiểm tra kích thước"], correctOption: 0, explanation: "清扫 là giữ khu vực và thiết bị sạch sẽ, đồng thời phát hiện bất thường." },
    { prompt: "改善建议 nên được triển khai thế nào?", options: ["试行并确认效果", "Áp dụng tùy ý trên toàn xưởng", "Không cần ghi nhận"], correctOption: 0, explanation: "Nên thử nghiệm có kiểm soát và đánh giá hiệu quả trước khi chuẩn hóa." },
    { prompt: "Khi có报警, người học nên làm gì?", options: ["按现场应急程序行动", "Tự đoán nguyên nhân", "Tắt cảnh báo rồi tiếp tục"], correctOption: 0, explanation: "应急程序 là quy trình ứng phó khẩn cấp tại chỗ; không tự ý bỏ qua cảnh báo." },
  ],
};

export const factoryModules: CourseModuleSeed[] = [
  { slug: "an-toan-va-bat-dau-ca", title: "An toàn & bắt đầu ca", description: "Bàn giao đầu ca, trang bị bảo hộ, xác nhận SOP và báo bất thường an toàn." },
  { slug: "van-hanh-va-san-luong", title: "Vận hành & sản lượng", description: "Đọc kế hoạch, cấp vật liệu, theo dõi thông số và cập nhật sản lượng." },
  { slug: "chat-luong-va-su-co", title: "Chất lượng & xử lý sự cố", description: "Kiểm tra sản phẩm, cách ly hàng lỗi, truy xuất và phối hợp bảo trì." },
  { slug: "ban-giao-va-cai-tien", title: "Bàn giao & cải tiến", description: "Bàn giao ca, thực hành 5S, giảm phế phẩm và phản ứng với tình huống khẩn cấp." },
];

const factoryLessonInputs: FactoryLessonInput[] = [
  // Module 1: An toàn & bắt đầu ca
  {
    moduleSlug: "an-toan-va-bat-dau-ca", slug: "nhan-ca-va-kiem-tra-khu-vuc", title: "Nhận ca và kiểm tra khu vực",
    summary: "Hỏi tình trạng ca trước, kiểm tra khu vực và ghi nhận điểm cần tiếp tục theo dõi.", situation: "Bắt đầu ca tại xưởng", estimatedMinutes: 11, isFree: true,
    vocabulary: [
      ["jiaojieban", "交接班", "jiāojiēbān", "bàn giao ca", "上班前先完成交接班。", "Trước khi vào ca cần hoàn thành bàn giao ca."],
      ["chejian", "车间", "chējiān", "xưởng sản xuất", "进入车间要遵守安全规定。", "Khi vào xưởng phải tuân thủ quy định an toàn."],
      ["gongzuo-quyu", "工作区域", "gōngzuò qūyù", "khu vực làm việc", "请检查自己的工作区域。", "Hãy kiểm tra khu vực làm việc của mình."],
      ["xunjian", "巡检", "xúnjiǎn", "kiểm tra theo vòng", "本班第一次巡检已经完成。", "Lượt kiểm tra đầu tiên của ca đã hoàn thành."],
      ["jilu", "记录", "jìlù", "ghi chép, hồ sơ", "异常情况要写在记录里。", "Tình trạng bất thường phải được ghi vào hồ sơ."],
      ["zhengchang", "正常", "zhèngcháng", "bình thường", "设备目前运行正常。", "Thiết bị hiện vận hành bình thường."],
    ],
    status: ["上一班没有停机，工作区域目前正常。", "Shàng yì bān méiyǒu tíngjī, gōngzuò qūyù mùqián zhèngcháng.", "Ca trước không dừng máy, khu vực làm việc hiện bình thường."],
    action: ["我先完成巡检，再把结果写进交接记录。", "Wǒ xiān wánchéng xúnjiǎn, zài bǎ jiéguǒ xiě jìn jiāojiē jìlù.", "Tôi sẽ kiểm tra theo vòng trước rồi ghi kết quả vào biên bản bàn giao."],
    notes: [
      { title: "Hỏi tình trạng ca trước", pattern: "上一班有什么需要注意的吗？", explanation: "Dùng khi nhận ca để hỏi điểm bất thường, việc còn mở hoặc rủi ro cần tiếp tục theo dõi." },
      { title: "Báo kết quả kiểm tra", pattern: "……目前正常 / 有异常", explanation: "Nêu rõ đối tượng rồi dùng 正常 hoặc 有异常 để báo trạng thái ngắn gọn." },
    ],
  },
  {
    moduleSlug: "an-toan-va-bat-dau-ca", slug: "trang-bi-bao-ho-ca-nhan", title: "Trang bị bảo hộ cá nhân",
    summary: "Xác nhận trang bị bắt buộc và nhắc đồng nghiệp đeo bảo hộ đúng khu vực.", situation: "Chuẩn bị vào khu vực sản xuất", estimatedMinutes: 10, isFree: true,
    vocabulary: [
      ["laobao-yongpin", "劳保用品", "láobǎo yòngpǐn", "trang bị bảo hộ lao động", "进入生产区前要穿戴劳保用品。", "Phải mang trang bị bảo hộ trước khi vào khu sản xuất."],
      ["anquanmao", "安全帽", "ānquánmào", "mũ bảo hộ", "请正确佩戴安全帽。", "Hãy đội mũ bảo hộ đúng cách."],
      ["fanghu-yanjing", "防护眼镜", "fánghù yǎnjìng", "kính bảo hộ", "这个工位必须戴防护眼镜。", "Vị trí này bắt buộc đeo kính bảo hộ."],
      ["shoutao", "手套", "shǒutào", "găng tay", "更换材料时要戴手套。", "Khi thay vật liệu phải đeo găng tay."],
      ["ersai", "耳塞", "ěrsāi", "nút bịt tai", "噪声区域需要使用耳塞。", "Khu vực tiếng ồn cần dùng nút bịt tai."],
      ["peidai", "佩戴", "pèidài", "đeo, mang", "请按规定佩戴防护用品。", "Hãy mang đồ bảo hộ theo quy định."],
    ],
    status: ["这个区域噪声较大，必须佩戴耳塞和安全帽。", "Zhège qūyù zàoshēng jiào dà, bìxū pèidài ěrsāi hé ānquánmào.", "Khu vực này có tiếng ồn lớn, bắt buộc dùng nút bịt tai và mũ bảo hộ."],
    action: ["我先检查劳保用品，确认穿戴正确以后再进去。", "Wǒ xiān jiǎnchá láobǎo yòngpǐn, quèrèn chuāndài zhèngquè yǐhòu zài jìnqù.", "Tôi sẽ kiểm tra trang bị và chỉ vào sau khi xác nhận đã mang đúng."],
    notes: [
      { title: "Nêu yêu cầu bắt buộc", pattern: "必须佩戴……", explanation: "必须 thể hiện yêu cầu bắt buộc. Danh mục PPE thực tế phải theo biển báo và quy định tại khu vực." },
      { title: "Nhắc lịch sự", pattern: "请先戴好……", explanation: "戴好 nhấn mạnh không chỉ có mang mà phải đeo đúng và chắc chắn." },
    ],
  },
  {
    moduleSlug: "an-toan-va-bat-dau-ca", slug: "xac-nhan-quy-trinh-van-hanh", title: "Xác nhận quy trình vận hành",
    summary: "Hỏi lại thứ tự thao tác và điều kiện cho phép trước một công đoạn chưa quen.", situation: "Thực hiện công đoạn mới", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["caozuo-guicheng", "操作规程", "cāozuò guīchéng", "quy trình thao tác", "操作设备前请阅读操作规程。", "Hãy đọc quy trình trước khi vận hành thiết bị."],
      ["buzhou", "步骤", "bùzhòu", "bước thao tác", "这个步骤不能省略。", "Không được bỏ qua bước này."],
      ["queren", "确认", "quèrèn", "xác nhận", "启动前要再次确认。", "Cần xác nhận lại trước khi khởi động."],
      ["famen", "阀门", "fámén", "van", "打开阀门前先检查压力。", "Kiểm tra áp suất trước khi mở van."],
      ["yali", "压力", "yālì", "áp suất", "当前压力在标准范围内。", "Áp suất hiện nằm trong phạm vi tiêu chuẩn."],
      ["xuke", "许可", "xǔkě", "cho phép, giấy phép", "没有许可不能进行这项操作。", "Không được thực hiện thao tác này khi chưa được phép."],
    ],
    status: ["这是我第一次操作这台设备，还需要确认两个步骤。", "Zhè shì wǒ dì yí cì cāozuò zhè tái shèbèi, hái xūyào quèrèn liǎng ge bùzhòu.", "Đây là lần đầu tôi vận hành thiết bị này, còn hai bước cần xác nhận."],
    action: ["我会按照操作规程，请负责人确认后再开始。", "Wǒ huì ànzhào cāozuò guīchéng, qǐng fùzérén quèrèn hòu zài kāishǐ.", "Tôi sẽ làm theo quy trình và chỉ bắt đầu sau khi người phụ trách xác nhận."],
    notes: [
      { title: "Xác nhận thứ tự", pattern: "……之前，要先……，对吗？", explanation: "Mẫu dùng để nhắc lại thao tác trước–sau và xin xác nhận mà không tự suy đoán." },
      { title: "Nói chưa được phép", pattern: "没有许可不能……", explanation: "Dùng để nêu rõ một thao tác chỉ được thực hiện khi có quyền hoặc phê duyệt theo quy trình." },
    ],
  },
  {
    moduleSlug: "an-toan-va-bat-dau-ca", slug: "khoi-dong-may-dung-trinh-tu", title: "Khởi động máy đúng trình tự",
    summary: "Gọi tên bộ phận điều khiển, mô tả thứ tự và xác nhận trạng thái trước khi chạy.", situation: "Khởi động thiết bị đầu ca", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["qidong", "启动", "qǐdòng", "khởi động", "确认安全以后再启动设备。", "Chỉ khởi động thiết bị sau khi xác nhận an toàn."],
      ["dianyuan", "电源", "diànyuán", "nguồn điện", "请先检查主电源。", "Hãy kiểm tra nguồn điện chính trước."],
      ["jiting-anniu", "急停按钮", "jítíng ànniǔ", "nút dừng khẩn cấp", "急停按钮不能被遮挡。", "Nút dừng khẩn cấp không được bị che chắn."],
      ["zhishideng", "指示灯", "zhǐshìdēng", "đèn chỉ thị", "绿色指示灯已经亮了。", "Đèn chỉ thị màu xanh đã sáng."],
      ["kongzhuan", "空转", "kōngzhuàn", "chạy không tải", "设备先空转一分钟。", "Thiết bị chạy không tải trước một phút."],
      ["shunxu", "顺序", "shùnxù", "trình tự", "请不要改变启动顺序。", "Không được thay đổi trình tự khởi động."],
    ],
    status: ["电源和急停按钮已经检查，指示灯状态正常。", "Diànyuán hé jítíng ànniǔ yǐjīng jiǎnchá, zhǐshìdēng zhuàngtài zhèngcháng.", "Nguồn điện và nút dừng khẩn cấp đã được kiểm tra, đèn chỉ thị bình thường."],
    action: ["我会按顺序启动，先空转确认没有异常。", "Wǒ huì àn shùnxù qǐdòng, xiān kōngzhuàn quèrèn méiyǒu yìcháng.", "Tôi sẽ khởi động đúng trình tự và chạy không tải để xác nhận không có bất thường."],
    notes: [
      { title: "Báo đã kiểm tra", pattern: "……已经检查，状态正常", explanation: "Nêu hạng mục đã kiểm tra và kết quả; không dùng câu này thay cho checklist bắt buộc tại nhà máy." },
      { title: "Nêu trình tự", pattern: "先……，然后……", explanation: "先 và 然后 giúp mô tả thứ tự thao tác rõ ràng trong bàn giao hoặc hướng dẫn." },
    ],
  },
  {
    moduleSlug: "an-toan-va-bat-dau-ca", slug: "bao-may-bat-thuong-va-dung-may", title: "Báo máy bất thường và dừng máy",
    summary: "Mô tả đúng thiết bị, hiện tượng và hành động an toàn đã thực hiện.", situation: "Phát hiện tiếng lạ khi máy chạy", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["yichang", "异常", "yìcháng", "bất thường", "设备出现异常情况。", "Thiết bị xuất hiện tình trạng bất thường."],
      ["tingji", "停机", "tíngjī", "dừng máy", "发现危险时要立即停机。", "Khi phát hiện nguy hiểm phải dừng máy ngay."],
      ["guzhang", "故障", "gùzhàng", "sự cố, hỏng hóc", "维修人员正在检查故障。", "Nhân viên bảo trì đang kiểm tra sự cố."],
      ["shengyin", "声音", "shēngyīn", "âm thanh", "机器有异常声音。", "Máy có âm thanh bất thường."],
      ["wendu", "温度", "wēndù", "nhiệt độ", "电机温度比平时高。", "Nhiệt độ động cơ cao hơn bình thường."],
      ["baogao", "报告", "bàogào", "báo cáo", "请马上向班长报告。", "Hãy báo ngay cho trưởng ca."],
    ],
    status: ["二号包装机有异常声音，电机温度也偏高。", "Èr hào bāozhuāngjī yǒu yìcháng shēngyīn, diànjī wēndù yě piān gāo.", "Máy đóng gói số 2 có tiếng bất thường và nhiệt độ động cơ cũng cao."],
    action: ["我已经按规程停机并报告班长，正在等待维修检查。", "Wǒ yǐjīng àn guīchéng tíngjī bìng bàogào bānzhǎng, zhèngzài děngdài wéixiū jiǎnchá.", "Tôi đã dừng máy theo quy trình, báo trưởng ca và đang chờ bảo trì kiểm tra."],
    notes: [
      { title: "Mô tả hiện tượng", pattern: "……有异常声音 / 温度偏高", explanation: "Nêu thiết bị và hiện tượng quan sát được; không tự kết luận nguyên nhân khi chưa kiểm tra." },
      { title: "Báo hành động an toàn", pattern: "我已经停机并报告……", explanation: "已经 cho biết hành động đã hoàn tất; 并 nối hai hành động dừng máy và báo cáo." },
    ],
  },
  {
    moduleSlug: "an-toan-va-bat-dau-ca", slug: "kiem-tra-an-toan-dau-ca", title: "Kiểm tra: An toàn đầu ca",
    summary: "Ôn trang bị bảo hộ, trình tự vận hành và cách báo bất thường trước khi vào nội dung sản xuất.", situation: "Đánh giá cuối module 1", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["anquan-shengchan", "安全生产", "ānquán shēngchǎn", "sản xuất an toàn", "安全生产比产量更重要。", "Sản xuất an toàn quan trọng hơn sản lượng."],
      ["jinzhi", "禁止", "jìnzhǐ", "cấm", "这里禁止未经许可启动设备。", "Khu vực này cấm khởi động thiết bị khi chưa được phép."],
      ["weixian-quyu", "危险区域", "wēixiǎn qūyù", "khu vực nguy hiểm", "不要进入危险区域。", "Không được vào khu vực nguy hiểm."],
      ["fuzeren", "负责人", "fùzérén", "người phụ trách", "发现异常要联系负责人。", "Khi phát hiện bất thường cần liên hệ người phụ trách."],
      ["geli", "隔离", "gélí", "cách ly", "故障设备已经隔离。", "Thiết bị hỏng đã được cách ly."],
      ["jingshipai", "警示牌", "jǐngshìpái", "biển cảnh báo", "请不要移动警示牌。", "Không được di chuyển biển cảnh báo."],
    ],
    status: ["故障设备已经停机隔离，现场放了警示牌。", "Gùzhàng shèbèi yǐjīng tíngjī gélí, xiànchǎng fàng le jǐngshìpái.", "Thiết bị sự cố đã dừng và cách ly, tại hiện trường đã đặt biển cảnh báo."],
    action: ["我们保持危险区域封闭，并等待负责人确认。", "Wǒmen bǎochí wēixiǎn qūyù fēngbì, bìng děngdài fùzérén quèrèn.", "Chúng tôi giữ khu vực nguy hiểm đóng và chờ người phụ trách xác nhận."],
    notes: [
      { title: "Cảnh báo cấm", pattern: "禁止…… / 不要……", explanation: "禁止 dùng trên quy định hoặc biển báo; 不要 dùng khi nhắc trực tiếp một hành động không nên làm." },
      { title: "Trạng thái cách ly", pattern: "已经停机隔离", explanation: "Báo thiết bị đã dừng và được tách khỏi vận hành; biện pháp cụ thể phải theo quy trình khóa/cô lập tại nơi làm việc." },
    ],
    challenge: safetyChallenge,
  },

  // Module 2: Vận hành & sản lượng
  {
    moduleSlug: "van-hanh-va-san-luong", slug: "doc-ke-hoach-san-xuat", title: "Đọc kế hoạch sản xuất",
    summary: "Xác nhận lệnh sản xuất, số lượng, số lô và thời hạn cần hoàn thành.", situation: "Nhận kế hoạch đầu ngày", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["shengchan-jihua", "生产计划", "shēngchǎn jìhuà", "kế hoạch sản xuất", "今天的生产计划已经下发。", "Kế hoạch sản xuất hôm nay đã được ban hành."],
      ["gongdan", "工单", "gōngdān", "lệnh sản xuất", "请核对工单上的产品型号。", "Hãy đối chiếu mã sản phẩm trên lệnh sản xuất."],
      ["pici", "批次", "pīcì", "lô, đợt", "这个批次一共有五百件。", "Lô này có tổng cộng 500 sản phẩm."],
      ["shuliang", "数量", "shùliàng", "số lượng", "实际数量和计划一致。", "Số lượng thực tế khớp với kế hoạch."],
      ["mubiao", "目标", "mùbiāo", "mục tiêu", "本班目标是完成两批。", "Mục tiêu ca này là hoàn thành hai lô."],
      ["jiaoqi", "交期", "jiāoqī", "thời hạn giao", "这张工单的交期是星期五。", "Hạn giao của lệnh này là thứ Sáu."],
    ],
    status: ["今天有两张工单，第一批需要在下午三点前完成。", "Jīntiān yǒu liǎng zhāng gōngdān, dì yì pī xūyào zài xiàwǔ sān diǎn qián wánchéng.", "Hôm nay có hai lệnh sản xuất, lô đầu cần hoàn thành trước 3 giờ chiều."],
    action: ["我先核对型号、数量和交期，再安排上线。", "Wǒ xiān héduì xínghào, shùliàng hé jiāoqī, zài ānpái shàngxiàn.", "Tôi sẽ đối chiếu mã hàng, số lượng và hạn giao trước khi sắp xếp lên chuyền."],
    notes: [
      { title: "Nêu mục tiêu ca", pattern: "本班目标是……", explanation: "Dùng để nói mục tiêu cụ thể của ca theo lô, số lượng hoặc thời điểm hoàn thành." },
      { title: "Chốt hạn", pattern: "需要在……之前完成", explanation: "在……之前 đặt mốc thời gian rõ ràng trước động từ 完成." },
    ],
  },
  {
    moduleSlug: "van-hanh-va-san-luong", slug: "cap-va-kiem-tra-nguyen-vat-lieu", title: "Cấp và kiểm tra nguyên vật liệu",
    summary: "Báo vật liệu đã nhận, lượng còn lại và nguy cơ thiếu liệu ảnh hưởng sản xuất.", situation: "Chuẩn bị vật liệu lên chuyền", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["yuan-cailiao", "原材料", "yuán cáiliào", "nguyên vật liệu", "原材料已经送到生产线。", "Nguyên vật liệu đã được đưa tới dây chuyền."],
      ["lingliao", "领料", "lǐngliào", "lĩnh vật liệu", "请按工单数量领料。", "Hãy lĩnh vật liệu theo số lượng trên lệnh."],
      ["touliao", "投料", "tóuliào", "nạp vật liệu", "投料前要再次确认批号。", "Trước khi nạp vật liệu cần xác nhận lại số lô."],
      ["yuliang", "余量", "yúliàng", "lượng còn lại", "当前余量只能生产一百件。", "Lượng còn lại hiện chỉ sản xuất được 100 sản phẩm."],
      ["queliao", "缺料", "quēliào", "thiếu vật liệu", "生产线因为缺料暂停。", "Dây chuyền tạm dừng vì thiếu vật liệu."],
      ["buchong", "补充", "bǔchōng", "bổ sung", "仓库会在十点前补充材料。", "Kho sẽ bổ sung vật liệu trước 10 giờ."],
    ],
    status: ["A材料的余量不够，可能影响第二张工单。", "A cáiliào de yúliàng bú gòu, kěnéng yǐngxiǎng dì èr zhāng gōngdān.", "Lượng vật liệu A còn lại không đủ và có thể ảnh hưởng lệnh thứ hai."],
    action: ["我已经通知仓库补充，投料前会再核对批号。", "Wǒ yǐjīng tōngzhī cāngkù bǔchōng, tóuliào qián huì zài héduì pīhào.", "Tôi đã báo kho bổ sung và sẽ đối chiếu lại số lô trước khi nạp liệu."],
    notes: [
      { title: "Báo thiếu liệu", pattern: "……余量不够，可能影响……", explanation: "Nêu rõ vật liệu, lượng thiếu và phạm vi ảnh hưởng thay vì chỉ nói chung chung là 缺料." },
      { title: "Xác nhận trước khi nạp", pattern: "投料前再核对……", explanation: "再核对 nhấn mạnh việc kiểm tra lại mã hoặc số lô ngay trước thao tác." },
    ],
  },
  {
    moduleSlug: "van-hanh-va-san-luong", slug: "theo-doi-thong-so-may", title: "Theo dõi thông số máy",
    summary: "Đọc thông số, so sánh với phạm vi tiêu chuẩn và báo khi cần điều chỉnh.", situation: "Kiểm tra bảng điều khiển", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["canshu", "参数", "cānshù", "thông số", "请每小时记录一次参数。", "Hãy ghi thông số mỗi giờ một lần."],
      ["zhuansu", "转速", "zhuǎnsù", "tốc độ quay", "当前转速是一千转。", "Tốc độ quay hiện tại là 1.000 vòng."],
      ["wendu-canshu", "温度", "wēndù", "nhiệt độ", "温度接近上限。", "Nhiệt độ đang gần giới hạn trên."],
      ["shuzhi", "数值", "shùzhí", "giá trị số", "这个数值比标准高。", "Giá trị này cao hơn tiêu chuẩn."],
      ["fanwei", "范围", "fànwéi", "phạm vi", "压力还在允许范围内。", "Áp suất vẫn trong phạm vi cho phép."],
      ["tiaozheng", "调整", "tiáozhěng", "điều chỉnh", "未经确认不要调整参数。", "Không điều chỉnh thông số khi chưa xác nhận."],
    ],
    status: ["温度接近上限，其他参数还在标准范围内。", "Wēndù jiējìn shàngxiàn, qítā cānshù hái zài biāozhǔn fànwéi nèi.", "Nhiệt độ gần giới hạn trên, các thông số khác vẫn trong phạm vi tiêu chuẩn."],
    action: ["我先记录数值并报告，不会自行调整参数。", "Wǒ xiān jìlù shùzhí bìng bàogào, bú huì zìxíng tiáozhěng cānshù.", "Tôi sẽ ghi lại giá trị và báo cáo, không tự ý điều chỉnh thông số."],
    notes: [
      { title: "So sánh với giới hạn", pattern: "接近上限 / 超出范围", explanation: "接近上限 là gần giới hạn trên; 超出范围 là đã vượt phạm vi." },
      { title: "Không tự ý chỉnh", pattern: "未经确认不要调整……", explanation: "未经确认 nghĩa là chưa được xác nhận; phù hợp để nhắc về quyền điều chỉnh thiết bị." },
    ],
  },
  {
    moduleSlug: "van-hanh-va-san-luong", slug: "bao-tien-do-va-san-luong", title: "Báo tiến độ và sản lượng",
    summary: "Cập nhật số lượng đã làm, tỷ lệ hoàn thành và nguyên nhân chậm tiến độ.", situation: "Trưởng ca hỏi tiến độ", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["chanliang", "产量", "chǎnliàng", "sản lượng", "本班产量是八百件。", "Sản lượng ca này là 800 sản phẩm."],
      ["wanchenglv", "完成率", "wánchénglǜ", "tỷ lệ hoàn thành", "目前完成率达到百分之九十。", "Tỷ lệ hoàn thành hiện đạt 90%."],
      ["jindu", "进度", "jìndù", "tiến độ", "生产进度比计划慢半小时。", "Tiến độ sản xuất chậm hơn kế hoạch nửa giờ."],
      ["yanwu", "延误", "yánwù", "chậm trễ", "缺料造成了二十分钟延误。", "Thiếu vật liệu gây chậm 20 phút."],
      ["dabiao", "达标", "dábiāo", "đạt tiêu chuẩn/mục tiêu", "今天的产量已经达标。", "Sản lượng hôm nay đã đạt mục tiêu."],
      ["huibao", "汇报", "huìbào", "báo cáo", "我会每两小时汇报一次进度。", "Tôi sẽ báo tiến độ mỗi hai giờ."],
    ],
    status: ["目前完成八百件，完成率是百分之八十。", "Mùqián wánchéng bābǎi jiàn, wánchénglǜ shì bǎifēnzhī bāshí.", "Hiện đã hoàn thành 800 sản phẩm, tỷ lệ hoàn thành là 80%."],
    action: ["缺料造成了延误，我会在两点再次汇报进度。", "Quēliào zàochéng le yánwù, wǒ huì zài liǎng diǎn zàicì huìbào jìndù.", "Thiếu vật liệu gây chậm; tôi sẽ báo lại tiến độ lúc 2 giờ."],
    notes: [
      { title: "Báo tỷ lệ", pattern: "完成率是百分之……", explanation: "百分之 đặt trước con số, ví dụ 百分之八十 là 80%." },
      { title: "Báo nguyên nhân và mốc mới", pattern: "……造成延误，我会在……再次汇报", explanation: "Cấu trúc giúp báo cả ảnh hưởng lẫn thời điểm cập nhật tiếp theo." },
    ],
  },
  {
    moduleSlug: "van-hanh-va-san-luong", slug: "chuyen-doi-ma-hang-va-doi-chuyen", title: "Chuyển đổi mã hàng và đổi chuyền",
    summary: "Trao đổi về đổi mã, dọn chuyền và xác nhận sản phẩm đầu tiên trước khi sản xuất hàng loạt.", situation: "Chuyển sang sản phẩm mới", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["xinghao", "型号", "xínghào", "mã/model sản phẩm", "下一批要换一个型号。", "Lô tiếp theo sẽ đổi sang model khác."],
      ["huanxian", "换线", "huànxiàn", "đổi chuyền", "换线需要四十分钟。", "Đổi chuyền cần 40 phút."],
      ["huanmo", "换模", "huànmú", "thay khuôn", "维修组正在准备换模。", "Nhóm bảo trì đang chuẩn bị thay khuôn."],
      ["qingchang", "清场", "qīngchǎng", "dọn sạch chuyền/khu vực", "换型号前必须完成清场。", "Phải dọn sạch khu vực trước khi đổi mã."],
      ["shoujian", "首件", "shǒujiàn", "sản phẩm đầu tiên", "首件已经送去检查。", "Sản phẩm đầu tiên đã được gửi kiểm tra."],
      ["shoujian-queren", "首件确认", "shǒujiàn quèrèn", "xác nhận sản phẩm đầu tiên", "首件确认后才能批量生产。", "Chỉ sản xuất hàng loạt sau khi xác nhận sản phẩm đầu tiên."],
    ],
    status: ["上一批已经结束，现在准备换模和清场。", "Shàng yì pī yǐjīng jiéshù, xiànzài zhǔnbèi huànmú hé qīngchǎng.", "Lô trước đã kết thúc, hiện đang chuẩn bị thay khuôn và dọn chuyền."],
    action: ["换线完成后先做首件，确认合格再批量生产。", "Huànxiàn wánchéng hòu xiān zuò shǒujiàn, quèrèn hégé zài pīliàng shēngchǎn.", "Sau khi đổi chuyền sẽ làm sản phẩm đầu tiên, xác nhận đạt rồi mới sản xuất hàng loạt."],
    notes: [
      { title: "Nêu điều kiện trước sản xuất", pattern: "确认合格再批量生产", explanation: "再 diễn tả hành động chỉ xảy ra sau khi điều kiện phía trước đã đạt." },
      { title: "Báo thời gian đổi chuyền", pattern: "换线预计需要……分钟", explanation: "预计需要 dùng để nêu thời gian dự kiến cho hoạt động đổi chuyền." },
    ],
  },
  {
    moduleSlug: "van-hanh-va-san-luong", slug: "kiem-tra-van-hanh-va-san-luong", title: "Kiểm tra: Vận hành & sản lượng",
    summary: "Ôn kế hoạch, vật liệu, thông số, sản lượng và điều kiện đổi mã an toàn.", situation: "Đánh giá cuối module 2", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["jiepai", "节拍", "jiépāi", "nhịp sản xuất", "当前生产节拍是每分钟十件。", "Nhịp sản xuất hiện là 10 sản phẩm mỗi phút."],
      ["channeng", "产能", "chǎnnéng", "năng lực sản xuất", "这条线每天产能是一万件。", "Năng lực dây chuyền này là 10.000 sản phẩm/ngày."],
      ["tingxian", "停线", "tíngxiàn", "dừng chuyền", "设备故障导致停线。", "Sự cố thiết bị khiến dây chuyền dừng."],
      ["dailiao", "待料", "dàiliào", "chờ vật liệu", "生产线目前处于待料状态。", "Dây chuyền hiện đang chờ vật liệu."],
      ["zhuijia", "追加", "zhuījiā", "bổ sung thêm", "客户临时追加了两百件。", "Khách tạm thời bổ sung thêm 200 sản phẩm."],
      ["paicheng", "排程", "páichéng", "lịch sản xuất", "需要根据交期调整排程。", "Cần điều chỉnh lịch sản xuất theo hạn giao."],
    ],
    status: ["生产线待料三十分钟，今天的排程可能受影响。", "Shēngchǎnxiàn dàiliào sānshí fēnzhōng, jīntiān de páichéng kěnéng shòu yǐngxiǎng.", "Dây chuyền chờ vật liệu 30 phút, lịch sản xuất hôm nay có thể bị ảnh hưởng."],
    action: ["我会更新产能和进度，再请负责人确认新的排程。", "Wǒ huì gēngxīn chǎnnéng hé jìndù, zài qǐng fùzérén quèrèn xīn de páichéng.", "Tôi sẽ cập nhật năng lực và tiến độ rồi xin người phụ trách xác nhận lịch mới."],
    notes: [
      { title: "Báo trạng thái dây chuyền", pattern: "生产线处于……状态", explanation: "Đặt 待料, 停线 hoặc 运行 sau 处于 để báo trạng thái hiện tại." },
      { title: "Nêu ảnh hưởng kế hoạch", pattern: "排程可能受影响", explanation: "受影响 nghĩa là bị ảnh hưởng; có thể bổ sung nguyên nhân trước câu này." },
    ],
    challenge: operationChallenge,
  },

  // Module 3: Chất lượng & xử lý sự cố
  {
    moduleSlug: "chat-luong-va-su-co", slug: "kiem-tra-ngoai-quan-san-pham", title: "Kiểm tra ngoại quan sản phẩm",
    summary: "Mô tả vết xước, vết bẩn, biến dạng và yêu cầu lấy mẫu kiểm tra.", situation: "Kiểm tra sản phẩm sau công đoạn", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["waiguan-jiancha", "外观检查", "wàiguān jiǎnchá", "kiểm tra ngoại quan", "这批产品需要做外观检查。", "Lô sản phẩm này cần kiểm tra ngoại quan."],
      ["huahen", "划痕", "huáhén", "vết xước", "表面有一条明显的划痕。", "Bề mặt có một vết xước rõ."],
      ["wuzi", "污渍", "wūzì", "vết bẩn", "产品上不能有油污渍。", "Sản phẩm không được có vết dầu bẩn."],
      ["bianxing", "变形", "biànxíng", "biến dạng", "这个零件有轻微变形。", "Chi tiết này bị biến dạng nhẹ."],
      ["chicun", "尺寸", "chǐcùn", "kích thước", "请再测量一次尺寸。", "Hãy đo lại kích thước một lần nữa."],
      ["choujian", "抽检", "chōujiǎn", "kiểm tra lấy mẫu", "每批需要抽检十件。", "Mỗi lô cần lấy mẫu kiểm tra 10 sản phẩm."],
    ],
    status: ["抽检的十件里有两件表面出现划痕。", "Chōujiǎn de shí jiàn lǐ yǒu liǎng jiàn biǎomiàn chūxiàn huáhén.", "Trong 10 sản phẩm lấy mẫu có hai sản phẩm xuất hiện vết xước bề mặt."],
    action: ["我先保留样品，并扩大外观检查范围。", "Wǒ xiān bǎoliú yàngpǐn, bìng kuòdà wàiguān jiǎnchá fànwéi.", "Tôi sẽ giữ lại mẫu và mở rộng phạm vi kiểm tra ngoại quan."],
    notes: [
      { title: "Báo tỷ lệ mẫu lỗi", pattern: "抽检的……件里有……件……", explanation: "Cấu trúc nêu tổng số mẫu, số lỗi và loại hiện tượng một cách rõ ràng." },
      { title: "Mức độ lỗi", pattern: "轻微 / 明显 + 缺陷", explanation: "轻微 là nhẹ, 明显 là rõ rệt; chỉ dùng theo tiêu chí đánh giá của nhà máy." },
    ],
  },
  {
    moduleSlug: "chat-luong-va-su-co", slug: "ghi-nhan-san-pham-loi", title: "Ghi nhận sản phẩm lỗi",
    summary: "Gọi tên lỗi, số lượng, nguyên nhân sơ bộ và thông tin cần ghi trên nhãn.", situation: "Phát hiện lỗi trong lô", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["buliangpin", "不良品", "bùliángpǐn", "sản phẩm lỗi", "不良品不能放进合格品区。", "Sản phẩm lỗi không được đặt vào khu hàng đạt."],
      ["quexian", "缺陷", "quēxiàn", "khuyết tật, lỗi", "请记录缺陷的具体位置。", "Hãy ghi vị trí cụ thể của lỗi."],
      ["buliang-shuliang", "不良数量", "bùliáng shùliàng", "số lượng lỗi", "本批不良数量是十二件。", "Số lượng lỗi của lô này là 12 sản phẩm."],
      ["yuanyin", "原因", "yuányīn", "nguyên nhân", "目前还不能确认原因。", "Hiện vẫn chưa thể xác nhận nguyên nhân."],
      ["biaoqian", "标签", "biāoqiān", "nhãn", "请在箱子上贴上红色标签。", "Hãy dán nhãn đỏ lên thùng."],
      ["dengji", "登记", "dēngjì", "đăng ký, ghi sổ", "所有不良品都要登记。", "Tất cả sản phẩm lỗi đều phải ghi nhận."],
    ],
    status: ["这个批次发现十二件不良品，主要缺陷是表面变形。", "Zhège pīcì fāxiàn shí'èr jiàn bùliángpǐn, zhǔyào quēxiàn shì biǎomiàn biànxíng.", "Lô này phát hiện 12 sản phẩm lỗi, lỗi chính là biến dạng bề mặt."],
    action: ["我会登记数量、贴上标签，原因暂时不做判断。", "Wǒ huì dēngjì shùliàng, tiē shàng biāoqiān, yuányīn zànshí bú zuò pànduàn.", "Tôi sẽ ghi số lượng, dán nhãn và tạm thời không kết luận nguyên nhân."],
    notes: [
      { title: "Báo lỗi có dữ liệu", pattern: "发现……件不良品，主要缺陷是……", explanation: "Nêu số lượng và loại lỗi giúp người nhận đánh giá mức ảnh hưởng." },
      { title: "Tránh kết luận sớm", pattern: "原因暂时不能确认", explanation: "暂时 biểu thị hiện tại chưa đủ căn cứ; phù hợp trước khi điều tra nguyên nhân." },
    ],
  },
  {
    moduleSlug: "chat-luong-va-su-co", slug: "cach-ly-hang-khong-dat", title: "Cách ly hàng không đạt",
    summary: "Phân biệt trạng thái đạt/không đạt, cách ly lô và chờ quyết định xử lý.", situation: "Ngăn trộn lẫn hàng lỗi", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["geliqu", "隔离区", "gélíqū", "khu cách ly", "待判产品要放在隔离区。", "Sản phẩm chờ phán định phải đặt tại khu cách ly."],
      ["hege", "合格", "hégé", "đạt yêu cầu", "检验结果显示产品合格。", "Kết quả kiểm tra cho thấy sản phẩm đạt."],
      ["buhege", "不合格", "bù hégé", "không đạt", "这批材料被判定为不合格。", "Lô vật liệu này được xác định không đạt."],
      ["fangxing", "放行", "fàngxíng", "cho phép chuyển tiếp/xuất", "没有签字不能放行。", "Không được cho chuyển tiếp khi chưa có chữ ký."],
      ["fangong", "返工", "fǎngōng", "làm lại, sửa lại", "这批产品需要返工。", "Lô sản phẩm này cần làm lại."],
      ["daipan", "待判", "dàipàn", "chờ phán định", "标签上要写清楚待判。", "Trên nhãn phải ghi rõ chờ phán định."],
    ],
    status: ["这批产品检验不合格，目前处于待判状态。", "Zhè pī chǎnpǐn jiǎnyàn bù hégé, mùqián chǔyú dàipàn zhuàngtài.", "Lô sản phẩm này kiểm tra không đạt và hiện đang chờ phán định."],
    action: ["我会移到隔离区，没有放行决定前不再流转。", "Wǒ huì yí dào gélíqū, méiyǒu fàngxíng juédìng qián bú zài liúzhuǎn.", "Tôi sẽ chuyển tới khu cách ly và không cho lưu chuyển trước khi có quyết định."],
    notes: [
      { title: "Báo trạng thái chờ", pattern: "目前处于待判状态", explanation: "处于……状态 dùng để báo lô đang ở trạng thái quản lý nào." },
      { title: "Nêu điều kiện cho lưu chuyển", pattern: "没有……前不能放行", explanation: "Cấu trúc đặt điều kiện kiểm soát trước hành động 放行." },
    ],
  },
  {
    moduleSlug: "chat-luong-va-su-co", slug: "bao-loi-lap-lai-va-truy-xuat", title: "Báo lỗi lặp lại và truy xuất",
    summary: "Báo tần suất, xu hướng lỗi và thông tin số lô cần truy xuất.", situation: "Cùng một lỗi xuất hiện nhiều lần", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["chongfu-fasheng", "重复发生", "chóngfù fāshēng", "xảy ra lặp lại", "这个问题本周重复发生了三次。", "Vấn đề này lặp lại ba lần trong tuần."],
      ["pinlv", "频率", "pínlǜ", "tần suất", "故障发生频率正在上升。", "Tần suất sự cố đang tăng."],
      ["qushi", "趋势", "qūshì", "xu hướng", "数据里出现了上升趋势。", "Dữ liệu xuất hiện xu hướng tăng."],
      ["zhuisu", "追溯", "zhuīsù", "truy xuất", "可以根据批号追溯材料。", "Có thể truy xuất vật liệu theo số lô."],
      ["pihao", "批号", "pīhào", "số lô", "请记录所有受影响的批号。", "Hãy ghi tất cả số lô bị ảnh hưởng."],
      ["tongzhi", "通知", "tōngzhī", "thông báo", "需要马上通知质量部门。", "Cần thông báo ngay cho bộ phận chất lượng."],
    ],
    status: ["同样的划痕连续三个批次重复发生，频率在上升。", "Tóngyàng de huáhén liánxù sān ge pīcì chóngfù fāshēng, pínlǜ zài shàngshēng.", "Cùng lỗi xước lặp lại trong ba lô liên tiếp và tần suất đang tăng."],
    action: ["我会记录批号，通知质量部门并开始追溯。", "Wǒ huì jìlù pīhào, tōngzhī zhìliàng bùmén bìng kāishǐ zhuīsù.", "Tôi sẽ ghi số lô, báo bộ phận chất lượng và bắt đầu truy xuất."],
    notes: [
      { title: "Báo lỗi tái diễn", pattern: "连续……个批次重复发生", explanation: "连续 nhấn mạnh lỗi xuất hiện liền nhau qua nhiều lô." },
      { title: "Báo xu hướng", pattern: "发生频率在上升 / 下降", explanation: "上升 là tăng, 下降 là giảm; nên đi kèm dữ liệu hoặc phạm vi thời gian." },
    ],
  },
  {
    moduleSlug: "chat-luong-va-su-co", slug: "phoi-hop-voi-bo-phan-bao-tri", title: "Phối hợp với bộ phận bảo trì",
    summary: "Mô tả sự cố, xác nhận linh kiện cần thay và điều kiện phục hồi sản xuất.", situation: "Bảo trì kiểm tra thiết bị", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["weixiu", "维修", "wéixiū", "sửa chữa, bảo trì", "设备已经交给维修组检查。", "Thiết bị đã được giao nhóm bảo trì kiểm tra."],
      ["baoyang", "保养", "bǎoyǎng", "bảo dưỡng", "这台机器每月保养一次。", "Máy này được bảo dưỡng mỗi tháng."],
      ["jishuyuan", "技术员", "jìshùyuán", "kỹ thuật viên", "技术员正在查找故障原因。", "Kỹ thuật viên đang tìm nguyên nhân sự cố."],
      ["lingjian", "零件", "língjiàn", "linh kiện", "这个零件已经磨损。", "Linh kiện này đã mòn."],
      ["genghuan", "更换", "gēnghuàn", "thay thế", "需要更换新的传感器。", "Cần thay cảm biến mới."],
      ["huifu", "恢复", "huīfù", "khôi phục", "确认安全后才能恢复生产。", "Chỉ khôi phục sản xuất sau khi xác nhận an toàn."],
    ],
    status: ["技术员发现传感器故障，需要更换一个零件。", "Jìshùyuán fāxiàn chuángǎnqì gùzhàng, xūyào gēnghuàn yí ge língjiàn.", "Kỹ thuật viên phát hiện lỗi cảm biến và cần thay một linh kiện."],
    action: ["更换后先按规程确认设备状态，再恢复生产。", "Gēnghuàn hòu xiān àn guīchéng quèrèn shèbèi zhuàngtài, zài huīfù shēngchǎn.", "Sau khi thay sẽ xác nhận trạng thái thiết bị theo quy trình rồi mới phục hồi sản xuất."],
    notes: [
      { title: "Báo nhu cầu thay thế", pattern: "需要更换……", explanation: "Dùng để nêu linh kiện cần thay; có thể bổ sung nguyên nhân đã được kỹ thuật viên xác nhận." },
      { title: "Điều kiện chạy lại", pattern: "确认……后才能恢复生产", explanation: "才能 nhấn mạnh chỉ được phục hồi khi điều kiện phía trước đã thỏa mãn." },
    ],
  },
  {
    moduleSlug: "chat-luong-va-su-co", slug: "kiem-tra-chat-luong-va-xu-ly-su-co", title: "Kiểm tra: Chất lượng & xử lý sự cố",
    summary: "Ôn kiểm tra, cách ly, truy xuất nguyên nhân và phối hợp hành động khắc phục.", situation: "Đánh giá cuối module 3", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["zhiliang-biaozhun", "质量标准", "zhìliàng biāozhǔn", "tiêu chuẩn chất lượng", "产品必须符合质量标准。", "Sản phẩm phải phù hợp tiêu chuẩn chất lượng."],
      ["jianyan-jieguo", "检验结果", "jiǎnyàn jiéguǒ", "kết quả kiểm tra", "检验结果还没有出来。", "Kết quả kiểm tra vẫn chưa có."],
      ["genben-yuanyin", "根本原因", "gēnběn yuányīn", "nguyên nhân gốc", "团队正在分析根本原因。", "Nhóm đang phân tích nguyên nhân gốc."],
      ["linshi-cuoshi", "临时措施", "línshí cuòshī", "biện pháp tạm thời", "先采取临时措施控制风险。", "Trước tiên áp dụng biện pháp tạm thời để kiểm soát rủi ro."],
      ["jiuzheng-cuoshi", "纠正措施", "jiūzhèng cuòshī", "hành động khắc phục", "纠正措施需要负责人批准。", "Hành động khắc phục cần người phụ trách phê duyệt."],
      ["fucha", "复查", "fùchá", "kiểm tra lại", "返工以后要进行复查。", "Sau khi làm lại cần kiểm tra lại."],
    ],
    status: ["临时措施已经执行，但根本原因还在分析。", "Línshí cuòshī yǐjīng zhíxíng, dàn gēnběn yuányīn hái zài fēnxī.", "Biện pháp tạm thời đã được thực hiện nhưng nguyên nhân gốc vẫn đang phân tích."],
    action: ["纠正措施批准后会执行，返工产品还要复查。", "Jiūzhèng cuòshī pīzhǔn hòu huì zhíxíng, fǎngōng chǎnpǐn hái yào fùchá.", "Hành động khắc phục sẽ thực hiện sau khi phê duyệt; sản phẩm làm lại còn phải kiểm tra lại."],
    notes: [
      { title: "Phân biệt biện pháp", pattern: "临时措施 / 纠正措施", explanation: "临时措施 kiểm soát trước mắt; 纠正措施 xử lý nguyên nhân đã được xác định theo hệ thống chất lượng." },
      { title: "Báo việc còn mở", pattern: "……已经执行，但……还在……", explanation: "已经 báo phần đã xong, 但 và 还在 nêu phần vẫn đang tiếp tục." },
    ],
    challenge: qualityChallenge,
  },

  // Module 4: Bàn giao & cải tiến
  {
    moduleSlug: "ban-giao-va-cai-tien", slug: "ban-giao-ca-san-xuat", title: "Bàn giao ca sản xuất",
    summary: "Bàn giao sản lượng, việc chưa hoàn thành, hàng đang xử lý và điểm ca sau cần chú ý.", situation: "Kết thúc ca và giao việc", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["banci", "班次", "bāncì", "ca làm", "今天夜班班次提前十分钟开始。", "Ca đêm hôm nay bắt đầu sớm 10 phút."],
      ["wei-wancheng", "未完成", "wèi wánchéng", "chưa hoàn thành", "还有一张工单未完成。", "Vẫn còn một lệnh sản xuất chưa hoàn thành."],
      ["zaizhipin", "在制品", "zàizhìpǐn", "sản phẩm dở dang", "在制品放在三号区域。", "Sản phẩm dở dang đặt tại khu số 3."],
      ["zhuyi-shixiang", "注意事项", "zhùyì shìxiàng", "điểm cần chú ý", "交接时要说明注意事项。", "Khi bàn giao phải nêu điểm cần chú ý."],
      ["jiebanren", "接班人", "jiēbānrén", "người nhận ca", "接班人已经确认设备状态。", "Người nhận ca đã xác nhận trạng thái thiết bị."],
      ["qianzi", "签字", "qiānzì", "ký tên", "双方确认以后再签字。", "Hai bên xác nhận rồi mới ký."],
    ],
    status: ["本班完成两张工单，还有一批在制品等质检。", "Běn bān wánchéng liǎng zhāng gōngdān, hái yǒu yì pī zàizhìpǐn děng zhìjiǎn.", "Ca này hoàn thành hai lệnh; còn một lô dở dang chờ kiểm tra chất lượng."],
    action: ["我会向接班人说明位置和注意事项，双方确认后签字。", "Wǒ huì xiàng jiēbānrén shuōmíng wèizhì hé zhùyì shìxiàng, shuāngfāng quèrèn hòu qiānzì.", "Tôi sẽ nói rõ vị trí và điểm cần chú ý cho người nhận ca; hai bên xác nhận rồi ký."],
    notes: [
      { title: "Cấu trúc bàn giao", pattern: "已完成……，还有……未完成", explanation: "Tách rõ việc đã xong và việc còn mở để ca sau không bỏ sót." },
      { title: "Xác nhận hai chiều", pattern: "双方确认后签字", explanation: "双方 là hai bên; câu này thể hiện bàn giao chỉ hoàn tất sau khi cùng xác nhận." },
    ],
  },
  {
    moduleSlug: "ban-giao-va-cai-tien", slug: "ve-sinh-5s-khu-vuc", title: "Vệ sinh và 5S tại khu vực",
    summary: "Trao đổi công việc sắp xếp, định vị dụng cụ, vệ sinh và duy trì khu vực làm việc.", situation: "Kiểm tra 5S cuối ca", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["zhengli-5s", "整理", "zhěnglǐ", "sàng lọc, sắp xếp", "先整理不需要的物品。", "Trước tiên sàng lọc vật dụng không cần thiết."],
      ["zhengdun", "整顿", "zhěngdùn", "bố trí ngăn nắp", "工具要按照标识整顿。", "Dụng cụ phải được bố trí theo ký hiệu."],
      ["qingsao", "清扫", "qīngsǎo", "quét dọn, vệ sinh", "停机后清扫设备周围。", "Sau khi dừng máy, vệ sinh quanh thiết bị."],
      ["qingjie", "清洁", "qīngjié", "sạch sẽ, duy trì sạch", "每天保持工作台清洁。", "Duy trì bàn làm việc sạch mỗi ngày."],
      ["suyang", "素养", "sùyǎng", "kỷ luật/thói quen 5S", "遵守标准是素养的一部分。", "Tuân thủ tiêu chuẩn là một phần của kỷ luật 5S."],
      ["dingwei", "定位", "dìngwèi", "định vị", "所有工具都要定点定位。", "Tất cả dụng cụ phải có vị trí cố định."],
    ],
    status: ["工具已经整理，但两件量具还没有放回定位区。", "Gōngjù yǐjīng zhěnglǐ, dàn liǎng jiàn liángjù hái méiyǒu fàng huí dìngwèi qū.", "Dụng cụ đã được sắp xếp nhưng hai dụng cụ đo chưa trả về vị trí."],
    action: ["我会完成整顿和清扫，再按检查表确认。", "Wǒ huì wánchéng zhěngdùn hé qīngsǎo, zài àn jiǎnchábiǎo quèrèn.", "Tôi sẽ hoàn thành bố trí và vệ sinh rồi xác nhận theo bảng kiểm."],
    notes: [
      { title: "Báo điểm chưa đạt", pattern: "……已经……，但……还没有……", explanation: "Cấu trúc báo phần đã làm và điểm vẫn chưa hoàn thành trong kiểm tra 5S." },
      { title: "Định vị dụng cụ", pattern: "放回定位区", explanation: "放回 là đặt trở lại; 定位区 là khu/vị trí đã quy định." },
    ],
  },
  {
    moduleSlug: "ban-giao-va-cai-tien", slug: "theo-doi-phe-pham-va-hao-hut", title: "Theo dõi phế phẩm và hao hụt",
    summary: "Báo lượng phế phẩm, tỷ lệ hao hụt và biện pháp giảm lãng phí vật liệu.", situation: "Tổng hợp số liệu cuối ngày", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["feipin", "废品", "fèipǐn", "phế phẩm", "今天产生了二十件废品。", "Hôm nay phát sinh 20 phế phẩm."],
      ["sunhao", "损耗", "sǔnhào", "hao hụt", "材料损耗比昨天高。", "Hao hụt vật liệu cao hơn hôm qua."],
      ["baofei", "报废", "bàofèi", "loại bỏ, báo phế", "产品报废需要经过批准。", "Báo phế sản phẩm cần được phê duyệt."],
      ["huishou", "回收", "huíshōu", "thu hồi, tái thu", "可以回收的材料要分类。", "Vật liệu có thể thu hồi cần được phân loại."],
      ["bili", "比例", "bǐlì", "tỷ lệ", "本周废品比例下降了。", "Tỷ lệ phế phẩm tuần này đã giảm."],
      ["jiangdi", "降低", "jiàngdī", "giảm xuống", "我们要降低换线时的损耗。", "Chúng ta cần giảm hao hụt khi đổi chuyền."],
    ],
    status: ["今天废品比例是百分之二，比昨天高零点五。", "Jīntiān fèipǐn bǐlì shì bǎifēnzhī èr, bǐ zuótiān gāo líng diǎn wǔ.", "Tỷ lệ phế phẩm hôm nay là 2%, cao hơn hôm qua 0,5 điểm."],
    action: ["我会按原因分类记录，并重点检查换线时的材料损耗。", "Wǒ huì àn yuányīn fēnlèi jìlù, bìng zhòngdiǎn jiǎnchá huànxiàn shí de cáiliào sǔnhào.", "Tôi sẽ ghi theo nhóm nguyên nhân và tập trung kiểm tra hao hụt lúc đổi chuyền."],
    notes: [
      { title: "Báo tỷ lệ phế phẩm", pattern: "废品比例是百分之……", explanation: "Kết hợp tỷ lệ với mốc so sánh như hôm qua hoặc mục tiêu để người nghe hiểu xu hướng." },
      { title: "Phân loại theo nguyên nhân", pattern: "按原因分类记录", explanation: "按……分类 là phân loại theo một tiêu chí, ở đây là nguyên nhân." },
    ],
  },
  {
    moduleSlug: "ban-giao-va-cai-tien", slug: "de-xuat-cai-tien-cong-doan", title: "Đề xuất cải tiến công đoạn",
    summary: "Nêu lãng phí quan sát được, đề xuất thử nghiệm nhỏ và cách đánh giá hiệu quả.", situation: "Họp cải tiến tại chuyền", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["gaishan", "改善", "gǎishàn", "cải tiến", "这个方法可以改善工作流程。", "Phương pháp này có thể cải tiến quy trình."],
      ["jianyi", "建议", "jiànyì", "đề xuất", "我有一个减少等待的建议。", "Tôi có một đề xuất giảm thời gian chờ."],
      ["xiaolv", "效率", "xiàolǜ", "hiệu suất", "调整位置以后效率提高了。", "Sau khi điều chỉnh vị trí, hiệu suất tăng."],
      ["langfei", "浪费", "làngfèi", "lãng phí", "来回搬运造成时间浪费。", "Di chuyển qua lại gây lãng phí thời gian."],
      ["shixing", "试行", "shìxíng", "thử áp dụng", "建议先在一条线试行。", "Đề nghị thử trên một dây chuyền trước."],
      ["xiaoguo", "效果", "xiàoguǒ", "hiệu quả", "试行一周后确认效果。", "Sau một tuần thử sẽ xác nhận hiệu quả."],
    ],
    status: ["操作员每天要来回取工具，造成等待和动作浪费。", "Cāozuòyuán měitiān yào láihuí qǔ gōngjù, zàochéng děngdài hé dòngzuò làngfèi.", "Mỗi ngày người vận hành phải đi lại lấy dụng cụ, gây lãng phí chờ và thao tác."],
    action: ["我建议调整工具位置，先试行一周再确认效果。", "Wǒ jiànyì tiáozhěng gōngjù wèizhì, xiān shìxíng yì zhōu zài quèrèn xiàoguǒ.", "Tôi đề xuất điều chỉnh vị trí dụng cụ, thử một tuần rồi đánh giá hiệu quả."],
    notes: [
      { title: "Nêu vấn đề và tác động", pattern: "……造成……浪费", explanation: "造成 nối nguyên nhân với loại lãng phí quan sát được." },
      { title: "Đề xuất thử có kiểm soát", pattern: "建议先……试行，再确认效果", explanation: "先…再… giúp trình bày thử nghiệm nhỏ trước khi quyết định chuẩn hóa." },
    ],
  },
  {
    moduleSlug: "ban-giao-va-cai-tien", slug: "ung-pho-tinh-huong-khan-cap", title: "Ứng phó tình huống khẩn cấp",
    summary: "Nhận biết cảnh báo, báo động, sơ tán và làm theo quy trình ứng phó tại nhà máy.", situation: "Còi cảnh báo tại khu sản xuất", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["jinji-qingkuang", "紧急情况", "jǐnjí qíngkuàng", "tình huống khẩn cấp", "紧急情况要保持冷静。", "Trong tình huống khẩn cấp cần giữ bình tĩnh."],
      ["baojing", "报警", "bàojǐng", "báo động", "发现火情要立即报警。", "Khi phát hiện cháy phải báo động ngay."],
      ["shusan", "疏散", "shūsàn", "sơ tán", "请按指定路线疏散。", "Hãy sơ tán theo tuyến được chỉ định."],
      ["jihedian", "集合点", "jíhédiǎn", "điểm tập kết", "疏散后到集合点报到。", "Sau sơ tán hãy có mặt tại điểm tập kết."],
      ["qieduan-dianyuan", "切断电源", "qiēduàn diànyuán", "ngắt nguồn điện", "只有授权人员可以切断电源。", "Chỉ người được ủy quyền mới được ngắt nguồn điện."],
      ["jijiu", "急救", "jíjiù", "sơ cứu", "需要急救时马上联系指定人员。", "Khi cần sơ cứu hãy liên hệ người được chỉ định ngay."],
    ],
    status: ["车间报警已经响起，现场正在按应急程序疏散。", "Chējiān bàojǐng yǐjīng xiǎngqǐ, xiànchǎng zhèngzài àn yìngjí chéngxù shūsàn.", "Cảnh báo trong xưởng đã vang lên, hiện trường đang sơ tán theo quy trình khẩn cấp."],
    action: ["我会沿指定路线到集合点，并向负责人报到。", "Wǒ huì yán zhǐdìng lùxiàn dào jíhédiǎn, bìng xiàng fùzérén bàodào.", "Tôi sẽ đi theo tuyến chỉ định tới điểm tập kết và báo có mặt với người phụ trách."],
    notes: [
      { title: "Tuân theo quy trình tại chỗ", pattern: "按应急程序……", explanation: "按 nghĩa là theo. Nội dung học không thay thế sơ đồ sơ tán hoặc huấn luyện tại từng nhà máy." },
      { title: "Báo có mặt", pattern: "到集合点报到", explanation: "报到 là báo có mặt để người phụ trách kiểm đếm sau sơ tán." },
    ],
  },
  {
    moduleSlug: "ban-giao-va-cai-tien", slug: "kiem-tra-tong-hop-nha-may-san-xuat", title: "Kiểm tra tổng hợp: Nhà máy & sản xuất",
    summary: "Tổng hợp giao tiếp an toàn, vận hành, chất lượng, bàn giao và cải tiến tại xưởng.", situation: "Đánh giá cuối lộ trình", estimatedMinutes: 16, isFree: false,
    vocabulary: [
      ["anquan-fengxian", "安全风险", "ānquán fēngxiǎn", "rủi ro an toàn", "开始工作前先识别安全风险。", "Nhận diện rủi ro an toàn trước khi bắt đầu."],
      ["zhiliang-fengxian", "质量风险", "zhìliàng fēngxiǎn", "rủi ro chất lượng", "混料会带来质量风险。", "Trộn vật liệu gây rủi ro chất lượng."],
      ["shengchan-yichang", "生产异常", "shēngchǎn yìcháng", "bất thường sản xuất", "生产异常已经记录并上报。", "Bất thường sản xuất đã được ghi và báo lên."],
      ["shengji-baogao", "升级报告", "shēngjí bàogào", "báo cáo nâng cấp", "风险扩大时需要升级报告。", "Khi rủi ro mở rộng cần báo cáo lên cấp cao hơn."],
      ["genjin", "跟进", "gēnjìn", "theo dõi tiếp", "下一班继续跟进检验结果。", "Ca sau tiếp tục theo dõi kết quả kiểm tra."],
      ["fupan", "复盘", "fùpán", "xem xét lại, rút kinh nghiệm", "问题关闭后团队进行复盘。", "Sau khi đóng vấn đề, nhóm xem xét rút kinh nghiệm."],
    ],
    status: ["异常已经控制，但质量风险和受影响批次还要继续确认。", "Yìcháng yǐjīng kòngzhì, dàn zhìliàng fēngxiǎn hé shòu yǐngxiǎng pīcì hái yào jìxù quèrèn.", "Bất thường đã được kiểm soát nhưng rủi ro chất lượng và các lô ảnh hưởng còn cần xác nhận."],
    action: ["我会升级报告，安排下一班跟进，问题关闭后再复盘。", "Wǒ huì shēngjí bàogào, ānpái xià yì bān gēnjìn, wèntí guānbì hòu zài fùpán.", "Tôi sẽ báo cáo nâng cấp, sắp xếp ca sau theo dõi và tổng kết sau khi đóng vấn đề."],
    notes: [
      { title: "Báo trạng thái kiểm soát", pattern: "异常已经控制，但……还要确认", explanation: "Không đồng nhất việc đã kiểm soát hiện tượng với việc đã xác định hết phạm vi ảnh hưởng." },
      { title: "Khép vòng xử lý", pattern: "报告—跟进—关闭—复盘", explanation: "Bốn từ giúp ghi nhớ chuỗi giao tiếp từ báo cáo, theo dõi, đóng vấn đề đến rút kinh nghiệm." },
    ],
    challenge: finalChallenge,
  },
];

export const factoryLessons = factoryLessonInputs.map(createLesson);

export const factoryCourseStats = {
  lessons: factoryLessons.length,
  minutes: factoryLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: factoryLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: new Set(factoryLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.slug))).size,
  modules: factoryModules.length,
};
