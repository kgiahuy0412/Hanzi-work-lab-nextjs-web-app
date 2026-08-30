import sharp from "sharp";

const sourcePath = "C:/Users/DELL/AppData/Local/Temp/codex-clipboard-60717b13-ec40-43de-b53f-81713eb3bc8c.png";
const implementationPath = "D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-white-copy/implementation-writing-nav.png";
const outputPath = "D:/Code/HiMi/Hanzi-work-lab-nextjs-web-app/tmp/brand-white-copy/comparison-writing-nav.png";

const source = await sharp(sourcePath)
  .resize({ width: 185, height: 80, fit: "contain", background: "#FFFFFF" })
  .png()
  .toBuffer();

const implementation = await sharp(implementationPath)
  .resize({ width: 185, height: 80, fit: "contain", background: "#FFFFFF" })
  .png()
  .toBuffer();

await sharp({
  create: { width: 386, height: 80, channels: 3, background: "#FFFFFF" },
})
  .composite([
    { input: source, left: 0, top: 0 },
    { input: implementation, left: 201, top: 0 },
  ])
  .png()
  .toFile(outputPath);
