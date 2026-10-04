# version-2.0-of-the-feature-detection-engine

Detects golf course features (bunkers and greens) from satellite imagery,
smooths the resulting polygon, and exports it as an SVG with world-space
coordinates. Ships as a plain ES module for use in the sim app.

## What it does

Three things, in order:

1. **Detect** — turn a mask (or a colour-based seed) into a raw pixel-space polygon
2. **Smooth** — reduce and polish that polygon into a clean, human-looking shape
3. **Export** — write the final polygon as an SVG ready for the sim

Each step is a separate function so you can call them individually, replace any
one of them, or use just the parts you need.

## Install

From this folder (or wherever you've placed it):
