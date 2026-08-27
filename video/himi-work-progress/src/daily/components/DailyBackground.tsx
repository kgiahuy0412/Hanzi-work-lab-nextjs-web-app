import {AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {DailyScenario} from "../data";

export const DailyBackground: React.FC<React.PropsWithChildren<{scenario: DailyScenario}>> = ({children, scenario}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const drift = interpolate(frame, [0, 8 * fps], [0, 36], {extrapolateLeft: "clamp", extrapolateRight: "extend"});

  return (
    <AbsoluteFill style={{background: scenario.landscape, overflow: "hidden", fontFamily: "Arial, 'Noto Sans SC', sans-serif"}}>
      <div style={{position: "absolute", inset: 0, opacity: 0.38, backgroundImage: "radial-gradient(rgba(22,127,122,.14) 1.5px, transparent 1.5px)", backgroundSize: "34px 34px"}} />
      <div style={{position: "absolute", left: -180, bottom: -510, width: 1100, height: 920, borderRadius: "50%", background: scenario.accentSoft, rotate: "-8deg"}} />
      <div style={{position: "absolute", right: -260, top: -520, width: 1050, height: 1050, borderRadius: "50%", background: "rgba(255,255,255,.54)"}} />
      <div style={{position: "absolute", right: 120 + drift, bottom: 94, width: 330, height: 82, borderRadius: "50%", background: "rgba(34,34,34,.07)", filter: "blur(14px)"}} />
      <div style={{position: "absolute", right: 155 + drift, bottom: 112, width: 250, height: 250, display: "grid", placeItems: "center", borderRadius: 72, background: "rgba(255,255,255,.74)", border: "5px solid rgba(255,255,255,.78)", boxShadow: "0 26px 70px rgba(43,75,67,.12)", fontSize: 118, rotate: `${interpolate(frame, [0, 4 * fps], [-5, 3], {extrapolateRight: "extend", easing: Easing.inOut(Easing.ease)})}deg`}}>{scenario.icon}</div>
      {[0, 1, 2].map((index) => <div key={index} style={{position: "absolute", left: 94 + index * 72, top: 185 + (index % 2) * 56, width: 20 + index * 5, height: 20 + index * 5, borderRadius: index === 1 ? 7 : "50%", background: index === 1 ? scenario.accent : "rgba(255,255,255,.9)", rotate: `${frame * (index + 1) * 0.08}deg`, opacity: 0.75}} />)}
      {children}
    </AbsoluteFill>
  );
};
