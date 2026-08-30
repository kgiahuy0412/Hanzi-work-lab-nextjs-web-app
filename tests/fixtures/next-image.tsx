import React from "react";

/* eslint-disable @next/next/no-img-element, jsx-a11y/alt-text */

export default function TestImage({
  fill,
  priority,
  unoptimized,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  fill?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
}) {
  void fill;
  void priority;
  void unoptimized;
  return <img {...props} />;
}
