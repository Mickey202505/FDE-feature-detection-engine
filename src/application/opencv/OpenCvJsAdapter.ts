import type {
    OpenCvContour,
    OpenCvMat,
    OpenCvRuntime
} from "./OpenCvTypes";

import type { PixelPoint } from "./PixelPoint";
import type { OpenCvAdapter } from "./OpenCvAdapter";

interface PolygonPoint {
    x: number;
    y: number;
}

export class OpenCvJsAdapter implements OpenCvAdapter {
    private readonly cv: OpenCvRuntime;

    public constructor(cv: OpenCvRuntime) {
        this.cv = cv;
    }

    public findContours(
        image: OpenCvMat,
        seed?: PixelPoint
    ): readonly OpenCvContour[] {
        this.validateImage(image);

        const contours = new this.cv.MatVector();
        const hierarchy = new this.cv.Mat();

        let binaryImage: OpenCvMat | undefined;

        try {
            binaryImage =
                this.createBinaryImage(
                    image,
                    seed
                );

            this.cv.findContours(
                binaryImage,
                contours,
                hierarchy,
                this.cv.RETR_EXTERNAL,
                this.cv.CHAIN_APPROX_SIMPLE
            );

            const result: OpenCvContour[] = [];

            for (
                let i = 0;
                i < contours.size();
                i += 1
            ) {
                const contour =
                    contours.get(i);

                const approx =
                    new this.cv.Mat();

                try {
                    if (
                        this.cv.approxPolyDP !==
                        undefined
                    ) {
                        const perimeter =
                            this.cv.arcLength !==
                            undefined
                                ? this.cv.arcLength(
                                      contour,
                                      true
                                  )
                                : 0;

                        const epsilon =
                            perimeter > 0
                                ? perimeter * 0.01
                                : 2.0;

                        this.cv.approxPolyDP(
                            contour,
                            approx,
                            epsilon,
                            true
                        );

                        let points =
                            this.readPoints(
                                approx
                            );

                        if (
                            seed !== undefined
                        ) {
                            points =
                                this.cleanSeedAwarePolygon(
                                    points,
                                    seed
                                );
                        }

                        result.push({
                            points
                        });
                    } else {
                        let points =
                            this.readPoints(
                                contour
                            );

                        if (
                            seed !== undefined
                        ) {
                            points =
                                this.cleanSeedAwarePolygon(
                                    points,
                                    seed
                                );
                        }

                        result.push({
                            points
                        });
                    }
                } finally {
                    approx.delete();
                    contour.delete();
                }
            }

            return result;
        } finally {
            if (
                binaryImage !==
                undefined
            ) {
                binaryImage.delete();
            }

            hierarchy.delete();
            contours.delete();
        }
    }

    private createBinaryImage(
        image: OpenCvMat,
        seed?: PixelPoint
    ): OpenCvMat {
        const CV_8U =
            this.cv.CV_8U ?? 0;

        const binary =
            new this.cv.Mat(
                image.rows,
                image.cols,
                CV_8U
            );

        try {
            if (
                image.ucharPtr ===
                    undefined ||
                binary.ucharPtr ===
                    undefined
            ) {
                return binary;
            }

            if (
                seed !== undefined
            ) {
                this.createSeededMask(
                    image,
                    binary,
                    seed
                );

                this.cleanSeededMask(
                    binary
                );
            } else {
                this.createAutomaticMask(
                    image,
                    binary
                );
            }

            return binary;
        } catch (error) {
            binary.delete();
            throw error;
        }
    }

    private createSeededMask(
        image: OpenCvMat,
        binary: OpenCvMat,
        seed: PixelPoint
    ): void {
        if (
            image.ucharPtr ===
                undefined ||
            binary.ucharPtr ===
                undefined
        ) {
            return;
        }

        const seedX =
            Math.round(seed.x);

        const seedY =
            Math.round(seed.y);

        if (
            seedX < 0 ||
            seedX >= image.cols ||
            seedY < 0 ||
            seedY >= image.rows
        ) {
            throw new Error(
                "Seed point is outside the image."
            );
        }

        const seedPixel =
            image.ucharPtr(
                seedY,
                seedX
            );

        const seedR =
            seedPixel[0] ?? 0;

        const seedG =
            seedPixel[1] ?? 0;

        const seedB =
            seedPixel[2] ?? 0;

        const seedDominance =
            seedG -
            Math.max(
                seedR,
                seedB
            );

        const seedIsGreen =
            seedG >= 50 &&
            seedDominance >= 10;

        if (
            !seedIsGreen
        ) {
            this.clearMask(
                binary
            );

            return;
        }

        const tolerance = 35;

        const lowerR =
            Math.max(
                0,
                seedR - tolerance
            );

        const lowerG =
            Math.max(
                0,
                seedG - tolerance
            );

        const lowerB =
            Math.max(
                0,
                seedB - tolerance
            );

        const upperR =
            Math.min(
                255,
                seedR + tolerance
            );

        const upperG =
            Math.min(
                255,
                seedG + tolerance
            );

        const upperB =
            Math.min(
                255,
                seedB + tolerance
            );

        for (
            let y = 0;
            y < image.rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < image.cols;
                x += 1
            ) {
                const pixel =
                    image.ucharPtr(
                        y,
                        x
                    );

                const r =
                    pixel[0] ?? 0;

                const g =
                    pixel[1] ?? 0;

                const b =
                    pixel[2] ?? 0;

                const insideColourRange =
                    r >= lowerR &&
                    r <= upperR &&
                    g >= lowerG &&
                    g <= upperG &&
                    b >= lowerB &&
                    b <= upperB;

                const greenDominance =
                    g -
                    Math.max(
                        r,
                        b
                    );

                const isGreen =
                    insideColourRange &&
                    g >= 50 &&
                    greenDominance >= 10;

                const output =
                    binary.ucharPtr(
                        y,
                        x
                    );

                output[0] =
                    isGreen
                        ? 255
                        : 0;
            }
        }
    }

    private cleanSeededMask(
        binary: OpenCvMat
    ): void {
        if (
            binary.ucharPtr ===
            undefined
        ) {
            return;
        }

        const rows =
            binary.rows;

        const cols =
            binary.cols;

        const values =
            new Uint8Array(
                rows * cols
            );

        for (
            let y = 0;
            y < rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < cols;
                x += 1
            ) {
                const pixel =
                    binary.ucharPtr(
                        y,
                        x
                    );

                values[
                    y * cols + x
                ] =
                    pixel[0] ?? 0;
            }
        }

        for (
            let y = 1;
            y < rows - 1;
            y += 1
        ) {
            for (
                let x = 1;
                x < cols - 1;
                x += 1
            ) {
                const index =
                    y * cols + x;

                if (
                    values[index] === 0
                ) {
                    continue;
                }

                let neighbours = 0;

                for (
                    let dy = -1;
                    dy <= 1;
                    dy += 1
                ) {
                    for (
                        let dx = -1;
                        dx <= 1;
                        dx += 1
                    ) {
                        if (
                            dx === 0 &&
                            dy === 0
                        ) {
                            continue;
                        }

                        if (
                            values[
                                (y + dy) *
                                    cols +
                                    (x + dx)
                            ] > 0
                        ) {
                            neighbours += 1;
                        }
                    }
                }

                if (
                    neighbours === 0
                ) {
                    binary.ucharPtr(
                        y,
                        x
                    )[0] = 0;
                }
            }
        }
    }

    private createAutomaticMask(
        image: OpenCvMat,
        binary: OpenCvMat
    ): void {
        if (
            image.ucharPtr ===
                undefined ||
            binary.ucharPtr ===
                undefined
        ) {
            return;
        }

        for (
            let y = 0;
            y < image.rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < image.cols;
                x += 1
            ) {
                const pixel =
                    image.ucharPtr(
                        y,
                        x
                    );

                const r =
                    pixel[0] ?? 0;

                const g =
                    pixel[1] ?? 0;

                const b =
                    pixel[2] ?? 0;

                const greenDominance =
                    g -
                    Math.max(
                        r,
                        b
                    );

                const isGreen =
                    g >= 50 &&
                    greenDominance >= 10;

                const output =
                    binary.ucharPtr(
                        y,
                        x
                    );

                output[0] =
                    isGreen
                        ? 255
                        : 0;
            }
        }
    }

    private clearMask(
        binary: OpenCvMat
    ): void {
        if (
            binary.ucharPtr ===
                undefined
        ) {
            return;
        }

        for (
            let y = 0;
            y < binary.rows;
            y += 1
        ) {
            for (
                let x = 0;
                x < binary.cols;
                x += 1
            ) {
                const pixel =
                    binary.ucharPtr(
                        y,
                        x
                    );

                pixel[0] = 0;
            }
        }
    }

    private cleanSeedAwarePolygon(
        points: readonly PolygonPoint[],
        seed: PixelPoint
    ): readonly PolygonPoint[] {
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
                    !this.isSuspiciousSeedAwareVertex(
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
                    !this.isValidSeedAwarePolygon(
                        candidate,
                        seed
                    )
                ) {
                    continue;
                }

                if (
                    this.polygonAreaDifference(
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

    private isSuspiciousSeedAwareVertex(
        points: readonly PolygonPoint[],
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

        /*
         * This is turn severity rather than the interior angle.
         *
         * Straight boundary:
         *     interior angle ~= 180°
         *     turn severity ~= 0°
         *
         * Sharp corner:
         *     interior angle is smaller
         *     turn severity is larger
         */
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
        point: PolygonPoint,
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
        point: PolygonPoint,
        seed: PixelPoint
    ): number {
        return Math.hypot(
            point.x - seed.x,
            point.y - seed.y
        );
    }

    private calculateTurnSeverity(
        previous: PolygonPoint,
        current: PolygonPoint,
        next: PolygonPoint
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

    private isValidSeedAwarePolygon(
        points: readonly PolygonPoint[],
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
        points: readonly PolygonPoint[]
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
        polygon: readonly PolygonPoint[]
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
        points: readonly PolygonPoint[]
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

    private polygonAreaDifference(
        original: readonly PolygonPoint[],
        candidate: readonly PolygonPoint[]
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

    private validateImage(
        image: OpenCvMat
    ): void {
        if (
            image.rows <= 0 ||
            image.cols <= 0
        ) {
            throw new Error(
                "OpenCV image must have positive dimensions."
            );
        }
    }

    private readPoints(
        contour: OpenCvMat
    ): readonly {
        x: number;
        y: number;
    }[] {
        const data =
            contour.data32S ??
            new Int32Array();

        const points: {
            x: number;
            y: number;
        }[] = [];

        for (
            let i = 0;
            i + 1 < data.length;
            i += 2
        ) {
            points.push({
                x: data[i] ?? 0,
                y: data[i + 1] ?? 0
            });
        }

        return points;
    }
}