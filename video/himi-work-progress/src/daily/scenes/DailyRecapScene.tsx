import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {DailyScenario} from "../data";
import {DailyBackground} from "../components/DailyBackground";
import {DailyBrand} from "../components/DailyBrand";

export const DailyRecapScene: React.FC<{scenario: DailyScenario}> = ({scenario}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return <DailyBackground scenario={scenario}>
    <DailyBrand scenario={scenario} step="Ghi nhớ nhanh" />
    <div style={{position: "absolute", left: 120, right: 120, top: 155, textAlign: "center", zIndex: 5, opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>
      <span style={{color: scenario.accent, fontSize: 21, fontWeight: 950, letterSpacing: 2}}>3 CỤM DÙNG NGAY</span>
      <h2 style={{margin: "12px 0 0", color: "#173f38", fontSize: 62, letterSpacing: -2.8}}>Mang theo sau video</h2>
    </div>
    <div style={{position: "absolute", left: 138, right: 138, top: 320, bottom: 110, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28, zIndex: 5}}>{scenario.lines.map((line, index) => <div key={line.id} style={{minHeight: 410, padding: "42px 34px", borderRadius: 40, background: "rgba(255,255,255,.94)", border: "4px solid rgba(34,34,34,.06)", boxShadow: "0 24px 70px rgba(55,78,69,.12)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", opacity: interpolate(frame, [(0.3 + index * 0.28) * fps, (0.9 + index * 0.28) * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [(0.3 + index * 0.28) * fps, (0.9 + index * 0.28) * fps], ["0px 44px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 190})})}}>
      <span style={{color: index === 1 ? "#167f7a" : scenario.accent, fontSize: line.keyword.length > 4 ? 50 : 70, lineHeight: 1.12, fontWeight: 950}}>{line.keyword}</span>
      <strong style={{display: "block", marginTop: 24, color: "#167f7a", fontSize: 25}}>{line.pinyin}</strong>
      <span style={{display: "block", marginTop: 12, color: "#5e6d68", fontSize: 23, lineHeight: 1.35}}>{line.vietnamese}</span>
    </div>)}</div>
    <CanvasImage name="Himi recap mascot" src={staticFile("brand/himi-mascot-icon.png")} width={200} height={200} fit="cover" style={{position: "absolute", right: 80, bottom: 28, borderRadius: "50%", border: "6px solid #ffffff", boxShadow: "0 18px 44px rgba(34,34,34,.12)"}} />
  </DailyBackground>;
};
