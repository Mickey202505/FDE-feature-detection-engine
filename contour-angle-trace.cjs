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

    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);

        try {
            const points = contour.data32S.length / 2;

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

    /*
     * We examine the direction of the contour
     * before and after each candidate point.
     *
     * Small angle changes = smooth edge.
     * Large angle changes = meaningful bend.
     */

    function distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        return Math.sqrt(
            dx * dx + dy * dy
        );
    }

    function direction(a, b) {
        return Math.atan2(
            b.y - a.y,
            b.x - a.x
        );
    }

    function angleDifference(a, b) {
        let difference = Math.abs(a - b);

        while (difference > Math.PI) {
            difference =
                Math.abs(
                    difference -
                    Math.PI * 2
                );
        }

        return difference;
    }

    /*
     * Test several angle thresholds.
     *
     * Lower = more points.
     * Higher = smoother / fewer points.
     */
    const angleThresholds = [
        10,
        15,
        20,
        25,
        30,
        40
    ];

    /*
     * Number of pixels to look backwards
     * and forwards when calculating direction.
     */
    const lookDistances = [
        5,
        10,
        15
    ];

    function getPoint(index) {
        const count = points.length;

        let i =
            ((index % count) + count) %
            count;

        return points[i];
    }

    function buildTrace(
        lookDistance,
        angleThresholdDegrees
    ) {
        const result = [];

        const threshold =
            angleThresholdDegrees *
            Math.PI /
            180;

        for (
            let i = 0;
            i < points.length;
            i++
        ) {
            const previous =
                getPoint(
                    i - lookDistance
                );

            const current =
                getPoint(i);

            const next =
                getPoint(
                    i + lookDistance
                );

            const incoming =
                direction(
                    previous,
                    current
                );

            const outgoing =
                direction(
                    current,
                    next
                );

            const change =
                angleDifference(
                    incoming,
                    outgoing
                );

            if (change >= threshold) {
                result.push({
                    x: current.x,
                    y: current.y,
                    angle:
                        change *
                        180 /
                        Math.PI
                });
            }
        }

        return result;
    }

    for (
        const lookDistance of lookDistances
    ) {
        console.log("");
        console.log(
            "================================"
        );
        console.log(
            `LOOK DISTANCE ${lookDistance}px`
        );
        console.log(
            "================================"
        );

        for (
            const threshold of angleThresholds
        ) {
            const traced =
                buildTrace(
                    lookDistance,
                    threshold
                );

            console.log(
                `angle ${threshold}°:`,
                {
                    points:
                        traced.length
                }
            );

            /*
             * Print the points for the most
             * useful middle thresholds.
             */
            if (
                threshold === 20 ||
                threshold === 30
            ) {
                for (
                    let i = 0;
                    i < traced.length;
                    i++
                ) {
                    const p =
                        traced[i];

                    console.log(
                        `  ${i}: (${p.x}, ${p.y}) angle=${p.angle.toFixed(1)}°`
                    );
                }
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
        "Contour angle trace experiment complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
