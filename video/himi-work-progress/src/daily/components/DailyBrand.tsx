import {CanvasImage, staticFile} from "remotion";
import type {DailyScenario} from "../data";

export const DailyBrand: React.FC<{scenario: DailyScenario; step: string}> = ({scenario, step}) => (
  <div style={{position: "absolute", left: 84, right: 84, top: 44, height: 72, display: "flex", alignItems: "center", gap: 14, zIndex: 20}}>
    <CanvasImage name="Himi mascot logo" src={staticFile("brand/himi-mascot-icon.png")} width={66} height={66} fit="contain" style={{borderRadius: 20, border: "2px solid rgba(34,34,34,.08)"}} />
    <div style={{display: "flex", alignItems: "baseline", gap: 8, fontWeight: 900, fontSize: 31, letterSpacing: -1.2}}><strong style={{color: scenario.accent}}>Himi</strong><span style={{color: "#173f38"}}>Chinese</span></div>
    <span style={{marginLeft: "auto", padding: "11px 18px", borderRadius: 999, background: "rgba(255,255,255,.86)", border: "2px solid rgba(34,34,34,.06)", color: "#5e6d68", fontSize: 18, fontWeight: 850}}>{step}</span>
  </div>
);
