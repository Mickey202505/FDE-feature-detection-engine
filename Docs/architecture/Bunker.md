Technical Specification: Auto-Bunker Tracing Module
1. Executive Summary
This document outlines the architecture and implementation details for a Node.js/NPM module designed to automatically trace the boundaries of golf course sand bunkers based on a single user click.

Constraints & Requirements:

Environment: Must be consumable as an NPM module by a parent React + Electron desktop application.
Compute: Must run entirely locally on the user's machine (CPU-bound).
Cost/AI: Strict "No AI/Deep Learning" requirement. Must rely on classic deterministic computer vision to ensure zero cloud compute costs and immediate execution.
2. Technical Approach
To achieve boundary detection without AI, the module will utilize a Flood Fill (Region Growing) algorithm, conceptually identical to the "Magic Wand" tool in image editing software.

Because sand bunkers present a high-contrast visual footprint (light sand vs. dark green grass), color-space thresholding is highly effective.

Proposed Tech Stack
Core Logic: TypeScript / Node.js
Computer Vision: opencv4nodejs (or compiled opencv.js for Node)
Image Source: Google Maps Static API (utilizing the free tier of 100k requests/mo via the parent app's API key).
Geospatial Math: @mapbox/sphericalmercator or turf.js for coordinate translations.
3. Module Interface (API Design)
The module should expose a clean asynchronous function that the React/Electron app can call when a click event occurs on the map canvas.

typescript

import { Feature, Polygon } from 'geojson';
interface TracerOptions {
  lat: number;           // Latitude of the user's click
  lng: number;           // Longitude of the user's click
  zoom: number;          // Current zoom level of the map
  googleApiKey: string;  // Passed from the parent app
  tolerance?: number;    // Optional: Color bleed tolerance (default: 15)
}
/**
 * Fetches map tile, executes flood fill, and returns a GeoJSON polygon.
 */
export async function traceBunker(options: TracerOptions): Promise<Feature<Polygon>> {
  // Implementation
}
4. Step-by-Step Implementation Guide
Step 1: Image Acquisition
When the traceBunker function is invoked, the module must immediately request a satellite image tile from the Google Maps Static API.

Endpoint: https://maps.googleapis.com/maps/api/staticmap
Parameters: center={lat},{lng}, zoom={zoom}, size=512x512, maptype=satellite.
Crucial Logic: Because the image is requested with the user's click coordinates as the center, the clicked pixel will always be exactly at (x: 256, y: 256) on a 512x512 image.
Step 2: Computer Vision Processing (OpenCV)
Load Image: Decode the fetched image buffer into an OpenCV Mat object.
Color Space Conversion: Convert the image from RGB to HSV (Hue, Saturation, Value). HSV is vastly superior for separating shadow intensity from actual color (grass vs. sand).
Flood Fill (cv.floodFill):
Seed Point: (256, 256)
Lower/Upper Difference: Use the tolerance parameter to allow the fill to grow across slightly varying shades of sand.
Output: A binary mask (black and white) where the filled bunker is white.
Contour Extraction (cv.findContours): Extract the outer boundary of the white mask. This yields an array of [x, y] pixel coordinates.
Simplification (Optional but recommended): Apply the Ramer-Douglas-Peucker algorithm (cv.approxPolyDP) to reduce the number of vertices, ensuring the final polygon draws smoothly in React.
Step 3: Geospatial Translation (Pixels to Lat/Lng)
The array of pixel coordinates must be converted back to real-world coordinates.

Math: Using Web Mercator projection formulas, calculate the geographical bounding box of the 512x512 image based on its center point and zoom level.
Map the [x, y] pixel array proportionately into that bounding box to derive [lat, lng] pairs.
Step 4: Output
Construct a standard GeoJSON Polygon object using the calculated [lat, lng] pairs and return it to the caller.

5. UI/UX Recommendations for the Parent App
Because classic computer vision relies on color contrast, it can occasionally fail due to:

Deep Shadows: A tree casting a black shadow over half the bunker.
Washout: Poor quality satellite imagery where the grass is dead/brown and matches the sand.
Required UI mitigation in the React App: Expose the tolerance variable in the React UI as a "Magic Wand Sensitivity" slider. If a user clicks a bunker and the polygon bleeds out into the fairway, they should be able to drag the slider down (reducing tolerance) and re-click to get a tighter boundary.