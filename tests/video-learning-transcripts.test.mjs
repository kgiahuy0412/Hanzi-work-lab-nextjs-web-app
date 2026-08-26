import assert from "node:assert/strict";
import test from "node:test";

import { curatedYoutubeVideoTranscripts } from "../lib/youtube-video-transcripts.curated.ts";

const expectedTracks = {
  V6SrjHDisDs: 89,
  mrxzgms3E1g: 14,
  AOEWadftWHA: 15,
  uuUmhi2F0kc: 136,
  JHxgGKMVIJA: 90,
};

test("selected YouTube videos expose complete interactive learning tracks", () => {
  for (const [videoId, expectedCount] of Object.entries(expectedTracks)) {
    const transcript = curatedYoutubeVideoTranscripts[videoId];
    assert.equal(transcript.length, expectedCount, `${videoId} should keep its reviewed sentence count`);

    for (const [index, line] of transcript.entries()) {
      assert.ok(line.hanzi.trim(), `${videoId} line ${index + 1} needs Hanzi`);
      assert.ok(line.pinyin.trim(), `${videoId} line ${index + 1} needs pinyin`);
      assert.ok(line.translation.trim(), `${videoId} line ${index + 1} needs Vietnamese`);
      assert.ok(line.endMs > line.startMs, `${videoId} line ${index + 1} needs a valid time range`);
      if (index > 0) {
        assert.ok(line.startMs >= transcript[index - 1].startMs, `${videoId} transcript must stay chronological`);
      }
    }
  }
});
