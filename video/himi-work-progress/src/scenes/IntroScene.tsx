import {CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BrandBug} from "../components/BrandBug";
import {OfficeBackground} from "../components/OfficeBackground";

export const IntroScene: React.FC<{portrait: boolean}> = ({portrait}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  return (
    <OfficeBackground portrait={portrait}>
      <BrandBug portrait={portrait} step="Tình huống 01" />
      <Interactive.Div name="Intro copy" style={{position: "absolute", left: portrait ? 72 : 116, right: portrait ? 72 : 720, top: portrait ? 310 : 280, zIndex: 4, opacity: interpolate(frame, [0, 0.7 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [0, 0.7 * fps], ["0px 54px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>
        <span style={{display: "inline-flex", padding: portrait ? "13px 20px" : "10px 16px", borderRadius: 999, background: "#222222", color: "#ffffff", fontSize: portrait ? 24 : 20, fontWeight: 900, letterSpacing: 1.2}}>TIẾNG TRUNG CÔNG SỞ</span>
        <h1 style={{margin: portrait ? "30px 0 22px" : "24px 0 16px", maxWidth: portrait ? 850 : 890, color: "#222222", fontSize: portrait ? 96 : 88, lineHeight: 1.02, letterSpacing: -4.2}}>Báo tiến độ<br /><span style={{color: "#ff4c3b"}}>với quản lý</span></h1>
        <p style={{margin: 0, maxWidth: 760, color: "#5f5750", fontSize: portrait ? 38 : 32, lineHeight: 1.4, fontWeight: 650}}>Xem tình huống, nghe câu mẫu rồi nói theo cùng Himi.</p>
        <div style={{display: "flex", gap: 14, marginTop: portrait ? 42 : 30}}>{["Xem", "Nghe", "Nói theo"].map((item, index) => <span key={item} style={{padding: portrait ? "15px 22px" : "11px 18px", borderRadius: 16, background: index === 1 ? "#ff8e2d" : "rgba(255,255,255,.86)", color: index === 1 ? "#ffffff" : "#222222", border: "2px solid rgba(34,34,34,.07)", fontSize: portrait ? 24 : 20, fontWeight: 900}}>{index + 1}. {item}</span>)}</div>
      </Interactive.Div>
      <div style={{position: "absolute", right: portrait ? 78 : 118, bottom: portrait ? 170 : 62, width: portrait ? 570 : 620, height: portrait ? 570 : 620, borderRadius: "48% 48% 44% 44%", background: "rgba(255,255,255,.75)", border: "8px solid rgba(255,255,255,.9)", boxShadow: "0 40px 100px rgba(50,87,75,.15)", scale: interpolate(frame, [0.15 * fps, 1.1 * fps], [0.72, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 170}), output: "perceptual-scale"}), rotate: interpolate(frame, [0.15 * fps, 1.1 * fps, 4.5 * fps], ["-7deg", "0deg", "2deg"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: [Easing.spring({damping: 160}), Easing.bezier(0.4, 0, 0.2, 1)]})}}>
        <CanvasImage name="Intro Himi mascot" src={staticFile("brand/himi-mascot-icon.png")} width={portrait ? 570 : 620} height={portrait ? 570 : 620} fit="cover" style={{borderRadius: "44%"}} />
      </div>
    </OfficeBackground>
  );
};
