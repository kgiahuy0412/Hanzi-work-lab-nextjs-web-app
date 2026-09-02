import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, "..");
const assetRoot = path.join(projectRoot, "public", "assets", "mascot", "himi-v2");

const transparent = { r: 0, g: 0, b: 0, alpha: 0 };
const staticCanvasSize = 800;
const animationCanvasSize = 512;
const animationFrameCount = 60;
const animationFrameDelay = 20;

const variants = [
  {
    name: "himi-wave",
    source: "himi-wave-source.png",
    motion: { angle: 1.6, pulse: 0.012, x: 2, y: 5 },
  },
  {
    name: "himi-listen",
    source: "himi-listen-source.png",
    motion: { angle: 1.1, pulse: 0.01, x: 2, y: 4 },
  },
  {
    name: "himi-cheer",
    source: "himi-cheer-source.png",
    motion: { angle: 1.4, pulse: 0.018, x: 2, y: 10 },
  },
  {
    name: "himi-celebrate",
    source: "himi-celebrate-source.png",
    motion: { angle: 1.8, pulse: 0.022, x: 3, y: 14 },
  },
  {
    name: "himi-writing",
    source: "himi-writing-source.png",
    motion: { angle: 1.15, pulse: 0.01, x: 2, y: 5 },
  },
  {
    name: "himi-video",
    source: "himi-video-source.png",
    motion: { angle: 0.9, pulse: 0.01, x: 2, y: 4 },
  },
];

function createAnimationFrames(motion) {
  return Array.from({ length: animationFrameCount }, (_, index) => {
    const phase = (Math.PI * 2 * index) / animationFrameCount;
    return {
      angle: Math.sin(phase) * motion.angle,
      scale: 0.98 + ((1 - Math.cos(phase)) / 2) * motion.pulse,
      x: Math.sin(phase * 2) * motion.x,
      y: Math.sin(phase) * motion.y,
    };
  });
}

async function renderFrame(sourcePath, frame) {
  const targetSize = Math.round(animationCanvasSize * 0.82 * frame.scale);
  const rotated = await sharp(sourcePath)
    .resize(targetSize, targetSize, { fit: "contain", background: transparent })
    .rotate(frame.angle, { background: transparent })
    .png()
    .toBuffer({ resolveWithObject: true });

  const left = Math.round((animationCanvasSize - rotated.info.width) / 2 + frame.x);
  const top = Math.round((animationCanvasSize - rotated.info.height) / 2 + frame.y);

  return sharp({
    create: {
      width: animationCanvasSize,
      height: animationCanvasSize,
      channels: 4,
      background: transparent,
    },
  })
    .composite([{ input: rotated.data, left, top }])
    .ensureAlpha()
    .raw()
    .toBuffer();
}

async function buildVariant(variant) {
  const sourcePath = path.join(assetRoot, "source", variant.source);
  const staticPath = path.join(assetRoot, `${variant.name}.webp`);
  const animatedPath = path.join(assetRoot, `${variant.name}.gif`);

  await sharp(sourcePath)
    .resize(staticCanvasSize, staticCanvasSize, { fit: "contain", background: transparent })
    .webp({ quality: 92, alphaQuality: 100, effort: 6 })
    .toFile(staticPath);

  const frames = [];
  for (const frame of createAnimationFrames(variant.motion)) {
    frames.push(await renderFrame(sourcePath, frame));
  }
  const strip = Buffer.concat(frames);

  await sharp(strip, {
    raw: {
      width: animationCanvasSize,
      height: animationCanvasSize * frames.length,
      channels: 4,
      pageHeight: animationCanvasSize,
    },
  })
    .gif({
      colours: 256,
      dither: 0.15,
      effort: 10,
      interFrameMaxError: 0,
      interPaletteMaxError: 0,
      loop: 0,
      delay: Array(animationFrameCount).fill(animationFrameDelay),
    })
    .toFile(animatedPath);

  return { animatedPath, staticPath };
}

const outputs = [];
for (const variant of variants) {
  outputs.push(await buildVariant(variant));
}

for (const output of outputs) {
  console.log(path.relative(projectRoot, output.staticPath));
  console.log(path.relative(projectRoot, output.animatedPath));
}
