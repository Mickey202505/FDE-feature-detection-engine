import type { PixelPoint } from "../../api/PixelPoint.js";

export interface WorldPoint {
  x: number;
  y: number;
}

export interface PixelToWorldTransform {
  toWorld(pixel: PixelPoint): WorldPoint;
}

export const IDENTITY_TRANSFORM: PixelToWorldTransform = {
  toWorld: (p) => ({ x: p.x, y: p.y }),
};

export interface FeatureSvgMetadata {
  courseName: string;
  holeNumber: number;
  featureType: "bunker" | "green";
  featureNumber: number;
}

export interface ExportSvgOptions {
  points: readonly PixelPoint[];
  metadata: FeatureSvgMetadata;
  transform?: PixelToWorldTransform;
  padding?: number;
  strokeWidth?: number;
}

export function exportSvg(options: ExportSvgOptions): string {
  const {
    points,
    metadata,
    transform = IDENTITY_TRANSFORM,
    padding = 2,
    strokeWidth = 0.25,
  } = options;

  if (points.length < 3) {
    throw new Error("At least 3 points are required to build a polygon.");
  }

  const worldPoints = points.map((p) => transform.toWorld(p));

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of worldPoints) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const vbX = minX - padding;
  const vbY = minY - padding;
  const vbW = maxX - minX + padding * 2;
  const vbH = maxY - minY + padding * 2;

  const pointsAttr = worldPoints
    .map((p) => `${r(p.x)},${r(p.y)}`)
    .join(" ");

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="${r(vbX)} ${r(vbY)} ${r(vbW)} ${r(vbH)}"
     data-course="${esc(metadata.courseName)}"
     data-hole="${metadata.holeNumber}"
     data-feature-type="${metadata.featureType}"
     data-feature-number="${metadata.featureNumber}"
     data-coordinate-space="world">
  <polygon points="${pointsAttr}"
           fill="none"
           stroke="black"
           stroke-width="${r(strokeWidth)}"
           stroke-linejoin="round" />
</svg>
`;
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}