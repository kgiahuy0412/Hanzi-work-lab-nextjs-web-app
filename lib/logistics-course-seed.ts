import type { LessonChallenge, UsageNote, Vocabulary } from "./content-types.ts";
import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";

type LogisticsWordInput = [
  slug: string,
  hanzi: string,
  pinyin: string,
  meaning: string,
  example: string,
  translation: string,
];

type LogisticsLine = [hanzi: string, pinyin: string, translation: string];

type LogisticsLessonInput = Omit<CourseLessonSeed, "content" | "vocabulary"> & {
  vocabulary: LogisticsWordInput[];
  status: LogisticsLine;
  action: LogisticsLine;
  notes: [UsageNote, UsageNote];
  challenge?: LessonChallenge;
};

function toVocabulary(input: LogisticsWordInput): Vocabulary {
  const [slug, hanzi, pinyin, meaning, example, translation] = input;
  return { slug: `logistics-${slug}`, hanzi, pinyin, meaning, example, translation, audioUrl: null };
}

function createLesson(input: LogisticsLessonInput): CourseLessonSeed {
  const { status, action, challenge, notes, ...lesson } = input;
  return {
    ...lesson,
    vocabulary: lesson.vocabulary.map(toVocabulary),
    content: {
      dialogue: [
        { speaker: "A", hanzi: "现在货物是什么状态？", pinyin: "Xiànzài huòwù shì shénme zhuàngtài?", translation: "Hiện tại hàng hóa ở trạng thái nào?" },
        { speaker: "B", hanzi: status[0], pinyin: status[1], translation: status[2] },
        { speaker: "A", hanzi: "下一步需要怎么处理？", pinyin: "Xià yí bù xūyào zěnme chǔlǐ?", translation: "Bước tiếp theo cần xử lý thế nào?" },
        { speaker: "B", hanzi: action[0], pinyin: action[1], translation: action[2] },
      ],
      notes,
      ...(challenge ? { challenge } : {}),
    },
  };
}

const inboundChallenge: LessonChallenge = {
  title: "Kiểm tra nhập kho & kiểm đếm",
  description: "Đạt 4/5 câu để chuyển sang quản lý tồn kho và vị trí.",
  passScore: 4,
  questions: [
    { prompt: "实收四十八箱 nghĩa là gì?", options: ["Thực nhận 48 thùng", "Dự kiến 48 thùng", "Xuất 48 thùng"], correctOption: 0, explanation: "实收 là số lượng thực tế đã nhận tại kho." },
    { prompt: "Số lượng thực nhận ít hơn phiếu hai thùng. Cụm nào đúng?", options: ["比送货单少两箱", "比送货单多两箱", "一共两箱"], correctOption: 0, explanation: "比……少两箱 diễn tả ít hơn hai thùng so với chứng từ." },
    { prompt: "Bao bì bị rách, bước giao tiếp phù hợp là gì?", options: ["拍照并记录异常", "直接上架", "删除记录"], correctOption: 0, explanation: "Chụp ảnh và ghi nhận hiện tượng trước khi xử lý theo quy trình của kho." },
    { prompt: "送货单 là gì?", options: ["Phiếu giao hàng", "Phiếu nghỉ", "Lệnh sản xuất"], correctOption: 0, explanation: "送货单 là phiếu giao hàng dùng để đối chiếu lô nhận." },
    { prompt: "入库前 cần xác nhận điều gì?", options: ["数量、标签和货位", "Chỉ tên tài xế", "Chỉ giờ nghỉ"], correctOption: 0, explanation: "Số lượng, nhãn và vị trí là các thông tin cốt lõi trước khi hoàn tất nhập kho." },
  ],
};

const inventoryChallenge: LessonChallenge = {
  title: "Kiểm tra tồn kho & vị trí",
  description: "Đạt 4/5 câu để chuyển sang soạn hàng và xuất kho.",
  passScore: 4,
  questions: [
    { prompt: "货位 nghĩa là gì?", options: ["Vị trí lưu hàng", "Phí vận chuyển", "Số xe"], correctOption: 0, explanation: "货位 là vị trí được quy định để lưu hàng trong kho." },
    { prompt: "账面数量与实物不一致 mô tả điều gì?", options: ["Sổ sách và thực tế lệch nhau", "Hàng đã giao đúng", "Xe đến sớm"], correctOption: 0, explanation: "账面数量 là số trên hệ thống/sổ; 实物 là hàng thực tế." },
    { prompt: "盘点 dùng trong công việc nào?", options: ["Kiểm kê tồn kho", "Đóng gói", "Đặt lịch xe"], correctOption: 0, explanation: "盘点 là đếm và đối chiếu tồn kho theo vị trí hoặc mã hàng." },
    { prompt: "库存不足 nghĩa là gì?", options: ["Tồn kho không đủ", "Tồn kho vừa tăng", "Hàng chưa dán nhãn"], correctOption: 0, explanation: "不足 nghĩa là không đủ so với nhu cầu hoặc mức yêu cầu." },
    { prompt: "发现错位货物后 nên làm gì?", options: ["记录并移到正确货位", "Bỏ qua", "Đưa thẳng ra cửa xuất"], correctOption: 0, explanation: "Cần ghi nhận và chuyển theo quy trình đến đúng vị trí để tránh sai tồn." },
  ],
};

const outboundChallenge: LessonChallenge = {
  title: "Kiểm tra soạn hàng & xuất kho",
  description: "Đạt 4/5 câu để chuyển sang vận chuyển và xử lý bất thường.",
  passScore: 4,
  questions: [
    { prompt: "拣货单 là gì?", options: ["Phiếu soạn hàng", "Phiếu giao ca", "Phiếu bảo trì"], correctOption: 0, explanation: "拣货单 cung cấp mã, số lượng và vị trí cần lấy." },
    { prompt: "先进先出 là nguyên tắc nào?", options: ["Nhập trước xuất trước", "Hết hạn sau xuất trước", "Hàng nặng xuất trước"], correctOption: 0, explanation: "先进先出 là FIFO: lô vào trước được xuất trước khi quy trình yêu cầu." },
    { prompt: "复核 được thực hiện để làm gì?", options: ["Kiểm tra lại mã và số lượng", "Tăng trọng lượng", "Đổi tài xế"], correctOption: 0, explanation: "复核 là kiểm tra lại trước khi đóng gói hoặc bàn giao." },
    { prompt: "包装箱超重 nghĩa là gì?", options: ["Thùng đóng gói quá nặng", "Thùng bị thiếu nhãn", "Thùng đã xuất"], correctOption: 0, explanation: "超重 là vượt trọng lượng cho phép hoặc quy định." },
    { prompt: "Câu nào xác nhận đúng cửa xuất?", options: ["这批货从三号门出库，对吗？", "这批货不用复核。", "三号门已经盘点。"], correctOption: 0, explanation: "Nhắc lại lô và cửa rồi dùng 对吗 để xác nhận." },
  ],
};

const finalChallenge: LessonChallenge = {
  title: "Kiểm tra tổng hợp Kho vận & logistics",
  description: "Đạt 5/6 câu để hoàn thành lộ trình.",
  passScore: 5,
  questions: [
    { prompt: "Khi chứng từ và hàng thực tế lệch nhau, nên làm gì trước?", options: ["停止入库并核对", "Sửa số liệu cho khớp", "Bỏ qua nếu chênh ít"], correctOption: 0, explanation: "Tạm dừng hoàn tất nhập kho và đối chiếu trước khi điều chỉnh theo thẩm quyền." },
    { prompt: "Khi hàng hư hỏng trong vận chuyển, thông tin nào cần báo?", options: ["运单号、损坏情况和照片", "Chỉ tên người báo", "Chỉ giờ đến"], correctOption: 0, explanation: "Mã vận đơn, tình trạng và bằng chứng giúp xác định phạm vi xử lý." },
    { prompt: "签收表示什么?", options: ["Xác nhận đã nhận hàng", "Từ chối xuất kho", "Kiểm kê định kỳ"], correctOption: 0, explanation: "签收 là ký/xác nhận đã nhận; ngoại lệ phải được ghi rõ trước khi xác nhận." },
    { prompt: "退货入库 trước hết cần làm gì?", options: ["核对退货单和货物状态", "Trộn với hàng bán được", "Xóa nhãn cũ ngay"], correctOption: 0, explanation: "Đối chiếu phiếu trả và tình trạng giúp phân luồng xử lý đúng." },
    { prompt: "延迟交付 nghĩa là gì?", options: ["Giao hàng chậm", "Giao đủ hàng", "Nhận hàng sớm"], correctOption: 0, explanation: "延迟 là trì hoãn/chậm; 交付 là bàn giao hoặc giao hàng." },
    { prompt: "Khi vận hành xe nâng hoặc xử lý hàng đặc biệt, khóa học này yêu cầu gì?", options: ["Tuân thủ chứng chỉ và SOP tại kho", "Tự làm theo đoạn hội thoại", "Bỏ qua biển cảnh báo"], correctOption: 0, explanation: "Nội dung chỉ hỗ trợ ngôn ngữ, không thay thế đào tạo, chứng chỉ hoặc quy trình an toàn." },
  ],
};

export const logisticsModules: CourseModuleSeed[] = [
  { slug: "nhap-kho-va-kiem-dem", title: "Nhập kho & kiểm đếm", description: "Nhận xe, đối chiếu chứng từ, kiểm đếm, báo hư hỏng và hoàn tất nhập kho." },
  { slug: "ton-kho-va-vi-tri", title: "Tồn kho & vị trí", description: "Đưa hàng lên kệ, tra vị trí, cập nhật tồn, kiểm kê và xử lý chênh lệch." },
  { slug: "soan-hang-va-xuat-kho", title: "Soạn hàng & xuất kho", description: "Nhận lệnh, lấy hàng, kiểm tra, đóng gói và bàn giao tại cửa xuất." },
  { slug: "van-chuyen-va-bat-thuong", title: "Vận chuyển & xử lý bất thường", description: "Điều phối xe, theo dõi giao hàng, ký nhận, hàng trả và sự cố vận chuyển." },
];

const logisticsLessonInputs: LogisticsLessonInput[] = [
  // Module 1: Nhập kho & kiểm đếm
  {
    moduleSlug: "nhap-kho-va-kiem-dem", slug: "nhan-xe-va-xac-nhan-lich-den", title: "Nhận xe và xác nhận lịch đến",
    summary: "Xác nhận lịch hẹn, biển số xe, tài xế và cửa nhận trước khi xe vào khu dỡ hàng.", situation: "Xe giao hàng đến kho", estimatedMinutes: 11, isFree: true,
    vocabulary: [
      ["yuyue", "预约", "yùyuē", "đặt lịch, lịch hẹn", "这辆车预约了上午九点到货。", "Xe này được hẹn giao lúc 9 giờ sáng."],
      ["daohuo", "到货", "dàohuò", "hàng đến", "预计十点到货。", "Dự kiến hàng đến lúc 10 giờ."],
      ["chepaihao", "车牌号", "chēpáihào", "biển số xe", "请确认一下车牌号。", "Hãy xác nhận lại biển số xe."],
      ["siji", "司机", "sījī", "tài xế", "司机正在门口登记。", "Tài xế đang đăng ký tại cổng."],
      ["yuetai", "月台", "yuètái", "cửa/bàn nâng dỡ hàng", "请把车开到二号月台。", "Hãy đưa xe đến cửa nhận số 2."],
      ["paidui", "排队", "páiduì", "xếp hàng chờ", "前面还有两辆车在排队。", "Phía trước còn hai xe đang xếp hàng."],
    ],
    status: ["这辆车预约九点到货，车牌号和司机信息已经确认。", "Zhè liàng chē yùyuē jiǔ diǎn dàohuò, chēpáihào hé sījī xìnxī yǐjīng quèrèn.", "Xe này hẹn đến lúc 9 giờ; biển số và thông tin tài xế đã được xác nhận."],
    action: ["我会安排到二号月台，并通知收货人员准备。", "Wǒ huì ānpái dào èr hào yuètái, bìng tōngzhī shōuhuò rényuán zhǔnbèi.", "Tôi sẽ bố trí vào cửa nhận số 2 và báo nhân viên nhận hàng chuẩn bị."],
    notes: [
      { title: "Xác nhận lịch xe", pattern: "预约……点到货", explanation: "Dùng để nhắc lại thời gian xe được hẹn tới kho." },
      { title: "Chỉ định cửa nhận", pattern: "请开到……号月台", explanation: "Nêu rõ số cửa/bàn nâng dỡ; người học vẫn phải theo điều phối giao thông tại kho." },
    ],
  },
  {
    moduleSlug: "nhap-kho-va-kiem-dem", slug: "kiem-tra-chung-tu-giao-hang", title: "Kiểm tra chứng từ giao hàng",
    summary: "Đối chiếu phiếu giao, đơn mua, danh sách đóng gói và báo chứng từ còn thiếu.", situation: "Kiểm tra hồ sơ lô nhận", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["songhuodan", "送货单", "sònghuòdān", "phiếu giao hàng", "送货单上写了五十箱。", "Phiếu giao hàng ghi 50 thùng."],
      ["caigoudan", "采购单", "cǎigòudān", "đơn mua hàng", "请核对采购单号。", "Hãy đối chiếu số đơn mua hàng."],
      ["zhuangxiangdan", "装箱单", "zhuāngxiāngdān", "danh sách đóng gói", "装箱单放在文件袋里。", "Danh sách đóng gói nằm trong túi hồ sơ."],
      ["danju", "单据", "dānjù", "chứng từ", "入库前要检查所有单据。", "Trước khi nhập kho phải kiểm tra tất cả chứng từ."],
      ["hedui", "核对", "héduì", "đối chiếu", "请核对产品名称和数量。", "Hãy đối chiếu tên sản phẩm và số lượng."],
      ["queshao", "缺少", "quēshǎo", "thiếu", "这批货缺少装箱单。", "Lô hàng này thiếu danh sách đóng gói."],
    ],
    status: ["送货单和采购单一致，但是还缺少装箱单。", "Sònghuòdān hé cǎigòudān yízhì, dànshì hái quēshǎo zhuāngxiāngdān.", "Phiếu giao hàng và đơn mua khớp nhau nhưng vẫn thiếu danh sách đóng gói."],
    action: ["我先暂停入库，请司机联系供应商补充单据。", "Wǒ xiān zàntíng rùkù, qǐng sījī liánxì gōngyìngshāng bǔchōng dānjù.", "Tôi sẽ tạm dừng nhập kho và đề nghị tài xế liên hệ nhà cung cấp bổ sung chứng từ."],
    notes: [
      { title: "Báo chứng từ khớp", pattern: "……和……一致", explanation: "一致 nghĩa là nhất quán/khớp nhau khi đối chiếu hai nguồn thông tin." },
      { title: "Báo hồ sơ thiếu", pattern: "还缺少……", explanation: "还 cho biết vẫn còn thiếu một tài liệu trước khi hoàn tất quy trình." },
    ],
  },
  {
    moduleSlug: "nhap-kho-va-kiem-dem", slug: "kiem-dem-so-luong-thuc-nhan", title: "Kiểm đếm số lượng thực nhận",
    summary: "Đếm theo thùng, kiện và pallet; báo chênh lệch giữa thực nhận và chứng từ.", situation: "Dỡ và kiểm đếm hàng", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["shishou", "实收", "shíshōu", "thực nhận", "我们实收四十八箱。", "Chúng tôi thực nhận 48 thùng."],
      ["jianshu", "件数", "jiànshù", "số kiện", "请确认总件数。", "Hãy xác nhận tổng số kiện."],
      ["xiang", "箱", "xiāng", "thùng", "一个托盘有二十箱。", "Một pallet có 20 thùng."],
      ["tuopan", "托盘", "tuōpán", "pallet", "这批货一共有五个托盘。", "Lô hàng này có tổng cộng 5 pallet."],
      ["chayi", "差异", "chāyì", "chênh lệch", "实收数量有差异。", "Số lượng thực nhận có chênh lệch."],
      ["duanshao", "短少", "duǎnshǎo", "thiếu hụt", "本批短少两箱。", "Lô này thiếu hai thùng."],
    ],
    status: ["送货单是五十箱，我们实收四十八箱，短少两箱。", "Sònghuòdān shì wǔshí xiāng, wǒmen shíshōu sìshíbā xiāng, duǎnshǎo liǎng xiāng.", "Phiếu giao ghi 50 thùng, chúng tôi thực nhận 48 thùng, thiếu hai thùng."],
    action: ["我会重新清点并记录差异，请司机一起确认。", "Wǒ huì chóngxīn qīngdiǎn bìng jìlù chāyì, qǐng sījī yìqǐ quèrèn.", "Tôi sẽ kiểm đếm lại, ghi chênh lệch và mời tài xế cùng xác nhận."],
    notes: [
      { title: "So sánh số lượng", pattern: "实收……，比送货单少……", explanation: "Cấu trúc nêu số thực nhận và mức thiếu so với chứng từ." },
      { title: "Yêu cầu cùng xác nhận", pattern: "请……一起确认", explanation: "一起确认 giúp ghi nhận chênh lệch có sự tham gia của bên giao và bên nhận." },
    ],
  },
  {
    moduleSlug: "nhap-kho-va-kiem-dem", slug: "kiem-tra-bao-bi-va-hu-hong", title: "Kiểm tra bao bì và hư hỏng",
    summary: "Mô tả bao bì rách, ẩm, móp và ghi nhận bằng ảnh trước khi xử lý.", situation: "Phát hiện kiện hàng bất thường", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["baozhuang", "包装", "bāozhuāng", "bao bì, đóng gói", "外包装需要检查。", "Bao bì bên ngoài cần được kiểm tra."],
      ["posun", "破损", "pòsǔn", "rách/hư hỏng", "纸箱右侧有破损。", "Bên phải thùng carton bị rách."],
      ["shouchao", "受潮", "shòucháo", "bị ẩm", "底部受潮比较严重。", "Phần đáy bị ẩm khá nghiêm trọng."],
      ["aoxian", "凹陷", "āoxiàn", "móp, lõm", "箱子一角有凹陷。", "Một góc thùng bị móp."],
      ["paizhao", "拍照", "pāizhào", "chụp ảnh", "请先拍照保留证据。", "Hãy chụp ảnh lưu bằng chứng trước."],
      ["yichang", "异常", "yìcháng", "bất thường", "包装异常已经记录。", "Bất thường bao bì đã được ghi nhận."],
    ],
    status: ["三个纸箱外包装破损，其中一个底部受潮。", "Sān ge zhǐxiāng wài bāozhuāng pòsǔn, qízhōng yí ge dǐbù shòucháo.", "Ba thùng carton bị hư bao bì, trong đó một thùng bị ẩm đáy."],
    action: ["我先拍照并记录异常，再放到待检区。", "Wǒ xiān pāizhào bìng jìlù yìcháng, zài fàng dào dàijiǎn qū.", "Tôi sẽ chụp ảnh, ghi nhận bất thường rồi đưa vào khu chờ kiểm tra."],
    notes: [
      { title: "Mô tả vị trí hư hỏng", pattern: "……的顶部 / 底部 / 右侧有……", explanation: "Nêu vị trí giúp báo cáo bao bì cụ thể hơn." },
      { title: "Ghi nhận trước xử lý", pattern: "先拍照并记录，再……", explanation: "先…再… thể hiện thứ tự ghi bằng chứng trước khi di chuyển hoặc xử lý." },
    ],
  },
  {
    moduleSlug: "nhap-kho-va-kiem-dem", slug: "gan-nhan-va-dua-hang-vao-vi-tri", title: "Gắn nhãn và đưa hàng vào vị trí",
    summary: "Quét mã, in nhãn nhập kho và xác nhận vị trí trước khi đưa hàng lên kệ.", situation: "Hoàn tất nhận hàng", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["biaoqian", "标签", "biāoqiān", "nhãn", "每个托盘都要贴标签。", "Mỗi pallet đều phải dán nhãn."],
      ["tiaoma", "条码", "tiáomǎ", "mã vạch", "这个条码无法扫描。", "Mã vạch này không quét được."],
      ["ruku", "入库", "rùkù", "nhập kho", "货物已经完成入库。", "Hàng đã hoàn tất nhập kho."],
      ["shangjia", "上架", "shàngjià", "đưa hàng lên kệ", "上架前要确认货位。", "Trước khi lên kệ cần xác nhận vị trí."],
      ["huowei", "货位", "huòwèi", "vị trí lưu hàng", "系统分配的货位是A-03。", "Vị trí hệ thống phân là A-03."],
      ["saomiao", "扫描", "sǎomiáo", "quét mã", "请扫描托盘标签。", "Hãy quét nhãn pallet."],
    ],
    status: ["货物已经贴好标签，系统分配到A-03货位。", "Huòwù yǐjīng tiē hǎo biāoqiān, xìtǒng fēnpèi dào A-03 huòwèi.", "Hàng đã được dán nhãn và hệ thống phân vào vị trí A-03."],
    action: ["我会先扫描标签，确认货位后再上架。", "Wǒ huì xiān sǎomiáo biāoqiān, quèrèn huòwèi hòu zài shàngjià.", "Tôi sẽ quét nhãn, xác nhận vị trí rồi mới đưa lên kệ."],
    notes: [
      { title: "Báo vị trí được phân", pattern: "系统分配到……货位", explanation: "Dùng để nói vị trí lưu do hệ thống hoặc điều phối phân." },
      { title: "Xác nhận quét trước lên kệ", pattern: "扫描确认后再上架", explanation: "后再 nhấn mạnh chỉ thực hiện lên kệ sau khi thông tin đã được xác nhận." },
    ],
  },
  {
    moduleSlug: "nhap-kho-va-kiem-dem", slug: "kiem-tra-nhap-kho-va-kiem-dem", title: "Kiểm tra: Nhập kho & kiểm đếm",
    summary: "Ôn lịch xe, chứng từ, số lượng, bao bì và quy trình hoàn tất nhập kho.", situation: "Đánh giá cuối module 1", estimatedMinutes: 14, isFree: true,
    vocabulary: [
      ["shouhuo", "收货", "shōuhuò", "nhận hàng", "收货人员已经到月台。", "Nhân viên nhận hàng đã tới cửa nhận."],
      ["daohuo-shijian", "到货时间", "dàohuò shíjiān", "thời gian hàng đến", "实际到货时间是九点十五分。", "Thời gian đến thực tế là 9 giờ 15."],
      ["qianzi", "签字", "qiānzì", "ký tên", "双方确认差异后签字。", "Hai bên xác nhận chênh lệch rồi ký."],
      ["zancunqu", "暂存区", "zàncúnqū", "khu lưu tạm", "异常货物先放在暂存区。", "Hàng bất thường được đặt tại khu lưu tạm trước."],
      ["jushou", "拒收", "jùshōu", "từ chối nhận", "是否拒收要由负责人决定。", "Việc có từ chối nhận hay không do người phụ trách quyết định."],
      ["ruku-jilu", "入库记录", "rùkù jìlù", "biên bản nhập kho", "入库记录里要写实际数量。", "Biên bản nhập kho phải ghi số lượng thực tế."],
    ],
    status: ["数量差异和包装异常都已记录，货物暂时未入库。", "Shùliàng chāyì hé bāozhuāng yìcháng dōu yǐ jìlù, huòwù zànshí wèi rùkù.", "Chênh lệch số lượng và bất thường bao bì đã được ghi; hàng tạm thời chưa nhập kho."],
    action: ["双方确认签字后，等待负责人决定入库还是拒收。", "Shuāngfāng quèrèn qiānzì hòu, děngdài fùzérén juédìng rùkù háishì jùshōu.", "Sau khi hai bên xác nhận và ký, sẽ chờ người phụ trách quyết định nhập hay từ chối nhận."],
    notes: [
      { title: "Báo chưa nhập kho", pattern: "货物暂时未入库", explanation: "暂时未 biểu thị trạng thái hiện tại chưa hoàn tất, không đồng nghĩa với đã từ chối nhận." },
      { title: "Đưa lựa chọn xử lý", pattern: "决定……还是……", explanation: "还是 nối hai phương án cần người có thẩm quyền quyết định." },
    ],
    challenge: inboundChallenge,
  },

  // Module 2: Tồn kho & vị trí
  {
    moduleSlug: "ton-kho-va-vi-tri", slug: "doc-ma-hang-va-vi-tri-luu", title: "Đọc mã hàng và vị trí lưu",
    summary: "Xác nhận mã vật liệu, tên hàng, quy cách và tọa độ vị trí trong kho.", situation: "Tìm đúng hàng trong kho", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["wuliao-bianma", "物料编码", "wùliào biānmǎ", "mã vật liệu", "请按物料编码查找货物。", "Hãy tìm hàng theo mã vật liệu."],
      ["pinming", "品名", "pǐnmíng", "tên hàng", "标签上的品名不清楚。", "Tên hàng trên nhãn không rõ."],
      ["guige", "规格", "guīgé", "quy cách", "同一个品名有两种规格。", "Cùng một tên hàng có hai quy cách."],
      ["kuqu", "库区", "kùqū", "khu kho", "这批货放在原料库区。", "Lô này đặt tại khu nguyên liệu."],
      ["pai", "排", "pái", "dãy kệ", "B区第三排在右边。", "Dãy thứ ba khu B ở bên phải."],
      ["ceng", "层", "céng", "tầng kệ", "货物在第二层。", "Hàng nằm ở tầng thứ hai."],
    ],
    status: ["系统显示物料在B区第三排第二层。", "Xìtǒng xiǎnshì wùliào zài B qū dì sān pái dì èr céng.", "Hệ thống hiển thị vật liệu ở khu B, dãy 3, tầng 2."],
    action: ["我会核对编码、品名和规格，再确认实际货位。", "Wǒ huì héduì biānmǎ, pǐnmíng hé guīgé, zài quèrèn shíjì huòwèi.", "Tôi sẽ đối chiếu mã, tên, quy cách rồi xác nhận vị trí thực tế."],
    notes: [
      { title: "Đọc tọa độ kho", pattern: "……区第……排第……层", explanation: "Dùng thứ tự khu–dãy–tầng để mô tả vị trí lưu rõ ràng." },
      { title: "Phân biệt tên và quy cách", pattern: "品名相同，规格不同", explanation: "Cùng tên hàng chưa chắc cùng quy cách; cần xác nhận cả hai." },
    ],
  },
  {
    moduleSlug: "ton-kho-va-vi-tri", slug: "dua-hang-len-ke-dung-vi-tri", title: "Đưa hàng lên kệ đúng vị trí",
    summary: "Nhận nhiệm vụ lên kệ, kiểm tra dung lượng, tải trọng và tránh trộn lẫn hàng.", situation: "Thực hiện nhiệm vụ putaway", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["shangjia-renwu", "上架任务", "shàngjià rènwu", "nhiệm vụ lên kệ", "系统生成了新的上架任务。", "Hệ thống tạo nhiệm vụ lên kệ mới."],
      ["tuijian-huowei", "推荐货位", "tuījiàn huòwèi", "vị trí được đề xuất", "推荐货位目前没有空间。", "Vị trí đề xuất hiện không còn chỗ."],
      ["kurong", "库容", "kùróng", "sức chứa kho", "这个库区的库容已经满了。", "Sức chứa khu kho này đã đầy."],
      ["zhongliang-xianzhi", "重量限制", "zhòngliàng xiànzhì", "giới hạn tải trọng", "货架上标有重量限制。", "Trên kệ có ghi giới hạn tải trọng."],
      ["hunfang", "混放", "hùnfàng", "để lẫn hàng", "不同批次不能随意混放。", "Không được tùy ý để lẫn các lô khác nhau."],
      ["shangjia-queren", "上架确认", "shàngjià quèrèn", "xác nhận lên kệ", "完成后请做上架确认。", "Sau khi hoàn thành hãy xác nhận lên kệ."],
    ],
    status: ["推荐货位已经满了，而且这个托盘接近货架重量限制。", "Tuījiàn huòwèi yǐjīng mǎn le, érqiě zhège tuōpán jiējìn huòjià zhòngliàng xiànzhì.", "Vị trí đề xuất đã đầy và pallet này gần giới hạn tải trọng của kệ."],
    action: ["我先暂停上架，请负责人重新分配合适货位。", "Wǒ xiān zàntíng shàngjià, qǐng fùzérén chóngxīn fēnpèi héshì huòwèi.", "Tôi sẽ tạm dừng lên kệ và đề nghị người phụ trách phân vị trí phù hợp khác."],
    notes: [
      { title: "Báo vị trí không phù hợp", pattern: "推荐货位已经满了 / 不合适", explanation: "Nêu lý do cụ thể thay vì tự chọn vị trí ngoài hệ thống." },
      { title: "Xin phân lại", pattern: "请重新分配货位", explanation: "重新分配 là phân lại; phù hợp khi vị trí đề xuất không đáp ứng điều kiện." },
    ],
  },
  {
    moduleSlug: "ton-kho-va-vi-tri", slug: "cap-nhat-va-kiem-tra-ton-kho", title: "Cập nhật và kiểm tra tồn kho",
    summary: "Phân biệt tồn khả dụng, tồn bị khóa và báo khi số lượng không đủ cho đơn.", situation: "Kiểm tra tồn trước khi cấp hàng", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["kucun", "库存", "kùcún", "tồn kho", "系统库存是一百二十件。", "Tồn kho hệ thống là 120 sản phẩm."],
      ["keyong-kucun", "可用库存", "kěyòng kùcún", "tồn khả dụng", "可用库存只剩五十件。", "Tồn khả dụng chỉ còn 50 sản phẩm."],
      ["dongjie-kucun", "冻结库存", "dòngjié kùcún", "tồn bị khóa", "二十件库存正在冻结。", "20 sản phẩm tồn đang bị khóa."],
      ["xitong-shuliang", "系统数量", "xìtǒng shùliàng", "số lượng hệ thống", "系统数量还没有更新。", "Số lượng trên hệ thống chưa được cập nhật."],
      ["gengxin", "更新", "gēngxīn", "cập nhật", "请及时更新库存状态。", "Hãy cập nhật trạng thái tồn kho kịp thời."],
      ["kucun-buzu", "库存不足", "kùcún bùzú", "tồn kho không đủ", "库存不足会影响出库。", "Tồn kho không đủ sẽ ảnh hưởng xuất kho."],
    ],
    status: ["系统数量是一百二十件，但可用库存只有八十件。", "Xìtǒng shùliàng shì yìbǎi èrshí jiàn, dàn kěyòng kùcún zhǐyǒu bāshí jiàn.", "Số hệ thống là 120 nhưng tồn khả dụng chỉ có 80 sản phẩm."],
    action: ["我会确认冻结原因，再更新可用库存并通知计划人员。", "Wǒ huì quèrèn dòngjié yuányīn, zài gēngxīn kěyòng kùcún bìng tōngzhī jìhuà rényuán.", "Tôi sẽ xác nhận lý do khóa, cập nhật tồn khả dụng và báo nhân viên kế hoạch."],
    notes: [
      { title: "Phân biệt tồn tổng và khả dụng", pattern: "系统库存……，可用库存……", explanation: "Không dùng tồn tổng để cam kết xuất hàng nếu một phần đang bị khóa." },
      { title: "Báo ảnh hưởng", pattern: "库存不足会影响……", explanation: "会影响 nối tình trạng thiếu với hoạt động bị ảnh hưởng." },
    ],
  },
  {
    moduleSlug: "ton-kho-va-vi-tri", slug: "kiem-ke-dinh-ky", title: "Kiểm kê định kỳ",
    summary: "Đọc phiếu kiểm kê, đếm hàng thực tế và báo thừa/thiếu so với hệ thống.", situation: "Kiểm kê một khu kho", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["pandian", "盘点", "pándiǎn", "kiểm kê", "今天下午盘点B库区。", "Chiều nay kiểm kê khu B."],
      ["pandianbiao", "盘点表", "pándiǎnbiǎo", "phiếu kiểm kê", "请在盘点表上填写实数。", "Hãy điền số thực tế lên phiếu kiểm kê."],
      ["shiwu", "实物", "shíwù", "hàng thực tế", "实物数量是九十八件。", "Số lượng hàng thực tế là 98."],
      ["zhangmian-shuliang", "账面数量", "zhàngmiàn shùliàng", "số lượng sổ sách", "账面数量比实物多两件。", "Số sổ sách nhiều hơn thực tế hai sản phẩm."],
      ["panying", "盘盈", "pányíng", "thừa kiểm kê", "这个货位盘盈一件。", "Vị trí này thừa kiểm kê một sản phẩm."],
      ["pankui", "盘亏", "pánkuī", "thiếu kiểm kê", "另一个货位盘亏三件。", "Vị trí khác thiếu kiểm kê ba sản phẩm."],
    ],
    status: ["账面数量是一百件，实物只有九十八件，盘亏两件。", "Zhàngmiàn shùliàng shì yìbǎi jiàn, shíwù zhǐyǒu jiǔshíbā jiàn, pánkuī liǎng jiàn.", "Sổ sách có 100, thực tế chỉ 98, thiếu kiểm kê hai sản phẩm."],
    action: ["我会重新盘点相邻货位，确认后提交差异。", "Wǒ huì chóngxīn pándiǎn xiānglín huòwèi, quèrèn hòu tíjiāo chāyì.", "Tôi sẽ kiểm kê lại các vị trí liền kề và gửi chênh lệch sau khi xác nhận."],
    notes: [
      { title: "Báo kết quả kiểm kê", pattern: "账面……，实物……，盘亏 / 盘盈……", explanation: "Nêu lần lượt số sổ, số thực tế và chênh lệch." },
      { title: "Kiểm tra vị trí liền kề", pattern: "重新盘点相邻货位", explanation: "相邻货位 là vị trí bên cạnh, thường cần kiểm tra khi nghi ngờ để sai chỗ." },
    ],
  },
  {
    moduleSlug: "ton-kho-va-vi-tri", slug: "xu-ly-chenh-lech-va-sai-vi-tri", title: "Xử lý chênh lệch và sai vị trí",
    summary: "Báo hàng sai vị trí, thiếu nhãn, thừa/thiếu và yêu cầu kiểm tra trước điều chỉnh.", situation: "Phát hiện bất thường tồn kho", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["cuowei", "错位", "cuòwèi", "sai vị trí", "发现两箱货物错位。", "Phát hiện hai thùng hàng sai vị trí."],
      ["duohuo", "多货", "duōhuò", "thừa hàng", "A货位多了一箱。", "Vị trí A thừa một thùng."],
      ["shaohuo", "少货", "shǎohuò", "thiếu hàng", "B货位少了两件。", "Vị trí B thiếu hai sản phẩm."],
      ["wubiaoqian", "无标签", "wú biāoqiān", "không có nhãn", "暂存区有一个无标签托盘。", "Khu lưu tạm có một pallet không nhãn."],
      ["tiaozheng", "调整", "tiáozhěng", "điều chỉnh", "库存调整需要审批。", "Điều chỉnh tồn kho cần phê duyệt."],
      ["fuhe", "复核", "fùhé", "kiểm tra lại", "提交调整前必须复核。", "Phải kiểm tra lại trước khi gửi điều chỉnh."],
    ],
    status: ["A货位多一箱，B货位少一箱，可能是上架错位。", "A huòwèi duō yì xiāng, B huòwèi shǎo yì xiāng, kěnéng shì shàngjià cuòwèi.", "Vị trí A thừa một thùng, B thiếu một thùng, có thể đã lên kệ sai."],
    action: ["我会复核条码和批次，确认后再申请库存调整。", "Wǒ huì fùhé tiáomǎ hé pīcì, quèrèn hòu zài shēnqǐng kùcún tiáozhěng.", "Tôi sẽ kiểm tra lại mã vạch và lô, xác nhận rồi mới xin điều chỉnh tồn."],
    notes: [
      { title: "Nêu giả thuyết thận trọng", pattern: "可能是……", explanation: "可能 là có thể; dùng khi dấu hiệu chưa đủ để kết luận nguyên nhân." },
      { title: "Điều chỉnh có kiểm soát", pattern: "确认后再申请库存调整", explanation: "Không tự sửa số liệu trước khi kiểm tra và xin phê duyệt theo quyền hạn." },
    ],
  },
  {
    moduleSlug: "ton-kho-va-vi-tri", slug: "kiem-tra-ton-kho-va-vi-tri", title: "Kiểm tra: Tồn kho & vị trí",
    summary: "Ôn vị trí, sức chứa, tồn khả dụng, kiểm kê và xử lý chênh lệch.", situation: "Đánh giá cuối module 2", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["kucun-zhunquelv", "库存准确率", "kùcún zhǔnquèlǜ", "độ chính xác tồn kho", "本月库存准确率提高了。", "Độ chính xác tồn kho tháng này đã tăng."],
      ["zhouzhuanlv", "周转率", "zhōuzhuǎnlǜ", "vòng quay tồn kho", "这个物料的周转率较低。", "Vòng quay của vật liệu này khá thấp."],
      ["daizhi-kucun", "呆滞库存", "dāizhì kùcún", "tồn chậm luân chuyển", "需要检查呆滞库存。", "Cần kiểm tra tồn chậm luân chuyển."],
      ["anquan-kucun", "安全库存", "ānquán kùcún", "tồn kho an toàn", "可用库存低于安全库存。", "Tồn khả dụng thấp hơn tồn an toàn."],
      ["buhuo", "补货", "bǔhuò", "bổ sung hàng", "拣货区需要及时补货。", "Khu soạn hàng cần được bổ sung kịp thời."],
      ["kucun-baogao", "库存报告", "kùcún bàogào", "báo cáo tồn kho", "库存报告已经发给负责人。", "Báo cáo tồn kho đã gửi người phụ trách."],
    ],
    status: ["可用库存低于安全库存，而且有一批呆滞库存。", "Kěyòng kùcún dīyú ānquán kùcún, érqiě yǒu yì pī dāizhì kùcún.", "Tồn khả dụng thấp hơn tồn an toàn và có một lô chậm luân chuyển."],
    action: ["我会提交库存报告，分别提出补货和处理建议。", "Wǒ huì tíjiāo kùcún bàogào, fēnbié tíchū bǔhuò hé chǔlǐ jiànyì.", "Tôi sẽ gửi báo cáo tồn kho và đề xuất riêng việc bổ sung lẫn xử lý tồn chậm."],
    notes: [
      { title: "So sánh với tồn an toàn", pattern: "可用库存低于安全库存", explanation: "低于 nghĩa là thấp hơn, dùng để báo nguy cơ thiếu." },
      { title: "Nêu hai hướng xử lý", pattern: "分别提出……和……建议", explanation: "分别 cho biết mỗi nhóm vấn đề có đề xuất riêng." },
    ],
    challenge: inventoryChallenge,
  },

  // Module 3: Soạn hàng & xuất kho
  {
    moduleSlug: "soan-hang-va-xuat-kho", slug: "nhan-lenh-va-soan-hang", title: "Nhận lệnh và soạn hàng",
    summary: "Đọc phiếu soạn, mã đơn, vị trí và số lượng trước khi bắt đầu lấy hàng.", situation: "Nhận nhiệm vụ picking", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["jianhuodan", "拣货单", "jiǎnhuòdān", "phiếu soạn hàng", "拣货单上有十个订单。", "Phiếu soạn hàng có 10 đơn."],
      ["dingdan", "订单", "dìngdān", "đơn hàng", "这个订单需要优先处理。", "Đơn này cần được xử lý ưu tiên."],
      ["jianhuo", "拣货", "jiǎnhuò", "soạn/lấy hàng", "拣货前先检查设备。", "Kiểm tra thiết bị trước khi soạn hàng."],
      ["jianhuo-wei", "拣货位", "jiǎnhuòwèi", "vị trí soạn hàng", "拣货位在C区第一排。", "Vị trí soạn ở khu C dãy 1."],
      ["boci", "波次", "bōcì", "đợt soạn hàng", "这个波次有五十个订单。", "Đợt soạn này có 50 đơn."],
      ["saoma", "扫码", "sǎomǎ", "quét mã", "取货后请马上扫码。", "Sau khi lấy hàng hãy quét mã ngay."],
    ],
    status: ["这个波次有五十个订单，其中三个需要优先拣货。", "Zhège bōcì yǒu wǔshí ge dìngdān, qízhōng sān ge xūyào yōuxiān jiǎnhuò.", "Đợt này có 50 đơn, trong đó ba đơn cần ưu tiên soạn."],
    action: ["我先核对拣货单和货位，取货后逐件扫码。", "Wǒ xiān héduì jiǎnhuòdān hé huòwèi, qǔhuò hòu zhújiàn sǎomǎ.", "Tôi sẽ đối chiếu phiếu và vị trí trước, sau đó quét từng sản phẩm khi lấy."],
    notes: [
      { title: "Báo đơn ưu tiên", pattern: "其中……个需要优先处理", explanation: "其中 nêu một nhóm con trong tổng số đơn." },
      { title: "Quét từng sản phẩm", pattern: "逐件扫码", explanation: "逐件 nghĩa là từng kiện/từng sản phẩm, giúp nhấn mạnh không quét gộp khi quy trình yêu cầu." },
    ],
  },
  {
    moduleSlug: "soan-hang-va-xuat-kho", slug: "lay-hang-theo-fifo-fefo", title: "Lấy hàng theo FIFO và FEFO",
    summary: "Xác nhận số lô, ngày sản xuất, hạn dùng và nguyên tắc xuất phù hợp.", situation: "Chọn đúng lô để xuất", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["xianjin-xianchu", "先进先出", "xiānjìn xiānchū", "nhập trước xuất trước", "普通物料按先进先出。", "Vật liệu thông thường theo nhập trước xuất trước."],
      ["xiandaoqi-xianchu", "先到期先出", "xiān dàoqī xiān chū", "hết hạn trước xuất trước", "有保质期的产品按先到期先出。", "Sản phẩm có hạn dùng theo hết hạn trước xuất trước."],
      ["shengchan-riqi", "生产日期", "shēngchǎn rìqī", "ngày sản xuất", "请检查标签上的生产日期。", "Hãy kiểm tra ngày sản xuất trên nhãn."],
      ["youxiaoqi", "有效期", "yǒuxiàoqī", "hạn hiệu lực/hạn dùng", "这个批次还在有效期内。", "Lô này vẫn trong hạn dùng."],
      ["pihao", "批号", "pīhào", "số lô", "订单指定了一个批号。", "Đơn hàng chỉ định một số lô."],
      ["jinxiaoqi", "近效期", "jìnxiàoqī", "gần hết hạn", "近效期产品需要单独确认。", "Sản phẩm gần hết hạn cần xác nhận riêng."],
    ],
    status: ["系统推荐的批次有效期更晚，不符合先到期先出。", "Xìtǒng tuījiàn de pīcì yǒuxiàoqī gèng wǎn, bù fúhé xiān dàoqī xiān chū.", "Lô hệ thống đề xuất có hạn muộn hơn, không phù hợp nguyên tắc hết hạn trước xuất trước."],
    action: ["我会暂停拣货，复核批号和有效期后再确认。", "Wǒ huì zàntíng jiǎnhuò, fùhé pīhào hé yǒuxiàoqī hòu zài quèrèn.", "Tôi sẽ tạm dừng soạn, kiểm tra lại số lô và hạn dùng rồi mới xác nhận."],
    notes: [
      { title: "Nêu nguyên tắc xuất", pattern: "按先进先出 / 先到期先出", explanation: "按 nghĩa là theo; nguyên tắc thực tế phụ thuộc loại hàng và quy định kho." },
      { title: "Báo không phù hợp", pattern: "不符合……原则", explanation: "Dùng khi lô được chọn không đáp ứng nguyên tắc đã quy định." },
    ],
  },
  {
    moduleSlug: "soan-hang-va-xuat-kho", slug: "kiem-tra-va-dong-goi-don-hang", title: "Kiểm tra và đóng gói đơn hàng",
    summary: "Phát hiện lấy sai/thiếu, chọn vật liệu đóng gói và xác nhận trước khi niêm phong.", situation: "Kiểm tra đơn tại bàn đóng gói", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["dingdan-fuhe", "订单复核", "dìngdān fùhé", "kiểm tra lại đơn", "包装前要进行订单复核。", "Trước khi đóng gói phải kiểm tra lại đơn."],
      ["cuojian", "错拣", "cuòjiǎn", "lấy sai hàng", "复核时发现一件错拣。", "Khi kiểm tra phát hiện một sản phẩm lấy sai."],
      ["loujian", "漏拣", "lòujiǎn", "lấy thiếu hàng", "这个订单漏拣了两件。", "Đơn này lấy thiếu hai sản phẩm."],
      ["baozhuang-cailiao", "包装材料", "bāozhuāng cáiliào", "vật liệu đóng gói", "易碎品需要专用包装材料。", "Hàng dễ vỡ cần vật liệu đóng gói chuyên dụng."],
      ["fengxiang", "封箱", "fēngxiāng", "niêm phong/đóng thùng", "复核完成后再封箱。", "Chỉ đóng thùng sau khi kiểm tra xong."],
      ["zhuangxiang", "装箱", "zhuāngxiāng", "xếp vào thùng", "请按照装箱要求操作。", "Hãy làm theo yêu cầu đóng thùng."],
    ],
    status: ["复核发现一件错拣和两件漏拣，订单还不能封箱。", "Fùhé fāxiàn yí jiàn cuòjiǎn hé liǎng jiàn lòujiǎn, dìngdān hái bù néng fēngxiāng.", "Kiểm tra phát hiện một món lấy sai và hai món lấy thiếu; đơn chưa thể đóng thùng."],
    action: ["我会退回错拣货物并补齐数量，再重新复核。", "Wǒ huì tuìhuí cuòjiǎn huòwù bìng bǔqí shùliàng, zài chóngxīn fùhé.", "Tôi sẽ trả hàng lấy sai, bổ sung đủ số lượng rồi kiểm tra lại."],
    notes: [
      { title: "Báo lỗi soạn", pattern: "发现……件错拣 / 漏拣", explanation: "Nêu loại lỗi và số lượng để người soạn sửa đúng." },
      { title: "Điều kiện đóng thùng", pattern: "复核完成后再封箱", explanation: "Không niêm phong trước khi hoàn tất kiểm tra lại theo quy trình." },
    ],
  },
  {
    moduleSlug: "soan-hang-va-xuat-kho", slug: "xac-nhan-trong-luong-va-kich-thuoc", title: "Xác nhận trọng lượng và kích thước",
    summary: "Đọc cân nặng, kích thước, thể tích và báo kiện vượt giới hạn đóng gói.", situation: "Cân đo kiện trước khi xuất", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["zhongliang", "重量", "zhòngliàng", "trọng lượng", "请重新确认货物重量。", "Hãy xác nhận lại trọng lượng hàng."],
      ["maozhong", "毛重", "máozhòng", "trọng lượng cả bì", "毛重是二十五公斤。", "Trọng lượng cả bì là 25 kg."],
      ["jingzhong", "净重", "jìngzhòng", "trọng lượng tịnh", "标签上写的净重是二十公斤。", "Trên nhãn ghi trọng lượng tịnh 20 kg."],
      ["chicun", "尺寸", "chǐcùn", "kích thước", "系统需要填写包装尺寸。", "Hệ thống cần điền kích thước bao gói."],
      ["tiji", "体积", "tǐjī", "thể tích", "这批货的体积比较大。", "Lô hàng này có thể tích khá lớn."],
      ["chaozhong", "超重", "chāozhòng", "quá trọng lượng", "这个包装箱已经超重。", "Thùng đóng gói này đã quá trọng lượng."],
    ],
    status: ["这个箱子毛重三十二公斤，超过单箱重量限制。", "Zhège xiāngzi máozhòng sānshí'èr gōngjīn, chāoguò dānxiāng zhòngliàng xiànzhì.", "Thùng này cả bì 32 kg, vượt giới hạn trọng lượng mỗi thùng."],
    action: ["我会重新分箱并更新重量和尺寸信息。", "Wǒ huì chóngxīn fēnxiāng bìng gēngxīn zhòngliàng hé chǐcùn xìnxī.", "Tôi sẽ chia lại thùng và cập nhật thông tin trọng lượng, kích thước."],
    notes: [
      { title: "Phân biệt cả bì và tịnh", pattern: "毛重……，净重……", explanation: "毛重 gồm bao bì; 净重 là trọng lượng hàng bên trong." },
      { title: "Báo vượt giới hạn", pattern: "超过……限制", explanation: "超过 nối giá trị thực tế với giới hạn bị vượt." },
    ],
  },
  {
    moduleSlug: "soan-hang-va-xuat-kho", slug: "ban-giao-tai-cua-xuat", title: "Bàn giao tại cửa xuất",
    summary: "Xác nhận phiếu xuất, chuyến xe, cửa xuất và số lượng trước khi chất hàng.", situation: "Chuẩn bị chất hàng lên xe", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["chuku", "出库", "chūkù", "xuất kho", "这批货今天下午出库。", "Lô này xuất kho chiều nay."],
      ["chukudan", "出库单", "chūkùdān", "phiếu xuất kho", "请核对出库单号。", "Hãy đối chiếu số phiếu xuất."],
      ["zhuangche", "装车", "zhuāngchē", "chất hàng lên xe", "装车前先检查车厢。", "Trước khi chất hàng cần kiểm tra thùng xe."],
      ["chukou-yuetai", "出库月台", "chūkù yuètái", "cửa xuất hàng", "三号出库月台正在使用。", "Cửa xuất số 3 đang được sử dụng."],
      ["checi", "车次", "chēcì", "chuyến xe", "这个订单安排在第二个车次。", "Đơn này được xếp chuyến xe thứ hai."],
      ["jiaojie", "交接", "jiāojiē", "bàn giao", "装车人员和司机需要交接。", "Nhân viên chất hàng và tài xế cần bàn giao."],
    ],
    status: ["订单属于第二个车次，但是出库单没有写月台号。", "Dìngdān shǔyú dì èr ge chēcì, dànshì chūkùdān méiyǒu xiě yuètái hào.", "Đơn thuộc chuyến xe thứ hai nhưng phiếu xuất chưa ghi số cửa."],
    action: ["我先确认月台和车辆信息，再安排装车交接。", "Wǒ xiān quèrèn yuètái hé chēliàng xìnxī, zài ānpái zhuāngchē jiāojiē.", "Tôi sẽ xác nhận cửa và thông tin xe rồi mới sắp xếp chất hàng bàn giao."],
    notes: [
      { title: "Xác nhận cửa xuất", pattern: "从……号月台出库，对吗？", explanation: "Nhắc lại số cửa rồi dùng 对吗 để tránh đưa hàng nhầm khu." },
      { title: "Chốt thông tin trước chất hàng", pattern: "确认……后再装车", explanation: "Chỉ tiến hành chất hàng sau khi các thông tin bắt buộc đã khớp." },
    ],
  },
  {
    moduleSlug: "soan-hang-va-xuat-kho", slug: "kiem-tra-soan-hang-va-xuat-kho", title: "Kiểm tra: Soạn hàng & xuất kho",
    summary: "Ôn lệnh soạn, nguyên tắc chọn lô, kiểm tra, đóng gói và bàn giao xuất kho.", situation: "Đánh giá cuối module 3", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["fahuo", "发货", "fāhuò", "gửi/xuất hàng", "这批订单今天统一发货。", "Nhóm đơn này được gửi đồng loạt hôm nay."],
      ["daifaqu", "待发区", "dàifāqū", "khu chờ xuất", "复核完成的货放在待发区。", "Hàng đã kiểm tra đặt tại khu chờ xuất."],
      ["jiedan-shijian", "截单时间", "jiédān shíjiān", "giờ chốt đơn", "今天的截单时间是下午四点。", "Giờ chốt đơn hôm nay là 4 giờ chiều."],
      ["chengyunshang", "承运商", "chéngyùnshāng", "đơn vị vận chuyển", "承运商已经确认车次。", "Đơn vị vận chuyển đã xác nhận chuyến."],
      ["yundan", "运单", "yùndān", "vận đơn", "请把运单贴在外箱上。", "Hãy dán vận đơn lên thùng ngoài."],
      ["chuku-jilu", "出库记录", "chūkù jìlù", "biên bản xuất kho", "出库记录需要保存。", "Biên bản xuất kho cần được lưu."],
    ],
    status: ["订单已经复核并放到待发区，但承运商还没提供运单。", "Dìngdān yǐjīng fùhé bìng fàng dào dàifāqū, dàn chéngyùnshāng hái méi tígōng yùndān.", "Đơn đã được kiểm tra và đưa vào khu chờ xuất nhưng đơn vị vận chuyển chưa cung cấp vận đơn."],
    action: ["我会联系承运商，拿到运单后再完成出库记录。", "Wǒ huì liánxì chéngyùnshāng, ná dào yùndān hòu zài wánchéng chūkù jìlù.", "Tôi sẽ liên hệ đơn vị vận chuyển và chỉ hoàn tất biên bản xuất sau khi nhận vận đơn."],
    notes: [
      { title: "Báo việc đã sẵn sàng", pattern: "已经复核并放到待发区", explanation: "Báo hai bước đã hoàn tất nhưng chưa đồng nghĩa hàng đã rời kho." },
      { title: "Nêu điều kiện hoàn tất", pattern: "拿到……后再完成……", explanation: "Đặt chứng từ cần có trước bước xác nhận cuối." },
    ],
    challenge: outboundChallenge,
  },

  // Module 4: Vận chuyển & xử lý bất thường
  {
    moduleSlug: "van-chuyen-va-bat-thuong", slug: "lap-ke-hoach-xe-va-tuyen", title: "Lập kế hoạch xe và tuyến",
    summary: "Xác nhận loại xe, tuyến giao, mức chất tải và giờ xe rời kho.", situation: "Điều phối chuyến giao hàng", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["yunshu-jihua", "运输计划", "yùnshū jìhuà", "kế hoạch vận chuyển", "今天的运输计划已经更新。", "Kế hoạch vận chuyển hôm nay đã cập nhật."],
      ["cheliang", "车辆", "chēliàng", "phương tiện/xe", "车辆信息还需要确认。", "Thông tin xe vẫn cần xác nhận."],
      ["chexing", "车型", "chēxíng", "loại xe", "这个订单需要更大的车型。", "Đơn này cần loại xe lớn hơn."],
      ["luxian", "路线", "lùxiàn", "tuyến đường", "司机已经收到配送路线。", "Tài xế đã nhận tuyến giao."],
      ["zhuangzailv", "装载率", "zhuāngzàilǜ", "tỷ lệ chất tải", "当前装载率是百分之八十五。", "Tỷ lệ chất tải hiện là 85%."],
      ["fache-shijian", "发车时间", "fāchē shíjiān", "giờ xe chạy", "发车时间改到下午两点。", "Giờ xe chạy đổi sang 2 giờ chiều."],
    ],
    status: ["这批货体积较大，原来的车型装载率会超过限制。", "Zhè pī huò tǐjī jiào dà, yuánlái de chēxíng zhuāngzàilǜ huì chāoguò xiànzhì.", "Lô này có thể tích lớn, loại xe ban đầu sẽ vượt giới hạn chất tải."],
    action: ["我会申请更换车型，并重新确认路线和发车时间。", "Wǒ huì shēnqǐng gēnghuàn chēxíng, bìng chóngxīn quèrèn lùxiàn hé fāchē shíjiān.", "Tôi sẽ xin đổi loại xe và xác nhận lại tuyến cùng giờ xuất phát."],
    notes: [
      { title: "Báo vượt khả năng chất tải", pattern: "装载率会超过限制", explanation: "会 cho biết nguy cơ dự kiến; cần báo trước khi chất hàng." },
      { title: "Xác nhận lại khi đổi xe", pattern: "更换车型后重新确认……", explanation: "Đổi loại xe có thể ảnh hưởng cửa, tuyến và giờ xuất phát." },
    ],
  },
  {
    moduleSlug: "van-chuyen-va-bat-thuong", slug: "theo-doi-tinh-trang-giao-hang", title: "Theo dõi tình trạng giao hàng",
    summary: "Báo hàng đang trên đường, thời gian dự kiến đến và cập nhật khi bị chậm.", situation: "Khách hỏi vị trí đơn hàng", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["yunshu-zhuangtai", "运输状态", "yùnshū zhuàngtài", "trạng thái vận chuyển", "系统显示最新运输状态。", "Hệ thống hiển thị trạng thái vận chuyển mới nhất."],
      ["zaitu", "在途", "zàitú", "đang trên đường", "货物目前处于在途状态。", "Hàng hiện đang trên đường."],
      ["yuji-daoda", "预计到达", "yùjì dàodá", "dự kiến đến", "预计下午五点到达。", "Dự kiến đến lúc 5 giờ chiều."],
      ["yanchi", "延迟", "yánchí", "chậm trễ", "交通拥堵造成配送延迟。", "Ùn tắc giao thông gây giao hàng chậm."],
      ["dingwei", "定位", "dìngwèi", "định vị", "车辆定位暂时没有更新。", "Định vị xe tạm thời chưa cập nhật."],
      ["zhuangtai-gengxin", "状态更新", "zhuàngtài gēngxīn", "cập nhật trạng thái", "有新信息后马上更新状态。", "Khi có thông tin mới sẽ cập nhật trạng thái ngay."],
    ],
    status: ["货物还在途中，预计到达时间延迟一个小时。", "Huòwù hái zài túzhōng, yùjì dàodá shíjiān yánchí yí ge xiǎoshí.", "Hàng vẫn đang trên đường, thời gian dự kiến đến chậm một giờ."],
    action: ["我会向司机确认位置，并在四点前更新状态。", "Wǒ huì xiàng sījī quèrèn wèizhì, bìng zài sì diǎn qián gēngxīn zhuàngtài.", "Tôi sẽ xác nhận vị trí với tài xế và cập nhật trạng thái trước 4 giờ."],
    notes: [
      { title: "Báo đang trên đường", pattern: "货物目前在途", explanation: "在途 chỉ trạng thái đã rời điểm gửi nhưng chưa hoàn tất giao." },
      { title: "Cam kết mốc cập nhật", pattern: "我会在……前更新状态", explanation: "Nêu mốc cụ thể để người nhận biết khi nào có thông tin mới." },
    ],
  },
  {
    moduleSlug: "van-chuyen-va-bat-thuong", slug: "giao-nhan-va-ky-nhan", title: "Giao nhận và ký nhận",
    summary: "Xác nhận người nhận, số kiện, ngoại lệ và chứng từ ký nhận cuối chuyến.", situation: "Bàn giao hàng tại điểm nhận", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["jiaofu", "交付", "jiāofù", "giao/bàn giao", "货物已经按时交付。", "Hàng đã được giao đúng hạn."],
      ["shouhuoren", "收货人", "shōuhuòrén", "người nhận hàng", "请确认收货人姓名。", "Hãy xác nhận tên người nhận."],
      ["qianshou", "签收", "qiānshōu", "ký nhận", "收货人检查后签收。", "Người nhận kiểm tra rồi ký nhận."],
      ["qianshoudan", "签收单", "qiānshōudān", "phiếu ký nhận", "请上传签收单照片。", "Hãy tải ảnh phiếu ký nhận."],
      ["jiaofu-jianshu", "交付件数", "jiāofù jiànshù", "số kiện giao", "实际交付件数是二十件。", "Số kiện giao thực tế là 20."],
      ["yiyi", "异议", "yìyì", "ý kiến phản đối/ngoại lệ", "收货人对包装提出异议。", "Người nhận có ý kiến về bao bì."],
    ],
    status: ["二十件货已经到达，但收货人对一箱包装有异议。", "Èrshí jiàn huò yǐjīng dàodá, dàn shōuhuòrén duì yì xiāng bāozhuāng yǒu yìyì.", "20 kiện đã đến nhưng người nhận có ý kiến về bao bì một thùng."],
    action: ["我们先共同检查并记录异常，再确认实际签收件数。", "Wǒmen xiān gòngtóng jiǎnchá bìng jìlù yìcháng, zài quèrèn shíjì qiānshōu jiànshù.", "Hai bên sẽ cùng kiểm tra, ghi bất thường rồi xác nhận số kiện ký nhận thực tế."],
    notes: [
      { title: "Báo ngoại lệ khi nhận", pattern: "收货人对……有异议", explanation: "Nêu rõ đối tượng người nhận chưa đồng ý trước khi hoàn tất ký nhận." },
      { title: "Xác nhận số ký thực tế", pattern: "实际签收……件", explanation: "Dùng số thực tế đã được người nhận xác nhận, không mặc định bằng số xuất." },
    ],
  },
  {
    moduleSlug: "van-chuyen-va-bat-thuong", slug: "xu-ly-hang-tra-ve", title: "Xử lý hàng trả về",
    summary: "Đối chiếu phiếu trả, lý do, tình trạng bao bì và phân luồng kiểm tra khi hàng về kho.", situation: "Nhận một lô hàng hoàn", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["tuihuo", "退货", "tuìhuò", "trả hàng", "客户退回了三箱货。", "Khách trả lại ba thùng hàng."],
      ["tuihuodan", "退货单", "tuìhuòdān", "phiếu trả hàng", "退货单上没有写原因。", "Phiếu trả hàng chưa ghi lý do."],
      ["tuihuo-yuanyin", "退货原因", "tuìhuò yuányīn", "lý do trả hàng", "请确认具体退货原因。", "Hãy xác nhận lý do trả hàng cụ thể."],
      ["yuanbaozhuang", "原包装", "yuán bāozhuāng", "bao bì ban đầu", "一箱货没有原包装。", "Một thùng không còn bao bì ban đầu."],
      ["tuihui", "退回", "tuìhuí", "trả lại", "货物今天退回仓库。", "Hàng được trả lại kho hôm nay."],
      ["tuihuo-jianyan", "退货检验", "tuìhuò jiǎnyàn", "kiểm tra hàng trả", "退货入库前需要检验。", "Hàng trả cần kiểm tra trước khi nhập lại."],
    ],
    status: ["客户退回三箱货，其中一箱没有原包装，退货原因也不清楚。", "Kèhù tuìhuí sān xiāng huò, qízhōng yì xiāng méiyǒu yuán bāozhuāng, tuìhuò yuányīn yě bù qīngchu.", "Khách trả ba thùng, một thùng không còn bao bì gốc và lý do trả cũng chưa rõ."],
    action: ["我先核对退货单并送去检验，不会直接放回可用库存。", "Wǒ xiān héduì tuìhuòdān bìng sòng qù jiǎnyàn, bú huì zhíjiē fàng huí kěyòng kùcún.", "Tôi sẽ đối chiếu phiếu trả và gửi kiểm tra, không đưa thẳng vào tồn khả dụng."],
    notes: [
      { title: "Báo thông tin chưa rõ", pattern: "退货原因不清楚", explanation: "Dùng khi chứng từ chưa giải thích đủ lý do trả." },
      { title: "Không nhập thẳng tồn khả dụng", pattern: "不会直接放回可用库存", explanation: "Nêu rõ hàng trả phải qua kiểm tra và phân loại theo quy trình kho." },
    ],
  },
  {
    moduleSlug: "van-chuyen-va-bat-thuong", slug: "bao-su-co-van-chuyen", title: "Báo sự cố vận chuyển",
    summary: "Báo chậm giao, mất mát, hư hỏng và bằng chứng cần thu thập để xử lý.", situation: "Phát hiện bất thường trong chuyến", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["yunshu-yichang", "运输异常", "yùnshū yìcháng", "bất thường vận chuyển", "运输异常已经上报。", "Bất thường vận chuyển đã được báo."],
      ["yunshu-posun", "运输破损", "yùnshū pòsǔn", "hư hỏng vận chuyển", "到货时发现运输破损。", "Khi hàng đến phát hiện hư hỏng vận chuyển."],
      ["diushi", "丢失", "diūshī", "thất lạc", "一件货物在运输途中丢失。", "Một kiện bị thất lạc trên đường."],
      ["jiaofu-yanchi", "交付延迟", "jiāofù yánchí", "giao hàng chậm", "天气导致交付延迟。", "Thời tiết khiến giao hàng chậm."],
      ["shigu", "事故", "shìgù", "sự cố/tai nạn", "发生事故后要按程序报告。", "Sau sự cố phải báo theo quy trình."],
      ["yichang-baogao", "异常报告", "yìcháng bàogào", "báo cáo bất thường", "异常报告需要附上照片。", "Báo cáo bất thường cần kèm ảnh."],
    ],
    status: ["车辆途中发生异常，一件货物破损，预计交付延迟两小时。", "Chēliàng túzhōng fāshēng yìcháng, yí jiàn huòwù pòsǔn, yùjì jiāofù yánchí liǎng xiǎoshí.", "Xe gặp bất thường trên đường, một kiện hư hỏng và dự kiến giao chậm hai giờ."],
    action: ["我会记录运单号、现场情况和照片，并按程序升级报告。", "Wǒ huì jìlù yùndān hào, xiànchǎng qíngkuàng hé zhàopiàn, bìng àn chéngxù shēngjí bàogào.", "Tôi sẽ ghi mã vận đơn, tình trạng hiện trường, ảnh và báo cáo nâng cấp theo quy trình."],
    notes: [
      { title: "Báo ảnh hưởng thời gian", pattern: "预计交付延迟……小时", explanation: "Nêu mức chậm dự kiến thay vì chỉ nói chung là giao muộn." },
      { title: "Thu thập thông tin", pattern: "记录运单号、情况和照片", explanation: "Thông tin cụ thể giúp nhóm phụ trách tiếp tục xử lý; an toàn hiện trường luôn được ưu tiên." },
    ],
  },
  {
    moduleSlug: "van-chuyen-va-bat-thuong", slug: "kiem-tra-tong-hop-kho-van-logistics", title: "Kiểm tra tổng hợp: Kho vận & logistics",
    summary: "Tổng hợp giao tiếp từ nhập kho, tồn kho, soạn xuất đến giao nhận và xử lý bất thường.", situation: "Đánh giá cuối lộ trình", estimatedMinutes: 16, isFree: false,
    vocabulary: [
      ["gongyinglian", "供应链", "gōngyìngliàn", "chuỗi cung ứng", "仓库是供应链的重要环节。", "Kho là một mắt xích quan trọng của chuỗi cung ứng."],
      ["quancheng-genzong", "全程跟踪", "quánchéng gēnzōng", "theo dõi toàn trình", "高价值货物需要全程跟踪。", "Hàng giá trị cao cần theo dõi toàn trình."],
      ["yichang-shengji", "异常升级", "yìcháng shēngjí", "nâng cấp bất thường", "影响扩大时要进行异常升级。", "Khi ảnh hưởng mở rộng cần nâng cấp bất thường."],
      ["zeren-jiaojie", "责任交接", "zérèn jiāojiē", "bàn giao trách nhiệm", "每个环节都要完成责任交接。", "Mỗi khâu đều phải hoàn tất bàn giao trách nhiệm."],
      ["zhengju", "证据", "zhèngjù", "bằng chứng", "照片和签收单都是重要证据。", "Ảnh và phiếu ký nhận đều là bằng chứng quan trọng."],
      ["guanbi", "关闭", "guānbì", "đóng vấn đề", "确认处理结果后才能关闭异常。", "Chỉ đóng bất thường sau khi xác nhận kết quả xử lý."],
    ],
    status: ["货物已经交付，但破损异议和责任交接还没有关闭。", "Huòwù yǐjīng jiāofù, dàn pòsǔn yìyì hé zérèn jiāojiē hái méiyǒu guānbì.", "Hàng đã giao nhưng ý kiến về hư hỏng và bàn giao trách nhiệm vẫn chưa đóng."],
    action: ["我会整理签收单、照片和处理结果，确认后再关闭异常。", "Wǒ huì zhěnglǐ qiānshōudān, zhàopiàn hé chǔlǐ jiéguǒ, quèrèn hòu zài guānbì yìcháng.", "Tôi sẽ tổng hợp phiếu ký nhận, ảnh, kết quả xử lý và chỉ đóng bất thường sau khi xác nhận."],
    notes: [
      { title: "Phân biệt giao xong và đóng vấn đề", pattern: "已经交付，但异常还没有关闭", explanation: "Giao hàng hoàn tất không đồng nghĩa ngoại lệ đã được xử lý xong." },
      { title: "Đóng vòng xử lý", pattern: "记录—交接—跟踪—关闭", explanation: "Chuỗi từ giúp ghi nhớ việc ghi nhận, bàn giao, theo dõi và đóng bất thường." },
    ],
    challenge: finalChallenge,
  },
];

export const logisticsLessons = logisticsLessonInputs.map(createLesson);

export const logisticsCourseStats = {
  lessons: logisticsLessons.length,
  minutes: logisticsLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: logisticsLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: new Set(logisticsLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.slug))).size,
  modules: logisticsModules.length,
};
