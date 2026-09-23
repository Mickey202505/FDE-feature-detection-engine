import type { OpenCvMat } from "../../src/application/opencv/OpenCvTypes";
import type { PixelPoint } from "../../src/api/PixelPoint";
export function maskToAscii(
  mask: OpenCvMat,
  outputCols: number = 80,
  outputRows: number = 30,
): string {
  const lines: string[] = [];

  for (let row = 0; row < outputRows; row += 1) {
    let line = "";

    for (let col = 0; col < outputCols; col += 1) {
      const x = Math.floor((col / outputCols) * mask.cols);
      const y = Math.floor((row / outputRows) * mask.rows);

      // Clamp in case the rounding lands exactly on the edge
      const safeX = Math.min(x, mask.cols - 1);
      const safeY = Math.min(y, mask.rows - 1);

      const value = mask.ucharPtr(safeY, safeX)[0];
      line += value !== 0 ? "#" : ".";
    }

    lines.push(line);
  }

  return lines.join("\n");
}

export function maskToRayAscii(
  points: readonly PixelPoint[],
  imageWidth: number,
  imageHeight: number,
  outputCols: number = 80,
  outputRows: number = 30,
): string {
  const grid: string[][] = [];

  for (let r = 0; r < outputRows; r += 1) {
    grid.push(new Array(outputCols).fill("."));
  }

  for (const point of points) {
    const col = Math.min(
      outputCols - 1,
      Math.max(0, Math.floor((point.x / imageWidth) * outputCols)),
    );
    const row = Math.min(
      outputRows - 1,
      Math.max(0, Math.floor((point.y / imageHeight) * outputRows)),
    );
    grid[row][col] = "O";
  }

  return grid.map((row) => row.join("")).join("\n");
}