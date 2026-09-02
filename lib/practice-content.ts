export type PracticeIndustryId = string;

export type PracticeIndustry = {
  id: PracticeIndustryId;
  label: string;
  description: string;
  imageUrl?: string;
};

export type PracticeExercise = {
  id: string;
  eyebrow: string;
  prompt: string;
  chinese?: string;
  listeningText?: string;
  isStatementCorrect?: boolean;
  audioUrl?: string;
  options: string[];
  correctOption: number;
  explanation: string;
};

export type PracticeListeningStatement = {
  optionIndex: number;
  text: string;
  isCorrect: boolean;
  correctText: string;
  explanation: string;
};

export type PracticeListeningContext = {
  sentenceZh: string;
  brief: string;
  focus: string[];
  exercises: PracticeExercise[] | null;
};

export type PracticeMeaningQuestion = {
  options: string[];
  correctOption: number;
};

const practiceListeningMeanings: Record<string, string> = {
  "office-delay-1": "Hiện tại có thể chậm một ngày, tôi báo trước với anh/chị.",
  "office-delay-2": "Tôi không biết, để ngày mai nói tiếp.",
  "office-delay-3": "Tôi sẽ cập nhật tiến độ trước 5 giờ chiều nay.",
  "office-meeting-1": "Cuộc họp lúc 2 giờ chiều ở phòng họp số 3, đúng không?",
  "office-meeting-2": "Hôm nay có cuộc họp không?",
  "office-meeting-3": "Tôi có cần mang báo cáo tới không?",
  "office-extension-1": "Có thể lùi đến trưa mai không?",
  "office-extension-2": "Hủy dữ liệu.",
  "office-extension-3": "Được, tôi sẽ gửi cho anh/chị trước trưa mai.",
  "office-handover-1": "Tài liệu đã sắp xếp xong, giờ chỉ chờ khách hàng xác nhận.",
  "office-handover-2": "Khách hàng đã hủy.",
  "office-handover-3": "Nếu có vấn đề, có thể liên hệ Tiểu Trần.",
  "factory-stop-1": "Tôi tiếp tục khởi động máy.",
  "factory-stop-2": "Tôi đã dừng máy để kiểm tra.",
  "factory-stop-3": "Máy không cần kiểm tra.",
  "factory-process-1": "Trước khi mở van, cần kiểm tra áp suất trước, đúng không?",
  "factory-process-2": "Tôi biết rồi, không cần hỏi.",
  "factory-process-3": "Cần kiểm tra áp suất trước, đúng không?",
  "factory-handover-1": "Lô cuối vẫn chờ kiểm tra chất lượng; khi có kết quả hãy ghi lại.",
  "factory-handover-2": "Kết quả không quan trọng.",
  "factory-handover-3": "Hãy ghi lại kết quả.",
  "warehouse-receive-1": "Thừa hai thùng.",
  "warehouse-receive-2": "Thiếu hai thùng.",
  "warehouse-receive-3": "Không cần xem phiếu giao hàng.",
  "warehouse-shortage-1": "Hàng tồn kho ở đâu?",
  "warehouse-shortage-2": "Vật tư này không đủ tồn kho, chỉ đáp ứng đơn hàng buổi sáng.",
  "warehouse-shortage-3": "Hàng tồn kho ở đâu?",
  "warehouse-dispatch-1": "Tôi xác nhận lại: lô hàng này xuất qua cửa nào?",
  "warehouse-dispatch-2": "Không cần nói.",
  "warehouse-dispatch-3": "Lô hàng này tổng cộng 20 kiện, đúng không?",
  "sales-needs-1": "Dùng trong văn phòng hay trong xưởng?",
  "sales-needs-2": "Anh/chị cần bao nhiêu cái?",
  "sales-needs-3": "Anh/chị dự kiến cần số lượng bao nhiêu?",
  "sales-quote-1": "Báo giá sẽ được gửi sau bảy ngày.",
  "sales-quote-2": "Báo giá đã gửi, mức giá này chưa bao gồm phí vận chuyển.",
  "sales-quote-3": "Báo giá sẽ được gửi sau bảy ngày.",
  "sales-complaint-1": "Xin lỗi vì đã gây bất tiện cho anh/chị.",
  "sales-complaint-2": "Đây không phải vấn đề của chúng tôi.",
  "sales-complaint-3": "Tôi sẽ phản hồi trước 4 giờ chiều nay.",
  "restaurant-arrival-1": "Anh/chị muốn uống gì?",
  "restaurant-arrival-2": "Tổng cộng bốn người, đúng không?",
  "restaurant-arrival-3": "Anh/chị tự tìm chỗ ngồi.",
  "restaurant-allergy-1": "Tôi sẽ ghi nhận thông tin dị ứng trước, rồi nhờ bếp xác nhận theo quy trình.",
  "restaurant-allergy-2": "Món này tuyệt đối an toàn.",
  "restaurant-allergy-3": "Tôi sẽ ghi nhận thông tin dị ứng trước, rồi nhờ bếp xác nhận theo quy trình.",
  "restaurant-delay-1": "Món ăn vẫn chưa xong.",
  "restaurant-delay-2": "Trước tiên đối chiếu phiếu gọi món, sau đó xác nhận cách xử lý.",
  "restaurant-delay-3": "Khi nào có tin thì nói tiếp.",
  "ecommerce-listing-1": "Cứ đăng trước, sau này kiểm tra.",
  "ecommerce-listing-2": "Tôi sẽ kiểm tra thông tin sản phẩm và ảnh biến thể trước, rồi sắp xếp đăng.",
  "ecommerce-listing-3": "Cứ đăng trước, sau này kiểm tra.",
  "ecommerce-quote-1": "Tôi sẽ thanh toán toàn bộ tiền hàng ngay bây giờ.",
  "ecommerce-quote-2": "Vui lòng xác nhận số lượng tối thiểu, giá theo bậc và báo giá có gồm thuế, phí vận chuyển hay không.",
  "ecommerce-quote-3": "Tôi sẽ thanh toán toàn bộ tiền hàng ngay bây giờ.",
  "ecommerce-delay-1": "Tôi sẽ xác minh bất thường vận chuyển trước, rồi gửi yêu cầu hậu mãi theo chính sách nền tảng.",
  "ecommerce-delay-2": "Hôm nay chắc chắn sẽ giao tới.",
  "ecommerce-delay-3": "Tôi sẽ xác minh bất thường vận chuyển trước, rồi gửi yêu cầu hậu mãi theo chính sách nền tảng.",
  "core-confirm-1": "Xin lỗi, vui lòng nói lại một lần nữa.",
  "core-confirm-2": "Tôi đã nghe hiểu hết rồi.",
  "core-confirm-3": "Theo tôi hiểu, cần nộp biểu mẫu trước thứ Sáu, đúng không?",
  "core-priority-1": "Thời gian của hai nhiệm vụ bị trùng, hãy xác nhận việc nào ưu tiên.",
  "core-priority-2": "Cả hai việc đều rất phiền.",
  "core-priority-3": "Vui lòng để người phụ trách xác nhận thứ tự ưu tiên.",
  "core-mistake-1": "Rất xin lỗi, tôi đã gửi nhầm tệp.",
  "core-mistake-2": "Hệ thống khiến tôi gửi nhầm.",
  "core-mistake-3": "Lần sau, trước khi gửi tôi sẽ kiểm tra số phiên bản và người nhận.",
};

const practiceMeaningPool = [...new Set(Object.values(practiceListeningMeanings))];

export function getPracticeMeaningQuestion(exercise: PracticeExercise): PracticeMeaningQuestion {
  const correctMeaning = practiceListeningMeanings[exercise.id];
  if (!correctMeaning) return { options: exercise.options, correctOption: exercise.correctOption };
  const storedCorrectOption = exercise.options.indexOf(correctMeaning);
  const storedOptionsAreValid = storedCorrectOption >= 0
    && exercise.options.length >= 2
    && new Set(exercise.options).size === exercise.options.length
    && exercise.options.every((option) => !containsHanzi(option));
  if (storedOptionsAreValid && exercise.options.length >= 4) {
    return { options: exercise.options.slice(0, 4), correctOption: storedCorrectOption };
  }

  const checksum = Array.from(exercise.id).reduce((total, character) => total + character.codePointAt(0)!, 0);
  const options = storedOptionsAreValid ? [...exercise.options] : [correctMeaning];
  for (let offset = 1; options.length < 4 && offset < practiceMeaningPool.length; offset += 1) {
    const candidate = practiceMeaningPool[(checksum + (offset * 17)) % practiceMeaningPool.length];
    if (!options.includes(candidate)) options.push(candidate);
  }
  if (storedOptionsAreValid) {
    return { options, correctOption: options.indexOf(correctMeaning) };
  }

  const rotation = checksum % options.length;
  const rotatedOptions = [...options.slice(rotation), ...options.slice(0, rotation)];
  return {
    options: rotatedOptions,
    correctOption: rotatedOptions.indexOf(correctMeaning),
  };
}

function containsHanzi(value: string | undefined): value is string {
  return Boolean(value && /[㐀-鿿]/u.test(value));
}

/**
 * Turns the existing three-choice exercise bank into a balanced listening
 * judgement without exposing the written options before playback.
 */
export function getPracticeListeningStatement(
  exercise: PracticeExercise,
  context?: PracticeListeningContext,
): PracticeListeningStatement {
  const checksum = Array.from(exercise.id).reduce((total, character) => total + character.codePointAt(0)!, 0);
  const directCorrectText = exercise.options[exercise.correctOption];
  const correctText = containsHanzi(directCorrectText)
    ? directCorrectText
    : containsHanzi(exercise.chinese)
      ? exercise.chinese
      : context?.sentenceZh ?? directCorrectText;
  const directIncorrectOption = exercise.options.findIndex((option, index) => (
    index !== exercise.correctOption && containsHanzi(option)
  ));
  const pooledIncorrectText = context?.exercises
    ?.flatMap((item) => item.options.filter((option, index) => index !== item.correctOption && containsHanzi(option)))
    .find((option) => option !== correctText);
  const incorrectText = directIncorrectOption >= 0
    ? exercise.options[directIncorrectOption]
    : pooledIncorrectText;
  const useCorrectStatement = checksum % 2 === 0 || !incorrectText;
  const optionIndex = useCorrectStatement
    ? exercise.correctOption
    : directIncorrectOption;
  const text = useCorrectStatement ? correctText : incorrectText ?? correctText;
  const usesOriginalChineseAnswer = containsHanzi(directCorrectText);
  const genericFocus = context?.focus.slice(0, 2).join(" và ").toLocaleLowerCase("vi");
  if (exercise.listeningText) {
    const isCorrect = exercise.isStatementCorrect ?? exercise.listeningText === correctText;
    return {
      optionIndex: isCorrect ? exercise.correctOption : directIncorrectOption,
      text: exercise.listeningText,
      isCorrect,
      correctText,
      explanation: isCorrect
        ? exercise.explanation
        : `Câu vừa nghe chưa xử lý đúng trọng tâm. Một phản hồi tốt cần ${genericFocus || "rõ ý và phù hợp với tình huống"}.`,
    };
  }
  const explanation = usesOriginalChineseAnswer
    ? exercise.explanation
    : useCorrectStatement
      ? `Câu này đi đúng trọng tâm của ca: ${context?.brief ?? "phản hồi rõ ràng và chuyên nghiệp"}`
      : `Câu vừa nghe chưa xử lý đúng trọng tâm. Một phản hồi tốt cần ${genericFocus || "rõ ý và phù hợp với tình huống"}.`;

  return {
    optionIndex,
    text,
    isCorrect: useCorrectStatement,
    correctText,
    explanation,
  };
}

export type PracticeScenario = {
  id: string;
  industry: PracticeIndustryId;
  title: string;
  brief: string;
  context: string;
  durationMinutes: number;
  level: "Cơ bản" | "Thực tế" | "Nâng cao";
  isFree: boolean;
  sentenceZh: string;
  pinyin: string;
  translation: string;
  focus: string[];
  exercises: PracticeExercise[];
};

export type PracticeScenarioDto = Omit<PracticeScenario, "exercises"> & {
  locked: boolean;
  exercises: PracticeExercise[] | null;
};

export const practiceIndustries: PracticeIndustry[] = [
  { id: "office", label: "Văn phòng", description: "Họp, báo cáo và phối hợp công việc" },
  { id: "factory", label: "Nhà máy", description: "Vận hành, chất lượng và bàn giao ca" },
  { id: "logistics", label: "Kho vận", description: "Nhập xuất, kiểm đếm và giao nhận" },
  { id: "sales", label: "Bán hàng", description: "Tư vấn, báo giá và chăm sóc khách" },
  { id: "restaurant", label: "Nhà hàng", description: "Đón khách, gọi món và phục vụ tại bàn" },
  { id: "ecommerce", label: "TMĐT", description: "Gian hàng, nguồn hàng và vận hành đơn" },
  { id: "core", label: "Cốt lõi", description: "Nghe hiểu, phối hợp và báo vấn đề" },
];

export const practiceScenarios: PracticeScenario[] = [
  {
    id: "bao-tien-do-tre-han",
    industry: "office",
    title: "Báo tiến độ khi sắp trễ hạn",
    brief: "Báo sớm, nêu rõ mức chậm và chủ động đưa mốc cập nhật tiếp theo.",
    context: "Quản lý hỏi liệu hạng mục có kịp hạn cuối vào ngày mai hay không.",
    durationMinutes: 7,
    level: "Thực tế",
    isFree: true,
    sentenceZh: "进度可能会晚一天，我先向您汇报。",
    pinyin: "Jìndù kěnéng huì wǎn yì tiān, wǒ xiān xiàng nín huìbào.",
    translation: "Tiến độ có thể chậm một ngày, tôi báo trước với anh/chị.",
    focus: ["Báo sớm", "Nêu mốc cụ thể", "Giữ giọng chuyên nghiệp"],
    exercises: [
      {
        id: "office-delay-1",
        eyebrow: "Chọn cách phản hồi",
        prompt: "Quản lý hỏi: 能按时完成吗？ Câu nào phù hợp nhất?",
        chinese: "能按时完成吗？",
        options: [
          "目前可能会晚一天，我先向您汇报。",
          "不知道，明天再说吧。",
          "这不是我的问题。",
        ],
        correctOption: 0,
        explanation: "Câu này báo sớm mức chậm cụ thể và thể hiện sự chủ động, không né tránh trách nhiệm.",
      },
      {
        id: "office-delay-2",
        eyebrow: "Hiểu đúng từ khóa",
        prompt: "Trong công việc, 截止时间 có nghĩa là gì?",
        options: ["Thời gian nghỉ", "Hạn chót", "Lịch họp"],
        correctOption: 1,
        explanation: "截止时间 (jiézhǐ shíjiān) là thời hạn cuối cần hoàn thành một việc.",
      },
      {
        id: "office-delay-3",
        eyebrow: "Chốt mốc tiếp theo",
        prompt: "Sau khi báo trễ, câu nào giúp đồng nghiệp biết khi nào sẽ có cập nhật mới?",
        options: [
          "有消息再联系。",
          "我尽量吧。",
          "我会在今天下午五点前更新进度。",
        ],
        correctOption: 2,
        explanation: "Mốc 5 giờ chiều làm cam kết rõ ràng và giúp người nghe chủ động sắp xếp công việc.",
      },
    ],
  },
  {
    id: "xac-nhan-lich-hop",
    industry: "office",
    title: "Xác nhận lịch họp",
    brief: "Xác nhận thời gian, phòng họp và tài liệu cần chuẩn bị trong một lượt nói.",
    context: "Bạn nhận được lịch họp mới và cần xác nhận lại với thư ký bộ phận.",
    durationMinutes: 5,
    level: "Cơ bản",
    isFree: true,
    sentenceZh: "我确认一下，会议是下午两点在三号会议室，对吗？",
    pinyin: "Wǒ quèrèn yíxià, huìyì shì xiàwǔ liǎng diǎn zài sān hào huìyìshì, duì ma?",
    translation: "Tôi xin xác nhận: cuộc họp lúc 2 giờ chiều tại phòng họp số 3, đúng không?",
    focus: ["Xác nhận thông tin", "Hỏi lại lịch sự", "Tránh bỏ sót"],
    exercises: [
      {
        id: "office-meeting-1",
        eyebrow: "Chọn câu xác nhận",
        prompt: "Câu nào xác nhận đủ cả thời gian và địa điểm?",
        options: [
          "今天有会吗？",
          "会议是下午两点在三号会议室，对吗？",
          "我可能不参加。",
        ],
        correctOption: 1,
        explanation: "Câu thứ hai nhắc lại đủ hai thông tin quan trọng và dùng 对吗 để xác nhận lịch sự.",
      },
      {
        id: "office-meeting-2",
        eyebrow: "Hiểu đúng ý",
        prompt: "我确认一下 được dùng khi nào?",
        options: ["Khi muốn xác nhận lại", "Khi muốn từ chối", "Khi muốn kết thúc họp"],
        correctOption: 0,
        explanation: "Cụm này mở đầu một lượt xác nhận, có sắc thái mềm và tự nhiên trong môi trường công sở.",
      },
      {
        id: "office-meeting-3",
        eyebrow: "Chuẩn bị trước họp",
        prompt: "Bạn muốn hỏi có cần mang báo cáo không. Chọn câu phù hợp.",
        options: ["报告已经结束了。", "需要我带报告过去吗？", "谁写这个报告？"],
        correctOption: 1,
        explanation: "需要我…吗？ là mẫu hỏi chủ động xem mình có cần thực hiện việc gì hay không.",
      },
    ],
  },
  {
    id: "xin-them-thoi-gian",
    industry: "office",
    title: "Xin thêm thời gian xử lý",
    brief: "Nêu lý do vừa đủ và đề xuất một hạn mới có thể cam kết.",
    context: "Bạn cần thêm nửa ngày để kiểm tra số liệu trước khi gửi báo cáo.",
    durationMinutes: 8,
    level: "Nâng cao",
    isFree: false,
    sentenceZh: "为了再核对一次数据，可以延到明天中午吗？",
    pinyin: "Wèile zài héduì yí cì shùjù, kěyǐ yán dào míngtiān zhōngwǔ ma?",
    translation: "Để kiểm tra lại số liệu một lần nữa, có thể lùi đến trưa mai không?",
    focus: ["Nêu lý do ngắn", "Đề xuất hạn mới", "Xin xác nhận"],
    exercises: [
      {
        id: "office-extension-1",
        eyebrow: "Đề xuất mốc mới",
        prompt: "Cách xin lùi hạn nào cụ thể và chuyên nghiệp nhất?",
        options: ["以后再交。", "可以延到明天中午吗？", "今天做不完。"],
        correctOption: 1,
        explanation: "Một đề xuất tốt cần có mốc mới rõ ràng để người nghe cân nhắc và xác nhận.",
      },
      {
        id: "office-extension-2",
        eyebrow: "Chọn lý do vừa đủ",
        prompt: "Bạn cần kiểm tra lại số liệu. Cụm nào đúng?",
        options: ["核对数据", "取消数据", "忘记数据"],
        correctOption: 0,
        explanation: "核对数据 nghĩa là đối chiếu hoặc kiểm tra lại số liệu.",
      },
      {
        id: "office-extension-3",
        eyebrow: "Cam kết sau khi được đồng ý",
        prompt: "Câu nào phù hợp để chốt lại?",
        options: ["那就这样吧。", "好的，我会在明天中午前发给您。", "我再看看。"],
        correctOption: 1,
        explanation: "Lặp lại hạn mới giúp cả hai bên thống nhất và cho thấy bạn nhận trách nhiệm.",
      },
    ],
  },
  {
    id: "ban-giao-cong-viec",
    industry: "office",
    title: "Bàn giao trước khi nghỉ phép",
    brief: "Tóm tắt việc đã xong, việc đang chờ và người có thể hỗ trợ.",
    context: "Bạn nghỉ phép hai ngày và cần bàn giao một hồ sơ đang chờ khách xác nhận.",
    durationMinutes: 9,
    level: "Thực tế",
    isFree: false,
    sentenceZh: "文件已经整理好了，现在只等客户确认。",
    pinyin: "Wénjiàn yǐjīng zhěnglǐ hǎo le, xiànzài zhǐ děng kèhù quèrèn.",
    translation: "Hồ sơ đã được sắp xếp xong, hiện chỉ còn chờ khách xác nhận.",
    focus: ["Nêu trạng thái", "Chỉ rõ việc đang chờ", "Giao người phụ trách"],
    exercises: [
      {
        id: "office-handover-1",
        eyebrow: "Báo trạng thái",
        prompt: "文件已经整理好了 cho biết điều gì?",
        options: ["Hồ sơ đã sắp xếp xong", "Hồ sơ bị mất", "Hồ sơ chưa bắt đầu"],
        correctOption: 0,
        explanation: "已经…好了 diễn tả một việc đã hoàn tất và đang ở trạng thái sẵn sàng.",
      },
      {
        id: "office-handover-2",
        eyebrow: "Chỉ rõ việc đang chờ",
        prompt: "Câu nào nói rằng đang chờ khách xác nhận?",
        options: ["客户已经取消。", "只等客户确认。", "不用客户确认。"],
        correctOption: 1,
        explanation: "只等… nhấn mạnh đây là bước duy nhất còn lại.",
      },
      {
        id: "office-handover-3",
        eyebrow: "Giao đầu mối",
        prompt: "Câu nào chỉ người hỗ trợ khi có vấn đề?",
        options: ["有问题可以联系小陈。", "小陈今天很忙。", "这个问题不重要。"],
        correctOption: 0,
        explanation: "Nêu rõ người liên hệ giúp việc bàn giao có thể tiếp tục ngay cả khi bạn vắng mặt.",
      },
    ],
  },
  {
    id: "bao-may-tam-dung",
    industry: "factory",
    title: "Báo máy tạm dừng",
    brief: "Báo đúng thiết bị, tình trạng hiện tại và việc đã làm để đảm bảo an toàn.",
    context: "Máy đóng gói số 2 phát ra tiếng lạ và bạn đã dừng máy.",
    durationMinutes: 7,
    level: "Thực tế",
    isFree: true,
    sentenceZh: "二号包装机有异常声音，我已经停机检查了。",
    pinyin: "Èr hào bāozhuāngjī yǒu yìcháng shēngyīn, wǒ yǐjīng tíngjī jiǎnchá le.",
    translation: "Máy đóng gói số 2 có tiếng bất thường, tôi đã dừng máy để kiểm tra.",
    focus: ["Đúng thiết bị", "An toàn trước", "Báo hành động đã làm"],
    exercises: [
      {
        id: "factory-stop-1",
        eyebrow: "Báo bất thường",
        prompt: "异常声音 có nghĩa là gì?",
        options: ["Âm thanh bất thường", "Tốc độ bình thường", "Nhiệt độ thấp"],
        correctOption: 0,
        explanation: "异常 dùng cho tình trạng khác với bình thường và cần được kiểm tra.",
      },
      {
        id: "factory-stop-2",
        eyebrow: "Báo hành động an toàn",
        prompt: "Bạn đã dừng máy để kiểm tra. Chọn câu đúng.",
        options: ["我继续开机。", "我已经停机检查了。", "我没有看到机器。"],
        correctOption: 1,
        explanation: "已经停机检查了 báo rõ hành động đã được thực hiện, tránh người khác khởi động nhầm.",
      },
      {
        id: "factory-stop-3",
        eyebrow: "Yêu cầu hỗ trợ",
        prompt: "Câu nào phù hợp để nhờ kỹ thuật viên tới kiểm tra?",
        options: ["请维修人员过来检查一下。", "机器不用检查。", "明天再开机吧。"],
        correctOption: 0,
        explanation: "请…过来检查一下 là yêu cầu hỗ trợ rõ ràng nhưng vẫn lịch sự.",
      },
    ],
  },
  {
    id: "xac-nhan-quy-trinh",
    industry: "factory",
    title: "Xác nhận bước vận hành",
    brief: "Hỏi lại thứ tự thao tác trước khi khởi động một công đoạn chưa quen.",
    context: "Bạn cần xác nhận có phải kiểm tra áp suất trước khi mở van hay không.",
    durationMinutes: 6,
    level: "Cơ bản",
    isFree: false,
    sentenceZh: "开阀门之前，要先检查压力，对吗？",
    pinyin: "Kāi fámén zhīqián, yào xiān jiǎnchá yālì, duì ma?",
    translation: "Trước khi mở van, cần kiểm tra áp suất trước, đúng không?",
    focus: ["Thứ tự thao tác", "Từ vựng an toàn", "Xác nhận lại"],
    exercises: [
      {
        id: "factory-process-1",
        eyebrow: "Hiểu thứ tự",
        prompt: "开阀门之前 mô tả thời điểm nào?",
        options: ["Sau khi mở van", "Trước khi mở van", "Trong lúc đóng van"],
        correctOption: 1,
        explanation: "之前 nghĩa là trước khi; 以后 mới là sau khi.",
      },
      {
        id: "factory-process-2",
        eyebrow: "Chọn thao tác",
        prompt: "检查压力 nghĩa là gì?",
        options: ["Kiểm tra áp suất", "Ghi nhiệt độ", "Đóng nguồn điện"],
        correctOption: 0,
        explanation: "压力 là áp suất; 检查 là kiểm tra.",
      },
      {
        id: "factory-process-3",
        eyebrow: "Xác nhận quy trình",
        prompt: "Câu nào phù hợp khi bạn chưa chắc về thứ tự?",
        options: ["我知道了，不用问。", "要先检查压力，对吗？", "这个步骤可以不做。"],
        correctOption: 1,
        explanation: "Nhắc lại thao tác và thêm 对吗 giúp xác nhận mà không làm gián đoạn giao tiếp.",
      },
    ],
  },
  {
    id: "ban-giao-ca-san-xuat",
    industry: "factory",
    title: "Bàn giao ca sản xuất",
    brief: "Bàn giao sản lượng, lỗi còn theo dõi và vật tư sắp hết.",
    context: "Bạn kết thúc ca và cần báo rằng lô cuối còn chờ kiểm tra chất lượng.",
    durationMinutes: 10,
    level: "Nâng cao",
    isFree: false,
    sentenceZh: "最后一批还在等质检，结果出来后请记录一下。",
    pinyin: "Zuìhòu yì pī hái zài děng zhìjiǎn, jiéguǒ chūlái hòu qǐng jìlù yíxià.",
    translation: "Lô cuối vẫn đang chờ kiểm tra chất lượng, khi có kết quả vui lòng ghi lại.",
    focus: ["Bàn giao lô hàng", "Nhắc việc còn mở", "Yêu cầu ghi nhận"],
    exercises: [
      {
        id: "factory-handover-1",
        eyebrow: "Nhận diện trạng thái",
        prompt: "还在等质检 cho biết lô hàng đang ở trạng thái nào?",
        options: ["Đã xuất kho", "Vẫn chờ kiểm tra chất lượng", "Đã bị hủy"],
        correctOption: 1,
        explanation: "还在等… cho biết một việc vẫn đang tiếp diễn và chưa hoàn tất.",
      },
      {
        id: "factory-handover-2",
        eyebrow: "Chỉ thời điểm tiếp theo",
        prompt: "结果出来后 nghĩa là gì?",
        options: ["Trước khi có kết quả", "Khi không có kết quả", "Sau khi có kết quả"],
        correctOption: 2,
        explanation: "…后 chỉ thời điểm sau một sự kiện.",
      },
      {
        id: "factory-handover-3",
        eyebrow: "Giao việc rõ ràng",
        prompt: "Câu nào yêu cầu ca sau ghi lại kết quả?",
        options: ["请记录一下结果。", "结果不重要。", "不要看结果。"],
        correctOption: 0,
        explanation: "请 + động từ là cấu trúc giao việc lịch sự và trực tiếp.",
      },
    ],
  },
  {
    id: "kiem-dem-hang-nhap",
    industry: "logistics",
    title: "Kiểm đếm hàng nhập",
    brief: "Đối chiếu số kiện, tình trạng bao bì và biên bản giao nhận.",
    context: "Xe vừa đến kho, số kiện thực nhận ít hơn phiếu giao hai kiện.",
    durationMinutes: 7,
    level: "Thực tế",
    isFree: true,
    sentenceZh: "我们实收四十八箱，比送货单少两箱。",
    pinyin: "Wǒmen shíshōu sìshíbā xiāng, bǐ sònghuòdān shǎo liǎng xiāng.",
    translation: "Chúng tôi thực nhận 48 thùng, ít hơn phiếu giao hàng 2 thùng.",
    focus: ["Số lượng thực nhận", "Đối chiếu chứng từ", "Báo chênh lệch"],
    exercises: [
      {
        id: "warehouse-receive-1",
        eyebrow: "Hiểu số lượng",
        prompt: "实收四十八箱 nghĩa là gì?",
        options: ["Thực nhận 48 thùng", "Dự kiến 48 thùng", "Đã xuất 48 thùng"],
        correctOption: 0,
        explanation: "实收 là số lượng thực tế đã nhận, khác với số trên kế hoạch hoặc chứng từ.",
      },
      {
        id: "warehouse-receive-2",
        eyebrow: "Báo chênh lệch",
        prompt: "Cụm nào nói ít hơn hai thùng?",
        options: ["多两箱", "少两箱", "有两箱"],
        correctOption: 1,
        explanation: "少 là ít/thiếu; 多 là nhiều/thừa.",
      },
      {
        id: "warehouse-receive-3",
        eyebrow: "Đề nghị xử lý",
        prompt: "Câu nào đề nghị kiểm tra lại phiếu giao?",
        options: ["请再核对一下送货单。", "送货单不用看。", "把货退回去。"],
        correctOption: 0,
        explanation: "核对 là đối chiếu, phù hợp trước khi kết luận nguyên nhân chênh lệch.",
      },
    ],
  },
  {
    id: "bao-thieu-hang",
    industry: "logistics",
    title: "Báo thiếu hàng trong kho",
    brief: "Báo mã hàng, số còn lại và thời điểm có thể ảnh hưởng đơn xuất.",
    context: "Một mã vật tư chỉ còn đủ cho đơn sáng nay.",
    durationMinutes: 8,
    level: "Thực tế",
    isFree: false,
    sentenceZh: "这个物料库存不够，只能满足上午的订单。",
    pinyin: "Zhège wùliào kùcún bú gòu, zhǐ néng mǎnzú shàngwǔ de dìngdān.",
    translation: "Tồn kho vật tư này không đủ, chỉ có thể đáp ứng đơn buổi sáng.",
    focus: ["Tình trạng tồn", "Mức ảnh hưởng", "Đề nghị bổ sung"],
    exercises: [
      {
        id: "warehouse-shortage-1",
        eyebrow: "Báo tồn kho",
        prompt: "库存不够 mô tả tình trạng nào?",
        options: ["Tồn kho không đủ", "Tồn kho vừa nhập", "Tồn kho bị khóa"],
        correctOption: 0,
        explanation: "不够 nghĩa là không đủ so với nhu cầu.",
      },
      {
        id: "warehouse-shortage-2",
        eyebrow: "Nêu phạm vi ảnh hưởng",
        prompt: "只能满足上午的订单 nghĩa là gì?",
        options: ["Chỉ đủ đáp ứng đơn buổi sáng", "Không có đơn buổi sáng", "Đủ cho cả ngày"],
        correctOption: 0,
        explanation: "只能 nhấn mạnh giới hạn: chỉ có thể thực hiện trong phạm vi được nêu.",
      },
      {
        id: "warehouse-shortage-3",
        eyebrow: "Đề nghị bổ sung",
        prompt: "Câu nào hỏi thời điểm hàng bổ sung tới kho?",
        options: ["补货什么时候到？", "库存放在哪里？", "订单是谁的？"],
        correctOption: 0,
        explanation: "补货 là bổ sung hàng; 什么时候到 hỏi thời điểm đến.",
      },
    ],
  },
  {
    id: "xac-nhan-lenh-xuat-kho",
    industry: "logistics",
    title: "Xác nhận lệnh xuất kho",
    brief: "Xác nhận mã đơn, số lượng và cửa xuất trước khi đưa hàng ra.",
    context: "Bạn nhận lệnh gấp nhưng trên phiếu chưa ghi rõ cửa xuất.",
    durationMinutes: 6,
    level: "Cơ bản",
    isFree: false,
    sentenceZh: "我再确认一下，这批货从哪个门出库？",
    pinyin: "Wǒ zài quèrèn yíxià, zhè pī huò cóng nǎge mén chūkù?",
    translation: "Tôi xin xác nhận lại, lô hàng này xuất kho qua cửa nào?",
    focus: ["Xác nhận lô", "Hỏi cửa xuất", "Tránh giao nhầm"],
    exercises: [
      {
        id: "warehouse-dispatch-1",
        eyebrow: "Hỏi cửa xuất",
        prompt: "从哪个门出库 hỏi thông tin gì?",
        options: ["Xuất kho qua cửa nào", "Ai nhập kho", "Kho mở lúc nào"],
        correctOption: 0,
        explanation: "哪个门 là cửa nào; 出库 là xuất kho.",
      },
      {
        id: "warehouse-dispatch-2",
        eyebrow: "Xác nhận lại",
        prompt: "Cụm nào giúp lời hỏi mềm và chuyên nghiệp hơn?",
        options: ["不用说", "我再确认一下", "你错了"],
        correctOption: 1,
        explanation: "我再确认一下 cho biết mục đích là kiểm tra lại thông tin, không phải chất vấn.",
      },
      {
        id: "warehouse-dispatch-3",
        eyebrow: "Chốt số lượng",
        prompt: "Bạn muốn xác nhận lô này có 20 kiện. Chọn câu đúng.",
        options: ["这批货一共二十件，对吗？", "这批货已经到了。", "二十件货不需要。"],
        correctOption: 0,
        explanation: "一共 chỉ tổng số lượng; 对吗 dùng để xác nhận lại.",
      },
    ],
  },
  {
    id: "tu-van-nhu-cau",
    industry: "sales",
    title: "Hỏi đúng nhu cầu khách",
    brief: "Làm rõ mục đích sử dụng, số lượng và ưu tiên trước khi giới thiệu.",
    context: "Khách hỏi một sản phẩm nhưng chưa nói rõ dùng cho văn phòng hay nhà xưởng.",
    durationMinutes: 6,
    level: "Cơ bản",
    isFree: true,
    sentenceZh: "请问您主要是在办公室用，还是在车间用？",
    pinyin: "Qǐngwèn nín zhǔyào shì zài bàngōngshì yòng, háishì zài chējiān yòng?",
    translation: "Xin hỏi anh/chị chủ yếu dùng ở văn phòng hay tại xưởng?",
    focus: ["Hỏi mục đích", "Đưa lựa chọn", "Xưng hô lịch sự"],
    exercises: [
      {
        id: "sales-needs-1",
        eyebrow: "Hỏi mục đích dùng",
        prompt: "Câu nào giúp phân biệt nhu cầu văn phòng và nhà xưởng?",
        options: ["您要几个？", "是在办公室用，还是在车间用？", "这个很便宜。"],
        correctOption: 1,
        explanation: "Mẫu 是…还是…? đưa ra hai bối cảnh rõ để khách trả lời dễ hơn.",
      },
      {
        id: "sales-needs-2",
        eyebrow: "Giữ giọng lịch sự",
        prompt: "Trong giao tiếp với khách, 您 khác 你 ở điểm nào?",
        options: ["Trang trọng và lịch sự hơn", "Mang nghĩa số nhiều", "Chỉ dùng cho đồng nghiệp"],
        correctOption: 0,
        explanation: "您 là cách gọi tôn trọng, phù hợp khi mới gặp hoặc tư vấn khách hàng.",
      },
      {
        id: "sales-needs-3",
        eyebrow: "Hỏi số lượng",
        prompt: "Câu nào hỏi số lượng dự kiến?",
        options: ["您预计需要多少？", "您什么时候来？", "您喜欢什么颜色？"],
        correctOption: 0,
        explanation: "预计需要多少 hỏi lượng dự kiến để chuẩn bị báo giá hoặc tồn kho.",
      },
    ],
  },
  {
    id: "gui-bao-gia",
    industry: "sales",
    title: "Gửi và giải thích báo giá",
    brief: "Giới thiệu phạm vi giá, thời hạn hiệu lực và phần chưa bao gồm.",
    context: "Bạn vừa gửi báo giá và cần nhắc khách mức giá chưa bao gồm vận chuyển.",
    durationMinutes: 8,
    level: "Thực tế",
    isFree: false,
    sentenceZh: "报价已经发给您了，这个价格还不含运费。",
    pinyin: "Bàojià yǐjīng fā gěi nín le, zhège jiàgé hái bù hán yùnfèi.",
    translation: "Báo giá đã được gửi cho anh/chị, mức giá này chưa bao gồm phí vận chuyển.",
    focus: ["Xác nhận đã gửi", "Nêu phần chưa gồm", "Chốt hiệu lực"],
    exercises: [
      {
        id: "sales-quote-1",
        eyebrow: "Xác nhận đã gửi",
        prompt: "报价已经发给您了 nghĩa là gì?",
        options: ["Báo giá đã gửi cho anh/chị", "Báo giá đang được sửa", "Báo giá đã hết hạn"],
        correctOption: 0,
        explanation: "已经…了 diễn tả hành động đã hoàn tất.",
      },
      {
        id: "sales-quote-2",
        eyebrow: "Nêu chi phí chưa gồm",
        prompt: "不含运费 nghĩa là gì?",
        options: ["Đã miễn phí vận chuyển", "Chưa gồm phí vận chuyển", "Chỉ gồm phí vận chuyển"],
        correctOption: 1,
        explanation: "不含 là không bao gồm; 运费 là phí vận chuyển.",
      },
      {
        id: "sales-quote-3",
        eyebrow: "Chốt thời hạn",
        prompt: "Câu nào nói báo giá có hiệu lực trong 7 ngày?",
        options: ["报价七天后再发。", "这份报价七天内有效。", "报价已经用了七天。"],
        correctOption: 1,
        explanation: "…内有效 nghĩa là có hiệu lực trong khoảng thời gian được nêu.",
      },
    ],
  },
  {
    id: "xu-ly-khieu-nai",
    industry: "sales",
    title: "Xử lý khi khách phàn nàn",
    brief: "Ghi nhận vấn đề, xin thông tin kiểm tra và hẹn thời điểm phản hồi.",
    context: "Khách báo sản phẩm vừa nhận không đúng mẫu đã đặt.",
    durationMinutes: 10,
    level: "Nâng cao",
    isFree: false,
    sentenceZh: "很抱歉给您带来不便，我马上核实订单。",
    pinyin: "Hěn bàoqiàn gěi nín dàilái búbiàn, wǒ mǎshàng héshí dìngdān.",
    translation: "Rất xin lỗi vì đã gây bất tiện, tôi sẽ kiểm tra đơn hàng ngay.",
    focus: ["Ghi nhận bất tiện", "Không tranh luận", "Hẹn phản hồi"],
    exercises: [
      {
        id: "sales-complaint-1",
        eyebrow: "Mở đầu phản hồi",
        prompt: "Câu nào ghi nhận bất tiện của khách mà chưa vội kết luận lỗi?",
        options: ["这不是我们的问题。", "很抱歉给您带来不便。", "您应该再看一次。"],
        correctOption: 1,
        explanation: "Câu xin lỗi vì sự bất tiện thể hiện lắng nghe mà chưa đổ lỗi cho bất kỳ bên nào.",
      },
      {
        id: "sales-complaint-2",
        eyebrow: "Báo hành động tiếp theo",
        prompt: "我马上核实订单 cho khách biết điều gì?",
        options: ["Sẽ kiểm tra đơn ngay", "Sẽ hủy đơn ngay", "Sẽ gửi đơn mới ngay"],
        correctOption: 0,
        explanation: "核实 là xác minh thông tin; 马上 là ngay lập tức.",
      },
      {
        id: "sales-complaint-3",
        eyebrow: "Hẹn phản hồi",
        prompt: "Câu nào có mốc phản hồi rõ ràng?",
        options: ["有结果再说。", "我今天四点前给您回复。", "请您等一下。"],
        correctOption: 1,
        explanation: "Một mốc giờ cụ thể giúp khách biết khi nào sẽ nhận được cập nhật.",
      },
    ],
  },
  {
    id: "don-khach-dat-ban",
    industry: "restaurant",
    title: "Đón khách đã đặt bàn",
    brief: "Xác nhận tên, thời gian và số người trước khi dẫn khách vào bàn.",
    context: "Một nhóm bốn người đến lúc 7 giờ tối và cho biết đã đặt bàn trước.",
    durationMinutes: 6,
    level: "Cơ bản",
    isFree: true,
    sentenceZh: "请问预订姓名和时间是？我来为您确认。",
    pinyin: "Qǐngwèn yùdìng xìngmíng hé shíjiān shì? Wǒ lái wèi nín quèrèn.",
    translation: "Xin hỏi tên và thời gian đặt bàn là gì? Tôi sẽ kiểm tra cho anh/chị.",
    focus: ["Chào lịch sự", "Đối chiếu đặt bàn", "Không đọc lộ thông tin"],
    exercises: [
      {
        id: "restaurant-arrival-1",
        eyebrow: "Hỏi thông tin đặt bàn",
        prompt: "Khách nói 我们已经预订了. Câu hỏi tiếp theo phù hợp nhất là gì?",
        options: ["请问预订姓名和时间是？", "您要什么饮料？", "现在可以结账。"],
        correctOption: 0,
        explanation: "Tên và thời gian là hai dữ liệu cơ bản giúp lễ tân tìm đúng lượt đặt bàn.",
      },
      {
        id: "restaurant-arrival-2",
        eyebrow: "Xác nhận số khách",
        prompt: "Câu nào lịch sự để xác nhận nhóm có bốn người?",
        options: ["你们四个。", "一共四位，对吗？", "四个人快点。"],
        correctOption: 1,
        explanation: "位 là lượng từ lịch sự dành cho người; 对吗 giúp xác nhận lại thông tin.",
      },
      {
        id: "restaurant-arrival-3",
        eyebrow: "Dẫn khách vào bàn",
        prompt: "Thông tin đã khớp. Câu nào phù hợp để mời khách đi theo?",
        options: ["请跟我来，我带您入座。", "您自己找座位。", "还没有菜单。"],
        correctOption: 0,
        explanation: "请跟我来 kết hợp 带您入座 thể hiện rõ hành động dẫn khách vào chỗ.",
      },
    ],
  },
  {
    id: "xac-nhan-di-ung-thuc-pham",
    industry: "restaurant",
    title: "Xác nhận yêu cầu dị ứng",
    brief: "Ghi nhận dị nguyên, không tự cam kết và chuyển bếp xác minh theo quy trình.",
    context: "Khách nói bị dị ứng lạc và hỏi liệu một món trong thực đơn có an toàn hay không.",
    durationMinutes: 9,
    level: "Nâng cao",
    isFree: false,
    sentenceZh: "我先记录您的过敏信息，再请厨房按流程确认。",
    pinyin: "Wǒ xiān jìlù nín de guòmǐn xìnxī, zài qǐng chúfáng àn liúchéng quèrèn.",
    translation: "Tôi sẽ ghi nhận thông tin dị ứng trước, rồi nhờ bếp xác minh theo quy trình.",
    focus: ["Hỏi rõ dị nguyên", "Không tự bảo đảm", "Chuyển xác minh cho bếp"],
    exercises: [
      {
        id: "restaurant-allergy-1",
        eyebrow: "Hiểu thông tin nguy cơ",
        prompt: "我对花生过敏 nghĩa là gì?",
        options: ["Tôi không thích lạc", "Tôi dị ứng với lạc", "Tôi muốn thêm lạc"],
        correctOption: 1,
        explanation: "过敏 là dị ứng, khác với sở thích hoặc yêu cầu giảm một nguyên liệu.",
      },
      {
        id: "restaurant-allergy-2",
        eyebrow: "Phản hồi an toàn",
        prompt: "Khi chưa xác minh công thức, câu nào phù hợp nhất?",
        options: ["这个菜绝对安全。", "我需要请厨房按流程确认。", "您先吃一点试试。"],
        correctOption: 1,
        explanation: "Nhân viên cần chuyển bếp/quản lý xác minh theo SOP, không tự đưa ra bảo đảm tuyệt đối.",
      },
      {
        id: "restaurant-allergy-3",
        eyebrow: "Ghi chú và chuyển thông tin",
        prompt: "Ngoài ghi chú trên đơn, bước quan trọng nào vẫn cần thực hiện?",
        options: ["Báo trực tiếp theo quy trình dị ứng của nhà hàng", "Chỉ nói lại với khách", "Xóa nguyên liệu khỏi tên món"],
        correctOption: 0,
        explanation: "Ghi chú điện tử không thay thế việc chuyển thông tin dị ứng theo quy trình an toàn thực phẩm.",
      },
    ],
  },
  {
    id: "xu-ly-mon-cham-va-len-nham",
    industry: "restaurant",
    title: "Xử lý món chậm và lên nhầm",
    brief: "Xin lỗi, đối chiếu đơn và báo thời điểm cập nhật sau khi xác minh với bếp.",
    context: "Khách đã chờ 30 phút, còn một món chưa lên và một món khác được mang nhầm bàn.",
    durationMinutes: 10,
    level: "Thực tế",
    isFree: false,
    sentenceZh: "很抱歉让您久等，我先核对订单并向厨房确认。",
    pinyin: "Hěn bàoqiàn ràng nín jiǔděng, wǒ xiān héduì dìngdān bìng xiàng chúfáng quèrèn.",
    translation: "Rất xin lỗi vì để anh/chị chờ lâu, tôi sẽ đối chiếu đơn và xác nhận với bếp trước.",
    focus: ["Ghi nhận thời gian chờ", "Không đổ lỗi", "Hẹn mốc cập nhật"],
    exercises: [
      {
        id: "restaurant-delay-1",
        eyebrow: "Mở đầu phản hồi",
        prompt: "Câu nào ghi nhận việc khách đã chờ lâu?",
        options: ["很抱歉让您久等。", "菜还没好。", "您再等吧。"],
        correctOption: 0,
        explanation: "很抱歉让您久等 là cách lịch sự ghi nhận thời gian khách đã phải chờ.",
      },
      {
        id: "restaurant-delay-2",
        eyebrow: "Xử lý món nhầm",
        prompt: "Khách báo món không phải món đã gọi. Bước giao tiếp nào phù hợp?",
        options: ["先核对点菜单，再确认处理方式。", "告诉客人先吃。", "说是厨房的错误。"],
        correctOption: 0,
        explanation: "Đối chiếu đơn trước giúp xác định món, bàn và yêu cầu mà không vội đổ lỗi.",
      },
      {
        id: "restaurant-delay-3",
        eyebrow: "Hẹn cập nhật",
        prompt: "Câu nào cho khách một mốc cập nhật rõ?",
        options: ["有消息再说。", "我五分钟后回来更新出餐时间。", "应该快了。"],
        correctOption: 1,
        explanation: "Một mốc năm phút cụ thể giúp khách biết khi nào sẽ nhận thông tin tiếp theo.",
      },
    ],
  },
  {
    id: "kiem-tra-thong-tin-truoc-khi-dang-ban",
    industry: "ecommerce",
    title: "Kiểm tra sản phẩm trước khi đăng",
    brief: "Đối chiếu danh mục, SKU, tiêu đề và hình ảnh trước khi xuất bản trang sản phẩm.",
    context: "Sản phẩm mới đã nhập đủ dữ liệu nhưng ảnh biến thể màu xanh đang dùng nhầm ảnh màu đen.",
    durationMinutes: 7,
    level: "Cơ bản",
    isFree: true,
    sentenceZh: "我先核对商品信息和变体图，再安排发布。",
    pinyin: "Wǒ xiān héduì shāngpǐn xìnxī hé biàntǐ tú, zài ānpái fābù.",
    translation: "Tôi sẽ đối chiếu thông tin sản phẩm và ảnh biến thể rồi mới xuất bản.",
    focus: ["Đối chiếu dữ liệu", "Phát hiện ảnh sai", "Đăng bán có kiểm duyệt"],
    exercises: [
      {
        id: "ecommerce-listing-1",
        eyebrow: "Nhận diện dữ liệu",
        prompt: "SKU dùng để làm gì trong gian hàng?",
        options: ["Phân biệt từng mặt hàng hoặc biến thể", "Thay cho tên thương hiệu", "Xác nhận hoàn tiền"],
        correctOption: 0,
        explanation: "SKU là mã nhận diện riêng giúp đội ngũ đối chiếu đúng mặt hàng, màu hoặc kích thước.",
      },
      {
        id: "ecommerce-listing-2",
        eyebrow: "Xử lý ảnh sai",
        prompt: "蓝色变体用了黑色商品的图片 nghĩa là gì?",
        options: ["Biến thể xanh đang dùng ảnh sản phẩm đen", "Ảnh xanh có nền đen", "Sản phẩm đen đã hết hàng"],
        correctOption: 0,
        explanation: "用了 diễn tả đã sử dụng; câu này chỉ rõ ảnh và biến thể đang không tương ứng.",
      },
      {
        id: "ecommerce-listing-3",
        eyebrow: "Chốt quy trình",
        prompt: "Câu nào nêu đúng trình tự trước khi xuất bản?",
        options: ["先发布，以后再检查。", "先预览和审核，再发布。", "只检查价格就可以。"],
        correctOption: 1,
        explanation: "Xem trước và kiểm duyệt trước khi đăng giúp phát hiện lỗi hiển thị và nội dung không phù hợp.",
      },
    ],
  },
  {
    id: "hoi-moq-va-lam-ro-bao-gia",
    industry: "ecommerce",
    title: "Hỏi MOQ và làm rõ báo giá",
    brief: "Xác nhận số lượng tối thiểu, giá theo bậc, thuế, vận chuyển và hiệu lực báo giá.",
    context: "Nhà cung cấp gửi một mức đơn giá nhưng chưa nói mức đó áp dụng cho số lượng nào và có gồm phí hay chưa.",
    durationMinutes: 9,
    level: "Nâng cao",
    isFree: false,
    sentenceZh: "请确认起订量、阶梯价，以及报价是否含税含运费。",
    pinyin: "Qǐng quèrèn qǐdìngliàng, jiētī jià, yǐjí bàojià shìfǒu hánshuì hán yùnfèi.",
    translation: "Hãy xác nhận MOQ, giá theo bậc và báo giá có gồm thuế, vận chuyển hay không.",
    focus: ["Hỏi MOQ", "Làm rõ phạm vi giá", "Không tự chốt điều kiện"],
    exercises: [
      {
        id: "ecommerce-quote-1",
        eyebrow: "Hiểu MOQ",
        prompt: "这款产品的起订量是多少？ hỏi điều gì?",
        options: ["Số lượng đặt tối thiểu", "Số hàng đã bán", "Số mẫu bị lỗi"],
        correctOption: 0,
        explanation: "起订量 là số lượng tối thiểu nhà cung cấp chấp nhận cho một đơn hoặc một biến thể.",
      },
      {
        id: "ecommerce-quote-2",
        eyebrow: "Đọc phạm vi giá",
        prompt: "报价不含运费 nghĩa là gì?",
        options: ["Báo giá chưa gồm vận chuyển", "Báo giá miễn phí vận chuyển", "Báo giá chỉ gồm vận chuyển"],
        correctOption: 0,
        explanation: "不含 là không bao gồm; 运费 là phí vận chuyển.",
      },
      {
        id: "ecommerce-quote-3",
        eyebrow: "Giữ đúng thẩm quyền",
        prompt: "Nhà cung cấp yêu cầu trả toàn bộ trước. Câu nào phù hợp nhất?",
        options: ["我现在就付全部货款。", "我会记录条件并提交内部审批。", "付款条件不重要。"],
        correctOption: 1,
        explanation: "Ghi nhận và trình phê duyệt tránh tự cam kết tài chính vượt quyền hoặc bỏ qua kiểm soát đối tác.",
      },
    ],
  },
  {
    id: "xu-ly-don-cham-va-yeu-cau-hoan-tien",
    industry: "ecommerce",
    title: "Xử lý đơn chậm và yêu cầu hoàn tiền",
    brief: "Xác minh vận đơn, giải thích trạng thái và chuyển yêu cầu hậu mãi theo chính sách.",
    context: "Vận đơn chưa cập nhật hai ngày; người mua lo thất lạc và muốn biết có được hoàn tiền ngay không.",
    durationMinutes: 10,
    level: "Thực tế",
    isFree: false,
    sentenceZh: "我先核实物流异常，再按平台政策提交售后申请。",
    pinyin: "Wǒ xiān héshí wùliú yìcháng, zài àn píngtái zhèngcè tíjiāo shòuhòu shēnqǐng.",
    translation: "Tôi sẽ xác minh bất thường vận chuyển rồi gửi yêu cầu hậu mãi theo chính sách nền tảng.",
    focus: ["Xác minh vận đơn", "Không hứa hoàn tiền", "Hẹn mốc phản hồi"],
    exercises: [
      {
        id: "ecommerce-delay-1",
        eyebrow: "Đọc trạng thái",
        prompt: "物流轨迹两天没有更新 nghĩa là gì?",
        options: ["Hành trình vận chuyển chưa cập nhật hai ngày", "Đơn đã giao hai ngày", "Kho đã giữ hàng hai ngày"],
        correctOption: 0,
        explanation: "物流轨迹 là hành trình vận chuyển; 没有更新 cho biết chưa có cập nhật mới.",
      },
      {
        id: "ecommerce-delay-2",
        eyebrow: "Phản hồi có căn cứ",
        prompt: "Khi chưa có kết luận từ đơn vị vận chuyển, câu nào phù hợp?",
        options: ["今天一定送到。", "我先联系承运方核实，四点前回复您。", "包裹肯定丢了。"],
        correctOption: 1,
        explanation: "Câu này nêu hành động xác minh và mốc phản hồi, không đưa cam kết chưa có căn cứ.",
      },
      {
        id: "ecommerce-delay-3",
        eyebrow: "Xử lý yêu cầu hoàn tiền",
        prompt: "Người mua yêu cầu hoàn tiền ngay. Nhân viên nên làm gì?",
        options: ["Tự hoàn ngoài hệ thống", "Nêu trạng thái và gửi yêu cầu theo chính sách nền tảng", "Yêu cầu người mua xóa đánh giá trước"],
        correctOption: 1,
        explanation: "Hoàn tiền cần đi đúng luồng, quyền phê duyệt và chính sách bảo vệ giao dịch của nền tảng.",
      },
    ],
  },
  {
    id: "xin-nhac-lai-va-xac-nhan-yeu-cau",
    industry: "core",
    title: "Nghe lại và xác nhận yêu cầu",
    brief: "Xin lặp lại phần chưa rõ, sau đó nói lại cách hiểu trước khi bắt đầu làm.",
    context: "Môi trường làm việc khá ồn; bạn nghe được hạn chót nhưng chưa chắc đầu ra cần nộp dưới dạng nào.",
    durationMinutes: 6,
    level: "Cơ bản",
    isFree: true,
    sentenceZh: "不好意思，请再说一遍。我的理解是周五前提交表格，对吗？",
    pinyin: "Bù hǎoyìsi, qǐng zài shuō yí biàn. Wǒ de lǐjiě shì Zhōuwǔ qián tíjiāo biǎogé, duì ma?",
    translation: "Xin lỗi, hãy nói lại một lần. Theo cách tôi hiểu là nộp bảng trước thứ Sáu, đúng không?",
    focus: ["Báo chưa nghe rõ", "Nhắc lại ý hiểu", "Xác nhận đầu ra và hạn"],
    exercises: [
      {
        id: "core-confirm-1",
        eyebrow: "Xin nghe lại",
        prompt: "Khi chưa nghe rõ vì tiếng ồn, câu nào phù hợp?",
        options: ["不好意思，请再说一遍。", "我都听懂了。", "不用说了。"],
        correctOption: 0,
        explanation: "Câu này lịch sự báo cần nghe lại, tránh giả vờ hiểu một thông tin có thể ảnh hưởng công việc.",
      },
      {
        id: "core-confirm-2",
        eyebrow: "Phân biệt ý nghĩa",
        prompt: "没听清 khác 没听懂 ở điểm nào?",
        options: ["Chưa nghe rõ âm thanh và chưa hiểu nghĩa", "Một câu dùng quá khứ, một câu dùng tương lai", "Không có khác biệt"],
        correctOption: 0,
        explanation: "没听清 liên quan độ rõ của âm thanh; 没听懂 cho biết đã nghe nhưng chưa hiểu nội dung.",
      },
      {
        id: "core-confirm-3",
        eyebrow: "Nói lại ý hiểu",
        prompt: "Cấu trúc nào giúp xác nhận cả đầu ra và hạn chót?",
        options: ["我的理解是周五前提交表格，对吗？", "以后再看吧。", "这个不重要。"],
        correctOption: 0,
        explanation: "Câu này nhắc lại định dạng bảng và mốc thứ Sáu, giúp đối phương sửa ngay nếu có điểm sai.",
      },
    ],
  },
  {
    id: "xac-nhan-uu-tien-khi-hai-viec-cung-gap",
    industry: "core",
    title: "Xác nhận ưu tiên khi hai việc cùng gấp",
    brief: "Nêu xung đột và ảnh hưởng, sau đó nhờ người phụ trách xác nhận thứ tự xử lý.",
    context: "Hai bộ phận gửi hai yêu cầu đều ghi khẩn, cùng hạn 4 giờ chiều và mỗi việc cần khoảng ba giờ.",
    durationMinutes: 9,
    level: "Nâng cao",
    isFree: false,
    sentenceZh: "两个任务的时间有冲突，请确认哪个优先。",
    pinyin: "Liǎng ge rènwu de shíjiān yǒu chōngtū, qǐng quèrèn nǎge yōuxiān.",
    translation: "Thời gian hai nhiệm vụ bị xung đột, hãy xác nhận việc nào ưu tiên.",
    focus: ["Nêu xung đột", "Báo ảnh hưởng", "Không tự đoán ưu tiên"],
    exercises: [
      {
        id: "core-priority-1",
        eyebrow: "Phân biệt mức độ",
        prompt: "紧急 và 重要 khác nhau thế nào?",
        options: ["Khẩn về thời gian và quan trọng về mức ảnh hưởng", "Một từ dùng cho người, một từ dùng cho vật", "Hoàn toàn giống nhau"],
        correctOption: 0,
        explanation: "Một việc có thể khẩn nhưng ảnh hưởng thấp, hoặc quan trọng nhưng chưa cần xử lý ngay.",
      },
      {
        id: "core-priority-2",
        eyebrow: "Nêu hệ quả",
        prompt: "Câu nào giúp người quyết định hiểu ảnh hưởng?",
        options: ["如果先做A，B可能会晚两个小时。", "两个都很麻烦。", "我不想做。"],
        correctOption: 0,
        explanation: "Câu này nêu lựa chọn và mức chậm dự kiến cụ thể để người phụ trách cân nhắc.",
      },
      {
        id: "core-priority-3",
        eyebrow: "Xin quyết định",
        prompt: "Khi không có quyền đổi ưu tiên, nên nói gì?",
        options: ["请负责人确认优先顺序。", "我随便选一个。", "两个任务都取消。"],
        correctOption: 0,
        explanation: "Chuyển người có trách nhiệm xác nhận giúp tránh tự thay đổi cam kết giữa các bộ phận.",
      },
    ],
  },
  {
    id: "bao-loi-va-de-xuat-khac-phuc",
    industry: "core",
    title: "Báo lỗi và đề xuất khắc phục",
    brief: "Nhận lỗi cụ thể, báo ảnh hưởng, sửa ngay và đưa biện pháp ngăn tái diễn.",
    context: "Bạn vừa gửi nhầm phiên bản cũ của tài liệu cho nhóm khách hàng và phát hiện sau 10 phút.",
    durationMinutes: 10,
    level: "Thực tế",
    isFree: false,
    sentenceZh: "很抱歉，我发错文件了，现在马上更正并说明影响。",
    pinyin: "Hěn bàoqiàn, wǒ fācuò wénjiàn le, xiànzài mǎshàng gēngzhèng bìng shuōmíng yǐngxiǎng.",
    translation: "Rất xin lỗi, tôi đã gửi nhầm tệp; tôi sẽ sửa ngay và nêu rõ ảnh hưởng.",
    focus: ["Nhận lỗi cụ thể", "Khắc phục ngay", "Ngăn lỗi lặp lại"],
    exercises: [
      {
        id: "core-mistake-1",
        eyebrow: "Nhận lỗi",
        prompt: "Câu nào nhận đúng lỗi mà không đổ trách nhiệm?",
        options: ["很抱歉，我发错文件了。", "系统让我发错了。", "别人也会犯错。"],
        correctOption: 0,
        explanation: "Câu này nêu rõ hành động sai và thể hiện trách nhiệm của người gửi.",
      },
      {
        id: "core-mistake-2",
        eyebrow: "Nêu hành động",
        prompt: "Sau lời xin lỗi, thông tin nào quan trọng nhất?",
        options: ["Tệp đúng, ảnh hưởng hiện tại và hành động khắc phục", "Lý do cá nhân không liên quan", "Một lời hứa không có thời hạn"],
        correctOption: 0,
        explanation: "Người nhận cần biết dùng tệp nào, sai sót ảnh hưởng ra sao và việc gì đang được thực hiện.",
      },
      {
        id: "core-mistake-3",
        eyebrow: "Ngăn tái diễn",
        prompt: "Câu nào nêu biện pháp phòng ngừa cụ thể?",
        options: ["以后再小心一点。", "以后发送前会核对版本号和收件人。", "应该不会再发生。"],
        correctOption: 1,
        explanation: "Đối chiếu phiên bản và người nhận là hai bước kiểm soát cụ thể có thể thực hiện trước khi gửi.",
      },
    ],
  },
];

export function findPracticeScenario(id: string): PracticeScenario | null {
  return practiceScenarios.find((scenario) => scenario.id === id) ?? null;
}
