import {AbsoluteFill, Easing, Interactive, interpolate, useCurrentFrame, useVideoConfig} from "remotion";

export const OfficeBackground: React.FC<React.PropsWithChildren<{portrait: boolean}>> = ({children, portrait}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <AbsoluteFill
      name="Warm office background"
      style={{
        background: "linear-gradient(145deg, #fffaf3 0%, #fff4e8 48%, #e8f8f0 100%)",
        overflow: "hidden",
      }}
    >
      <Interactive.Div
        name="Sun glow"
        style={{
          position: "absolute",
          width: portrait ? 900 : 1180,
          height: portrait ? 900 : 1180,
          borderRadius: "50%",
          top: portrait ? -390 : -600,
          right: portrait ? -480 : -220,
          background: "radial-gradient(circle, rgba(255, 200, 102, .32), rgba(255, 244, 222, 0) 68%)",
          opacity: interpolate(frame, [0, 2 * fps], [0.35, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      />
      <div style={{position: "absolute", left: portrait ? -140 : -80, bottom: portrait ? 250 : -250, width: portrait ? 860 : 980, height: portrait ? 860 : 980, borderRadius: "50%", background: "rgba(125, 214, 179, .2)"}} />
      <div style={{position: "absolute", right: portrait ? -250 : 110, bottom: portrait ? -180 : -560, width: portrait ? 920 : 1180, height: portrait ? 920 : 1180, borderRadius: "50%", background: "rgba(255, 142, 45, .12)"}} />
      <div style={{position: "absolute", inset: portrait ? "120px 54px auto 54px" : "64px 92px auto 92px", height: portrait ? 520 : 260, borderRadius: portrait ? 52 : 42, border: "3px solid rgba(34, 34, 34, .06)", background: "linear-gradient(180deg, rgba(218, 240, 255, .86), rgba(255,255,255,.58))", boxShadow: "inset 0 0 0 14px rgba(255,255,255,.35)"}}>
        <div style={{position: "absolute", left: "50%", top: 0, bottom: 0, width: 3, background: "rgba(34,34,34,.06)"}} />
        <div style={{position: "absolute", left: 0, right: 0, top: "52%", height: 3, background: "rgba(34,34,34,.06)"}} />
      </div>
      <div style={{position: "absolute", left: portrait ? 38 : 64, bottom: portrait ? 72 : 44, width: portrait ? 148 : 122, height: portrait ? 240 : 200}}>
        <div style={{position: "absolute", left: 45, bottom: 0, width: 74, height: 84, borderRadius: "18px 18px 28px 28px", background: "#ff8e2d"}} />
        {[[-8, 30, -28], [12, 0, 10], [64, 8, 38], [82, 38, 68]].map(([left, rotate, top], index) => (
          <div key={index} style={{position: "absolute", left, top, width: 78, height: 132, borderRadius: "60% 12% 60% 12%", rotate: `${rotate}deg`, background: index % 2 ? "#58b995" : "#77cbaa"}} />
        ))}
      </div>
      {children}
    </AbsoluteFill>
  );
};
