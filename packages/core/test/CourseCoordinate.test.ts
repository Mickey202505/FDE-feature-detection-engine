import { describe, expect, it } from "vitest";

const teeBox = {
  upDown: 0,
  leftRight: 0,
};

describe("CourseCoordinate", () => {
  it("uses the tee box as the origin", () => {
    expect(teeBox.upDown).toBe(0);
    expect(teeBox.leftRight).toBe(0);
  });
});