import {Composition, Folder} from "remotion";
import {HimiScenarioVideo} from "./HimiScenarioVideo";

export const MyComposition: React.FC = () => {
  return (
    <Folder name="HimiChinese-VideoTinhHuong">
      <Composition id="HimiWorkProgressLandscape" component={HimiScenarioVideo} durationInFrames={1800} fps={30} width={1920} height={1080} />
      <Composition id="HimiWorkProgressPortrait" component={HimiScenarioVideo} durationInFrames={1800} fps={30} width={1080} height={1920} />
    </Folder>
  );
};
