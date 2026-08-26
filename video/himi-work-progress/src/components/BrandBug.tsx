import {CanvasImage, Interactive, staticFile} from "remotion";

export const BrandBug: React.FC<{portrait: boolean; step: string}> = ({portrait, step}) => (
  <Interactive.Div name="Himi Chinese brand" style={{position: "absolute", left: portrait ? 64 : 84, right: portrait ? 64 : 84, top: portrait ? 54 : 46, height: portrait ? 92 : 70, display: "flex", alignItems: "center", gap: portrait ? 18 : 14, zIndex: 20}}>
    <CanvasImage name="Himi mascot logo" src={staticFile("brand/himi-mascot-icon.png")} width={portrait ? 88 : 66} height={portrait ? 88 : 66} fit="contain" style={{borderRadius: portrait ? 24 : 20, border: "2px solid rgba(34,34,34,.08)"}} />
    <div style={{display: "flex", alignItems: "baseline", gap: 9, fontWeight: 900, fontSize: portrait ? 36 : 31, letterSpacing: -1.3}}><strong style={{color: "#ff4c3b"}}>Himi</strong><span style={{color: "#222222"}}>Chinese</span></div>
    <span style={{marginLeft: "auto", minWidth: portrait ? 178 : 156, padding: portrait ? "14px 20px" : "10px 16px", borderRadius: 999, background: "rgba(255,255,255,.82)", border: "2px solid rgba(34,34,34,.06)", color: "#675d55", fontSize: portrait ? 22 : 18, fontWeight: 800, textAlign: "center"}}>{step}</span>
  </Interactive.Div>
);
