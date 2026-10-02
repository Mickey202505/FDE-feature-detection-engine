export function removeSharpCorners(points, minAngleDeg = 150) {
    if (points.length < 4)
        return [...points];
    const minAngle = (minAngleDeg * Math.PI) / 180;
    const result = [];
    for (let i = 0; i < points.length; i += 1) {
        const prev = points[(i - 1 + points.length) % points.length];
        const curr = points[i];
        const next = points[(i + 1) % points.length];
        const v1x = prev.x - curr.x;
        const v1y = prev.y - curr.y;
        const v2x = next.x - curr.x;
        const v2y = next.y - curr.y;
        const dot = v1x * v2x + v1y * v2y;
        const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
        const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
        if (mag1 === 0 || mag2 === 0) {
            result.push(curr);
            continue;
        }
        const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
        const angle = Math.acos(cosAngle);
        if (angle >= minAngle)
            result.push(curr);
    }
    if (result.length < 4)
        return [...points];
    return result;
}
//# sourceMappingURL=removeSharpCorners.js.map