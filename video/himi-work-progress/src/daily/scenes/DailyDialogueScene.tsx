import {Audio} from "@remotion/media";
import {Easing, interpolate, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {DailyDialogueLine, DailyScenario} from "../data";
import {DailyBackground} from "../components/DailyBackground";
import {DailyBrand} from "../components/DailyBrand";
import {DailySpeaker} from "../components/DailySpeaker";

const highlightedHanzi = (line: DailyDialogueLine, accent: string) => {
  const index = line.hanzi.indexOf(line.keyword);
  if (index < 0) return line.hanzi;
  return <>{line.hanzi.slice(0, index)}<span style={{display: "inline-block", margin: "0 7px", padding: "0 7px 4px", borderRadius: 12, color: accent, background: "linear-gradient(180deg, transparent 58%, #ffe3a9 58%)"}}>{line.keyword}</span>{line.hanzi.slice(index + line.keyword.length)}</>;
};

export const DailyDialogueScene: React.FC<{line: DailyDialogueLine; scenario: DailyScenario; step: string}> = ({line, scenario, step}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const shadowStart = 4 * fps;
  const isShadowing = frame >= shadowStart;
  const secondsLeft = Math.max(1, 7 - Math.floor((frame - shadowStart) / fps));

  return <DailyBackground scenario={scenario}>
    <DailyBrand scenario={scenario} step={step} />
    <div style={{position: "absolute", left: 370, right: 370, top: 154, zIndex: 10}}>
      <div style={{minHeight: 438, padding: "38px 54px 34px", borderRadius: 42, background: "rgba(255,255,255,.95)", border: "4px solid rgba(34,34,34,.06)", boxShadow: "0 30px 90px rgba(55,78,69,.14)", textAlign: "center", opacity: interpolate(frame, [0, 0.35 * fps], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1)}), translate: interpolate(frame, [0, 0.42 * fps], ["0px 34px", "0px 0px"], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.spring({damping: 190})})}}>
        <div style={{display: "inline-flex", alignItems: "center", gap: 11, padding: "9px 17px", borderRadius: 999, background: scenario.accentSoft, color: "#173f38", fontSize: 20, fontWeight: 900}}><span style={{width: 12, height: 12, borderRadius: "50%", background: scenario.accent}} />{line.roleChinese} · {line.roleVietnamese}</div>
        <div style={{marginTop: 30, color: "#173f38", fontSize: line.hanzi.length > 11 ? 54 : 62, lineHeight: 1.25, fontWeight: 950}}>{highlightedHanzi(line, scenario.accent)}</div>
        <div style={{marginTop: 20, color: "#167f7a", fontSize: 29, fontWeight: 850}}>{line.pinyin}</div>
        <div style={{marginTop: 16, color: "#5e6d68", fontSize: 26, lineHeight: 1.4, fontWeight: 650}}>{line.vietnamese}</div>
        <div style={{height: 68, marginTop: 24, display: "flex", alignItems: "center", justifyContent: "center"}}>{!isShadowing ? <div style={{display: "flex", alignItems: "center", gap: 12, color: scenario.accent, fontSize: 21, fontWeight: 900}}><span style={{width: 48, height: 48, display: "grid", placeItems: "center", borderRadius: "50%", background: scenario.accentSoft}}>♪</span>Nghe câu mẫu</div> : <div style={{display: "flex", alignItems: "center", gap: 15, color: "#173f38"}}><span style={{width: 60, height: 60, display: "grid", placeItems: "center", borderRadius: "50%", background: scenario.accent, color: "#ffffff", fontSize: 25, fontWeight: 950}}>{secondsLeft}</span><div style={{textAlign: "left"}}><strong style={{display: "block", fontSize: 25}}>Đến lượt bạn nói theo</strong><span style={{display: "block", marginTop: 4, color: "#72817c", fontSize: 18}}>Giữ đúng nhịp và ngữ điệu</span></div></div>}</div>
      </div>
    </div>
    <DailySpeaker active={line.speaker === "a"} label={`${scenario.lines.find((item) => item.speaker === "a")?.roleChinese} · ${scenario.lines.find((item) => item.speaker === "a")?.roleVietnamese}`} scenario={scenario} side="left" />
    <DailySpeaker active={line.speaker === "b"} label={`${scenario.lines.find((item) => item.speaker === "b")?.roleChinese} · ${scenario.lines.find((item) => item.speaker === "b")?.roleVietnamese}`} scenario={scenario} side="right" />
    <Sequence from={Math.round(0.8 * fps)}><Audio name={`${line.id} voice`} src={staticFile(line.audio)} volume={1} /></Sequence>
    <div style={{position: "absolute", left: 120, right: 120, bottom: 38, height: 10, borderRadius: 999, background: "rgba(34,34,34,.08)", overflow: "hidden"}}><div style={{width: `${Math.min(100, (frame / (11 * fps)) * 100)}%`, height: "100%", borderRadius: 999, background: `linear-gradient(90deg, ${scenario.accent}, #167f7a)`}} /></div>
  </DailyBackground>;
};
