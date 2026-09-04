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
         * First check the broader direction of the
         * surrounding boundary.
         *
         * We deliberately do not use the seed as a
         * centre point.
         */
        const surroundingDirectionX =
            afterNext.x -
            beforePrevious.x;

        const surroundingDirectionY =
            afterNext.y -
            beforePrevious.y;

        const surroundingLength =
            Math.sqrt(
                surroundingDirectionX *
                    surroundingDirectionX +
                    surroundingDirectionY *
                    surroundingDirectionY,
            );

        if (surroundingLength === 0) {
            return false;
        }

        const distanceFromSurroundingLine =
            Math.abs(
                surroundingDirectionX *
                    (
                        current.y -
                        beforePrevious.y
                    ) -
                    surroundingDirectionY *
                    (
                        current.x -
                        beforePrevious.x
                    ),
            ) /
            surroundingLength;

        /*
         * A spike normally has two short edges.
         *
         * Keep this at 0.75 for now. The turning-angle
         * check below is what distinguishes a sharp spike
         * from a legitimate broad corner.
         */
        const incomingIsShort =
            incomingLength <
            previousBoundaryLength * 0.50;

        const outgoingIsShort =
            outgoingLength <
            nextBoundaryLength * 0.50;

        /*
         * Measure the actual change in direction at this
         * point.
         *
         * A legitimate corner can protrude from the
         * surrounding line but still have a broad
         * direction change.
         *
         * An artificial spike tends to make a much sharper
         * direction change.
         */
        const turningAngle =
            this.calculateTurningAngle(
                previous,
                current,
                next,
            );

        const isSharpSpike =
            turningAngle < 120;

        /*
         * The point must also be meaningfully displaced
         * from the broader boundary.
         */
        const isMeaningfullyDisplaced =
            distanceFromSurroundingLine >
            Math.min(
                previousBoundaryLength,
                nextBoundaryLength,
            ) * 0.20;

        return (
            incomingIsShort &&
            outgoingIsShort &&
            isSharpSpike &&
            isMeaningfullyDisplaced
        );
    }

    private calculateTurningAngle(
        previous: SeedAwarePolygonPoint,
        current: SeedAwarePolygonPoint,
        next: SeedAwarePolygonPoint,
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
            Math.sqrt(
                incomingX * incomingX +
                    incomingY * incomingY,
            );

        const outgoingLength =
            Math.sqrt(
                outgoingX * outgoingX +
                    outgoingY * outgoingY,
            );

        if (
            incomingLength === 0 ||
            outgoingLength === 0
        ) {
            return 180;
        }

        const cosine =
            (
                incomingX * outgoingX +
                incomingY * outgoingY
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
            ) /
            originalArea;

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
                    (
                        (previous.x -
                            current.x) *
                        (point.y -
                            current.y)
                    ) /
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
            second.x -
            first.x;

        const dy =
            second.y -
            first.y;

        return Math.sqrt(
            dx * dx +
                dy * dy,
        );
    }
}