export const BRAND_NAME = "Himi Chinese";
export const BRAND_SHORT_NAME = "Himi";
export const BRAND_TAGLINE = "Tiếng Trung cho người đi làm";
export const BRAND_MASCOT_NAME = "Cánh Cụt Himi";
export const BRAND_LOGO_SOURCE = "/assets/brand/himi-mascot-icon.png";

function relativeLuminance(hexColor: string) {
  const channels = hexColor
    .replace("#", "")
    .match(/.{2}/g)
    ?.map((channel) => Number.parseInt(channel, 16) / 255);

  if (!channels || channels.length !== 3 || channels.some(Number.isNaN)) {
    throw new Error(`Invalid six-digit hex color: ${hexColor}`);
  }

  const [red, green, blue] = channels.map((channel) => (
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  ));

  return (0.2126 * red) + (0.7152 * green) + (0.0722 * blue);
}

export function contrastRatio(firstColor: string, secondColor: string) {
  const firstLuminance = relativeLuminance(firstColor);
  const secondLuminance = relativeLuminance(secondColor);
  const lighter = Math.max(firstLuminance, secondLuminance);
  const darker = Math.min(firstLuminance, secondLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function createBrandTheme() {
  const red = "#FF4C3B";
  const orange = "#FF8E2D";

  return {
    "--himi-red": red,
    "--himi-orange": orange,
    "--himi-black": "#222222",
    "--himi-white": "#FFFFFF",
    "--himi-muted": "#625B58",
    "--himi-line": "#E8E1DE",
    "--himi-red-soft": "#FFF0EE",
    "--himi-orange-soft": "#FFF4E8",
    "--himi-on-red": "#FFFFFF",
    "--himi-on-orange": "#FFFFFF",
  } as const;
}

