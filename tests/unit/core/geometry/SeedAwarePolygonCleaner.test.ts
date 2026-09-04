export interface SeedAwarePolygonPoint {
    readonly x: number;
    readonly y: number;
}

export class SeedAwarePolygonCleaner {
    clean(
        points: readonly SeedAwarePolygonPoint[],
        seed: SeedAwarePolygonPoint,
    ): SeedAwarePolygonPoint[] {
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
        points: readonly SeedAwarePolygonPoint[],
        index: number,
    ): boolean {
        if (points.length < 5) {
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

        const beforePrevious =
            points[
                (index - 2 + points.length) %
                    points.length
            ];

        const afterNext =
            points[
                (index + 2) %
                    points.length
            ];

        const incomingLength =
            this.distance(
                previous,
                current,
            );

        const outgoingLength =
            this.distance(
                current,
                next,
            );

        const previousBoundaryLength =
            this.distance(
                beforePrevious,
                previous,
            );

        const nextBoundaryLength =
            this.distance(
                next,
                afterNext,
            );

        if (
            incomingLength === 0 ||
            outgoingLength === 0 ||
            previousBoundaryLength === 0 ||
            nextBoundaryLength === 0
        ) {
            return false;
        }

        /*
         * An outward spike normally has:
         *
         * 1. a noticeably narrow turning angle
         * 2. two short edges leading into and out of it
         *
         * A legitimate corner can have short edges too,
         * so edge length alone is not enough.
         *
         * This does not use the seed as a centre point and
         * does not assume radial symmetry.
         */
        const turningAngle =
            this.calculateTurningAngle(
                previous,
                current,
                next,
            );

        const hasNarrowAngle =
            turningAngle <= 75;

        const incomingIsShort =
            incomingLength <
            previousBoundaryLength * 0.75;

        const outgoingIsShort =
            outgoingLength <
            nextBoundaryLength * 0.75;

        return (
            hasNarrowAngle &&
            incomingIsShort &&
            outgoingIsShort
        );
    }

    private calculateTurningAngle(
        previous: SeedAwarePolygonPoint,
        current: SeedAwarePolygonPoint,
        next: SeedAwarePolygonPoint,
    ): number {
        const firstX =
            previous.x - current.x;

        const firstY =
            previous.y - current.y;

        const secondX =
            next.x - current.x;

        const secondY =
            next.y - current.y;

        const firstLength =
            Math.sqrt(
                firstX * firstX +
                    firstY * firstY,
            );

        const secondLength =
            Math.sqrt(
                secondX * secondX +
                    secondY * secondY,
            );

        if (
            firstLength === 0 ||
            secondLength === 0
        ) {
            return 180;
        }

        const cosine =
            (
                firstX * secondX +
                firstY * secondY
            ) /
            (
                firstLength *
                secondLength
            );

        const clampedCosine =
            Math.max(
                -1,
                Math.min(
                    1,
                    cosine,
                ),
            );

        return (
            Math.acos(
                clampedCosine,
            ) *
            (180 / Math.PI)
        );
    }

    private isValidRemoval(
        points: readonly SeedAwarePolygonPoint[],
        index: number,
        seed: SeedAwarePolygonPoint,
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
        points: readonly SeedAwarePolygonPoint[],
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
        point: SeedAwarePolygonPoint,
        polygon: readonly SeedAwarePolygonPoint[],
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
        points: readonly SeedAwarePolygonPoint[],
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

    private distance(
        first: SeedAwarePolygonPoint,
        second: SeedAwarePolygonPoint,
    ): number {
        const dx =
            second.x - first.x;

        const dy =
            second.y - first.y;

        return Math.sqrt(
            dx * dx +
                dy * dy,
        );
    }
}