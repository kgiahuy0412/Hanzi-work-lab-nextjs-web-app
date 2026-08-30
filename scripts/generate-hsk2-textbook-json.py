from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

from pypinyin import Style, lazy_pinyin


SCHEMA_VERSION = "1.0.0"
BUNDLE_ID = "hsk2-standard-course-textbook-vi-v1"
CJK_RE = re.compile(r"[\u3400-\u9fff]")
CJK_RUN_RE = re.compile(r"[\u3400-\u9fff（）()]+")
TRACK_RE = re.compile(r"(?<!\d)(\d{2})\s*[-._]?\s*([1-4])(?!\d)")
VOCAB_ANCHOR_RE = re.compile(r"^\s*(\d{1,2})\s*[.．、]\s*(.*[\u3400-\u9fff].*)$")
NOISE_PREFIXES = ("Scanned by ", "www.nhantriviet.com", "/GiaoTrinhChuanHSK")


LESSONS = [
    (1, 15, "九月去北京旅游最好。", "Nếu đi Bắc Kinh để du lịch thì tốt nhất là đi vào tháng chín."),
    (2, 23, "我每天六点起床。", "Hằng ngày tôi thức dậy lúc 6 giờ."),
    (3, 31, "左边那个红色的是我的。", "Ly màu đỏ ở bên trái là của tôi."),
    (4, 39, "这个工作是他帮我介绍的。", "Ông ấy đã giới thiệu giúp tôi công việc này."),
    (5, 47, "就买这件吧。", "Mua chiếc áo này đi."),
    (6, 55, "你怎么不吃了？", "Sao anh không ăn nữa?"),
    (7, 63, "你家离公司远吗？", "Nhà chị có ở xa công ty không?"),
    (8, 71, "让我想想再告诉你。", "Để mình suy nghĩ rồi sẽ nói cho bạn biết."),
    (9, 79, "题太多，我没做完。", "Câu hỏi quá nhiều nên mình không làm hết."),
    (10, 87, "别找了，手机在桌子上呢。", "Đừng tìm nữa, điện thoại di động ở trên bàn kìa."),
    (11, 95, "他比我大三岁。", "Anh ấy lớn hơn mình ba tuổi."),
    (12, 103, "你穿得太少了。", "Anh mặc ít quần áo quá."),
    (13, 111, "门开着呢。", "Cửa đang mở."),
    (14, 119, "你看过那个电影吗？", "Cậu đã từng xem phim đó chưa?"),
    (15, 127, "新年就要到了。", "Năm mới sắp đến rồi."),
]

GRAMMAR_TOPICS = {
    1: [("助动词“要”", "Trợ động từ 要"), ("程度副词“最”", "Phó từ chỉ mức độ 最"), ("概数的表达：几、多", "Cách diễn tả số ước lượng: 几 và 多")],
    2: [("用“是不是”的问句", "Câu hỏi với 是不是"), ("代词“每”", "Đại từ 每"), ("疑问代词“多”", "Đại từ nghi vấn 多")],
    3: [("“的”字短语", "Cụm từ có 的"), ("一下", "Cách dùng 一下"), ("语气副词“真”", "Phó từ ngữ khí 真")],
    4: [("“是……的”句：强调施事", "Cấu trúc 是……的: nhấn mạnh chủ thể thực hiện hành động"), ("表示时间：……的时候", "Cấu trúc diễn tả thời gian: ……的时候"), ("时间副词“已经”", "Phó từ chỉ thời gian 已经")],
    5: [("副词“就”", "Phó từ 就"), ("语气副词“还”（1）", "Phó từ ngữ khí 还 (1)"), ("程度副词“有点儿”", "Phó từ chỉ mức độ 有点儿")],
    6: [("疑问代词“怎么”", "Đại từ nghi vấn 怎么"), ("量词的重叠", "Sự lặp lại lượng từ"), ("关联词“因为……，所以……”", "Cấu trúc 因为……，所以……")],
    7: [("语气副词“还”（2）", "Phó từ ngữ khí 还 (2)"), ("时间副词“就”", "Phó từ chỉ thời gian 就"), ("离", "Động từ 离"), ("语气助词“呢”", "Trợ từ ngữ khí 呢")],
    8: [("疑问句“……，好吗？”", "Câu hỏi có cấu trúc: ……，好吗？"), ("副词“再”", "Phó từ 再"), ("兼语句", "Câu kiêm ngữ"), ("动词的重叠", "Sự lặp lại động từ")],
    9: [("结果补语", "Bổ ngữ chỉ kết quả"), ("介词“从”", "Giới từ 从"), ("“第”表示顺序", "Cách diễn tả thứ tự bằng 第……")],
    10: [("祈使句：不要……了；别……了", "Câu cầu khiến: 不要……了 / 别……了"), ("介词“对”", "Giới từ 对")],
    11: [("动词结构做定语", "Cấu trúc có động từ hoặc cụm động từ làm định ngữ"), ("“比”字句（1）", "Câu có từ 比 (1)"), ("助动词“可能”", "Trợ động từ 可能")],
    12: [("状态程度补语", "Bổ ngữ chỉ trạng thái"), ("“比”字句（2）", "Câu có từ 比 (2)")],
    13: [("动态助词“着”", "Trợ từ động thái 着"), ("反问句“不是……吗？”", "Câu hỏi phản vấn: 不是……吗？"), ("介词“往”", "Giới từ 往")],
    14: [("动态助词“过”", "Trợ từ động thái 过"), ("关联词“虽然……，但是……”", "Cấu trúc 虽然……，但是……"), ("动量补语“次”", "Bổ ngữ chỉ tần suất 次")],
    15: [("动作的状态：“要……了”", "Cấu trúc diễn tả trạng thái sắp xảy ra của hành động: 要……了"), ("“都……了”", "Cấu trúc 都……了")],
}

PRONUNCIATION_TOPICS = {
    1: ("双音节词语的重音", ["中重格式", "重轻格式"]),
    2: ("三音节词语的重音", ["中轻重格式", "中重轻格式", "重轻轻格式"]),
    3: ("四音节词语的重音", ["不含轻声音节的四音节词语", "含轻声音节的四音节词语"]),
    4: ("句子的语法重音（1）", ["谓语重读", "补语重读"]),
    5: ("句子的语法重音（2）", ["定语重读", "状语重读"]),
    6: ("句子的逻辑重音", []),
    7: ("汉语的基本句调", []),
    8: ("陈述句的句调", []),
    9: ("是非疑问句的句调", []),
    10: ("特指问句的句调", []),
    11: ("正反问句的句调", []),
    12: ("选择问句的句调", []),
    13: ("祈使句的句调", []),
    14: ("感叹句的句调", []),
    15: ("用“吧”和“吗”构成的疑问句的句调", []),
}

CULTURES = [
    (1, 54, "中国人的餐桌礼仪", "Phép lịch sự trên bàn ăn của người Trung Quốc"),
    (2, 94, "中国的茶文化", "Văn hóa uống trà của người Trung Quốc"),
    (3, 134, "中国的“新年”——春节", "Năm mới của Trung Quốc - Tết âm lịch"),
]

CANONICAL_PROPER_NAMES = [
    (1, "花花", "Hoa Hoa", "tên con mèo"),
    (13, "杨笑笑", "Dương Tiếu Tiếu", "tên người"),
]

SCENE_RECOVERIES = {
    (9, 3): {
        "titleZh": "在家里",
        "sourcePage": 81,
        "lines": [
            {"speaker": "A", "textZh": "你知道吗？大卫找到工作了。", "translationVi": "Chị biết không? David đã tìm được việc rồi."},
            {"speaker": "B", "textZh": "太好了！他从什么时候开始上班？", "translationVi": "Tốt quá! Vậy khi nào thì nó bắt đầu đi làm?"},
            {"speaker": "A", "textZh": "从下个星期一开始。", "translationVi": "Thứ hai tuần sau."},
            {"speaker": "B", "textZh": "这是他的第一个工作，希望他能喜欢。", "translationVi": "Đây là công việc đầu tiên của nó, hy vọng nó sẽ thích."},
        ],
    }
}

SCENE_TITLE_VI = {
    "在学校": "Ở trường",
    "看照片": "Xem ảnh",
    "在家里": "Ở nhà",
    "在运动场": "Ở sân vận động",
    "在医院": "Ở bệnh viện",
    "在操场": "Ở sân thể thao",
    "在房间": "Ở trong phòng",
    "在办公室": "Ở văn phòng",
    "在教室": "Trong lớp học",
    "在商店": "Ở cửa hàng",
    "在公司": "Ở công ty",
    "在饭馆": "Ở nhà hàng",
    "在健身房": "Ở phòng tập",
    "去机场的路上": "Trên đường ra sân bay",
    "在路上": "Trên đường",
    "在宿舍": "Ở ký túc xá",
    "在宾馆的前台": "Tại quầy lễ tân khách sạn",
    "打电话": "Gọi điện thoại",
    "在歌厅": "Ở phòng karaoke",
    "在朋友家": "Ở nhà bạn",
    "在家门口": "Trước cửa nhà",
    "在车站": "Ở nhà ga",
    "在咖啡馆门口": "Trước cửa quán cà phê",
}

DIALOGUE_TEXT_CORRECTIONS = {
    "你好！请问·张欢在吗？": "你好！请问，张欢在吗？",
    "是，革果也比昨天便宜一些。您来点儿吧。": "是，苹果也比昨天便宜一些。您来点儿吧。",
}

SECTION_KEYWORDS = {
    "text": ("课文",),
    "pinyin-transcript": ("拼音课文",),
    "grammar": ("注释",),
    "practice": ("练习", "练一练"),
    "hanzi": ("汉字",),
    "application": ("运用",),
    "pronunciation": ("语音",),
}


VOCABULARY_HEADS = {
    1: ["旅游", "觉得", "最", "为什么", "也", "运动", "踢足球", "一起", "要", "新", "它", "眼睛"],
    2: ["生病", "每", "早上", "跑步", "起床", "药", "身体", "出院", "高", "米", "知道", "休息", "忙", "时间"],
    3: ["手表", "千", "报纸", "送", "一下", "牛奶", "房间", "丈夫", "旁边", "真", "粉色", "颜色", "左边", "红色"],
    4: ["生日", "快乐", "给", "接", "晚上", "问", "非常", "开始", "已经", "长", "两", "帮", "介绍"],
    5: ["外面", "准备", "就", "鱼", "吧", "件", "还", "可以", "不错", "考试", "意思", "咖啡", "对", "以后"],
    6: ["门", "外", "自行车", "羊肉", "好吃", "面条", "打篮球", "因为", "所以", "游泳", "经常", "公斤", "姐姐"],
    7: ["教室", "机场", "路", "离", "公司", "远", "公共汽车", "小时", "慢", "快", "过", "走", "到"],
    8: ["再", "让", "告诉", "等", "找", "事情", "服务员", "白", "黑", "贵"],
    9: ["错", "从", "跳舞", "第一", "希望", "问题", "欢迎", "上班", "懂", "完", "题"],
    10: ["课", "帮助", "别", "哥哥", "鸡蛋", "西瓜", "正在", "手机", "洗"],
    11: ["唱歌", "男", "女", "孩子", "右边", "比", "便宜", "说话", "可能", "去年", "姓"],
    12: ["得", "妻子", "雪", "零", "度", "穿", "进", "弟弟", "近"],
    13: ["着", "手", "拿", "铅笔", "班", "长", "笑", "宾馆", "一直", "往", "路口"],
    14: ["有意思", "但是", "虽然", "次", "玩儿", "晴", "百"],
    15: ["日", "新年", "票", "火车站", "大家", "更", "妹妹", "阴"],
}

VOCABULARY_MEANINGS = {
    "旅游": "du lịch", "觉得": "cho rằng; cảm thấy", "最": "nhất", "为什么": "tại sao", "也": "cũng",
    "运动": "vận động; môn thể thao", "踢足球": "đá bóng", "一起": "cùng nhau", "要": "muốn; cần", "新": "mới",
    "它": "nó (dùng cho động vật hoặc đồ vật)", "眼睛": "mắt",
    "生病": "bị bệnh", "每": "mỗi", "早上": "buổi sáng", "跑步": "chạy bộ", "起床": "thức dậy", "药": "thuốc",
    "身体": "cơ thể; sức khỏe", "出院": "xuất viện", "高": "cao", "米": "mét", "知道": "biết", "休息": "nghỉ ngơi",
    "忙": "bận", "时间": "thời gian",
    "手表": "đồng hồ đeo tay", "千": "nghìn", "报纸": "báo", "送": "tặng; đưa; tiễn", "一下": "một chút; một lát",
    "牛奶": "sữa bò", "房间": "phòng", "丈夫": "chồng", "旁边": "bên cạnh", "真": "thật; thật là", "粉色": "màu hồng",
    "颜色": "màu sắc", "左边": "bên trái", "红色": "màu đỏ",
    "生日": "sinh nhật", "快乐": "vui vẻ", "给": "cho; đưa", "接": "đón; nhận", "晚上": "buổi tối", "问": "hỏi",
    "非常": "vô cùng; rất", "开始": "bắt đầu", "已经": "đã", "长": "dài; lâu", "两": "hai", "帮": "giúp",
    "介绍": "giới thiệu",
    "外面": "bên ngoài", "准备": "chuẩn bị", "就": "liền; thì; đã", "鱼": "cá", "吧": "trợ từ ngữ khí 吧",
    "件": "lượng từ cho quần áo hoặc sự việc", "还": "vẫn; còn", "可以": "có thể", "不错": "không tệ; khá tốt",
    "考试": "thi; kỳ thi", "咖啡": "cà phê", "对": "đúng; đối với", "以后": "sau này; về sau",
    "门": "cửa", "外": "ngoài", "自行车": "xe đạp", "羊肉": "thịt dê; thịt cừu", "好吃": "ngon", "面条": "mì sợi",
    "打篮球": "chơi bóng rổ", "因为": "bởi vì", "所以": "cho nên", "游泳": "bơi", "经常": "thường xuyên",
    "公斤": "kilôgam", "姐姐": "chị gái",
    "教室": "phòng học", "机场": "sân bay", "路": "đường", "离": "cách", "公司": "công ty", "远": "xa",
    "公共汽车": "xe buýt", "小时": "giờ; tiếng đồng hồ", "慢": "chậm", "快": "nhanh", "过": "đi qua; qua",
    "走": "đi bộ; rời đi", "到": "đến",
    "再": "lại; rồi", "让": "để; bảo; khiến", "告诉": "nói cho; cho biết", "等": "đợi", "找": "tìm",
    "事情": "sự việc", "服务员": "nhân viên phục vụ", "白": "trắng", "黑": "đen", "贵": "đắt",
    "错": "sai", "从": "từ", "跳舞": "nhảy múa", "第一": "thứ nhất; đầu tiên", "希望": "hy vọng",
    "问题": "vấn đề; câu hỏi", "欢迎": "hoan nghênh; chào mừng", "上班": "đi làm", "懂": "hiểu", "完": "xong; hết",
    "题": "đề; câu hỏi",
    "课": "bài học; tiết học", "帮助": "giúp đỡ", "别": "đừng", "哥哥": "anh trai", "鸡蛋": "trứng gà",
    "西瓜": "dưa hấu", "正在": "đang", "手机": "điện thoại di động", "洗": "rửa; giặt",
    "唱歌": "hát", "男": "nam", "女": "nữ", "孩子": "trẻ em; con", "右边": "bên phải", "比": "so với",
    "便宜": "rẻ", "说话": "nói chuyện", "可能": "có thể; có lẽ", "去年": "năm ngoái", "姓": "họ; mang họ",
    "得": "trợ từ kết cấu 得", "妻子": "vợ", "雪": "tuyết", "零": "số không", "度": "độ", "穿": "mặc",
    "进": "vào", "弟弟": "em trai", "近": "gần",
    "着": "trợ từ động thái 着", "手": "tay", "拿": "cầm; lấy", "铅笔": "bút chì", "班": "lớp",
    "笑": "cười", "宾馆": "khách sạn", "一直": "liên tục; thẳng", "往": "về phía", "路口": "ngã đường; giao lộ",
    "意思": "ý nghĩa; ý", "有意思": "thú vị", "但是": "nhưng", "虽然": "tuy; mặc dù", "次": "lần", "玩儿": "chơi", "晴": "trời quang",
    "百": "trăm",
    "日": "ngày", "新年": "năm mới", "票": "vé", "火车站": "ga tàu hỏa", "大家": "mọi người", "更": "hơn; càng",
    "妹妹": "em gái", "阴": "âm u; nhiều mây",
}

BEYOND_HSK2_ITEMS = {
    (2, 10),
    (3, 11),
    (4, 4),
    (5, 14),
    (6, 3),
    (6, 11),
    (6, 12),
    (7, 11),
    (9, 7),
    (12, 5),
    (13, 3),
    (13, 5),
    (13, 6),
    (13, 9),
    (15, 6),
}

RELATED_FORMS = {(2, 8): "出", (3, 11): "粉", (3, 14): "红"}

# Canonical heads come from the printed table of contents and are also used as
# deterministic recoveries whenever OCR misses a numbered vocabulary anchor.
TOC_LEXEME_RECOVERIES: dict[tuple[int, int], dict[str, Any]] = {
    (lesson, number): {
        "hanzi": hanzi,
        "isBeyondHsk2Marked": (lesson, number) in BEYOND_HSK2_ITEMS,
    }
    for lesson, heads in VOCABULARY_HEADS.items()
    for number, hanzi in enumerate(heads, start=1)
}

EXPECTED_VOCAB_COUNTS = {
    1: 12,
    2: 14,
    3: 14,
    4: 13,
    5: 14,
    6: 13,
    7: 13,
    8: 10,
    9: 11,
    10: 9,
    11: 11,
    12: 9,
    13: 11,
    14: 7,
    15: 8,
}

TOC_PAGE_BY_LESSON = {
    **{number: 8 for number in range(1, 6)},
    **{number: 10 for number in range(6, 12)},
    **{number: 12 for number in range(12, 16)},
}

PINYIN_OVERRIDES = {
    "为什么": "wèi shénme",
    "觉得": "juéde",
    "眼睛": "yǎnjing",
    "知道": "zhīdào",
    "丈夫": "zhàngfu",
    "旁边": "pángbiān",
    "颜色": "yánsè",
    "晚上": "wǎnshang",
    "长": "cháng",
    "还": "hái",
    "便宜": "piányi",
    "孩子": "háizi",
    "得": "de",
    "着": "zhe",
    "妻子": "qīzi",
}

LEXEME_PINYIN_OVERRIDES = {(13, 6): "zhǎng"}
LEXEME_MEANING_OVERRIDES = {(13, 6): "trưởng; lớn lên; mọc"}


def dump_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def pinyin(text: str) -> str:
    if text in PINYIN_OVERRIDES:
        return PINYIN_OVERRIDES[text]
    joined = " ".join(lazy_pinyin(text, style=Style.TONE, neutral_tone_with_five=False))
    joined = re.sub(r"\s+([，。！？、；：,.!?;:])", r"\1", joined)
    joined = re.sub(r"([（(])\s+", r"\1", joined)
    joined = re.sub(r"\s+([）)])", r"\1", joined)
    return joined


def lexeme_pinyin(lesson_number: int, source_number: int, hanzi: str) -> str:
    return LEXEME_PINYIN_OVERRIDES.get((lesson_number, source_number), pinyin(hanzi))


def lexeme_meaning(lesson_number: int, source_number: int, hanzi: str) -> str:
    return LEXEME_MEANING_OVERRIDES.get((lesson_number, source_number), VOCABULARY_MEANINGS[hanzi])


def bbox_metrics(box: list[list[float]]) -> tuple[float, float, float, float]:
    xs = [point[0] for point in box]
    ys = [point[1] for point in box]
    return min(xs), min(ys), max(xs), max(ys)


def basic_noise(text: str, top: float, left: float) -> bool:
    value = text.strip()
    if not value:
        return True
    if any(value.startswith(prefix) for prefix in NOISE_PREFIXES):
        return True
    if top > 1490 and re.fullmatch(r"\d{1,3}", value):
        return True
    if left < 70 and top > 1000 and any(token in value for token in ("GiaoTrinh", "nhantriviet", "HSK")):
        return True
    return False


def printed_page_number(lines: list[dict[str, Any]]) -> int | None:
    candidates = []
    for line in lines:
        left, top, _, _ = bbox_metrics(line["box"])
        value = line["text"].strip()
        if top > 1450 and re.fullmatch(r"\d{1,3}", value):
            number = int(value)
            if 1 <= number <= 250:
                candidates.append((top, left, number))
    return max(candidates)[2] if candidates else None


def build_rows(lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    fragments = []
    for line in lines:
        left, top, right, bottom = bbox_metrics(line["box"])
        fragments.append(
            {
                "text": line["text"].strip(),
                "confidence": line["confidence"],
                "box": line["box"],
                "left": left,
                "top": top,
                "right": right,
                "bottom": bottom,
                "centerY": (top + bottom) / 2,
                "isNoiseFragment": basic_noise(line["text"], top, left),
            }
        )
    fragments.sort(key=lambda value: (value["centerY"], value["left"]))
    rows: list[dict[str, Any]] = []
    for fragment in fragments:
        same_class = rows and fragment["isNoiseFragment"] == rows[-1]["fragments"][0]["isNoiseFragment"]
        if rows and same_class and abs(fragment["centerY"] - rows[-1]["centerY"]) <= 8:
            rows[-1]["fragments"].append(fragment)
            centers = [item["centerY"] for item in rows[-1]["fragments"]]
            rows[-1]["centerY"] = sum(centers) / len(centers)
        else:
            rows.append({"centerY": fragment["centerY"], "fragments": [fragment]})
    normalized = []
    for index, row in enumerate(rows):
        row["fragments"].sort(key=lambda value: value["left"])
        left = min(fragment["left"] for fragment in row["fragments"])
        top = min(fragment["top"] for fragment in row["fragments"])
        text = " ".join(fragment["text"] for fragment in row["fragments"] if fragment["text"])
        normalized.append(
            {
                "rowIndex": index,
                "top": round(top, 1),
                "left": round(left, 1),
                "text": text,
                "minConfidence": round(min(fragment["confidence"] for fragment in row["fragments"]), 4),
                "isNoise": basic_noise(text, top, left),
                "fragments": [
                    {"text": fragment["text"], "confidence": fragment["confidence"], "box": fragment["box"]}
                    for fragment in row["fragments"]
                ],
            }
        )
    return normalized


def load_pages(ocr_dir: Path) -> dict[int, dict[str, Any]]:
    pages = {}
    for path in sorted(ocr_dir.glob("page-*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        page_number = int(raw["page"])
        lines = raw["lines"]
        max_x = max((point[0] for line in lines for point in line["box"]), default=0)
        max_y = max((point[1] for line in lines for point in line["box"]), default=0)
        coordinate_scale = 1571 / 1000 if max_x < 850 and max_y < 1100 else 1.0
        if coordinate_scale != 1.0:
            lines = [
                {
                    **line,
                    "box": [
                        [point[0] * coordinate_scale, point[1] * coordinate_scale]
                        for point in line["box"]
                    ],
                }
                for line in lines
            ]
        pages[page_number] = {
            "id": f"hsk2-tb-source-page-{page_number:03d}",
            "pdfPage": page_number,
            "printedPage": printed_page_number(lines) or page_number,
            "ocr": {
                "engine": "RapidOCR/ONNX Runtime",
                "elapsedSeconds": raw["elapsedSeconds"],
                "coordinateScale": round(coordinate_scale, 4),
                "status": "machine-transcribed-needs-review",
            },
            "rows": build_rows(lines),
        }
    return pages


def page_text(page: dict[str, Any]) -> str:
    return "".join(row["text"] for row in page["rows"] if not row["isNoise"]).replace(" ", "")


def meaningful_row_indexes(page: dict[str, Any]) -> list[int]:
    return [row["rowIndex"] for row in page["rows"] if not row["isNoise"]]


def fragment_left(fragment: dict[str, Any]) -> float:
    return min(point[0] for point in fragment["box"])


def clean_scene_title(value: str) -> str:
    title = "".join(re.findall(r"[\u3400-\u9fff]+", value))
    return title.removeprefix("课文")


def find_physical_for_printed(pages: dict[int, dict[str, Any]], printed: int) -> int | None:
    exact = [number for number, page in pages.items() if page["printedPage"] == printed]
    return min(exact) if exact else None


def find_title_page(pages: dict[int, dict[str, Any]], title: str, printed: int) -> int:
    normalized = re.sub(r"[。？“”\s]", "", title)
    candidates = []
    for number, page in pages.items():
        if number < 15:
            continue
        text = re.sub(r"[。？“”\s]", "", page_text(page))
        if normalized in text:
            candidates.append(number)
    exact = find_physical_for_printed(pages, printed)
    if exact in candidates:
        return exact
    if candidates:
        return min(candidates, key=lambda number: abs((pages[number]["printedPage"] or number) - printed))
    if exact is not None:
        return exact
    return printed


def resolve_layout(pages: dict[int, dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    cultures = []
    for number, printed, title_zh, title_vi in CULTURES:
        cultures.append({"number": number, "printed": printed, "pdfPage": printed, "titleZh": title_zh, "titleVi": title_vi})
    culture_by_after_lesson = {5: cultures[0]["pdfPage"], 10: cultures[1]["pdfPage"], 15: cultures[2]["pdfPage"]}

    starts = []
    for number, printed, title_zh, title_vi in LESSONS:
        starts.append(
            {
                "number": number,
                "printedStart": printed,
                "pdfStart": printed,
                "titleZh": title_zh,
                "titleVi": title_vi,
            }
        )
    for index, lesson in enumerate(starts):
        if lesson["number"] in culture_by_after_lesson:
            end = culture_by_after_lesson[lesson["number"]] - 1
        else:
            end = starts[index + 1]["pdfStart"] - 1
        lesson["pdfEnd"] = end
        end_page = pages.get(end)
        lesson["printedEnd"] = end_page["printedPage"] if end_page and end_page["printedPage"] else lesson["printedStart"] + (end - lesson["pdfStart"])
    return starts, cultures


def detect_missing_printed_pages(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[int]:
    physical_span = lesson["pdfEnd"] - lesson["pdfStart"] + 1
    printed_span = lesson["printedEnd"] - lesson["printedStart"] + 1
    missing_count = max(0, printed_span - physical_span)
    if missing_count == 0:
        return []

    anchors = []
    for pdf_page in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
        printed_page = pages[pdf_page]["printedPage"]
        if printed_page is not None:
            anchors.append((pdf_page, printed_page))
    inferred_missing = []
    for (previous_pdf, previous_printed), (current_pdf, current_printed) in zip(anchors, anchors[1:]):
        excess = (current_printed - previous_printed) - (current_pdf - previous_pdf)
        if excess > 0:
            inferred_missing.extend(range(current_printed - excess, current_printed))
    return sorted(dict.fromkeys(inferred_missing))[:missing_count]


def contains_any(page: dict[str, Any], terms: tuple[str, ...]) -> bool:
    text = page_text(page)
    return any(term in text for term in terms)


def track_headers(page: dict[str, Any], lesson_number: int) -> list[dict[str, Any]]:
    headers = []
    for row in page["rows"]:
        if row["isNoise"]:
            continue
        code = None
        for fragment in row["fragments"]:
            match = TRACK_RE.search(fragment["text"])
            if match and int(match.group(1)) == lesson_number:
                code = f"{int(match.group(1)):02d}-{int(match.group(2))}"
                scene = int(match.group(2))
                break
        if code:
            chinese = "".join(
                fragment["text"]
                for fragment in row["fragments"]
                if fragment_left(fragment) < 760 and CJK_RE.search(fragment["text"])
            )
            chinese = re.sub(r"^\s*[1-4]\s*", "", chinese).strip()
            latin = " ".join(
                fragment["text"]
                for fragment in row["fragments"]
                if fragment_left(fragment) < 760 and not CJK_RE.search(fragment["text"]) and not TRACK_RE.search(fragment["text"])
            ).strip()
            headers.append(
                {
                    "scene": scene,
                    "trackCode": code,
                    "rowIndex": row["rowIndex"],
                    "top": row["top"],
                    "titleZh": chinese,
                    "titleViOcrRaw": latin or None,
                    "detectionSource": "track-code-ocr",
                }
            )
    detected = {header["scene"] for header in headers}
    pinyin_tops = [row["top"] for row in page["rows"] if "拼音课文" in row["text"]]
    pinyin_top = min(pinyin_tops) if pinyin_tops else 10_000
    for row in page["rows"]:
        if row["isNoise"] or row["top"] >= pinyin_top:
            continue
        scene = None
        for fragment in row["fragments"]:
            left = fragment_left(fragment)
            value = fragment["text"].strip()
            match = re.match(r"^([1-4])\s*([\u3400-\u9fff].*)$", value)
            if 150 <= left < 500 and match:
                scene = int(match.group(1))
                break
        if scene is None or scene in detected:
            continue
        chinese = "".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and CJK_RE.search(fragment["text"])
        )
        chinese = re.sub(r"^\s*[1-4]\s*", "", chinese).strip()
        latin = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and not CJK_RE.search(fragment["text"]) and not TRACK_RE.search(fragment["text"])
        ).strip()
        headers.append(
            {
                "scene": scene,
                "trackCode": f"{lesson_number:02d}-{scene}",
                "rowIndex": row["rowIndex"],
                "top": row["top"],
                "titleZh": chinese,
                "titleViOcrRaw": latin or None,
                "detectionSource": "layout-inferred-from-scene-heading",
            }
        )
        detected.add(scene)
    existing_tops = [header["top"] for header in headers]
    inferred_candidates = []
    for row in page["rows"]:
        if row["isNoise"] or row["top"] >= pinyin_top or any(abs(row["top"] - top) < 18 for top in existing_tops):
            continue
        if "：" in row["text"] or "专有名词" in row["text"] or not CJK_RE.search(row["text"]):
            continue
        if not re.search(r"[A-Za-z]", row["text"]):
            continue
        if not (140 <= row["left"] < 500):
            continue
        nearby_vocab = any(
            row["top"] < later["top"] <= row["top"] + 100 and "生词" in later["text"]
            for later in page["rows"]
        )
        if nearby_vocab:
            inferred_candidates.append(row)
    for row in inferred_candidates:
        before = sorted((header["scene"], header["top"]) for header in headers if header["top"] < row["top"])
        after = sorted((header["scene"], header["top"]) for header in headers if header["top"] > row["top"])
        if before and after and after[0][0] - before[-1][0] == 2:
            scene = before[-1][0] + 1
        elif before and before[-1][0] < 4:
            scene = before[-1][0] + 1
        elif after and after[0][0] > 1:
            scene = after[0][0] - 1
        else:
            continue
        if scene in detected:
            continue
        chinese = "".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and CJK_RE.search(fragment["text"])
        ).strip()
        latin = " ".join(
            fragment["text"]
            for fragment in row["fragments"]
            if fragment_left(fragment) < 760 and not CJK_RE.search(fragment["text"])
        ).strip()
        headers.append(
            {
                "scene": scene,
                "trackCode": f"{lesson_number:02d}-{scene}",
                "rowIndex": row["rowIndex"],
                "top": row["top"],
                "titleZh": chinese,
                "titleViOcrRaw": latin or None,
                "detectionSource": "layout-inferred-from-vocabulary-column",
            }
        )
        detected.add(scene)
    for header in headers:
        header["titleZh"] = clean_scene_title(header["titleZh"])
    return sorted(headers, key=lambda header: header["top"])


def extract_scene(page: dict[str, Any], header: dict[str, Any], next_top: float | None, lesson_id: str) -> dict[str, Any]:
    selected_rows = []
    raw_segments = []
    translation_segments = []
    translation_started = False
    for row in page["rows"]:
        if row["rowIndex"] <= header["rowIndex"] or row["isNoise"]:
            continue
        if next_top is not None and row["top"] >= next_top - 8:
            break
        if row["top"] > 1535:
            break
        if any(term in row["text"] for term in ("拼音课文", "专有名词", "注释", "练习", "汉字", "运用", "语音")):
            break
        compact_latin = re.sub(r"[^A-Za-z]", "", row["text"]).lower()
        if "dichnghia" in compact_latin:
            translation_started = True
            continue
        if translation_started:
            latin_values = [
                fragment["text"].strip()
                for fragment in row["fragments"]
                if fragment_left(fragment) < 560
                and not CJK_RE.search(fragment["text"])
                and fragment["text"].strip()
                and "nhantriviet" not in fragment["text"].lower()
            ]
            if latin_values:
                translation_segments.append(" ".join(latin_values))
            continue
        segments = []
        for fragment in row["fragments"]:
            left = fragment_left(fragment)
            value = fragment["text"].strip()
            is_vocabulary_anchor = left >= 520 and re.match(r"^\s*\*?\d{1,2}\s*[.．、]", value)
            if 175 <= left < 900 and value and not is_vocabulary_anchor:
                segments.append(value)
        joined_segment = "".join(segments)
        dialogue_body = re.sub(r"^\s*[A-Z]\s*[：:]", "", joined_segment)
        if segments and CJK_RE.search(joined_segment) and not re.search(r"[A-Za-z]", dialogue_body):
            selected_rows.append(row["rowIndex"])
            raw_segments.append(joined_segment)

    lines = []
    for segment in raw_segments:
        if "：" in segment or ":" in segment:
            parts = re.split(r"[：:]", segment, maxsplit=1)
            lines.append({"speaker": parts[0].strip() or None, "textZh": parts[1].strip()})
        elif lines:
            lines[-1]["textZh"] += segment
        else:
            lines.append({"speaker": None, "textZh": segment})
    translations = []
    for segment in translation_segments:
        match = re.match(r"^\s*([A-Z])\s*[：:]\s*(.*)$", segment)
        if match:
            translations.append({"speaker": match.group(1), "text": match.group(2).strip()})
        elif translations:
            translations[-1]["text"] = f"{translations[-1]['text']} {segment}".strip()
    for index, line in enumerate(lines):
        line["textZh"] = DIALOGUE_TEXT_CORRECTIONS.get(line["textZh"], line["textZh"])
        line["pinyin"] = pinyin(line["textZh"])
        if index < len(translations):
            line["translationViOcrRaw"] = translations[index]["text"]
    return {
        "id": f"{lesson_id}-scene-{header['scene']}",
        "lessonRef": lesson_id,
        "sceneNumber": header["scene"],
        "title": {
            "zh": header["titleZh"],
            "pinyin": pinyin(header["titleZh"]) if header["titleZh"] else None,
            "vi": SCENE_TITLE_VI.get(header["titleZh"]),
            "viOcrRaw": header["titleViOcrRaw"],
        },
        "trackCode": header["trackCode"],
        "trackDetectionSource": header["detectionSource"],
        "sourcePageRef": page["id"],
        "sourceRowIndexes": selected_rows,
        "lines": lines,
        "transcriptionStatus": "ocr-needs-editorial-review" if lines else "track-detected-content-needs-manual-transcription",
    }


def find_toc_vocabulary_evidence(page: dict[str, Any], search: str) -> tuple[list[int], str | None]:
    for row in page["rows"]:
        if row["isNoise"]:
            continue
        vocabulary_fragments = [
            fragment["text"].strip()
            for fragment in row["fragments"]
            if 540 <= fragment_left(fragment) < 765 and fragment["text"].strip()
        ]
        vocabulary_text = " ".join(vocabulary_fragments)
        if search in vocabulary_text:
            return [row["rowIndex"]], vocabulary_text
    return [], None


def find_appendix_vocabulary_evidence(
    page: dict[str, Any], search: str, lesson_number: int
) -> tuple[list[int], str | None]:
    lesson_marker = re.compile(rf"(?:^|\s){lesson_number}(?:\s|$)")
    for row in page["rows"]:
        if row["isNoise"] or not lesson_marker.search(row["text"]):
            continue
        cjk_fragments = [
            fragment["text"].strip().lstrip("*")
            for fragment in sorted(row["fragments"], key=fragment_left)
            if CJK_RE.search(fragment["text"])
        ]
        if cjk_fragments and search in cjk_fragments[0]:
            return [row["rowIndex"]], row["text"]
    return [], None


def extract_lexemes_for_lesson(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    found: dict[int, dict[str, Any]] = {}
    for page_number in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
        page = pages[page_number]
        if page_number not in {lesson["pdfStart"] + 1, lesson["pdfStart"] + 2}:
            continue
        anchors = []
        for row in page["rows"]:
            for fragment in row["fragments"]:
                if fragment_left(fragment) < 500:
                    continue
                match = VOCAB_ANCHOR_RE.match(fragment["text"])
                if match:
                    number = int(match.group(1))
                    if 1 <= number <= 40:
                        anchors.append((number, row["rowIndex"], match.group(2), fragment["text"].strip()))
                        break
        anchors.sort(key=lambda value: value[1])
        for index, (number, row_index, head, anchor_raw) in enumerate(anchors):
            end = anchors[index + 1][1] if index + 1 < len(anchors) else len(page["rows"])
            row_indexes = []
            raw_tokens = []
            for current in range(row_index, end):
                row = page["rows"][current]
                if row["isNoise"]:
                    continue
                right_fragments = [fragment for fragment in row["fragments"] if fragment_left(fragment) >= 500]
                if not right_fragments:
                    continue
                if any(TRACK_RE.search(fragment["text"]) for fragment in right_fragments):
                    break
                row_indexes.append(current)
                raw_tokens.extend(fragment["text"].strip() for fragment in right_fragments if fragment["text"].strip())
            hanzi_match = CJK_RUN_RE.match(head.strip().lstrip("*"))
            if not hanzi_match:
                continue
            hanzi_source = hanzi_match.group(0)
            hanzi_ocr = hanzi_source.replace("（", "").replace("）", "").replace("(", "").replace(")", "")
            canonical = TOC_LEXEME_RECOVERIES.get((lesson["number"], number))
            hanzi = canonical["hanzi"] if canonical else hanzi_ocr
            raw = " ".join(raw_tokens)
            pos_match = re.search(r"\b(dt|dgt|tt|pho|trg|tro|gioi|lien|so|luong)\.?", raw, flags=re.IGNORECASE)
            candidate = {
                "id": f"hsk2-tb-l{lesson['number']:02d}-v{number:02d}",
                "lessonRef": f"hsk2-tb-lesson-{lesson['number']:02d}",
                "sourceNumber": number,
                "hanzi": hanzi,
                "hanziSource": hanzi_source,
                "hanziOcrRaw": hanzi_ocr,
                "relatedForm": RELATED_FORMS.get((lesson["number"], number)),
                "pinyin": lexeme_pinyin(lesson["number"], number, hanzi),
                "meaningVi": lexeme_meaning(lesson["number"], number, hanzi),
                "partOfSpeechOcrRaw": pos_match.group(0) if pos_match else None,
                "sourceTextOcrRaw": raw,
                "isBeyondHsk2Marked": canonical.get("isBeyondHsk2Marked", False)
                if canonical
                else anchor_raw.startswith("*") or "*" in anchor_raw[:3],
                "sourcePageRef": page["id"],
                "sourceRowIndexes": row_indexes,
                "sourceEvidence": "lesson-page-ocr",
                "meaningStatus": "normalized-from-source-vietnamese-gloss",
                "transcriptionStatus": "ocr-needs-editorial-review",
            }
            existing = found.get(number)
            if existing is None or len(candidate["sourceTextOcrRaw"]) > len(existing["sourceTextOcrRaw"]):
                found[number] = candidate
    expected = EXPECTED_VOCAB_COUNTS[lesson["number"]]
    unexpected = sorted(number for number in found if number > expected)
    if unexpected:
        raise ValueError(f"Lesson {lesson['number']} has unexpected vocabulary numbers above {expected}: {unexpected}")
    toc_page = pages[TOC_PAGE_BY_LESSON[lesson["number"]]]
    result = []
    for number in range(1, expected + 1):
        if number in found:
            result.append(found[number])
        elif (lesson["number"], number) in TOC_LEXEME_RECOVERIES:
            recovery = TOC_LEXEME_RECOVERIES[(lesson["number"], number)]
            hanzi = recovery["hanzi"]
            is_beyond = recovery.get("isBeyondHsk2Marked", False)
            row_indexes, toc_raw = find_toc_vocabulary_evidence(toc_page, recovery.get("tocSearch", hanzi))
            source_gap = lesson["number"] == 18
            appendix_page = pages.get(recovery.get("appendixPdfPage"))
            appendix_row_indexes: list[int] = []
            appendix_raw = None
            if appendix_page is not None:
                appendix_row_indexes, appendix_raw = find_appendix_vocabulary_evidence(
                    appendix_page,
                    recovery.get("appendixSearch", hanzi.replace("……", "")),
                    lesson["number"],
                )
            result.append(
                {
                    "id": f"hsk2-tb-l{lesson['number']:02d}-v{number:02d}",
                    "lessonRef": f"hsk2-tb-lesson-{lesson['number']:02d}",
                    "sourceNumber": number,
                    "hanzi": hanzi,
                    "hanziSource": f"*{hanzi}" if is_beyond else hanzi,
                    "hanziOcrRaw": None,
                    "relatedForm": RELATED_FORMS.get((lesson["number"], number)),
                    "pinyin": recovery.get("pinyin", lexeme_pinyin(lesson["number"], number, hanzi)),
                    "meaningVi": lexeme_meaning(lesson["number"], number, hanzi),
                    "partOfSpeechOcrRaw": None,
                    "sourceTextOcrRaw": toc_raw,
                    "isBeyondHsk2Marked": is_beyond,
                    "sourcePageRef": toc_page["id"],
                    "sourceRowIndexes": row_indexes,
                    "sourceEvidence": "table-of-contents-and-vocabulary-appendix"
                    if source_gap
                    else "table-of-contents-plus-lesson-page-context",
                    "appendixSourcePageRef": appendix_page["id"] if appendix_page else None,
                    "appendixSourceRowIndexes": appendix_row_indexes,
                    "appendixTextOcrRaw": appendix_raw,
                    "meaningStatus": "normalized-from-source-vietnamese-gloss",
                    "transcriptionStatus": "toc-and-appendix-derived-source-pages-missing"
                    if source_gap
                    else "toc-recovered-ocr-anchor-missed-needs-editorial-review",
                }
            )
        else:
            result.append(
                {
                    "id": f"hsk2-tb-l{lesson['number']:02d}-v{number:02d}",
                    "lessonRef": f"hsk2-tb-lesson-{lesson['number']:02d}",
                    "sourceNumber": number,
                    "hanzi": None,
                    "hanziSource": None,
                    "hanziOcrRaw": None,
                    "relatedForm": RELATED_FORMS.get((lesson["number"], number)),
                    "pinyin": None,
                    "meaningVi": None,
                    "partOfSpeechOcrRaw": None,
                    "sourceTextOcrRaw": None,
                    "isBeyondHsk2Marked": None,
                    "sourcePageRef": None,
                    "sourceRowIndexes": [],
                    "sourceEvidence": "none",
                    "meaningStatus": "unknown",
                    "transcriptionStatus": "ocr-anchor-missed-manual-review-required",
                }
            )
    return result


def extract_proper_names(lesson: dict[str, Any], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    names = []
    serial = 0
    for page_number in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
        page = pages[page_number]
        rows = page["rows"]
        starts = [row["rowIndex"] for row in rows if "专有名词" in row["text"]]
        for start in starts:
            for row in rows[start + 1 :]:
                if row["top"] > 1530 or TRACK_RE.search(row["text"]):
                    break
                text = row["text"].strip()
                match = re.match(r"^\s*\d+[.．、]\s*([\u3400-\u9fff]+)", text)
                if match:
                    serial += 1
                    hanzi = match.group(1)
                    names.append(
                        {
                            "id": f"hsk2-tb-l{lesson['number']:02d}-proper-{serial:02d}",
                            "lessonRef": f"hsk2-tb-lesson-{lesson['number']:02d}",
                            "hanzi": hanzi,
                            "pinyin": pinyin(hanzi),
                            "sourceTextOcrRaw": text,
                            "sourcePageRef": page["id"],
                            "sourceRowIndexes": [row["rowIndex"]],
                            "transcriptionStatus": "ocr-needs-editorial-review",
                        }
                    )
    return names


def make_blocks(kind: str, lesson: dict[str, Any], page_numbers: list[int], pages: dict[int, dict[str, Any]]) -> list[dict[str, Any]]:
    blocks = []
    for index, page_number in enumerate(page_numbers, start=1):
        page = pages[page_number]
        headings = []
        for row in page["rows"]:
            if row["isNoise"] or not CJK_RE.search(row["text"]):
                continue
            if any(keyword in row["text"] for keyword in SECTION_KEYWORDS.get(kind, ())):
                headings.append(row["text"])
        blocks.append(
            {
                "id": f"hsk2-tb-l{lesson['number']:02d}-{kind}-{index:02d}",
                "lessonRef": f"hsk2-tb-lesson-{lesson['number']:02d}",
                "kind": kind,
                "sourcePageRef": page["id"],
                "sourceRowIndexes": meaningful_row_indexes(page),
                "detectedHeadingsOcrRaw": headings,
                "transcriptionStatus": "page-block-ocr-needs-editorial-review",
            }
        )
    return blocks


def assign_page_roles(pages: dict[int, dict[str, Any]], lessons: list[dict[str, Any]], cultures: list[dict[str, Any]]) -> None:
    for page in pages.values():
        page["role"] = "other"
    for page_number in range(1, 15):
        if page_number in pages:
            pages[page_number]["role"] = "front-matter"
    for lesson in lessons:
        for page_number in range(lesson["pdfStart"], lesson["pdfEnd"] + 1):
            pages[page_number]["role"] = "lesson-content"
            pages[page_number]["lessonNumber"] = lesson["number"]
    for culture in cultures:
        pages[culture["pdfPage"]]["role"] = "culture"
        pages[culture["pdfPage"]]["cultureNumber"] = culture["number"]
    appendix_start = find_physical_for_printed(pages, 135)
    if appendix_start:
        for page_number in range(appendix_start, max(pages) + 1):
            pages[page_number]["role"] = "vocabulary-appendix"


def build_schema() -> dict[str, Any]:
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "$id": "https://himi.local/schemas/hsk2-textbook-lesson.schema.json",
        "title": "HSK 2 textbook lesson",
        "type": "object",
        "additionalProperties": False,
        "required": ["schemaVersion", "id", "lessonNumber", "status", "title", "source", "sections", "editorial"],
        "properties": {
            "$schema": {"type": "string"},
            "schemaVersion": {"const": SCHEMA_VERSION},
            "id": {"type": "string", "pattern": "^hsk2-tb-lesson-[0-9]{2}$"},
            "lessonNumber": {"type": "integer", "minimum": 1, "maximum": 15},
            "status": {"enum": ["draft", "review", "published"]},
            "title": {"type": "object", "required": ["zh", "pinyin", "vi"]},
            "source": {"type": "object", "required": ["pdfPages", "printedPages", "sourcePageRefs"]},
            "sections": {"type": "array", "minItems": 8},
            "editorial": {"type": "object"},
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--ocr-dir", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("content/hsk2-textbook-json"))
    args = parser.parse_args()

    pages = load_pages(args.ocr_dir)
    ocr_page_numbers = set(pages)
    for page_number in range(1, 146):
        pages.setdefault(
            page_number,
            {
                "id": f"hsk2-tb-source-page-{page_number:03d}",
                "pdfPage": page_number,
                "printedPage": page_number,
                "ocr": {
                    "engine": "RapidOCR/ONNX Runtime",
                    "elapsedSeconds": None,
                    "coordinateScale": None,
                    "status": "not-run-page-role-mapped-only",
                },
                "rows": [],
            },
        )
    lessons, cultures = resolve_layout(pages)
    assign_page_roles(pages, lessons, cultures)

    output = args.output_dir
    all_lexemes = []
    all_scenes = []
    all_media = []
    all_proper_names = []
    all_grammar_points = []
    all_pronunciation_topics = []
    blocks_by_kind: dict[str, list[dict[str, Any]]] = {
        "warmup": [],
        "pinyin-transcript": [],
        "grammar": [],
        "practice": [],
        "hanzi": [],
        "application": [],
        "pronunciation": [],
    }
    lesson_documents = []

    for lesson in lessons:
        lesson_id = f"hsk2-tb-lesson-{lesson['number']:02d}"
        lesson_pages = list(range(lesson["pdfStart"], lesson["pdfEnd"] + 1))
        missing_printed_pages = detect_missing_printed_pages(lesson, pages)
        detected_by_kind = {
            "text": [lesson["pdfStart"] + 1, lesson["pdfStart"] + 2],
            "pinyin-transcript": [],
            "grammar": [lesson["pdfStart"] + 3],
            "practice": [lesson["pdfStart"] + 4],
            "pronunciation": [lesson["pdfStart"] + 5],
            "hanzi": [lesson["pdfStart"] + 6],
            "application": [lesson["pdfStart"] + 7],
        }
        warmup_blocks = make_blocks("warmup", lesson, [lesson["pdfStart"]], pages)
        blocks_by_kind["warmup"].extend(warmup_blocks)
        section_block_refs = {"warmup": [block["id"] for block in warmup_blocks]}
        for kind in ("pinyin-transcript", "grammar", "practice", "pronunciation", "hanzi", "application"):
            built = make_blocks(kind, lesson, detected_by_kind[kind], pages)
            blocks_by_kind[kind].extend(built)
            section_block_refs[kind] = [block["id"] for block in built]

        detected_scenes: dict[int, dict[str, Any]] = {}
        text_page_refs = [pages[number]["id"] for number in detected_by_kind["text"]]
        for page_number in detected_by_kind["text"]:
            page = pages[page_number]
            headers = track_headers(page, lesson["number"])
            for index, header in enumerate(headers):
                next_top = headers[index + 1]["top"] if index + 1 < len(headers) else None
                detected_scenes[header["scene"]] = extract_scene(page, header, next_top, lesson_id)
        fallback_page = text_page_refs[0] if text_page_refs else pages[min(lesson["pdfStart"] + 1, lesson["pdfEnd"])]["id"]
        scene_refs = []
        for scene_number in range(1, 5):
            track_code = f"{lesson['number']:02d}-{scene_number}"
            media_id = f"hsk2-tb-audio-l{lesson['number']:02d}-scene-{scene_number}"
            all_media.append(
                {
                    "id": media_id,
                    "kind": "audio",
                    "sourceTrackCode": track_code,
                    "availability": "not-in-supplied-pdf",
                    "requiredBy": f"{lesson_id}-scene-{scene_number}",
                }
            )
            scene = detected_scenes.get(scene_number)
            if scene is None:
                recovery = SCENE_RECOVERIES.get((lesson["number"], scene_number))
                if recovery:
                    scene = {
                        "id": f"{lesson_id}-scene-{scene_number}",
                        "lessonRef": lesson_id,
                        "sceneNumber": scene_number,
                        "title": {
                            "zh": recovery["titleZh"],
                            "pinyin": pinyin(recovery["titleZh"]),
                            "vi": SCENE_TITLE_VI.get(recovery["titleZh"]),
                            "viOcrRaw": None,
                        },
                        "trackCode": track_code,
                        "trackDetectionSource": "visual-review-recovery",
                        "sourcePageRef": pages[recovery["sourcePage"]]["id"],
                        "sourceRowIndexes": [],
                        "lines": [
                            {**line, "pinyin": pinyin(line["textZh"])}
                            for line in recovery["lines"]
                        ],
                        "transcriptionStatus": "visually-verified-recovery",
                    }
                else:
                    scene = {
                        "id": f"{lesson_id}-scene-{scene_number}",
                        "lessonRef": lesson_id,
                        "sceneNumber": scene_number,
                        "title": {"zh": None, "pinyin": None, "vi": None, "viOcrRaw": None},
                        "trackCode": track_code,
                        "trackDetectionSource": "source-pages-missing" if missing_printed_pages else "not-detected",
                        "sourcePageRef": pages[lesson["pdfStart"]]["id"] if missing_printed_pages else fallback_page,
                        "sourceRowIndexes": [],
                        "lines": [],
                        "transcriptionStatus": "source-pages-missing-cannot-transcribe"
                        if missing_printed_pages
                        else "ocr-track-anchor-missed-manual-review-required",
                    }
            scene["audioRef"] = media_id
            all_scenes.append(scene)
            scene_refs.append(scene["id"])

        lexemes = extract_lexemes_for_lesson(lesson, pages)
        all_lexemes.extend(lexemes)
        all_proper_names.extend(extract_proper_names(lesson, pages))
        grammar_refs = []
        for index, (title_zh, title_vi) in enumerate(GRAMMAR_TOPICS[lesson["number"]], start=1):
            grammar_id = f"hsk2-tb-l{lesson['number']:02d}-grammar-{index:02d}"
            grammar_refs.append(grammar_id)
            all_grammar_points.append(
                {
                    "id": grammar_id,
                    "lessonRef": lesson_id,
                    "sourceNumber": index,
                    "titleZh": title_zh,
                    "titleVi": title_vi,
                    "sourcePageRef": pages[lesson["pdfStart"] + 3]["id"],
                    "sourceEvidence": "table-of-contents-and-grammar-page",
                    "transcriptionStatus": "heading-normalized-needs-editorial-review",
                }
            )
        pronunciation_title, pronunciation_subtopics = PRONUNCIATION_TOPICS[lesson["number"]]
        pronunciation_id = f"hsk2-tb-l{lesson['number']:02d}-pronunciation"
        all_pronunciation_topics.append(
            {
                "id": pronunciation_id,
                "lessonRef": lesson_id,
                "titleZh": pronunciation_title,
                "pinyin": pinyin(pronunciation_title),
                "subtopicsZh": pronunciation_subtopics,
                "sourcePageRef": pages[lesson["pdfStart"] + 5]["id"],
                "sourceEvidence": "table-of-contents-and-pronunciation-page",
                "transcriptionStatus": "heading-normalized-needs-editorial-review",
            }
        )

        sections = [
            {"type": "warmup", "contentRefs": section_block_refs["warmup"]},
            {"type": "texts", "contentRefs": scene_refs, "sourcePageRefs": sorted(set(text_page_refs))},
            {"type": "vocabulary", "contentRefs": [entry["id"] for entry in lexemes]},
            {"type": "pinyin-transcript", "contentRefs": section_block_refs["pinyin-transcript"]},
            {"type": "grammar", "contentRefs": grammar_refs, "sourceBlockRefs": section_block_refs["grammar"]},
            {"type": "practice", "contentRefs": section_block_refs["practice"]},
            {"type": "hanzi", "contentRefs": section_block_refs["hanzi"]},
            {"type": "application", "contentRefs": section_block_refs["application"]},
            {"type": "pronunciation", "contentRefs": [pronunciation_id], "sourceBlockRefs": section_block_refs["pronunciation"]},
        ]
        document = {
            "$schema": "../schemas/textbook-lesson.schema.json",
            "schemaVersion": SCHEMA_VERSION,
            "id": lesson_id,
            "lessonNumber": lesson["number"],
            "status": "review",
            "title": {"zh": lesson["titleZh"], "pinyin": pinyin(lesson["titleZh"]), "vi": lesson["titleVi"]},
            "source": {
                "pdfPages": [lesson["pdfStart"], lesson["pdfEnd"]],
                "printedPages": [lesson["printedStart"], lesson["printedEnd"]],
                "missingPrintedPages": missing_printed_pages,
                "sourcePageRefs": [pages[number]["id"] for number in lesson_pages],
            },
            "sections": sections,
            "editorial": {
                "publicationReady": False,
                "answerStatus": "not-provided-in-source-pdf",
                "sourceGapStatus": "missing-pages-in-supplied-pdf" if missing_printed_pages else "complete-page-range",
                "requiredActions": [
                    "Đối chiếu OCR tiếng Trung, tiếng Việt và tên riêng với PDF.",
                    "Bổ sung audio theo mã track.",
                    "Rà soát quyền sử dụng hình minh họa.",
                ],
            },
        }
        lesson_documents.append(document)
        dump_json(output / "lessons" / f"lesson-{lesson['number']:02d}.json", document)

    recognized_names = {item.get("hanzi") for item in all_proper_names}
    for lesson_number, hanzi, meaning_vi, note_vi in CANONICAL_PROPER_NAMES:
        if hanzi in recognized_names:
            continue
        all_proper_names.append(
            {
                "id": f"hsk2-tb-l{lesson_number:02d}-proper-canonical",
                "lessonRef": f"hsk2-tb-lesson-{lesson_number:02d}",
                "hanzi": hanzi,
                "pinyin": pinyin(hanzi),
                "meaningVi": meaning_vi,
                "noteVi": note_vi,
                "sourcePageRef": pages[15 + (lesson_number - 1) * 8 + 2]["id"],
                "sourceEvidence": "table-of-contents-and-dialogue-page",
                "transcriptionStatus": "heading-normalized-needs-editorial-review",
            }
        )

    culture_documents = []
    for culture in cultures:
        page = pages[culture["pdfPage"]]
        culture_documents.append(
            {
                "id": f"hsk2-tb-culture-{culture['number']:02d}",
                "number": culture["number"],
                "title": {"zh": culture["titleZh"], "pinyin": pinyin(culture["titleZh"]), "vi": culture["titleVi"]},
                "sourcePageRef": page["id"],
                "printedPage": culture["printed"],
                "sourceRowIndexes": meaningful_row_indexes(page),
                "visualAssetStatus": "embedded-in-pdf-not-extracted",
                "transcriptionStatus": "page-block-ocr-needs-editorial-review",
            }
        )

    dump_json(output / "shared" / "lexemes.json", {"schemaVersion": SCHEMA_VERSION, "lexemes": all_lexemes})
    dump_json(output / "shared" / "text-scenes.json", {"schemaVersion": SCHEMA_VERSION, "scenes": all_scenes})
    dump_json(output / "shared" / "media-assets.json", {"schemaVersion": SCHEMA_VERSION, "assets": all_media})
    dump_json(output / "shared" / "proper-names.json", {"schemaVersion": SCHEMA_VERSION, "properNames": all_proper_names})
    dump_json(output / "shared" / "culture-notes.json", {"schemaVersion": SCHEMA_VERSION, "cultureNotes": culture_documents})
    dump_json(output / "shared" / "grammar-points.json", {"schemaVersion": SCHEMA_VERSION, "grammarPoints": all_grammar_points})
    dump_json(output / "shared" / "pronunciation-topics.json", {"schemaVersion": SCHEMA_VERSION, "pronunciationTopics": all_pronunciation_topics})
    for kind, blocks in blocks_by_kind.items():
        dump_json(output / "shared" / f"{kind}-blocks.json", {"schemaVersion": SCHEMA_VERSION, "blocks": blocks})
    dump_json(output / "shared" / "source-pages.json", {"schemaVersion": SCHEMA_VERSION, "pages": [pages[number] for number in sorted(pages)]})
    dump_json(output / "schemas" / "textbook-lesson.schema.json", build_schema())

    appendix_start = find_physical_for_printed(pages, 135)
    appendix_pages = list(range(appendix_start, max(pages) + 1)) if appendix_start else []
    dump_json(
        output / "appendices" / "vocabulary-summary.json",
        {
            "schemaVersion": SCHEMA_VERSION,
            "id": "hsk2-tb-vocabulary-appendix",
            "sourcePrintedPages": [135, 145],
            "sourcePageRefs": [pages[number]["id"] for number in appendix_pages],
            "sections": ["词语总表", "汉字总表", "偏旁总表"],
            "transcriptionStatus": "selective-page-ocr-available-in-source-pages",
        },
    )

    curriculum = {
        "schemaVersion": SCHEMA_VERSION,
        "id": "hsk2-standard-course-textbook",
        "title": "Giáo trình chuẩn HSK 2",
        "lessonCount": 15,
        "lessons": [
            {
                "lessonNumber": lesson["number"],
                "lessonRef": f"lessons/lesson-{lesson['number']:02d}.json",
                "titleZh": lesson["titleZh"],
                "titleVi": lesson["titleVi"],
                "pdfPages": [lesson["pdfStart"], lesson["pdfEnd"]],
                "printedPages": [lesson["printedStart"], lesson["printedEnd"]],
            }
            for lesson in lessons
        ],
        "cultureRefs": [note["id"] for note in culture_documents],
        "appendixRef": "appendices/vocabulary-summary.json",
    }
    dump_json(output / "curriculum.json", curriculum)

    non_noise_rows = [row for page in pages.values() for row in page["rows"] if not row["isNoise"]]
    source_analysis = {
        "schemaVersion": SCHEMA_VERSION,
        "sourceId": "hsk2-standard-course-textbook-vi-scan",
        "fileName": "HSK 2 Sách giáo khoa.pdf",
        "documentType": "scanned-textbook",
        "pageCount": 145,
        "textLayer": False,
        "language": ["zh-CN", "vi-VN", "Hanyu Pinyin"],
        "contentMap": {
            "frontMatter": [1, 14],
            "lessons": [lessons[0]["pdfStart"], lessons[-1]["pdfEnd"]],
            "culturePrintedPages": [54, 94, 134],
            "vocabularyAppendixPrintedPages": [135, 145],
        },
        "method": {
            "renderDpi": 140,
            "ocrEngine": "RapidOCR/ONNX Runtime",
            "ocrScope": "Table of contents, dialogue/vocabulary pages, grammar pages, culture pages and appendices.",
            "visualReview": "Table of contents and representative warm-up, dialogue, grammar, pronunciation, application and appendix pages were visually reviewed.",
        },
        "coverage": {
            "lessons": 15,
            "textScenes": len(all_scenes),
            "dialogueLines": sum(len(scene["lines"]) for scene in all_scenes),
            "dialogueLinesWithVietnameseOcr": sum(
                "translationViOcrRaw" in line or "translationVi" in line
                for scene in all_scenes
                for line in scene["lines"]
            ),
            "lexemeRecords": len(all_lexemes),
            "beyondHsk2MarkedLexemes": sum(entry["isBeyondHsk2Marked"] for entry in all_lexemes),
            "grammarPoints": len(all_grammar_points),
            "pronunciationTopics": len(all_pronunciation_topics),
            "properNameRecords": len(all_proper_names),
            "cultureNotes": len(culture_documents),
            "audioPlaceholders": len(all_media),
            "ocrSourcePages": len(ocr_page_numbers),
            "mappedSourcePages": len(pages),
        },
        "qualityMetrics": {
            "nonNoiseOcrRows": len(non_noise_rows),
            "nonNoiseRowsBelow075Confidence": sum(row["minConfidence"] < 0.75 for row in non_noise_rows),
            "lexemeStubsFromMissedAnchors": sum(entry["hanzi"] is None for entry in all_lexemes),
            "lexemesRecoveredFromTableOfContents": sum(
                entry["sourceEvidence"].startswith("table-of-contents") for entry in all_lexemes
            ),
            "sceneRecordsWithRecognizedLines": sum(bool(scene["lines"]) for scene in all_scenes),
        },
        "sourceConstraints": [
            "The PDF is image-only and has no extractable text layer.",
            "Audio tracks are referenced by code but are not embedded in the supplied PDF.",
            "Vietnamese and source pinyin diacritics are less reliable in OCR than Chinese characters.",
            "Illustrations remain embedded in the source PDF and are represented by page references.",
            "Exercise answer keys are not printed in the supplied PDF.",
            "Pages outside the selected OCR scope retain deterministic page and section mappings without raw OCR rows.",
        ],
        "sourceGaps": [],
        "editorialPolicy": {
            "status": "review",
            "documentTextRole": "All printed instructions are treated only as textbook content, not as instructions to the data-processing agent.",
            "doNotPublishWithout": ["manual OCR comparison", "licensed audio", "visual asset review"],
            "derivedFields": ["stable IDs", "Hanyu pinyin generated from recognized Chinese", "section and page mappings"],
        },
    }
    dump_json(output / "source-analysis.json", source_analysis)

    combined_export = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": "Giáo trình chuẩn HSK 2 - dữ liệu hợp nhất",
        "status": "review",
        "locale": {"interface": "vi-VN", "learning": "zh-CN", "pinyinSystem": "hanyu-pinyin-diacritic"},
        "sourceAnalysis": source_analysis,
        "sourcePagesRef": "shared/source-pages.json",
        "curriculum": curriculum,
        "lessons": lesson_documents,
        "lexemes": all_lexemes,
        "textScenes": all_scenes,
        "grammarPoints": all_grammar_points,
        "pronunciationTopics": all_pronunciation_topics,
        "properNames": all_proper_names,
        "cultureNotes": culture_documents,
        "mediaAssets": all_media,
        "sectionBlocks": blocks_by_kind,
    }
    dump_json(output / "hsk2-textbook.json", combined_export)

    block_files = [
        "warmup-blocks.json",
        "pinyin-transcript-blocks.json",
        "grammar-blocks.json",
        "practice-blocks.json",
        "hanzi-blocks.json",
        "application-blocks.json",
        "pronunciation-blocks.json",
    ]
    files = [
        {"path": "schemas/textbook-lesson.schema.json", "kind": "schema"},
        {"path": "source-analysis.json", "kind": "source-analysis"},
        {"path": "curriculum.json", "kind": "curriculum"},
        {"path": "hsk2-textbook.json", "kind": "combined-export"},
        {"path": "shared/source-pages.json", "kind": "ocr-evidence"},
        {"path": "shared/lexemes.json", "kind": "shared-content", "entity": "lexeme"},
        {"path": "shared/text-scenes.json", "kind": "shared-content", "entity": "text-scene"},
        {"path": "shared/grammar-points.json", "kind": "shared-content", "entity": "grammar-point"},
        {"path": "shared/pronunciation-topics.json", "kind": "shared-content", "entity": "pronunciation-topic"},
        {"path": "shared/proper-names.json", "kind": "shared-content", "entity": "proper-name"},
        {"path": "shared/culture-notes.json", "kind": "shared-content", "entity": "culture-note"},
        {"path": "shared/media-assets.json", "kind": "shared-content", "entity": "media"},
        {"path": "appendices/vocabulary-summary.json", "kind": "appendix"},
    ] + [{"path": f"shared/{name}", "kind": "shared-content", "entity": name.removesuffix("-blocks.json")} for name in block_files]
    files += [
        {"path": f"lessons/lesson-{lesson['number']:02d}.json", "kind": "lesson", "lessonNumber": lesson["number"]}
        for lesson in lessons
    ]
    manifest = {
        "schemaVersion": SCHEMA_VERSION,
        "bundleId": BUNDLE_ID,
        "title": "Bộ dữ liệu JSON từ Giáo trình chuẩn HSK 2",
        "description": "Dữ liệu 15 bài, 60 cảnh hội thoại, 169 mục từ được đánh số trong bài, chú thích ngữ pháp, luyện tập, ngữ âm, chữ Hán, vận dụng, văn hóa, media placeholder và bằng chứng OCR theo trang.",
        "locale": {"interface": "vi-VN", "learning": "zh-CN", "pinyinSystem": "hanyu-pinyin-diacritic"},
        "status": "review",
        "sourceRef": "source-analysis.json",
        "curriculumRef": "curriculum.json",
        "files": files,
        "counts": {
            "lessons": len(lesson_documents),
            "textScenes": len(all_scenes),
            "lexemes": len(all_lexemes),
            "properNames": len(all_proper_names),
            "grammarPoints": len(all_grammar_points),
            "pronunciationTopics": len(all_pronunciation_topics),
            "cultureNotes": len(culture_documents),
            "mediaPlaceholders": len(all_media),
            "ocrSourcePages": len(ocr_page_numbers),
            "mappedSourcePages": len(pages),
            "contentBlocks": sum(len(blocks) for blocks in blocks_by_kind.values()),
        },
    }
    dump_json(output / "manifest.json", manifest)


if __name__ == "__main__":
    main()
