import type {
    OpenCvContour,
    OpenCvContourCollection,
    OpenCvImageData,
    OpenCvMat,
    OpenCvPoint,
    OpenCvRuntime,
} from "./OpenCvTypes";

import type { PixelPoint } from "../../core/geometry/SeedAwarePolygonCleaner";

export class OpenCvJsAdapter
{
    private readonly cv: OpenCvRuntime;

    constructor(cv: OpenCvRuntime) {
        this.cv = cv;
    }

    findContours(
        image: OpenCvImageData | OpenCvMat,
        seed?: PixelPoint,
    ): OpenCvContourCollection {
        const normalizedImage =
            this.normalizeImage(image);

        this.validateImage(normalizedImage);

        const mask =
            this.createBinaryImage(
                normalizedImage,
                seed,
            );

        const contours =
            new this.cv.MatVector();

        const hierarchy =
            new this.cv.Mat();

        try {
            this.cv.findContours(
                mask,
                contours,
                hierarchy,
                this.cv.RETR_EXTERNAL,
                this.cv.CHAIN_APPROX_SIMPLE,
            );

            const detectedContours: OpenCvContour[] =
                [];

            for (
                let index = 0;
                index < contours.size();
                index += 1
            ) {
                const contour =
                    contours.get(index);

                try {
                    let points =
                        this.readContourPoints(
                            contour,
                        );

                    this.logRawContourDiagnostic(
                        points,
                    );

                    if (
                        points.length >= 3 &&
                        this.cv.approxPolyDP
                    ) {
                        const perimeter =
                            this.calculatePerimeter(
                                points,
                            );

                        const epsilon =
                            Math.max(
                                perimeter *
                                    0.005,
                                0.5,
                            );

                        const approximated =
                            new this.cv.Mat();

                        try {
                            this.cv.approxPolyDP(
                                contour,
                                approximated,
                                epsilon,
                                true,
                            );

                            points =
                                this.readContourPoints(
                                    approximated,
                                );

                            this.logApproximatedContourDiagnostic(
                                points,
                                epsilon,
                            );
                        } finally {
                            if (
                                typeof approximated.delete ===
                                "function"
                            ) {
                                approximated.delete();
                            }
                        }
                    }

                    if (
                        seed &&
                        points.length >= 3
                    ) {
                        points =
                            this.cleanSeedAwarePolygon(
                                points,
                                seed,
                            );
                    }

                    if (
                        points.length >= 3
                    ) {
                        detectedContours.push({
                            points,
                        });
                    }
                } finally {
                    if (
                        contour &&
                        typeof contour.delete ===
                        "function"
                    ) {
                        contour.delete();
                    }
                }
            }

            return detectedContours;
        } finally {
            if (
                typeof contours.delete ===
                "function"
            ) {
                contours.delete();
            }

            if (
                typeof hierarchy.delete ===
                "function"
            ) {
                hierarchy.delete();
            }

            if (
                typeof mask.delete ===
                "function"
            ) {
                mask.delete();
            }
        }
    }

    private createBinaryImage(
        image: OpenCvImageData,
        seed?: PixelPoint,
    ): OpenCvMat {
        if (seed) {
            return this.createSeedGuidedRegionMask(
                image,
                seed,
            );
        }

        return this.createAutomaticGreenMask(
            image,
        );
    }

    private createSeedGuidedRegionMask(
        image: OpenCvImageData,
        seed: PixelPoint,
    ): OpenCvMat {
        const mask =
            new this.cv.Mat(
                image.height,
                image.width,
                this.cv.CV_8U,
            );

        this.clearMask(mask);

        const seedX =
            Math.round(seed.x);

        const seedY =
            Math.round(seed.y);

        if (
            seedX < 0 ||
            seedX >= image.width ||
            seedY < 0 ||
            seedY >= image.height
        ) {
            return mask;
        }

        const seedColour =
            this.readPixel(
                image,
                seedX,
                seedY,
            );

        if (
            !this.isGreenPixel(
                seedColour,
            )
        ) {
            return mask;
        }

        const visited =
            new Uint8Array(
                image.width *
                    image.height,
            );

        const accepted =
            new Uint8Array(
                image.width *
                    image.height,
            );

        const queueX: number[] = [];
        const queueY: number[] = [];

        const seedIndex =
            seedY * image.width +
            seedX;

        visited[seedIndex] = 1;
        accepted[seedIndex] = 1;

        queueX.push(seedX);
        queueY.push(seedY);

        /*
         * Local colour continuity controls how
         * far a candidate pixel may differ from
         * the already accepted neighbourhood.
         */
        const localTolerance = 18;

        const seedTolerance = 30;
        const gradualTransitionSeedTolerance = 60;
        const gradualTransitionLocalTolerance = 8;
        const minimumCloseAcceptedNeighbours = 5;

        /*
         * Diagnostic values only.
         *
         * These do not affect the detection result.
         * They tell us how far the accepted region
         * travels from the original seed colour.
         */
        let maximumSeedDistance = 0;

        let maximumSeedDistancePoint:
            PixelPoint | undefined;

        const neighbourOffsets =
            [
                [-1, -1],
                [0, -1],
                [1, -1],
                [-1, 0],
                [1, 0],
                [-1, 1],
                [0, 1],
                [1, 1],
            ];

        while (
            queueX.length > 0
        ) {
            const currentX =
                queueX.shift()!;

            const currentY =
                queueY.shift()!;

            for (
                const [
                    offsetX,
                    offsetY,
                ] of neighbourOffsets
            ) {
                const nextX =
                    currentX +
                    offsetX;

                const nextY =
                    currentY +
                    offsetY;

                if (
                    nextX < 0 ||
                    nextX >= image.width ||
                    nextY < 0 ||
                    nextY >= image.height
                ) {
                    continue;
                }

                const index =
                    nextY *
                        image.width +
                    nextX;

                if (
                    visited[index] !== 0
                ) {
                    continue;
                }

                visited[index] = 1;

                const candidateColour =
                    this.readPixel(
                        image,
                        nextX,
                        nextY,
                    );

                if (
                    !this.isGreenPixel(
                        candidateColour,
                    )
                ) {
                    continue;
                }

                const seedDistance =
                    this.calculateRgbDistance(
                        candidateColour,
                        seedColour,
                    );

                /*
                 * Diagnostic only.
                 *
                 * We record the furthest colour
                 * encountered from the original
                 * seed colour.
                 */
                if (
                    seedDistance >
                    maximumSeedDistance
                ) {
                    maximumSeedDistance =
                        seedDistance;

                    maximumSeedDistancePoint =
                        {
                            x: nextX,
                            y: nextY,
                        };
                }

                /*
                 * Important:
                 *
                 * We deliberately do NOT reject the
                 * candidate based on its distance from
                 * the original seed colour.
                 *
                 * The region is allowed to follow a
                 * gradual colour change. The local
                 * neighbourhood check below is what
                 * controls continuity.
                 */
                const localColour =
                    this.getLocalAcceptedColour(
                        image,
                        accepted,
                        nextX,
                        nextY,
                    );

                const localDistance =
                    this.calculateRgbDistance(
                        candidateColour,
                        localColour,
                    );

                if (
                    localDistance >
                    localTolerance
                ) {
                    continue;
                }

                /*
                 * Most candidates must remain reasonably
                 * close to the original seed colour.
                 *
                 * A small exception allows a genuinely
                 * gradual transition to continue when the
                 * candidate is strongly supported by several
                 * already accepted neighbours. This keeps the
                 * useful gradual-transition behaviour without
                 * allowing unlimited colour drift through turf.
                 */
                const closeNeighbourCount =
                    this.countCloseAcceptedNeighbours(
                        image,
                        accepted,
                        nextX,
                        nextY,
                        candidateColour,
                        localTolerance,
                    );

                if (
                    seedDistance >
                    seedTolerance &&
                    (
                        seedDistance >
                            gradualTransitionSeedTolerance ||
                        closeNeighbourCount <
                            minimumCloseAcceptedNeighbours ||
                        localDistance >
                            gradualTransitionLocalTolerance
                    )
                ) {
                    continue;
                }

                accepted[index] = 1;

                this.writeMaskPixel(
                    mask,
                    nextX,
                    nextY,
                    255,
                );

                queueX.push(nextX);
                queueY.push(nextY);
            }
        }

        /*
         * Diagnostic only.
         *
         * This does not change the mask.
         */
        console.log(
            "[SeedGrowthDiagnostic]",
            {
                seed,
                seedColour,
                localTolerance,
                seedTolerance,
                gradualTransitionSeedTolerance,
                gradualTransitionLocalTolerance,
                minimumCloseAcceptedNeighbours,
                maximumSeedDistance,
                maximumSeedDistancePoint,
            },
        );

        return mask;
    }

    private createAutomaticGreenMask(
        image: OpenCvImageData,
    ): OpenCvMat {
        const mask =
            new this.cv.Mat(
                image.height,
                image.width,
                this.cv.CV_8U,
            );

        this.clearMask(mask);

        for (
            let y = 0;
            y < image.height;
            y += 1
        ) {
            for (
                let x = 0;
                x < image.width;
                x += 1
            ) {
                const colour =
                    this.readPixel(
                        image,
                        x,
                        y,
                    );

                if (
                    this.isGreenPixel(
                        colour,
                    )
                ) {
                    this.writeMaskPixel(
                        mask,
                        x,
                        y,
                        255,
                    );
                }
            }
        }

        return mask;
    }

    private readPixel(
        image: OpenCvImageData,
        x: number,
        y: number,
    ): {
        r: number;
        g: number;
        b: number;
    } {
        const index =
            (y * image.width + x) * 4;

        return {
            r: image.data[index],
            g: image.data[index + 1],
            b: image.data[index + 2],
        };
    }

    private writeMaskPixel(
        mask: OpenCvMat,
        x: number,
        y: number,
        value: number,
    ): void {
        if (
            typeof mask.ucharPtr ===
            "function"
        ) {
            mask.ucharPtr(y, x)[0] =
                value;
        }
    }

    private clearMask(
        mask: OpenCvMat,
    ): void {
        if (
            typeof mask.ucharPtr ===
            "function"
        ) {
            for (
                let y = 0;
                y < mask.rows;
                y += 1
            ) {
                for (
                    let x = 0;
                    x < mask.cols;
                    x += 1
                ) {
                    mask.ucharPtr(y, x)[0] =
                        0;
                }
            }
        }
    }

    private countCloseAcceptedNeighbours(
        image: OpenCvImageData,
        accepted: Uint8Array,
        x: number,
        y: number,
        candidateColour: {
            r: number;
            g: number;
            b: number;
        },
        tolerance: number,
    ): number {
        let count = 0;

        for (
            let offsetY = -1;
            offsetY <= 1;
            offsetY += 1
        ) {
            for (
                let offsetX = -1;
                offsetX <= 1;
                offsetX += 1
            ) {
                if (
                    offsetX === 0 &&
                    offsetY === 0
                ) {
                    continue;
                }

                const neighbourX =
                    x + offsetX;
                const neighbourY =
                    y + offsetY;

                if (
                    neighbourX < 0 ||
                    neighbourX >= image.width ||
                    neighbourY < 0 ||
                    neighbourY >= image.height
                ) {
                    continue;
                }

                const index =
                    neighbourY * image.width +
                    neighbourX;

                if (accepted[index] === 0) {
                    continue;
                }

                const colour =
                    this.readPixel(
                        image,
                        neighbourX,
                        neighbourY,
                    );

                if (
                    this.calculateRgbDistance(
                        candidateColour,
                        colour,
                    ) <= tolerance
                ) {
                    count += 1;
                }
            }
        }

        return count;
    }

    private getLocalAcceptedColour(
        image: OpenCvImageData,
        accepted: Uint8Array,
        x: number,
        y: number,
    ): {
        r: number;
        g: number;
        b: number;
    } {
        let redTotal = 0;
        let greenTotal = 0;
        let blueTotal = 0;
        let count = 0;

        for (
            let offsetY = -1;
            offsetY <= 1;
            offsetY += 1
        ) {
            for (
                let offsetX = -1;
                offsetX <= 1;
                offsetX += 1
            ) {
                if (
                    offsetX === 0 &&
                    offsetY === 0
                ) {
                    continue;
                }

                const neighbourX =
                    x + offsetX;

                const neighbourY =
                    y + offsetY;

                if (
                    neighbourX < 0 ||
                    neighbourX >=
                        image.width ||
                    neighbourY < 0 ||
                    neighbourY >=
                        image.height
                ) {
                    continue;
                }

                const index =
                    neighbourY *
                        image.width +
                    neighbourX;

                if (
                    accepted[index] ===
                    0
                ) {
                    continue;
                }

                const colour =
                    this.readPixel(
                        image,
                        neighbourX,
                        neighbourY,
                    );

                redTotal += colour.r;
                greenTotal += colour.g;
                blueTotal += colour.b;
                count += 1;
            }
        }

        if (count === 0) {
            return this.readPixel(
                image,
                x,
                y,
            );
        }

        return {
            r: redTotal / count,
            g: greenTotal / count,
            b: blueTotal / count,
        };
    }

    private calculateRgbDistance(
        first: {
            r: number;
            g: number;
            b: number;
        },
        second: {
            r: number;
            g: number;
            b: number;
        },
    ): number {
        const red =
            first.r - second.r;

        const green =
            first.g - second.g;

        const blue =
            first.b - second.b;

        return Math.sqrt(
            red * red +
                green * green +
                blue * blue,
        );
    }

    private isGreenPixel(
        colour: {
            r: number;
            g: number;
            b: number;
        },
    ): boolean {
        return (
            colour.g >= 50 &&
            colour.g -
                Math.max(
                    colour.r,
                    colour.b,
                ) >= 10
        );
    }

    private readContourPoints(
        contour: OpenCvMat,
    ): PixelPoint[] {
        const points: PixelPoint[] =
            [];

        if (
            !contour.data32S ||
            typeof contour.rows !==
                "number"
        ) {
            return points;
        }

        for (
            let row = 0;
            row < contour.rows;
            row += 1
        ) {
            const offset =
                row * 2;

            points.push({
                x:
                    contour.data32S[
                        offset
                    ],
                y:
                    contour.data32S[
                        offset + 1
                    ],
            });
        }

        return points;
    }

    private calculatePerimeter(
        points: readonly PixelPoint[],
    ): number {
        if (points.length < 2) {
            return 0;
        }

        let perimeter = 0;

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

            const dx =
                next.x - current.x;

            const dy =
                next.y - current.y;

            perimeter += Math.sqrt(
                dx * dx + dy * dy,
            );
        }

        return perimeter;
    }

    private cleanSeedAwarePolygon(
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
                (index - 1 +
                    points.length) %
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

        return (
            perpendicularDistance <=
            1.5
        );
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
        points: readonly PixelPoint[],
    ): boolean {
        const seen =
            new Set<string>();

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

    private getPointBounds(
        points: readonly PixelPoint[],
    ): {
        minX: number;
        maxX: number;
        minY: number;
        maxY: number;
    } | null {
        if (points.length === 0) {
            return null;
        }

        let minX = points[0].x;
        let maxX = points[0].x;
        let minY = points[0].y;
        let maxY = points[0].y;

        for (const point of points) {
            minX = Math.min(
                minX,
                point.x,
            );

            maxX = Math.max(
                maxX,
                point.x,
            );

            minY = Math.min(
                minY,
                point.y,
            );

            maxY = Math.max(
                maxY,
                point.y,
            );
        }

        return {
            minX,
            maxX,
            minY,
            maxY,
        };
    }

    private logRawContourDiagnostic(
        points: readonly PixelPoint[],
    ): void {
        console.log(
            "[RawContourDiagnostic]",
            {
                pointCount: points.length,
                bounds:
                    this.getPointBounds(
                        points,
                    ),
            },
        );
    }

    private logApproximatedContourDiagnostic(
        points: readonly PixelPoint[],
        epsilon: number,
    ): void {
        console.log(
            "[ApproximatedContourDiagnostic]",
            {
                pointCount: points.length,
                epsilon,
                bounds:
                    this.getPointBounds(
                        points,
                    ),
            },
        );
    }

    private normalizeImage(
        image: OpenCvImageData | OpenCvMat,
    ): OpenCvImageData {
        if (
            image &&
            Number.isInteger(
                (image as OpenCvImageData).width,
            ) &&
            Number.isInteger(
                (image as OpenCvImageData).height,
            ) &&
            (image as OpenCvImageData).data
        ) {
            return image as OpenCvImageData;
        }

        const mat = image as OpenCvMat;

        if (
            mat &&
            Number.isInteger(mat.cols) &&
            Number.isInteger(mat.rows) &&
            typeof mat.ucharPtr ===
                "function"
        ) {
            const width = mat.cols;
            const height = mat.rows;
            const data =
                new Uint8ClampedArray(
                    width * height * 4,
                );

            for (
                let y = 0;
                y < height;
                y += 1
            ) {
                for (
                    let x = 0;
                    x < width;
                    x += 1
                ) {
                    const pixel =
                        mat.ucharPtr(y, x);
                    const index =
                        (y * width + x) * 4;

                    data[index] =
                        pixel[0] ?? 0;
                    data[index + 1] =
                        pixel[1] ?? 0;
                    data[index + 2] =
                        pixel[2] ?? 0;
                    data[index + 3] =
                        pixel[3] ?? 255;
                }
            }

            return {
                width,
                height,
                data,
            };
        }

        return image as OpenCvImageData;
    }

    private validateImage(
        image: OpenCvImageData,
    ): void {
        if (
            !image ||
            !Number.isInteger(
                image.width,
            ) ||
            !Number.isInteger(
                image.height,
            ) ||
            image.width <= 0 ||
            image.height <= 0
        ) {
            throw new Error(
                "Invalid image dimensions.",
            );
        }

        const expectedLength =
            image.width *
            image.height *
            4;

        if (
            image.data.length !==
            expectedLength
        ) {
            throw new Error(
                "Image data length does not match image dimensions.",
            );
        }
    }
}