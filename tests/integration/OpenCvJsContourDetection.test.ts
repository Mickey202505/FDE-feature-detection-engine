import { beforeAll, describe, expect, it } from "vitest";
import { loadOpenCV } from "@opencvjs/node";

import type {
  OpenCvContour,
  OpenCvRuntime,
} from "../../src/application/opencv/OpenCvTypes";

import type { PixelPoint } from "../../src/application/opencv/PixelPoint";

import { OpenCvJsAdapter } from "../../src/application/opencv/OpenCvJsAdapter";

let cv: OpenCvRuntime;

async function loadOpenCv(): Promise<OpenCvRuntime> {
  if (!cv) {
    console.log("Loading OpenCV.js...");
    cv = (await loadOpenCV()) as unknown as OpenCvRuntime;
    console.log("OpenCV.js loaded.");
  }

  return cv;
}

function createRgbaImage(
  cvRuntime: OpenCvRuntime,
  width: number,
  height: number,
  data: Uint8ClampedArray,
) {
  if (!cvRuntime.matFromImageData) {
    throw new Error("OpenCV matFromImageData is not available");
  }

  const imageData = {
    width,
    height,
    data,
  };

  return cvRuntime.matFromImageData(imageData);
}

function largestContour(
  contours: readonly OpenCvContour[],
): OpenCvContour | undefined {
  if (contours.length === 0) {
    return undefined;
  }

  return contours.reduce((largest, current) => {
    return current.points.length > largest.points.length
      ? current
      : largest;
  });
}

function getBounds(points: readonly PixelPoint[]) {
  if (points.length === 0) {
    throw new Error("Cannot calculate bounds for an empty point collection");
  }

  return points.reduce(
    (bounds, point) => ({
      minX: Math.min(bounds.minX, point.x),
      maxX: Math.max(bounds.maxX, point.x),
      minY: Math.min(bounds.minY, point.y),
      maxY: Math.max(bounds.maxY, point.y),
    }),
    {
      minX: points[0].x,
      maxX: points[0].x,
      minY: points[0].y,
      maxY: points[0].y,
    },
  );
}

beforeAll(async () => {
  await loadOpenCv();
});

describe("OpenCvJs green detection", () => {
  it("detects a seeded green area in a real OpenCV image", async () => {
    const cv = await loadOpenCv();
    const width = 100;
    const height = 100;

    const imageData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        const insideGreen =
          x >= 20 &&
          x <= 79 &&
          y >= 20 &&
          y <= 79;

        if (insideGreen) {
          imageData[index] = 40;
          imageData[index + 1] = 180;
          imageData[index + 2] = 40;
          imageData[index + 3] = 255;
        } else {
          imageData[index] = 220;
          imageData[index + 1] = 220;
          imageData[index + 2] = 220;
          imageData[index + 3] = 255;
        }
      }
    }

    const image = createRgbaImage(cv, width, height, imageData);
    const adapter = new OpenCvJsAdapter(cv);

    const seed = { x: 50, y: 50 };

    const contours = adapter.findContours(image, seed);

    expect(contours.length).toBeGreaterThan(0);

    const contour = largestContour(contours);

    expect(contour).toBeDefined();

    const bounds = getBounds(contour!.points);

    expect(bounds.minX).toBeLessThanOrEqual(20);
    expect(bounds.maxX).toBeGreaterThanOrEqual(79);
    expect(bounds.minY).toBeLessThanOrEqual(20);
    expect(bounds.maxY).toBeGreaterThanOrEqual(79);

    image.delete();
  });

  it("returns no contours when the seed is not green", async () => {
    const cv = await loadOpenCv();
    const width = 100;
    const height = 100;

    const imageData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        imageData[index] = 220;
        imageData[index + 1] = 220;
        imageData[index + 2] = 220;
        imageData[index + 3] = 255;
      }
    }

    const image = createRgbaImage(cv, width, height, imageData);
    const adapter = new OpenCvJsAdapter(cv);

    const seed = { x: 5, y: 5 };

    const contours = adapter.findContours(image, seed);

    expect(contours).toEqual([]);

    image.delete();
  });

  it("detects a green area with modest colour variation", async () => {
    const cv = await loadOpenCv();
    const width = 100;
    const height = 100;

    const imageData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        const insideGreen =
          x >= 20 &&
          x <= 79 &&
          y >= 20 &&
          y <= 79;

        if (insideGreen) {
          const variation = (x + y) % 10;

          imageData[index] = 40 + variation;
          imageData[index + 1] = 180 + variation;
          imageData[index + 2] = 40 + variation;
          imageData[index + 3] = 255;
        } else {
          imageData[index] = 220;
          imageData[index + 1] = 220;
          imageData[index + 2] = 220;
          imageData[index + 3] = 255;
        }
      }
    }

    const image = createRgbaImage(cv, width, height, imageData);
    const adapter = new OpenCvJsAdapter(cv);

    const seed = { x: 50, y: 50 };

    const contours = adapter.findContours(image, seed);

    expect(contours.length).toBeGreaterThan(0);

    const contour = largestContour(contours);

    expect(contour).toBeDefined();

    const bounds = getBounds(contour!.points);

    expect(bounds.minX).toBeLessThanOrEqual(20);
    expect(bounds.maxX).toBeGreaterThanOrEqual(79);
    expect(bounds.minY).toBeLessThanOrEqual(20);
    expect(bounds.maxY).toBeGreaterThanOrEqual(79);

    image.delete();
  });

  it("keeps the detected green boundary close to the actual boundary", async () => {
    const cv = await loadOpenCv();
    const width = 120;
    const height = 100;

    const imageData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        const insideGreen =
          x >= 30 &&
          x <= 89 &&
          y >= 20 &&
          y <= 79;

        if (insideGreen) {
          imageData[index] = 40;
          imageData[index + 1] = 180;
          imageData[index + 2] = 40;
          imageData[index + 3] = 255;
        } else {
          imageData[index] = 220;
          imageData[index + 1] = 220;
          imageData[index + 2] = 220;
          imageData[index + 3] = 255;
        }
      }
    }

    const image = createRgbaImage(cv, width, height, imageData);
    const adapter = new OpenCvJsAdapter(cv);

    const seed = { x: 60, y: 50 };

    const contours = adapter.findContours(image, seed);

    expect(contours.length).toBeGreaterThan(0);

    const contour = largestContour(contours);

    expect(contour).toBeDefined();

    const bounds = getBounds(contour!.points);

    expect(Math.abs(bounds.minX - 30)).toBeLessThanOrEqual(2);
    expect(Math.abs(bounds.maxX - 89)).toBeLessThanOrEqual(2);
    expect(Math.abs(bounds.minY - 20)).toBeLessThanOrEqual(2);
    expect(Math.abs(bounds.maxY - 79)).toBeLessThanOrEqual(2);

    image.delete();
  });

  it("returns no contours when there is no green area and no seed", async () => {
    const cv = await loadOpenCv();
    const width = 100;
    const height = 100;

    const imageData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        const insideDarkArea =
          x >= 20 &&
          x <= 79 &&
          y >= 20 &&
          y <= 79;

        if (insideDarkArea) {
          imageData[index] = 40;
          imageData[index + 1] = 40;
          imageData[index + 2] = 40;
          imageData[index + 3] = 255;
        } else {
          imageData[index] = 230;
          imageData[index + 1] = 230;
          imageData[index + 2] = 230;
          imageData[index + 3] = 255;
        }
      }
    }

    const image = createRgbaImage(cv, width, height, imageData);
    const adapter = new OpenCvJsAdapter(cv);

    const contours = adapter.findContours(image);

    expect(contours).toEqual([]);

    image.delete();
  });

  it("follows a gradual colour transition away from the seed", async () => {
    const cv = await loadOpenCv();
    const width = 120;
    const height = 100;

    const imageData = new Uint8ClampedArray(width * height * 4);

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;

        const insideGreen =
          x >= 20 &&
          x <= 99 &&
          y >= 20 &&
          y <= 79;

        if (insideGreen) {
          // The putting surface gradually changes colour from left to right.
          // The total change is deliberately greater than the current
          // fixed ±20 seed tolerance.
          const variation = Math.round((x - 20) * 0.4);

          imageData[index] = 40 + variation;
          imageData[index + 1] = 160 + variation;
          imageData[index + 2] = 40 + variation;
          imageData[index + 3] = 255;
        } else {
          // Clearly different surrounding area for this first experiment.
          // Boundary discrimination against similar turf comes later.
          imageData[index] = 80;
          imageData[index + 1] = 80;
          imageData[index + 2] = 80;
          imageData[index + 3] = 255;
        }
      }
    }

    const image = createRgbaImage(cv, width, height, imageData);
    const adapter = new OpenCvJsAdapter(cv);

    // Deliberately not the geometric centre of the green.
    const seed = { x: 30, y: 50 };

    const contours = adapter.findContours(image, seed);

    expect(contours.length).toBeGreaterThan(0);

    const contour = largestContour(contours);

    expect(contour).toBeDefined();

    const bounds = getBounds(contour!.points);

    // The actual green reaches x=99.
    // The detector should eventually follow the gradual colour change
    // rather than stopping when the colour becomes more than ±20 away
    // from the original seed colour.
    expect(bounds.minX).toBeLessThanOrEqual(21);
    expect(bounds.maxX).toBeGreaterThanOrEqual(97);
    expect(bounds.minY).toBeLessThanOrEqual(21);
    expect(bounds.maxY).toBeGreaterThanOrEqual(78);

    image.delete();
  });
});