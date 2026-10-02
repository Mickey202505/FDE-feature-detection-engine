import { describe, expect, it } from "vitest";
import {
  exportSvg,
  smoothPolygon,
  maskToPolygon,
  type PixelPoint,
} from "../../dist/index.js";

describe("Consuming the built module", () => {
  it("end-to-end: mask -> polygon -> smooth -> SVG", () => {
    const width = 100;
    const height = 100;
    const data = new Uint8ClampedArray(width * height * 4);
    const cx = 50;
    const cy = 50;
    const r = 25;

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const idx = (y * width + x) * 4;
        const inside = (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
        data[idx] = inside ? 255 : 0;
        data[idx + 1] = inside ? 255 : 0;
        data[idx + 2] = inside ? 255 : 0;
        data[idx + 3] = 255;
      }
    }

    const rawPoints: PixelPoint[] = maskToPolygon({ width, height, data }, 0.5);
    expect(rawPoints.length).toBeGreaterThan(10);

    const smoothed = smoothPolygon(rawPoints);
    expect(smoothed.length).toBeGreaterThan(0);

    const svg = exportSvg({
      points: smoothed,
      metadata: {
        courseName: "Smoke Test Links",
        holeNumber: 1,
        featureType: "green",
        featureNumber: 1,
      },
    });

    expect(svg).toContain('<?xml version="1.0"');
    expect(svg).toContain('data-course="Smoke Test Links"');
    expect(svg).toContain('data-feature-type="green"');
    expect(svg).toContain("<polygon");

    const match = svg.match(/<polygon points="([^"]+)"/);
    expect(match).not.toBeNull();
    const coords = match![1].split(" ");
    expect(coords.length).toBe(smoothed.length);

    console.log("[SmokeTest] raw points:", rawPoints.length);
    console.log("[SmokeTest] smoothed points:", smoothed.length);
    console.log("[SmokeTest] svg chars:", svg.length);
  });

  it("produces valid SVG that a browser can render", () => {
    const square: PixelPoint[] = [
      { x: 0, y: 0 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ];

    const svg = exportSvg({
      points: square,
      metadata: {
        courseName: "Test",
        holeNumber: 1,
        featureType: "bunker",
        featureNumber: 1,
      },
    });

    const fs = require("node:fs");
    fs.writeFileSync("tests/fixtures/smoke-export.svg", svg);
    console.log("[SmokeTest] wrote tests/fixtures/smoke-export.svg");

    expect(svg).toContain("<polygon");
  });
});