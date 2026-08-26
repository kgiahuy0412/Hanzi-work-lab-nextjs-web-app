import {CanvasImage, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";

export const MascotRole: React.FC<{active: boolean; label: string; portrait: boolean; side: "left" | "right"}> = ({active, label, portrait, side}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <div style={{position: "absolute", left: side === "left" ? (portrait ? 76 : 122) : "auto", right: side === "right" ? (portrait ? 76 : 122) : "auto", bottom: portrait ? 260 : 86, width: portrait ? 294 : 310, height: portrait ? 360 : 360, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", opacity: active ? 1 : 0.64, scale: active ? interpolate(frame, [0, 0.28 * fps], [0.94, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 180}), output: "perceptual-scale"}) : 0.92}}>
      <div style={{position: "relative", width: portrait ? 250 : 270, height: portrait ? 250 : 270, borderRadius: "50%", background: active ? "#ffffff" : "rgba(255,255,255,.74)", border: active ? "8px solid #ff8e2d" : "5px solid rgba(34,34,34,.08)", boxShadow: active ? "0 24px 60px rgba(255, 142, 45, .22)" : "0 18px 44px rgba(34,34,34,.08)", overflow: "hidden"}}>
        <CanvasImage name={`${label} Himi mascot`} src={staticFile("brand/himi-mascot-icon.png")} width={portrait ? 250 : 270} height={portrait ? 250 : 270} fit="cover" />
        {active ? <div style={{position: "absolute", right: 10, top: 14, width: 58, height: 44, display: "flex", gap: 6, alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#ffffff"}}>{[20, 32, 24].map((height, index) => <span key={index} style={{display: "block", width: 6, height, borderRadius: 999, background: "#ff4c3b"}} />)}</div> : null}
      </div>
      <div style={{marginTop: -16, minWidth: portrait ? 212 : 220, padding: portrait ? "14px 22px" : "12px 20px", borderRadius: 999, background: active ? "#222222" : "#ffffff", color: active ? "#ffffff" : "#655d57", border: "3px solid #ffffff", textAlign: "center", fontSize: portrait ? 24 : 22, fontWeight: 900, boxShadow: "0 14px 28px rgba(34,34,34,.12)"}}>{label}</div>
    </div>
  );
};
