import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {DailyScenario} from "../data";
import {DailyBackground} from "../components/DailyBackground";
import {DailyBrand} from "../components/DailyBrand";

export const DailyIntroScene: React.FC<{scenario: DailyScenario}> = ({scenario}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = interpolate(frame, [0, 0.75 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)});

  return <DailyBackground scenario={scenario}>
    <DailyBrand scenario={scenario} step={scenario.episode} />
    <div style={{position: "absolute", left: 116, right: 770, top: 250, zIndex: 5, opacity: enter, translate: `0px ${interpolate(enter, [0, 1], [48, 0])}px`}}>
      <span style={{display: "inline-flex", padding: "10px 17px", borderRadius: 999, background: "#173f38", color: "#ffffff", fontSize: 20, fontWeight: 900, letterSpacing: 1.25}}>{scenario.eyebrow}</span>
      <h1 style={{margin: "25px 0 18px", color: "#173f38", fontSize: 86, lineHeight: 1.03, letterSpacing: -4.2}}>{scenario.title}<br /><span style={{color: scenario.accent}}>{scenario.titleAccent}</span></h1>
      <p style={{margin: 0, maxWidth: 820, color: "#526b64", fontSize: 30, lineHeight: 1.45, fontWeight: 650}}>{scenario.summary}</p>
      <div style={{display: "flex", gap: 14, marginTop: 31}}>{["Xem", "Nghe", "Nói theo"].map((item, index) => <span key={item} style={{padding: "11px 18px", borderRadius: 16, background: index === 1 ? scenario.accent : "rgba(255,255,255,.86)", color: index === 1 ? "#ffffff" : "#173f38", border: "2px solid rgba(34,34,34,.06)", fontSize: 20, fontWeight: 900}}>{index + 1}. {item}</span>)}</div>
    </div>
    <div style={{position: "absolute", right: 112, bottom: 72, width: 600, height: 600, borderRadius: "46%", background: "rgba(255,255,255,.74)", border: "8px solid rgba(255,255,255,.88)", boxShadow: "0 40px 100px rgba(50,87,75,.15)", scale: interpolate(frame, [0.15 * fps, 1.1 * fps], [0.76, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 170}), output: "perceptual-scale"}), rotate: `${interpolate(frame, [0.15 * fps, 1.1 * fps, 4.5 * fps], [-7, 0, 2], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: [Easing.spring({damping: 160}), Easing.bezier(0.4, 0, 0.2, 1)]})}deg`}}>
      <CanvasImage name="Himi daily life mascot" src={staticFile("brand/himi-mascot-icon.png")} width={600} height={600} fit="cover" style={{borderRadius: "43%"}} />
      <div style={{position: "absolute", right: -20, top: 30, width: 126, height: 126, display: "grid", placeItems: "center", borderRadius: 38, background: scenario.accent, border: "7px solid #ffffff", color: "#ffffff", fontSize: 64, boxShadow: "0 18px 40px rgba(34,34,34,.12)"}}>{scenario.icon}</div>
    </div>
  </DailyBackground>;
};
