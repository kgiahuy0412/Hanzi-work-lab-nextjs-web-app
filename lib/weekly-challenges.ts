export type WeeklyChallenge = {
  title: string;
  situation: string;
  task: string;
  keyPhrase: string;
  courseSlug: string;
  lessonSlug: string;
};

const officeWeeklyChallenges: Omit<WeeklyChallenge, "courseSlug">[] = [
  { title: "Làm rõ một yêu cầu mơ hồ", situation: "Quản lý nhờ bạn ‘chuẩn bị tài liệu’ nhưng chưa nói định dạng và hạn chót.", task: "Viết hoặc nói hai câu để hỏi lại phạm vi và thời gian hoàn thành.", keyPhrase: "请问具体要求和截止日期是什么？", lessonSlug: "lam-ro-yeu-cau-cong-viec" },
  { title: "Báo trễ có phương án", situation: "Dữ liệu đầu vào đến muộn khiến báo cáo không thể hoàn thành trong hôm nay.", task: "Nêu nguyên nhân, mốc dự kiến mới và cách bạn sẽ khắc phục.", keyPhrase: "因为数据来晚了，预计明天下午完成。", lessonSlug: "bao-tre-va-xin-gia-han" },
  { title: "Chốt việc sau cuộc họp", situation: "Cuộc họp đã thống nhất thử nghiệm nhưng chưa ai ghi người phụ trách.", task: "Xác nhận hành động, người phụ trách và thời hạn trong một câu.", keyPhrase: "请确认行动项、负责人和期限。", lessonSlug: "ghi-nhan-quyet-dinh-va-hanh-dong" },
  { title: "Trình bày xu hướng", situation: "Doanh số tăng 10% so với cùng kỳ nhưng đơn hàng giảm nhẹ so với tháng trước.", task: "Tóm tắt hai thay đổi mà không chỉ đọc từng con số.", keyPhrase: "销售额同比增长，订单量环比有所下降。", lessonSlug: "bao-cao-so-lieu-va-xu-huong" },
  { title: "Đón một vị khách có hẹn", situation: "Khách đến gặp quản lý kinh doanh lúc 10 giờ và đang chờ ở lễ tân.", task: "Xác nhận lịch hẹn rồi hướng dẫn khách đăng ký.", keyPhrase: "请问您有预约吗？请先在前台登记。", lessonSlug: "don-tiep-doi-tac-va-khach-den" },
  { title: "Xử lý hiểu lầm", situation: "Đồng nghiệp gửi nhầm toàn bộ tài liệu vì hai bên hiểu khác yêu cầu.", task: "Làm dịu tình huống và đề nghị xác nhận lại yêu cầu.", keyPhrase: "可能是我表达得不够清楚，我们再确认一次。", lessonSlug: "xu-ly-hieu-lam-trong-cong-viec" },
  { title: "Điều phối hai việc khẩn", situation: "Hai nhiệm vụ cùng được đánh dấu khẩn và có cùng hạn hoàn thành.", task: "Hỏi lại mức ưu tiên và nói rõ ảnh hưởng đến kế hoạch hiện tại.", keyPhrase: "需要重新确认优先级，这会影响原来的进度。", lessonSlug: "kiem-tra-phoi-hop-cong-viec" },
  { title: "Chuẩn bị một cuộc họp ngắn", situation: "Ngày mai nhóm có 30 phút để quyết định phương án triển khai.", task: "Nêu mục tiêu, tài liệu cần gửi trước và nội dung phải chốt.", keyPhrase: "请提前发送材料，并确认会议目标。", lessonSlug: "chuan-bi-cuoc-hop" },
];

const factoryWeeklyChallenges: Omit<WeeklyChallenge, "courseSlug">[] = [
  { title: "Báo tiếng máy bất thường", situation: "Máy đóng gói số 2 phát ra tiếng lạ và nhiệt độ động cơ tăng.", task: "Nêu đúng thiết bị, hiện tượng và hành động an toàn đã thực hiện.", keyPhrase: "二号包装机有异常声音，我已经按规程停机。", lessonSlug: "bao-may-bat-thuong-va-dung-may" },
  { title: "Xác nhận SOP trước khi làm", situation: "Bạn lần đầu vận hành một công đoạn có van và đồng hồ áp suất.", task: "Hỏi lại thứ tự kiểm tra trước khi mở van.", keyPhrase: "开阀门之前，要先检查压力，对吗？", lessonSlug: "xac-nhan-quy-trinh-van-hanh" },
  { title: "Báo thiếu vật liệu", situation: "Vật liệu còn lại chỉ đủ chạy lệnh hiện tại và có thể ảnh hưởng lệnh tiếp theo.", task: "Báo lượng còn lại, phạm vi ảnh hưởng và yêu cầu bổ sung.", keyPhrase: "材料余量不够，可能影响下一张工单。", lessonSlug: "cap-va-kiem-tra-nguyen-vat-lieu" },
  { title: "Cập nhật sản lượng giữa ca", situation: "Ca đã hoàn thành 800/1.000 sản phẩm nhưng chậm 20 phút vì chờ liệu.", task: "Báo số lượng, tỷ lệ và mốc cập nhật tiếp theo.", keyPhrase: "目前完成率是百分之八十，两点再次汇报。", lessonSlug: "bao-tien-do-va-san-luong" },
  { title: "Cách ly một lô không đạt", situation: "Kiểm tra phát hiện lô có lỗi bề mặt và chưa có quyết định xử lý.", task: "Nêu trạng thái, khu vực cách ly và điều kiện trước khi cho lưu chuyển.", keyPhrase: "这批产品处于待判状态，先移到隔离区。", lessonSlug: "cach-ly-hang-khong-dat" },
  { title: "Truy xuất lỗi lặp lại", situation: "Cùng một vết xước xuất hiện trong ba lô liên tiếp.", task: "Báo xu hướng, ghi số lô và đề nghị truy xuất.", keyPhrase: "同样的缺陷重复发生，需要记录批号并追溯。", lessonSlug: "bao-loi-lap-lai-va-truy-xuat" },
  { title: "Bàn giao việc còn mở", situation: "Cuối ca còn một lô dở dang đang chờ kết quả kiểm tra chất lượng.", task: "Bàn giao trạng thái, vị trí và việc ca sau cần theo dõi.", keyPhrase: "还有一批在制品等质检，请下一班继续跟进。", lessonSlug: "ban-giao-ca-san-xuat" },
  { title: "Đề xuất cải tiến nhỏ", situation: "Người vận hành mất thời gian đi lại lấy dụng cụ nhiều lần mỗi ca.", task: "Mô tả lãng phí và đề xuất thử thay đổi vị trí trong một tuần.", keyPhrase: "建议调整工具位置，先试行一周再确认效果。", lessonSlug: "de-xuat-cai-tien-cong-doan" },
];

const logisticsWeeklyChallenges: Omit<WeeklyChallenge, "courseSlug">[] = [
  { title: "Xác nhận chênh lệch khi nhận hàng", situation: "Phiếu giao ghi 120 kiện nhưng kho chỉ kiểm đếm được 118 kiện.", task: "Nêu số lượng trên chứng từ, số thực nhận và đề nghị bên giao cùng xác nhận.", keyPhrase: "送货单上是一百二十件，实际收到一百一十八件，请一起确认。", lessonSlug: "kiem-dem-so-luong-thuc-nhan" },
  { title: "Báo bao bì bị hỏng", situation: "Hai thùng ở góc pallet bị móp và có dấu hiệu ẩm nhưng hàng chưa được mở kiểm tra.", task: "Mô tả tình trạng, yêu cầu chụp ảnh và tạm thời để riêng lô hàng.", keyPhrase: "有两个箱子破损受潮，请先拍照并单独存放。", lessonSlug: "kiem-tra-bao-bi-va-hu-hong" },
  { title: "Xử lý hàng sai vị trí", situation: "Hệ thống hiển thị hàng ở kệ A-03 nhưng nhân viên tìm thấy tại B-08.", task: "Báo vị trí trên hệ thống, vị trí thực tế và đề nghị kiểm tra trước khi cập nhật.", keyPhrase: "系统位置是A-03，实际在B-08，请核对后再更新。", lessonSlug: "xu-ly-chenh-lech-va-sai-vi-tri" },
  { title: "Kiểm tra tồn kho thiếu", situation: "Số lượng khả dụng trên hệ thống là 50 nhưng tại vị trí chỉ còn 46 sản phẩm.", task: "Nêu mức chênh lệch và yêu cầu kiểm tra giao dịch nhập xuất gần nhất.", keyPhrase: "系统有五十个，现场只有四十六个，请检查最近的出入库记录。", lessonSlug: "cap-nhat-va-kiem-tra-ton-kho" },
  { title: "Chọn đúng lô theo FEFO", situation: "Một đơn hàng có hai lô cùng mã nhưng ngày hết hạn khác nhau.", task: "Xác nhận phải ưu tiên lô hết hạn sớm hơn và đọc lại số lô cần lấy.", keyPhrase: "请按先到期先出，先拣有效期更早的批次。", lessonSlug: "lay-hang-theo-fifo-fefo" },
  { title: "Chặn lỗi trước khi đóng gói", situation: "Khi kiểm tra, bạn phát hiện số lượng đã soạn đúng nhưng mã hàng không khớp đơn.", task: "Yêu cầu dừng đóng gói, nêu mã sai và đề nghị soạn lại đúng đơn.", keyPhrase: "货号不一致，请先停止包装，按订单重新拣货。", lessonSlug: "kiem-tra-va-dong-goi-don-hang" },
  { title: "Báo giao hàng bị chậm", situation: "Xe gặp ùn tắc và dự kiến đến điểm giao muộn hơn kế hoạch 45 phút.", task: "Nêu nguyên nhân, thời gian đến mới và đề nghị thông báo cho bên nhận.", keyPhrase: "因为堵车，预计晚四十五分钟到达，请通知收货方。", lessonSlug: "bao-su-co-van-chuyen" },
  { title: "Tiếp nhận hàng trả về", situation: "Khách trả lại ba kiện do tem ngoài không khớp với đơn giao.", task: "Xác nhận số lượng, lý do trả và đề nghị đưa hàng vào khu chờ kiểm tra.", keyPhrase: "客户退回三件，原因是标签不符，请放到待检区。", lessonSlug: "xu-ly-hang-tra-ve" },
];

const salesWeeklyChallenges: Omit<WeeklyChallenge, "courseSlug">[] = [
  { title: "Làm rõ bối cảnh sử dụng", situation: "Khách hỏi một mẫu sản phẩm nhưng chưa nói sẽ dùng trong văn phòng hay ngoài trời.", task: "Hỏi mục đích, môi trường và người sử dụng trước khi đề xuất.", keyPhrase: "请问主要用在什么场景，是室内还是户外？", lessonSlug: "hoi-muc-dich-va-boi-canh-su-dung" },
  { title: "So sánh hai lựa chọn", situation: "Khách phân vân giữa mẫu giá thấp và mẫu bền hơn, trong khi ngân sách có giới hạn.", task: "So sánh theo giá, độ bền và bối cảnh sử dụng rồi nêu lý do đề xuất.", keyPhrase: "根据您的预算和使用环境，我更推荐第二个型号。", lessonSlug: "so-sanh-va-de-xuat-lua-chon" },
  { title: "Giải thích phạm vi báo giá", situation: "Khách cho rằng tổng giá đã gồm vận chuyển nhưng báo giá chỉ gồm sản phẩm và thuế.", task: "Làm rõ từng khoản đã gồm, chưa gồm và căn cứ trên báo giá chính thức.", keyPhrase: "这份报价含税，但不含运费，请您确认。", lessonSlug: "giai-thich-gia-va-pham-vi" },
  { title: "Phản hồi yêu cầu giảm giá", situation: "Khách muốn giảm thêm 8% nhưng mức này vượt quyền quyết định của bạn.", task: "Xác nhận số lượng, nêu điều kiện và báo rằng mức giá cần được phê duyệt.", keyPhrase: "我先确认采购数量，再按政策申请折扣。", lessonSlug: "thuong-luong-chiet-khau-va-dieu-kien" },
  { title: "Cập nhật đơn có nguy cơ chậm", situation: "Đơn mới hoàn thành 80% và có thể gửi muộn hơn kế hoạch một ngày.", task: "Báo trạng thái, mức chậm dự kiến và thời điểm cập nhật tiếp theo.", keyPhrase: "目前完成了百分之八十，预计延迟一天，今天四点再更新。", lessonSlug: "cap-nhat-tien-do-chuan-bi-hang" },
  { title: "Xác nhận thay đổi đơn", situation: "Khách muốn tăng 20 sản phẩm và đổi địa chỉ giao sau khi đơn đã được xác nhận.", task: "Nhắc lại thay đổi và báo ảnh hưởng đến giá, thời gian giao trước khi sửa.", keyPhrase: "请书面确认变更，我们会重新核对价格和交期。", lessonSlug: "xu-ly-thay-doi-don-hang" },
  { title: "Tiếp nhận khiếu nại sai mẫu", situation: "Khách bức xúc vì sản phẩm nhận được không khớp mẫu trên đơn hàng.", task: "Xin lỗi vì bất tiện, xin mã đơn và hẹn thời điểm phản hồi sau khi xác minh.", keyPhrase: "很抱歉给您带来不便，我马上核实订单，四点前回复您。", lessonSlug: "xin-loi-va-xac-minh-thong-tin" },
  { title: "Giải thích quy trình đổi hàng", situation: "Khách muốn đổi ngay sản phẩm nhưng bạn chưa xác minh thời hạn bảo hành và điều kiện đổi.", task: "Tiếp nhận yêu cầu, nêu bước kiểm tra và tránh tự ý cam kết kết quả.", keyPhrase: "我先核对保修期和换货条件，再给您明确回复。", lessonSlug: "xu-ly-doi-tra-va-bao-hanh" },
];

const restaurantWeeklyChallenges: Omit<WeeklyChallenge, "courseSlug">[] = [
  { title: "Xác nhận một lượt đặt bàn", situation: "Nhóm bốn khách đến lúc 7 giờ và nói đã đặt trước nhưng chưa đưa thông tin.", task: "Hỏi tên, thời gian và số người rồi xác nhận trước khi dẫn bàn.", keyPhrase: "请问预订姓名、时间和人数是？我来为您确认。", lessonSlug: "kiem-tra-thong-tin-dat-ban" },
  { title: "Báo thời gian chờ", situation: "Nhà hàng kín bàn và thời gian chờ hiện ước tính khoảng 20 phút.", task: "Báo đây là thời gian dự kiến, cấp số và giải thích cách gọi khi có bàn.", keyPhrase: "预计要等二十分钟，我先为您排号，有空位马上通知您。", lessonSlug: "huong-dan-cho-va-xep-so" },
  { title: "Ghi nhận dị ứng thực phẩm", situation: "Khách nói dị ứng lạc và hỏi một món có thể ăn được không.", task: "Ghi nhận dị nguyên, tránh tự cam kết và chuyển bếp/quản lý xác minh theo SOP.", keyPhrase: "我先记录您的过敏信息，再请厨房按流程确认。", lessonSlug: "hoi-khau-vi-di-ung-va-kieng-an" },
  { title: "Đề xuất món thay thế", situation: "Món đặc trưng khách vừa chọn đã bán hết trong ngày.", task: "Xin lỗi, nói rõ trạng thái và đề xuất một món có khẩu vị tương tự.", keyPhrase: "这道菜今天售罄了，我可以为您推荐口味类似的菜。", lessonSlug: "bao-het-mon-va-de-xuat-thay-the" },
  { title: "Xử lý món bị bỏ sót", situation: "Khách nói còn một món chưa lên trong khi các bàn đến sau đã nhận món.", task: "Xin lỗi, đối chiếu phiếu gọi món và hẹn mốc cập nhật sau khi hỏi bếp.", keyPhrase: "很抱歉，我先核对点菜单，并向厨房确认出餐时间。", lessonSlug: "xu-ly-thieu-mon-va-len-nham" },
  { title: "Cảnh báo sàn trơn", situation: "Một cốc bị vỡ và nước đổ ở lối đi cạnh bàn khách.", task: "Cảnh báo trực tiếp, hướng dẫn đi vòng và gọi xử lý theo quy trình an toàn.", keyPhrase: "地面湿滑，还有玻璃碎片，请绕行并注意安全。", lessonSlug: "xu-ly-do-vo-va-san-tron" },
  { title: "Giải thích hóa đơn", situation: "Khách thắc mắc vì tổng tiền có thêm một khoản phí dịch vụ.", task: "Mời khách đối chiếu chi tiết và giải thích theo hóa đơn của hệ thống.", keyPhrase: "请核对账单明细，合计金额里包含服务费。", lessonSlug: "kiem-tra-hoa-don-va-thanh-toan" },
  { title: "Chuyển yêu cầu hoàn tiền", situation: "Khách không hài lòng và yêu cầu hoàn tiền, nhưng việc này vượt thẩm quyền của bạn.", task: "Ghi nhận bất tiện, xác minh sự việc và mời quản lý trực ca xử lý.", keyPhrase: "我先核实情况，再请值班经理按政策处理。", lessonSlug: "tiep-nhan-khieu-nai-va-chuyen-quan-ly" },
];

const ecommerceWeeklyChallenges: Omit<WeeklyChallenge, "courseSlug">[] = [
  { title: "Rút gọn tiêu đề sản phẩm", situation: "Tiêu đề mới quá dài, lặp từ khóa và có một công dụng chưa được xác minh.", task: "Giữ tên sản phẩm, thuộc tính chính và một điểm bán có căn cứ; đề nghị kiểm tra quy định nền tảng.", keyPhrase: "我会保留品名和主要卖点，并检查平台规则。", lessonSlug: "viet-tieu-de-va-tu-khoa" },
  { title: "Sửa ảnh biến thể bị nhầm", situation: "Biến thể màu xanh đang hiển thị ảnh của sản phẩm màu đen.", task: "Nêu lỗi, đề nghị ghép lại đúng ảnh và kiểm tra toàn bộ biến thể trước khi đăng.", keyPhrase: "蓝色变体图片不对应，我会重新核对后再发布。", lessonSlug: "quan-ly-hinh-anh-va-bien-the" },
  { title: "Hỏi điều kiện cho lô thử", situation: "Bạn muốn đặt lô nhỏ gồm ba màu nhưng nhà cung cấp chỉ gửi một mức giá.", task: "Hỏi MOQ, khả năng gộp màu và giá theo bậc số lượng.", keyPhrase: "请确认起订量、混批条件和阶梯价。", lessonSlug: "hoi-moq-va-bac-so-luong" },
  { title: "Yêu cầu mẫu có tiêu chuẩn", situation: "Đội ngũ cần đánh giá mẫu trước khi quyết định sản xuất lô lớn.", task: "Nêu quy cách, số lượng, tiêu chuẩn kiểm và thời gian gửi mẫu.", keyPhrase: "请按确认的规格寄样，并说明样品费和寄样时间。", lessonSlug: "yeu-cau-mau-va-kiem-mau" },
  { title: "Làm rõ báo giá chưa đầy đủ", situation: "Báo giá chưa nói đơn giá ứng với số lượng nào, có gồm thuế và vận chuyển hay không.", task: "Yêu cầu bổ sung phạm vi giá, chi phí và thời hạn hiệu lực.", keyPhrase: "请补充单价对应的数量、费用明细和报价有效期。", lessonSlug: "doc-bao-gia-va-chi-phi" },
  { title: "Chặn nguy cơ bán vượt tồn", situation: "Gian hàng hiển thị 20 sản phẩm nhưng kho thực tế chỉ còn 12.", task: "Nêu chênh lệch, tạm dừng bán và đề nghị kiểm tra bản ghi đồng bộ.", keyPhrase: "平台显示二十件，实际只有十二件，请先暂停销售并核对记录。", lessonSlug: "dong-bo-ton-kho-va-canh-bao-het-hang" },
  { title: "Cập nhật vận đơn bất thường", situation: "Hành trình vận chuyển không cập nhật hai ngày và người mua đang hỏi mốc giao.", task: "Xác minh với đơn vị vận chuyển và hẹn một mốc phản hồi có thể kiểm soát.", keyPhrase: "我先联系承运方核实，今天四点前回复您。", lessonSlug: "theo-doi-van-don-va-bao-cham" },
  { title: "Giải thích trạng thái hoàn tiền", situation: "Yêu cầu hậu mãi đang được xét và người mua muốn biết khi nào nhận lại tiền.", task: "Nêu trạng thái, phương thức hoàn và thời hạn dự kiến theo thông tin nền tảng.", keyPhrase: "申请正在审核中，款项会按平台显示的时限原路退回。", lessonSlug: "xu-ly-tra-hang-va-hoan-tien" },
];

const coreWorkplaceWeeklyChallenges: Omit<WeeklyChallenge, "courseSlug">[] = [
  { title: "Xin nhắc lại trong môi trường ồn", situation: "Bạn không nghe rõ câu cuối của hướng dẫn tại khu vực có nhiều tiếng máy.", task: "Báo chưa nghe rõ và nhờ đối phương lặp lại chậm hơn.", keyPhrase: "不好意思，刚才我没听清，请慢一点再说一遍。", lessonSlug: "xin-nhac-lai-va-noi-cham-hon" },
  { title: "Xác nhận lại ba bước", situation: "Đồng nghiệp vừa hướng dẫn ba bước bằng lời và bạn muốn chắc mình hiểu đúng thứ tự.", task: "Nhắc lại ngắn từng bước rồi hỏi xác nhận.", keyPhrase: "我的理解是先检查、再记录、最后提交，对吗？", lessonSlug: "noi-lai-y-hieu-de-xac-nhan" },
  { title: "Làm rõ một yêu cầu chung chung", situation: "Quản lý nhờ ‘chuẩn bị tài liệu’ nhưng chưa nói ai sẽ dùng và cần định dạng nào.", task: "Hỏi mục tiêu, người sử dụng và dạng đầu ra mong muốn.", keyPhrase: "请问这份材料的用途、使用者和输出形式是什么？", lessonSlug: "hoi-muc-tieu-va-ket-qua-mong-doi" },
  { title: "Chốt thứ tự hai việc gấp", situation: "Hai yêu cầu cùng hạn 4 giờ nhưng tổng thời gian xử lý vượt thời gian còn lại.", task: "Nêu xung đột, ảnh hưởng và đề nghị xác nhận việc ưu tiên.", keyPhrase: "两个任务时间冲突，请确认哪个优先。", lessonSlug: "xac-nhan-muc-do-uu-tien" },
  { title: "Cập nhật tiến độ ba phần", situation: "Nhiệm vụ đã hoàn thành 70%, phần còn lại đang chờ đối chiếu và quản lý cần cập nhật.", task: "Nêu phần đã xong, đang xử lý và mốc cập nhật tiếp theo.", keyPhrase: "目前完成了百分之七十，正在核对剩余部分，三点再次更新。", lessonSlug: "cap-nhat-tien-do-va-phan-tram-hoan-thanh" },
  { title: "Báo một trở ngại có ảnh hưởng", situation: "Dữ liệu đầu vào chưa đến nên bước kiểm tra sau không thể bắt đầu và có nguy cơ trễ.", task: "Nêu trở ngại, phần bị ảnh hưởng và hỗ trợ cần thiết.", keyPhrase: "目前缺少上游数据，后续检查无法开始，需要负责人协助确认。", lessonSlug: "bao-tro-ngai-va-anh-huong" },
  { title: "Sửa một tệp gửi nhầm", situation: "Bạn đã gửi bản cũ cho khách và phát hiện sau 10 phút.", task: "Xin lỗi, gửi bản đúng, nói rõ ảnh hưởng và biện pháp ngăn lặp lại.", keyPhrase: "很抱歉，我发错文件了，现在马上更正。", lessonSlug: "nhan-loi-va-sua-sai" },
  { title: "Bàn giao trước ngày nghỉ", situation: "Ngày mai bạn nghỉ và còn ba việc ở ba trạng thái khác nhau.", task: "Nêu trạng thái, việc tiếp theo, tài liệu, đầu mối và mốc theo dõi.", keyPhrase: "我会列出状态、剩余事项、附件和跟进节点，请确认收到。", lessonSlug: "ban-giao-va-theo-doi-sau-trao-doi" },
];

const weeklyChallenges: WeeklyChallenge[] = [
  ...officeWeeklyChallenges.map((challenge) => ({ ...challenge, courseSlug: "van-phong-hanh-chinh" })),
  ...factoryWeeklyChallenges.map((challenge) => ({ ...challenge, courseSlug: "nha-may-san-xuat" })),
  ...logisticsWeeklyChallenges.map((challenge) => ({ ...challenge, courseSlug: "kho-van-logistics" })),
  ...salesWeeklyChallenges.map((challenge) => ({ ...challenge, courseSlug: "ban-hang-cham-soc-khach-hang" })),
  ...restaurantWeeklyChallenges.map((challenge) => ({ ...challenge, courseSlug: "nha-hang-dich-vu" })),
  ...ecommerceWeeklyChallenges.map((challenge) => ({ ...challenge, courseSlug: "thuong-mai-dien-tu" })),
  ...coreWorkplaceWeeklyChallenges.map((challenge) => ({ ...challenge, courseSlug: "giao-tiep-cong-so" })),
];

function getIsoWeek(date: Date): number {
  const utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utcDate.getUTCFullYear(), 0, 1));
  return Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
}

export function getWeeklyChallenge(date = new Date()): WeeklyChallenge {
  return weeklyChallenges[(getIsoWeek(date) - 1) % weeklyChallenges.length];
}
