import { describe, expect, it } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { PNG } from "pngjs";
import {
  OpenCvJsAdapter,
  BUNKER_MASK_OPTIONS,
  GREEN_MASK_OPTIONS,
} from "../../src/application/opencv/OpenCvJsAdapter";
import openCvRuntime from "../../src/infrastructure/opencv/OpenCvJsRuntime";
import type { OpenCvImageData } from "../../src/application/opencv/OpenCvTypes";

function loadTile(): OpenCvImageData {
  const file = readFileSync("tests/fixtures/satellite-tile.png");
  const png = PNG.sync.read(file);
  return {
    width: png.width,
    height: png.height,
    data: new Uint8ClampedArray(png.data),
  };
}

function writeOverlaySvg(
  imageData: OpenCvImageData,
  points: { x: number; y: number }[],
  outputPath: string,
  colour: string,
): void {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     width="${imageData.width}"
     height="${imageData.height}"
     viewBox="0 0 ${imageData.width} ${imageData.height}">
  <polygon points="${points.map((p) => `${p.x},${p.y}`).join(" ")}"
           fill="${colour}33"
           stroke="${colour}"
           stroke-width="3"
           stroke-linejoin="round" />
</svg>
`;
  writeFileSync(outputPath, svg);
}

describe("Satellite image smoke", () => {
  it("detects the green", () => {
    const image = loadTile();
    const seed = { x: 465, y: 365 };
    const adapter = new OpenCvJsAdapter(openCvRuntime);

    const mask = adapter.createSeedGuidedRegionMaskForDiagnostics(
      image,
      seed,
      GREEN_MASK_OPTIONS,
    );
    const points = adapter.extractBoundaryFromMask(mask, 14);
    mask.delete();

    console.log("[Satellite] green points:", points.length);
    writeOverlaySvg(image, points, "tests/fixtures/satellite-green.svg", "#00ff00");

    expect(points.length).toBeGreaterThan(3);
  }, 30000);

  it("detects the left bunker", () => {
    const image = loadTile();
    const seed = { x: 270, y: 415 };
    const adapter = new OpenCvJsAdapter(openCvRuntime);

    const mask = adapter.createSeedGuidedRegionMaskForDiagnostics(
      image,
      seed,
      BUNKER_MASK_OPTIONS,
    );
    const points = adapter.extractBoundaryFromMask(mask, 14);
    mask.delete();

    console.log("[Satellite] left bunker points:", points.length);
    writeOverlaySvg(image, points, "tests/fixtures/satellite-bunker-left.svg", "#ffcc44");

    expect(points.length).toBeGreaterThan(3);
  }, 30000);

  it("detects the bottom-left bunker", () => {
    const image = loadTile();
    const seed = { x: 285, y: 670 };
    const adapter = new OpenCvJsAdapter(openCvRuntime);

    const mask = adapter.createSeedGuidedRegionMaskForDiagnostics(
      image,
      seed,
      BUNKER_MASK_OPTIONS,
    );
    const points = adapter.extractBoundaryFromMask(mask, 14);
    mask.delete();

    console.log("[Satellite] bottom-left bunker points:", points.length);
    writeOverlaySvg(image, points, "tests/fixtures/satellite-bunker-bottom-left.svg", "#ffcc44");

    expect(points.length).toBeGreaterThan(3);
  }, 30000);

  it("detects the bottom-right bunker", () => {
    const image = loadTile();
    const seed = { x: 630, y: 625 };
    const adapter = new OpenCvJsAdapter(openCvRuntime);

    const mask = adapter.createSeedGuidedRegionMaskForDiagnostics(
      image,
      seed,
      BUNKER_MASK_OPTIONS,
    );
    const points = adapter.extractBoundaryFromMask(mask, 14);
    mask.delete();

    console.log("[Satellite] bottom-right bunker points:", points.length);
    writeOverlaySvg(image, points, "tests/fixtures/satellite-bunker-bottom-right.svg", "#ffcc44");

    expect(points.length).toBeGreaterThan(3);
  }, 30000);
});