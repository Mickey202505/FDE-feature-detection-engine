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

        let maskPixels = 0;

        if (
            binaryImage.ucharPtr !==
            undefined
        ) {
            for (
                let y = 0;
                y < binaryImage.rows;
                y += 1
            ) {
                for (
                    let x = 0;
                    x < binaryImage.cols;
                    x += 1
                ) {
                    const pixel =
                        binaryImage.ucharPtr(
                            y,
                            x
                        );

                    if (
                        (pixel[0] ?? 0) > 0
                    ) {
                        maskPixels += 1;
                    }
                }
            }
        }

        console.log(
            "OpenCvJsAdapter mask:",
            {
                rows: binaryImage.rows,
                cols: binaryImage.cols,
                pixels: maskPixels
            }
        );

        this.cv.findContours(
            binaryImage,
            contours,
            hierarchy,
            this.cv.RETR_EXTERNAL,
            this.cv.CHAIN_APPROX_NONE
        );

        const result: OpenCvContour[] = [];

        for (
            let i = 0;
            i < contours.size();
            i += 1
        ) {
            const contour =
                contours.get(i);

            try {
                /*
                 * First read the raw contour.
                 */
                const rawPoints =
                    this.readPoints(
                        contour
                    );

                if (
                    rawPoints.length < 3
                ) {
                    continue;
                }

                /*
                 * Smooth the contour using a moving-average
                 * window before polygon approximation.
                 *
                 * This removes the small 1–3 pixel zig-zags
                 * produced by the raster mask while keeping
                 * the overall green boundary.
                 */
                const smoothedPoints =
                    this.smoothContour(
                        rawPoints,
                        5
                    );

                /*
                 * Convert the smoothed points back into an
                 * OpenCV Mat so approxPolyDP can operate on it.
                 */
                const smoothed =
                    new this.cv.Mat(
                        smoothedPoints.length,
                        1,
                        this.cv.CV_32SC2
                    );

                const approx =
                    new this.cv.Mat();

                try {
                    if (
                        smoothed.ucharPtr !==
                        undefined
                    ) {
                        /*
                         * CV_32SC2 is represented as two
                         * 32-bit signed integers per point.
                         *
                         * Some OpenCV.js builds expose
                         * data32S directly, so use that when
                         * available.
                         */
                    }

                    const data =
                        smoothed.data32S;

                    if (
                        data !== undefined
                    ) {
                        for (
                            let p = 0;
                            p < smoothedPoints.length;
                            p += 1
                        ) {
                            const point =
                                smoothedPoints[p];

                            if (
                                point === undefined
                            ) {
                                continue;
                            }

                            data[p * 2] =
                                Math.round(
                                    point.x
                                );

                            data[p * 2 + 1] =
                                Math.round(
                                    point.y
                                );
                        }
                    }

                    this.cv.approxPolyDP(
                        smoothed,
                        approx,
                        3.0,
                        true
                    );

                    result.push({
                        points:
                            this.readPoints(
                                approx
                            )
                    });
                } finally {
                    approx.delete();
                    smoothed.delete();
                }
            } finally {
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
```

Then add this method **inside the class**, before `createBinaryImage()`:

```typescript
private smoothContour(
    points: readonly {
        x: number;
        y: number;
    }[],
    windowSize: number
): readonly {
    x: number;
    y: number;
}[] {
    if (
        points.length < 3 ||
        windowSize <= 1
    ) {
        return points;
    }

    const half =
        Math.floor(
            windowSize / 2
        );

    const result: {
        x: number;
        y: number;
    }[] = [];

    for (
        let i = 0;
        i < points.length;
        i += 1
    ) {
        let sumX = 0;
        let sumY = 0;
        let count = 0;

        for (
            let offset = -half;
            offset <= half;
            offset += 1
        ) {
            let index =
                i + offset;

            /*
             * Wrap around because a contour is closed.
             */
            while (
                index < 0
            ) {
                index +=
                    points.length;
            }

            while (
                index >= points.length
            ) {
                index -=
                    points.length;
            }

            const point =
                points[index];

            if (
                point === undefined
            ) {
                continue;
            }

            sumX += point.x;
            sumY += point.y;
            count += 1;
        }

        result.push({
            x:
                count > 0
                    ? sumX / count
                    : points[i]?.x ?? 0,
            y:
                count > 0
                    ? sumY / count
                    : points[i]?.y ?? 0
        });
    }

    return result;
}