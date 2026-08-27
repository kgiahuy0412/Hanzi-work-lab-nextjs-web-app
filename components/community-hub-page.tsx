import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  BookMarked,
  BookOpenText,
  BriefcaseBusiness,
  ChartNoAxesColumnIncreasing,
  GraduationCap,
  Headphones,
  Medal,
  MessagesSquare,
  Newspaper,
  PenTool,
  PlayCircle,
  Quote,
  Search,
  Sparkles,
  Trophy,
  UsersRound,
  WandSparkles,
  Wrench,
} from "lucide-react";
import "@/app/community-hub.css";

export type CommunityPageKind = "stories" | "materials" | "tools" | "leaderboard" | "friends" | "blog";

type CommunityCard = {
  icon: LucideIcon;
  tag: string;
  title: string;
  chinese?: string;
  description: string;
  meta: string[];
  href?: string;
  action?: string;
  sample?: string;
};

type CommunityPageContent = {
  eyebrow: string;
  title: [string, string];
  description: string;
  glyph: string;
  stats: Array<{ value: string; label: string }>;
  sectionEyebrow: string;
  sectionTitle: string;
  sectionDescription: string;
  cards: CommunityCard[];
  routineTitle: string;
  routineDescription: string;
  routine: Array<{ title: string; description: string }>;
  cta: { eyebrow: string; title: string; description: string; href: string; label: string };
};

const contentByKind: Record<CommunityPageKind, CommunityPageContent> = {
  stories: {
    eyebrow: "Truyện song ngữ Himi",
    title: ["Đọc một câu chuyện,", "nhớ thêm một cách nói"],
    description: "Truyện ngắn Trung – Việt theo bối cảnh đời sống và công việc, có pinyin cùng đoạn đọc mẫu để bạn học từ trong ngữ cảnh.",
    glyph: "读",
    stats: [
      { value: "6", label: "truyện mở đầu" },
      { value: "3", label: "mức độ" },
      { value: "中 · Vi", label: "song ngữ" },
    ],
    sectionEyebrow: "Thư viện mở đầu",
    sectionTitle: "Những câu chuyện gần với một ngày đi làm",
    sectionDescription: "Mỗi truyện tập trung vào một tình huống nhỏ để bạn đọc nhanh, hiểu đúng và giữ được cụm từ hữu ích.",
    cards: [
      { icon: BriefcaseBusiness, tag: "Sơ cấp · Công việc", title: "Ca sáng đầu tiên", chinese: "第一次上早班", description: "An đến sớm, chào quản lý và học cách hỏi lịch làm trong ngày đầu nhận việc.", meta: ["5 phút", "8 từ mới"], sample: "安第一次上早班。她对经理说：“早上好，今天我做什么？” — Đây là ca sáng đầu tiên của An. Cô hỏi quản lý hôm nay mình sẽ làm gì." },
      { icon: MessagesSquare, tag: "Sơ cấp · Văn phòng", title: "Cuộc họp lúc chín giờ", chinese: "九点的会议", description: "Một lời nhắc lịch ngắn giúp cả nhóm đến phòng họp đúng giờ và đủ tài liệu.", meta: ["4 phút", "6 mẫu câu"], sample: "会议九点开始，请大家带上资料。— Cuộc họp bắt đầu lúc chín giờ, mọi người nhớ mang theo tài liệu." },
      { icon: BookOpenText, tag: "Trung cấp · Logistics", title: "Một đơn hàng gấp", chinese: "一份加急订单", description: "Kho và bộ phận bán hàng phối hợp xử lý một đơn cần giao trước cuối ngày.", meta: ["7 phút", "10 từ mới"], sample: "这个订单很急，我们下班前要发货。— Đơn hàng này rất gấp, chúng ta phải xuất hàng trước khi tan ca." },
      { icon: Quote, tag: "Sơ cấp · Đời sống", title: "Bữa trưa cùng đồng nghiệp", chinese: "和同事一起吃午饭", description: "Một cuộc trò chuyện nhẹ nhàng về món ăn, khẩu vị và lời mời dùng bữa.", meta: ["5 phút", "Có hội thoại"], sample: "你想吃米饭还是面条？我们一起去吧。— Bạn muốn ăn cơm hay mì? Chúng ta đi cùng nhé." },
      { icon: UsersRound, tag: "Trung cấp · Dịch vụ", title: "Vị khách quay lại", chinese: "回来的客人", description: "Nhân viên nhận ra khách cũ, xác nhận nhu cầu và đề xuất lựa chọn phù hợp hơn.", meta: ["6 phút", "9 cụm từ"], sample: "欢迎您再来。这次还是需要上次的产品吗？— Chào mừng anh/chị quay lại. Lần này vẫn cần sản phẩm như trước phải không ạ?" },
      { icon: Headphones, tag: "Trung cấp · Giao tiếp", title: "Chuyến xe cuối ca", chinese: "下班后的末班车", description: "Hai đồng nghiệp kết thúc ca muộn và cùng tìm cách về nhà an toàn.", meta: ["6 phút", "Luyện phản xạ"], sample: "末班车还有十分钟，我们走快一点吧。— Chuyến cuối còn mười phút nữa, mình đi nhanh hơn một chút nhé." },
    ],
    routineTitle: "Đọc chủ động trong 10 phút",
    routineDescription: "Đừng dịch từng chữ. Hãy đi từ ý chính đến cụm từ rồi mới đọc lại thành tiếng.",
    routine: [
      { title: "Đọc lượt đầu", description: "Chỉ nhìn tiếng Trung và đoán bối cảnh." },
      { title: "Mở bản dịch", description: "Đối chiếu những câu bạn chưa chắc nghĩa." },
      { title: "Đọc thành tiếng", description: "Lặp lại 2–3 cụm có thể dùng ngay." },
    ],
    cta: { eyebrow: "Tiếp tục luyện", title: "Mang cụm từ vừa đọc vào tình huống thật", description: "Kho ca làm giúp bạn nghe, chọn đáp án và phản xạ với đúng ngữ cảnh công việc.", href: "/practice", label: "Mở Kho ca làm" },
  },
  materials: {
    eyebrow: "Tài liệu học tập",
    title: ["Một kệ tài liệu gọn,", "đúng thứ bạn cần"],
    description: "Tổng hợp lộ trình, bài nghe, video và bộ luyện chữ đang có trên Himi để bạn không phải tìm rải rác.",
    glyph: "册",
    stats: [
      { value: "7", label: "lộ trình ngành" },
      { value: "4", label: "định dạng học" },
      { value: "1 nơi", label: "dễ tra cứu" },
    ],
    sectionEyebrow: "Bộ sưu tập",
    sectionTitle: "Chọn tài liệu theo việc bạn muốn cải thiện",
    sectionDescription: "Mỗi bộ dẫn thẳng đến nội dung đang hoạt động trên Himi, không tạo thêm một lớp điều hướng thừa.",
    cards: [
      { icon: GraduationCap, tag: "Theo chuyên ngành", title: "Lộ trình tiếng Trung công việc", description: "Bảy lộ trình từ văn phòng, sản xuất đến bán hàng và thương mại điện tử.", meta: ["7 ngành", "Theo module"], href: "/courses", action: "Xem lộ trình" },
      { icon: PlayCircle, tag: "Học qua ngữ cảnh", title: "Thư viện video", description: "Video tình huống kèm phụ đề, transcript và câu hỏi tương tác.", meta: ["Video ngắn", "Có bài tập"], href: "/videos", action: "Mở thư viện" },
      { icon: Headphones, tag: "Luyện tai", title: "Phòng luyện nghe", description: "Nghe câu theo ngữ cảnh và rèn khả năng bắt âm ở tốc độ phù hợp.", meta: ["Audio", "Theo cấp độ"], href: "/listening", action: "Luyện nghe" },
      { icon: PenTool, tag: "Mặt chữ", title: "Studio luyện viết", description: "Xem thứ tự nét và luyện ghi nhớ cấu trúc chữ Hán tập trung.", meta: ["Hán tự", "Thứ tự nét"], href: "/writing", action: "Luyện viết" },
      { icon: Wrench, tag: "Tiện ích", title: "Bộ công cụ Himi", description: "Các lối tắt đến ôn từ, nghe, viết và tra cứu nội dung học.", meta: ["Nhanh", "Dùng hằng ngày"], href: "/tools", action: "Xem công cụ" },
      { icon: BookMarked, tag: "Đọc mở rộng", title: "Truyện song ngữ", description: "Cụm từ công việc được đặt trong các câu chuyện ngắn Trung – Việt.", meta: ["Pinyin", "Đoạn mẫu"], href: "/stories", action: "Đọc truyện" },
    ],
    routineTitle: "Một nguyên tắc chọn tài liệu",
    routineDescription: "Chọn ít nhưng dùng đều sẽ hiệu quả hơn mở nhiều nội dung cùng lúc.",
    routine: [
      { title: "Một mục tiêu", description: "Xác định hôm nay cần nghe, nói, đọc hay viết." },
      { title: "Một tài liệu", description: "Học tập trung trong khoảng 10–20 phút." },
      { title: "Một lần ôn", description: "Quay lại cụm khó trước khi kết thúc." },
    ],
    cta: { eyebrow: "Bắt đầu có lộ trình", title: "Chưa biết chọn gì? Đi từ công việc của bạn", description: "Chọn đúng ngành trước, Himi sẽ sắp bài học theo tình huống thường gặp.", href: "/courses", label: "Chọn lộ trình" },
  },
  tools: {
    eyebrow: "Công cụ học nhanh",
    title: ["Cần dùng là mở,", "không làm gián đoạn nhịp học"],
    description: "Các công cụ nhỏ giúp bạn kiểm tra mặt chữ, luyện tai, xem cách dùng và quay lại bài học nhanh hơn.",
    glyph: "用",
    stats: [
      { value: "4", label: "công cụ chính" },
      { value: "0", label: "bước cài đặt" },
      { value: "24/7", label: "mở khi cần" },
    ],
    sectionEyebrow: "Bộ công cụ",
    sectionTitle: "Chọn đúng công cụ cho vướng mắc hiện tại",
    sectionDescription: "Mỗi công cụ dẫn tới một trải nghiệm đang có sẵn, tối ưu cho một thao tác học cụ thể.",
    cards: [
      { icon: PenTool, tag: "Chữ Hán", title: "Kiểm tra thứ tự nét", chinese: "笔顺", description: "Quan sát cấu trúc chữ và luyện từng nét trong studio tập trung.", meta: ["Trực quan", "Tự luyện"], href: "/writing", action: "Mở studio" },
      { icon: Headphones, tag: "Phát âm", title: "Nghe và bắt âm", chinese: "听力", description: "Luyện nghe câu ngắn theo tốc độ phù hợp trước khi kiểm tra đáp án.", meta: ["Nghe chậm", "Phản xạ"], href: "/listening", action: "Mở phòng nghe" },
      { icon: Search, tag: "Tra nội dung", title: "Tìm lộ trình theo ngành", chinese: "课程", description: "Lọc nhanh khóa học theo môi trường làm việc và nhu cầu giao tiếp.", meta: ["7 ngành", "Có lọc"], href: "/courses", action: "Tra lộ trình" },
      { icon: WandSparkles, tag: "Ôn nhanh", title: "Phiên học hôm nay", chinese: "复习", description: "Quay về trang chủ để bắt đầu phiên luyện ngắn và giữ nhịp mỗi ngày.", meta: ["10 phút", "Theo tiến độ"], href: "/", action: "Ôn ngay" },
      { icon: PlayCircle, tag: "Ngữ cảnh", title: "Video có transcript", chinese: "视频", description: "Xem tình huống, đọc transcript và trả lời câu hỏi ngay trong video.", meta: ["Phụ đề", "Tương tác"], href: "/videos", action: "Chọn video" },
      { icon: Wrench, tag: "Thực hành", title: "Kho ca làm", chinese: "练习", description: "Đưa từ và mẫu câu vào tình huống nghe – chọn – phản xạ thực tế.", meta: ["Theo ngành", "Có chấm điểm"], href: "/practice", action: "Bắt đầu luyện" },
    ],
    routineTitle: "Dùng công cụ mà không bị phân tán",
    routineDescription: "Công cụ chỉ nên giải quyết một điểm vướng rồi đưa bạn trở lại bài đang học.",
    routine: [
      { title: "Nhận diện", description: "Bạn đang vướng âm, nghĩa hay mặt chữ?" },
      { title: "Xử lý nhanh", description: "Dùng đúng một công cụ trong vài phút." },
      { title: "Quay lại bài", description: "Áp dụng ngay kết quả vào ngữ cảnh." },
    ],
    cta: { eyebrow: "Luyện qua tình huống", title: "Biết nghĩa rồi, hãy thử dùng trong ca làm", description: "Bài luyện công việc giúp biến kiến thức tra cứu thành phản xạ.", href: "/practice", label: "Luyện tình huống" },
  },
  leaderboard: {
    eyebrow: "Bảng xếp hạng Himi",
    title: ["Thi đua vừa đủ,", "tiến bộ đều hơn"],
    description: "Một không gian ghi nhận nỗ lực học tập. Bảng dữ liệu thật sẽ kết nối với XP và chuỗi ngày trong giai đoạn cộng đồng tiếp theo.",
    glyph: "榜",
    stats: [
      { value: "Tuần", label: "chu kỳ thi đua" },
      { value: "XP", label: "điểm hoạt động" },
      { value: "Top 3", label: "vị trí nổi bật" },
    ],
    sectionEyebrow: "Cách tính điểm",
    sectionTitle: "Nỗ lực nào cũng có chỗ trên bảng",
    sectionDescription: "Himi chuẩn bị bảng xếp hạng dựa trên hoạt động học thật, không dùng dữ liệu người học giả để lấp chỗ trống.",
    cards: [
      { icon: Trophy, tag: "Hoàn thành", title: "Kết thúc một bài học", description: "Điểm sẽ phản ánh việc hoàn thành nội dung thay vì chỉ mở trang.", meta: ["Theo bài", "Có xác nhận"] },
      { icon: ChartNoAxesColumnIncreasing, tag: "Thực hành", title: "Làm bài luyện và trò chơi", description: "Điểm số, độ chính xác và số lần luyện được ghi nhận theo tài khoản.", meta: ["Theo kết quả", "Có lịch sử"] },
      { icon: Medal, tag: "Đều đặn", title: "Giữ chuỗi ngày học", description: "Nhịp học bền vững được ưu tiên hơn việc dồn thật nhiều điểm trong một lần.", meta: ["Mỗi ngày", "Khuyến khích đều"] },
    ],
    routineTitle: "Bảng xếp hạng đang ở trạng thái chuẩn bị",
    routineDescription: "Khi hệ thống XP tổng được hoàn thiện, khu vực này sẽ hiển thị thứ hạng tuần, vị trí của bạn và nhóm học gần nhất.",
    routine: [
      { title: "Tích XP", description: "Học bài, luyện ca và chơi game bằng tài khoản." },
      { title: "Xếp theo tuần", description: "Mỗi tuần là một cơ hội bắt đầu mới." },
      { title: "Tôn trọng riêng tư", description: "Chỉ tên hiển thị và thành tích học được công khai." },
    ],
    cta: { eyebrow: "Tích lũy từ hôm nay", title: "Điểm game của bạn đã có thể được lưu", description: "Đăng nhập và hoàn thành một lượt chơi để bắt đầu xây thành tích cá nhân.", href: "/games", label: "Chơi và nhận XP" },
  },
  friends: {
    eyebrow: "Bạn bè học cùng",
    title: ["Có người đồng hành,", "việc học nhẹ hơn"],
    description: "Góc cộng đồng để kết nối bạn học cùng mục tiêu, nhắc nhau giữ nhịp và chia sẻ nội dung hữu ích.",
    glyph: "友",
    stats: [
      { value: "1:1", label: "bạn đồng hành" },
      { value: "Nhóm", label: "cùng chuyên ngành" },
      { value: "Riêng tư", label: "theo lựa chọn" },
    ],
    sectionEyebrow: "Kết nối có mục đích",
    sectionTitle: "Học cùng nhau nhưng vẫn giữ sự tập trung",
    sectionDescription: "Tính năng kết bạn đang được thiết kế quanh mục tiêu học, không biến Himi thành một bảng tin gây xao nhãng.",
    cards: [
      { icon: UsersRound, tag: "Bạn đồng hành", title: "Ghép theo mục tiêu học", description: "Tìm người cùng ngành, cùng cấp độ hoặc cùng khung giờ luyện tập.", meta: ["Theo mục tiêu", "Tự nguyện"] },
      { icon: MessagesSquare, tag: "Nhắc nhịp", title: "Gửi lời động viên ngắn", description: "Một lời nhắc tích cực thay cho hộp chat dài và nhiều thông báo.", meta: ["Gọn", "Không làm phiền"] },
      { icon: BookOpenText, tag: "Chia sẻ", title: "Gửi bài học hữu ích", description: "Chia sẻ lộ trình, video hoặc truyện đang học với một liên kết nội bộ.", meta: ["Nội dung Himi", "An toàn"] },
    ],
    routineTitle: "Lộ trình mở tính năng bạn bè",
    routineDescription: "Trang đã có cấu trúc nội dung; lớp kết nối tài khoản và lời mời sẽ được bổ sung khi có bảng quan hệ bạn bè trong dữ liệu.",
    routine: [
      { title: "Hồ sơ học", description: "Chọn mục tiêu và cấp độ muốn chia sẻ." },
      { title: "Lời mời", description: "Hai phía đều xác nhận trước khi kết nối." },
      { title: "Học cùng", description: "Theo dõi nhịp học mà không lộ dữ liệu riêng." },
    ],
    cta: { eyebrow: "Chuẩn bị hồ sơ", title: "Tạo tài khoản để lưu mục tiêu học của bạn", description: "Khi tính năng kết bạn mở, hồ sơ học sẽ là cơ sở để gợi ý người đồng hành phù hợp.", href: "/register", label: "Tạo tài khoản" },
  },
  blog: {
    eyebrow: "Bài viết Himi",
    title: ["Học có chiến lược,", "không chỉ học thật nhiều"],
    description: "Ghi chú ngắn về cách học tiếng Trung cho người đi làm: dễ áp dụng, có ví dụ và dẫn thẳng tới nội dung để thực hành.",
    glyph: "文",
    stats: [
      { value: "5–8′", label: "mỗi bài đọc" },
      { value: "3", label: "chủ đề mở đầu" },
      { value: "Thực tế", label: "ưu tiên áp dụng" },
    ],
    sectionEyebrow: "Bài viết mới",
    sectionTitle: "Những cách học nhỏ có thể dùng ngay hôm nay",
    sectionDescription: "Mỗi bài tập trung vào một vấn đề quen thuộc và kết thúc bằng một bước luyện cụ thể trên Himi.",
    cards: [
      { icon: Newspaper, tag: "Phương pháp · 6 phút", title: "Học từ theo cụm thay vì từng chữ", description: "Vì sao một cụm ngắn trong ngữ cảnh giúp bạn nói nhanh và tự nhiên hơn danh sách từ rời.", meta: ["Người mới", "Từ vựng"], sample: "Thay vì chỉ nhớ 确认 là “xác nhận”, hãy học cả cụm 请确认一下 — “vui lòng xác nhận giúp”. Khi gặp tình huống thật, bạn có thể lấy cả cụm ra dùng ngay." },
      { icon: Headphones, tag: "Luyện nghe · 5 phút", title: "Nghe ba lượt nhưng mỗi lượt có một nhiệm vụ", description: "Một quy trình nghe ngắn giúp tránh việc bật audio lặp lại mà không biết mình đang tìm gì.", meta: ["Phản xạ", "10 phút/ngày"], sample: "Lượt một nghe ý chính; lượt hai bắt từ khóa; lượt ba đối chiếu transcript rồi nhại lại. Mỗi lượt có mục tiêu riêng nên tai bạn luôn chủ động." },
      { icon: BriefcaseBusiness, tag: "Công việc · 8 phút", title: "Xây bộ câu sống còn cho ngành của bạn", description: "Cách chọn 20 câu xuất hiện thường xuyên nhất để tạo nền phản xạ trước khi học rộng.", meta: ["Theo ngành", "Giao tiếp"], sample: "Bắt đầu từ ba nhóm: chào hỏi, xác nhận công việc và xử lý thay đổi. Mỗi nhóm chọn vài câu thật sự xuất hiện trong ca làm của bạn." },
    ],
    routineTitle: "Đọc xong phải có một hành động",
    routineDescription: "Bài viết chỉ có ích khi dẫn đến một lần nghe, nói, đọc hoặc viết cụ thể.",
    routine: [
      { title: "Đọc ý chính", description: "Gạch ra một nguyên tắc phù hợp với bạn." },
      { title: "Chọn ví dụ", description: "Biến nguyên tắc thành một câu tiếng Trung." },
      { title: "Thực hành ngay", description: "Dùng câu đó trong bài nghe hoặc ca luyện." },
    ],
    cta: { eyebrow: "Từ đọc sang làm", title: "Thử phương pháp với một video ngắn", description: "Video có transcript là nơi phù hợp để áp dụng nghe ba lượt và ghi nhớ theo cụm.", href: "/videos", label: "Chọn video luyện" },
  },
};

function CommunityCard({ card }: { card: CommunityCard }) {
  const Icon = card.icon;

  return (
    <article className="community-card">
      <div className="community-card-heading">
        <span className="community-card-icon"><Icon aria-hidden="true" size={22} /></span>
        <span className="community-card-tag">{card.tag}</span>
      </div>
      <h3>{card.title}</h3>
      {card.chinese ? <p className="community-card-chinese" lang="zh-Hans">{card.chinese}</p> : null}
      <p className="community-card-description">{card.description}</p>
      <div className="community-card-meta">{card.meta.map((item) => <span key={item}>{item}</span>)}</div>
      {card.sample ? (
        <details className="community-card-sample">
          <summary>Đọc đoạn mẫu <ArrowRight aria-hidden="true" size={15} /></summary>
          <p>{card.sample}</p>
        </details>
      ) : null}
      {card.href ? (
        <Link className="community-card-link" href={card.href} prefetch={false}>
          {card.action ?? "Mở nội dung"}<ArrowRight aria-hidden="true" size={16} />
        </Link>
      ) : null}
    </article>
  );
}

export function CommunityHubPage({ kind }: { kind: CommunityPageKind }) {
  const content = contentByKind[kind];

  return (
    <main className={`learner-dashboard community-page is-${kind}`}>
      <section className="community-hero">
        <span aria-hidden="true" className="community-hero-orb is-one" />
        <span aria-hidden="true" className="community-hero-orb is-two" />
        <div className="community-hero-copy">
          <p className="community-eyebrow"><Sparkles aria-hidden="true" size={15} />{content.eyebrow}</p>
          <h1><span>{content.title[0]}</span><span>{content.title[1]}</span></h1>
          <p className="community-hero-description">{content.description}</p>
          <a className="community-primary-action" href="#community-library">Khám phá nội dung <ArrowRight aria-hidden="true" size={17} /></a>
        </div>
        <div aria-hidden="true" className="community-hero-art">
          <span className="community-hero-glyph">{content.glyph}</span>
          <span className="community-hero-card is-back" />
          <span className="community-hero-card is-front"><BookOpenText size={42} /><small>HIMI · 学中文</small></span>
        </div>
      </section>

      <section aria-label="Tóm tắt" className="community-stats">
        {content.stats.map((stat) => <div key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></div>)}
      </section>

      <section className="community-library" id="community-library">
        <header className="community-section-heading">
          <p>{content.sectionEyebrow}</p>
          <h2>{content.sectionTitle}</h2>
          <span>{content.sectionDescription}</span>
        </header>
        <div className="community-card-grid">
          {content.cards.map((card) => <CommunityCard card={card} key={card.title} />)}
        </div>
      </section>

      <section className="community-routine">
        <div className="community-routine-copy">
          <span><WandSparkles aria-hidden="true" size={17} />Gợi ý từ Himi</span>
          <h2>{content.routineTitle}</h2>
          <p>{content.routineDescription}</p>
        </div>
        <ol>
          {content.routine.map((step, index) => (
            <li key={step.title}><strong>{String(index + 1).padStart(2, "0")}</strong><div><h3>{step.title}</h3><p>{step.description}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="community-cta">
        <div>
          <p>{content.cta.eyebrow}</p>
          <h2>{content.cta.title}</h2>
          <span>{content.cta.description}</span>
        </div>
        <Link href={content.cta.href} prefetch={false}>{content.cta.label}<ArrowRight aria-hidden="true" size={17} /></Link>
      </section>
    </main>
  );
}
