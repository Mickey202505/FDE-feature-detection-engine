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
        cv.CHAIN_APPROX_SIMPLE
    );

    console.log(
        "Contours:",
        contours.size()
    );

    for (const epsilon of [3, 4, 5, 7]) {
        let largestIndex = 0;
        let largestPoints = 0;

        for (
            let i = 0;
            i < contours.size();
            i++
        ) {
            const c = contours.get(i);

            try {
                const points =
                    c.data32S
                        ? c.data32S.length / 2
                        : 0;

                if (points > largestPoints) {
                    largestPoints = points;
                    largestIndex = i;
                }
            } finally {
                c.delete();
            }
        }

        const contour =
            contours.get(largestIndex);

        const approx =
            new cv.Mat();

        try {
            cv.approxPolyDP(
                contour,
                approx,
                epsilon,
                true
            );

            const data =
                approx.data32S;

            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            for (
                let i = 0;
                i + 1 < data.length;
                i += 2
            ) {
                const x = data[i];
                const y = data[i + 1];

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }

            console.log(
                `epsilon ${epsilon}:`,
                {
                    points: data.length / 2,
                    minX,
                    minY,
                    maxX,
                    maxY,
                    width:
                        maxX - minX + 1,
                    height:
                        maxY - minY + 1
                }
            );
        } finally {
            approx.delete();
            contour.delete();
        }
    }

    hierarchy.delete();
    contours.delete();
    gray.delete();
    mask.delete();

    console.log(
        "Contour bounds experiment complete."
    );
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
