import sharp from "sharp";

const root = "D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-full-audit-2026-08-30/";

async function compareDesktop(slug, filename) {
  const left = await sharp(`${root}before/${filename}`)
    .resize({ width: 800, height: 556, fit: "cover", position: "top" })
    .jpeg({ quality: 82 })
    .toBuffer();
  const right = await sharp(`${root}after/${filename}`)
    .resize({ width: 800, height: 556, fit: "cover", position: "top" })
    .jpeg({ quality: 82 })
    .toBuffer();

  await sharp({
    create: { width: 1600, height: 556, channels: 3, background: "#FFFFFF" },
  })
    .composite([{ input: left, left: 0, top: 0 }, { input: right, left: 800, top: 0 }])
    .jpeg({ quality: 84 })
    .toFile(`${root}after/compare-${slug}.jpg`);
}

await compareDesktop("course-roadmap", "04-course-roadmap.jpg");
await compareDesktop("hsk-play", "08-hsk-play.jpg");
await compareDesktop("listening-scenario", "11-listening-scenario.jpg");
await compareDesktop("videos", "14-videos.jpg");

const mobileLeft = await sharp(`${root}before/mobile/11-listening-scenario.jpg`)
  .resize({ width: 390, height: 844, fit: "cover", position: "top" })
  .jpeg({ quality: 82 })
  .toBuffer();
const mobileRight = await sharp(`${root}after/mobile/11-listening-scenario.jpg`)
  .resize({ width: 390, height: 844, fit: "cover", position: "top" })
  .jpeg({ quality: 82 })
  .toBuffer();

await sharp({
  create: { width: 780, height: 844, channels: 3, background: "#FFFFFF" },
})
  .composite([{ input: mobileLeft, left: 0, top: 0 }, { input: mobileRight, left: 390, top: 0 }])
  .jpeg({ quality: 84 })
  .toFile(`${root}after/compare-mobile-listening.jpg`);
