import { describe, expect, it } from "vitest";
import { smoothPolygon, DEFAULT_SMOOTH_OPTIONS } from "../../src/application/geometry/smoothPolygon";
import type { PixelPoint } from "../../src/api/PixelPoint";

function makeCircle(
  cx: number,
  cy: number,
  r: number,
  count: number,
): PixelPoint[] {
  const pts: PixelPoint[] = [];
  for (let i = 0; i < count; i += 1) {
    const a = (i / count) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r });
  }
  return pts;
}

describe("smoothPolygon", () => {
  it("returns the input unchanged when disabled", () => {
    const pts = makeCircle(100, 100, 50, 64);
    const out = smoothPolygon(pts, { ...DEFAULT_SMOOTH_OPTIONS, enabled: false });
    expect(out).toEqual(pts);
  });

  it("returns the input unchanged for 3 or fewer points", () => {
    const pts = [{ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 10 }];
    const out = smoothPolygon(pts);
    expect(out).toEqual(pts);
  });

  it("produces a closed-ish polygon with no NaN", () => {
    const pts = makeCircle(100, 100, 50, 32);
    const out = smoothPolygon(pts);
    expect(out.length).toBeGreaterThan(0);
    for (const p of out) {
      expect(Number.isFinite(p.x)).toBe(true);
      expect(Number.isFinite(p.y)).toBe(true);
    }
  });

  it("keeps the smoothed polygon roughly inside the same bounds", () => {
    const pts = makeCircle(100, 100, 50, 32);
    const out = smoothPolygon(pts);
    for (const p of out) {
      expect(p.x).toBeGreaterThan(40);
      expect(p.x).toBeLessThan(160);
      expect(p.y).toBeGreaterThan(40);
      expect(p.y).toBeLessThan(160);
    }
  });
});