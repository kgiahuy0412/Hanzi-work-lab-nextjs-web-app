import Image from "next/image";

const logoSource = "/assets/mascot/penguin/penguin-logo-app.png";

export function BrandLogoImage({ priority = false, size = 54 }: { priority?: boolean; size?: number }) {
  return <Image alt="" aria-hidden="true" draggable={false} height={size} priority={priority} sizes={`${size}px`} src={logoSource} unoptimized width={size} />;
}

export function BrandMark({ priority = false }: { priority?: boolean }) {
  return <span aria-hidden="true" className="brand-mark"><BrandLogoImage priority={priority} size={48} /></span>;
}
