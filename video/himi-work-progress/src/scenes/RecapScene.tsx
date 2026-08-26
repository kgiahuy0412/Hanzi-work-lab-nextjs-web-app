import {CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BrandBug} from "../components/BrandBug";
import {OfficeBackground} from "../components/OfficeBackground";

const words = [
  {hanzi: "进展", pinyin: "jìnzhǎn", meaning: "tiến độ / tiến triển", color: "#ff4c3b"},
  {hanzi: "百分之八十", pinyin: "bǎifēnzhī bāshí", meaning: "tám mươi phần trăm", color: "#ff8e2d"},
  {hanzi: "下班前", pinyin: "xiàbān qián", meaning: "trước khi tan làm", color: "#35aa82"},
];

export const RecapScene: React.FC<{portrait: boolean}> = ({portrait}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <OfficeBackground portrait={portrait}>
      <BrandBug portrait={portrait} step="Ghi nhớ nhanh" />
      <Interactive.Div name="Recap title" style={{position: "absolute", left: portrait ? 70 : 120, right: portrait ? 70 : 120, top: portrait ? 230 : 155, textAlign: "center", zIndex: 5, opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>
        <span style={{color: "#ff4c3b", fontSize: portrait ? 25 : 21, fontWeight: 950, letterSpacing: 2}}>3 TỪ KHÓA</span>
        <h2 style={{margin: portrait ? "16px 0 0" : "12px 0 0", color: "#222222", fontSize: portrait ? 72 : 62, letterSpacing: -2.8}}>Nói đúng trọng tâm</h2>
      </Interactive.Div>
      <div style={{position: "absolute", left: portrait ? 68 : 138, right: portrait ? 68 : 138, top: portrait ? 440 : 320, bottom: portrait ? 310 : 110, display: "grid", gridTemplateColumns: portrait ? "1fr" : "repeat(3, 1fr)", gap: portrait ? 24 : 28, zIndex: 5}}>
        {words.map((word, index) => (
          <div key={word.hanzi} style={{minHeight: portrait ? 260 : 410, padding: portrait ? "30px 40px" : "42px 38px", borderRadius: portrait ? 36 : 40, background: "rgba(255,255,255,.93)", border: "4px solid rgba(34,34,34,.06)", boxShadow: "0 24px 70px rgba(55,78,69,.12)", display: "flex", flexDirection: portrait ? "row" : "column", alignItems: "center", justifyContent: "center", textAlign: portrait ? "left" : "center", gap: portrait ? 34 : 0, opacity: interpolate(frame, [(0.3 + index * 0.28) * fps, (0.9 + index * 0.28) * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [(0.3 + index * 0.28) * fps, (0.9 + index * 0.28) * fps], ["0px 44px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 190})})}}>
            <span style={{flex: portrait ? "0 0 250px" : "none", color: word.color, fontSize: portrait ? 66 : word.hanzi.length > 4 ? 52 : 74, lineHeight: 1.12, fontWeight: 950}}>{word.hanzi}</span>
            <div><strong style={{display: "block", marginTop: portrait ? 0 : 24, color: "#147864", fontSize: portrait ? 29 : 27}}>{word.pinyin}</strong><span style={{display: "block", marginTop: 12, color: "#665e58", fontSize: portrait ? 26 : 24, lineHeight: 1.35}}>{word.meaning}</span></div>
          </div>
        ))}
      </div>
      <CanvasImage name="Recap Himi mascot" src={staticFile("brand/himi-mascot-icon.png")} width={portrait ? 260 : 200} height={portrait ? 260 : 200} fit="cover" style={{position: "absolute", right: portrait ? 54 : 80, bottom: portrait ? 42 : 28, borderRadius: "50%", border: "6px solid #ffffff", boxShadow: "0 18px 44px rgba(34,34,34,.12)"}} />
    </OfficeBackground>
  );
};
