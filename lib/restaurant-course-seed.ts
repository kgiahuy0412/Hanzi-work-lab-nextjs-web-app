import type { LessonChallenge, UsageNote, Vocabulary } from "./content-types.ts";
import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";

type RestaurantWordInput = [slug: string, hanzi: string, pinyin: string, meaning: string, example: string, translation: string];
type RestaurantLine = [hanzi: string, pinyin: string, translation: string];

type RestaurantLessonInput = Omit<CourseLessonSeed, "content" | "vocabulary"> & {
  vocabulary: RestaurantWordInput[];
  request: RestaurantLine;
  response: RestaurantLine;
  notes: [UsageNote, UsageNote];
  challenge?: LessonChallenge;
};

const note = (title: string, pattern: string, explanation: string): UsageNote => ({ title, pattern, explanation });

function toVocabulary(input: RestaurantWordInput): Vocabulary {
  const [slug, hanzi, pinyin, meaning, example, translation] = input;
  return { slug: `restaurant-${slug}`, hanzi, pinyin, meaning, example, translation, audioUrl: null };
}

function createLesson(input: RestaurantLessonInput): CourseLessonSeed {
  const { request, response, challenge, notes, ...lesson } = input;
  return {
    ...lesson,
    vocabulary: lesson.vocabulary.map(toVocabulary),
    content: {
      dialogue: [
        { speaker: "A", hanzi: "客人现在需要什么帮助？", pinyin: "Kèrén xiànzài xūyào shénme bāngzhù?", translation: "Hiện tại khách cần hỗ trợ gì?" },
        { speaker: "B", hanzi: request[0], pinyin: request[1], translation: request[2] },
        { speaker: "A", hanzi: "我们应该怎么处理？", pinyin: "Wǒmen yīnggāi zěnme chǔlǐ?", translation: "Chúng ta nên xử lý thế nào?" },
        { speaker: "B", hanzi: response[0], pinyin: response[1], translation: response[2] },
      ],
      notes,
      ...(challenge ? { challenge } : {}),
    },
  };
}

const arrivalChallenge: LessonChallenge = {
  title: "Kiểm tra đón khách & xếp bàn",
  description: "Đạt 4/5 câu để chuyển sang gọi món và xác nhận yêu cầu.",
  passScore: 4,
  questions: [
    { prompt: "请问几位？ dùng để hỏi gì?", options: ["Có bao nhiêu khách", "Đã gọi món chưa", "Muốn thanh toán thế nào"], correctOption: 0, explanation: "几位 là cách lịch sự để hỏi số người trong nhóm khách." },
    { prompt: "Khách đã đặt bàn. Nên hỏi gì trước?", options: ["请问预订姓名和时间？", "您要结账吗？", "菜已经上齐了。"], correctOption: 0, explanation: "Tên và thời gian đặt giúp lễ tân tìm đúng thông tin." },
    { prompt: "靠窗的座位 nghĩa là gì?", options: ["Chỗ ngồi gần cửa sổ", "Phòng riêng", "Khu vực chờ"], correctOption: 0, explanation: "靠窗 mô tả vị trí sát hoặc gần cửa sổ." },
    { prompt: "预计等十五分钟 nghĩa là gì?", options: ["Dự kiến chờ 15 phút", "Đã chờ 15 phút", "Bàn giữ trong 15 phút"], correctOption: 0, explanation: "预计 là dự kiến; 等 là chờ." },
    { prompt: "Khi chưa có bàn, cách nói phù hợp là gì?", options: ["我先为您排号，有空位马上通知您。", "没有位置，您走吧。", "一定一分钟就有桌。"], correctOption: 0, explanation: "Câu này nêu hành động và cách thông báo mà không hứa thời gian thiếu căn cứ." },
  ],
};

const orderingChallenge: LessonChallenge = {
  title: "Kiểm tra gọi món & yêu cầu ăn uống",
  description: "Đạt 4/5 câu để chuyển sang phục vụ tại bàn.",
  passScore: 4,
  questions: [
    { prompt: "招牌菜 nghĩa là gì?", options: ["Món đặc trưng", "Món đã hết", "Món mang về"], correctOption: 0, explanation: "招牌菜 là món nổi bật hoặc đặc trưng của nhà hàng." },
    { prompt: "Khách nói 对花生过敏. Nhân viên nên làm gì?", options: ["Ghi nhận và xác minh với bếp theo quy trình", "Tự đảm bảo món hoàn toàn an toàn", "Bỏ qua nếu món không nhìn thấy lạc"], correctOption: 0, explanation: "Dị ứng cần được chuyển xác minh theo quy trình an toàn thực phẩm thực tế." },
    { prompt: "不要香菜 dùng để yêu cầu gì?", options: ["Không cho rau mùi", "Thêm rau mùi", "Đổi sang món chay"], correctOption: 0, explanation: "不要 + nguyên liệu diễn tả không muốn có nguyên liệu đó." },
    { prompt: "一份炒饭，两杯茶 nghĩa là gì?", options: ["Một phần cơm rang, hai cốc trà", "Hai phần cơm, một cốc trà", "Một set có trà"], correctOption: 0, explanation: "份 là lượng từ cho phần món; 杯 là lượng từ cho cốc." },
    { prompt: "Món đã hết. Câu nào phù hợp?", options: ["这道菜今天售罄了，我可以推荐类似的菜。", "这道菜一定还有。", "您不能点别的。"], correctOption: 0, explanation: "Thông báo rõ tình trạng và đưa lựa chọn thay thế giúp khách quyết định." },
  ],
};

const tableServiceChallenge: LessonChallenge = {
  title: "Kiểm tra phục vụ tại bàn",
  description: "Đạt 4/5 câu để chuyển sang thanh toán và chăm sóc khách.",
  passScore: 4,
  questions: [
    { prompt: "菜已经上齐了 nghĩa là gì?", options: ["Các món đã lên đủ", "Món đang được nấu", "Món bị gửi nhầm"], correctOption: 0, explanation: "上齐 cho biết các món trong đơn đã được phục vụ đủ." },
    { prompt: "漏单 mô tả tình huống nào?", options: ["Món bị bỏ sót trong đơn", "Món được gọi thêm", "Món được giảm giá"], correctOption: 0, explanation: "漏单 là đơn hoặc món bị bỏ sót, chưa được xử lý." },
    { prompt: "Khách chờ món lâu. Nên phản hồi thế nào?", options: ["很抱歉让您久等，我马上向厨房确认时间。", "还没好，继续等。", "不是我的问题。"], correctOption: 0, explanation: "Ghi nhận thời gian chờ và xác minh với bếp trước khi báo mốc." },
    { prompt: "Sàn vừa bị đổ nước. Việc đầu tiên là gì?", options: ["Cảnh báo khu vực và xử lý theo quy trình an toàn", "Tiếp tục đi qua", "Chỉ xin lỗi khách"], correctOption: 0, explanation: "Cần giảm nguy cơ trượt ngã rồi tổ chức vệ sinh theo SOP." },
    { prompt: "这道菜上错了 nghĩa là gì?", options: ["Món này được phục vụ nhầm", "Món này đã hết", "Món này quá cay"], correctOption: 0, explanation: "上错了 cho biết món được đưa lên sai bàn hoặc sai yêu cầu." },
  ],
};

const finalChallenge: LessonChallenge = {
  title: "Kiểm tra tổng hợp Nhà hàng & dịch vụ",
  description: "Đạt 5/6 câu để hoàn thành lộ trình.",
  passScore: 5,
  questions: [
    { prompt: "账单明细 dùng để làm gì?", options: ["Xem chi tiết các khoản trên hóa đơn", "Xem danh sách đặt bàn", "Xem nguyên liệu món"], correctOption: 0, explanation: "明细 là chi tiết từng khoản để khách và nhân viên đối chiếu." },
    { prompt: "分开结账 nghĩa là gì?", options: ["Thanh toán riêng", "Thanh toán bằng tiền mặt", "Trì hoãn thanh toán"], correctOption: 0, explanation: "分开 là tách riêng; 结账 là thanh toán." },
    { prompt: "优惠券 sử dụng thế nào?", options: ["Theo điều kiện áp dụng được công bố", "Luôn cộng với mọi khuyến mãi", "Nhân viên tự quyết định"], correctOption: 0, explanation: "Phiếu ưu đãi phải theo điều kiện và quyền phê duyệt thực tế." },
    { prompt: "Khách không hài lòng về món. Nên làm gì trước?", options: ["Lắng nghe, xác minh món và yêu cầu của khách", "Hứa hoàn tiền ngay", "Tranh luận về khẩu vị"], correctOption: 0, explanation: "Thu thập dữ kiện trước khi chuyển phương án theo chính sách." },
    { prompt: "发票抬头 là gì?", options: ["Tên/đơn vị ghi trên hóa đơn", "Mã số bàn", "Tên món đặc trưng"], correctOption: 0, explanation: "抬头 là thông tin tên cá nhân hoặc tổ chức trên hóa đơn." },
    { prompt: "Khi khách báo dị ứng nghiêm trọng, khóa học yêu cầu gì?", options: ["Dừng cam kết, báo quản lý/bếp và làm theo SOP khẩn cấp", "Chỉ dựa vào trí nhớ về nguyên liệu", "Đề nghị khách thử một ít"], correctOption: 0, explanation: "Nội dung ngôn ngữ không thay thế quy trình an toàn thực phẩm hoặc xử trí khẩn cấp." },
  ],
};

export const restaurantModules: CourseModuleSeed[] = [
  { slug: "don-khach-va-xep-ban", title: "Đón khách & xếp bàn", description: "Chào khách, kiểm tra đặt bàn, hỏi chỗ ngồi và quản lý thời gian chờ." },
  { slug: "goi-mon-va-yeu-cau-an-uong", title: "Gọi món & yêu cầu ăn uống", description: "Giới thiệu thực đơn, hỏi khẩu vị, ghi chú dị ứng và xác nhận món." },
  { slug: "phuc-vu-tai-ban", title: "Phục vụ tại bàn", description: "Lên món, hỗ trợ yêu cầu, báo chậm và xử lý sai sót hoặc sự cố an toàn." },
  { slug: "thanh-toan-va-phan-hoi", title: "Thanh toán & phản hồi", description: "Kiểm tra hóa đơn, phương thức thanh toán, ưu đãi và tiếp nhận góp ý sau bữa ăn." },
];

const restaurantLessonInputs: RestaurantLessonInput[] = [
  {
    moduleSlug: "don-khach-va-xep-ban", slug: "chao-khach-va-hoi-so-nguoi", title: "Chào khách và hỏi số người",
    summary: "Mở đầu lịch sự, hỏi số khách và xác nhận nhu cầu dùng bữa tại chỗ.", situation: "Khách vừa đến cửa nhà hàng", estimatedMinutes: 11, isFree: true,
    vocabulary: [
      ["l01-huanyingguanglin", "欢迎光临", "huānyíng guānglín", "kính chào quý khách", "欢迎光临，请问几位？", "Kính chào quý khách, xin hỏi có mấy người?"],
      ["l01-jiwei", "几位", "jǐ wèi", "mấy vị, bao nhiêu khách", "请问一共几位？", "Xin hỏi tổng cộng có mấy vị?"],
      ["l01-yongcan", "用餐", "yòngcān", "dùng bữa", "您是在这里用餐吗？", "Anh/chị dùng bữa tại đây phải không?"],
      ["l01-keren", "客人", "kèrén", "khách", "客人正在门口等候。", "Khách đang chờ ở cửa."],
      ["l01-qingjin", "请进", "qǐng jìn", "xin mời vào", "请进，我们为您安排座位。", "Xin mời vào, chúng tôi sẽ sắp chỗ."],
      ["l01-daiwei", "带位", "dàiwèi", "dẫn khách vào bàn", "我来为这桌客人带位。", "Tôi sẽ dẫn nhóm khách này vào bàn."],
    ],
    request: ["两位客人想在店里用餐。", "Liǎng wèi kèrén xiǎng zài diàn lǐ yòngcān.", "Hai vị khách muốn dùng bữa tại nhà hàng."],
    response: ["我先确认人数，再带他们入座。", "Wǒ xiān quèrèn rénshù, zài dài tāmen rùzuò.", "Tôi sẽ xác nhận số người rồi dẫn khách vào chỗ."],
    notes: [note("Lượng từ lịch sự", "几位 / 两位", "位 là lượng từ lịch sự dành cho người, phù hợp khi đón khách."), note("Câu chào ngắn", "欢迎光临，请问几位？", "Một câu chào kèm câu hỏi số người giúp luồng đón khách tự nhiên.")],
  },
  {
    moduleSlug: "don-khach-va-xep-ban", slug: "kiem-tra-thong-tin-dat-ban", title: "Kiểm tra thông tin đặt bàn",
    summary: "Hỏi tên, số điện thoại, thời gian và số người để tìm đúng lượt đặt.", situation: "Khách nói đã đặt bàn trước", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l02-yuding", "预订", "yùdìng", "đặt trước", "请问您有预订吗？", "Xin hỏi anh/chị đã đặt trước chưa?"],
      ["l02-xingming", "姓名", "xìngmíng", "họ tên", "请告诉我预订姓名。", "Hãy cho tôi biết tên đặt bàn."],
      ["l02-dianhua", "电话", "diànhuà", "số điện thoại", "可以确认一下电话号码吗？", "Có thể xác nhận số điện thoại không?"],
      ["l02-shijian", "时间", "shíjiān", "thời gian", "您的预订时间是六点。", "Giờ đặt bàn của anh/chị là 6 giờ."],
      ["l02-renshu", "人数", "rénshù", "số người", "预订人数是四位。", "Số khách đặt bàn là bốn người."],
      ["l02-yuyuexinxi", "预约信息", "yùyuē xìnxī", "thông tin đặt chỗ", "我正在查询预约信息。", "Tôi đang tra thông tin đặt chỗ."],
    ],
    request: ["客人预订了晚上七点的四人桌。", "Kèrén yùdìng le wǎnshang qī diǎn de sì rén zhuō.", "Khách đã đặt bàn bốn người lúc 7 giờ tối."],
    response: ["我会核对姓名、电话和人数。", "Wǒ huì héduì xìngmíng, diànhuà hé rénshù.", "Tôi sẽ đối chiếu tên, điện thoại và số người."],
    notes: [note("Tìm đặt bàn", "请问预订姓名是？", "Hỏi tên đặt trước rồi mới xin thêm dữ liệu nếu cần."), note("Không đọc lộ thông tin", "请您确认……", "Để khách tự xác nhận thông tin thay vì đọc toàn bộ dữ liệu đặt bàn trước đám đông.")],
  },
  {
    moduleSlug: "don-khach-va-xep-ban", slug: "hoi-nhu-cau-cho-ngoi", title: "Hỏi nhu cầu chỗ ngồi",
    summary: "Xác nhận mong muốn gần cửa sổ, yên tĩnh, phòng riêng hoặc ghế trẻ em.", situation: "Khách có yêu cầu vị trí", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l03-zuowei", "座位", "zuòwèi", "chỗ ngồi", "您对座位有要求吗？", "Anh/chị có yêu cầu về chỗ ngồi không?"],
      ["l03-kaochuang", "靠窗", "kàochuāng", "gần cửa sổ", "客人想坐靠窗的位置。", "Khách muốn ngồi gần cửa sổ."],
      ["l03-baojian", "包间", "bāojiān", "phòng riêng", "包间今天已经订满了。", "Phòng riêng hôm nay đã được đặt hết."],
      ["l03-anjing", "安静", "ānjìng", "yên tĩnh", "这边的座位比较安静。", "Chỗ phía này yên tĩnh hơn."],
      ["l03-ertongyi", "儿童椅", "értóng yǐ", "ghế trẻ em", "需要准备儿童椅吗？", "Có cần chuẩn bị ghế trẻ em không?"],
      ["l03-fangbian", "方便", "fāngbiàn", "thuận tiện", "这个位置进出比较方便。", "Vị trí này ra vào thuận tiện hơn."],
    ],
    request: ["客人带着孩子，希望坐在安静的位置。", "Kèrén dàizhe háizi, xīwàng zuò zài ānjìng de wèizhi.", "Khách đi cùng trẻ nhỏ và muốn chỗ yên tĩnh."],
    response: ["我会确认空位并准备儿童椅。", "Wǒ huì quèrèn kòngwèi bìng zhǔnbèi értóng yǐ.", "Tôi sẽ kiểm tra chỗ trống và chuẩn bị ghế trẻ em."],
    notes: [note("Hỏi thay vì đoán", "您对座位有要求吗？", "Câu hỏi mở cho khách nêu nhu cầu mà không hứa trước vị trí."), note("Nêu mức độ", "比较安静 / 更方便", "Dùng 比较 hoặc 更 để mô tả tương đối, tránh cam kết tuyệt đối.")],
  },
  {
    moduleSlug: "don-khach-va-xep-ban", slug: "huong-dan-cho-va-xep-so", title: "Hướng dẫn chờ và xếp số",
    summary: "Báo thời gian chờ dự kiến, cấp số và giải thích cách gọi khách khi có bàn.", situation: "Nhà hàng đang kín bàn", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["l04-dengwei", "等位", "děngwèi", "chờ bàn", "现在需要等位。", "Hiện tại cần chờ bàn."],
      ["l04-paihao", "排号", "páihào", "lấy số chờ", "我先为您排号。", "Tôi lấy số chờ cho anh/chị trước."],
      ["l04-yuji", "预计", "yùjì", "dự kiến", "预计要等二十分钟。", "Dự kiến phải chờ 20 phút."],
      ["l04-fenzhong", "分钟", "fēnzhōng", "phút", "大概十五分钟有空桌。", "Khoảng 15 phút nữa có bàn trống."],
      ["l04-jiaohao", "叫号", "jiàohào", "gọi số", "有位置后我们会叫号。", "Có chỗ chúng tôi sẽ gọi số."],
      ["l04-xiuxiqu", "休息区", "xiūxíqū", "khu vực chờ", "您可以先在休息区等候。", "Anh/chị có thể chờ ở khu nghỉ trước."],
    ],
    request: ["目前没有空桌，客人需要等位。", "Mùqián méiyǒu kòng zhuō, kèrén xūyào děngwèi.", "Hiện không có bàn trống, khách cần chờ."],
    response: ["我会说明预计时间和叫号方式。", "Wǒ huì shuōmíng yùjì shíjiān hé jiàohào fāngshì.", "Tôi sẽ nói thời gian dự kiến và cách gọi số."],
    notes: [note("Thời gian dự kiến", "预计要等……分钟", "Nói rõ đây là ước tính và cập nhật nếu tình hình thay đổi."), note("Thông báo cách gọi", "有空位后，我们会……", "Khách cần biết sẽ được gọi trực tiếp, qua số hay điện thoại.")],
  },
  {
    moduleSlug: "don-khach-va-xep-ban", slug: "gioi-thieu-khu-vuc-va-thoi-gian-phuc-vu", title: "Giới thiệu khu vực và thời gian phục vụ",
    summary: "Hướng dẫn khu vực, giờ hoạt động và thời điểm nhận gọi món cuối.", situation: "Khách đến gần giờ đóng cửa", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["l05-yingyeshijian", "营业时间", "yíngyè shíjiān", "giờ hoạt động", "我们的营业时间到十点。", "Giờ hoạt động của chúng tôi đến 10 giờ."],
      ["l05-zuihoudiancan", "最后点餐", "zuìhòu diǎncān", "giờ gọi món cuối", "最后点餐时间是九点半。", "Giờ gọi món cuối là 9 giờ 30."],
      ["l05-quyu", "区域", "qūyù", "khu vực", "这个区域只供用餐。", "Khu vực này chỉ dành cho dùng bữa."],
      ["l05-jinzhi", "禁止", "jìnzhǐ", "cấm", "这里禁止吸烟。", "Ở đây cấm hút thuốc."],
      ["l05-tixing", "提醒", "tíxǐng", "nhắc nhở", "我先提醒客人点餐时间。", "Tôi nhắc khách giờ gọi món trước."],
      ["l05-rukou", "入口", "rùkǒu", "lối vào", "洗手间在入口右边。", "Nhà vệ sinh ở bên phải lối vào."],
    ],
    request: ["客人在最后点餐时间前十五分钟到店。", "Kèrén zài zuìhòu diǎncān shíjiān qián shíwǔ fēnzhōng dào diàn.", "Khách đến trước giờ gọi món cuối 15 phút."],
    response: ["我会先说明时间，再确认是否用餐。", "Wǒ huì xiān shuōmíng shíjiān, zài quèrèn shìfǒu yòngcān.", "Tôi sẽ nói rõ thời gian rồi xác nhận khách có dùng bữa không."],
    notes: [note("Nhắc trước khi xếp bàn", "先说明……时间", "Nói giờ gọi món cuối trước giúp khách quyết định với đủ thông tin."), note("Quy định trung tính", "这里禁止……", "Nêu quy định ngắn gọn và hướng dẫn lựa chọn phù hợp nếu có.")],
  },
  {
    moduleSlug: "don-khach-va-xep-ban", slug: "kiem-tra-don-khach-va-xep-ban", title: "Kiểm tra: Đón khách & xếp bàn",
    summary: "Ôn số khách, đặt bàn, yêu cầu chỗ ngồi, thời gian chờ và hướng dẫn khu vực.", situation: "Đánh giá cuối module 1", estimatedMinutes: 14, isFree: true,
    vocabulary: [
      ["l06-daodian", "到店", "dàodiàn", "đến nhà hàng", "客人已经到店。", "Khách đã đến nhà hàng."],
      ["l06-qiantai", "前台", "qiántái", "quầy lễ tân", "请先到前台确认预订。", "Hãy đến quầy lễ tân xác nhận đặt bàn."],
      ["l06-anpai", "安排", "ānpái", "sắp xếp", "我们正在安排座位。", "Chúng tôi đang sắp xếp chỗ."],
      ["l06-zhuohao", "桌号", "zhuōhào", "số bàn", "您的桌号是八号。", "Số bàn của anh/chị là bàn 8."],
      ["l06-kongwei", "空位", "kòngwèi", "chỗ trống", "靠窗暂时没有空位。", "Gần cửa sổ tạm chưa có chỗ trống."],
      ["l06-ruzuo", "入座", "rùzuò", "vào chỗ ngồi", "请跟我来入座。", "Xin đi theo tôi vào chỗ."],
    ],
    request: ["四位客人已到店，但靠窗暂时没有空位。", "Sì wèi kèrén yǐ dàodiàn, dàn kàochuāng zànshí méiyǒu kòngwèi.", "Bốn khách đã đến nhưng gần cửa sổ tạm chưa có chỗ."],
    response: ["我会说明选择并确认客人是否愿意等。", "Wǒ huì shuōmíng xuǎnzé bìng quèrèn kèrén shìfǒu yuànyì děng.", "Tôi sẽ nêu lựa chọn và hỏi khách có muốn chờ không."],
    notes: [note("Đưa hai lựa chọn", "现在入座，还是等靠窗的位置？", "Hai lựa chọn rõ giúp khách quyết định nhanh hơn."), note("Không tự đổi yêu cầu", "请客人确认", "Nếu vị trí khác yêu cầu, cần để khách xác nhận trước khi dẫn bàn.")], challenge: arrivalChallenge,
  },
  {
    moduleSlug: "goi-mon-va-yeu-cau-an-uong", slug: "gioi-thieu-thuc-don-va-mon-dac-trung", title: "Giới thiệu thực đơn và món đặc trưng",
    summary: "Hướng dẫn cách xem thực đơn, món đặc trưng, set và món gọi riêng.", situation: "Khách mở thực đơn lần đầu", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l07-caidan", "菜单", "càidān", "thực đơn", "这是今天的菜单。", "Đây là thực đơn hôm nay."],
      ["l07-zhaopaicai", "招牌菜", "zhāopái cài", "món đặc trưng", "这是我们的招牌菜。", "Đây là món đặc trưng của chúng tôi."],
      ["l07-tese", "特色", "tèsè", "đặc sắc", "这道菜很有本店特色。", "Món này rất đặc trưng của quán."],
      ["l07-tuijian", "推荐", "tuījiàn", "giới thiệu, đề xuất", "我可以为您推荐几道菜。", "Tôi có thể giới thiệu vài món."],
      ["l07-taocan", "套餐", "tàocān", "set/combo", "双人套餐包括三道菜。", "Set hai người gồm ba món."],
      ["l07-dandian", "单点", "dāndiǎn", "gọi riêng từng món", "这些菜也可以单点。", "Các món này cũng có thể gọi riêng."],
    ],
    request: ["客人第一次来，想了解本店特色。", "Kèrén dì yī cì lái, xiǎng liǎojiě běndiàn tèsè.", "Khách lần đầu đến và muốn biết món đặc trưng."],
    response: ["我会先问口味，再推荐两三道菜。", "Wǒ huì xiān wèn kǒuwèi, zài tuījiàn liǎng sān dào cài.", "Tôi sẽ hỏi khẩu vị rồi giới thiệu hai ba món."],
    notes: [note("Đề xuất có căn cứ", "如果您喜欢……，可以试试……", "Gắn món đề xuất với khẩu vị giúp lời giới thiệu hữu ích hơn."), note("Set và món lẻ", "套餐包括…… / 可以单点", "Nói rõ món nào nằm trong set và món nào gọi riêng.")],
  },
  {
    moduleSlug: "goi-mon-va-yeu-cau-an-uong", slug: "hoi-khau-vi-di-ung-va-kieng-an", title: "Hỏi khẩu vị, dị ứng và kiêng ăn",
    summary: "Hỏi độ cay, ăn chay, nguyên liệu cần tránh và chuyển thông tin dị ứng cho bếp.", situation: "Khách có yêu cầu ăn uống đặc biệt", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l08-kouwei", "口味", "kǒuwèi", "khẩu vị", "请问您喜欢什么口味？", "Xin hỏi anh/chị thích khẩu vị nào?"],
      ["l08-la", "辣", "là", "cay", "这道菜比较辣。", "Món này khá cay."],
      ["l08-qingdan", "清淡", "qīngdàn", "thanh nhẹ", "可以做得清淡一点。", "Có thể làm nhạt nhẹ hơn."],
      ["l08-sushi", "素食", "sùshí", "đồ chay", "我们有素食选择。", "Chúng tôi có lựa chọn món chay."],
      ["l08-guomin", "过敏", "guòmǐn", "dị ứng", "客人对花生过敏。", "Khách dị ứng với lạc."],
      ["l08-jikou", "忌口", "jìkǒu", "kiêng ăn", "请问您有什么忌口？", "Xin hỏi anh/chị có kiêng gì không?"],
    ],
    request: ["客人对花生过敏，而且不吃辣。", "Kèrén duì huāshēng guòmǐn, érqiě bù chī là.", "Khách dị ứng lạc và không ăn cay."],
    response: ["我会记录要求，并请厨房按流程确认。", "Wǒ huì jìlù yāoqiú, bìng qǐng chúfáng àn liúchéng quèrèn.", "Tôi sẽ ghi nhận và nhờ bếp xác minh theo quy trình."],
    notes: [note("Hỏi dị ứng trực tiếp", "您对什么食物过敏吗？", "Dùng câu hỏi rõ ràng; không suy đoán dị ứng từ sở thích."), note("Không tự cam kết", "我需要请厨房确认", "Nhân viên phục vụ phải chuyển xác minh theo SOP, không tự đảm bảo món không có dị nguyên.")],
  },
  {
    moduleSlug: "goi-mon-va-yeu-cau-an-uong", slug: "giai-thich-nguyen-lieu-va-cach-che-bien", title: "Giải thích nguyên liệu và cách chế biến",
    summary: "Nêu nguyên liệu chính, phương pháp chế biến và yêu cầu bỏ bớt thành phần.", situation: "Khách hỏi món được làm như thế nào", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l09-shicai", "食材", "shícái", "nguyên liệu", "这道菜使用新鲜食材。", "Món này dùng nguyên liệu tươi."],
      ["l09-peiliao", "配料", "pèiliào", "thành phần phụ", "配料里有芝麻。", "Trong thành phần có vừng."],
      ["l09-zuofa", "做法", "zuòfǎ", "cách chế biến", "这道菜有两种做法。", "Món này có hai cách chế biến."],
      ["l09-zha", "炸", "zhá", "chiên ngập dầu", "这个小吃是油炸的。", "Món ăn nhẹ này được chiên."],
      ["l09-zheng", "蒸", "zhēng", "hấp", "鱼可以清蒸。", "Cá có thể hấp."],
      ["l09-qudiao", "去掉", "qùdiào", "bỏ đi", "这份沙拉可以去掉奶酪。", "Phần salad này có thể bỏ phô mai."],
    ],
    request: ["客人想知道汤里有哪些配料。", "Kèrén xiǎng zhīdào tāng lǐ yǒu nǎxiē pèiliào.", "Khách muốn biết súp có những thành phần nào."],
    response: ["我会查看资料，不确定的部分请厨房确认。", "Wǒ huì chákàn zīliào, bù quèdìng de bùfen qǐng chúfáng quèrèn.", "Tôi sẽ xem tài liệu và nhờ bếp xác minh phần chưa chắc."],
    notes: [note("Nêu cách chế biến", "这道菜是……的", "Dùng cấu trúc này để mô tả món hấp, chiên hoặc nướng."), note("Nguồn thông tin", "以配方和厨房确认为准", "Thông tin nguyên liệu phải dựa trên công thức và xác nhận thực tế.")],
  },
  {
    moduleSlug: "goi-mon-va-yeu-cau-an-uong", slug: "ghi-mon-va-xac-nhan-so-luong", title: "Ghi món và xác nhận số lượng",
    summary: "Dùng đúng lượng từ cho món, đồ uống và đọc lại đơn trước khi gửi bếp.", situation: "Khách bắt đầu gọi món", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l10-diancai", "点菜", "diǎncài", "gọi món", "现在可以点菜了吗？", "Bây giờ có thể gọi món chưa?"],
      ["l10-fen", "份", "fèn", "phần", "请来一份炒饭。", "Cho một phần cơm rang."],
      ["l10-bei", "杯", "bēi", "cốc, ly", "我们要两杯热茶。", "Chúng tôi cần hai cốc trà nóng."],
      ["l10-zhushi", "主食", "zhǔshí", "món chính/tinh bột chính", "主食您想点米饭还是面？", "Món chính anh/chị muốn cơm hay mì?"],
      ["l10-yinliao", "饮料", "yǐnliào", "đồ uống", "饮料稍后再上。", "Đồ uống sẽ được mang lên sau."],
      ["l10-fushu", "复述", "fùshù", "đọc/nhắc lại", "下单前我会复述一遍。", "Trước khi gửi đơn tôi sẽ đọc lại một lượt."],
    ],
    request: ["客人点了四道菜和三杯饮料。", "Kèrén diǎn le sì dào cài hé sān bēi yǐnliào.", "Khách gọi bốn món và ba cốc đồ uống."],
    response: ["我会按顺序复述菜名、数量和要求。", "Wǒ huì àn shùnxù fùshù càimíng, shùliàng hé yāoqiú.", "Tôi sẽ đọc lại tên món, số lượng và yêu cầu theo thứ tự."],
    notes: [note("Lượng từ thường dùng", "一道菜 / 一份饭 / 一杯茶", "Chọn lượng từ phù hợp giúp đơn rõ ràng hơn."), note("Đọc lại trước khi gửi", "我跟您确认一下……", "Đọc lại toàn đơn giúp phát hiện thiếu món hoặc sai số lượng.")],
  },
  {
    moduleSlug: "goi-mon-va-yeu-cau-an-uong", slug: "bao-het-mon-va-de-xuat-thay-the", title: "Báo hết món và đề xuất thay thế",
    summary: "Thông báo món hết hoặc tạm ngừng phục vụ, rồi đưa lựa chọn gần nhất.", situation: "Món khách chọn đã hết", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l11-shouqing", "售罄", "shòuqìng", "bán hết", "这道菜今天已经售罄。", "Món này hôm nay đã bán hết."],
      ["l11-zantinggongying", "暂停供应", "zàntíng gōngyìng", "tạm ngừng phục vụ", "海鲜汤暂时停止供应。", "Súp hải sản tạm ngừng phục vụ."],
      ["l11-tihuan", "替换", "tìhuàn", "thay thế", "可以替换成鸡肉吗？", "Có thể thay bằng thịt gà không?"],
      ["l11-leisi", "类似", "lèisì", "tương tự", "我推荐一道口味类似的菜。", "Tôi giới thiệu một món có vị tương tự."],
      ["l11-xuanxiang", "选项", "xuǎnxiàng", "lựa chọn", "还有两个素食选项。", "Còn hai lựa chọn món chay."],
      ["l11-chufang", "厨房", "chúfáng", "bếp", "我先向厨房确认。", "Tôi xác nhận với bếp trước."],
    ],
    request: ["客人想点的招牌菜已经售罄。", "Kèrén xiǎng diǎn de zhāopái cài yǐjīng shòuqìng.", "Món đặc trưng khách muốn gọi đã hết."],
    response: ["我会道歉并推荐口味相近的选择。", "Wǒ huì dàoqiàn bìng tuījiàn kǒuwèi xiāngjìn de xuǎnzé.", "Tôi sẽ xin lỗi và giới thiệu lựa chọn có vị gần giống."],
    notes: [note("Báo trạng thái rõ", "今天售罄 / 暂停供应", "Phân biệt hết trong ngày với tạm dừng phục vụ."), note("Không tự đổi món", "可以为您推荐……", "Đưa lựa chọn để khách quyết định, không tự thay món trong đơn.")],
  },
  {
    moduleSlug: "goi-mon-va-yeu-cau-an-uong", slug: "kiem-tra-goi-mon-va-yeu-cau-an-uong", title: "Kiểm tra: Gọi món & yêu cầu ăn uống",
    summary: "Ôn thực đơn, khẩu vị, dị ứng, nguyên liệu, số lượng và món thay thế.", situation: "Đánh giá cuối module 2", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l12-xiadan", "下单", "xiàdān", "gửi đơn món", "确认后我就为您下单。", "Xác nhận xong tôi sẽ gửi đơn món."],
      ["l12-jiacai", "加菜", "jiācài", "gọi thêm món", "客人想再加一道菜。", "Khách muốn gọi thêm một món."],
      ["l12-shaoyan", "少盐", "shǎo yán", "ít muối", "这道汤请少盐。", "Món súp này xin ít muối."],
      ["l12-buyao", "不要", "bú yào", "không muốn/không cho", "这份面不要香菜。", "Phần mì này không cho rau mùi."],
      ["l12-shangcaishunxu", "上菜顺序", "shàngcài shùnxù", "thứ tự lên món", "请确认上菜顺序。", "Hãy xác nhận thứ tự lên món."],
      ["l12-diancanbeizhu", "点餐备注", "diǎncān bèizhù", "ghi chú gọi món", "过敏信息要写在点餐备注里。", "Thông tin dị ứng phải ghi trong ghi chú gọi món."],
    ],
    request: ["客人点了三道菜，其中一份不要香菜。", "Kèrén diǎn le sān dào cài, qízhōng yí fèn bú yào xiāngcài.", "Khách gọi ba món, trong đó một phần không rau mùi."],
    response: ["我会复述全部要求，并在备注中标明。", "Wǒ huì fùshù quánbù yāoqiú, bìng zài bèizhù zhōng biāomíng.", "Tôi sẽ đọc lại toàn bộ yêu cầu và ghi rõ trong ghi chú."],
    notes: [note("Ghi chú có cấu trúc", "菜名 + 数量 + 特殊要求", "Ghi theo cùng thứ tự giúp bếp đọc nhanh và giảm bỏ sót."), note("Dị ứng cần chuyển cấp", "过敏信息必须按流程确认", "Ghi chú trên đơn không thay thế bước báo bếp/quản lý theo SOP.")], challenge: orderingChallenge,
  },
  {
    moduleSlug: "phuc-vu-tai-ban", slug: "len-mon-dung-ban-va-gioi-thieu-mon", title: "Lên món đúng bàn và giới thiệu món",
    summary: "Đối chiếu bàn, tên món, cảnh báo món nóng và xác nhận đã lên đủ.", situation: "Nhân viên mang món ra bàn", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l13-shangcai", "上菜", "shàngcài", "lên món", "现在开始上菜。", "Bây giờ bắt đầu lên món."],
      ["l13-caiming", "菜名", "càimíng", "tên món", "上菜时请报菜名。", "Khi lên món hãy đọc tên món."],
      ["l13-canpan", "餐盘", "cānpán", "đĩa/khay ăn", "餐盘很热，请小心。", "Đĩa rất nóng, xin cẩn thận."],
      ["l13-xiaoxin", "小心", "xiǎoxīn", "cẩn thận", "小心热汤。", "Cẩn thận súp nóng."],
      ["l13-qingmanyong", "请慢用", "qǐng mànyòng", "xin mời dùng", "菜上好了，请慢用。", "Món đã lên, xin mời dùng."],
      ["l13-shangqi", "上齐", "shàngqí", "lên đủ món", "您点的菜已经上齐了。", "Các món anh/chị gọi đã lên đủ."],
    ],
    request: ["八号桌的热汤和主菜已经做好。", "Bā hào zhuō de rè tāng hé zhǔcài yǐjīng zuò hǎo.", "Súp nóng và món chính của bàn 8 đã xong."],
    response: ["我会核对桌号，报菜名并提醒小心。", "Wǒ huì héduì zhuōhào, bào càimíng bìng tíxǐng xiǎoxīn.", "Tôi sẽ đối chiếu bàn, đọc tên món và nhắc cẩn thận."],
    notes: [note("Đọc tên món", "这是您点的……", "Đọc tên giúp khách phát hiện món sai trước khi dùng."), note("Cảnh báo món nóng", "餐盘很热，请小心", "Cảnh báo trước khi đặt món theo quy trình an toàn phục vụ.")],
  },
  {
    moduleSlug: "phuc-vu-tai-ban", slug: "hoi-trai-nghiem-va-ho-tro-them", title: "Hỏi trải nghiệm và hỗ trợ thêm",
    summary: "Hỏi khẩu vị sau khi khách bắt đầu ăn và tiếp nhận yêu cầu nước, dụng cụ hoặc gia vị.", situation: "Kiểm tra bàn sau khi lên món", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l14-weidao", "味道", "wèidào", "hương vị", "请问味道怎么样？", "Xin hỏi hương vị thế nào?"],
      ["l14-manyi", "满意", "mǎnyì", "hài lòng", "客人对主菜很满意。", "Khách rất hài lòng với món chính."],
      ["l14-xuyao", "需要", "xūyào", "cần", "请问还需要什么？", "Xin hỏi còn cần gì không?"],
      ["l14-tianshui", "添水", "tiānshuǐ", "châm thêm nước", "我来为您添水。", "Tôi châm thêm nước cho anh/chị."],
      ["l14-canju", "餐具", "cānjù", "dụng cụ ăn", "客人需要一套餐具。", "Khách cần một bộ dụng cụ ăn."],
      ["l14-tiaoweiliao", "调味料", "tiáowèiliào", "gia vị", "需要额外的调味料吗？", "Có cần thêm gia vị không?"],
    ],
    request: ["客人需要加水和一套餐具。", "Kèrén xūyào jiā shuǐ hé yí tào cānjù.", "Khách cần thêm nước và một bộ dụng cụ ăn."],
    response: ["我会重复要求并马上送到桌边。", "Wǒ huì chóngfù yāoqiú bìng mǎshàng sòng dào zhuōbiān.", "Tôi sẽ nhắc lại yêu cầu và mang tới bàn ngay."],
    notes: [note("Câu hỏi mở ngắn", "还需要什么吗？", "Hỏi sau khi khách dùng món một lúc, tránh làm gián đoạn quá nhiều."), note("Nhắc lại yêu cầu", "一份……和一套……，对吗？", "Nhắc lại số lượng giúp tránh mang thiếu hoặc sai vật dụng.")],
  },
  {
    moduleSlug: "phuc-vu-tai-ban", slug: "xu-ly-thieu-mon-va-len-nham", title: "Xử lý thiếu món và lên nhầm",
    summary: "Xin lỗi, đối chiếu đơn, thu hồi món nhầm và báo kế hoạch bổ sung.", situation: "Khách báo món chưa lên hoặc sai món", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l15-loudan", "漏单", "lòudān", "bỏ sót món/đơn", "厨房正在检查是否漏单。", "Bếp đang kiểm tra có bỏ sót món không."],
      ["l15-shangcuo", "上错", "shàngcuò", "lên nhầm món", "这道菜上错桌了。", "Món này được lên nhầm bàn."],
      ["l15-hedui", "核对", "héduì", "đối chiếu", "我先核对点菜单。", "Tôi đối chiếu phiếu gọi món trước."],
      ["l15-bushang", "补上", "bǔshàng", "bổ sung món thiếu", "厨房会尽快补上。", "Bếp sẽ bổ sung sớm nhất."],
      ["l15-chexia", "撤下", "chèxià", "thu hồi món", "我先把上错的菜撤下。", "Tôi thu hồi món lên nhầm trước."],
      ["l15-daoqian", "道歉", "dàoqiàn", "xin lỗi", "我们为这个失误道歉。", "Chúng tôi xin lỗi vì sai sót này."],
    ],
    request: ["客人说少了一道菜，而且有一道上错了。", "Kèrén shuō shǎo le yí dào cài, érqiě yǒu yí dào shàngcuò le.", "Khách nói thiếu một món và có một món lên nhầm."],
    response: ["我会道歉、核对订单并向厨房确认。", "Wǒ huì dàoqiàn, héduì dìngdān bìng xiàng chúfáng quèrèn.", "Tôi sẽ xin lỗi, đối chiếu đơn và xác nhận với bếp."],
    notes: [note("Không đổ lỗi", "我先核对一下", "Xác minh trước khi nói lỗi thuộc về bếp, phục vụ hay khách."), note("Báo bước tiếp theo", "我会……并在……前回复", "Cho khách biết món sẽ được xử lý và khi nào có cập nhật.")],
  },
  {
    moduleSlug: "phuc-vu-tai-ban", slug: "bao-cham-mon-va-cap-nhat-thoi-gian", title: "Báo chậm món và cập nhật thời gian",
    summary: "Ghi nhận thời gian chờ, hỏi bếp và báo mốc mới có căn cứ.", situation: "Khách chờ món lâu hơn dự kiến", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l16-jiudeng", "久等", "jiǔděng", "chờ lâu", "很抱歉让您久等。", "Rất xin lỗi vì để anh/chị chờ lâu."],
      ["l16-yanwu", "延误", "yánwù", "chậm trễ", "这道菜因为订单多而延误。", "Món này chậm do có nhiều đơn."],
      ["l16-haiyaoduojiu", "还要多久", "hái yào duōjiǔ", "còn bao lâu", "我向厨房确认还要多久。", "Tôi hỏi bếp còn bao lâu."],
      ["l16-youxian", "优先", "yōuxiān", "ưu tiên", "厨房正在优先处理。", "Bếp đang ưu tiên xử lý."],
      ["l16-cuicai", "催菜", "cuīcài", "nhắc/giục món", "我已经帮您催菜了。", "Tôi đã nhắc món cho anh/chị."],
      ["l16-gengxin", "更新", "gēngxīn", "cập nhật", "五分钟后我再来更新。", "Năm phút nữa tôi sẽ cập nhật."],
    ],
    request: ["客人已经等了三十分钟，想知道还要多久。", "Kèrén yǐjīng děng le sānshí fēnzhōng, xiǎng zhīdào hái yào duōjiǔ.", "Khách đã chờ 30 phút và muốn biết còn bao lâu."],
    response: ["我会向厨房确认，并给客人明确更新时间。", "Wǒ huì xiàng chúfáng quèrèn, bìng gěi kèrén míngquè gēngxīn shíjiān.", "Tôi sẽ xác nhận với bếp và cho khách mốc cập nhật rõ ràng."],
    notes: [note("Xin lỗi và hành động", "很抱歉让您久等，我马上……", "Gắn lời xin lỗi với hành động cụ thể, không chỉ yêu cầu khách tiếp tục chờ."), note("Không bịa thời gian", "确认后再说明", "Chỉ báo thời gian món sau khi có thông tin từ bếp hoặc hệ thống.")],
  },
  {
    moduleSlug: "phuc-vu-tai-ban", slug: "xu-ly-do-vo-va-san-tron", title: "Xử lý đồ vỡ và sàn trơn",
    summary: "Cảnh báo khu vực, bảo vệ khách và gọi hỗ trợ vệ sinh theo SOP.", situation: "Nước đổ và cốc vỡ gần bàn", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l17-sale", "洒了", "sǎ le", "bị đổ", "水洒在地上了。", "Nước bị đổ ra sàn."],
      ["l17-dasui", "打碎", "dǎsuì", "làm vỡ", "一个杯子被打碎了。", "Một chiếc cốc bị vỡ."],
      ["l17-qingli", "清理", "qīnglǐ", "dọn sạch", "工作人员马上来清理。", "Nhân viên sẽ tới dọn ngay."],
      ["l17-shihua", "湿滑", "shīhuá", "ẩm trơn", "地面湿滑，请小心。", "Sàn trơn ướt, xin cẩn thận."],
      ["l17-genghuan", "更换", "gēnghuàn", "thay mới", "我们为您更换餐具。", "Chúng tôi thay dụng cụ ăn cho anh/chị."],
      ["l17-zhuyianquan", "注意安全", "zhùyì ānquán", "chú ý an toàn", "请绕行并注意安全。", "Xin đi vòng và chú ý an toàn."],
    ],
    request: ["桌边有玻璃碎片，地面也很湿。", "Zhuōbiān yǒu bōli suìpiàn, dìmiàn yě hěn shī.", "Gần bàn có mảnh kính và sàn cũng ướt."],
    response: ["我会先警示并隔开区域，再按流程清理。", "Wǒ huì xiān jǐngshì bìng gékāi qūyù, zài àn liúchéng qīnglǐ.", "Tôi sẽ cảnh báo, cách ly khu vực rồi dọn theo quy trình."],
    notes: [note("Cảnh báo trực tiếp", "地面湿滑，请小心", "Nói ngắn, rõ và chỉ hướng đi an toàn nếu có."), note("An toàn trước dịch vụ", "先隔开，再清理", "Phải làm theo SOP về đồ vỡ, hóa chất và chất thải; bài học chỉ hỗ trợ ngôn ngữ.")],
  },
  {
    moduleSlug: "phuc-vu-tai-ban", slug: "kiem-tra-phuc-vu-tai-ban", title: "Kiểm tra: Phục vụ tại bàn",
    summary: "Ôn lên món, hỗ trợ thêm, thiếu món, báo chậm và xử lý sự cố an toàn.", situation: "Đánh giá cuối module 3", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l18-fuwu", "服务", "fúwù", "phục vụ", "我们会改进服务流程。", "Chúng tôi sẽ cải thiện quy trình phục vụ."],
      ["l18-jishi", "及时", "jíshí", "kịp thời", "有问题要及时处理。", "Có vấn đề cần xử lý kịp thời."],
      ["l18-yichang", "异常", "yìcháng", "bất thường", "请记录桌边的异常情况。", "Hãy ghi nhận tình huống bất thường tại bàn."],
      ["l18-fuzeren", "负责人", "fùzérén", "người phụ trách", "负责人正在处理投诉。", "Người phụ trách đang xử lý khiếu nại."],
      ["l18-chuzhi", "处置", "chǔzhì", "xử trí", "安全事件要按流程处置。", "Sự cố an toàn phải xử trí theo quy trình."],
      ["l18-jilu", "记录", "jìlù", "ghi chép", "处理结果要做好记录。", "Kết quả xử lý cần được ghi lại."],
    ],
    request: ["客人等餐时间过长，还发现桌边有水。", "Kèrén děngcān shíjiān guò cháng, hái fāxiàn zhuōbiān yǒu shuǐ.", "Khách chờ món quá lâu và còn thấy nước gần bàn."],
    response: ["我会先处理安全风险，再更新出餐时间。", "Wǒ huì xiān chǔlǐ ānquán fēngxiǎn, zài gēngxīn chūcān shíjiān.", "Tôi sẽ xử lý rủi ro an toàn trước rồi cập nhật giờ ra món."],
    notes: [note("Ưu tiên đúng thứ tự", "先处理安全，再处理服务", "Nguy cơ gây thương tích phải được ưu tiên theo SOP."), note("Ghi nhận sau xử lý", "记录情况、行动和结果", "Biên bản rõ giúp bàn giao và phòng ngừa lặp lại.")], challenge: tableServiceChallenge,
  },
  {
    moduleSlug: "thanh-toan-va-phan-hoi", slug: "kiem-tra-hoa-don-va-thanh-toan", title: "Kiểm tra hóa đơn và thanh toán",
    summary: "In hóa đơn, giải thích chi tiết món, tổng tiền và phí dịch vụ trước khi thu tiền.", situation: "Khách yêu cầu tính tiền", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l19-jiezhang", "结账", "jiézhàng", "thanh toán", "客人准备结账。", "Khách chuẩn bị thanh toán."],
      ["l19-zhangdan", "账单", "zhàngdān", "hóa đơn thanh toán", "这是您的账单。", "Đây là hóa đơn của anh/chị."],
      ["l19-mingxi", "明细", "míngxì", "chi tiết các khoản", "请核对账单明细。", "Hãy kiểm tra chi tiết hóa đơn."],
      ["l19-hedan", "核单", "hédān", "kiểm tra hóa đơn", "结账前需要核单。", "Trước khi thanh toán cần kiểm hóa đơn."],
      ["l19-heji", "合计", "héjì", "tổng cộng", "账单合计是五百元。", "Tổng hóa đơn là 500 tệ."],
      ["l19-fuwufei", "服务费", "fúwùfèi", "phí dịch vụ", "合计里包含服务费。", "Tổng tiền có gồm phí dịch vụ."],
    ],
    request: ["客人想确认账单里是否包含服务费。", "Kèrén xiǎng quèrèn zhàngdān lǐ shìfǒu bāohán fúwùfèi.", "Khách muốn xác nhận hóa đơn có gồm phí dịch vụ không."],
    response: ["我会逐项说明明细和合计金额。", "Wǒ huì zhúxiàng shuōmíng míngxì hé héjì jīn'é.", "Tôi sẽ giải thích từng chi tiết và tổng tiền."],
    notes: [note("Mời đối chiếu", "请核对账单明细", "Cho khách thời gian kiểm tra trước khi thực hiện thanh toán."), note("Giải thích theo hệ thống", "账单显示……", "Phí, thuế và ưu đãi phải theo hóa đơn và chính sách thực tế.")],
  },
  {
    moduleSlug: "thanh-toan-va-phan-hoi", slug: "phuong-thuc-thanh-toan-va-hoa-don", title: "Phương thức thanh toán và hóa đơn",
    summary: "Hỏi phương thức trả tiền, hỗ trợ quét mã hoặc thẻ và lấy thông tin xuất hóa đơn.", situation: "Khách chọn cách thanh toán", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l20-xianjin", "现金", "xiànjīn", "tiền mặt", "您用现金还是刷卡？", "Anh/chị dùng tiền mặt hay quẹt thẻ?"],
      ["l20-shuaka", "刷卡", "shuākǎ", "quẹt thẻ", "这张卡可以刷卡支付。", "Thẻ này có thể thanh toán bằng quẹt thẻ."],
      ["l20-saoma", "扫码", "sǎomǎ", "quét mã", "请扫码完成付款。", "Hãy quét mã để hoàn tất thanh toán."],
      ["l20-zhifu", "支付", "zhīfù", "chi trả", "系统显示支付成功。", "Hệ thống hiển thị thanh toán thành công."],
      ["l20-fapiao", "发票", "fāpiào", "hóa đơn", "需要开具发票吗？", "Có cần xuất hóa đơn không?"],
      ["l20-taitou", "抬头", "táitóu", "tên ghi trên hóa đơn", "请提供发票抬头。", "Hãy cung cấp tên xuất hóa đơn."],
    ],
    request: ["客人要刷卡，并需要公司发票。", "Kèrén yào shuākǎ, bìng xūyào gōngsī fāpiào.", "Khách muốn quẹt thẻ và cần hóa đơn công ty."],
    response: ["我会确认支付结果和发票信息。", "Wǒ huì quèrèn zhīfù jiéguǒ hé fāpiào xìnxī.", "Tôi sẽ xác nhận kết quả thanh toán và thông tin hóa đơn."],
    notes: [note("Hỏi phương thức", "您想用哪种方式支付？", "Câu hỏi mở phù hợp khi nhà hàng hỗ trợ nhiều cách thanh toán."), note("Không dựa vào ảnh giao dịch", "以系统确认成功为准", "Kết quả thanh toán cần theo hệ thống hoặc bộ phận thu ngân.")],
  },
  {
    moduleSlug: "thanh-toan-va-phan-hoi", slug: "tach-hoa-don-va-ap-dung-uu-dai", title: "Tách hóa đơn và áp dụng ưu đãi",
    summary: "Xác nhận cách chia tiền, phiếu ưu đãi, hội viên và điều kiện áp dụng.", situation: "Nhóm khách muốn thanh toán riêng", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l21-fenkaijiezhang", "分开结账", "fēnkāi jiézhàng", "thanh toán riêng", "我们想分开结账。", "Chúng tôi muốn thanh toán riêng."],
      ["l21-pingtan", "平摊", "píngtān", "chia đều", "四个人平摊账单。", "Bốn người chia đều hóa đơn."],
      ["l21-youhuiquan", "优惠券", "yōuhuìquàn", "phiếu ưu đãi", "这张优惠券今天可以使用。", "Phiếu ưu đãi này dùng được hôm nay."],
      ["l21-zhekou", "折扣", "zhékòu", "chiết khấu", "会员可以享受折扣。", "Hội viên có thể hưởng chiết khấu."],
      ["l21-huiyuan", "会员", "huìyuán", "hội viên", "请出示会员码。", "Hãy xuất trình mã hội viên."],
      ["l21-shiyongtiaojian", "使用条件", "shǐyòng tiáojiàn", "điều kiện sử dụng", "请查看优惠券的使用条件。", "Hãy xem điều kiện sử dụng phiếu ưu đãi."],
    ],
    request: ["四位客人想平摊账单并使用优惠券。", "Sì wèi kèrén xiǎng píngtān zhàngdān bìng shǐyòng yōuhuìquàn.", "Bốn khách muốn chia đều hóa đơn và dùng phiếu ưu đãi."],
    response: ["我会先确认分账方式和优惠条件。", "Wǒ huì xiān quèrèn fēnzhàng fāngshì hé yōuhuì tiáojiàn.", "Tôi sẽ xác nhận cách chia và điều kiện ưu đãi trước."],
    notes: [note("Làm rõ cách chia", "按人平摊，还是按菜品分开？", "Hỏi rõ chia đều theo người hay tách theo món."), note("Ưu đãi theo điều kiện", "这张券适用于……", "Không tự cộng ưu đãi nếu hệ thống hoặc chính sách không cho phép.")],
  },
  {
    moduleSlug: "thanh-toan-va-phan-hoi", slug: "tiep-nhan-khieu-nai-va-chuyen-quan-ly", title: "Tiếp nhận khiếu nại và chuyển quản lý",
    summary: "Lắng nghe, xác minh dữ kiện và chuyển cấp khi phương án vượt thẩm quyền.", situation: "Khách không hài lòng và yêu cầu hoàn tiền", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l22-tousu", "投诉", "tóusù", "khiếu nại", "客人提出了正式投诉。", "Khách đưa ra khiếu nại chính thức."],
      ["l22-buman", "不满", "bùmǎn", "không hài lòng", "我理解您对服务不满。", "Tôi hiểu anh/chị không hài lòng về dịch vụ."],
      ["l22-heshi", "核实", "héshí", "xác minh", "我先核实点餐记录。", "Tôi xác minh lịch sử gọi món trước."],
      ["l22-jiejuefangan", "解决方案", "jiějué fāng'àn", "phương án giải quyết", "负责人会提供解决方案。", "Người phụ trách sẽ đưa phương án."],
      ["l22-tuikuan", "退款", "tuìkuǎn", "hoàn tiền", "退款需要经理批准。", "Hoàn tiền cần quản lý phê duyệt."],
      ["l22-quanxian", "权限", "quánxiàn", "thẩm quyền", "这个处理超出我的权限。", "Cách xử lý này vượt thẩm quyền của tôi."],
    ],
    request: ["客人要求退款，但需要经理批准。", "Kèrén yāoqiú tuìkuǎn, dàn xūyào jīnglǐ pīzhǔn.", "Khách yêu cầu hoàn tiền nhưng cần quản lý phê duyệt."],
    response: ["我会先核实情况，再请经理处理。", "Wǒ huì xiān héshí qíngkuàng, zài qǐng jīnglǐ chǔlǐ.", "Tôi sẽ xác minh tình hình rồi nhờ quản lý xử lý."],
    notes: [note("Ghi nhận không nhận lỗi vội", "很抱歉给您带来不便", "Xin lỗi vì bất tiện trong khi vẫn cần xác minh nguyên nhân."), note("Nêu giới hạn thẩm quyền", "我需要请经理确认", "Không tự hứa giảm giá hoặc hoàn tiền ngoài chính sách.")],
  },
  {
    moduleSlug: "thanh-toan-va-phan-hoi", slug: "dong-goi-mon-thua-va-chao-tam-biet", title: "Đóng gói món thừa và chào tạm biệt",
    summary: "Hỏi món cần mang về, chuẩn bị hộp và mời khách góp ý sau bữa ăn.", situation: "Khách chuẩn bị rời nhà hàng", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l23-dabao", "打包", "dǎbāo", "đóng gói mang về", "这些菜需要打包吗？", "Các món này có cần đóng gói không?"],
      ["l23-shengcai", "剩菜", "shèngcài", "món còn thừa", "请确认哪些剩菜要带走。", "Hãy xác nhận món thừa nào cần mang đi."],
      ["l23-dabaohe", "打包盒", "dǎbāo hé", "hộp mang về", "我去拿两个打包盒。", "Tôi đi lấy hai hộp mang về."],
      ["l23-pingjia", "评价", "píngjià", "đánh giá", "欢迎您留下用餐评价。", "Mời anh/chị để lại đánh giá bữa ăn."],
      ["l23-huanyingzailai", "欢迎再来", "huānyíng zài lái", "hoan nghênh quay lại", "谢谢光临，欢迎再来。", "Cảm ơn quý khách, hẹn gặp lại."],
      ["l23-huifang", "回访", "huífǎng", "liên hệ hỏi lại", "我们会对投诉进行回访。", "Chúng tôi sẽ liên hệ lại về khiếu nại."],
    ],
    request: ["客人想把两道剩菜打包带走。", "Kèrén xiǎng bǎ liǎng dào shèngcài dǎbāo dàizǒu.", "Khách muốn đóng gói hai món còn thừa mang về."],
    response: ["我会确认菜品和数量，再准备打包盒。", "Wǒ huì quèrèn càipǐn hé shùliàng, zài zhǔnbèi dǎbāo hé.", "Tôi sẽ xác nhận món và số lượng rồi chuẩn bị hộp."],
    notes: [note("Xác nhận món mang về", "这两道菜需要打包，对吗？", "Nhắc lại giúp tránh đóng nhầm món khách không muốn lấy."), note("An toàn mang về", "按门店流程说明保存要求", "Bảo quản và thời hạn sử dụng phải theo hướng dẫn thực tế của nhà hàng.")],
  },
  {
    moduleSlug: "thanh-toan-va-phan-hoi", slug: "kiem-tra-tong-hop-nha-hang-dich-vu", title: "Kiểm tra tổng hợp: Nhà hàng & dịch vụ",
    summary: "Tổng hợp đón khách, gọi món, phục vụ, thanh toán và xử lý phản hồi an toàn.", situation: "Đánh giá cuối lộ trình", estimatedMinutes: 16, isFree: false,
    vocabulary: [
      ["l24-yongcantiyan", "用餐体验", "yòngcān tǐyàn", "trải nghiệm dùng bữa", "我们重视您的用餐体验。", "Chúng tôi coi trọng trải nghiệm dùng bữa."],
      ["l24-yijian", "意见", "yìjiàn", "ý kiến", "谢谢您提出意见。", "Cảm ơn anh/chị đã góp ý."],
      ["l24-gaijin", "改进", "gǎijìn", "cải thiện", "我们会根据反馈改进。", "Chúng tôi sẽ cải thiện theo phản hồi."],
      ["l24-zhibanjingli", "值班经理", "zhíbān jīnglǐ", "quản lý trực ca", "值班经理马上过来。", "Quản lý trực ca sẽ tới ngay."],
      ["l24-shipinanquan", "食品安全", "shípǐn ānquán", "an toàn thực phẩm", "食品安全问题要立即上报。", "Vấn đề an toàn thực phẩm phải báo ngay."],
      ["l24-xinren", "信任", "xìnrèn", "niềm tin", "透明沟通有助于建立信任。", "Trao đổi minh bạch giúp xây dựng niềm tin."],
    ],
    request: ["客人反馈服务慢，并提出食品安全方面的担忧。", "Kèrén fǎnkuì fúwù màn, bìng tíchū shípǐn ānquán fāngmiàn de dānyōu.", "Khách phản hồi phục vụ chậm và nêu lo ngại về an toàn thực phẩm."],
    response: ["我会记录事实，立即通知值班经理并按流程处理。", "Wǒ huì jìlù shìshí, lìjí tōngzhī zhíbān jīnglǐ bìng àn liúchéng chǔlǐ.", "Tôi sẽ ghi nhận sự việc, báo quản lý trực ca ngay và xử lý theo quy trình."],
    notes: [note("Kết thúc phản hồi", "事实 + 行动 + 更新时间", "Nêu sự việc, hành động và mốc cập nhật để khách biết bước tiếp theo."), note("Không thay thế SOP", "立即上报并按流程处理", "Dị ứng và an toàn thực phẩm cần quy trình chuyên môn; khóa học chỉ hỗ trợ giao tiếp.")], challenge: finalChallenge,
  },
];

export const restaurantLessons = restaurantLessonInputs.map(createLesson);

export const restaurantCourseStats = {
  lessons: restaurantLessons.length,
  minutes: restaurantLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: restaurantLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: new Set(restaurantLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.slug))).size,
  modules: restaurantModules.length,
};
