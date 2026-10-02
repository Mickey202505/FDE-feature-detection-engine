"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskToAscii = maskToAscii;
exports.maskToRayAscii = maskToRayAscii;
function maskToAscii(mask, outputCols = 80, outputRows = 30) {
    const lines = [];
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
function maskToRayAscii(points, imageWidth, imageHeight, outputCols = 80, outputRows = 30) {
    const grid = [];
    for (let r = 0; r < outputRows; r += 1) {
        grid.push(new Array(outputCols).fill("."));
    }
    for (const point of points) {
        const col = Math.min(outputCols - 1, Math.max(0, Math.floor((point.x / imageWidth) * outputCols)));
        const row = Math.min(outputRows - 1, Math.max(0, Math.floor((point.y / imageHeight) * outputRows)));
        grid[row][col] = "O";
    }
    return grid.map((row) => row.join("")).join("\n");
}
//# sourceMappingURL=maskAscii.js.map