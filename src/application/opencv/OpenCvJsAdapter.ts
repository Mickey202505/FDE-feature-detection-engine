import type {
    OpenCvAdapter,
} from "./OpenCvAdapter";
import type {
    OpenCvContour,
    OpenCvContourCollection,
    OpenCvImageData,
    OpenCvMat,
    OpenCvPoint,
    OpenCvRuntime,
} from "./OpenCvTypes";
import type { PixelPoint } from "./PixelPoint";

export class OpenCvJsAdapter implements OpenCvAdapter {
    constructor(private readonly cv: OpenCvRuntime) {}

    findContours(
        image: OpenCvMat,
        seed?: PixelPoint,
    ): readonly OpenCvContour[] {
        this.validateImage(image);

        const binaryImage = this.createBinaryImage(image, seed);
        const contours = new this.cv.MatVector();
        const hierarchy = new this.cv.Mat();

        try {
            this.cv.findContours(
                binaryImage,
                contours,
                hierarchy,
                this.cv.RETR_EXTERNAL,
                this.cv.CHAIN_APPROX_SIMPLE,
            );

            const results: OpenCvContour[] = [];

            for (let index = 0; index < contours.size(); index += 1) {
                const contour = contours.get(index);

                try {
                    const rawPoints = this.readContourPoints(contour);

                    if (rawPoints.length < 3) {
                        continue;
                    }

                    this.logRawContourDiagnostic(rawPoints);

                    let points = rawPoints;

                    if (this.cv.approxPolyDP !== undefined) {
                        const perimeter = this.calculatePerimeter(rawPoints);

                        const epsilon = Math.max(
                            perimeter * 0.005,
                            0.5,
                        );

                        const approximated = new this.cv.Mat();

                        try {
                            this.cv.approxPolyDP(
                                contour,
                                approximated,
                                epsilon,
                                true,
                            );

                            const approximatedPoints =
                                this.readContourPoints(approximated);

                            if (approximatedPoints.length >= 3) {
                                points = approximatedPoints;

                                this.logApproximatedContourDiagnostic(
                                    points,
                                    epsilon,
                                );
                            }
                        } finally {
                            approximated.delete();
                        }
                    }

                    if (seed !== undefined && points.length >= 3) {
                        const beforeCleaning = points;

                        points = this.cleanSeedAwarePolygon(
                            points,
                            seed,
                        );

                        console.log(
                            "[SeedAwarePolygonDiagnostic]",
                            {
                                beforeCleaningCount:
                                    beforeCleaning.length,
                                afterCleaningPoints: points,
                                afterCleaningCount:
                                    points.length,
                                removed:
                                    beforeCleaning.length -
                                    points.length,
                            },
                        );
                    }

                    if (points.length >= 3) {
                        results.push({ points });
                    }
                } finally {
                    contour.delete();
                }
            }

            return results;
        } finally {
            hierarchy.delete();
            contours.delete();
            binaryImage.delete();
        }
    }

    private createBinaryImage(
        image: OpenCvMat,
        seed?: PixelPoint,
    ): OpenCvMat {
        if (seed !== undefined) {
            return this.createSeedGuidedRegionMask(image, seed);
        }

        return this.createAutomaticGreenMask(image);
    }

    private createSeedGuidedRegionMask(
        image: OpenCvMat,
        seed: PixelPoint,
    ): OpenCvMat {
        const width = image.cols;
        const height = image.rows;

        const mask = new this.cv.Mat(
            height,
            width,
            this.cv.CV_8U,
        );

        this.clearMask(mask);

        const seedX = Math.round(seed.x);
        const seedY = Math.round(seed.y);

        if (
            seedX < 0 ||
            seedX >= width ||
            seedY < 0 ||
            seedY >= height
        ) {
            return mask;
        }

        const seedColour = this.readPixel(
            image,
            seedX,
            seedY,
        );

        if (!this.isGreenPixel(seedColour)) {
            return mask;
        }

        const visited = new Uint8Array(
            width * height,
        );

        const accepted = new Uint8Array(
            width * height,
        );

        const queueX: number[] = [];
        const queueY: number[] = [];

        const seedIndex =
            seedY * width + seedX;

        visited[seedIndex] = 1;
        accepted[seedIndex] = 1;

        queueX.push(seedX);
        queueY.push(seedY);

        const neighbourOffsets = [
            [-1, -1],
            [0, -1],
            [1, -1],
            [-1, 0],
            [1, 0],
            [-1, 1],
            [0, 1],
            [1, 1],
        ];

        const localTolerance = 18;

        while (queueX.length > 0) {
            const currentX = queueX.shift()!;
            const currentY = queueY.shift()!;

            for (const [offsetX, offsetY] of neighbourOffsets) {
                const nextX = currentX + offsetX;
                const nextY = currentY + offsetY;

                if (
                    nextX < 0 ||
                    nextX >= width ||
                    nextY < 0 ||
                    nextY >= height
                ) {
                    continue;
                }

                const nextIndex =
                    nextY * width + nextX;

                if (visited[nextIndex] !== 0) {
                    continue;
                }

                visited[nextIndex] = 1;

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

                const localColour =
                    this.getLocalAcceptedColour(
                        image,
                        nextX,
                        nextY,
                        accepted,
                        width,
                        height,
                    );

                if (localColour === undefined) {
                    continue;
                }

                const distance =
                    this.calculateRgbDistance(
                        candidateColour,
                        localColour,
                    );

                if (distance > localTolerance) {
                    continue;
                }

                accepted[nextIndex] = 1;

                queueX.push(nextX);
                queueY.push(nextY);

                this.writeMaskPixel(
                    mask,
                    nextX,
                    nextY,
                    255,
                );
            }
        }

        this.writeMaskPixel(
            mask,
            seedX,
            seedY,
            255,
        );

        return mask;
    }

    private createAutomaticGreenMask(
        image: OpenCvMat,
    ): OpenCvMat {
        const width = image.cols;
        const height = image.rows;

        const mask = new this.cv.Mat(
            height,
            width,
            this.cv.CV_8U,
        );

        this.clearMask(mask);

        for (let y = 0; y < height; y += 1) {
            for (let x = 0; x < width; x += 1) {
                const pixel = this.readPixel(
                    image,
                    x,
                    y,
                );

                if (this.isGreenPixel(pixel)) {
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

    private isGreenPixel(
        pixel: readonly number[],
    ): boolean {
        const red = pixel[0];
        const green = pixel[1];
        const blue = pixel[2];

        return (
            green >= 50 &&
            green - Math.max(red, blue) >= 10
        );
    }

    private getLocalAcceptedColour(
        image: OpenCvMat,
        x: number,
        y: number,
        accepted: Uint8Array,
        width: number,
        height: number,
    ): readonly number[] | undefined {
        let red = 0;
        let green = 0;
        let blue = 0;
        let count = 0;

        for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
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

                const neighbourX = x + offsetX;
                const neighbourY = y + offsetY;

                if (
                    neighbourX < 0 ||
                    neighbourX >= width ||
                    neighbourY < 0 ||
                    neighbourY >= height
                ) {
                    continue;
                }

                const index =
                    neighbourY * width +
                    neighbourX;

                if (accepted[index] === 0) {
                    continue;
                }

                const pixel =
                    this.readPixel(
                        image,
                        neighbourX,
                        neighbourY,
                    );

                red += pixel[0];
                green += pixel[1];
                blue += pixel[2];
                count += 1;
            }
        }

        if (count === 0) {
            return undefined;
        }

        return [
            red / count,
            green / count,
            blue / count,
        ];
    }

    private calculateRgbDistance(
        first: readonly number[],
        second: readonly number[],
    ): number {
        const red =
            first[0] - second[0];

        const green =
            first[1] - second[1];

        const blue =
            first[2] - second[2];

        return Math.sqrt(
            red * red +
            green * green +
            blue * blue,
        );
    }

    private readPixel(
        image: OpenCvMat,
        x: number,
        y: number,
    ): readonly number[] {
        if (image.ucharPtr !== undefined) {
            const pixel =
                image.ucharPtr(y, x);

            return [
                pixel[0],
                pixel[1],
                pixel[2],
            ];
        }

        throw new Error(
            "OpenCV image does not expose ucharPtr().",
        );
    }

    private writeMaskPixel(
        mask: OpenCvMat,
        x: number,
        y: number,
        value: number,
    ): void {
        if (mask.ucharPtr !== undefined) {
            mask.ucharPtr(y, x)[0] =
                value;
            return;
        }

        throw new Error(
            "OpenCV mask does not expose ucharPtr().",
        );
    }

    private clearMask(
        mask: OpenCvMat,
    ): void {
        for (let y = 0; y < mask.rows; y += 1) {
            for (
                let x = 0;
                x < mask.cols;
                x += 1
            ) {
                this.writeMaskPixel(
                    mask,
                    x,
                    y,
                    0,
                );
            }
        }
    }

    private readContourPoints(
        contour: OpenCvMat,
    ): PixelPoint[] {
        if (contour.data32S === undefined) {
            return [];
        }

        const values =
            contour.data32S;

        const points: PixelPoint[] = [];

        for (
            let index = 0;
            index + 1 < values.length;
            index += 2
        ) {
            points.push({
                x: values[index],
                y: values[index + 1],
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
                dx * dx +
                dy * dy,
            );
        }

        return perimeter;
    }

    private cleanSeedAwarePolygon(
        points: PixelPoint[],
        seed: PixelPoint,
    ): PixelPoint[] {
        if (points.length < 5) {
            return points;
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

    private getPointBounds(
        points: readonly PixelPoint[],
    ) {
        if (points.length === 0) {
            return undefined;
        }

        return {
            minX: Math.min(
                ...points.map(
                    (point) => point.x,
                ),
            ),
            maxX: Math.max(
                ...points.map(
                    (point) => point.x,
                ),
            ),
            minY: Math.min(
                ...points.map(
                    (point) => point.y,
                ),
            ),
            maxY: Math.max(
                ...points.map(
                    (point) => point.y,
                ),
            ),
        };
    }

    private logRawContourDiagnostic(
        points: readonly PixelPoint[],
    ): void {
        console.log(
            "[ContourRawDiagnostic]",
            {
                rawPointCount:
                    points.length,
                rawBounds:
                    this.getPointBounds(
                        points,
                    ),
                rawPoints: points,
            },
        );
    }

    private logApproximatedContourDiagnostic(
        points: readonly PixelPoint[],
        epsilon: number,
    ): void {
        console.log(
            "[ContourApproximationDiagnostic]",
            {
                epsilon,
                approximatedPointCount:
                    points.length,
                approximatedBounds:
                    this.getPointBounds(
                        points,
                    ),
                approximatedPoints:
                    points,
            },
        );
    }

    private validateImage(
        image: OpenCvMat,
    ): void {
        if (
            image.rows <= 0 ||
            image.cols <= 0
        ) {
            throw new Error(
                "OpenCV image must have positive dimensions.",
            );
        }
    }
}