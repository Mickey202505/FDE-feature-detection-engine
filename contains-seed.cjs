const fs = require("node:fs");
const { PNG } = require("pngjs");
const cvModule = require("@opencvjs/node");

async function main() {
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
        cv.CHAIN_APPROX_SIMPLE
    );

    console.log("Contours:", contours.size());

    const seedX = 230;
    const seedY = 288;

    for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);

        try {
            const data = contour.data32S;

            const points = [];

            for (
                let j = 0;
                j + 1 < data.length;
                j += 2
            ) {
                points.push({
                    x: data[j],
                    y: data[j + 1]
                });
            }

            let inside = false;

            for (
                let j = 0, k = points.length - 1;
                j < points.length;
                k = j++
            ) {
                const current = points[j];
                const previous = points[k];

                const intersects =
                    current.y > seedY !==
                        previous.y > seedY &&
                    seedX <
                        ((previous.x - current.x) *
                            (seedY - current.y)) /
                            (previous.y - current.y) +
                            current.x;

                if (intersects) {
                    inside = !inside;
                }
            }

            console.log(
                `Contour ${i}:`,
                {
                    points: points.length,
                    containsSeed: inside
                }
            );
        } finally {
            contour.delete();
        }
    }

    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();
}

main().catch(console.error);
