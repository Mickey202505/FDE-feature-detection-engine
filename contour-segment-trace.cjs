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

    let largestIndex = 0;
    let largestPoints = 0;

    for (
        let i = 0;
        i < contours.size();
        i++
    ) {
        const c = contours.get(i);

        try {
            const count =
                c.data32S.length / 2;

            if (count > largestPoints) {
                largestPoints = count;
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
        points.length,
        "points"
    );

    function getPoint(index) {
        const count = points.length;

        return points[
            ((index % count) + count) %
                count
        ];
    }

    function distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        return Math.sqrt(
            dx * dx + dy * dy
        );
    }

    function lineDistance(point, start, end) {
        const dx = end.x - start.x;
        const dy = end.y - start.y;

        const lengthSquared =
            dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return distance(point, start);
        }

        const t =
            (
                (point.x - start.x) * dx +
                (point.y - start.y) * dy
            ) / lengthSquared;

        const projection = {
            x: start.x + t * dx,
            y: start.y + t * dy
        };

        return distance(
            point,
            projection
        );
    }

    /*
     * Find the first point after startIndex
     * where the contour has moved away from
     * the current straight line.
     *
     * We require several consecutive points
     * to exceed the tolerance. This is the
     * important part: one noisy pixel cannot
     * create a new vertex.
     */
    function traceSegments(
        tolerance,
        minimumSegmentLength,
        consecutiveFailures
    ) {
        const vertices = [];

        let startIndex = 0;

        const total = points.length;

        let safety = 0;

        while (
            startIndex < total &&
            safety < total
        ) {
            safety++;

            const start =
                getPoint(startIndex);

            let candidateIndex =
                startIndex +
                minimumSegmentLength;

            if (
                candidateIndex >=
                startIndex + total
            ) {
                break;
            }

            let failures = 0;
            let bestIndex = candidateIndex;

            for (
                let i =
                    candidateIndex;
                i <
                    startIndex +
                    total -
                    1;
                i++
            ) {
                const end =
                    getPoint(i);

                const lookAhead =
                    getPoint(i + 1);

                const error =
                    lineDistance(
                        lookAhead,
                        start,
                        end
                    );

                if (
                    error <= tolerance
                ) {
                    failures = 0;
                    bestIndex = i + 1;
                } else {
                    failures++;

                    if (
                        failures >=
                        consecutiveFailures
                    ) {
                        break;
                    }
                }
            }

            if (
                bestIndex <= startIndex
            ) {
                break;
            }

            const vertex =
                getPoint(bestIndex);

            vertices.push({
                x: vertex.x,
                y: vertex.y,
                index: bestIndex
            });

            startIndex = bestIndex;

            if (
                startIndex >= total
            ) {
                break;
            }

            if (
                vertices.length > 200
            ) {
                break;
            }
        }

        return vertices;
    }

    /*
     * Test several combinations.
     *
     * tolerance:
     *   How far the edge may move from
     *   the current straight line.
     *
     * minimumSegmentLength:
     *   Prevents tiny segments.
     *
     * consecutiveFailures:
     *   Requires the deviation to persist
     *   before creating a new vertex.
     */
    const tests = [
        {
            tolerance: 3,
            minimumSegmentLength: 15,
            consecutiveFailures: 5
        },
        {
            tolerance: 4,
            minimumSegmentLength: 15,
            consecutiveFailures: 5
        },
        {
            tolerance: 5,
            minimumSegmentLength: 15,
            consecutiveFailures: 5
        },
        {
            tolerance: 6,
            minimumSegmentLength: 15,
            consecutiveFailures: 5
        },
        {
            tolerance: 5,
            minimumSegmentLength: 20,
            consecutiveFailures: 7
        },
        {
            tolerance: 6,
            minimumSegmentLength: 20,
            consecutiveFailures: 7
        }
    ];

    for (const test of tests) {
        console.log("");
        console.log(
            "================================"
        );

        console.log(
            `TOLERANCE ${test.tolerance}px`
        );

        console.log(
            `MIN SEGMENT ${test.minimumSegmentLength}px`
        );

        console.log(
            `CONSECUTIVE FAILURES ${test.consecutiveFailures}`
        );

        console.log(
            "================================"
        );

        const vertices =
            traceSegments(
                test.tolerance,
                test.minimumSegmentLength,
                test.consecutiveFailures
            );

        console.log(
            "Vertices:",
            vertices.length
        );

        /*
         * Only print coordinates for the most
         * promising settings so the output
         * remains manageable.
         */
        if (
            test.tolerance === 5 &&
            test.minimumSegmentLength === 20
        ) {
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
    }

    contour.delete();
    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log("");
    console.log(
        "Contour segment trace experiment complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
