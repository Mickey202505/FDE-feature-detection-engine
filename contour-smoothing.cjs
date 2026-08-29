const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
    console.log("Loading OpenCV...");

    const cv =
        await cvModule.loadOpenCV();

    console.log("OpenCV loaded.");

    const maskPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-cleaned.png";

    console.log(
        "Loading mask:",
        maskPath
    );

    const png =
        PNG.sync.read(
            fs.readFileSync(maskPath)
        );

    console.log("Mask:", {
        width: png.width,
        height: png.height
    });

    const mask =
        cv.matFromImageData({
            width: png.width,
            height: png.height,
            data: png.data
        });

    const gray =
        new cv.Mat();

    cv.cvtColor(
        mask,
        gray,
        cv.COLOR_RGBA2GRAY
    );

    const contours =
        new cv.MatVector();

    const hierarchy =
        new cv.Mat();

    cv.findContours(
        gray,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_NONE
    );

    console.log(
        "Contours found:",
        contours.size()
    );

    if (
        contours.size() === 0
    ) {
        console.log(
            "No contours found."
        );

        hierarchy.delete();
        contours.delete();
        gray.delete();
        mask.delete();

        return;
    }

    /*
     * Find largest contour by point count.
     */
    let largestIndex = 0;
    let largestPoints = 0;

    for (
        let i = 0;
        i < contours.size();
        i += 1
    ) {
        const contour =
            contours.get(i);

        try {
            const points =
                contour.data32S
                    ? contour.data32S.length / 2
                    : 0;

            if (
                points > largestPoints
            ) {
                largestPoints =
                    points;

                largestIndex =
                    i;
            }
        } finally {
            contour.delete();
        }
    }

    const contour =
        contours.get(
            largestIndex
        );

    try {
        const raw =
            contour.data32S;

        if (
            raw === undefined
        ) {
            throw new Error(
                "Contour has no data32S."
            );
        }

        const points = [];

        for (
            let i = 0;
            i + 1 < raw.length;
            i += 2
        ) {
            points.push({
                x: raw[i],
                y: raw[i + 1]
            });
        }

        console.log(
            "Largest contour:",
            {
                points:
                    points.length
            }
        );

        /*
         * Test several smoothing windows.
         */
        const windows = [
            1,
            3,
            5,
            7,
            9,
            11
        ];

        const epsilons = [
            2,
            3,
            4,
            5,
            7
        ];

        for (
            const windowSize
                of windows
        ) {
            const smoothed =
                smoothContour(
                    points,
                    windowSize
                );

            /*
             * Create OpenCV contour Mat.
             *
             * CV_32SC2 =
             * two signed 32-bit integers
             * per point.
             */
            const smoothedMat =
                new cv.Mat(
                    smoothed.length,
                    1,
                    cv.CV_32SC2
                );

            try {
                const data =
                    smoothedMat.data32S;

                if (
                    data === undefined
                ) {
                    throw new Error(
                        "Smoothed contour has no data32S."
                    );
                }

                for (
                    let i = 0;
                    i < smoothed.length;
                    i += 1
                ) {
                    const point =
                        smoothed[i];

                    data[i * 2] =
                        Math.round(
                            point.x
                        );

                    data[i * 2 + 1] =
                        Math.round(
                            point.y
                        );
                }

                console.log("");
                console.log(
                    "================================"
                );
                console.log(
                    `SMOOTH WINDOW ${windowSize}`
                );
                console.log(
                    "================================"
                );

                for (
                    const epsilon
                        of epsilons
                ) {
                    const approx =
                        new cv.Mat();

                    try {
                        cv.approxPolyDP(
                            smoothedMat,
                            approx,
                            epsilon,
                            true
                        );

                        const data =
                            approx.data32S;

                        const polygonPoints =
                            data
                                ? data.length / 2
                                : 0;

                        let minX =
                            Infinity;

                        let minY =
                            Infinity;

                        let maxX =
                            -Infinity;

                        let maxY =
                            -Infinity;

                        if (
                            data !==
                            undefined
                        ) {
                            for (
                                let i = 0;
                                i + 1 <
                                data.length;
                                i += 2
                            ) {
                                const x =
                                    data[i];

                                const y =
                                    data[
                                        i + 1
                                    ];

                                minX =
                                    Math.min(
                                        minX,
                                        x
                                    );

                                minY =
                                    Math.min(
                                        minY,
                                        y
                                    );

                                maxX =
                                    Math.max(
                                        maxX,
                                        x
                                    );

                                maxY =
                                    Math.max(
                                        maxY,
                                        y
                                    );
                            }
                        }

                        console.log(
                            `epsilon ${epsilon}:`,
                            {
                                points:
                                    polygonPoints,
                                minX,
                                minY,
                                maxX,
                                maxY,
                                width:
                                    maxX -
                                    minX +
                                    1,
                                height:
                                    maxY -
                                    minY +
                                    1
                            }
                        );
                    } finally {
                        approx.delete();
                    }
                }
            } finally {
                smoothedMat.delete();
            }
        }
    } finally {
        contour.delete();
    }

    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log("");
    console.log(
        "Contour smoothing experiment complete."
    );
}

function smoothContour(
    points,
    windowSize
) {
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

    const result = [];

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

            while (
                index < 0
            ) {
                index +=
                    points.length;
            }

            while (
                index >=
                points.length
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
                    : points[i].x,

            y:
                count > 0
                    ? sumY / count
                    : points[i].y
        });
    }

    return result;
}

main().catch(
    error => {
        console.error(error);
        process.exit(1);
    }
);
