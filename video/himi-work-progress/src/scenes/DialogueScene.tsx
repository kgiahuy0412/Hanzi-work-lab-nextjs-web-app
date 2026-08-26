import {Audio} from "@remotion/media";
import {Easing, Interactive, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {DialogueLine} from "../data";
import {BrandBug} from "../components/BrandBug";
import {MascotRole} from "../components/MascotRole";
import {OfficeBackground} from "../components/OfficeBackground";

export const DialogueScene: React.FC<{line: DialogueLine; portrait: boolean; step: string}> = ({line, portrait, step}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shadowStart = 4 * fps;
  const shadowSeconds = Math.max(1, 7 - Math.floor((frame - shadowStart) / fps));
  const isShadowing = frame >= shadowStart;

  return (
    <OfficeBackground portrait={portrait}>
      <BrandBug portrait={portrait} step={step} />
      <div style={{position: "absolute", left: portrait ? 56 : 390, right: portrait ? 56 : 390, top: portrait ? 250 : 155, zIndex: 10}}>
        <Interactive.Div name={`${line.id} dialogue bubble`} style={{minHeight: portrait ? 590 : 420, padding: portrait ? "48px 48px 42px" : "38px 54px 34px", borderRadius: portrait ? 48 : 42, background: "rgba(255,255,255,.94)", border: "4px solid rgba(34,34,34,.07)", boxShadow: "0 30px 90px rgba(55,78,69,.15)", textAlign: "center", opacity: interpolate(frame, [0, 0.35 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [0, 0.4 * fps], ["0px 34px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 190})})}}>
          <div style={{display: "inline-flex", alignItems: "center", gap: 12, padding: portrait ? "12px 22px" : "9px 17px", borderRadius: 999, background: line.speaker === "manager" ? "#fff0d8" : "#e6f7ef", color: "#222222", fontSize: portrait ? 24 : 20, fontWeight: 900}}><span style={{width: 12, height: 12, borderRadius: "50%", background: line.speaker === "manager" ? "#ff8e2d" : "#45b88b"}} />{line.roleChinese} · {line.roleVietnamese}</div>
          <div style={{marginTop: portrait ? 44 : 30, color: "#222222", fontSize: portrait ? 70 : 62, lineHeight: 1.25, fontWeight: 950, letterSpacing: 0}}>{line.hanziBefore}<span style={{display: "inline-block", margin: "0 8px", padding: "0 8px 4px", borderRadius: 12, color: "#ff4c3b", background: "linear-gradient(180deg, transparent 58%, #ffe09e 58%)"}}>{line.keyword}</span>{line.hanziAfter}</div>
          <div style={{marginTop: portrait ? 30 : 20, color: "#147864", fontSize: portrait ? 34 : 29, fontWeight: 850}}>{line.pinyin}</div>
          <div style={{marginTop: portrait ? 22 : 16, color: "#625a54", fontSize: portrait ? 31 : 26, lineHeight: 1.4, fontWeight: 650}}>{line.vietnamese}</div>
          <div style={{height: portrait ? 94 : 68, marginTop: portrait ? 38 : 24, display: "flex", alignItems: "center", justifyContent: "center"}}>
            {!isShadowing ? <div style={{display: "flex", alignItems: "center", gap: 12, color: "#ff4c3b", fontSize: portrait ? 25 : 21, fontWeight: 900}}><span style={{width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: "50%", background: "#fff0ed"}}>♪</span>Nghe câu mẫu</div> : <div style={{display: "flex", alignItems: "center", gap: portrait ? 20 : 15, color: "#222222"}}><span style={{width: portrait ? 76 : 60, height: portrait ? 76 : 60, display: "grid", placeItems: "center", borderRadius: "50%", background: "#ff4c3b", color: "#ffffff", fontSize: portrait ? 31 : 25, fontWeight: 950}}>{shadowSeconds}</span><div style={{textAlign: "left"}}><strong style={{display: "block", fontSize: portrait ? 31 : 25}}>Đến lượt bạn nói theo</strong><span style={{display: "block", marginTop: 4, color: "#7a716a", fontSize: portrait ? 21 : 18}}>Giữ đúng nhịp và ngữ điệu</span></div></div>}
          </div>
        </Interactive.Div>
      </div>
      <MascotRole active={line.speaker === "manager"} label="经理 · Quản lý" portrait={portrait} side="left" />
      <MascotRole active={line.speaker === "employee"} label="员工 · Nhân viên" portrait={portrait} side="right" />
      <Sequence from={Math.round(0.8 * fps)}><Audio name={`${line.id} Chinese voice`} src={staticFile(line.audio)} volume={1} /></Sequence>
      <div style={{position: "absolute", left: portrait ? 60 : 120, right: portrait ? 60 : 120, bottom: portrait ? 98 : 38, height: 10, borderRadius: 999, background: "rgba(34,34,34,.08)", overflow: "hidden"}}><div style={{width: `${Math.min(100, (frame / (11 * fps)) * 100)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg, #ff8e2d, #ff4c3b)"}} /></div>
    </OfficeBackground>
  );
};
