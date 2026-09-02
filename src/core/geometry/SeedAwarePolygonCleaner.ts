import type { PixelPoint } from "../../application/opencv/PixelPoint";

export interface SeedAwarePolygonPoint {
    x: number;
    y: number;
}

export class SeedAwarePolygonCleaner {
    public clean(
        points: readonly SeedAwarePolygonPoint[],
        seed: PixelPoint
    ): readonly SeedAwarePolygonPoint[] {
        if (
            points.length < 5
        ) {
            return points;
        }

        const cleaned =
            [...points];

        let changed = true;

        while (
            changed &&
            cleaned.length >= 5
        ) {
            changed = false;

            for (
                let i = 0;
                i < cleaned.length;
                i += 1
            ) {
                if (
                    !this.isSuspiciousVertex(
                        cleaned,
                        i,
                        seed
                    )
                ) {
                    continue;
                }

                const candidate =
                    cleaned.filter(
                        (
                            _,
                            index
                        ) =>
                            index !== i
                    );

                if (
                    !this.isValidPolygon(
                        candidate,
                        seed
                    )
                ) {
                    continue;
                }

                if (
                    this.areaDifference(
                        cleaned,
                        candidate
                    ) > 0.10
                ) {
                    continue;
                }

                cleaned.splice(
                    i,
                    1
                );

                changed = true;
                break;
            }
        }

        return cleaned;
    }

    private isSuspiciousVertex(
        points: readonly SeedAwarePolygonPoint[],
        index: number,
        seed: PixelPoint
    ): boolean {
        const previous =
            points[
                this.wrapIndex(
                    index - 1,
                    points.length
                )
            ];

        const current =
            points[index];

        const next =
            points[
                this.wrapIndex(
                    index + 1,
                    points.length
                )
            ];

        if (
            previous === undefined ||
            current === undefined ||
            next === undefined
        ) {
            return false;
        }

        const turnSeverity =
            this.calculateTurnSeverity(
                previous,
                current,
                next
            );

        if (
            turnSeverity < 35
        ) {
            return false;
        }

        const previousAngle =
            this.calculateSeedAngle(
                previous,
                seed
            );

        const currentAngle =
            this.calculateSeedAngle(
                current,
                seed
            );

        const nextAngle =
            this.calculateSeedAngle(
                next,
                seed
            );

        const incomingChange =
            Math.abs(
                this.normaliseAngleDifference(
                    currentAngle -
                        previousAngle
                )
            );

        const outgoingChange =
            Math.abs(
                this.normaliseAngleDifference(
                    nextAngle -
                        currentAngle
                )
            );

        const directionChange =
            Math.abs(
                incomingChange -
                    outgoingChange
            );

        const previousDistance =
            this.calculateDistanceFromSeed(
                previous,
                seed
            );

        const currentDistance =
            this.calculateDistanceFromSeed(
                current,
                seed
            );

        const nextDistance =
            this.calculateDistanceFromSeed(
                next,
                seed
            );

        const surroundingDistance =
            (
                previousDistance +
                nextDistance
            ) / 2;

        if (
            surroundingDistance === 0
        ) {
            return false;
        }

        const radialDeviation =
            Math.abs(
                currentDistance -
                    surroundingDistance
            ) /
            surroundingDistance;

        return (
            directionChange >= 25 &&
            radialDeviation >= 0.12
        );
    }

    private calculateSeedAngle(
        point: SeedAwarePolygonPoint,
        seed: PixelPoint
    ): number {
        return (
            Math.atan2(
                point.y - seed.y,
                point.x - seed.x
            ) *
            180 /
            Math.PI
        );
    }

    private calculateDistanceFromSeed(
        point: SeedAwarePolygonPoint,
        seed: PixelPoint
    ): number {
        return Math.hypot(
            point.x - seed.x,
            point.y - seed.y
        );
    }

    private calculateTurnSeverity(
        previous: SeedAwarePolygonPoint,
        current: SeedAwarePolygonPoint,
        next: SeedAwarePolygonPoint
    ): number {
        const incomingX =
            previous.x -
            current.x;

        const incomingY =
            previous.y -
            current.y;

        const outgoingX =
            next.x -
            current.x;

        const outgoingY =
            next.y -
            current.y;

        const incomingLength =
            Math.hypot(
                incomingX,
                incomingY
            );

        const outgoingLength =
            Math.hypot(
                outgoingX,
                outgoingY
            );

        if (
            incomingLength === 0 ||
            outgoingLength === 0
        ) {
            return 0;
        }

        const cosine =
            (
                incomingX *
                    outgoingX +
                incomingY *
                    outgoingY
            ) /
            (
                incomingLength *
                outgoingLength
            );

        const clampedCosine =
            Math.max(
                -1,
                Math.min(
                    1,
                    cosine
                )
            );

        const interiorAngle =
            Math.acos(
                clampedCosine
            ) *
            180 /
            Math.PI;

        return Math.max(
            0,
            180 -
                interiorAngle
        );
    }

    private normaliseAngleDifference(
        angle: number
    ): number {
        let result =
            angle;

        while (
            result > 180
        ) {
            result -= 360;
        }

        while (
            result < -180
        ) {
            result += 360;
        }

        return result;
    }

    private isValidPolygon(
        points: readonly SeedAwarePolygonPoint[],
        seed: PixelPoint
    ): boolean {
        if (
            points.length < 4
        ) {
            return false;
        }

        if (
            this.hasDuplicatePoints(
                points
            )
        ) {
            return false;
        }

        if (
            !this.isPointInsidePolygon(
                seed,
                points
            )
        ) {
            return false;
        }

        return true;
    }

    private hasDuplicatePoints(
        points: readonly SeedAwarePolygonPoint[]
    ): boolean {
        const seen =
            new Set<string>();

        for (
            const point of points
        ) {
            const key =
                `${point.x},${point.y}`;

            if (
                seen.has(key)
            ) {
                return true;
            }

            seen.add(key);
        }

        return false;
    }

    private isPointInsidePolygon(
        point: PixelPoint,
        polygon: readonly SeedAwarePolygonPoint[]
    ): boolean {
        let inside = false;

        for (
            let i = 0,
                j = polygon.length - 1;
            i < polygon.length;
            j = i,
            i += 1
        ) {
            const current =
                polygon[i];

            const previous =
                polygon[j];

            if (
                current === undefined ||
                previous === undefined
            ) {
                continue;
            }

            const intersects =
                (
                    current.y > point.y
                ) !==
                    (
                        previous.y >
                        point.y
                    ) &&
                point.x <
                    (
                        previous.x -
                        current.x
                    ) *
                        (
                            point.y -
                            current.y
                        ) /
                        (
                            previous.y -
                            current.y
                        ) +
                    current.x;

            if (
                intersects
            ) {
                inside =
                    !inside;
            }
        }

        return inside;
    }

    private polygonArea(
        points: readonly SeedAwarePolygonPoint[]
    ): number {
        let area = 0;

        for (
            let i = 0;
            i < points.length;
            i += 1
        ) {
            const current =
                points[i];

            const next =
                points[
                    (i + 1) %
                        points.length
                ];

            if (
                current === undefined ||
                next === undefined
            ) {
                continue;
            }

            area +=
                current.x *
                    next.y -
                next.x *
                    current.y;
        }

        return Math.abs(
            area / 2
        );
    }

    private areaDifference(
        original: readonly SeedAwarePolygonPoint[],
        candidate: readonly SeedAwarePolygonPoint[]
    ): number {
        const originalArea =
            this.polygonArea(
                original
            );

        if (
            originalArea === 0
        ) {
            return 1;
        }

        const candidateArea =
            this.polygonArea(
                candidate
            );

        return Math.abs(
            originalArea -
                candidateArea
        ) /
            originalArea;
    }

    private wrapIndex(
        index: number,
        length: number
    ): number {
        return (
            (
                index %
                    length
            ) +
            length
        ) %
            length;
    }
}