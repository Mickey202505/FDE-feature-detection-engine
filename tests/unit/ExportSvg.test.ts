import { describe, expect, it } from "vitest";
import { exportSvg, IDENTITY_TRANSFORM } from "../../src/application/export/exportSvg";
import type { PixelPoint } from "../../src/api/PixelPoint";

const SQUARE: PixelPoint[] = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 100 },
  { x: 0, y: 100 },
];

describe("exportSvg", () => {
  it("throws when fewer than 3 points", () => {
    expect(() =>
      exportSvg({
        points: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
        metadata: {
          courseName: "Test",
          holeNumber: 1,
          featureType: "green",
          featureNumber: 1,
        },
      }),
    ).toThrow();
  });

  it("includes required data attributes", () => {
    const svg = exportSvg({
      points: SQUARE,
      metadata: {
        courseName: "St Andrews",
        holeNumber: 7,
        featureType: "bunker",
        featureNumber: 2,
      },
    });
    expect(svg).toContain('data-course="St Andrews"');
    expect(svg).toContain('data-hole="7"');
    expect(svg).toContain('data-feature-type="bunker"');
    expect(svg).toContain('data-feature-number="2"');
    expect(svg).toContain('data-coordinate-space="world"');
  });

  it("emits a polygon with 4 points for a square", () => {
    const svg = exportSvg({
      points: SQUARE,
      metadata: {
        courseName: "Test",
        holeNumber: 1,
        featureType: "green",
        featureNumber: 1,
      },
    });
    const match = svg.match(/<polygon points="([^"]+)"/);
    expect(match).not.toBeNull();
    const coords = match![1].split(" ");
    expect(coords.length).toBe(4);
  });

  it("uses the identity transform by default", () => {
    const svg = exportSvg({
      points: SQUARE,
      metadata: {
        courseName: "Test",
        holeNumber: 1,
        featureType: "green",
        featureNumber: 1,
      },
    });
    // First point should be "0,0" under identity
    expect(svg).toContain("0,0");
  });

  it("applies a custom transform", () => {
    const svg = exportSvg({
      points: SQUARE,
      metadata: {
        courseName: "Test",
        holeNumber: 1,
        featureType: "green",
        featureNumber: 1,
      },
      transform: {
        toWorld: (p) => ({ x: p.x * 2, y: p.y * 2 }),
      },
    });
    // First point should now be "0,0" still, but second should be "200,0"
    expect(svg).toContain("200,0");
  });

  it("escapes XML-special characters in course name", () => {
    const svg = exportSvg({
      points: SQUARE,
      metadata: {
        courseName: 'Links "at" <Sunset>',
        holeNumber: 1,
        featureType: "green",
        featureNumber: 1,
      },
    });
    expect(svg).toContain("&quot;");
    expect(svg).toContain("&lt;Sunset&gt;");
    expect(svg).not.toContain('"at"');
  });
});