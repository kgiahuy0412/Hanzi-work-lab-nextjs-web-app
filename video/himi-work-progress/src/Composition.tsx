import {Composition, Folder} from "remotion";
import {HimiScenarioVideo} from "./HimiScenarioVideo";
import {DailyLifeVideo} from "./daily/DailyLifeVideo";
import {dailyScenarios} from "./daily/data";

export const MyComposition: React.FC = () => {
  return (
    <Folder name="HimiChinese-VideoTinhHuong">
      <Composition id="HimiWorkProgressLandscape" component={HimiScenarioVideo} durationInFrames={1800} fps={30} width={1920} height={1080} />
      <Composition id="HimiWorkProgressPortrait" component={HimiScenarioVideo} durationInFrames={1800} fps={30} width={1080} height={1920} />
      <Folder name="DoiSongHangNgay">
        {dailyScenarios.map((scenario) => <Composition key={scenario.compositionId} id={scenario.compositionId} component={DailyLifeVideo} defaultProps={{scenario}} durationInFrames={1800} fps={30} width={1920} height={1080} />)}
      </Folder>
    </Folder>
  );
};
