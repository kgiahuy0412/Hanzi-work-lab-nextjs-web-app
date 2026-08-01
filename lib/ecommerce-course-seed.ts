import type { LessonChallenge, UsageNote, Vocabulary } from "./content-types.ts";
import type { CourseLessonSeed, CourseModuleSeed } from "./course-seed-types.ts";

type EcommerceWordInput = [slug: string, hanzi: string, pinyin: string, meaning: string, example: string, translation: string];
type EcommerceLine = [hanzi: string, pinyin: string, translation: string];

type EcommerceLessonInput = Omit<CourseLessonSeed, "content" | "vocabulary"> & {
  vocabulary: EcommerceWordInput[];
  request: EcommerceLine;
  response: EcommerceLine;
  notes: [UsageNote, UsageNote];
  challenge?: LessonChallenge;
};

const note = (title: string, pattern: string, explanation: string): UsageNote => ({ title, pattern, explanation });

function toVocabulary(input: EcommerceWordInput): Vocabulary {
  const [slug, hanzi, pinyin, meaning, example, translation] = input;
  return { slug: `ecommerce-${slug}`, hanzi, pinyin, meaning, example, translation, audioUrl: null };
}

function createLesson(input: EcommerceLessonInput): CourseLessonSeed {
  const { request, response, challenge, notes, ...lesson } = input;
  return {
    ...lesson,
    vocabulary: lesson.vocabulary.map(toVocabulary),
    content: {
      dialogue: [
        { speaker: "A", hanzi: "现在需要确认什么？", pinyin: "Xiànzài xūyào quèrèn shénme?", translation: "Hiện tại cần xác nhận điều gì?" },
        { speaker: "B", hanzi: request[0], pinyin: request[1], translation: request[2] },
        { speaker: "A", hanzi: "下一步应该怎么处理？", pinyin: "Xià yí bù yīnggāi zěnme chǔlǐ?", translation: "Bước tiếp theo nên xử lý thế nào?" },
        { speaker: "B", hanzi: response[0], pinyin: response[1], translation: response[2] },
      ],
      notes,
      ...(challenge ? { challenge } : {}),
    },
  };
}

const storefrontChallenge: LessonChallenge = {
  title: "Kiểm tra sản phẩm & gian hàng",
  description: "Đạt 4/5 câu để chuyển sang làm việc với nhà cung cấp.",
  passScore: 4,
  questions: [
    { prompt: "商品类目 dùng để chỉ gì?", options: ["Danh mục sản phẩm", "Mã vận đơn", "Điều kiện hoàn tiền"], correctOption: 0, explanation: "商品 là sản phẩm; 类目 là nhóm hoặc danh mục phân loại." },
    { prompt: "SKU có vai trò nào trong vận hành?", options: ["Phân biệt từng mặt hàng hoặc biến thể", "Thay cho tên nhà cung cấp", "Xác nhận đã giao hàng"], correctOption: 0, explanation: "SKU giúp đội ngũ nhận diện chính xác từng mặt hàng hoặc biến thể." },
    { prompt: "标题关键词 nghĩa là gì?", options: ["Từ khóa trong tiêu đề", "Giá niêm yết", "Ảnh chi tiết"], correctOption: 0, explanation: "标题 là tiêu đề; 关键词 là từ khóa." },
    { prompt: "Khẳng định tuyệt đối về công dụng khi chưa có bằng chứng có phù hợp không?", options: ["Không, phải bám dữ liệu đã xác minh và quy định nền tảng", "Có, miễn giúp tăng lượt nhấp", "Có, nếu đối thủ cũng dùng"], correctOption: 0, explanation: "Mô tả phải đúng dữ liệu, chính sách quảng cáo và quy định ngành hàng áp dụng." },
    { prompt: "主图 và 详情图 khác nhau thế nào?", options: ["Ảnh chính đại diện và ảnh trình bày chi tiết", "Ảnh cũ và ảnh mới", "Ảnh nhà cung cấp và ảnh khách hàng"], correctOption: 0, explanation: "主图 là ảnh đại diện chính; 详情图 giải thích thêm đặc điểm và cách dùng." },
  ],
};

const sourcingChallenge: LessonChallenge = {
  title: "Kiểm tra nhà cung cấp & giá",
  description: "Đạt 4/5 câu để chuyển sang vận hành đơn và tồn kho.",
  passScore: 4,
  questions: [
    { prompt: "起订量 nghĩa là gì?", options: ["Số lượng đặt tối thiểu", "Số lượng đã bán", "Số lượng hàng lỗi"], correctOption: 0, explanation: "起订量 là ngưỡng số lượng tối thiểu nhà cung cấp chấp nhận cho một đơn." },
    { prompt: "Khi yêu cầu mẫu, nên xác nhận thêm điều gì?", options: ["Phí mẫu, thời gian gửi và tiêu chuẩn kiểm", "Chỉ màu bao bì", "Chỉ số người liên hệ"], correctOption: 0, explanation: "Các điều kiện này giúp hai bên hiểu cùng phạm vi trước khi đánh giá mẫu." },
    { prompt: "含税价 dùng để chỉ gì?", options: ["Giá đã gồm thuế", "Giá chưa gồm vận chuyển", "Giá bán lẻ đề xuất"], correctOption: 0, explanation: "含税 nghĩa là đã bao gồm thuế trong mức giá được nêu." },
    { prompt: "交期 nên được xác nhận bằng cách nào?", options: ["Nêu mốc cụ thể và điều kiện bắt đầu tính", "Chỉ nói càng sớm càng tốt", "Tự ước lượng thay nhà cung cấp"], correctOption: 0, explanation: "Lead time cần mốc và điểm bắt đầu rõ ràng để theo dõi." },
    { prompt: "Trước khi đặt cọc, cần làm gì?", options: ["Xác minh đối tác, hợp đồng và quy trình phê duyệt", "Chuyển tiền theo tin nhắn cá nhân", "Bỏ qua thông tin tài khoản"], correctOption: 0, explanation: "Khóa học ngôn ngữ không thay thế quy trình pháp lý, tài chính và kiểm soát nhà cung cấp." },
  ],
};

const fulfillmentChallenge: LessonChallenge = {
  title: "Kiểm tra vận hành đơn & tồn",
  description: "Đạt 4/5 câu để chuyển sang hậu mãi và tối ưu.",
  passScore: 4,
  questions: [
    { prompt: "待发货 mô tả trạng thái nào?", options: ["Chờ gửi hàng", "Đã hoàn tiền", "Đã đánh giá"], correctOption: 0, explanation: "待 phát biểu trạng thái đang chờ; 发货 là gửi hàng." },
    { prompt: "库存同步 có tác dụng gì?", options: ["Đồng bộ số lượng tồn giữa các hệ thống", "Đổi địa chỉ nhận hàng", "Tạo mã giảm giá"], correctOption: 0, explanation: "Đồng bộ tồn giúp giảm rủi ro bán vượt số lượng thực tế." },
    { prompt: "拣货 và 打包 là gì?", options: ["Soạn hàng và đóng gói", "Kiểm hàng và hoàn tiền", "Đặt hàng và hủy hàng"], correctOption: 0, explanation: "拣货 là lấy đúng mặt hàng; 打包 là đóng gói để bàn giao." },
    { prompt: "Đơn có nguy cơ giao trễ. Nên làm gì?", options: ["Xác minh với đơn vị vận chuyển rồi cập nhật mốc có căn cứ", "Tự hứa chắc chắn giao trong ngày", "Ẩn trạng thái đơn"], correctOption: 0, explanation: "Thông tin có căn cứ giúp người mua quyết định và tránh cam kết sai." },
    { prompt: "Khách xin đổi địa chỉ sau khi đã xuất kho. Cách xử lý đúng là gì?", options: ["Kiểm tra trạng thái và khả năng can thiệp theo quy trình", "Tự sửa mà không báo kho", "Luôn khẳng định đổi được"], correctOption: 0, explanation: "Khả năng đổi địa chỉ phụ thuộc trạng thái thực tế và chính sách vận chuyển." },
  ],
};

const finalChallenge: LessonChallenge = {
  title: "Kiểm tra tổng hợp Thương mại điện tử",
  description: "Đạt 5/6 câu để hoàn thành lộ trình.",
  passScore: 5,
  questions: [
    { prompt: "售前咨询 là gì?", options: ["Tư vấn trước bán", "Xử lý đổi trả", "Đối soát kho"], correctOption: 0, explanation: "售前 là trước bán; 咨询 là hỏi hoặc tư vấn." },
    { prompt: "Khách báo nhận sai hàng. Cần xác minh gì trước?", options: ["Mã đơn, mặt hàng thực nhận và bằng chứng theo chính sách", "Chỉ tên khách", "Chỉ đánh giá sao"], correctOption: 0, explanation: "Thông tin đơn và bằng chứng giúp xác định đúng loại sự cố." },
    { prompt: "退款 và 退货 khác nhau thế nào?", options: ["Hoàn tiền và trả hàng", "Giảm giá và đổi hàng", "Hủy đơn và giao lại"], correctOption: 0, explanation: "退款 là hoàn tiền; 退货 là trả sản phẩm." },
    { prompt: "遇到差评时 nên làm gì?", options: ["Xác minh vấn đề và phản hồi theo quy tắc nền tảng", "Tranh luận công khai với khách", "Mua đánh giá giả"], correctOption: 0, explanation: "Phản hồi cần dựa trên dữ kiện, lịch sự và tuân thủ chính sách nền tảng." },
    { prompt: "转化率 dùng để đo gì?", options: ["Tỷ lệ người thực hiện hành động mục tiêu", "Tổng số hàng tồn", "Thời gian giao hàng"], correctOption: 0, explanation: "Tỷ lệ chuyển đổi phải được đọc cùng định nghĩa sự kiện và khoảng thời gian." },
    { prompt: "Khi chạy khuyến mãi, nguyên tắc nào quan trọng?", options: ["Giá, điều kiện và tồn kho phải đúng; tuân thủ quy định nền tảng", "Có thể tạo khan hiếm giả", "Có thể bỏ điều kiện áp dụng"], correctOption: 0, explanation: "Thông tin minh bạch và tuân thủ giúp giảm khiếu nại và rủi ro vận hành." },
  ],
};

export const ecommerceModules: CourseModuleSeed[] = [
  { slug: "san-pham-va-gian-hang", title: "Sản phẩm & gian hàng", description: "Chuẩn hóa danh mục, SKU, tiêu đề, mô tả, hình ảnh và biến thể trước khi đăng bán." },
  { slug: "nha-cung-cap-va-gia", title: "Nhà cung cấp & giá", description: "Tìm nguồn, hỏi MOQ, kiểm mẫu, làm rõ báo giá, lead time và điều kiện giao dịch." },
  { slug: "van-hanh-don-va-ton", title: "Vận hành đơn & tồn", description: "Xác nhận đơn, đồng bộ tồn, soạn đóng gói, theo dõi vận chuyển và xử lý thay đổi." },
  { slug: "hau-mai-va-toi-uu", title: "Hậu mãi & tối ưu", description: "Tư vấn, giải quyết sai hỏng, đổi trả, phản hồi đánh giá và đọc dữ liệu kinh doanh." },
];

const ecommerceLessonInputs: EcommerceLessonInput[] = [
  {
    moduleSlug: "san-pham-va-gian-hang", slug: "phan-loai-san-pham-va-vai-tro-gian-hang", title: "Phân loại sản phẩm và vai trò gian hàng",
    summary: "Nhận diện sản phẩm, danh mục và các khu vực cơ bản của một gian hàng trực tuyến.", situation: "Nhân viên mới làm quen danh mục", estimatedMinutes: 11, isFree: true,
    vocabulary: [
      ["l01-shangpin", "商品", "shāngpǐn", "sản phẩm, hàng hóa", "这个商品属于哪个类目？", "Sản phẩm này thuộc danh mục nào?"],
      ["l01-dianpu", "店铺", "diànpù", "gian hàng", "店铺首页需要更新。", "Trang chủ gian hàng cần cập nhật."],
      ["l01-leimu", "类目", "lèimù", "danh mục", "请先选择正确的类目。", "Hãy chọn đúng danh mục trước."],
      ["l01-shangjia", "上架", "shàngjià", "đăng bán", "这个新品明天上架。", "Sản phẩm mới này sẽ đăng bán ngày mai."],
      ["l01-xiajia", "下架", "xiàjià", "gỡ bán", "缺货商品先下架。", "Sản phẩm hết hàng tạm thời gỡ bán."],
      ["l01-houtai", "后台", "hòutái", "trang quản trị", "请在后台检查商品状态。", "Hãy kiểm tra trạng thái sản phẩm trong trang quản trị."],
    ],
    request: ["新员工需要了解店铺和商品类目。", "Xīn yuángōng xūyào liǎojiě diànpù hé shāngpǐn lèimù.", "Nhân viên mới cần hiểu gian hàng và danh mục sản phẩm."],
    response: ["我先说明上架、下架和后台的基本流程。", "Wǒ xiān shuōmíng shàngjià, xiàjià hé hòutái de jīběn liúchéng.", "Tôi sẽ giải thích quy trình cơ bản về đăng bán, gỡ bán và trang quản trị."],
    notes: [note("Động tác đưa lên bán", "把商品上架 / 商品已上架", "上架 có thể dùng như động từ hoặc trạng thái đã được đăng bán."), note("Chọn đúng danh mục", "属于 + 类目", "Danh mục ảnh hưởng trường dữ liệu và quy tắc đăng sản phẩm của từng nền tảng.")],
  },
  {
    moduleSlug: "san-pham-va-gian-hang", slug: "thu-thap-thong-so-va-tao-sku", title: "Thu thập thông số và tạo SKU",
    summary: "Ghi nhận thuộc tính, mã hàng, kích thước và dữ liệu cần thiết cho từng biến thể.", situation: "Chuẩn bị bảng thông tin sản phẩm", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["l02-sku", "库存单位", "kùcún dānwèi", "đơn vị lưu kho, SKU", "每个库存单位都有独立编码。", "Mỗi SKU có một mã riêng."],
      ["l02-bianma", "编码", "biānmǎ", "mã", "请核对产品编码。", "Hãy đối chiếu mã sản phẩm."],
      ["l02-shuxing", "属性", "shǔxìng", "thuộc tính", "颜色和尺寸是主要属性。", "Màu sắc và kích thước là thuộc tính chính."],
      ["l02-canshu", "参数", "cānshù", "thông số", "参数表还缺少重量。", "Bảng thông số còn thiếu trọng lượng."],
      ["l02-chicun", "尺寸", "chǐcùn", "kích thước", "请确认包装尺寸。", "Hãy xác nhận kích thước bao bì."],
      ["l02-zhongliang", "重量", "zhòngliàng", "trọng lượng", "净重量是五百克。", "Trọng lượng tịnh là 500 gram."],
    ],
    request: ["这个产品有三个颜色和两个尺寸。", "Zhège chǎnpǐn yǒu sān ge yánsè hé liǎng ge chǐcùn.", "Sản phẩm này có ba màu và hai kích thước."],
    response: ["我会为每个组合建立独立的库存单位。", "Wǒ huì wèi měi ge zǔhé jiànlì dúlì de kùcún dānwèi.", "Tôi sẽ tạo một SKU riêng cho mỗi tổ hợp."],
    notes: [note("Mỗi tổ hợp một mã", "每个组合 + 独立编码", "Cấu trúc này giúp làm rõ rằng mỗi biến thể cần mã nhận diện riêng."), note("Phân biệt trọng lượng", "净重 / 毛重", "净重 là trọng lượng tịnh; 毛重 là tổng trọng lượng gồm bao bì.")],
  },
  {
    moduleSlug: "san-pham-va-gian-hang", slug: "viet-tieu-de-va-tu-khoa", title: "Viết tiêu đề và từ khóa",
    summary: "Sắp xếp tên sản phẩm, đặc điểm chính và từ khóa theo quy định nền tảng.", situation: "Soạn tiêu đề cho sản phẩm mới", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l03-biaoti", "标题", "biāotí", "tiêu đề", "商品标题要清楚。", "Tiêu đề sản phẩm cần rõ ràng."],
      ["l03-guanjianci", "关键词", "guānjiàncí", "từ khóa", "关键词要和商品相关。", "Từ khóa phải liên quan đến sản phẩm."],
      ["l03-pinpaiming", "品牌名", "pǐnpái míng", "tên thương hiệu", "请核对品牌名的写法。", "Hãy kiểm tra cách viết tên thương hiệu."],
      ["l03-maidian", "卖点", "màidiǎn", "điểm bán nổi bật", "标题里保留一个主要卖点。", "Giữ một điểm bán chính trong tiêu đề."],
      ["l03-zifu", "字符", "zìfú", "ký tự", "标题不能超过规定字符。", "Tiêu đề không được vượt quá số ký tự quy định."],
      ["l03-weigui", "违规", "wéiguī", "vi phạm quy định", "夸大宣传可能违规。", "Quảng cáo phóng đại có thể vi phạm."],
    ],
    request: ["这个标题太长，也有重复关键词。", "Zhège biāotí tài cháng, yě yǒu chóngfù guānjiàncí.", "Tiêu đề này quá dài và có từ khóa lặp."],
    response: ["我会保留品名和主要卖点，并检查平台规则。", "Wǒ huì bǎoliú pǐnmíng hé zhǔyào màidiǎn, bìng jiǎnchá píngtái guīzé.", "Tôi sẽ giữ tên sản phẩm và điểm bán chính, đồng thời kiểm tra quy định nền tảng."],
    notes: [note("Thứ tự rõ ràng", "品名 + 核心属性 + 主要卖点", "Ưu tiên thông tin người mua cần để nhận diện sản phẩm."), note("Không nhồi từ khóa", "与商品相关", "Từ khóa phải đúng nội dung và phù hợp quy định của nền tảng đang dùng.")],
  },
  {
    moduleSlug: "san-pham-va-gian-hang", slug: "viet-mo-ta-va-diem-ban", title: "Viết mô tả và điểm bán",
    summary: "Trình bày tính năng, lợi ích, phạm vi sử dụng và giới hạn đã được xác minh.", situation: "Biên tập phần mô tả chi tiết", estimatedMinutes: 13, isFree: true,
    vocabulary: [
      ["l04-miaoshu", "描述", "miáoshù", "mô tả", "商品描述需要修改。", "Mô tả sản phẩm cần chỉnh sửa."],
      ["l04-gongneng", "功能", "gōngnéng", "tính năng", "请说明主要功能。", "Hãy nêu tính năng chính."],
      ["l04-youshi", "优势", "yōushì", "ưu điểm", "这个材料的优势是耐用。", "Ưu điểm của vật liệu này là bền."],
      ["l04-shiyong", "适用", "shìyòng", "phù hợp sử dụng", "这款产品适用于室内。", "Sản phẩm này phù hợp dùng trong nhà."],
      ["l04-xianzhi", "限制", "xiànzhì", "giới hạn", "页面要说明使用限制。", "Trang sản phẩm cần nêu giới hạn sử dụng."],
      ["l04-kuazhang", "夸张", "kuāzhāng", "phóng đại", "不要使用夸张承诺。", "Không dùng cam kết phóng đại."],
    ],
    request: ["页面只写了优点，没有说明使用限制。", "Yèmiàn zhǐ xiě le yōudiǎn, méiyǒu shuōmíng shǐyòng xiànzhì.", "Trang chỉ viết ưu điểm mà chưa nêu giới hạn sử dụng."],
    response: ["我会补充适用范围，并删除没有依据的承诺。", "Wǒ huì bǔchōng shìyòng fànwéi, bìng shānchú méiyǒu yījù de chéngnuò.", "Tôi sẽ bổ sung phạm vi phù hợp và xóa cam kết không có căn cứ."],
    notes: [note("Nêu cả phạm vi", "适用于…… / 不适用于……", "Hai mẫu giúp mô tả rõ trường hợp phù hợp và không phù hợp."), note("Dựa trên dữ liệu", "根据已确认的信息", "Không tự tạo công dụng, chứng nhận hoặc cam kết chưa được xác minh.")],
  },
  {
    moduleSlug: "san-pham-va-gian-hang", slug: "quan-ly-hinh-anh-va-bien-the", title: "Quản lý hình ảnh và biến thể",
    summary: "Đối chiếu ảnh chính, ảnh chi tiết, màu sắc và lựa chọn biến thể với hàng thực tế.", situation: "Kiểm tra tài nguyên trước khi đăng", estimatedMinutes: 12, isFree: true,
    vocabulary: [
      ["l05-zhutu", "主图", "zhǔtú", "ảnh chính", "主图要展示实际商品。", "Ảnh chính phải thể hiện sản phẩm thực tế."],
      ["l05-xiangqingtu", "详情图", "xiángqíng tú", "ảnh chi tiết", "详情图说明产品结构。", "Ảnh chi tiết giải thích cấu tạo sản phẩm."],
      ["l05-biantitu", "变体图", "biàntǐ tú", "ảnh biến thể", "每个颜色需要对应的变体图。", "Mỗi màu cần ảnh biến thể tương ứng."],
      ["l05-fenbianlv", "分辨率", "fēnbiànlǜ", "độ phân giải", "图片分辨率不够。", "Độ phân giải ảnh chưa đủ."],
      ["l05-beijing", "背景", "bèijǐng", "nền ảnh", "主图背景要符合平台要求。", "Nền ảnh chính phải phù hợp yêu cầu nền tảng."],
      ["l05-secha", "色差", "sèchā", "chênh lệch màu", "页面要提示可能存在色差。", "Trang cần lưu ý có thể có chênh lệch màu."],
    ],
    request: ["蓝色变体用了黑色商品的图片。", "Lánsè biàntǐ yòng le hēisè shāngpǐn de túpiàn.", "Biến thể màu xanh đang dùng ảnh sản phẩm màu đen."],
    response: ["我会重新对应图片，并检查所有变体。", "Wǒ huì chóngxīn duìyìng túpiàn, bìng jiǎnchá suǒyǒu biàntǐ.", "Tôi sẽ ghép lại đúng ảnh và kiểm tra tất cả biến thể."],
    notes: [note("Ảnh và biến thể tương ứng", "A 对应 B", "对应 diễn tả quan hệ ghép đúng giữa lựa chọn và tài nguyên."), note("Ảnh phản ánh thực tế", "以实物和已审核素材为准", "Chỉ dùng tài nguyên có quyền sử dụng và phản ánh đúng hàng hóa.")],
  },
  {
    moduleSlug: "san-pham-va-gian-hang", slug: "kiem-tra-san-pham-va-gian-hang", title: "Kiểm tra: Sản phẩm & gian hàng",
    summary: "Ôn danh mục, SKU, tiêu đề, mô tả, hình ảnh và quy tắc đăng bán.", situation: "Đánh giá cuối module 1", estimatedMinutes: 14, isFree: true,
    vocabulary: [
      ["l06-fabu", "发布", "fābù", "xuất bản", "商品审核通过后再发布。", "Chỉ xuất bản sản phẩm sau khi duyệt."],
      ["l06-shenhe", "审核", "shěnhé", "kiểm duyệt", "页面正在等待审核。", "Trang đang chờ kiểm duyệt."],
      ["l06-zhuangtai", "状态", "zhuàngtài", "trạng thái", "请确认商品状态。", "Hãy xác nhận trạng thái sản phẩm."],
      ["l06-bianji", "编辑", "biānjí", "chỉnh sửa", "我先编辑错误信息。", "Tôi sẽ chỉnh sửa thông tin sai trước."],
      ["l06-yulan", "预览", "yùlǎn", "xem trước", "发布前请预览页面。", "Hãy xem trước trang trước khi xuất bản."],
      ["l06-jilu", "记录", "jìlù", "bản ghi, ghi lại", "修改后保留审核记录。", "Sau khi sửa cần giữ bản ghi kiểm duyệt."],
    ],
    request: ["新品资料已经填写完了。", "Xīnpǐn zīliào yǐjīng tiánxiě wán le.", "Dữ liệu sản phẩm mới đã được điền xong."],
    response: ["我会先预览和审核，再安排发布。", "Wǒ huì xiān yùlǎn hé shěnhé, zài ānpái fābù.", "Tôi sẽ xem trước và kiểm duyệt rồi mới xuất bản."],
    notes: [note("Trình tự trước khi đăng", "先预览，再审核，最后发布", "先……再……最后…… giúp nêu quy trình theo thứ tự."), note("Giữ dấu vết thay đổi", "保留修改记录", "Bản ghi giúp xác định nội dung nào đã được duyệt và ai chịu trách nhiệm.")], challenge: storefrontChallenge,
  },
  {
    moduleSlug: "nha-cung-cap-va-gia", slug: "tim-kiem-va-sang-loc-nha-cung-cap", title: "Tìm kiếm và sàng lọc nhà cung cấp",
    summary: "Hỏi năng lực, mặt hàng chính và tài liệu cần thiết trước khi đưa vào danh sách đánh giá.", situation: "Liên hệ một nhà cung cấp mới", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l07-gongyingshang", "供应商", "gōngyìngshāng", "nhà cung cấp", "我们正在评估新供应商。", "Chúng tôi đang đánh giá nhà cung cấp mới."],
      ["l07-gonghuo", "供货", "gōnghuò", "cung ứng hàng", "贵司可以稳定供货吗？", "Quý công ty có thể cung ứng ổn định không?"],
      ["l07-zizhi", "资质", "zīzhì", "tư cách, hồ sơ năng lực", "请提供相关资质文件。", "Hãy cung cấp hồ sơ năng lực liên quan."],
      ["l07-zhuying", "主营", "zhǔyíng", "kinh doanh chính", "贵司主营哪些产品？", "Quý công ty chủ yếu kinh doanh sản phẩm nào?"],
      ["l07-chaneng", "产能", "chǎnnéng", "năng lực sản xuất", "月产能大约是多少？", "Năng lực sản xuất tháng khoảng bao nhiêu?"],
      ["l07-beixuan", "备选", "bèixuǎn", "phương án dự phòng", "我们需要两家备选供应商。", "Chúng tôi cần hai nhà cung cấp dự phòng."],
    ],
    request: ["我们需要为新品寻找稳定的供应商。", "Wǒmen xūyào wèi xīnpǐn xúnzhǎo wěndìng de gōngyìngshāng.", "Chúng ta cần tìm nhà cung cấp ổn định cho sản phẩm mới."],
    response: ["我会先确认主营产品、产能和资质。", "Wǒ huì xiān quèrèn zhǔyíng chǎnpǐn, chǎnnéng hé zīzhì.", "Tôi sẽ xác nhận mặt hàng chính, năng lực và hồ sơ trước."],
    notes: [note("Câu hỏi về năng lực", "贵司可以……吗？", "贵司 là cách gọi lịch sự công ty đối tác trong trao đổi thương mại."), note("Chưa kết luận từ lời giới thiệu", "需要进一步审核", "Thông tin tự cung cấp cần được kiểm chứng theo quy trình mua hàng thực tế.")],
  },
  {
    moduleSlug: "nha-cung-cap-va-gia", slug: "hoi-moq-va-bac-so-luong", title: "Hỏi MOQ và bậc số lượng",
    summary: "Làm rõ số lượng đặt tối thiểu và mức giá tương ứng với từng bậc mua.", situation: "Hỏi điều kiện đặt lô đầu", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l08-qidingliang", "起订量", "qǐdìngliàng", "số lượng đặt tối thiểu", "这款产品的起订量是多少？", "MOQ của sản phẩm này là bao nhiêu?"],
      ["l08-piliang", "批量", "pīliàng", "số lượng theo lô", "批量采购可以优惠吗？", "Mua theo lô có thể ưu đãi không?"],
      ["l08-jieti", "阶梯价", "jiētī jià", "giá theo bậc", "请提供阶梯价。", "Hãy cung cấp giá theo bậc."],
      ["l08-hunpi", "混批", "hùnpī", "gộp nhiều mẫu trong một lô", "不同颜色可以混批吗？", "Có thể gộp nhiều màu trong một lô không?"],
      ["l08-xianhuo", "现货", "xiànhuò", "hàng có sẵn", "目前有多少现货？", "Hiện có bao nhiêu hàng sẵn?"],
      ["l08-dingzhi", "定制", "dìngzhì", "tùy chỉnh", "定制包装有单独起订量。", "Bao bì tùy chỉnh có MOQ riêng."],
    ],
    request: ["我们想先下小批量试单。", "Wǒmen xiǎng xiān xià xiǎo pīliàng shìdān.", "Chúng tôi muốn đặt thử một lô nhỏ trước."],
    response: ["我会确认起订量、混批条件和阶梯价。", "Wǒ huì quèrèn qǐdìngliàng, hùnpī tiáojiàn hé jiētī jià.", "Tôi sẽ xác nhận MOQ, điều kiện gộp mẫu và giá theo bậc."],
    notes: [note("Hỏi MOQ", "起订量是多少？", "Có thể thêm 按颜色 hoặc 按款式 để hỏi MOQ theo màu hay mẫu."), note("Phân biệt hàng sẵn và tùy chỉnh", "现货 / 定制", "Hai loại thường có MOQ và thời gian chuẩn bị khác nhau.")],
  },
  {
    moduleSlug: "nha-cung-cap-va-gia", slug: "yeu-cau-mau-va-kiem-mau", title: "Yêu cầu mẫu và kiểm mẫu",
    summary: "Xác nhận phí mẫu, thời gian gửi, tiêu chuẩn và kết quả kiểm tra trước lô lớn.", situation: "Đề nghị gửi mẫu thử", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l09-yangpin", "样品", "yàngpǐn", "mẫu", "请先寄两个样品。", "Hãy gửi trước hai mẫu."],
      ["l09-yangpinfei", "样品费", "yàngpǐn fèi", "phí mẫu", "样品费可以退吗？", "Phí mẫu có được hoàn lại không?"],
      ["l09-jiyang", "寄样", "jìyàng", "gửi mẫu", "确认付款后安排寄样。", "Sau khi xác nhận thanh toán sẽ gửi mẫu."],
      ["l09-jiance", "检测", "jiǎncè", "kiểm tra, kiểm nghiệm", "样品需要做功能检测。", "Mẫu cần kiểm tra tính năng."],
      ["l09-biaozhun", "标准", "biāozhǔn", "tiêu chuẩn", "请按照确认的标准生产。", "Hãy sản xuất theo tiêu chuẩn đã xác nhận."],
      ["l09-querenyang", "确认样", "quèrèn yàng", "mẫu đã duyệt", "确认样要保留作对照。", "Cần giữ mẫu đã duyệt để đối chiếu."],
    ],
    request: ["量产前需要先确认样品质量。", "Liàngchǎn qián xūyào xiān quèrèn yàngpǐn zhìliàng.", "Trước sản xuất hàng loạt cần xác nhận chất lượng mẫu."],
    response: ["我会写清样品规格、检测标准和寄样时间。", "Wǒ huì xiě qīng yàngpǐn guīgé, jiǎncè biāozhǔn hé jìyàng shíjiān.", "Tôi sẽ ghi rõ quy cách mẫu, tiêu chuẩn kiểm và thời gian gửi mẫu."],
    notes: [note("Làm rõ phạm vi mẫu", "样品规格 + 数量 + 标准", "Ba phần giúp giảm việc hai bên gửi và đánh giá sai mẫu."), note("Mẫu duyệt làm đối chiếu", "以确认样为准", "Chỉ dùng khi hai bên đã thống nhất mẫu nào là bản tham chiếu.")],
  },
  {
    moduleSlug: "nha-cung-cap-va-gia", slug: "doc-bao-gia-va-chi-phi", title: "Đọc báo giá và chi phí",
    summary: "Phân biệt đơn giá, thuế, đóng gói, vận chuyển và thời hạn hiệu lực của báo giá.", situation: "Đối chiếu báo giá từ đối tác", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l10-baojia", "报价", "bàojià", "báo giá", "请发送正式报价。", "Hãy gửi báo giá chính thức."],
      ["l10-danjia", "单价", "dānjià", "đơn giá", "这个单价对应多少数量？", "Đơn giá này ứng với số lượng bao nhiêu?"],
      ["l10-hanshuijia", "含税价", "hánshuì jià", "giá gồm thuế", "请确认是否为含税价。", "Hãy xác nhận đây có phải giá gồm thuế không."],
      ["l10-baozhuangfei", "包装费", "bāozhuāng fèi", "phí đóng gói", "定制包装费单独计算。", "Phí bao bì tùy chỉnh được tính riêng."],
      ["l10-yunfei", "运费", "yùnfèi", "phí vận chuyển", "报价里不包含运费。", "Báo giá chưa gồm phí vận chuyển."],
      ["l10-youxiaoqi", "有效期", "yǒuxiàoqī", "thời hạn hiệu lực", "这份报价有效期为七天。", "Báo giá này có hiệu lực bảy ngày."],
    ],
    request: ["这份报价没有说明税费和运费。", "Zhè fèn bàojià méiyǒu shuōmíng shuìfèi hé yùnfèi.", "Báo giá này chưa nêu thuế và phí vận chuyển."],
    response: ["我会请供应商补充费用明细和有效期。", "Wǒ huì qǐng gōngyìngshāng bǔchōng fèiyòng míngxì hé yǒuxiàoqī.", "Tôi sẽ đề nghị nhà cung cấp bổ sung chi tiết chi phí và thời hạn hiệu lực."],
    notes: [note("Giá ứng với điều kiện", "单价对应 + 数量", "Một đơn giá chỉ có ý nghĩa khi đi cùng số lượng, quy cách và điều kiện liên quan."), note("Xác nhận bao gồm hay chưa", "包含 / 不包含", "Dùng để làm rõ thuế, phí đóng gói, vận chuyển và các khoản khác.")],
  },
  {
    moduleSlug: "nha-cung-cap-va-gia", slug: "thuong-luong-giao-hang-va-thanh-toan", title: "Thương lượng giao hàng và thanh toán",
    summary: "Làm rõ lead time, đặt cọc, số dư và mốc giao mà không vượt thẩm quyền.", situation: "Thống nhất điều kiện trước đơn mua", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l11-jiaoqi", "交期", "jiāoqī", "thời hạn giao", "正常交期是十五天。", "Lead time thông thường là 15 ngày."],
      ["l11-dingjin", "定金", "dìngjīn", "tiền đặt cọc", "合同确认后支付定金。", "Sau khi xác nhận hợp đồng sẽ trả đặt cọc."],
      ["l11-weikuan", "尾款", "wěikuǎn", "số tiền còn lại", "验货后支付尾款。", "Sau khi kiểm hàng sẽ trả số tiền còn lại."],
      ["l11-fukuantiaojian", "付款条件", "fùkuǎn tiáojiàn", "điều kiện thanh toán", "双方要确认付款条件。", "Hai bên cần xác nhận điều kiện thanh toán."],
      ["l11-yanqi", "延期", "yánqī", "trì hoãn", "如果延期，请提前通知。", "Nếu trì hoãn, hãy báo trước."],
      ["l11-shenpi", "审批", "shěnpī", "phê duyệt", "付款需要内部审批。", "Thanh toán cần phê duyệt nội bộ."],
    ],
    request: ["供应商希望先付全部货款。", "Gōngyìngshāng xīwàng xiān fù quánbù huòkuǎn.", "Nhà cung cấp muốn thanh toán toàn bộ tiền hàng trước."],
    response: ["我会记录条件并提交审批，不会自行承诺。", "Wǒ huì jìlù tiáojiàn bìng tíjiāo shěnpī, bú huì zìxíng chéngnuò.", "Tôi sẽ ghi nhận điều kiện và trình phê duyệt, không tự cam kết."],
    notes: [note("Điều kiện nếu trì hoãn", "如果延期，请……", "如果 nêu điều kiện; vế sau nêu hành động mong muốn."), note("Không tự cam kết thanh toán", "需要内部审批", "Luôn theo hợp đồng, thẩm quyền và quy trình xác minh tài khoản thực tế.")],
  },
  {
    moduleSlug: "nha-cung-cap-va-gia", slug: "kiem-tra-nha-cung-cap-va-gia", title: "Kiểm tra: Nhà cung cấp & giá",
    summary: "Ôn sàng lọc đối tác, MOQ, mẫu, báo giá, lead time và điều kiện thanh toán.", situation: "Đánh giá cuối module 2", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l12-caigou", "采购", "cǎigòu", "mua hàng, thu mua", "采购团队正在比价。", "Đội thu mua đang so sánh giá."],
      ["l12-xunjia", "询价", "xúnjià", "hỏi giá", "我们向三家供应商询价。", "Chúng tôi hỏi giá ba nhà cung cấp."],
      ["l12-bijia", "比价", "bǐjià", "so sánh giá", "比价时也要看交期。", "Khi so giá cũng phải xem lead time."],
      ["l12-hetong", "合同", "hétong", "hợp đồng", "合同条款需要审核。", "Điều khoản hợp đồng cần được duyệt."],
      ["l12-tiaokuan", "条款", "tiáokuǎn", "điều khoản", "请确认质量条款。", "Hãy xác nhận điều khoản chất lượng."],
      ["l12-fengxian", "风险", "fēngxiǎn", "rủi ro", "预付款存在一定风险。", "Trả trước có một mức rủi ro nhất định."],
    ],
    request: ["我们要从三份报价中选择合作方案。", "Wǒmen yào cóng sān fèn bàojià zhōng xuǎnzé hézuò fāng'àn.", "Chúng ta cần chọn phương án hợp tác từ ba báo giá."],
    response: ["我会综合比较价格、质量、交期和风险。", "Wǒ huì zōnghé bǐjiào jiàgé, zhìliàng, jiāoqī hé fēngxiǎn.", "Tôi sẽ so sánh tổng hợp giá, chất lượng, lead time và rủi ro."],
    notes: [note("So sánh nhiều yếu tố", "综合比较 A、B 和 C", "综合比较 nhấn mạnh quyết định không chỉ dựa trên một chỉ số."), note("Hợp đồng cần chuyên môn", "条款需要审核", "Nội dung ngôn ngữ không thay thế tư vấn pháp lý, thuế, hải quan hoặc tài chính.")], challenge: sourcingChallenge,
  },
  {
    moduleSlug: "van-hanh-don-va-ton", slug: "tiep-nhan-va-xac-nhan-don", title: "Tiếp nhận và xác nhận đơn",
    summary: "Đọc trạng thái, xác nhận thanh toán và phát hiện thông tin đơn còn thiếu.", situation: "Kiểm tra danh sách đơn mới", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l13-dingdan", "订单", "dìngdān", "đơn hàng", "今天有五十个新订单。", "Hôm nay có 50 đơn mới."],
      ["l13-daifukuan", "待付款", "dài fùkuǎn", "chờ thanh toán", "这个订单还是待付款。", "Đơn này vẫn đang chờ thanh toán."],
      ["l13-yifukuan", "已付款", "yǐ fùkuǎn", "đã thanh toán", "系统显示买家已付款。", "Hệ thống hiển thị người mua đã thanh toán."],
      ["l13-daifahuo", "待发货", "dài fāhuò", "chờ gửi hàng", "待发货订单需要今天处理。", "Đơn chờ gửi cần xử lý hôm nay."],
      ["l13-beizhu", "备注", "bèizhù", "ghi chú", "买家在订单里留了备注。", "Người mua đã để lại ghi chú trong đơn."],
      ["l13-shouhuoren", "收货人", "shōuhuòrén", "người nhận", "请核对收货人姓名。", "Hãy đối chiếu tên người nhận."],
    ],
    request: ["这个订单已付款，但收货信息不完整。", "Zhège dìngdān yǐ fùkuǎn, dàn shōuhuò xìnxī bù wánzhěng.", "Đơn này đã thanh toán nhưng thông tin nhận hàng chưa đầy đủ."],
    response: ["我会先联系买家确认，再安排发货。", "Wǒ huì xiān liánxì mǎijiā quèrèn, zài ānpái fāhuò.", "Tôi sẽ liên hệ người mua xác nhận rồi mới sắp xếp gửi hàng."],
    notes: [note("Trạng thái với 待 / 已", "待付款 / 已付款", "待 là đang chờ; 已 cho biết hành động đã hoàn thành."), note("Không tự suy đoán thông tin", "联系买家确认", "Địa chỉ và người nhận cần được xác nhận theo luồng được nền tảng cho phép.")],
  },
  {
    moduleSlug: "van-hanh-don-va-ton", slug: "dong-bo-ton-kho-va-canh-bao-het-hang", title: "Đồng bộ tồn kho và cảnh báo hết hàng",
    summary: "Đối chiếu tồn khả dụng, tồn giữ chỗ và ngăn bán vượt số lượng thực tế.", situation: "Số tồn giữa kho và gian hàng lệch nhau", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l14-kucun", "库存", "kùcún", "tồn kho", "系统库存和实际数量不同。", "Tồn hệ thống và số lượng thực tế khác nhau."],
      ["l14-tongbu", "同步", "tóngbù", "đồng bộ", "库存每十分钟同步一次。", "Tồn kho đồng bộ mỗi 10 phút."],
      ["l14-keyong", "可用库存", "kěyòng kùcún", "tồn khả dụng", "可用库存只剩十件。", "Tồn khả dụng chỉ còn 10 món."],
      ["l14-suoding", "锁定库存", "suǒdìng kùcún", "tồn đã giữ chỗ", "未付款订单会短暂锁定库存。", "Đơn chưa thanh toán sẽ tạm giữ tồn."],
      ["l14-chaomai", "超卖", "chāomài", "bán vượt tồn", "库存延迟可能导致超卖。", "Tồn cập nhật chậm có thể gây bán vượt."],
      ["l14-quexiao", "缺货", "quēhuò", "hết hàng", "这个颜色暂时缺货。", "Màu này tạm thời hết hàng."],
    ],
    request: ["平台显示二十件，仓库实际只有十二件。", "Píngtái xiǎnshì èrshí jiàn, cāngkù shíjì zhǐ yǒu shí'èr jiàn.", "Nền tảng hiển thị 20 món nhưng kho thực tế chỉ có 12."],
    response: ["我会暂停销售并核对库存同步记录。", "Wǒ huì zàntíng xiāoshòu bìng héduì kùcún tóngbù jìlù.", "Tôi sẽ tạm dừng bán và đối chiếu bản ghi đồng bộ tồn."],
    notes: [note("Số hệ thống và thực tế", "系统显示……，实际只有……", "Cấu trúc này nêu rõ hai nguồn số liệu đang chênh lệch."), note("Ưu tiên ngăn bán vượt", "先暂停，再核对", "Hành động cụ thể phải theo SOP và quyền của hệ thống đang vận hành.")],
  },
  {
    moduleSlug: "van-hanh-don-va-ton", slug: "soan-hang-dong-goi-va-ban-giao", title: "Soạn hàng, đóng gói và bàn giao",
    summary: "Xác nhận mã hàng, số lượng, vật liệu đóng gói và biên bản bàn giao vận chuyển.", situation: "Chuẩn bị đơn cho ca lấy hàng", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l15-jianhuo", "拣货", "jiǎnhuò", "soạn hàng", "请按照清单拣货。", "Hãy soạn hàng theo danh sách."],
      ["l15-fuhe", "复核", "fùhé", "kiểm tra lại", "打包前要复核型号。", "Trước đóng gói phải kiểm tra lại mẫu."],
      ["l15-dabao", "打包", "dǎbāo", "đóng gói", "易碎品需要单独打包。", "Hàng dễ vỡ cần đóng gói riêng."],
      ["l15-miandan", "面单", "miàndān", "nhãn vận chuyển", "面单上的地址不清楚。", "Địa chỉ trên nhãn vận chuyển không rõ."],
      ["l15-jiaojie", "交接", "jiāojiē", "bàn giao", "下午三点和快递交接。", "Ba giờ chiều bàn giao cho chuyển phát."],
      ["l15-saomiao", "扫描", "sǎomiáo", "quét mã", "出库前扫描条码。", "Quét mã vạch trước khi xuất kho."],
    ],
    request: ["今天下午快递会来取两百个包裹。", "Jīntiān xiàwǔ kuàidì huì lái qǔ liǎngbǎi ge bāoguǒ.", "Chiều nay đơn vị chuyển phát sẽ lấy 200 kiện."],
    response: ["我们先拣货复核，再扫描面单并完成交接。", "Wǒmen xiān jiǎnhuò fùhé, zài sǎomiáo miàndān bìng wánchéng jiāojiē.", "Chúng ta soạn và kiểm lại trước, sau đó quét nhãn và hoàn tất bàn giao."],
    notes: [note("Chuỗi thao tác", "拣货 → 复核 → 打包 → 交接", "Bốn từ giúp mô tả luồng hoàn tất đơn theo thứ tự."), note("Hàng đặc biệt theo SOP", "易碎品需要……", "Vật liệu và cách đóng gói phải theo tiêu chuẩn hàng hóa và đơn vị vận chuyển.")],
  },
  {
    moduleSlug: "van-hanh-don-va-ton", slug: "theo-doi-van-don-va-bao-cham", title: "Theo dõi vận đơn và báo chậm",
    summary: "Tra cứu vận đơn, nhận diện cập nhật bất thường và báo người mua bằng mốc có căn cứ.", situation: "Vận đơn chưa cập nhật hai ngày", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l16-yundan", "运单", "yùndān", "vận đơn", "请提供运单号码。", "Hãy cung cấp mã vận đơn."],
      ["l16-guiji", "物流轨迹", "wùliú guǐjì", "hành trình vận chuyển", "物流轨迹两天没有更新。", "Hành trình vận chuyển chưa cập nhật hai ngày."],
      ["l16-lanzhou", "揽收", "lǎnshōu", "đã nhận kiện", "包裹还没有揽收记录。", "Kiện chưa có bản ghi nhận hàng."],
      ["l16-zhongzhuan", "中转", "zhōngzhuǎn", "trung chuyển", "包裹正在中转站。", "Kiện đang ở trạm trung chuyển."],
      ["l16-yichang", "异常", "yìcháng", "bất thường", "系统提示物流异常。", "Hệ thống báo vận chuyển bất thường."],
      ["l16-cuijian", "催件", "cuījiàn", "thúc giao kiện", "我们已经向承运方催件。", "Chúng tôi đã thúc đơn vị vận chuyển."],
    ],
    request: ["买家问为什么物流一直没有更新。", "Mǎijiā wèn wèishénme wùliú yìzhí méiyǒu gēngxīn.", "Người mua hỏi vì sao vận chuyển chưa cập nhật."],
    response: ["我先联系承运方核实，再给买家明确回复时间。", "Wǒ xiān liánxì chéngyùnfāng héshí, zài gěi mǎijiā míngquè huífù shíjiān.", "Tôi sẽ xác minh với đơn vị vận chuyển rồi báo người mua mốc phản hồi rõ ràng."],
    notes: [note("Chưa cập nhật", "一直没有更新", "一直 nhấn mạnh trạng thái kéo dài đến hiện tại."), note("Không hứa mốc chưa xác minh", "核实后回复", "Phân biệt mốc phản hồi của đội hỗ trợ với mốc giao thực tế của đơn vị vận chuyển.")],
  },
  {
    moduleSlug: "van-hanh-don-va-ton", slug: "xu-ly-huy-don-va-doi-dia-chi", title: "Xử lý hủy đơn và đổi địa chỉ",
    summary: "Kiểm tra trạng thái trước khi hủy, chặn xuất hoặc đề nghị thay đổi thông tin nhận hàng.", situation: "Người mua muốn thay đổi sau khi đặt", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l17-quxiao", "取消订单", "qǔxiāo dìngdān", "hủy đơn", "买家申请取消订单。", "Người mua yêu cầu hủy đơn."],
      ["l17-gaizhi", "修改地址", "xiūgǎi dìzhǐ", "đổi địa chỉ", "发货后可能无法修改地址。", "Sau khi gửi có thể không đổi được địa chỉ."],
      ["l17-lanjie", "拦截", "lánjié", "chặn kiện", "我们正在申请拦截包裹。", "Chúng tôi đang đề nghị chặn kiện."],
      ["l17-chuku", "出库", "chūkù", "xuất kho", "订单已经出库。", "Đơn đã xuất kho."],
      ["l17-chehui", "撤回", "chèhuí", "rút lại", "仓库还可以撤回任务。", "Kho vẫn có thể rút lại tác vụ."],
      ["l17-yuandizhi", "原地址", "yuán dìzhǐ", "địa chỉ ban đầu", "包裹可能继续寄往原地址。", "Kiện có thể tiếp tục gửi đến địa chỉ ban đầu."],
    ],
    request: ["订单已经出库，买家现在要改地址。", "Dìngdān yǐjīng chūkù, mǎijiā xiànzài yào gǎi dìzhǐ.", "Đơn đã xuất kho, giờ người mua muốn đổi địa chỉ."],
    response: ["我会查询是否可以拦截，并说明可能的结果。", "Wǒ huì cháxún shìfǒu kěyǐ lánjié, bìng shuōmíng kěnéng de jiéguǒ.", "Tôi sẽ kiểm tra có thể chặn kiện không và giải thích các kết quả có thể xảy ra."],
    notes: [note("Khả năng thay đổi", "是否可以……", "Dùng để hỏi khả năng thực tế thay vì cam kết trước."), note("Nêu kết quả có thể", "可能……", "Giúp người mua hiểu rủi ro khi đơn đã sang bước kho hoặc vận chuyển.")],
  },
  {
    moduleSlug: "van-hanh-don-va-ton", slug: "kiem-tra-van-hanh-don-va-ton", title: "Kiểm tra: Vận hành đơn & tồn",
    summary: "Ôn trạng thái đơn, tồn kho, soạn đóng gói, vận đơn và thay đổi sau đặt hàng.", situation: "Đánh giá cuối module 3", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l18-lvyue", "订单履约", "dìngdān lǚyuē", "thực hiện đơn hàng", "订单履约效率需要提高。", "Hiệu quả thực hiện đơn cần cải thiện."],
      ["l18-shixiao", "时效", "shíxiào", "thời gian đáp ứng", "这个渠道的配送时效更快。", "Kênh này có thời gian giao nhanh hơn."],
      ["l18-jiedan", "截单", "jiédān", "chốt đơn theo giờ", "每天四点截单。", "Mỗi ngày chốt đơn lúc bốn giờ."],
      ["l18-loudan", "漏单", "lòudān", "bỏ sót đơn", "系统异常导致一个订单漏单。", "Lỗi hệ thống khiến một đơn bị bỏ sót."],
      ["l18-duizhang", "对账", "duìzhàng", "đối soát", "交接后要核对账目。", "Sau bàn giao cần đối soát."],
      ["l18-bihe", "闭环", "bìhuán", "khép kín quy trình", "异常处理后要形成闭环。", "Sau xử lý bất thường cần khép kín quy trình."],
    ],
    request: ["昨天有一个订单没有按时发出。", "Zuótiān yǒu yí ge dìngdān méiyǒu ànshí fāchū.", "Hôm qua có một đơn không được gửi đúng hạn."],
    response: ["我会查明漏单环节，补发并记录闭环。", "Wǒ huì chámíng lòudān huánjié, bǔfā bìng jìlù bìhuán.", "Tôi sẽ xác định khâu bỏ sót, gửi bổ sung và ghi lại việc khép kín xử lý."],
    notes: [note("Đúng hạn", "按时 + 动词", "按时发出 nghĩa là gửi đúng thời hạn đã quy định."), note("Khép kín sự cố", "原因 + 处理 + 预防", "Một bản ghi tốt gồm nguyên nhân, cách xử lý và biện pháp ngăn lặp lại.")], challenge: fulfillmentChallenge,
  },
  {
    moduleSlug: "hau-mai-va-toi-uu", slug: "tu-van-truoc-ban-va-xac-nhan-nhu-cau", title: "Tư vấn trước bán và xác nhận nhu cầu",
    summary: "Hỏi mục đích sử dụng, thông số cần thiết và trả lời trong phạm vi đã xác minh.", situation: "Người mua nhắn hỏi trước khi đặt", estimatedMinutes: 12, isFree: false,
    vocabulary: [
      ["l19-shouqian", "售前咨询", "shòuqián zīxún", "tư vấn trước bán", "客服正在回复售前咨询。", "Chăm sóc khách đang trả lời tư vấn trước bán."],
      ["l19-xuqiu", "需求", "xūqiú", "nhu cầu", "请问您的主要需求是什么？", "Xin hỏi nhu cầu chính của anh/chị là gì?"],
      ["l19-tuijian", "推荐", "tuījiàn", "đề xuất", "我根据用途推荐合适的型号。", "Tôi đề xuất mẫu phù hợp theo mục đích."],
      ["l19-shipei", "适配", "shìpèi", "tương thích", "这个配件是否适配旧型号？", "Phụ kiện này có tương thích mẫu cũ không?"],
      ["l19-kefu", "客服", "kèfú", "chăm sóc khách hàng", "客服不能承诺未确认的信息。", "CSKH không được cam kết thông tin chưa xác nhận."],
      ["l19-zhuanye", "专业", "zhuānyè", "chuyên môn", "专业问题需要转给技术人员。", "Vấn đề chuyên môn cần chuyển cho kỹ thuật."],
    ],
    request: ["买家不确定哪个型号适合他的设备。", "Mǎijiā bù quèdìng nǎge xínghào shìhé tā de shèbèi.", "Người mua chưa chắc mẫu nào phù hợp thiết bị của họ."],
    response: ["我会先确认设备信息，再根据已审核资料推荐。", "Wǒ huì xiān quèrèn shèbèi xìnxī, zài gēnjù yǐ shěnhé zīliào tuījiàn.", "Tôi sẽ xác nhận thông tin thiết bị rồi đề xuất theo tài liệu đã duyệt."],
    notes: [note("Hỏi nhu cầu trước", "请问您主要用于……？", "Câu hỏi về mục đích giúp tránh đề xuất chỉ dựa trên giá."), note("Chuyển câu hỏi chuyên môn", "需要转给……确认", "Các vấn đề kỹ thuật, an toàn hoặc pháp lý phải được người có thẩm quyền xác nhận.")],
  },
  {
    moduleSlug: "hau-mai-va-toi-uu", slug: "xu-ly-thieu-sai-va-hong-hang", title: "Xử lý thiếu, sai và hỏng hàng",
    summary: "Phân loại sự cố, thu thập thông tin và chuyển phương án xử lý theo chính sách.", situation: "Người mua báo kiện có vấn đề", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l20-quejian", "缺件", "quējiàn", "thiếu món trong kiện", "买家说包裹里缺了一件。", "Người mua nói kiện thiếu một món."],
      ["l20-facuohuo", "发错货", "fā cuò huò", "gửi sai hàng", "仓库确认发错货了。", "Kho xác nhận đã gửi sai hàng."],
      ["l20-posun", "破损", "pòsǔn", "hư hỏng", "外包装有明显破损。", "Bao bì ngoài bị hư hỏng rõ rệt."],
      ["l20-kaixiang", "开箱", "kāixiāng", "mở kiện", "请提供开箱视频。", "Hãy cung cấp video mở kiện."],
      ["l20-pingzheng", "凭证", "píngzhèng", "chứng từ, bằng chứng", "平台要求上传相关凭证。", "Nền tảng yêu cầu tải bằng chứng liên quan."],
      ["l20-bufa", "补发", "bǔfā", "gửi bù", "审核通过后可以安排补发。", "Sau khi duyệt có thể sắp xếp gửi bù."],
    ],
    request: ["买家说收到的颜色和订单不一样。", "Mǎijiā shuō shōudào de yánsè hé dìngdān bù yíyàng.", "Người mua nói màu nhận được không giống đơn."],
    response: ["我先核对订单和凭证，再按政策提交处理。", "Wǒ xiān héduì dìngdān hé píngzhèng, zài àn zhèngcè tíjiāo chǔlǐ.", "Tôi sẽ đối chiếu đơn và bằng chứng rồi gửi xử lý theo chính sách."],
    notes: [note("Mô tả loại sự cố", "缺件 / 发错货 / 破损", "Phân loại đúng giúp chuyển đúng luồng hậu mãi."), note("Không yêu cầu dữ liệu ngoài phạm vi", "按平台要求提供凭证", "Chỉ thu thập bằng chứng cần thiết và xử lý dữ liệu theo quy định bảo mật.")],
  },
  {
    moduleSlug: "hau-mai-va-toi-uu", slug: "xu-ly-tra-hang-va-hoan-tien", title: "Xử lý trả hàng và hoàn tiền",
    summary: "Giải thích điều kiện, trạng thái xét duyệt và thời gian xử lý trả hàng hoặc hoàn tiền.", situation: "Người mua gửi yêu cầu hậu mãi", estimatedMinutes: 14, isFree: false,
    vocabulary: [
      ["l21-tuihuo", "退货", "tuìhuò", "trả hàng", "买家申请七天内退货。", "Người mua xin trả hàng trong bảy ngày."],
      ["l21-tuikuan", "退款", "tuìkuǎn", "hoàn tiền", "退款正在原路处理。", "Khoản hoàn đang được xử lý theo phương thức ban đầu."],
      ["l21-shouhou", "售后申请", "shòuhòu shēnqǐng", "yêu cầu hậu mãi", "请在平台提交售后申请。", "Hãy gửi yêu cầu hậu mãi trên nền tảng."],
      ["l21-shenhezhong", "审核中", "shěnhé zhōng", "đang xét duyệt", "您的申请目前在审核中。", "Yêu cầu của anh/chị hiện đang được xét."],
      ["l21-yuanlu", "原路退回", "yuánlù tuìhuí", "hoàn theo phương thức ban đầu", "款项会原路退回。", "Tiền sẽ được hoàn theo phương thức ban đầu."],
      ["l21-shixian", "处理时限", "chǔlǐ shíxiàn", "thời hạn xử lý", "页面会显示预计处理时限。", "Trang sẽ hiển thị thời hạn xử lý dự kiến."],
    ],
    request: ["买家想知道退款什么时候到账。", "Mǎijiā xiǎng zhīdào tuìkuǎn shénme shíhou dàozhàng.", "Người mua muốn biết khi nào tiền hoàn về tài khoản."],
    response: ["我会说明审核状态和平台显示的预计时限。", "Wǒ huì shuōmíng shěnhé zhuàngtài hé píngtái xiǎnshì de yùjì shíxiàn.", "Tôi sẽ giải thích trạng thái xét duyệt và thời hạn dự kiến nền tảng hiển thị."],
    notes: [note("Đang trong quá trình", "正在…… / ……中", "Hai cấu trúc đều diễn tả một việc đang được xử lý."), note("Không tự hứa hoàn tiền", "按照政策和审核结果", "Điều kiện và thời hạn phụ thuộc nền tảng, phương thức thanh toán và quy định áp dụng.")],
  },
  {
    moduleSlug: "hau-mai-va-toi-uu", slug: "phan-hoi-danh-gia-va-khieu-nai", title: "Phản hồi đánh giá và khiếu nại",
    summary: "Ghi nhận phản hồi, xác minh đơn và trả lời công khai hoặc riêng tư đúng phạm vi.", situation: "Gian hàng nhận một đánh giá thấp", estimatedMinutes: 13, isFree: false,
    vocabulary: [
      ["l22-pingjia", "评价", "píngjià", "đánh giá", "我们收到了新的商品评价。", "Chúng tôi nhận được đánh giá sản phẩm mới."],
      ["l22-haoping", "好评", "hǎopíng", "đánh giá tốt", "感谢您的好评和支持。", "Cảm ơn đánh giá tốt và sự ủng hộ."],
      ["l22-chaping", "差评", "chàpíng", "đánh giá xấu", "团队正在核实这条差评。", "Đội ngũ đang xác minh đánh giá xấu này."],
      ["l22-tousu", "投诉", "tóusù", "khiếu nại", "客户通过平台提交投诉。", "Khách gửi khiếu nại qua nền tảng."],
      ["l22-gongkai", "公开回复", "gōngkāi huífù", "phản hồi công khai", "公开回复不要包含个人信息。", "Phản hồi công khai không được chứa thông tin cá nhân."],
      ["l22-xieshang", "协商", "xiéshāng", "trao đổi để thống nhất", "我们会联系买家协商处理。", "Chúng tôi sẽ liên hệ người mua để trao đổi xử lý."],
    ],
    request: ["买家因为配送延迟给了差评。", "Mǎijiā yīnwèi pèisòng yánchí gěi le chàpíng.", "Người mua đánh giá xấu vì giao hàng trễ."],
    response: ["我会核实订单，礼貌回复并邀请私下沟通。", "Wǒ huì héshí dìngdān, lǐmào huífù bìng yāoqǐng sīxià gōutōng.", "Tôi sẽ xác minh đơn, phản hồi lịch sự và mời trao đổi riêng."],
    notes: [note("Phản hồi không tranh luận", "感谢反馈 + 核实情况 + 提供渠道", "Cấu trúc này ghi nhận, nêu hành động và đưa kênh hỗ trợ."), note("Bảo vệ thông tin cá nhân", "不要公开个人信息", "Không đưa số điện thoại, địa chỉ, mã thanh toán hoặc dữ liệu nhạy cảm vào phản hồi công khai.")],
  },
  {
    moduleSlug: "hau-mai-va-toi-uu", slug: "doc-du-lieu-va-toi-uu-chuyen-doi", title: "Đọc dữ liệu và tối ưu chuyển đổi",
    summary: "Đọc lượt hiển thị, lượt nhấp, tỷ lệ chuyển đổi và đặt giả thuyết cải thiện có kiểm soát.", situation: "Đánh giá hiệu quả trang sản phẩm", estimatedMinutes: 15, isFree: false,
    vocabulary: [
      ["l23-puguang", "曝光量", "pùguāng liàng", "lượt hiển thị", "这个商品的曝光量下降了。", "Lượt hiển thị sản phẩm này đã giảm."],
      ["l23-dianjilv", "点击率", "diǎnjīlǜ", "tỷ lệ nhấp", "新主图提高了点击率。", "Ảnh chính mới đã tăng tỷ lệ nhấp."],
      ["l23-zhuanhualv", "转化率", "zhuǎnhuàlǜ", "tỷ lệ chuyển đổi", "本周转化率是百分之三。", "Tỷ lệ chuyển đổi tuần này là 3%."],
      ["l23-fangke", "访客", "fǎngkè", "khách truy cập", "昨天有一千名访客。", "Hôm qua có 1.000 khách truy cập."],
      ["l23-loushi", "漏斗", "lòudǒu", "phễu", "要分步骤分析转化漏斗。", "Cần phân tích phễu chuyển đổi theo từng bước."],
      ["l23-ceshi", "对照测试", "duìzhào cèshì", "thử nghiệm đối chứng", "我们只测试一个主要变量。", "Chúng ta chỉ kiểm thử một biến chính."],
    ],
    request: ["商品有很多曝光，但点击率比较低。", "Shāngpǐn yǒu hěn duō pùguāng, dàn diǎnjīlǜ bǐjiào dī.", "Sản phẩm có nhiều hiển thị nhưng tỷ lệ nhấp khá thấp."],
    response: ["我们先检查主图和标题，再设计对照测试。", "Wǒmen xiān jiǎnchá zhǔtú hé biāotí, zài shèjì duìzhào cèshì.", "Chúng ta kiểm tra ảnh chính và tiêu đề trước, sau đó thiết kế thử nghiệm đối chứng."],
    notes: [note("Đọc theo phễu", "曝光 → 点击 → 下单", "Nhìn từng bước giúp tránh quy toàn bộ vấn đề cho một chỉ số."), note("Không khẳng định nhân quả sớm", "可能与……有关", "Một thay đổi số liệu chỉ là tín hiệu; cần kiểm tra định nghĩa và thử nghiệm phù hợp.")],
  },
  {
    moduleSlug: "hau-mai-va-toi-uu", slug: "kiem-tra-tong-hop-thuong-mai-dien-tu", title: "Kiểm tra tổng hợp: Thương mại điện tử",
    summary: "Tổng hợp gian hàng, nguồn hàng, thực hiện đơn, hậu mãi, dữ liệu và khuyến mãi.", situation: "Đánh giá cuối lộ trình", estimatedMinutes: 16, isFree: false,
    vocabulary: [
      ["l24-yunying", "运营", "yùnyíng", "vận hành", "店铺运营需要跨团队配合。", "Vận hành gian hàng cần phối hợp liên đội."],
      ["l24-hegui", "合规", "hégé", "tuân thủ", "商品信息必须合规。", "Thông tin sản phẩm phải tuân thủ."],
      ["l24-shuju", "数据", "shùjù", "dữ liệu", "我们根据数据调整方案。", "Chúng tôi điều chỉnh phương án theo dữ liệu."],
      ["l24-liucheng", "流程", "liúchéng", "quy trình", "请按照售后流程处理。", "Hãy xử lý theo quy trình hậu mãi."],
      ["l24-xietong", "协同", "xiétóng", "phối hợp", "客服和仓库需要及时协同。", "CSKH và kho cần phối hợp kịp thời."],
      ["l24-fupan", "复盘", "fùpán", "tổng kết, nhìn lại", "活动结束后安排复盘。", "Sau chương trình sẽ tổ chức tổng kết."],
    ],
    request: ["这个月出现了超卖、延迟和投诉上升。", "Zhège yuè chūxiàn le chāomài, yánchí hé tóusù shàngshēng.", "Tháng này xuất hiện bán vượt tồn, chậm giao và khiếu nại tăng."],
    response: ["我们会按数据复盘流程，并明确各团队的改进任务。", "Wǒmen huì àn shùjù fùpán liúchéng, bìng míngquè gè tuánduì de gǎijìn rènwu.", "Chúng ta sẽ nhìn lại quy trình theo dữ liệu và giao rõ nhiệm vụ cải thiện cho từng đội."],
    notes: [note("Từ dữ liệu đến hành động", "数据 + 原因 + 负责人 + 截止时间", "Một buổi tổng kết nên kết thúc bằng người phụ trách và thời hạn cụ thể."), note("Tuân thủ theo thị trường", "按照适用规则处理", "Chính sách nền tảng, thuế, quảng cáo, dữ liệu và quyền người tiêu dùng khác nhau theo thị trường.")], challenge: finalChallenge,
  },
];

export const ecommerceLessons = ecommerceLessonInputs.map(createLesson);

export const ecommerceCourseStats = {
  lessons: ecommerceLessons.length,
  minutes: ecommerceLessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0),
  freeLessons: ecommerceLessons.filter((lesson) => lesson.isFree).length,
  vocabulary: new Set(ecommerceLessons.flatMap((lesson) => lesson.vocabulary.map((word) => word.slug))).size,
  modules: ecommerceModules.length,
};
