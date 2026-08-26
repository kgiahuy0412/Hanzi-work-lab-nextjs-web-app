import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {DailyScenario} from "../data";
import {DailyBackground} from "../components/DailyBackground";
import {DailyBrand} from "../components/DailyBrand";

export const DailyQuizScene: React.FC<{scenario: DailyScenario}> = ({scenario}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = frame >= 7 * fps;

  return <DailyBackground scenario={scenario}>
    <DailyBrand scenario={scenario} step="Kiểm tra nhanh" />
    <div style={{position: "absolute", left: 150, right: 150, top: 145, zIndex: 5, textAlign: "center", opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>
      <span style={{display: "inline-flex", padding: "9px 16px", borderRadius: 999, background: "#173f38", color: "#ffffff", fontSize: 19, fontWeight: 950, letterSpacing: 1.5}}>CHỌN 1 ĐÁP ÁN</span>
      <h2 style={{margin: "18px auto 0", maxWidth: 1250, color: "#173f38", fontSize: 52, lineHeight: 1.18, letterSpacing: -2.2}}>{scenario.quiz.prompt}</h2>
    </div>
    <div style={{position: "absolute", left: 310, right: 310, top: 390, display: "grid", gap: 20, zIndex: 6}}>{scenario.quiz.options.map((option, index) => {
      const correct = index === scenario.quiz.correctIndex;
      return <div key={option} style={{minHeight: 122, padding: "22px 34px", borderRadius: 30, display: "flex", alignItems: "center", gap: 22, background: reveal && correct ? "#dcf6e8" : "rgba(255,255,255,.95)", border: reveal && correct ? "5px solid #2ea978" : "4px solid rgba(34,34,34,.07)", boxShadow: reveal && correct ? "0 20px 50px rgba(46,169,120,.2)" : "0 16px 44px rgba(55,78,69,.1)", opacity: interpolate(frame, [(0.4 + index * 0.22) * fps, (0.9 + index * 0.22) * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [(0.4 + index * 0.22) * fps, (0.9 + index * 0.22) * fps], ["42px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 190})})}}>
        <span style={{width: 54, height: 54, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: "50%", background: reveal && correct ? "#2ea978" : scenario.accentSoft, color: reveal && correct ? "#ffffff" : "#173f38", fontSize: 24, fontWeight: 950}}>{reveal && correct ? "✓" : String.fromCharCode(65 + index)}</span>
        <strong style={{color: "#173f38", fontSize: 34, fontWeight: 900}}>{option}</strong>
      </div>;
    })}</div>
    {reveal ? <div style={{position: "absolute", left: "50%", bottom: 52, translate: "-50% 0px", zIndex: 8, minWidth: 650, padding: "16px 28px", borderRadius: 999, background: scenario.accent, color: "#ffffff", textAlign: "center", fontSize: 22, lineHeight: 1.25, fontWeight: 950, boxShadow: `0 18px 44px ${scenario.accentSoft}`, scale: interpolate(frame, [7 * fps, 7.45 * fps], [0.8, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 160}), output: "perceptual-scale"})}}>{scenario.quiz.feedback}</div> : null}
    <CanvasImage name="Himi quiz mascot" src={staticFile("brand/himi-mascot-icon.png")} width={210} height={210} fit="cover" style={{position: "absolute", left: 70, bottom: 26, borderRadius: "50%", border: "6px solid #ffffff", boxShadow: "0 18px 44px rgba(34,34,34,.12)"}} />
  </DailyBackground>;
};
