const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
    console.log("Loading OpenCV...");
    const cv = await cvModule.loadOpenCV();
    console.log("OpenCV loaded.");

    const maskPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-cleaned.png";

    console.log("Loading mask:", maskPath);

    const png = PNG.sync.read(
        fs.readFileSync(maskPath)
    );

    console.log("Mask:", {
        width: png.width,
        height: png.height
    });

    const mask = cv.matFromImageData({
        width: png.width,
        height: png.height,
        data: png.data
    });

    const gray = new cv.Mat();

    cv.cvtColor(
        mask,
        gray,
        cv.COLOR_RGBA2GRAY
    );

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();

    cv.findContours(
        gray,
        contours,
        hierarchy,
        cv.RETR_EXTERNAL,
        cv.CHAIN_APPROX_NONE
    );

    console.log(
        "Contours:",
        contours.size()
    );

    if (contours.size() === 0) {
        console.log("No contours found.");
        return;
    }

    let largestIndex = 0;
    let largestArea = 0;

    for (
        let i = 0;
        i < contours.size();
        i += 1
    ) {
        const c = contours.get(i);

        try {
            const area = cv.contourArea(c);

            if (area > largestArea) {
                largestArea = area;
                largestIndex = i;
            }
        } finally {
            c.delete();
        }
    }

    const contour =
        contours.get(largestIndex);

    const raw = contour.data32S;

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
            points: points.length,
            area: largestArea
        }
    );

    function distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        return Math.sqrt(
            dx * dx + dy * dy
        );
    }

    function polygonArea(input) {
        let total = 0;

        for (
            let i = 0;
            i < input.length;
            i += 1
        ) {
            const a = input[i];

            const b =
                input[
                    (i + 1) %
                    input.length
                ];

            total +=
                a.x * b.y -
                b.x * a.y;
        }

        return Math.abs(
            total / 2
        );
    }

    function getBounds(input) {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;

        for (
            const point of input
        ) {
            minX =
                Math.min(
                    minX,
                    point.x
                );

            minY =
                Math.min(
                    minY,
                    point.y
                );

            maxX =
                Math.max(
                    maxX,
                    point.x
                );

            maxY =
                Math.max(
                    maxY,
                    point.y
                );
        }

        return {
            minX,
            minY,
            maxX,
            maxY,
            width:
                maxX - minX + 1,
            height:
                maxY - minY + 1
        };
    }

    function resample(
        input,
        targetCount
    ) {
        const distances = [0];

        let totalDistance = 0;

        for (
            let i = 0;
            i < input.length;
            i += 1
        ) {
            const a = input[i];

            const b =
                input[
                    (i + 1) %
                    input.length
                ];

            totalDistance +=
                distance(a, b);

            distances.push(
                totalDistance
            );
        }

        const result = [];

        const step =
            totalDistance /
            targetCount;

        let segment = 0;

        for (
            let i = 0;
            i < targetCount;
            i += 1
        ) {
            const target =
                i * step;

            while (
                segment <
                    input.length - 1 &&
                distances[segment + 1] <
                    target
            ) {
                segment += 1;
            }

            const a =
                input[segment];

            const b =
                input[
                    (segment + 1) %
                    input.length
                ];

            const start =
                distances[segment];

            const end =
                distances[segment + 1];

            const length =
                end - start;

            let ratio = 0;

            if (length > 0) {
                ratio =
                    (target - start) /
                    length;
            }

            result.push({
                x:
                    a.x +
                    (b.x - a.x) *
                    ratio,

                y:
                    a.y +
                    (b.y - a.y) *
                    ratio
            });
        }

        return result;
    }

    function smooth(
        input,
        windowSize
    ) {
        const result = [];
        const half =
            Math.floor(
                windowSize / 2
            );

        for (
            let i = 0;
            i < input.length;
            i += 1
        ) {
            let sumX = 0;
            let sumY = 0;
            let count = 0;

            for (
                let j = -half;
                j <= half;
                j += 1
            ) {
                const index =
                    (
                        i +
                        j +
                        input.length
                    ) %
                    input.length;

                const point =
                    input[index];

                sumX += point.x;
                sumY += point.y;
                count += 1;
            }

            result.push({
                x: sumX / count,
                y: sumY / count
            });
        }

        return result;
    }

    function roundPoints(input) {
        return input.map(
            (point) => ({
                x: Math.round(
                    point.x
                ),
                y: Math.round(
                    point.y
                )
            })
        );
    }

    console.log("");
    console.log(
        "================================"
    );
    console.log(
        "EVEN RESAMPLING"
    );
    console.log(
        "================================"
    );

    for (
        const windowSize of [1, 3, 5, 7]
    ) {
        console.log("");
        console.log(
            "SMOOTH WINDOW:",
            windowSize
        );

        const smoothed =
            windowSize === 1
                ? points
                : smooth(
                    points,
                    windowSize
                );

        for (
            const target of [
                40,
                60,
                80,
                100
            ]
        ) {
            const rebuilt =
                resample(
                    smoothed,
                    target
                );

            const rounded =
                roundPoints(
                    rebuilt
                );

            console.log({
                target,
                points:
                    rounded.length,
                area:
                    Number(
                        polygonArea(
                            rounded
                        ).toFixed(1)
                    ),
                differencePercent:
                    Number(
                        (
                            (
                                polygonArea(
                                    rounded
                                ) -
                                largestArea
                            ) /
                            largestArea *
                            100
                        ).toFixed(3)
                    ),
                bounds:
                    getBounds(
                        rounded
                    )
            });
        }
    }

    console.log("");
    console.log(
        "================================"
    );
    console.log(
        "CURRENT APPROXIMATION"
    );
    console.log(
        "================================"
    );

    const approx =
        new cv.Mat();

    try {
        cv.approxPolyDP(
            contour,
            approx,
            3.0,
            true
        );

        const approxRaw =
            approx.data32S;

        const approxPoints = [];

        for (
            let i = 0;
            i + 1 <
                approxRaw.length;
            i += 2
        ) {
            approxPoints.push({
                x:
                    approxRaw[i],
                y:
                    approxRaw[i + 1]
            });
        }

        console.log({
            points:
                approxPoints.length,
            area:
                Number(
                    polygonArea(
                        approxPoints
                    ).toFixed(1)
                ),
            differencePercent:
                Number(
                    (
                        (
                            polygonArea(
                                approxPoints
                            ) -
                            largestArea
                        ) /
                        largestArea *
                        100
                    ).toFixed(3)
                ),
            bounds:
                getBounds(
                    approxPoints
                )
        });
    } finally {
        approx.delete();
    }

    console.log("");
    console.log(
        "Contour rebuild experiment complete."
    );

    contour.delete();
    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();
}

main().catch(
    (error) => {
        console.error(error);
        process.exit(1);
    }
);
