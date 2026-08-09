import sharp from "sharp";

const assets = ["memory", "connect", "listen", "write", "flashcard", "quiz"];

function colorDistance(r, g, b, background) {
  const dr = r - background.r;
  const dg = g - background.g;
  const db = b - background.b;
  return Math.sqrt(dr * dr * 0.3 + dg * dg * 0.59 + db * db * 0.11);
}

for (const name of assets) {
  const input = `public/assets/games/${name}-penguin.webp`;
  const output = `public/assets/games/${name}-penguin-cutout.png`;
  const { data, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const edgeSample = 16;
  const corners = [
    [0, 0],
    [width - edgeSample, 0],
    [0, height - edgeSample],
    [width - edgeSample, height - edgeSample],
  ];

  let totalR = 0;
  let totalG = 0;
  let totalB = 0;
  let sampleCount = 0;
  for (const [startX, startY] of corners) {
    for (let y = startY; y < startY + edgeSample; y += 1) {
      for (let x = startX; x < startX + edgeSample; x += 1) {
        const offset = (y * width + x) * 3;
        totalR += data[offset];
        totalG += data[offset + 1];
        totalB += data[offset + 2];
        sampleCount += 1;
      }
    }
  }

  const background = {
    r: totalR / sampleCount,
    g: totalG / sampleCount,
    b: totalB / sampleCount,
  };
  const candidate = new Uint8Array(width * height);
  const removed = new Uint8Array(width * height);
  const threshold = 38;

  for (let index = 0; index < width * height; index += 1) {
    const offset = index * 3;
    candidate[index] = colorDistance(data[offset], data[offset + 1], data[offset + 2], background) <= threshold ? 1 : 0;
  }

  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;
  const enqueue = (index) => {
    if (!candidate[index] || removed[index]) return;
    removed[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head];
    head += 1;
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  const rgba = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index += 1) {
    const inputOffset = index * 3;
    const outputOffset = index * 4;
    rgba[outputOffset] = data[inputOffset];
    rgba[outputOffset + 1] = data[inputOffset + 1];
    rgba[outputOffset + 2] = data[inputOffset + 2];
    rgba[outputOffset + 3] = removed[index] ? 0 : 255;
  }

  await sharp(rgba, { raw: { width, height, channels: 4 } })
    .png({ compressionLevel: 9, palette: true })
    .toFile(output);
  console.log(output);
}
