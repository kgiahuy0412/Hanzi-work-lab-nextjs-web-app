import {CanvasImage, Easing, Interactive, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {BrandBug} from "../components/BrandBug";
import {OfficeBackground} from "../components/OfficeBackground";

const options = ["我今天下班前发给您。", "项目进展怎么样了？", "我还没有开始。"];

export const QuizScene: React.FC<{portrait: boolean}> = ({portrait}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const reveal = frame >= 7 * fps;

  return (
    <OfficeBackground portrait={portrait}>
      <BrandBug portrait={portrait} step="Kiểm tra nhanh" />
      <Interactive.Div name="Quiz prompt" style={{position: "absolute", left: portrait ? 66 : 150, right: portrait ? 66 : 150, top: portrait ? 230 : 145, zIndex: 5, textAlign: "center", opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)})}}>
        <span style={{display: "inline-flex", padding: portrait ? "12px 20px" : "9px 16px", borderRadius: 999, background: "#222222", color: "#ffffff", fontSize: portrait ? 23 : 19, fontWeight: 950, letterSpacing: 1.5}}>CHỌN 1 ĐÁP ÁN</span>
        <h2 style={{margin: portrait ? "26px auto 0" : "18px auto 0", maxWidth: portrait ? 900 : 1200, color: "#222222", fontSize: portrait ? 62 : 58, lineHeight: 1.18, letterSpacing: -2.4}}>Bạn sẽ nói câu nào để hứa gửi<br />trước khi tan làm?</h2>
      </Interactive.Div>
      <div style={{position: "absolute", left: portrait ? 66 : 310, right: portrait ? 66 : 310, top: portrait ? 610 : 390, display: "grid", gap: portrait ? 26 : 20, zIndex: 6}}>
        {options.map((option, index) => {
          const correct = index === 0;
          return <div key={option} style={{minHeight: portrait ? 150 : 122, padding: portrait ? "28px 34px" : "22px 34px", borderRadius: portrait ? 34 : 30, display: "flex", alignItems: "center", gap: portrait ? 26 : 22, background: reveal && correct ? "#dff8ea" : "rgba(255,255,255,.94)", border: reveal && correct ? "5px solid #35aa82" : "4px solid rgba(34,34,34,.07)", boxShadow: reveal && correct ? "0 20px 50px rgba(53,170,130,.2)" : "0 16px 44px rgba(55,78,69,.1)", opacity: interpolate(frame, [(0.4 + index * 0.22) * fps, (0.9 + index * 0.22) * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [(0.4 + index * 0.22) * fps, (0.9 + index * 0.22) * fps], ["42px 0px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 190})})}}>
            <span style={{width: portrait ? 64 : 54, height: portrait ? 64 : 54, flex: "0 0 auto", display: "grid", placeItems: "center", borderRadius: "50%", background: reveal && correct ? "#35aa82" : index === 0 ? "#fff0ed" : "#f3f0ec", color: reveal && correct ? "#ffffff" : "#222222", fontSize: portrait ? 28 : 24, fontWeight: 950}}>{reveal && correct ? "✓" : String.fromCharCode(65 + index)}</span>
            <strong style={{color: "#222222", fontSize: portrait ? 41 : 35, fontWeight: 900}}>{option}</strong>
          </div>;
        })}
      </div>
      {reveal ? <div style={{position: "absolute", left: "50%", bottom: portrait ? 370 : 52, translate: "-50% 0px", zIndex: 8, width: portrait ? 680 : "auto", minWidth: portrait ? undefined : 520, padding: portrait ? "18px 26px" : "16px 26px", borderRadius: 999, background: "#ff4c3b", color: "#ffffff", textAlign: "center", fontSize: portrait ? 25 : 23, lineHeight: 1.25, fontWeight: 950, boxShadow: "0 18px 44px rgba(255,76,59,.28)", scale: interpolate(frame, [7 * fps, 7.45 * fps], [0.8, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 160}), output: "perceptual-scale"})}}>Chính xác! Luyện lại câu này trong Himi Chinese.</div> : null}
      <CanvasImage name="Quiz Himi mascot" src={staticFile("brand/himi-mascot-icon.png")} width={portrait ? 300 : 210} height={portrait ? 300 : 210} fit="cover" style={{position: "absolute", left: portrait ? 40 : 70, bottom: portrait ? 40 : 26, borderRadius: "50%", border: "6px solid #ffffff", boxShadow: "0 18px 44px rgba(34,34,34,.12)"}} />
    </OfficeBackground>
  );
};
