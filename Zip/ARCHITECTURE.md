# Feature Detection Engine — Architecture

## Current Architecture Status

The Feature Detection Engine (FDE) is a reusable TypeScript computer-vision engine for detecting golf-course features from raster imagery.

The current implementation is a working TypeScript/OpenCV.js browser vertical slice:

```text
Browser UI
   |
   v
src/browser/main.ts
   |
   v
FeatureDetectionEngine
   |
   v
Detection Pipeline
   |
   v
OpenCvJsAdapter
   |
   v
OpenCV.js
   |
   v
Contours / Geometry
   |
   v
Domain Features
```

The host/browser application owns image selection and presentation. The FDE owns image processing and feature detection.

## Responsibilities

### Host Application

Responsible for:
- Displaying imagery.
- Selecting imagery.
- User interaction.
- Selecting a feature type.
- Capturing a user seed/centre click.
- Displaying returned geometry.
- Coordinate conversion between display/image/world coordinates.
- Editing geometry.
- Exporting results.

### Feature Detection Engine

Responsible for:
- Image validation.
- OpenCV processing.
- Feature detection.
- Polygon generation.
- Confidence scoring.
- Geometry processing.
- Returning deterministic, editable feature results.

## OpenCV Integration

The project currently uses:

```text
opencv.js@1.2.1
```

The installed runtime file is:

```text
node_modules\opencv.js\opencv.js
```

OpenCV is hidden behind application-level contracts and adapters in:

```text
src/application/opencv/OpenCvTypes.ts
src/application/opencv/OpenCvAdapter.ts
src/application/opencv/OpenCvJsAdapter.ts
src/infrastructure/opencv/OpenCvJsRuntime.ts
```

The public FDE API must not expose OpenCV-specific types.

## Browser Entry Points

```text
index.html
src/browser/main.ts
```

The HTML page loads OpenCV.js and then the TypeScript browser entry point.

## Processing Pipeline

Current logical pipeline:

```text
Input Image
    |
    v
OpenCV Image Creation
    |
    v
RGBA -> Grayscale
    |
    v
Contour Extraction
    |
    v
Contour -> Domain Points
    |
    v
Feature Detection
    |
    v
Polygon / Confidence
```

The wider planned golf-course pipeline remains:

1. OpenCV pre-processing
2. Green detection
3. Green fringe generation
4. Tee box detection
5. Bunker detection
6. Fringe clipping
7. Fairway detection
8. Future detectors

## User-Guided Detection Direction

The agreed next workflow is user-guided rather than fully blind detection.

### Bunkers

1. User selects `Bunker`.
2. User clicks approximately at the centre of a bunker.
3. The click supplies a seed/location for processing.
4. The engine detects the bunker around that seed.
5. The result is returned and displayed.
6. The user repeats the click for additional bunkers without reselecting Bunker.

This supports processing all five bunkers efficiently.

### Green

1. User selects `Green`.
2. User clicks approximately near the centre of the green.
3. The engine uses that click as the seed/location.
4. The green is detected and returned.

The centre click is intended to be approximate; pixel-perfect accuracy is not required.

## Design Principles

- Clean Architecture.
- SOLID.
- Modular detectors.
- Test Driven Development.
- OpenCV hidden behind contracts.
- Deterministic processing.
- User-guided detection where it materially improves reliability.
- UI concerns remain outside core detection logic.
