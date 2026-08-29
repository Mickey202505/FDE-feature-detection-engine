const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
    console.log("Loading OpenCV...");
    const cv = await cvModule.loadOpenCV();

    const maskPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-cleaned.png";

    const png = PNG.sync.read(
        fs.readFileSync(maskPath)
    );

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
        return;
    }

    let largestIndex = 0;
    let largestCount = 0;

    for (
        let i = 0;
        i < contours.size();
        i++
    ) {
        const c = contours.get(i);

        try {
            const count =
                c.data32S.length / 2;

            if (count > largestCount) {
                largestCount = count;
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
        i < raw.length;
        i += 2
    ) {
        points.push({
            x: raw[i],
            y: raw[i + 1]
        });
    }

    console.log(
        "Contour points:",
        points.length
    );

    function getPoint(i) {
        const n = points.length;

        return points[
            ((i % n) + n) % n
        ];
    }

    function distance(a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        return Math.sqrt(
            dx * dx + dy * dy
        );
    }

    function lineDistance(p, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        const lengthSquared =
            dx * dx + dy * dy;

        if (lengthSquared === 0) {
            return distance(p, a);
        }

        const t =
            (
                (p.x - a.x) * dx +
                (p.y - a.y) * dy
            ) / lengthSquared;

        const projection = {
            x: a.x + t * dx,
            y: a.y + t * dy
        };

        return distance(
            p,
            projection
        );
    }

    /*
     * Starting from one contour point,
     * extend a local line forward.
     *
     * We test the whole section rather
     * than individual pixel angles.
     */
    function trace(
        tolerance,
        minimumPoints,
        failureLimit
    ) {
        const vertices = [];

        let start = 0;
        let safety = 0;

        while (
            start < points.length &&
            safety < points.length
        ) {
            safety++;

            const startPoint =
                getPoint(start);

            let best = start + minimumPoints;
            let failures = 0;

            for (
                let i =
                    start + minimumPoints;
                i <
                    start +
                    points.length -
                    1;
                i++
            ) {
                const end =
                    getPoint(i);

                let maxError = 0;

                /*
                 * Check several points behind
                 * the proposed end point.
                 */
                const checkStart =
                    Math.max(
                        start + 1,
                        i - 10
                    );

                for (
                    let j = checkStart;
                    j <= i;
                    j++
                ) {
                    const p =
                        getPoint(j);

                    const error =
                        lineDistance(
                            p,
                            startPoint,
                            end
                        );

                    maxError =
                        Math.max(
                            maxError,
                            error
                        );
                }

                if (
                    maxError <= tolerance
                ) {
                    best = i;
                    failures = 0;
                } else {
                    failures++;

                    if (
                        failures >=
                        failureLimit
                    ) {
                        break;
                    }
                }
            }

            if (
                best <= start
            ) {
                break;
            }

            const vertex =
                getPoint(best);

            vertices.push({
                x: vertex.x,
                y: vertex.y,
                index: best
            });

            start = best;

            /*
             * Avoid runaway output.
             */
            if (
                vertices.length >= 100
            ) {
                break;
            }
        }

        return vertices;
    }

    const tests = [
        [3, 10, 3],
        [4, 10, 3],
        [5, 10, 3],
        [6, 10, 3],
        [5, 15, 3],
        [6, 15, 3],
        [7, 15, 3]
    ];

    for (const test of tests) {
        const [
            tolerance,
            minimumPoints,
            failureLimit
        ] = test;

        const vertices =
            trace(
                tolerance,
                minimumPoints,
                failureLimit
            );

        const lengths = [];

        for (
            let i = 1;
            i < vertices.length;
            i++
        ) {
            lengths.push(
                distance(
                    vertices[i - 1],
                    vertices[i]
                )
            );
        }

        const shortest =
            lengths.length
                ? Math.min(...lengths)
                : 0;

        const longest =
            lengths.length
                ? Math.max(...lengths)
                : 0;

        const average =
            lengths.length
                ? lengths.reduce(
                    (a, b) => a + b,
                    0
                ) / lengths.length
                : 0;

        console.log(
            `tolerance=${tolerance}px`,
            `minimum=${minimumPoints}`,
            `failures=${failureLimit}`,
            "=>",
            `vertices=${vertices.length}`,
            `shortest=${shortest.toFixed(1)}px`,
            `longest=${longest.toFixed(1)}px`,
            `average=${average.toFixed(1)}px`
        );
    }

    contour.delete();
    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log(
        "Local line experiment complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
