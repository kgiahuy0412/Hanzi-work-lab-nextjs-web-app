import {AbsoluteFill, Sequence} from "remotion";
import type {DailyScenario} from "./data";
import {DailyIntroScene} from "./scenes/DailyIntroScene";
import {DailyDialogueScene} from "./scenes/DailyDialogueScene";
import {DailyRecapScene} from "./scenes/DailyRecapScene";
import {DailyQuizScene} from "./scenes/DailyQuizScene";

export const DailyLifeVideo: React.FC<{scenario: DailyScenario}> = ({scenario}) => (
  <AbsoluteFill>
    <Sequence durationInFrames={150}><DailyIntroScene scenario={scenario} /></Sequence>
    {scenario.lines.map((line, index) => <Sequence key={line.id} from={150 + index * 330} durationInFrames={330}><DailyDialogueScene line={line} scenario={scenario} step={`Câu ${index + 1} / 3`} /></Sequence>)}
    <Sequence from={1140} durationInFrames={300}><DailyRecapScene scenario={scenario} /></Sequence>
    <Sequence from={1440} durationInFrames={360}><DailyQuizScene scenario={scenario} /></Sequence>
  </AbsoluteFill>
);
