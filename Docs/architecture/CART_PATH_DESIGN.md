# Cart Path Detection — Design Document

Status: Draft for review
Date: 2026-09-25

## 1. Purpose

This document specifies the design for cart path detection in
the FDE (Feature Detection Engine). Cart paths are a distinct
problem from greens and bunkers — they are long, thin, curved
features rather than compact blobs. The detection algorithm is
therefore different.

## 2. User Workflow

The user marks each cart path by clicking two points:

1. Click a point at one end of the cart path
2. Click a point at the other end (which may be a T-junction)
3. The app traces the path between the two clicks
4. The user can drag the resulting waypoints to correct
   any parts that are wrong

This can be repeated until all cart paths on a hole or course
are marked.

### Why two points, not one seed

Greens and bunkers are regions — a single seed defines them.
Cart paths are routes — the user needs to specify both ends so
the algorithm knows which way to trace.

## 3. Detection Approach — Bidirectional A*

The core algorithm is bidirectional A* pathfinding on a cost map
derived from the image.

### 3.1 Cost Map

Each pixel is assigned a cost based on its colour:

| Pixel type              | Cost  |
|-------------------------|-------|
| Path (grey asphalt)     | 1     |
| Dark pixel (shadow)     | 5     |
| Slightly off-path       | 20    |
| Grass                   | 50    |
| Impassable (bright green in sun, water) | 1000 |

A* finds the cheapest route from A to B, preferring path pixels
and crossing expensive pixels only when necessary.

### 3.2 Colour Tests

Asphalt (path):
```ts
|r - g| < 25 &&
|g - b| < 25 &&
|r - b| < 25 &&
r < 150

## 16. SVG Output Format

Cart paths are stored in the same SVG structure as greens and
bunkers, with two differences:

1. Use `<polyline>` instead of `<polygon>`
2. Include `data-width-meters` (set by meshery)

### Example

```xml
<g data-hole="4">
  <polygon data-feature-type="Green"
           data-feature-number="1"
           points="..." />

  <polygon data-feature-type="Bunker"
           data-feature-number="1"
           points="..." />

  <polyline data-feature-type="CartPath"
            data-feature-number="1"
            data-width-meters="2.4"
            points="1100.5,5500.3 1130.2,5520.1 1165.7,5545.8 ..." />
</g>