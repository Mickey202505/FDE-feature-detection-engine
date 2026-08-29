const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
    const cv = await cvModule.loadOpenCV();

    const path =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-cleaned.png";

    const input = PNG.sync.read(
        fs.readFileSync(path)
    );

    const mask = cv.matFromImageData({
        width: input.width,
        height: input.height,
        data: input.data
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

    let largest = 0;
    let largestCount = 0;

    for (
        let i = 0;
        i < contours.size();
        i++
    ) {
        const c = contours.get(i);

        const count =
            c.data32S.length / 2;

        if (count > largestCount) {
            largestCount = count;
            largest = i;
        }

        c.delete();
    }

    const contour =
        contours.get(largest);

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

    function get(i) {
        const n = points.length;

        return points[
            ((i % n) + n) % n
        ];
    }

    function distance(a, b) {
        return Math.hypot(
            b.x - a.x,
            b.y - a.y
        );
    }

    function lineDistance(p, a, b) {
        const dx = b.x - a.x;
        const dy = b.y - a.y;

        const d =
            dx * dx +
            dy * dy;

        if (!d) {
            return distance(p, a);
        }

        const t =
            (
                (p.x - a.x) * dx +
                (p.y - a.y) * dy
            ) / d;

        return Math.hypot(
            p.x - (a.x + t * dx),
            p.y - (a.y + t * dy)
        );
    }

    function trace(tolerance) {
        const result = [];
        let start = 0;

        while (
            start < points.length &&
            result.length < 100
        ) {
            const a = get(start);

            let best =
                start + 15;

            let failures = 0;

            for (
                let i = start + 15;
                i < start + points.length - 1;
                i++
            ) {
                const b = get(i);

                let error = 0;

                for (
                    let j = Math.max(
                        start + 1,
                        i - 10
                    );
                    j <= i;
                    j++
                ) {
                    error = Math.max(
                        error,
                        lineDistance(
                            get(j),
                            a,
                            b
                        )
                    );
                }

                if (error <= tolerance) {
                    best = i;
                    failures = 0;
                } else {
                    failures++;

                    if (failures >= 3) {
                        break;
                    }
                }
            }

            if (best <= start) {
                break;
            }

            result.push(get(best));
            start = best;
        }

        return result;
    }

    const output = new PNG({
        width: input.width,
        height: input.height
    });

    /*
     * White background.
     */
    for (
        let i = 0;
        i < output.data.length;
        i += 4
    ) {
        output.data[i] = 255;
        output.data[i + 1] = 255;
        output.data[i + 2] = 255;
        output.data[i + 3] = 255;
    }

    /*
     * Draw original contour in black.
     */
    for (
        let i = 0;
        i < points.length;
        i++
    ) {
        const a = get(i);
        const b = get(i + 1);

        drawLine(
            output,
            a.x,
            a.y,
            b.x,
            b.y,
            0,
            0,
            0
        );
    }

    /*
     * Draw the local-line trace.
     */
    const vertices = trace(5);

    for (
        let i = 0;
        i < vertices.length;
        i++
    ) {
        const a = vertices[i];
        const b =
            vertices[
                (i + 1) %
                vertices.length
            ];

        drawLine(
            output,
            a.x,
            a.y,
            b.x,
            b.y,
            255,
            0,
            0
        );

        drawPoint(
            output,
            a.x,
            a.y,
            0,
            0,
            255
        );
    }

    const outputPath =
        "contour-local-lines-preview.png";

    fs.writeFileSync(
        outputPath,
        PNG.sync.write(output)
    );

    console.log(
        `Original contour: ${points.length} points`
    );

    console.log(
        `Local trace: ${vertices.length} vertices`
    );

    console.log(
        `Created: ${outputPath}`
    );

    contour.delete();
    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();
}

function drawPixel(
    png,
    x,
    y,
    r,
    g,
    b
) {
    if (
        x < 0 ||
        y < 0 ||
        x >= png.width ||
        y >= png.height
    ) {
        return;
    }

    const i =
        (y * png.width + x) * 4;

    png.data[i] = r;
    png.data[i + 1] = g;
    png.data[i + 2] = b;
    png.data[i + 3] = 255;
}

function drawLine(
    png,
    x0,
    y0,
    x1,
    y1,
    r,
    g,
    b
) {
    const dx =
        Math.abs(x1 - x0);

    const dy =
        Math.abs(y1 - y0);

    const sx =
        x0 < x1 ? 1 : -1;

    const sy =
        y0 < y1 ? 1 : -1;

    let err = dx - dy;

    while (true) {
        drawPixel(
            png,
            x0,
            y0,
            r,
            g,
            b
        );

        if (
            x0 === x1 &&
            y0 === y1
        ) {
            break;
        }

        const e2 = 2 * err;

        if (e2 > -dy) {
            err -= dy;
            x0 += sx;
        }

        if (e2 < dx) {
            err += dx;
            y0 += sy;
        }
    }
}

function drawPoint(
    png,
    x,
    y,
    r,
    g,
    b
) {
    for (
        let yy = -3;
        yy <= 3;
        yy++
    ) {
        for (
            let xx = -3;
            xx <= 3;
            xx++
        ) {
            drawPixel(
                png,
                x + xx,
                y + yy,
                r,
                g,
                b
            );
        }
    }
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
