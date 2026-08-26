import {execFileSync} from "node:child_process";
import {existsSync, mkdirSync, readFileSync, writeFileSync} from "node:fs";
import {resolve} from "node:path";

const clips = [
  ["store-01", "您好，需要袋子吗？", "zh-CN-XiaoxiaoNeural"],
  ["store-02", "需要一个，谢谢。", "zh-CN-YunxiNeural"],
  ["store-03", "可以用手机支付吗？", "zh-CN-YunxiNeural"],
  ["food-01", "您好，想吃点儿什么？", "zh-CN-XiaoxiaoNeural"],
  ["food-02", "我要一碗牛肉面。", "zh-CN-YunxiNeural"],
  ["food-03", "请少放一点辣椒。", "zh-CN-YunxiNeural"],
  ["metro-01", "请问，地铁站怎么走？", "zh-CN-XiaoxiaoNeural"],
  ["metro-02", "一直走，然后向右转。", "zh-CN-YunxiNeural"],
  ["metro-03", "离这里远吗？", "zh-CN-XiaoxiaoNeural"],
];

const outputDirectory = resolve(process.cwd(), "public", "audio", "daily");
const npmExecPath = process.env.npm_execpath;
if (!npmExecPath) throw new Error("Run this generator with npm run audio:daily.");
mkdirSync(outputDirectory, {recursive: true});

const durationMs = (filePath) => Math.round(Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath], {encoding: "utf8"}).trim()) * 1000);
const manifest = [];

for (const [id, text, voice] of clips) {
  const filePath = resolve(outputDirectory, `${id}.mp3`);
  if (!existsSync(filePath)) {
    console.log(`Generating ${id}.mp3`);
    execFileSync(process.execPath, [npmExecPath, "exec", "--yes", "--package=@andresaya/edge-tts", "--", "edge-tts", "synthesize", "--text", text, "--voice", voice, "--rate=-8%", "--output", `public/audio/daily/${id}`], {stdio: "inherit"});
  }
  const bytes = readFileSync(filePath);
  if (bytes.subarray(0, 3).toString("ascii") !== "ID3" && bytes[0] !== 0xff) throw new Error(`${id}.mp3 is not a valid MP3 file.`);
  manifest.push({id, text, voice, rate: "-8%", durationMs: durationMs(filePath), sizeBytes: bytes.length});
}

writeFileSync(resolve(outputDirectory, "manifest.json"), `${JSON.stringify({version: 1, generatedAt: new Date().toISOString(), clips: manifest}, null, 2)}\n`, "utf8");
console.log(`Generated ${manifest.length} daily-life voice clips.`);
