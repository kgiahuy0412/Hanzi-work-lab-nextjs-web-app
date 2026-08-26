import {AbsoluteFill, Sequence, useVideoConfig} from "remotion";
import {DIALOGUES} from "./data";
import {IntroScene} from "./scenes/IntroScene";
import {DialogueScene} from "./scenes/DialogueScene";
import {QuizScene} from "./scenes/QuizScene";
import {RecapScene} from "./scenes/RecapScene";

export const HimiScenarioVideo: React.FC = () => {
  const {width} = useVideoConfig();
  const portrait = width < 1200;

  return (
    <AbsoluteFill style={{fontFamily: 'Inter, "Microsoft YaHei", "Noto Sans SC", Arial, sans-serif'}}>
      <Sequence name="01 Intro" durationInFrames={150} premountFor={30}><IntroScene portrait={portrait} /></Sequence>
      <Sequence name="02 Manager asks" from={150} durationInFrames={330} premountFor={30}><DialogueScene line={DIALOGUES[0]} portrait={portrait} step="Câu 1 / 3" /></Sequence>
      <Sequence name="03 Employee reports" from={480} durationInFrames={330} premountFor={30}><DialogueScene line={DIALOGUES[1]} portrait={portrait} step="Câu 2 / 3" /></Sequence>
      <Sequence name="04 Employee promises" from={810} durationInFrames={330} premountFor={30}><DialogueScene line={DIALOGUES[2]} portrait={portrait} step="Câu 3 / 3" /></Sequence>
      <Sequence name="05 Vocabulary recap" from={1140} durationInFrames={300} premountFor={30}><RecapScene portrait={portrait} /></Sequence>
      <Sequence name="06 Quick quiz" from={1440} durationInFrames={360} premountFor={30}><QuizScene portrait={portrait} /></Sequence>
    </AbsoluteFill>
  );
};
