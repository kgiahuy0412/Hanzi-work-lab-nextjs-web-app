import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";

type RawTopicItem = {
  id?: unknown;
  item_type?: unknown;
  type?: unknown;
  hanzi?: unknown;
  chinese_text?: unknown;
  pinyin?: unknown;
  vietnamese?: unknown;
  vi?: unknown;
  audio_normal_path?: unknown;
  normal_audio?: unknown;
  enabled?: unknown;
};

type RawTopic = {
  id?: unknown;
  batch_id?: unknown;
  scope?: unknown;
  lesson_title_cn?: unknown;
  lesson_title_vi?: unknown;
  zh?: unknown;
  vi?: unknown;
  color?: unknown;
  items?: unknown;
};

function requiredString(value: unknown, field: string) {
  if (typeof value !== "string" || !value.trim()) throw new Error(`Thiếu trường ${field}.`);
  return value.trim();
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizedAssetPath(value: string) {
  const normalized = value.replaceAll("\\", "/").replace(/^\/+/, "");
  if (!normalized || normalized.split("/").includes("..")) throw new Error(`Đường dẫn audio không hợp lệ: ${value}`);
  return normalized;
}

const sourceArgument = process.argv[2];
if (!sourceArgument) {
  throw new Error("Cách dùng: npm run content:high-frequency:import -- <đường-dẫn-file-js>");
}

const sourceFile = resolve(sourceArgument);
const sourcePublicDirectory = dirname(sourceFile);
const targetDataFile = resolve(process.cwd(), "content", "high-frequency-topics.json");
const targetPublicDirectory = resolve(process.cwd(), "public");
const source = readFileSync(sourceFile, "utf8");
const payload = source.match(/const\s+highFrequencyV1Final27Topics\s*=\s*([\s\S]*?);\s*root\.highFrequencyTopics/);

if (!payload) throw new Error("Không tìm thấy mảng highFrequencyV1Final27Topics trong file nguồn.");

const rawTopics = JSON.parse(payload[1]) as unknown;
if (!Array.isArray(rawTopics)) throw new Error("Dữ liệu chủ đề phải là một mảng.");

let copiedAudioFiles = 0;
const topics = (rawTopics as RawTopic[]).map((topic, topicIndex) => {
  const id = requiredString(topic.id, `topics[${topicIndex}].id`);
  const rawItems = Array.isArray(topic.items) ? topic.items as RawTopicItem[] : [];
  const enabledItems = rawItems.filter((item) => item.enabled !== false);
  const words = enabledItems.filter((item) => (item.type ?? item.item_type) === "word").map((item, itemIndex) => {
    const audioPath = normalizedAssetPath(requiredString(
      item.audio_normal_path ?? item.normal_audio,
      `${id}.words[${itemIndex}].audio_normal_path`,
    ));
    const sourceAudioFile = resolve(sourcePublicDirectory, ...audioPath.split("/"));
    const sourceRelative = relative(sourcePublicDirectory, sourceAudioFile);
    if (sourceRelative.startsWith(`..${sep}`) || sourceRelative === ".." || isAbsolute(sourceRelative)) {
      throw new Error(`Audio nằm ngoài thư mục public nguồn: ${audioPath}`);
    }
    if (!existsSync(sourceAudioFile)) throw new Error(`Không tìm thấy audio: ${sourceAudioFile}`);

    const targetAudioFile = resolve(targetPublicDirectory, ...audioPath.split("/"));
    mkdirSync(dirname(targetAudioFile), { recursive: true });
    copyFileSync(sourceAudioFile, targetAudioFile);
    copiedAudioFiles += 1;

    return {
      id: requiredString(item.id, `${id}.words[${itemIndex}].id`),
      hanzi: requiredString(item.hanzi ?? item.chinese_text, `${id}.words[${itemIndex}].hanzi`),
      pinyin: requiredString(item.pinyin, `${id}.words[${itemIndex}].pinyin`),
      meaning: requiredString(item.vietnamese ?? item.vi, `${id}.words[${itemIndex}].vietnamese`),
      audioUrl: `/${audioPath}`,
    };
  });
  const sentences = enabledItems.filter((item) => (item.type ?? item.item_type) === "sentence").map((item, itemIndex) => ({
    id: requiredString(item.id, `${id}.sentences[${itemIndex}].id`),
    hanzi: requiredString(item.hanzi ?? item.chinese_text, `${id}.sentences[${itemIndex}].hanzi`),
    pinyin: requiredString(item.pinyin, `${id}.sentences[${itemIndex}].pinyin`),
    translation: requiredString(item.vietnamese ?? item.vi, `${id}.sentences[${itemIndex}].vietnamese`),
  }));

  if (!words.length || !sentences.length) throw new Error(`Chủ đề ${id} phải có cả từ vựng và câu mẫu.`);

  return {
    id,
    group: requiredString(topic.batch_id ?? topic.scope, `${id}.group`),
    titleVi: requiredString(topic.lesson_title_vi ?? topic.vi, `${id}.titleVi`),
    titleZh: requiredString(topic.lesson_title_cn ?? topic.zh, `${id}.titleZh`),
    color: optionalString(topic.color) ?? "#0f766e",
    words,
    sentences,
  };
});

if (topics.length !== 27) throw new Error(`Mong đợi 27 chủ đề, nhận được ${topics.length}.`);

mkdirSync(dirname(targetDataFile), { recursive: true });
writeFileSync(targetDataFile, `${JSON.stringify(topics, null, 2)}\n`, "utf8");

const wordCount = topics.reduce((total, topic) => total + topic.words.length, 0);
const sentenceCount = topics.reduce((total, topic) => total + topic.sentences.length, 0);
console.log(`Đã nhập ${topics.length} chủ đề, ${wordCount} từ, ${sentenceCount} câu và ${copiedAudioFiles} file audio.`);

