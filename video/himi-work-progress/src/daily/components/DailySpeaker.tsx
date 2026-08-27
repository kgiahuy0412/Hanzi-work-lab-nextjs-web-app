import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {DailyScenario} from "../data";

export const DailySpeaker: React.FC<{active: boolean; label: string; side: "left" | "right"; scenario: DailyScenario}> = ({active, label, side, scenario}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = interpolate(frame, [0, 0.45 * fps], [side === "left" ? -54 : 54, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 180})});

  return <div style={{position: "absolute", left: side === "left" ? 86 : "auto", right: side === "right" ? 86 : "auto", bottom: 75, width: 285, display: "flex", flexDirection: "column", alignItems: "center", zIndex: 7, opacity: active ? 1 : 0.62, translate: `${enter}px 0px`, scale: active ? 1 : 0.92}}>
    <div style={{width: 245, height: 245, overflow: "hidden", borderRadius: 72, background: "rgba(255,255,255,.82)", border: active ? `8px solid ${scenario.accent}` : "5px solid rgba(34,34,34,.08)", boxShadow: active ? `0 24px 56px ${scenario.accentSoft}` : "0 18px 44px rgba(34,34,34,.08)"}}>
      <CanvasImage name={`${label} mascot`} src={staticFile("brand/himi-mascot-icon.png")} width={245} height={245} fit="cover" />
    </div>
    <div style={{marginTop: -18, minWidth: 220, padding: "12px 20px", borderRadius: 999, background: active ? "#173f38" : "#ffffff", color: active ? "#ffffff" : "#5e6d68", border: "3px solid #ffffff", textAlign: "center", fontSize: 21, fontWeight: 900, boxShadow: "0 14px 28px rgba(34,34,34,.1)"}}>{label}</div>
  </div>;
};
