import type { PixelPoint } from "../../application/opencv/PixelPoint";

export class SeedAwarePolygonCleaner {
    clean(
        points: readonly PixelPoint[],
        seed: PixelPoint,
    ): PixelPoint[] {
        if (points.length < 5) {
            return [...points];
        }

        let cleaned = [...points];

        let changed = true;

        while (
            changed &&
            cleaned.length >= 5
        ) {
            changed = false;

            for (
                let index = 0;
                index < cleaned.length;
                index += 1
            ) {
                if (
                    this.isSuspiciousVertex(
                        cleaned,
                        index,
                    ) &&
                    this.isValidRemoval(
                        cleaned,
                        index,
                        seed,
                    )
                ) {
                    cleaned =
                        cleaned.filter(
                            (
                                _,
                                candidateIndex,
                            ) =>
                                candidateIndex !==
                                index,
                        );

                    changed = true;
                    break;
                }
            }
        }

        return cleaned;
    }

    private isSuspiciousVertex(
        points: readonly PixelPoint[],
        index: number,
    ): boolean {
        if (points.length < 3) {
            return false;
        }

        const previous =
            points[
                (index - 1 + points.length) %
                points.length
            ];

        const current =
            points[index];

        const next =
            points[
                (index + 1) %
                points.length
            ];

        const lineX =
            next.x - previous.x;

        const lineY =
            next.y - previous.y;

        const lineLength =
            Math.sqrt(
                lineX * lineX +
                lineY * lineY,
            );

        if (lineLength === 0) {
            return false;
        }

        const pointX =
            current.x - previous.x;

        const pointY =
            current.y - previous.y;

        const perpendicularDistance =
            Math.abs(
                lineX * pointY -
                lineY * pointX,
            ) / lineLength;

        const previousLength =
            Math.sqrt(
                pointX * pointX +
                pointY * pointY,
            );

        const nextX =
            next.x - current.x;

        const nextY =
            next.y - current.y;

        const nextLength =
            Math.sqrt(
                nextX * nextX +
                nextY * nextY,
            );

        if (
            previousLength < 3 ||
            nextLength < 3
        ) {
            return false;
        }

        return perpendicularDistance <= 1.5;
    }

    private isValidRemoval(
        points: readonly PixelPoint[],
        index: number,
        seed: PixelPoint,
    ): boolean {
        if (points.length <= 3) {
            return false;
        }

        const candidate =
            points.filter(
                (_, candidateIndex) =>
                    candidateIndex !== index,
            );

        if (
            this.hasDuplicatePoints(
                candidate,
            )
        ) {
            return false;
        }

        if (
            !this.isPointInsidePolygon(
                seed,
                candidate,
            )
        ) {
            return false;
        }

        const originalArea =
            this.calculatePolygonArea(
                points,
            );

        const candidateArea =
            this.calculatePolygonArea(
                candidate,
            );

        if (originalArea === 0) {
            return false;
        }

        const relativeAreaChange =
            Math.abs(
                candidateArea -
                    originalArea,
            ) / originalArea;

        if (
            relativeAreaChange > 0.1
        ) {
            return false;
        }

        return candidate.length >= 3;
    }

    private hasDuplicatePoints(
        points: readonly PixelPoint[],
    ): boolean {
        const seen = new Set<string>();

        for (const point of points) {
            const key =
                `${point.x}:${point.y}`;

            if (seen.has(key)) {
                return true;
            }

            seen.add(key);
        }

        return false;
    }

    private isPointInsidePolygon(
        point: PixelPoint,
        polygon: readonly PixelPoint[],
    ): boolean {
        let inside = false;

        for (
            let index = 0;
            index < polygon.length;
            index += 1
        ) {
            const current =
                polygon[index];

            const previous =
                polygon[
                    (index - 1 +
                        polygon.length) %
                        polygon.length
                ];

            const intersects =
                current.y > point.y !==
                    previous.y > point.y &&
                point.x <
                    ((previous.x -
                        current.x) *
                        (point.y -
                            current.y)) /
                        (previous.y -
                            current.y) +
                        current.x;

            if (intersects) {
                inside = !inside;
            }
        }

        return inside;
    }

    private calculatePolygonArea(
        points: readonly PixelPoint[],
    ): number {
        if (points.length < 3) {
            return 0;
        }

        let area = 0;

        for (
            let index = 0;
            index < points.length;
            index += 1
        ) {
            const current =
                points[index];

            const next =
                points[
                    (index + 1) %
                    points.length
                ];

            area +=
                current.x * next.y -
                next.x * current.y;
        }

        return Math.abs(area) / 2;
    }
}