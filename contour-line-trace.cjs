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
        "Contours found:",
        contours.size()
    );

    if (contours.size() === 0) {
        console.log("No contours found.");
        return;
    }

    // Find the largest contour by number of points.
    let largestIndex = 0;
    let largestPoints = 0;

    for (
        let i = 0;
        i < contours.size();
        i++
    ) {
        const contour = contours.get(i);

        try {
            const points =
                contour.data32S
                    ? contour.data32S.length / 2
                    : 0;

            if (points > largestPoints) {
                largestPoints = points;
                largestIndex = i;
            }
        } finally {
            contour.delete();
        }
    }

    const contour =
        contours.get(largestIndex);

    const data = contour.data32S;

    const points = [];

    for (
        let i = 0;
        i + 1 < data.length;
        i += 2
    ) {
        points.push({
            x: data[i],
            y: data[i + 1]
        });
    }

    console.log(
        "Largest contour:",
        points.length,
        "points"
    );

    /*
     * Calculate the perpendicular distance from a point
     * to the line between A and B.
     */
    function distanceToLine(
        point,
        a,
        b
    ) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        const lengthSquared =
            dx * dx + dy * dy;

        if (lengthSquared === 0) {
            const px = point.x - a.x;
            const py = point.y - a.y;

            return Math.sqrt(
                px * px + py * py
            );
        }

        const cross =
            Math.abs(
                dx * (a.y - point.y) -
                dy * (a.x - point.x)
            );

        return (
            cross /
            Math.sqrt(lengthSquared)
        );
    }

    /*
     * Trace the contour and create a new vertex
     * whenever the current straight line can no
     * longer describe the contour within tolerance.
     */
    function traceContour(
        contourPoints,
        tolerance
    ) {
        const n = contourPoints.length;

        if (n < 3) {
            return contourPoints;
        }

        const vertices = [];

        let startIndex = 0;
        let currentIndex = 1;

        while (
            currentIndex < n
        ) {
            const start =
                contourPoints[startIndex];

            let bestIndex =
                currentIndex;

            let exceeded = false;

            /*
             * Extend the current line for as long
             * as all contour points remain within
             * the allowed deviation.
             */
            for (
                let testIndex =
                    currentIndex + 1;
                testIndex < n;
                testIndex++
            ) {
                const testPoint =
                    contourPoints[testIndex];

                const distance =
                    distanceToLine(
                        testPoint,
                        start,
                        contourPoints[testIndex]
                    );

                /*
                 * The line above degenerates because
                 * the endpoint is the test point.
                 *
                 * Instead, test against the line from
                 * start to a point further ahead.
                 */
                if (
                    testIndex >=
                    startIndex + 3
                ) {
                    const lookAhead =
                        contourPoints[
                            Math.min(
                                testIndex,
                                n - 1
                            )
                        ];

                    let maxDistance = 0;

                    for (
                        let checkIndex =
                            startIndex + 1;
                        checkIndex <= testIndex;
                        checkIndex++
                    ) {
                        const checkPoint =
                            contourPoints[
                                checkIndex
                            ];

                        const d =
                            distanceToLine(
                                checkPoint,
                                start,
                                lookAhead
                            );

                        maxDistance =
                            Math.max(
                                maxDistance,
                                d
                            );
                    }

                    if (
                        maxDistance >
                        tolerance
                    ) {
                        exceeded = true;
                        break;
                    }
                }

                bestIndex = testIndex;
            }

            /*
             * If the line has reached a bend,
             * put the vertex just before the bend.
             */
            if (exceeded) {
                const vertexIndex =
                    Math.max(
                        startIndex + 1,
                        bestIndex - 1
                    );

                vertices.push(
                    contourPoints[
                        vertexIndex
                    ]
                );

                startIndex =
                    vertexIndex;

                currentIndex =
                    startIndex + 1;
            } else {
                break;
            }
        }

        /*
         * Make sure the final contour point
         * becomes a vertex.
         */
        if (
            vertices.length === 0 ||
            vertices[
                vertices.length - 1
            ].x !== contourPoints[n - 1].x ||
            vertices[
                vertices.length - 1
            ].y !== contourPoints[n - 1].y
        ) {
            vertices.push(
                contourPoints[n - 1]
            );
        }

        return vertices;
    }

    /*
     * Run several tolerances so we can see
     * how aggressively the contour is simplified.
     */
    for (
        const tolerance of [
            2,
            3,
            4,
            5,
            7,
            10
        ]
    ) {
        console.log("");
        console.log(
            "================================"
        );
        console.log(
            `LINE TRACE TOLERANCE ${tolerance}px`
        );
        console.log(
            "================================"
        );

        const vertices =
            traceContour(
                points,
                tolerance
            );

        console.log(
            "Vertices:",
            vertices.length
        );

        for (
            let i = 0;
            i < vertices.length;
            i++
        ) {
            const p = vertices[i];

            console.log(
                `  ${i}: (${p.x}, ${p.y})`
            );
        }
    }

    contour.delete();
    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log("");
    console.log(
        "Contour line trace experiment complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});