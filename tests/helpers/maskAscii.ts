import type { OpenCvMat } from "../../src/application/opencv/OpenCvTypes";

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