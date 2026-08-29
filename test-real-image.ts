import fs from "node:fs";
import { PNG } from "pngjs";

const imagePath =
    "C:\\Users\\Mickey\\Downloads\\hole 2.png";

const seedX = 230;
const seedY = 288;

interface Rgb {
    r: number;
    g: number;
    b: number;
}

function getRgb(
    png: PNG,
    x: number,
    y: number
): Rgb {
    const index =
        (y * png.width + x) * 4;

    return {
        r: png.data[index] ?? 0,
        g: png.data[index + 1] ?? 0,
        b: png.data[index + 2] ?? 0
    };
}

function colourDistance(
    a: Rgb,
    b: Rgb
): number {
    const dr = a.r - b.r;
    const dg = a.g - b.g;
    const db = a.b - b.b;

    return Math.sqrt(
        dr * dr +
        dg * dg +
        db * db
    );
}

function createRgbMask(
    png: PNG,
    threshold: number
): Uint8Array {
    const seed =
        getRgb(
            png,
            seedX,
            seedY
        );

    const mask =
        new Uint8Array(
            png.width * png.height
        );

    for (
        let y = 0;
        y < png.height;
        y += 1
    ) {
        for (
            let x = 0;
            x < png.width;
            x += 1
        ) {
            const pixel =
                getRgb(
                    png,
                    x,
                    y
                );

            const distance =
                colourDistance(
                    pixel,
                    seed
                );

            const greenDominance =
                pixel.g -
                Math.max(
                    pixel.r,
                    pixel.b
                );

            if (
                distance <= threshold &&
                pixel.g >= 50 &&
                greenDominance >= 5
            ) {
                mask[
                    y * png.width + x
                ] = 1;
            }
        }
    }

    return mask;
}

function connectedFromSeed(
    png: PNG,
    mask: Uint8Array
): Uint8Array {
    const result =
        new Uint8Array(
            png.width * png.height
        );

    const queue: number[] = [];

    const seedIndex =
        seedY * png.width +
        seedX;

    if (
        mask[seedIndex] !== 1
    ) {
        return result;
    }

    result[seedIndex] = 1;
    queue.push(seedIndex);

    let queueIndex = 0;

    const directions = [
        { x: 1, y: 0 },
        { x: -1, y: 0 },
        { x: 0, y: 1 },
        { x: 0, y: -1 }
    ];

    while (
        queueIndex <
        queue.length
    ) {
        const currentIndex =
            queue[queueIndex++];

        if (
            currentIndex === undefined
        ) {
            continue;
        }

        const x =
            currentIndex %
            png.width;

        const y =
            Math.floor(
                currentIndex /
                png.width
            );

        for (
            const direction of directions
        ) {
            const nx =
                x + direction.x;

            const ny =
                y + direction.y;

            if (
                nx < 0 ||
                nx >= png.width ||
                ny < 0 ||
                ny >= png.height
            ) {
                continue;
            }

            const index =
                ny * png.width +
                nx;

            if (
                result[index] === 1 ||
                mask[index] !== 1
            ) {
                continue;
            }

            result[index] = 1;
            queue.push(index);
        }
    }

    return result;
}

function countPixels(
    mask: Uint8Array
): number {
    let count = 0;

    for (
        const value of mask
    ) {
        if (value === 1) {
            count += 1;
        }
    }

    return count;
}

function erode(
    mask: Uint8Array,
    width: number,
    height: number
): Uint8Array {
    const result =
        new Uint8Array(
            width * height
        );

    for (
        let y = 1;
        y < height - 1;
        y += 1
    ) {
        for (
            let x = 1;
            x < width - 1;
            x += 1
        ) {
            let keep = true;

            for (
                let dy = -1;
                dy <= 1;
                dy += 1
            ) {
                for (
                    let dx = -1;
                    dx <= 1;
                    dx += 1
                ) {
                    const index =
                        (y + dy) *
                            width +
                        (x + dx);

                    if (
                        mask[index] !== 1
                    ) {
                        keep = false;
                    }
                }
            }

            if (keep) {
                result[
                    y * width + x
                ] = 1;
            }
        }
    }

    return result;
}

function dilate(
    mask: Uint8Array,
    width: number,
    height: number
): Uint8Array {
    const result =
        new Uint8Array(
            width * height
        );

    for (
        let y = 0;
        y < height;
        y += 1
    ) {
        for (
            let x = 0;
            x < width;
            x += 1
        ) {
            let set = false;

            for (
                let dy = -1;
                dy <= 1;
                dy += 1
            ) {
                for (
                    let dx = -1;
                    dx <= 1;
                    dx += 1
                ) {
                    const nx =
                        x + dx;

                    const ny =
                        y + dy;

                    if (
                        nx < 0 ||
                        nx >= width ||
                        ny < 0 ||
                        ny >= height
                    ) {
                        continue;
                    }

                    if (
                        mask[
                            ny * width +
                            nx
                        ] === 1
                    ) {
                        set = true;
                    }
                }
            }

            if (set) {
                result[
                    y * width + x
                ] = 1;
            }
        }
    }

    return result;
}

function writeMask(
    png: PNG,
    mask: Uint8Array,
    outputPath: string
): void {
    const output =
        new PNG({
            width: png.width,
            height: png.height
        });

    for (
        let y = 0;
        y < png.height;
        y += 1
    ) {
        for (
            let x = 0;
            x < png.width;
            x += 1
        ) {
            const index =
                y * png.width +
                x;

            const outputIndex =
                index * 4;

            const value =
                mask[index] === 1
                    ? 255
                    : 0;

            output.data[
                outputIndex
            ] = value;

            output.data[
                outputIndex + 1
            ] = value;

            output.data[
                outputIndex + 2
            ] = value;

            output.data[
                outputIndex + 3
            ] = 255;
        }
    }

    fs.writeFileSync(
        outputPath,
        PNG.sync.write(output)
    );
}

function main(): void {
    const png =
        PNG.sync.read(
            fs.readFileSync(
                imagePath
            )
        );

    const seed =
        getRgb(
            png,
            seedX,
            seedY
        );

    console.log(
        "Image:",
        `${png.width} x ${png.height}`
    );

    console.log(
        "Seed:",
        seed
    );

    const rgbMask =
        createRgbMask(
            png,
            30
        );

    const connected =
        connectedFromSeed(
            png,
            rgbMask
        );

    console.log(
        "\nRGB ±30:",
        countPixels(
            rgbMask
        )
    );

    console.log(
        "Seed-connected:",
        countPixels(
            connected
        )
    );

    const connectedPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-connected.png";

    writeMask(
        png,
        connected,
        connectedPath
    );

    console.log(
        "Mask:",
        connectedPath
    );

    /*
     * Opening:
     *
     * erosion followed by dilation.
     *
     * This removes thin fringe/noise.
     */
    const opened =
        dilate(
            erode(
                connected,
                png.width,
                png.height
            ),
            png.width,
            png.height
        );

    const openedPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-opened.png";

    writeMask(
        png,
        opened,
        openedPath
    );

    console.log(
        "Opened:",
        countPixels(
            opened
        )
    );

    console.log(
        "Mask:",
        openedPath
    );

    /*
     * Closing:
     *
     * dilation followed by erosion.
     *
     * This fills small gaps in the green.
     */
    const closed =
        erode(
            dilate(
                connected,
                png.width,
                png.height
            ),
            png.width,
            png.height
        );

    const closedPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-closed.png";

    writeMask(
        png,
        closed,
        closedPath
    );

    console.log(
        "Closed:",
        countPixels(
            closed
        )
    );

    console.log(
        "Mask:",
        closedPath
    );

    /*
     * Opening followed by closing.
     */
    const cleaned =
        erode(
            dilate(
                opened,
                png.width,
                png.height
            ),
            png.width,
            png.height
        );

    const cleanedPath =
        "C:\\Users\\Mickey\\Downloads\\hole-2-rgb30-cleaned.png";

    writeMask(
        png,
        cleaned,
        cleanedPath
    );

    console.log(
        "Cleaned:",
        countPixels(
            cleaned
        )
    );

    console.log(
        "Mask:",
        cleanedPath
    );
}

main();