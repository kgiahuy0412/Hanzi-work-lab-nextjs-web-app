from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from pypinyin import Style, lazy_pinyin


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "content" / "hsk1-textbook-json"
UPDATED_AT = "2026-08-30T00:00:00.000Z"


def parse_vocab(spec: str) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    for raw in re.split(r";(?=[\u3400-\u9fff])", spec):
        raw = raw.strip()
        if not raw:
            continue
        parts = [part.strip() for part in raw.split("|")]
        if len(parts) < 3:
            raise ValueError(f"Invalid vocabulary record: {raw}")
        flags = set(parts[3].split(",")) if len(parts) > 3 and parts[3] else set()
        items.append(
            {
                "simplified": parts[0],
                "meaningVi": parts[1],
                "wordClass": parts[2],
                "sourceAsterisk": "star" in flags,
                "kind": "proper-noun" if "proper" in flags else "vocabulary",
                "relatedForm": next(
                    (flag.split("=", 1)[1] for flag in flags if flag.startswith("form=")),
                    None,
                ),
            }
        )
    return items


PINYIN_OVERRIDES = {
    "你们": "nǐmen",
    "对不起": "duìbuqǐ",
    "没关系": "méi guānxi",
    "谢谢": "xièxie",
    "不客气": "bú kèqi",
    "再见": "zàijiàn",
    "什么": "shénme",
    "名字": "míngzi",
    "老师": "lǎoshī",
    "李月": "Lǐ Yuè",
    "中国": "Zhōngguó",
    "美国": "Měiguó",
    "汉语": "Hànyǔ",
    "同学": "tóngxué",
    "朋友": "péngyou",
    "女儿": "nǚ'ér",
    "今年": "jīnnián",
    "妈妈": "māma",
    "好吃": "hǎochī",
    "汉字": "Hànzì",
    "怎么": "zěnme",
    "今天": "jīntiān",
    "星期": "xīngqī",
    "昨天": "zuótiān",
    "明天": "míngtiān",
    "学校": "xuéxiào",
    "米饭": "mǐfàn",
    "下午": "xiàwǔ",
    "商店": "shāngdiàn",
    "杯子": "bēizi",
    "多少": "duōshao",
    "那儿": "nàr",
    "椅子": "yǐzi",
    "下面": "xiàmiàn",
    "哪儿": "nǎr",
    "工作": "gōngzuò",
    "儿子": "érzi",
    "医院": "yīyuàn",
    "医生": "yīshēng",
    "爸爸": "bàba",
    "桌子": "zhuōzi",
    "电脑": "diànnǎo",
    "前面": "qiánmiàn",
    "后面": "hòumiàn",
    "这儿": "zhèr",
    "没有": "méiyǒu",
    "王方": "Wáng Fāng",
    "谢朋": "Xiè Péng",
    "现在": "xiànzài",
    "中午": "zhōngwǔ",
    "吃饭": "chīfàn",
    "时候": "shíhou",
    "我们": "wǒmen",
    "电影": "diànyǐng",
    "北京": "Běijīng",
    "天气": "tiānqì",
    "怎么样": "zěnmeyàng",
    "太……了": "tài...le",
    "下雨": "xiàyǔ",
    "小姐": "xiǎojiě",
    "身体": "shēntǐ",
    "水果": "shuǐguǒ",
    "学习": "xuéxí",
    "上午": "shàngwǔ",
    "睡觉": "shuìjiào",
    "电视": "diànshì",
    "喜欢": "xǐhuan",
    "打电话": "dǎ diànhuà",
    "大卫": "Dàwèi",
    "东西": "dōngxi",
    "一点儿": "yìdiǎnr",
    "苹果": "píngguǒ",
    "看见": "kànjiàn",
    "先生": "xiānsheng",
    "回来": "huílai",
    "分钟": "fēnzhōng",
    "衣服": "yīfu",
    "漂亮": "piàoliang",
    "不少": "bùshǎo",
    "这些": "zhèxiē",
    "认识": "rènshi",
    "大学": "dàxué",
    "饭店": "fàndiàn",
    "出租车": "chūzūchē",
    "一起": "yìqǐ",
    "高兴": "gāoxìng",
    "飞机": "fēijī",
}


def pinyin_text(text: str, *, numeric: bool = False) -> str:
    if not numeric and text in PINYIN_OVERRIDES:
        return PINYIN_OVERRIDES[text]
    style = Style.TONE3 if numeric else Style.TONE
    values = lazy_pinyin(
        text,
        style=style,
        neutral_tone_with_five=numeric,
        errors=lambda value: list(value),
    )
    joined = " ".join(value for value in values if value.strip())
    joined = re.sub(r"\s+([，。！？、；：,.!?;:])", r"\1", joined)
    joined = re.sub(r"([（(])\s+", r"\1", joined)
    joined = re.sub(r"\s+([）)])", r"\1", joined)
    return joined


def grammar(title: str, formula: str, explanation: str) -> dict[str, str]:
    return {"titleVi": title, "formula": formula, "explanationVi": explanation}


LESSONS: list[dict[str, Any]] = [
    {
        "number": 1,
        "slug": "chao-anh",
        "titleZh": "你好！",
        "titleVi": "Chào anh!",
        "printedPages": [14, 19],
        "pdfPages": [14, 19],
        "vocabulary": parse_vocab(
            "你|anh; chị; bạn|pronoun;好|khỏe; tốt|adjective;您|ông; bà; ngài (lịch sự)|pronoun|star;"
            "你们|các anh; các chị; các bạn|pronoun;对不起|xin lỗi|phrase;没关系|không sao; không có vấn đề gì|phrase"
        ),
        "grammar": [],
        "pronunciation": [
            "Thanh mẫu và vận mẫu cơ bản (1)",
            "Bốn thanh điệu tiếng Trung",
            "Cấu tạo âm tiết tiếng Trung",
            "Biến điệu khi hai âm tiết thanh 3 đứng liền nhau",
        ],
        "characters": "一二三十八六",
    },
    {
        "number": 2,
        "slug": "cam-on-anh",
        "titleZh": "谢谢你！",
        "titleVi": "Cảm ơn anh!",
        "printedPages": [20, 25],
        "pdfPages": [20, 25],
        "vocabulary": parse_vocab(
            "谢谢|cảm ơn|verb;不|không; không cần; đừng|adverb;不客气|đừng khách sáo|phrase;再见|tạm biệt|phrase"
        ),
        "grammar": [],
        "pronunciation": [
            "Thanh mẫu và vận mẫu cơ bản (2)",
            "Thanh nhẹ",
            "Quy tắc ghi dấu thanh và cách viết giản lược",
        ],
        "characters": "口见山小不",
    },
    {
        "number": 3,
        "slug": "co-ten-gi",
        "titleZh": "你叫什么名字？",
        "titleVi": "Cô tên gì?",
        "printedPages": [26, 33],
        "pdfPages": [26, 33],
        "vocabulary": parse_vocab(
            "叫|tên là; gọi|verb;什么|gì; cái gì|pronoun;名字|tên|noun;我|tôi; ta; mình|pronoun;"
            "是|là|verb;老师|thầy giáo; cô giáo|noun;吗|trợ từ cuối câu hỏi|particle;学生|học sinh|noun;人|người|noun;"
            "李月|Lý Nguyệt (tên người)|proper-noun|proper;中国|Trung Quốc|proper-noun|proper;美国|Mỹ|proper-noun|proper"
        ),
        "grammar": [
            grammar("Đại từ nghi vấn 什么", "Chủ ngữ + động từ + 什么 (+ danh từ)?", "Dùng 什么 để hỏi sự vật, nội dung hoặc tên gọi chưa biết."),
            grammar("Câu chữ 是", "Chủ ngữ + 是 / 不是 + danh từ", "Dùng 是 để xác nhận danh tính, nghề nghiệp hoặc quốc tịch; phủ định bằng 不是."),
            grammar("Câu hỏi với 吗", "Câu trần thuật + 吗？", "Thêm 吗 vào cuối câu trần thuật để tạo câu hỏi đúng-sai."),
        ],
        "pronunciation": [
            "Phân biệt thanh mẫu j, q, x với z, c, s",
            "Phân biệt vận mẫu i, u, ü",
            "Biến điệu của 不",
            "Quy tắc ghép ü với j, q, x",
        ],
        "characters": "月心中人",
    },
    {
        "number": 4,
        "slug": "co-ay-la-co-giao-tieng-trung",
        "titleZh": "她是我的汉语老师。",
        "titleVi": "Cô ấy là cô giáo dạy tôi tiếng Trung Quốc.",
        "printedPages": [34, 41],
        "pdfPages": [34, 41],
        "vocabulary": parse_vocab(
            "她|cô ấy; bà ấy|pronoun;谁|ai|pronoun;的|trợ từ dùng sau định ngữ|particle;汉语|tiếng Trung Quốc|noun;"
            "哪|nào|pronoun;国|quốc gia; đất nước|noun;呢|trợ từ cuối câu hỏi|particle;他|anh ấy; ông ấy|pronoun;"
            "同学|bạn cùng lớp|noun;朋友|bạn|noun"
        ),
        "grammar": [
            grammar("Đại từ nghi vấn 谁 và 哪", "谁 / 哪 + danh từ", "Dùng 谁 để hỏi người và 哪 để lựa chọn người, nước hoặc sự vật cụ thể."),
            grammar("Trợ từ kết cấu 的", "Định ngữ + 的 + danh từ", "Đặt 的 sau thành phần bổ nghĩa để biểu thị quan hệ sở hữu hoặc đặc điểm."),
            grammar("Trợ từ nghi vấn 呢 (1)", "Danh từ / đại từ + 呢？", "Dùng 呢 để hỏi lại cùng một thông tin đã xuất hiện trong ngữ cảnh."),
        ],
        "pronunciation": [
            "Phân biệt thanh mẫu zh, ch, sh, r",
            "Phân biệt vận mẫu mũi trước n và mũi sau ng",
            "Biến điệu của 一",
            "Cách dùng y và w trong pinyin",
        ],
        "characters": "七儿几九",
    },
    {
        "number": 5,
        "slug": "con-gai-co-ay-hai-muoi-tuoi",
        "titleZh": "她女儿今年二十岁。",
        "titleVi": "Con gái của cô ấy năm nay 20 tuổi.",
        "printedPages": [42, 50],
        "pdfPages": [42, 48],
        "missingPrintedPages": [44, 45],
        "vocabulary": parse_vocab(
            "家|nhà; gia đình|noun;有|có|verb;口|lượng từ dùng cho người trong gia đình|measure-word|star;女儿|con gái|noun;"
            "几|mấy|pronoun;岁|tuổi|measure-word;了|trợ từ chỉ thay đổi hoặc tình huống mới|particle;今年|năm nay|noun;"
            "多|bao nhiêu; chỉ mức độ|adverb;大|lớn; bao nhiêu tuổi|adjective"
        ),
        "grammar": [
            grammar("Đại từ nghi vấn 几", "几 + lượng từ + danh từ？", "Dùng 几 khi dự đoán câu trả lời là một số lượng tương đối nhỏ."),
            grammar("Các số dưới 100", "十位数 + 十 + 个位数", "Ghép số hàng chục với 十 rồi thêm hàng đơn vị khi cần."),
            grammar("了 biểu thị sự thay đổi", "Câu miêu tả + 了", "Đặt 了 ở cuối câu để cho biết trạng thái mới hoặc tình huống đã thay đổi."),
            grammar("Hỏi tuổi với 多大", "Chủ ngữ + 多大 + 了？", "Dùng 多大 để hỏi tuổi của người lớn; với trẻ nhỏ thường dùng 几岁."),
        ],
        "grammarSourceStatus": "reconstructed-from-toc-because-printed-pages-44-45-are-missing",
        "pronunciation": [
            "Âm cuốn lưỡi 儿化",
            "Phân biệt vận mẫu bắt đầu bằng i, u, ü",
            "Phân biệt thanh mẫu bật hơi và không bật hơi",
            "Dấu cách âm trong pinyin",
        ],
        "characters": "水女了大",
    },
    {
        "number": 6,
        "slug": "toi-biet-noi-tieng-trung",
        "titleZh": "我会说汉语。",
        "titleVi": "Tôi biết nói tiếng Trung Quốc.",
        "printedPages": [52, 59],
        "pdfPages": [50, 57],
        "vocabulary": parse_vocab(
            "会|biết; có khả năng do học mà có|modal-verb;说|nói|verb;妈妈|mẹ|noun;菜|món ăn; thức ăn|noun;"
            "很|rất|adverb;好吃|ngon|adjective|star;做|làm; nấu|verb;写|viết|verb;汉字|chữ Hán|noun;字|chữ|noun;"
            "怎么|thế nào; bằng cách nào|pronoun;读|đọc|verb"
        ),
        "grammar": [
            grammar("Động từ năng nguyện 会 (1)", "Chủ ngữ + 会 / 不会 + động từ", "Dùng 会 để diễn tả năng lực có được nhờ học tập hoặc luyện tập."),
            grammar("Câu có vị ngữ là tính từ", "Chủ ngữ + phó từ mức độ + tính từ", "Tính từ có thể trực tiếp làm vị ngữ; thường có 很 và không dùng 是."),
            grammar("Đại từ nghi vấn 怎么 (1)", "怎么 + động từ？", "Đặt 怎么 trước động từ để hỏi cách thức thực hiện hành động."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ hai âm tiết: thanh 1 + thanh 1/2/3/4"],
        "characters": "东我西",
    },
    {
        "number": 7,
        "slug": "hom-nay-ngay-may",
        "titleZh": "今天几号？",
        "titleVi": "Hôm nay là ngày mấy?",
        "printedPages": [60, 67],
        "pdfPages": [58, 65],
        "vocabulary": parse_vocab(
            "请|mời; xin|verb;问|hỏi|verb|star;今天|hôm nay|noun;号|ngày; số|noun;月|tháng|noun;星期|tuần; thứ|noun;"
            "昨天|hôm qua|noun;明天|ngày mai|noun;去|đi; đi đến|verb;学校|trường học|noun;看|nhìn; xem; đọc|verb;书|sách|noun"
        ),
        "grammar": [
            grammar("Cách diễn tả ngày tháng (1)", "月 + 日/号 + 星期", "Nói đơn vị lớn trước đơn vị nhỏ: tháng, ngày rồi thứ; văn nói thường dùng 号."),
            grammar("Câu có vị ngữ là danh từ", "Chủ ngữ + danh từ chỉ ngày, giờ hoặc tuổi", "Trong các câu nêu ngày tháng, giờ hoặc tuổi, cụm danh từ có thể trực tiếp làm vị ngữ."),
            grammar("Câu liên động (1)", "去 + nơi chốn + động từ", "Động từ sau diễn tả mục đích của việc đi đến một địa điểm."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ hai âm tiết: thanh 2 + thanh 1/2/3/4"],
        "characters": "四五书",
    },
    {
        "number": 8,
        "slug": "toi-muon-uong-tra",
        "titleZh": "我想喝茶。",
        "titleVi": "Tôi muốn uống trà.",
        "printedPages": [68, 75],
        "pdfPages": [66, 73],
        "vocabulary": parse_vocab(
            "想|muốn|modal-verb;喝|uống|verb;茶|trà|noun;吃|ăn|verb;米饭|cơm|noun;下午|buổi chiều|noun;"
            "商店|cửa hàng|noun;买|mua|verb;个|cái; chiếc|measure-word;杯子|ly; tách|noun;这|này; đây|pronoun;"
            "多少|bao nhiêu|pronoun;钱|tiền|noun;块|đồng; đơn vị tiền tệ|measure-word;那|kia; đó|pronoun"
        ),
        "grammar": [
            grammar("Động từ năng nguyện 想", "Chủ ngữ + 想 + động từ", "Dùng 想 để nói mong muốn hoặc dự định."),
            grammar("Đại từ nghi vấn 多少", "多少 + danh từ？", "Dùng 多少 để hỏi số lượng khi không giả định một phạm vi nhỏ."),
            grammar("Lượng từ 个 và 口", "Số từ + lượng từ + danh từ", "个 là lượng từ thông dụng; 口 dùng cho số người trong gia đình."),
            grammar("Cách diễn đạt số tiền", "Số + 块 (+ 钱)", "Dùng 块 trong khẩu ngữ để chỉ đơn vị tiền; 钱 có thể được lược khi ngữ cảnh rõ."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ hai âm tiết: thanh 3 + thanh 1/2/3/4"],
        "characters": "少个",
    },
    {
        "number": 9,
        "slug": "con-trai-anh-lam-viec-o-dau",
        "titleZh": "你儿子在哪儿工作？",
        "titleVi": "Con trai anh làm việc ở đâu?",
        "printedPages": [76, 83],
        "pdfPages": [74, 81],
        "vocabulary": parse_vocab(
            "小|nhỏ; bé|adjective;猫|mèo|noun;在|ở; tại; đang có mặt|verb;那儿|chỗ đó|pronoun;狗|chó|noun;"
            "椅子|ghế dựa|noun;下面|bên dưới; phía dưới|noun|form=下;哪儿|đâu|pronoun;工作|làm việc; công việc|verb-noun;"
            "儿子|con trai|noun;医院|bệnh viện|noun;医生|bác sĩ|noun;爸爸|cha; bố|noun"
        ),
        "grammar": [
            grammar("Động từ 在", "Chủ ngữ + 在 + nơi chốn", "Dùng 在 làm động từ để cho biết người hoặc vật đang ở đâu."),
            grammar("Đại từ nghi vấn 哪儿", "Chủ ngữ + 在 + 哪儿？", "Dùng 哪儿 để hỏi địa điểm chưa biết."),
            grammar("Giới từ 在", "Chủ ngữ + 在 + nơi chốn + động từ", "Đặt cụm 在 + nơi chốn trước động từ để chỉ địa điểm hành động diễn ra."),
            grammar("Trợ từ nghi vấn 呢 (2)", "Chủ đề + 呢？", "Dùng 呢 để hỏi vị trí hoặc tình trạng của một người/vật đã được nhắc đến."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ hai âm tiết: thanh 4 + thanh 1/2/3/4"],
        "characters": "在子工",
    },
    {
        "number": 10,
        "slug": "toi-co-the-ngoi-o-day-khong",
        "titleZh": "我能坐这儿吗？",
        "titleVi": "Tôi có thể ngồi ở đây được không?",
        "printedPages": [84, 92],
        "pdfPages": [82, 90],
        "vocabulary": parse_vocab(
            "桌子|cái bàn|noun;上|trên; phía trên|noun;电脑|máy vi tính|noun;和|và|conjunction;本|quyển; cuốn|measure-word;"
            "里|trong; bên trong|noun;前面|phía trước|noun;后面|phía sau|noun;这儿|chỗ này; ở đây|pronoun;没有|không có|verb;"
            "能|có thể|modal-verb;坐|ngồi|verb;王方|Vương Phương (tên người)|proper-noun|proper;谢朋|Tạ Bằng (tên người)|proper-noun|proper"
        ),
        "grammar": [
            grammar("Câu chữ 有 biểu thị tồn tại", "Nơi chốn + 有 + người/vật", "Dùng 有 để nói một người hoặc vật tồn tại ở một địa điểm."),
            grammar("Liên từ 和", "Danh từ + 和 + danh từ", "Dùng 和 để nối các danh từ hoặc cụm danh từ cùng chức năng."),
            grammar("Động từ năng nguyện 能", "Chủ ngữ + 能 / 不能 + động từ", "Dùng 能 để nói khả năng do điều kiện cho phép hoặc xin phép."),
            grammar("Câu cầu khiến với 请", "请 + động từ", "Đặt 请 trước động từ để tạo lời mời hoặc yêu cầu lịch sự."),
        ],
        "pronunciation": [
            "Cách đọc âm tiết mang thanh nhẹ",
            "Cách đọc từ láy",
            "Cách đọc từ có hậu tố 们, 子 hoặc 头",
        ],
        "characters": "上下本末",
    },
    {
        "number": 11,
        "slug": "bay-gio-may-gio",
        "titleZh": "现在几点？",
        "titleVi": "Bây giờ là mấy giờ?",
        "printedPages": [94, 101],
        "pdfPages": [92, 99],
        "vocabulary": parse_vocab(
            "现在|bây giờ; hiện tại|noun;点|giờ|measure-word;分|phút|measure-word;中午|buổi trưa|noun;吃饭|ăn cơm|verb;"
            "时候|lúc; khi|noun;回|về; trở về|verb;我们|chúng ta; chúng tôi|pronoun;电影|phim|noun;住|ở; cư trú|verb;"
            "前|trước|noun;北京|Bắc Kinh|proper-noun|proper"
        ),
        "grammar": [
            grammar("Cách diễn tả thời gian", "Giờ + 点 + phút + 分", "Nêu giờ trước phút; khi không có phút có thể chỉ nói số giờ với 点."),
            grammar("Từ chỉ thời gian làm trạng ngữ", "Chủ ngữ + thời gian + động từ", "Đặt từ chỉ thời gian trước động từ để nêu thời điểm hành động."),
            grammar("Danh từ 前", "Thời gian / sự kiện + 前", "Đặt 前 sau một mốc để diễn tả trước mốc đó."),
        ],
        "pronunciation": ["Chức năng và cách đọc thanh nhẹ"],
        "characters": "午电",
    },
    {
        "number": 12,
        "slug": "ngay-mai-thoi-tiet-the-nao",
        "titleZh": "明天天气怎么样？",
        "titleVi": "Ngày mai thời tiết thế nào?",
        "printedPages": [102, 109],
        "pdfPages": [100, 107],
        "vocabulary": parse_vocab(
            "天气|thời tiết|noun;怎么样|như thế nào|pronoun;太|quá; lắm|adverb;太……了|quá; lắm|pattern;热|nóng|adjective;"
            "冷|lạnh|adjective;下雨|mưa; đổ mưa|verb|form=下,雨;小姐|cô; tiểu thư|noun;来|đến; tới|verb;"
            "身体|sức khỏe; cơ thể|noun|star;爱|yêu; thích|verb;些|một ít; một vài|measure-word;水果|trái cây|noun;水|nước|noun"
        ),
        "grammar": [
            grammar("Đại từ nghi vấn 怎么样", "Chủ đề + 怎么样？", "Dùng 怎么样 để hỏi tình trạng, đặc điểm hoặc đánh giá chung."),
            grammar("Câu có vị ngữ là kết cấu chủ-vị", "Chủ ngữ lớn + cụm chủ-vị", "Một cụm chủ-vị có thể làm vị ngữ để mô tả một bộ phận hoặc phương diện của chủ ngữ lớn."),
            grammar("Phó từ mức độ 太", "太 + tính từ + 了", "Cấu trúc 太……了 biểu thị mức độ rất cao, thường mang sắc thái cảm thán."),
            grammar("Động từ năng nguyện 会 (2)", "会 + động từ", "Ngoài năng lực đã học, 会 còn dùng để dự đoán khả năng một việc sẽ xảy ra."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ ba âm tiết: bắt đầu bằng thanh 1"],
        "characters": "天气雨",
    },
    {
        "number": 13,
        "slug": "anh-ay-dang-hoc-nau-mon-trung-quoc",
        "titleZh": "他在学做中国菜呢。",
        "titleVi": "Anh ấy đang học nấu món ăn Trung Quốc.",
        "printedPages": [110, 115],
        "pdfPages": [108, 113],
        "vocabulary": parse_vocab(
            "喂|a lô; này|interjection;也|cũng|adverb|star;学习|học; học tập|verb|form=学;上午|buổi sáng|noun;"
            "睡觉|ngủ|verb;电视|ti vi|noun;喜欢|thích|verb;给|cho; với|preposition|star;打电话|gọi điện thoại|verb;"
            "吧|trợ từ biểu thị đề nghị; thỉnh cầu|particle|star;大卫|David (tên người)|proper-noun|proper"
        ),
        "grammar": [
            grammar("Từ cảm thán 喂", "喂，……", "Dùng 喂 khi mở đầu cuộc gọi hoặc gọi sự chú ý; ngữ điệu tùy tình huống."),
            grammar("在……呢 biểu thị hành động đang diễn ra", "Chủ ngữ + 在 + động từ + 呢", "在 và 呢 bao quanh vị ngữ để nhấn mạnh hành động đang tiếp diễn."),
            grammar("Cách đọc số điện thoại", "Đọc từng chữ số; 一 thường đọc yāo", "Số điện thoại được đọc từng số; để tránh nhầm, chữ số 1 thường đọc là yāo."),
            grammar("Trợ từ ngữ khí 吧", "Câu đề nghị / mệnh lệnh + 吧", "Dùng 吧 để làm lời đề nghị, thỉnh cầu hoặc mệnh lệnh nhẹ hơn."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ ba âm tiết: bắt đầu bằng thanh 2"],
        "characters": "日目习",
    },
    {
        "number": 14,
        "slug": "co-ay-da-mua-nhieu-quan-ao",
        "titleZh": "她买了不少衣服。",
        "titleVi": "Cô ấy đã mua nhiều quần áo.",
        "printedPages": [116, 123],
        "pdfPages": [114, 121],
        "vocabulary": parse_vocab(
            "东西|đồ; đồ đạc|noun;一点儿|một ít; một chút|quantity;苹果|táo|noun;看见|nhìn thấy|verb;先生|ông; ngài|noun;"
            "开|lái; mở|verb;车|xe|noun;回来|quay về; trở lại|verb;分钟|phút|noun;后|sau|noun;衣服|quần áo|noun;"
            "漂亮|đẹp|adjective;啊|trợ từ ngữ khí|particle|star;少|ít|adjective;不少|nhiều; không ít|adjective;"
            "这些|những thứ này; những điều này|pronoun;都|đều|adverb;张|Trương (họ người Trung Quốc)|proper-noun|proper"
        ),
        "grammar": [
            grammar("了 biểu thị sự việc đã xảy ra hoặc hoàn thành", "Động từ + 了 + tân ngữ", "Đặt 了 sau động từ để biểu thị hành động đã xảy ra hoặc hoàn tất."),
            grammar("Danh từ 后", "Khoảng thời gian / sự kiện + 后", "Đặt 后 sau mốc hoặc khoảng thời gian để diễn tả sau đó."),
            grammar("Trợ từ ngữ khí 啊", "Câu khẳng định / cảm thán + 啊", "Dùng 啊 ở cuối câu để khẳng định, cảm thán hoặc làm giọng nói tự nhiên hơn."),
            grammar("Phó từ 都", "Chủ ngữ số nhiều + 都 + vị ngữ", "Dùng 都 để nói mọi thành viên trong phạm vi đã nêu đều có cùng đặc điểm hoặc hành động."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ ba âm tiết: bắt đầu bằng thanh 3"],
        "characters": "开车回",
    },
    {
        "number": 15,
        "slug": "toi-dap-may-bay-den-day",
        "titleZh": "我是坐飞机来的。",
        "titleVi": "Tôi đáp máy bay đến đây.",
        "printedPages": [124, 130],
        "pdfPages": [122, 128],
        "vocabulary": parse_vocab(
            "认识|quen; biết|verb;年|năm|noun;大学|đại học|noun;饭店|khách sạn; nhà hàng|noun;出租车|taxi|noun;"
            "一起|cùng nhau|adverb|star;高兴|vui; phấn khởi|adjective;听|nghe|verb;飞机|máy bay|noun"
        ),
        "grammar": [
            grammar("Câu 是……的", "Chủ ngữ + 是 + thời gian / địa điểm / cách thức + động từ + 的", "Dùng 是……的 để nhấn mạnh thời gian, địa điểm hoặc cách thức của hành động đã xảy ra."),
            grammar("Cách diễn tả ngày tháng (2)", "年 + 月 + 日/号 + 星期", "Khi có năm, tiếp tục nói theo thứ tự từ đơn vị lớn đến nhỏ."),
        ],
        "pronunciation": ["Kết hợp thanh điệu của từ ba âm tiết: bắt đầu bằng thanh 4"],
        "characters": "年出飞",
    },
]


CHARACTER_MEANINGS = {
    "一": "một", "二": "hai", "三": "ba", "十": "mười", "八": "tám", "六": "sáu",
    "口": "miệng; lượng từ", "见": "thấy", "山": "núi", "小": "nhỏ", "不": "không",
    "月": "tháng; mặt trăng", "心": "tim; lòng", "中": "giữa; Trung", "人": "người",
    "七": "bảy", "儿": "con; hậu tố", "几": "mấy", "九": "chín", "水": "nước",
    "女": "nữ", "了": "trợ từ", "大": "lớn", "东": "đông", "我": "tôi", "西": "tây",
    "四": "bốn", "五": "năm", "书": "sách", "少": "ít", "个": "lượng từ thông dụng",
    "在": "ở; tại", "子": "con; hậu tố", "工": "công việc", "上": "trên", "下": "dưới",
    "本": "gốc; lượng từ sách", "末": "cuối", "午": "trưa", "电": "điện", "天": "trời; ngày",
    "气": "khí", "雨": "mưa", "日": "ngày; mặt trời", "目": "mắt", "习": "học; luyện",
    "开": "mở; lái", "车": "xe", "回": "về", "年": "năm", "出": "ra", "飞": "bay",
}


CULTURE_NOTES = [
    {
        "id": "culture-asking-age",
        "titleZh": "中国人对年龄的询问方法",
        "titleVi": "Cách hỏi tuổi của người Trung Quốc",
        "printedPage": 51,
        "pdfPage": 49,
        "summaryVi": "Tuổi thường được hỏi trong giao tiếp. Với trẻ dưới 10 tuổi dùng 几岁, với người gần tuổi dùng 多大, và với người lớn tuổi dùng 您今年多大年纪了 để thể hiện kính trọng.",
        "lessonAfter": 5,
    },
    {
        "id": "culture-chinese-names",
        "titleZh": "中国人姓名的特点",
        "titleVi": "Họ tên của người Trung Quốc",
        "printedPage": 93,
        "pdfPage": 91,
        "summaryVi": "Họ thường đứng trước tên. Họ có thể một hoặc nhiều chữ; khi xưng hô có thể đặt họ trước chức danh, như 李老师 hoặc 王医生.",
        "lessonAfter": 10,
    },
    {
        "id": "culture-communication-tools",
        "titleZh": "中国人经常使用的通信工具",
        "titleVi": "Các phương tiện liên lạc thường dùng của người Trung Quốc",
        "printedPage": 131,
        "pdfPage": 129,
        "summaryVi": "Sách giới thiệu điện thoại bàn và điện thoại di động, độ dài số điện thoại và cách đọc số theo từng chữ số; chữ số 1 thường đọc yāo để tránh nhầm.",
        "lessonAfter": 15,
    },
]


DIALOGUES: dict[int, list[dict[str, Any]]] = {
    1: [
        {"track": "01-1", "settingVi": "Chào hỏi khi gặp mặt", "turns": [("A", "你好！", "Chào anh!"), ("B", "你好！", "Chào anh!")]},
        {"track": "01-2", "settingVi": "Chào hỏi lịch sự và chào một nhóm", "turns": [("A", "您好！", "Chào ông!"), ("B", "你们好！", "Chào các anh chị!")]},
        {"track": "01-3", "settingVi": "Xin lỗi và đáp lại", "turns": [("A", "对不起！", "Xin lỗi!"), ("B", "没关系！", "Không sao đâu!")]},
    ],
    2: [
        {"track": "02-1", "settingVi": "Cảm ơn và đáp lại", "turns": [("A", "谢谢！", "Cảm ơn!"), ("B", "不谢！", "Không cần cảm ơn đâu!")]},
        {"track": "02-2", "settingVi": "Cảm ơn lịch sự", "turns": [("A", "谢谢你！", "Cảm ơn cô!"), ("B", "不客气！", "Đừng khách sáo!")]},
        {"track": "02-3", "settingVi": "Chào tạm biệt", "turns": [("A", "再见！", "Tạm biệt!"), ("B", "再见！", "Tạm biệt!")]},
    ],
    3: [
        {"track": "03-1", "settingVi": "Ở trường", "turns": [("A", "你叫什么名字？", "Cô tên gì?"), ("B", "我叫李月。", "Tôi tên là Lý Nguyệt.")]},
        {"track": "03-2", "settingVi": "Trong lớp học", "turns": [("A", "你是老师吗？", "Cô là giáo viên phải không?"), ("B", "我不是老师，我是学生。", "Không phải, tôi là học sinh.")]},
        {"track": "03-3", "settingVi": "Ở trường", "turns": [("A", "你是中国人吗？", "Bạn là người Trung Quốc phải không?"), ("B", "我不是中国人，我是美国人。", "Không phải, mình là người Mỹ.")]},
    ],
    4: [
        {"track": "04-1", "settingVi": "Trong lớp học", "turns": [("A", "她是谁？", "Cô ấy là ai vậy?"), ("B", "她是我的汉语老师，她叫李月。", "Đó là cô giáo tiếng Trung của tôi, cô tên là Lý Nguyệt.")]},
        {"track": "04-2", "settingVi": "Ở thư viện", "turns": [("A", "你是哪国人？", "Anh là người nước nào?"), ("B", "我是美国人。你呢？", "Tôi là người Mỹ. Còn cô?"), ("A", "我是中国人。", "Tôi là người Trung Quốc.")]},
        {"track": "04-3", "settingVi": "Xem ảnh", "turns": [("A", "他是谁？", "Anh ấy là ai?"), ("B", "他是我同学。", "Đó là bạn cùng lớp của tôi."), ("A", "她呢？她是你同学吗？", "Còn cô ấy? Cô ấy cũng là bạn cùng lớp của cô à?"), ("B", "她不是我同学，她是我朋友。", "Không phải, cô ấy là bạn tôi.")]},
    ],
    5: [
        {"track": "05-1", "settingVi": "Ở trường", "turns": [("A", "你家有几口人？", "Nhà anh có mấy người?"), ("B", "我家有三口人。", "Nhà tôi có ba người.")]},
        {"track": "05-2", "settingVi": "Trong văn phòng", "turns": [("A", "你女儿几岁了？", "Con gái cô mấy tuổi rồi?"), ("B", "她今年四岁了。", "Năm nay cháu bốn tuổi rồi.")]},
        {"track": "05-3", "settingVi": "Trong văn phòng", "turns": [("A", "李老师多大了？", "Cô Lý bao nhiêu tuổi rồi?"), ("B", "她今年五十岁了。", "Năm nay cô ấy 50 tuổi rồi."), ("A", "她女儿呢？", "Còn con gái cô ấy?"), ("B", "她女儿今年二十岁。", "Con gái cô ấy năm nay 20 tuổi.")]},
    ],
    6: [
        {"track": "06-1", "settingVi": "Ở trường", "turns": [("A", "你会说汉语吗？", "Em có biết nói tiếng Trung không?"), ("B", "我会说汉语。", "Em có biết."), ("A", "你妈妈会说汉语吗？", "Mẹ em biết nói tiếng Trung không?"), ("B", "她不会说。", "Mẹ em thì không.")]},
        {"track": "06-2", "settingVi": "Trong nhà bếp", "turns": [("A", "中国菜好吃吗？", "Món ăn Trung Quốc có ngon không?"), ("B", "中国菜很好吃。", "Rất ngon."), ("A", "你会做中国菜吗？", "Anh có biết nấu món Trung Quốc không?"), ("B", "我不会做。", "Tôi không biết.")]},
        {"track": "06-3", "settingVi": "Ở thư viện", "turns": [("A", "你会写汉字吗？", "Anh có biết viết chữ Hán không?"), ("B", "我会写。", "Tôi có biết."), ("A", "这个字怎么写？", "Vậy chữ này viết thế nào?"), ("B", "对不起，这个字我会读，不会写。", "Xin lỗi, chữ này tôi biết đọc nhưng không biết viết.")]},
    ],
    7: [
        {"track": "07-1", "settingVi": "Ở ngân hàng", "turns": [("A", "请问，今天几号？", "Xin hỏi hôm nay là ngày mấy?"), ("B", "今天九月一号。", "Ngày 1 tháng 9."), ("A", "今天星期几？", "Hôm nay là thứ mấy?"), ("B", "星期三。", "Thứ tư.")]},
        {"track": "07-2", "settingVi": "Xem lịch", "turns": [("A", "昨天是几月几号？", "Hôm qua là ngày mấy tháng mấy?"), ("B", "昨天是八月三十一号，星期二。", "Hôm qua là thứ ba, ngày 31 tháng 8."), ("A", "明天呢？", "Còn ngày mai?"), ("B", "明天是九月二号，星期四。", "Ngày mai là thứ năm, ngày 2 tháng 9.")]},
        {"track": "07-3", "settingVi": "Ở quán cà phê", "turns": [("A", "明天星期六，你去学校吗？", "Ngày mai là thứ bảy, bạn có đến trường không?"), ("B", "我去学校。", "Có, tôi đến trường."), ("A", "你去学校做什么？", "Bạn đến trường để làm gì?"), ("B", "我去学校看书。", "Để đọc sách.")]},
    ],
    8: [
        {"track": "08-1", "settingVi": "Ở quán ăn", "turns": [("A", "你想喝什么？", "Cô muốn uống gì?"), ("B", "我想喝茶。", "Tôi muốn uống trà."), ("A", "你想吃什么？", "Cô muốn dùng món gì?"), ("B", "我想吃米饭。", "Tôi muốn ăn cơm.")]},
        {"track": "08-2", "settingVi": "Trong phòng khách", "turns": [("A", "下午你想做什么？", "Buổi chiều bạn muốn làm gì?"), ("B", "下午我想去商店。", "Buổi chiều mình muốn đến cửa hàng."), ("A", "你想买什么？", "Bạn muốn mua gì?"), ("B", "我想买一个杯子。", "Mình muốn mua một cái ly.")]},
        {"track": "08-3", "settingVi": "Ở cửa hàng", "turns": [("A", "你好！这个杯子多少钱？", "Chào cô! Cái ly này bao nhiêu tiền?"), ("B", "二十八块。", "28 đồng."), ("A", "那个杯子多少钱？", "Còn cái ly đó?"), ("B", "那个杯子十八块钱。", "Ly đó 18 đồng.")]},
    ],
    9: [
        {"track": "09-1", "settingVi": "Ở nhà", "turns": [("A", "小猫在哪儿？", "Con mèo đâu rồi?"), ("B", "小猫在那儿。", "Nó ở đằng kia."), ("A", "小狗在哪儿？", "Còn con chó đâu?"), ("B", "小狗在椅子下面。", "Ở dưới ghế dựa.")]},
        {"track": "09-2", "settingVi": "Ở bến xe", "turns": [("A", "你在哪儿工作？", "Anh làm việc ở đâu?"), ("B", "我在学校工作。", "Tôi làm việc ở trường học."), ("A", "你儿子在哪儿工作？", "Vậy còn con trai anh?"), ("B", "我儿子在医院工作，他是医生。", "Con trai tôi làm việc ở bệnh viện, nó là bác sĩ.")]},
        {"track": "09-3", "settingVi": "Gọi điện thoại", "turns": [("A", "你爸爸在家吗？", "Cha cô có ở nhà không?"), ("B", "不在家。", "Không có."), ("A", "他在哪儿呢？", "Ông ấy đâu rồi?"), ("B", "他在医院。", "Ông ấy ở bệnh viện.")]},
    ],
    10: [
        {"track": "10-1", "settingVi": "Trong văn phòng", "turns": [("A", "桌子上有什么？", "Trên bàn có gì?"), ("B", "桌子上有一个电脑和一本书。", "Có một chiếc máy vi tính và một quyển sách."), ("A", "杯子在哪儿？", "Vậy cái ly đâu?"), ("B", "杯子在桌子里。", "Ở trong bàn.")]},
        {"track": "10-2", "settingVi": "Ở phòng tập thể dục", "turns": [("A", "前面那个人叫什么名字？", "Người ở phía trước tên gì?"), ("B", "她叫王方，在医院工作。", "Cô ấy tên là Vương Phương, làm việc ở bệnh viện."), ("A", "后面那个人呢？他叫什么名字？", "Còn người ở phía sau? Anh ấy tên gì?"), ("B", "他叫谢朋，在商店工作。", "Anh ấy tên Tạ Bằng, làm việc ở cửa hàng.")]},
        {"track": "10-3", "settingVi": "Ở thư viện", "turns": [("A", "这儿有人吗？", "Chỗ này có ai ngồi chưa?"), ("B", "没有。", "Chưa."), ("A", "我能坐这儿吗？", "Tôi có thể ngồi ở đây không?"), ("B", "请坐。", "Được, xin mời.")]},
    ],
    11: [
        {"track": "11-1", "settingVi": "Ở thư viện", "turns": [("A", "现在几点？", "Bây giờ là mấy giờ rồi?"), ("B", "现在十点十分。", "10 giờ 10 phút."), ("A", "中午几点吃饭？", "Mấy giờ thì ăn cơm trưa?"), ("B", "十二点吃饭。", "12 giờ ăn cơm.")]},
        {"track": "11-2", "settingVi": "Ở nhà", "turns": [("A", "爸爸什么时候回家？", "Chừng nào cha mới về đến nhà?"), ("B", "下午五点。", "5 giờ chiều."), ("A", "我们什么时候去看电影？", "Khi nào chúng ta đi xem phim?"), ("B", "六点三十分。", "6 giờ 30 phút.")]},
        {"track": "11-3", "settingVi": "Ở nhà", "turns": [("A", "我星期一去北京。", "Thứ hai tôi sẽ đi Bắc Kinh."), ("B", "你想在北京住几天？", "Anh định ở Bắc Kinh mấy ngày?"), ("A", "住三天。", "Ba ngày."), ("B", "星期五前能回家吗？", "Anh có thể về nhà trước thứ sáu không?"), ("A", "能。", "Có thể.")]},
    ],
    12: [
        {"track": "12-1", "settingVi": "Trên đường", "turns": [("A", "昨天北京的天气怎么样？", "Hôm qua thời tiết ở Bắc Kinh thế nào?"), ("B", "太热了。", "Nóng lắm."), ("A", "明天呢？明天天气怎么样？", "Còn ngày mai? Thời tiết ngày mai thế nào?"), ("B", "明天天气很好，不冷不热。", "Ngày mai thời tiết rất đẹp, không lạnh cũng không nóng.")]},
        {"track": "12-2", "settingVi": "Ở phòng tập thể dục", "turns": [("A", "今天会下雨吗？", "Hôm nay có mưa không?"), ("B", "今天不会下雨。", "Hôm nay không mưa."), ("A", "王小姐今天会来吗？", "Hôm nay cô Vương có đến không?"), ("B", "不会来，天气太冷了。", "Không đến, trời lạnh quá.")]},
        {"track": "12-3", "settingVi": "Trong phòng bệnh", "turns": [("A", "你身体怎么样？", "Sức khỏe của anh thế nào?"), ("B", "我身体不太好。天气太热了，不爱吃饭。", "Tôi không được khỏe lắm. Trời nóng quá, tôi chẳng muốn ăn cơm."), ("A", "你多吃些水果，多喝水。", "Anh hãy ăn thêm trái cây và uống thêm nước."), ("B", "谢谢你，医生。", "Cảm ơn bác sĩ.")]},
    ],
    13: [
        {"track": "13-1", "settingVi": "Gọi điện thoại", "turns": [("A", "喂，你在做什么呢？", "A lô, anh đang làm gì?"), ("B", "我在看书呢。", "Tôi đang đọc sách."), ("A", "大卫也在看书吗？", "David cũng đang đọc sách à?"), ("B", "他没看书，他在学做中国菜呢。", "Không phải, anh ấy đang học nấu món ăn Trung Quốc.")]},
        {"track": "13-2", "settingVi": "Ở quán cà phê", "turns": [("A", "昨天上午你在做什么呢？", "Chị làm gì vào sáng hôm qua?"), ("B", "我在睡觉呢。你呢？", "Tôi ngủ. Còn cô?"), ("A", "我在家看电视呢。你喜欢看电视吗？", "Tôi xem ti vi ở nhà. Chị có thích xem ti vi không?"), ("B", "我不喜欢看电视，我喜欢看电影。", "Không, tôi thích xem phim.")]},
        {"track": "13-3", "settingVi": "Trong văn phòng của trường", "turns": [("A", "八二三零四一五五，这是李老师的电话吗？", "82304155, đây là số điện thoại của cô Lý phải không?"), ("B", "不是。她的电话是八二三零四一五六。", "Không phải. Số của cô ấy là 82304156."), ("A", "好，我现在给她打电话。", "Được, bây giờ tôi gọi điện cho cô ấy."), ("B", "她在工作呢，你下午打吧。", "Cô ấy đang làm việc, buổi chiều anh hãy gọi.")]},
    ],
    14: [
        {"track": "14-1", "settingVi": "Ở ký túc xá", "turns": [("A", "昨天上午你去哪儿了？", "Sáng hôm qua bạn đi đâu?"), ("B", "我去商店买东西了。", "Mình đến cửa hàng mua đồ."), ("A", "你买什么了？", "Bạn mua gì?"), ("B", "我买了一点儿苹果。", "Mình mua một ít táo.")]},
        {"track": "14-2", "settingVi": "Trong công ty", "turns": [("A", "你看见张先生了吗？", "Anh có thấy ông Trương không?"), ("B", "看见了，他去学开车了。", "Có, ông ấy đi học lái xe rồi."), ("A", "他什么时候能回来？", "Khi nào ông ấy quay lại?"), ("B", "四十分钟后回来。", "40 phút nữa.")]},
        {"track": "14-3", "settingVi": "Trước cửa hàng", "turns": [("A", "王方的衣服太漂亮了！", "Quần áo của Vương Phương đẹp quá!"), ("B", "是啊，她买了不少衣服。", "Đúng vậy, cô ấy mua nhiều quần áo lắm."), ("A", "你买什么了？", "Còn bạn mua những gì?"), ("B", "我没买，这些都是王方的东西。", "Mình không mua gì cả, những thứ này đều là đồ của Vương Phương.")]},
    ],
    15: [
        {"track": "15-1", "settingVi": "Ở bàn ăn", "turns": [("A", "你和李小姐是什么时候认识的？", "Cô và cô Lý quen nhau khi nào?"), ("B", "我们是二零一一年九月认识的。", "Chúng tôi quen nhau vào tháng 9 năm 2011."), ("A", "你们在哪儿认识的？", "Các cô quen nhau ở đâu?"), ("B", "我们是在学校认识的，她是我大学同学。", "Ở trường. Cô ấy là bạn cùng lớp đại học của tôi.")]},
        {"track": "15-2", "settingVi": "Trước khách sạn", "turns": [("A", "你们是怎么来饭店的？", "Anh chị đến khách sạn bằng cách nào?"), ("B", "我们是坐出租车来的。", "Chúng tôi đi taxi đến."), ("A", "李先生呢？", "Còn ông Lý?"), ("B", "他是和朋友一起开车来的。", "Ông ấy và bạn cùng lái xe đến đây.")]},
        {"track": "15-3", "settingVi": "Trong công ty", "turns": [("A", "很高兴认识您！李小姐。", "Cô Lý, rất vui được biết cô."), ("B", "认识你我也很高兴！", "Tôi cũng rất vui được biết anh!"), ("A", "听张先生说，您是坐飞机来北京的？", "Nghe ông Trương nói cô đáp máy bay đến Bắc Kinh, phải không?"), ("B", "是的。", "Đúng vậy.")]},
    ],
}


def source_pdf_page(printed_page: int) -> int:
    return printed_page if printed_page <= 43 else printed_page - 2


def dialogue_printed_page(lesson: dict[str, Any], dialogue_index: int) -> int:
    start = int(lesson["printedPages"][0])
    if lesson["number"] <= 2:
        return start
    return start if dialogue_index == 1 else start + 1


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


def build_data() -> dict[str, Any]:
    lexemes: list[dict[str, Any]] = []
    grammar_points: list[dict[str, Any]] = []
    dialogues: list[dict[str, Any]] = []
    media_assets: list[dict[str, Any]] = []
    pronunciation_topics: list[dict[str, Any]] = []
    assessment_items: list[dict[str, Any]] = []
    characters: list[dict[str, Any]] = []
    lesson_documents: list[dict[str, Any]] = []
    lexeme_refs_by_lesson: dict[int, list[str]] = {}
    grammar_refs_by_lesson: dict[int, list[str]] = {}
    dialogue_refs_by_lesson: dict[int, list[str]] = {}
    media_refs_by_lesson: dict[int, list[str]] = {}
    character_refs_by_lesson: dict[int, list[str]] = {}
    assessment_refs_by_lesson: dict[int, list[str]] = {}

    seen_characters: set[str] = set()

    for lesson in LESSONS:
        lesson_number = int(lesson["number"])
        lexeme_refs: list[str] = []
        for ordinal, item in enumerate(lesson["vocabulary"], start=1):
            entity_id = f"lex-hsk1-l{lesson_number:02d}-{ordinal:02d}"
            ref = f"lexeme:{entity_id}"
            lexeme_refs.append(ref)
            simplified = item["simplified"]
            entity = {
                "id": entity_id,
                "simplified": simplified,
                "pinyin": pinyin_text(simplified),
                "pinyinNumeric": pinyin_text(simplified, numeric=True),
                "wordClass": item["wordClass"],
                "kind": item["kind"],
                "senses": [
                    {
                        "id": f"sense-hsk1-l{lesson_number:02d}-{ordinal:02d}-01",
                        "meaningVi": item["meaningVi"],
                        "register": "neutral",
                    }
                ],
                "source": {
                    "book": "Giáo trình chuẩn HSK 1",
                    "lessonNumber": lesson_number,
                    "sourceOrdinal": ordinal,
                    "printedPages": lesson["printedPages"],
                    "pdfPages": lesson["pdfPages"],
                    "markedWithAsterisk": item["sourceAsterisk"],
                    "relatedForm": item["relatedForm"],
                },
                "audioRefs": [],
                "status": "review",
            }
            lexemes.append(entity)
        lexeme_refs_by_lesson[lesson_number] = lexeme_refs

        grammar_refs: list[str] = []
        for ordinal, item in enumerate(lesson["grammar"], start=1):
            entity_id = f"grammar-hsk1-l{lesson_number:02d}-{ordinal:02d}"
            grammar_refs.append(f"grammar-point:{entity_id}")
            grammar_points.append(
                {
                    "id": entity_id,
                    "kind": "grammar",
                    "titleVi": item["titleVi"],
                    "formula": item["formula"],
                    "explanationVi": item["explanationVi"],
                    "exampleDialogueRefs": [
                        f"dialogue:dialogue-hsk1-l{lesson_number:02d}-01"
                    ],
                    "source": {
                        "lessonNumber": lesson_number,
                        "printedPages": lesson["printedPages"],
                        "pdfPages": lesson["pdfPages"],
                        "sourceStatus": lesson.get("grammarSourceStatus", "directly-supported"),
                    },
                    "status": "review",
                }
            )
        grammar_refs_by_lesson[lesson_number] = grammar_refs

        dialogue_refs: list[str] = []
        media_refs: list[str] = []
        for dialogue_index, source_dialogue in enumerate(DIALOGUES[lesson_number], start=1):
            dialogue_id = f"dialogue-hsk1-l{lesson_number:02d}-{dialogue_index:02d}"
            media_id = f"media-hsk1-track-{source_dialogue['track']}"
            dialogue_refs.append(f"dialogue:{dialogue_id}")
            media_refs.append(f"media:{media_id}")
            printed_page = dialogue_printed_page(lesson, dialogue_index)
            turns = []
            for turn_index, (speaker, hanzi, translation_vi) in enumerate(
                source_dialogue["turns"], start=1
            ):
                turns.append(
                    {
                        "id": f"turn-hsk1-l{lesson_number:02d}-d{dialogue_index:02d}-{turn_index:02d}",
                        "speakerId": f"speaker-{speaker.lower()}",
                        "hanzi": hanzi,
                        "pinyin": pinyin_text(hanzi),
                        "translationVi": translation_vi,
                    }
                )
            dialogues.append(
                {
                    "id": dialogue_id,
                    "titleVi": f"Bài {lesson_number} - Hội thoại {dialogue_index}",
                    "settingVi": source_dialogue["settingVi"],
                    "register": "neutral",
                    "speakers": [
                        {"id": "speaker-a", "displayName": "A"},
                        {"id": "speaker-b", "displayName": "B"},
                    ],
                    "turns": turns,
                    "fullAudioRef": f"media:{media_id}",
                    "source": {
                        "trackId": source_dialogue["track"],
                        "printedPage": printed_page,
                        "pdfPage": source_pdf_page(printed_page),
                    },
                    "status": "review",
                }
            )
            media_assets.append(
                {
                    "id": media_id,
                    "type": "audio",
                    "purpose": "textbook-dialogue-track",
                    "sourceTrackId": source_dialogue["track"],
                    "lessonNumber": lesson_number,
                    "printedPage": printed_page,
                    "pdfPage": source_pdf_page(printed_page),
                    "availability": "missing-source-audio",
                    "uri": None,
                    "reviewStatus": "blocked-missing-file",
                    "noteVi": "PDF chỉ ghi mã track; file MP3/CD không nằm trong tài liệu được cung cấp.",
                }
            )
        dialogue_refs_by_lesson[lesson_number] = dialogue_refs
        media_refs_by_lesson[lesson_number] = media_refs

        pronunciation_id = f"pronunciation-hsk1-l{lesson_number:02d}"
        pronunciation_topics.append(
            {
                "id": pronunciation_id,
                "lessonNumber": lesson_number,
                "topicsVi": lesson["pronunciation"],
                "source": {
                    "printedPages": lesson["printedPages"],
                    "pdfPages": lesson["pdfPages"],
                },
                "audioStatus": "missing-source-audio",
                "status": "review",
            }
        )

        char_refs: list[str] = []
        for glyph in lesson["characters"]:
            char_id = f"char-hsk1-u{ord(glyph):04x}"
            char_refs.append(f"character:{char_id}")
            if glyph in seen_characters:
                continue
            seen_characters.add(glyph)
            characters.append(
                {
                    "id": char_id,
                    "glyph": glyph,
                    "unicodeCodePoint": f"U+{ord(glyph):04X}",
                    "pinyin": pinyin_text(glyph),
                    "meaningVi": CHARACTER_MEANINGS[glyph],
                    "sourceLessonNumber": lesson_number,
                    "sourceSummaryPrintedPage": 140,
                    "sourceSummaryPdfPage": 138,
                    "strokeData": {
                        "provider": "hanzi-writer",
                        "externalKey": glyph,
                        "bundled": False,
                    },
                    "sourceStrokeDiagramStatus": "scan-only-not-digitized",
                    "status": "review",
                }
            )
        character_refs_by_lesson[lesson_number] = char_refs

        if len(lesson["vocabulary"]) < 4:
            raise ValueError(f"Lesson {lesson_number} needs at least four vocabulary items")
        meaning_item_id = f"assessment-hsk1-l{lesson_number:02d}-meaning"
        pinyin_item_id = f"assessment-hsk1-l{lesson_number:02d}-pinyin"
        assessment_refs_by_lesson[lesson_number] = [
            f"assessment-item:{meaning_item_id}",
            f"assessment-item:{pinyin_item_id}",
        ]
        option_lexemes: list[tuple[int, dict[str, Any]]] = []
        option_meanings: set[str] = set()
        option_pinyin: set[str] = set()
        for candidate_index, candidate in enumerate(lesson["vocabulary"]):
            candidate_pinyin = pinyin_text(candidate["simplified"])
            if candidate["meaningVi"] in option_meanings or candidate_pinyin in option_pinyin:
                continue
            option_lexemes.append((candidate_index, candidate))
            option_meanings.add(candidate["meaningVi"])
            option_pinyin.add(candidate_pinyin)
            if len(option_lexemes) == 4:
                break
        if len(option_lexemes) != 4:
            raise ValueError(f"Lesson {lesson_number} needs four distinct assessment options")
        assessment_items.append(
            {
                "id": meaning_item_id,
                "type": "multiple-choice",
                "skill": "reading",
                "difficulty": 1,
                "instructionVi": "Chọn nghĩa đúng",
                "prompt": {
                    "kind": "lexeme",
                    "ref": lexeme_refs[option_lexemes[0][0]],
                    "display": "hanzi",
                },
                "options": [
                    {
                        "id": f"option-{meaning_item_id}-{index}",
                        "text": candidate["meaningVi"],
                    }
                    for index, (_, candidate) in enumerate(option_lexemes, start=1)
                ],
                "correctResponse": {"optionId": f"option-{meaning_item_id}-1"},
                "provenance": "derived-from-source-vocabulary",
                "status": "draft",
            }
        )
        assessment_items.append(
            {
                "id": pinyin_item_id,
                "type": "select-pinyin",
                "skill": "reading",
                "difficulty": 1,
                "instructionVi": "Chọn pinyin đúng",
                "prompt": {
                    "kind": "lexeme",
                    "ref": lexeme_refs[option_lexemes[1][0]],
                    "display": "hanzi",
                },
                "options": [
                    {
                        "id": f"option-{pinyin_item_id}-{index}",
                        "text": pinyin_text(candidate["simplified"]),
                    }
                    for index, (_, candidate) in enumerate(option_lexemes, start=1)
                ],
                "correctResponse": {"optionId": f"option-{pinyin_item_id}-2"},
                "provenance": "derived-from-source-vocabulary",
                "status": "draft",
            }
        )

    for lesson in LESSONS:
        lesson_number = int(lesson["number"])
        objective_prefix = f"objective-hsk1-l{lesson_number:02d}"
        section_prefix = f"section-hsk1-l{lesson_number:02d}"
        required_section_ids = [
            f"{section_prefix}-introduction",
            f"{section_prefix}-dialogue",
            f"{section_prefix}-vocabulary",
            f"{section_prefix}-pronunciation",
            f"{section_prefix}-writing",
            f"{section_prefix}-practice",
        ]
        if grammar_refs_by_lesson[lesson_number]:
            required_section_ids.append(f"{section_prefix}-grammar")
        source_notes = [
            "Dữ liệu được chuyển đổi từ bản PDF scan do người dùng cung cấp.",
            "Pinyin ở các câu hội thoại được tạo tự động và cần được biên tập ngôn ngữ kiểm tra trước khi xuất bản.",
            "Bài tập trắc nghiệm là dữ liệu suy diễn từ từ vựng nguồn, không phải bản chép nguyên văn bài tập trong sách.",
        ]
        if lesson.get("missingPrintedPages"):
            source_notes.append(
                "Bản scan thiếu trang in 44-45; dữ liệu ngữ pháp Bài 5 được phục dựng từ mục lục và đánh dấu riêng."
            )
        sections = [
            {
                "id": f"{section_prefix}-introduction",
                "type": "introduction",
                "titleVi": "Giới thiệu",
                "required": True,
                "estimatedMinutes": 1,
                "content": {
                    "kickerVi": f"Bài {lesson_number} · HSK 1",
                    "heroHanzi": lesson["titleZh"],
                    "summaryVi": lesson["titleVi"],
                    "sourcePrintedPages": lesson["printedPages"],
                    "sourcePdfPages": lesson["pdfPages"],
                },
            },
            {
                "id": f"{section_prefix}-dialogue",
                "type": "dialogue",
                "titleVi": "Bài học và hội thoại",
                "required": True,
                "estimatedMinutes": 5,
                "itemRefs": dialogue_refs_by_lesson[lesson_number],
                "presentation": {
                    "showPinyinByDefault": True,
                    "showTranslationByDefault": True,
                    "allowPlayAll": False,
                    "audioUnavailableReason": "missing-source-audio",
                },
            },
            {
                "id": f"{section_prefix}-vocabulary",
                "type": "vocabulary",
                "titleVi": "Từ mới",
                "required": True,
                "estimatedMinutes": 5,
                "itemRefs": lexeme_refs_by_lesson[lesson_number],
            },
            {
                "id": f"{section_prefix}-grammar",
                "type": "grammar",
                "titleVi": "Chú thích ngữ pháp",
                "required": bool(grammar_refs_by_lesson[lesson_number]),
                "estimatedMinutes": 4 if grammar_refs_by_lesson[lesson_number] else 0,
                "itemRefs": grammar_refs_by_lesson[lesson_number],
                "sourceAvailability": (
                    "reconstructed-from-toc"
                    if lesson.get("grammarSourceStatus")
                    else "available"
                    if grammar_refs_by_lesson[lesson_number]
                    else "not-present-in-this-lesson"
                ),
            },
            {
                "id": f"{section_prefix}-listening",
                "type": "listening",
                "titleVi": "Nghe theo track giáo trình",
                "required": False,
                "estimatedMinutes": 0,
                "itemRefs": media_refs_by_lesson[lesson_number],
                "availability": "blocked-missing-audio-files",
            },
            {
                "id": f"{section_prefix}-pronunciation",
                "type": "pronunciation",
                "titleVi": "Phần ghép âm",
                "required": True,
                "estimatedMinutes": 3,
                "itemRefs": [f"pronunciation-topic:pronunciation-hsk1-l{lesson_number:02d}"],
            },
            {
                "id": f"{section_prefix}-writing",
                "type": "writing",
                "titleVi": "Chữ Hán",
                "required": True,
                "estimatedMinutes": 4,
                "itemRefs": character_refs_by_lesson[lesson_number],
                "strokeAssetStatus": "use-hanzi-writer-runtime-data",
            },
            {
                "id": f"{section_prefix}-practice",
                "type": "practice",
                "titleVi": "Luyện tập và vận dụng",
                "required": True,
                "estimatedMinutes": 4,
                "itemRefs": assessment_refs_by_lesson[lesson_number],
                "sourceActivityTypes": [
                    "warm-up-image-match",
                    "role-play-source-dialogues",
                    "answer-situational-questions",
                    "pair-or-group-application",
                ],
                "provenance": {
                    "sourceActivities": "summarized-from-book",
                    "assessmentItems": "derived-not-verbatim",
                },
            },
            {
                "id": f"{section_prefix}-flashcard",
                "type": "flashcard",
                "titleVi": "Flashcard",
                "required": False,
                "estimatedMinutes": 3,
                "itemRefs": lexeme_refs_by_lesson[lesson_number],
                "generatedFromSectionId": f"{section_prefix}-vocabulary",
            },
            {
                "id": f"{section_prefix}-completion",
                "type": "completion",
                "titleVi": "Hoàn thành",
                "required": True,
                "estimatedMinutes": 0,
                "summary": {
                    "titleVi": f"Hoàn thành Bài {lesson_number}",
                    "messageVi": f"Bạn đã hoàn thành nội dung {lesson['titleZh']}",
                },
            },
        ]
        lesson_documents.append(
            {
                "$schema": "../schemas/lesson.schema.json",
                "schemaVersion": "1.0.0",
                "id": f"lesson-hsk1-{lesson_number:02d}",
                "slug": f"hsk1-bai-{lesson_number:02d}-{lesson['slug']}",
                "profile": "hsk-foundation",
                "status": "review",
                "metadata": {
                    "courseId": "course-hsk-standard-1",
                    "levelId": "hsk-1",
                    "lessonNumber": lesson_number,
                    "titleVi": lesson["titleVi"],
                    "titleZh": lesson["titleZh"],
                    "heroHanzi": lesson["titleZh"],
                    "summaryVi": f"Dữ liệu bài {lesson_number} được chuyển đổi từ Giáo trình chuẩn HSK 1.",
                    "estimatedMinutes": sum(section["estimatedMinutes"] for section in sections),
                    "skills": ["listening", "speaking", "reading", "writing"],
                    "source": {
                        "printedPages": lesson["printedPages"],
                        "pdfPages": lesson["pdfPages"],
                        "missingPrintedPages": lesson.get("missingPrintedPages", []),
                    },
                },
                "access": {"tier": "free", "previewSectionIds": []},
                "objectives": [
                    {
                        "id": f"{objective_prefix}-dialogue",
                        "skill": "speaking",
                        "descriptionVi": f"Thực hiện các mẫu hội thoại trọng tâm của Bài {lesson_number}.",
                    },
                    {
                        "id": f"{objective_prefix}-vocabulary",
                        "skill": "reading",
                        "descriptionVi": f"Nhận biết {len(lexeme_refs_by_lesson[lesson_number])} mục từ mới của bài.",
                    },
                    {
                        "id": f"{objective_prefix}-writing",
                        "skill": "writing",
                        "descriptionVi": f"Luyện viết {len(character_refs_by_lesson[lesson_number])} chữ Hán trọng tâm.",
                    },
                ],
                "prerequisites": [] if lesson_number == 1 else [f"lesson:lesson-hsk1-{lesson_number - 1:02d}"],
                "sections": sections,
                "completionRule": {
                    "type": "combined",
                    "requiredSectionIds": required_section_ids,
                    "minimumPracticeScorePercent": 50,
                    "allowManualCompletion": False,
                },
                "editorial": {
                    "contentVersion": 1,
                    "languageReviewStatus": "pending",
                    "audioReviewStatus": "blocked-missing-file",
                    "reviewerIds": [],
                    "sourceNotes": source_notes,
                    "updatedAt": UPDATED_AT,
                },
            }
        )

    curriculum = {
        "schemaVersion": "1.0.0",
        "id": "curriculum-hsk-standard-course-1",
        "titleVi": "Giáo trình chuẩn HSK 1",
        "titleZh": "HSK 标准教程 1",
        "locale": {"interface": "vi-VN", "learning": "zh-CN"},
        "lessonRefs": [f"lesson:lesson-hsk1-{lesson['number']:02d}" for lesson in LESSONS],
        "cultureNoteRefs": [f"culture-note:{item['id']}" for item in CULTURE_NOTES],
        "counts": {
            "lessons": len(LESSONS),
            "indexedVocabularyItems": len(lexemes),
            "dialogues": len(dialogues),
            "grammarPoints": len(grammar_points),
            "pronunciationTopicGroups": len(pronunciation_topics),
            "characters": len(characters),
            "cultureNotes": len(CULTURE_NOTES),
            "derivedAssessmentItems": len(assessment_items),
            "referencedAudioTracks": len(media_assets),
        },
        "status": "review",
    }

    return {
        "lexemes": lexemes,
        "grammarPoints": grammar_points,
        "dialogues": dialogues,
        "mediaAssets": media_assets,
        "pronunciationTopics": pronunciation_topics,
        "assessmentItems": assessment_items,
        "characters": characters,
        "lessons": lesson_documents,
        "curriculum": curriculum,
    }


def collect_entity_ids(data: dict[str, Any]) -> set[str]:
    ids: set[str] = set()
    entity_prefixes = {
        "lexemes": "lexeme",
        "grammarPoints": "grammar-point",
        "dialogues": "dialogue",
        "mediaAssets": "media",
        "pronunciationTopics": "pronunciation-topic",
        "assessmentItems": "assessment-item",
        "characters": "character",
        "lessons": "lesson",
    }
    for key, prefix in entity_prefixes.items():
        for entity in data[key]:
            ids.add(f"{prefix}:{entity['id']}")
    for note in CULTURE_NOTES:
        ids.add(f"culture-note:{note['id']}")
    return ids


def iter_refs(value: Any):
    if isinstance(value, dict):
        for key, child in value.items():
            if key.endswith("Ref") and isinstance(child, str):
                yield child
            elif key.endswith("Refs") and isinstance(child, list):
                for item in child:
                    if isinstance(item, str):
                        yield item
            else:
                yield from iter_refs(child)
    elif isinstance(value, list):
        for child in value:
            yield from iter_refs(child)


def validate_data(data: dict[str, Any]) -> dict[str, Any]:
    ids = collect_entity_ids(data)
    all_plain_ids = [entity_id.split(":", 1)[1] for entity_id in ids]
    if len(all_plain_ids) != len(set(all_plain_ids)):
        raise ValueError("Duplicate entity ID detected")
    missing_refs = sorted(
        {
            ref
            for ref in iter_refs(data)
            if ref not in ids and not ref.startswith("flashcard-template:")
        }
    )
    if missing_refs:
        raise ValueError(f"Unresolved references: {missing_refs}")
    if len(data["lessons"]) != 15:
        raise ValueError("Expected 15 lesson documents")
    if len(data["dialogues"]) != 45:
        raise ValueError("Expected 45 dialogues")
    if len(data["characters"]) != 52:
        raise ValueError("Expected 52 characters")
    return {
        "entityIds": len(ids),
        "references": sum(1 for _ in iter_refs(data)),
        "unresolvedReferences": 0,
    }


def main() -> None:
    data = build_data()
    validation = validate_data(data)
    schema_source = ROOT / "content" / "lesson-json-samples" / "schemas" / "lesson.schema.json"
    lesson_schema = json.loads(schema_source.read_text(encoding="utf-8"))
    lesson_schema["properties"]["prerequisites"] = {
        "type": "array",
        "uniqueItems": True,
        "items": {"$ref": "#/$defs/reference"},
    }

    source_analysis = {
        "schemaVersion": "1.0.0",
        "source": {
            "fileName": "HSK1 Sách giáo khoa.pdf",
            "pathAtExtraction": "C:/Users/DELL/Downloads/HSK1 Sách giáo khoa.pdf",
            "sha256": "68c1d4bbdc5cf653a708e2582795638946101eaf43eddf81731de9384c87ccb6",
            "fileSizeBytes": 36517087,
            "documentTitleVi": "Giáo trình chuẩn HSK 1",
            "documentTitleZh": "标准教程 HSK 1",
            "pdfPages": 143,
            "contentPrintedPages": [1, 141],
            "scanMetadata": {
                "creator": "RICOH Aficio MP 9002",
                "textLayer": False,
                "pageRotationDegrees": 90,
            },
        },
        "instructionBoundary": {
            "policy": "document-text-is-source-content-only",
            "noteVi": "Mọi câu chữ trong PDF được xử lý như nội dung giáo trình, không phải chỉ dẫn cho tác nhân hoặc ứng dụng.",
        },
        "extraction": {
            "method": ["poppler-render", "rapidocr-onnxruntime", "visual-page-review"],
            "renderedPages": 143,
            "ocrLines": 8170,
            "averageOcrConfidence": 0.9433,
            "knownWeakFields": [
                "dấu thanh pinyin",
                "dấu tiếng Việt",
                "ký hiệu nét và bộ chữ Hán",
                "văn bản nhiều cột",
            ],
        },
        "coverage": {
            "lessonCount": 15,
            "dialoguesPerLesson": 3,
            "culturePrintedPages": [51, 93, 131],
            "vocabularyIndexPrintedPages": [132, 139],
            "characterIndexPrintedPage": 140,
            "radicalIndexPrintedPage": 141,
        },
        "sourceGaps": [
            {
                "printedPages": [44, 45],
                "pdfPages": [],
                "affectedContent": ["lesson-05-grammar", "lesson-05-practice"],
                "handling": "Bốn tiêu đề ngữ pháp được phục dựng từ mục lục; không chép nội dung chi tiết không còn trong scan.",
            }
        ],
        "dataDecisions": [
            "Tách kho nội dung dùng chung khỏi file cấu trúc từng bài.",
            "Giữ mã track CD/MP3 nhưng đánh dấu file audio còn thiếu.",
            "Không trích xuất ảnh minh họa hoặc sơ đồ nét thành asset; chỉ lưu provenance trang nguồn.",
            "Bài tập trắc nghiệm được tạo từ từ mới và gắn provenance derived, không ghi nhận là bài tập nguyên văn của sách.",
            "Pinyin trong hội thoại được tạo tự động và giữ trạng thái chờ biên tập viên ngôn ngữ duyệt.",
        ],
        "reviewStatus": {
            "structure": "verified",
            "lessonTitles": "verified",
            "dialogueHanzi": "review",
            "vocabularyMeaningsVi": "review",
            "pinyin": "pending-language-review",
            "audio": "blocked-missing-files",
        },
        "generatedAt": UPDATED_AT,
    }

    write_json(OUTPUT / "schemas" / "lesson.schema.json", lesson_schema)
    write_json(OUTPUT / "source-analysis.json", source_analysis)
    write_json(OUTPUT / "curriculum.json", data["curriculum"])
    write_json(
        OUTPUT / "shared" / "lexemes.json",
        {"schemaVersion": "1.0.0", "entityType": "lexeme", "items": data["lexemes"]},
    )
    write_json(
        OUTPUT / "shared" / "grammar-points.json",
        {"schemaVersion": "1.0.0", "entityType": "grammar-point", "items": data["grammarPoints"]},
    )
    write_json(
        OUTPUT / "shared" / "dialogues.json",
        {"schemaVersion": "1.0.0", "entityType": "dialogue", "items": data["dialogues"]},
    )
    write_json(
        OUTPUT / "shared" / "pronunciation-topics.json",
        {"schemaVersion": "1.0.0", "entityType": "pronunciation-topic", "items": data["pronunciationTopics"]},
    )
    write_json(
        OUTPUT / "shared" / "characters.json",
        {"schemaVersion": "1.0.0", "entityType": "character", "items": data["characters"]},
    )
    write_json(
        OUTPUT / "shared" / "culture-notes.json",
        {"schemaVersion": "1.0.0", "entityType": "culture-note", "items": CULTURE_NOTES},
    )
    write_json(
        OUTPUT / "shared" / "media-assets.json",
        {"schemaVersion": "1.0.0", "entityType": "media", "items": data["mediaAssets"]},
    )
    write_json(
        OUTPUT / "shared" / "assessment-items.json",
        {"schemaVersion": "1.0.0", "entityType": "assessment-item", "items": data["assessmentItems"]},
    )
    for lesson in data["lessons"]:
        lesson_number = int(lesson["metadata"]["lessonNumber"])
        write_json(OUTPUT / "lessons" / f"lesson-{lesson_number:02d}.json", lesson)

    files = [
        {"path": "schemas/lesson.schema.json", "kind": "schema"},
        {"path": "source-analysis.json", "kind": "source-analysis"},
        {"path": "curriculum.json", "kind": "curriculum"},
        {"path": "shared/lexemes.json", "kind": "shared-content", "entity": "lexeme"},
        {"path": "shared/grammar-points.json", "kind": "shared-content", "entity": "grammar-point"},
        {"path": "shared/dialogues.json", "kind": "shared-content", "entity": "dialogue"},
        {"path": "shared/pronunciation-topics.json", "kind": "shared-content", "entity": "pronunciation-topic"},
        {"path": "shared/characters.json", "kind": "shared-content", "entity": "character"},
        {"path": "shared/culture-notes.json", "kind": "shared-content", "entity": "culture-note"},
        {"path": "shared/media-assets.json", "kind": "shared-content", "entity": "media"},
        {"path": "shared/assessment-items.json", "kind": "shared-content", "entity": "assessment-item"},
    ] + [
        {"path": f"lessons/lesson-{lesson['number']:02d}.json", "kind": "lesson", "lessonNumber": lesson["number"]}
        for lesson in LESSONS
    ]
    manifest = {
        "schemaVersion": "1.0.0",
        "bundleId": "hsk1-standard-course-textbook-v1",
        "title": "Bộ dữ liệu JSON từ Giáo trình chuẩn HSK 1",
        "description": "Bộ dữ liệu chuẩn hóa từ PDF scan: 15 bài, kho nội dung dùng chung, provenance và bài tập mẫu suy diễn.",
        "locale": {"interface": "vi-VN", "learning": "zh-CN", "pinyinSystem": "hanyu-pinyin-diacritic"},
        "sourceRef": "source-analysis.json",
        "curriculumRef": "curriculum.json",
        "files": files,
        "validation": validation,
        "publicationBlockers": [
            "Cần biên tập viên tiếng Trung duyệt lại pinyin và bản dịch.",
            "Cần bổ sung file audio tương ứng với 45 mã track.",
            "Cần quyết định cách xử lý phần ngữ pháp Bài 5 do bản scan thiếu trang in 44-45.",
        ],
        "generatedAt": UPDATED_AT,
    }
    write_json(OUTPUT / "manifest.json", manifest)
    print(json.dumps({"output": str(OUTPUT), "counts": data["curriculum"]["counts"], "validation": validation}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
