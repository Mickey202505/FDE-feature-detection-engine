// src/application/opencv/OpenCvJsAdapter.ts
var GREEN_MASK_OPTIONS = {
  isFeaturePixel: (colour) => colour.g >= 50 && colour.g - Math.max(colour.r, colour.b) >= 10,
  localTolerance: 16,
  seedTolerance: 40,
  gradualTransitionSeedTolerance: 25,
  gradualTransitionLocalTolerance: 12,
  minimumCloseAcceptedNeighbours: 4,
  maximumAcceptedNeighbourColourSpread: 12
};
var BUNKER_MASK_OPTIONS = {
  isFeaturePixel: (colour) => colour.r >= 140 && colour.g >= 130 && colour.b >= 100 && colour.r >= colour.b,
  localTolerance: 25,
  seedTolerance: 120,
  gradualTransitionSeedTolerance: 40,
  gradualTransitionLocalTolerance: 20,
  minimumCloseAcceptedNeighbours: 4,
  maximumAcceptedNeighbourColourSpread: 20
};
var OpenCvJsAdapter = class {
  cv;
  constructor(cv) {
    this.cv = cv;
  }
  findContours(image, seed) {
    const normalizedImage = this.normalizeImage(image);
    this.validateImage(normalizedImage);
    const mask = this.createBinaryImage(
      normalizedImage,
      seed
    );
    const contours = new this.cv.MatVector();
    const hierarchy = new this.cv.Mat();
    try {
      this.cv.findContours(
        mask,
        contours,
        hierarchy,
        this.cv.RETR_EXTERNAL,
        this.cv.CHAIN_APPROX_SIMPLE
      );
      const detectedContours = [];
      for (let index = 0; index < contours.size(); index += 1) {
        const contour = contours.get(index);
        try {
          let points = this.readContourPoints(
            contour
          );
          this.logRawContourDiagnostic(points);
          if (points.length >= 3 && this.cv.approxPolyDP) {
            const perimeter = this.calculatePerimeter(points);
            const epsilon = Math.max(
              perimeter * 5e-3,
              0.5
            );
            const approximated = new this.cv.Mat();
            try {
              this.cv.approxPolyDP(
                contour,
                approximated,
                epsilon,
                true
              );
              points = this.readContourPoints(
                approximated
              );
              this.logApproximatedContourDiagnostic(
                points,
                epsilon
              );
            } finally {
              if (typeof approximated.delete === "function") {
                approximated.delete();
              }
            }
          }
          if (seed && points.length >= 3) {
            points = this.cleanSeedAwarePolygon(
              points,
              seed
            );
          }
          if (points.length >= 3) {
            detectedContours.push({
              points
            });
          }
        } finally {
          if (contour && typeof contour.delete === "function") {
            contour.delete();
          }
        }
      }
      return detectedContours;
    } finally {
      if (typeof contours.delete === "function") {
        contours.delete();
      }
      if (typeof hierarchy.delete === "function") {
        hierarchy.delete();
      }
      if (typeof mask.delete === "function") {
        mask.delete();
      }
    }
  }
  createBinaryImage(image, seed) {
    if (seed) {
      return this.createSeedGuidedRegionMask(
        image,
        seed
      );
    }
    return this.createAutomaticGreenMask(
      image
    );
  }
  createSeedGuidedRegionMaskForDiagnostics(image, seed, options = GREEN_MASK_OPTIONS) {
    return this.createSeedGuidedRegionMask(
      image,
      seed,
      options
    );
  }
  createSeedGuidedRegionMask(image, seed, options = GREEN_MASK_OPTIONS) {
    const seedOffsets = [
      { x: 0, y: 0 },
      { x: -6, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: -6 },
      { x: 0, y: 6 }
    ];
    const masks = [];
    try {
      for (const offset of seedOffsets) {
        const x = seed.x + offset.x;
        const y = seed.y + offset.y;
        if (x < 0 || x >= image.width || y < 0 || y >= image.height) {
          continue;
        }
        const colour = this.readPixel(
          image,
          x,
          y
        );
        if (!options.isFeaturePixel(colour)) {
          continue;
        }
        masks.push(
          this.createSingleSeedGuidedRegionMask(
            image,
            {
              x,
              y
            },
            options
          )
        );
      }
      if (masks.length === 0) {
        return this.createEmptyMask(image);
      }
      const primaryMask = masks[0];
      const combined = new this.cv.Mat(
        image.height,
        image.width,
        this.cv.CV_8U
      );
      this.clearMask(combined);
      for (let y = 0; y < image.height; y += 1) {
        for (let x = 0; x < image.width; x += 1) {
          const value = primaryMask.ucharPtr(y, x)[0];
          if (value !== 0) {
            this.writeMaskPixel(
              combined,
              x,
              y,
              255
            );
          }
        }
      }
      console.log(
        "[SeedConsensusDiagnostic]",
        {
          requestedSeed: seed,
          growthSeeds: masks.length,
          strategy: "requested-seed-primary",
          primaryMaskIndex: 0
        }
      );
      const closeKernel = this.cv.getStructuringElement(
        this.cv.MORPH_ELLIPSE,
        new this.cv.Size(5, 5)
      );
      const closedMask = new this.cv.Mat(
        image.height,
        image.width,
        this.cv.CV_8U
      );
      try {
        this.cv.morphologyEx(
          combined,
          closedMask,
          this.cv.MORPH_CLOSE,
          closeKernel
        );
      } finally {
        closeKernel.delete?.();
        combined.delete();
      }
      this.fillInternalHoles(closedMask);
      return closedMask;
    } finally {
      for (const m of masks) {
        m.delete?.();
      }
    }
  }
  createSingleSeedGuidedRegionMask(image, seed, options = GREEN_MASK_OPTIONS) {
    const mask = new this.cv.Mat(
      image.height,
      image.width,
      this.cv.CV_8U
    );
    this.clearMask(mask);
    const seedX = Math.round(seed.x);
    const seedY = Math.round(seed.y);
    if (seedX < 0 || seedX >= image.width || seedY < 0 || seedY >= image.height) {
      return mask;
    }
    const seedColour = this.readPixel(
      image,
      seedX,
      seedY
    );
    if (!options.isFeaturePixel(seedColour)) {
      return mask;
    }
    const accepted = new Uint8Array(
      image.width * image.height
    );
    const queueX = [];
    const queueY = [];
    const seedIndex = seedY * image.width + seedX;
    accepted[seedIndex] = 1;
    queueX.push(seedX);
    queueY.push(seedY);
    const localTolerance = options.localTolerance;
    const seedTolerance = options.seedTolerance;
    const gradualTransitionSeedTolerance = options.gradualTransitionSeedTolerance;
    const gradualTransitionLocalTolerance = options.gradualTransitionLocalTolerance;
    const minimumCloseAcceptedNeighbours = options.minimumCloseAcceptedNeighbours;
    const relaxedCloseNeighbourSeedDistance = seedTolerance + 5;
    const maximumAcceptedNeighbourColourSpread = options.maximumAcceptedNeighbourColourSpread;
    const diagnosticStartX = seedX + 40;
    const diagnosticRejectionLimit = 40;
    let diagnosticRejectionCount = 0;
    let rejectedNotGreen = 0;
    let rejectedLocalDistance = 0;
    let rejectedGradualCondition = 0;
    let acceptedPixelCount = 1;
    let minimumAcceptedX = seedX;
    let maximumAcceptedX = seedX;
    let minimumAcceptedY = seedY;
    let maximumAcceptedY = seedY;
    const logGrowthRejection = (reason, details) => {
      if (details.x === void 0 || typeof details.x !== "number" || details.x < diagnosticStartX || diagnosticRejectionCount >= diagnosticRejectionLimit) {
        return;
      }
      diagnosticRejectionCount += 1;
      console.log(
        `[SeedGrowthReject:${reason}]`,
        {
          seed,
          ...details
        }
      );
    };
    let maximumSeedDistance = 0;
    let maximumSeedDistancePoint;
    const neighbourOffsets = [
      [-1, -1],
      [0, -1],
      [1, -1],
      [-1, 0],
      [1, 0],
      [-1, 1],
      [0, 1],
      [1, 1]
    ];
    while (queueX.length > 0) {
      const currentX = queueX.shift();
      const currentY = queueY.shift();
      for (const [
        offsetX,
        offsetY
      ] of neighbourOffsets) {
        const nextX = currentX + offsetX;
        const nextY = currentY + offsetY;
        if (nextX < 0 || nextX >= image.width || nextY < 0 || nextY >= image.height) {
          continue;
        }
        const index = nextY * image.width + nextX;
        if (accepted[index] !== 0) {
          continue;
        }
        const candidateColour = this.readPixel(
          image,
          nextX,
          nextY
        );
        if (!options.isFeaturePixel(
          candidateColour
        )) {
          rejectedNotGreen += 1;
          logGrowthRejection(
            "NOT_GREEN",
            {
              x: nextX,
              y: nextY,
              candidateColour
            }
          );
          continue;
        }
        const seedDistance = this.calculateRgbDistance(
          candidateColour,
          seedColour
        );
        if (seedDistance > maximumSeedDistance) {
          maximumSeedDistance = seedDistance;
          maximumSeedDistancePoint = {
            x: nextX,
            y: nextY
          };
        }
        const localColour = this.getLocalAcceptedColour(
          image,
          accepted,
          nextX,
          nextY
        );
        const localDistance = this.calculateRgbDistance(
          candidateColour,
          localColour
        );
        if (localDistance > localTolerance) {
          rejectedLocalDistance += 1;
          logGrowthRejection(
            "LOCAL_DISTANCE",
            {
              x: nextX,
              y: nextY,
              candidateColour,
              localColour,
              seedDistance,
              localDistance,
              localTolerance
            }
          );
          continue;
        }
        const closeNeighbourCount = this.countCloseAcceptedNeighbours(
          image,
          accepted,
          nextX,
          nextY,
          candidateColour,
          localTolerance
        );
        const acceptedNeighbourColourSpread = this.getAcceptedNeighbourColourSpread(
          image,
          accepted,
          nextX,
          nextY
        );
        const smoothColourDrift = this.hasSmoothColourDriftSupport(
          image,
          accepted,
          nextX,
          nextY,
          candidateColour,
          gradualTransitionLocalTolerance
        );
        if (seedDistance > seedTolerance && (seedDistance > gradualTransitionSeedTolerance || localDistance > gradualTransitionLocalTolerance || closeNeighbourCount < 1 || acceptedNeighbourColourSpread > maximumAcceptedNeighbourColourSpread && !smoothColourDrift)) {
          rejectedGradualCondition += 1;
          logGrowthRejection(
            "GRADUAL_CONDITION",
            {
              x: nextX,
              y: nextY,
              candidateColour,
              localColour,
              seedDistance,
              seedTolerance,
              gradualTransitionSeedTolerance,
              localDistance,
              gradualTransitionLocalTolerance,
              closeNeighbourCount,
              acceptedNeighbourColourSpread,
              maximumAcceptedNeighbourColourSpread,
              smoothColourDrift
            }
          );
          continue;
        }
        accepted[index] = 1;
        this.writeMaskPixel(
          mask,
          nextX,
          nextY,
          255
        );
        queueX.push(nextX);
        queueY.push(nextY);
        acceptedPixelCount += 1;
        minimumAcceptedX = Math.min(
          minimumAcceptedX,
          nextX
        );
        maximumAcceptedX = Math.max(
          maximumAcceptedX,
          nextX
        );
        minimumAcceptedY = Math.min(
          minimumAcceptedY,
          nextY
        );
        maximumAcceptedY = Math.max(
          maximumAcceptedY,
          nextY
        );
      }
    }
    console.log(
      "[SeedGrowthDiagnostic]",
      {
        seed,
        seedColour,
        localTolerance,
        seedTolerance,
        gradualTransitionSeedTolerance,
        gradualTransitionLocalTolerance,
        minimumCloseAcceptedNeighbours,
        relaxedCloseNeighbourSeedDistance,
        maximumAcceptedNeighbourColourSpread,
        acceptedPixelCount,
        acceptedBounds: {
          minX: minimumAcceptedX,
          maxX: maximumAcceptedX,
          minY: minimumAcceptedY,
          maxY: maximumAcceptedY
        },
        maximumSeedDistance,
        maximumSeedDistancePoint,
        rejectionCounts: {
          notGreen: rejectedNotGreen,
          localDistance: rejectedLocalDistance,
          gradualCondition: rejectedGradualCondition
        },
        diagnostic: {
          startX: diagnosticStartX,
          rejectionLimit: diagnosticRejectionLimit,
          loggedRejections: diagnosticRejectionCount
        }
      }
    );
    return mask;
  }
  extractBoundaryByRaysForDiagnostics(mask, seed) {
    return this.extractBoundaryByRays(mask, seed);
  }
  extractBoundaryByRays(mask, seed, rayCount = 360) {
    const points = [];
    const maxRadius = Math.max(mask.rows, mask.cols);
    for (let i = 0; i < rayCount; i += 1) {
      const angle = i / rayCount * Math.PI * 2;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let lastWhiteX = Math.round(seed.x);
      let lastWhiteY = Math.round(seed.y);
      let consecutiveBlack = 0;
      const blackRunThreshold = 4;
      for (let r = 1; r < maxRadius; r += 1) {
        const x = Math.round(seed.x + dx * r);
        const y = Math.round(seed.y + dy * r);
        if (x < 0 || x >= mask.cols || y < 0 || y >= mask.rows) {
          break;
        }
        const value = mask.ucharPtr(y, x)[0];
        if (value === 0) {
          consecutiveBlack += 1;
          if (consecutiveBlack >= blackRunThreshold) {
            break;
          }
        } else {
          consecutiveBlack = 0;
          lastWhiteX = x;
          lastWhiteY = y;
        }
      }
      points.push({ x: lastWhiteX, y: lastWhiteY });
    }
    return points;
  }
  smoothBoundaryForDiagnostics(points) {
    return this.smoothBoundary(points);
  }
  smoothBoundary(points, windowSize = 3) {
    const n = points.length;
    if (n === 0 || windowSize <= 0) {
      return [...points];
    }
    const smoothed = [];
    const count = windowSize * 2 + 1;
    for (let i = 0; i < n; i += 1) {
      let sumX = 0;
      let sumY = 0;
      for (let w = -windowSize; w <= windowSize; w += 1) {
        const j = (i + w + n) % n;
        sumX += points[j].x;
        sumY += points[j].y;
      }
      smoothed.push({
        x: Math.round(sumX / count),
        y: Math.round(sumY / count)
      });
    }
    return smoothed;
  }
  segmentBoundaryForDiagnostics(points) {
    return this.segmentBoundary(points);
  }
  segmentBoundary(points, maxTurnDegrees = 20, maxGap = 8) {
    const n = points.length;
    if (n < 3) {
      return [...points];
    }
    const maxTurn = maxTurnDegrees * Math.PI / 180;
    const result = [points[0]];
    let lastGoodIndex = 0;
    let runDirX = points[1].x - points[0].x;
    let runDirY = points[1].y - points[0].y;
    const runLen = Math.hypot(runDirX, runDirY) || 1;
    runDirX /= runLen;
    runDirY /= runLen;
    for (let i = 1; i < n; i += 1) {
      const prev = points[i - 1];
      const curr = points[i];
      const edgeX = curr.x - prev.x;
      const edgeY = curr.y - prev.y;
      const edgeLen = Math.hypot(edgeX, edgeY);
      if (edgeLen === 0) {
        continue;
      }
      const edgeDirX = edgeX / edgeLen;
      const edgeDirY = edgeY / edgeLen;
      const dot = runDirX * edgeDirX + runDirY * edgeDirY;
      const clamped = Math.max(-1, Math.min(1, dot));
      const angle = Math.acos(clamped);
      if (angle <= maxTurn) {
        result.push(curr);
        lastGoodIndex = i;
        const alpha = 0.5;
        runDirX = runDirX * (1 - alpha) + edgeDirX * alpha;
        runDirY = runDirY * (1 - alpha) + edgeDirY * alpha;
        const newLen = Math.hypot(runDirX, runDirY) || 1;
        runDirX /= newLen;
        runDirY /= newLen;
      } else if (i - lastGoodIndex > maxGap) {
        result.push(curr);
        lastGoodIndex = i;
        runDirX = edgeDirX;
        runDirY = edgeDirY;
      }
    }
    return result;
  }
  subsampleToCountForDiagnostics(points, targetCount) {
    return this.subsampleToCount(points, targetCount);
  }
  subsampleToCount(points, targetCount) {
    const n = points.length;
    if (n <= targetCount) {
      return [...points];
    }
    const segmentLengths = [];
    let totalLength = 0;
    for (let i = 0; i < n; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % n];
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      segmentLengths.push(length);
      totalLength += length;
    }
    const desiredSpacing = totalLength / targetCount;
    const result = [points[0]];
    let accumulated = 0;
    let nextTarget = desiredSpacing;
    for (let i = 0; i < n; i += 1) {
      accumulated += segmentLengths[i];
      while (accumulated >= nextTarget && result.length < targetCount) {
        result.push(points[(i + 1) % n]);
        nextTarget += desiredSpacing;
      }
    }
    return result;
  }
  resampleBySpacingForDiagnostics(points, targetSpacing) {
    return this.resampleBySpacing(points, targetSpacing);
  }
  resampleBySpacing(points, targetSpacing, minVertices = 12, maxVertices = 80) {
    const n = points.length;
    if (n < 3) {
      return [...points];
    }
    const lengths = [];
    let total = 0;
    for (let i = 0; i < n; i += 1) {
      const a = points[i];
      const b = points[(i + 1) % n];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      lengths.push(len);
      total += len;
    }
    const computed = Math.round(total / targetSpacing);
    const target = Math.max(
      minVertices,
      Math.min(maxVertices, computed)
    );
    const spacing = total / target;
    const result = [points[0]];
    let segIdx = 0;
    let segStart = 0;
    for (let k = 1; k < target; k += 1) {
      const targetDist = k * spacing;
      while (segIdx < n && segStart + lengths[segIdx] < targetDist) {
        segStart += lengths[segIdx];
        segIdx += 1;
      }
      if (segIdx >= n) {
        break;
      }
      const a = points[segIdx];
      const b = points[(segIdx + 1) % n];
      const segLen = lengths[segIdx] || 1;
      const t = (targetDist - segStart) / segLen;
      result.push({
        x: a.x + (b.x - a.x) * t,
        y: a.y + (b.y - a.y) * t
      });
    }
    return result;
  }
  detectGreenBoundary(image, seed) {
    const mask = this.createSeedGuidedRegionMask(image, seed);
    try {
      const raw = this.extractBoundaryByRays(mask, seed);
      return this.resampleBySpacing(raw, 14, 3, 1e3);
    } finally {
      if (typeof mask.delete === "function") {
        mask.delete();
      }
    }
  }
  detectGreenBoundaryRobust(image, seed) {
    const mask = this.createSeedGuidedRegionMask(
      image,
      seed,
      GREEN_MASK_OPTIONS
    );
    try {
      const raw = this.extractBoundaryByRays(mask, seed, 360);
      return this.smoothBoundary(raw, 4);
    } finally {
      if (typeof mask.delete === "function") {
        mask.delete();
      }
    }
  }
  detectBunkerBoundary(image, seed) {
    const mask = this.createSeedGuidedRegionMask(
      image,
      seed,
      BUNKER_MASK_OPTIONS
    );
    try {
      const raw = this.extractBoundaryByRays(mask, seed);
      return this.resampleBySpacing(raw, 14, 3, 1e3);
    } finally {
      if (typeof mask.delete === "function") {
        mask.delete();
      }
    }
  }
  extractBoundaryFromMask(mask, targetSpacing = 14) {
    const contours = new this.cv.MatVector();
    const hierarchy = new this.cv.Mat();
    try {
      this.cv.findContours(
        mask,
        contours,
        hierarchy,
        this.cv.RETR_EXTERNAL,
        this.cv.CHAIN_APPROX_NONE
      );
      if (contours.size() === 0) {
        return [];
      }
      let largestContourIndex = 0;
      let maxArea = 0;
      for (let i = 0; i < contours.size(); i++) {
        const contour = contours.get(i);
        const points2 = this.readContourPoints(contour);
        const area = this.calculatePolygonArea(points2);
        if (area > maxArea) {
          maxArea = area;
          largestContourIndex = i;
        }
        contour.delete();
      }
      const largestContour = contours.get(largestContourIndex);
      const points = this.readContourPoints(largestContour);
      largestContour.delete();
      return this.resampleBySpacing(points, targetSpacing, 10, 2e3);
    } finally {
      contours.delete();
      hierarchy.delete();
    }
  }
  createEmptyMask(image) {
    const mask = new this.cv.Mat(
      image.height,
      image.width,
      this.cv.CV_8U
    );
    this.clearMask(mask);
    return mask;
  }
  createAutomaticGreenMask(image) {
    const mask = new this.cv.Mat(
      image.height,
      image.width,
      this.cv.CV_8U
    );
    this.clearMask(mask);
    for (let y = 0; y < image.height; y += 1) {
      for (let x = 0; x < image.width; x += 1) {
        const colour = this.readPixel(
          image,
          x,
          y
        );
        if (this.isGreenPixel(colour)) {
          this.writeMaskPixel(
            mask,
            x,
            y,
            255
          );
        }
      }
    }
    return mask;
  }
  readPixel(image, x, y) {
    const index = (y * image.width + x) * 4;
    return {
      r: image.data[index],
      g: image.data[index + 1],
      b: image.data[index + 2]
    };
  }
  writeMaskPixel(mask, x, y, value) {
    if (typeof mask.ucharPtr === "function") {
      mask.ucharPtr(y, x)[0] = value;
    }
  }
  clearMask(mask) {
    if (typeof mask.ucharPtr === "function") {
      for (let y = 0; y < mask.rows; y += 1) {
        for (let x = 0; x < mask.cols; x += 1) {
          mask.ucharPtr(y, x)[0] = 0;
        }
      }
    }
  }
  fillInternalHoles(mask) {
    const rows = mask.rows;
    const cols = mask.cols;
    const visited = new Uint8Array(rows * cols);
    const queueX = [];
    const queueY = [];
    const pushIfBlack = (x, y) => {
      if (x < 0 || x >= cols || y < 0 || y >= rows) return;
      const idx = y * cols + x;
      if (visited[idx] !== 0) return;
      if (mask.ucharPtr(y, x)[0] !== 0) return;
      visited[idx] = 1;
      queueX.push(x);
      queueY.push(y);
    };
    for (let x = 0; x < cols; x += 1) {
      pushIfBlack(x, 0);
      pushIfBlack(x, rows - 1);
    }
    for (let y = 0; y < rows; y += 1) {
      pushIfBlack(0, y);
      pushIfBlack(cols - 1, y);
    }
    while (queueX.length > 0) {
      const x = queueX.shift();
      const y = queueY.shift();
      pushIfBlack(x - 1, y);
      pushIfBlack(x + 1, y);
      pushIfBlack(x, y - 1);
      pushIfBlack(x, y + 1);
    }
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        const idx = y * cols + x;
        if (visited[idx] === 0 && mask.ucharPtr(y, x)[0] === 0) {
          mask.ucharPtr(y, x)[0] = 255;
        }
      }
    }
  }
  countCloseAcceptedNeighbours(image, accepted, x, y, candidateColour, tolerance) {
    let count = 0;
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) {
          continue;
        }
        const neighbourX = x + offsetX;
        const neighbourY = y + offsetY;
        if (neighbourX < 0 || neighbourX >= image.width || neighbourY < 0 || neighbourY >= image.height) {
          continue;
        }
        const index = neighbourY * image.width + neighbourX;
        if (accepted[index] === 0) {
          continue;
        }
        const colour = this.readPixel(
          image,
          neighbourX,
          neighbourY
        );
        if (this.calculateRgbDistance(
          candidateColour,
          colour
        ) <= tolerance) {
          count += 1;
        }
      }
    }
    return count;
  }
  hasSmoothColourDriftSupport(image, accepted, x, y, candidateColour, tolerance) {
    const vectors = [];
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) {
          continue;
        }
        const neighbourX = x + offsetX;
        const neighbourY = y + offsetY;
        if (neighbourX < 0 || neighbourX >= image.width || neighbourY < 0 || neighbourY >= image.height) {
          continue;
        }
        const index = neighbourY * image.width + neighbourX;
        if (accepted[index] === 0) {
          continue;
        }
        const neighbourColour = this.readPixel(
          image,
          neighbourX,
          neighbourY
        );
        const distance = this.calculateRgbDistance(
          candidateColour,
          neighbourColour
        );
        if (distance > tolerance) {
          continue;
        }
        vectors.push({
          r: candidateColour.r - neighbourColour.r,
          g: candidateColour.g - neighbourColour.g,
          b: candidateColour.b - neighbourColour.b
        });
      }
    }
    if (vectors.length < 3) {
      return false;
    }
    let consistentPairs = 0;
    let totalPairs = 0;
    for (let first = 0; first < vectors.length; first += 1) {
      for (let second = first + 1; second < vectors.length; second += 1) {
        const firstVector = vectors[first];
        const secondVector = vectors[second];
        const firstLength = Math.sqrt(
          firstVector.r * firstVector.r + firstVector.g * firstVector.g + firstVector.b * firstVector.b
        );
        const secondLength = Math.sqrt(
          secondVector.r * secondVector.r + secondVector.g * secondVector.g + secondVector.b * secondVector.b
        );
        if (firstLength === 0 || secondLength === 0) {
          continue;
        }
        const dot = firstVector.r * secondVector.r + firstVector.g * secondVector.g + firstVector.b * secondVector.b;
        const cosine = dot / (firstLength * secondLength);
        totalPairs += 1;
        if (cosine >= 0.8) {
          consistentPairs += 1;
        }
      }
    }
    if (totalPairs === 0) {
      return false;
    }
    return consistentPairs / totalPairs >= 0.75;
  }
  getAcceptedNeighbourColourSpread(image, accepted, x, y) {
    const colours = [];
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) {
          continue;
        }
        const neighbourX = x + offsetX;
        const neighbourY = y + offsetY;
        if (neighbourX < 0 || neighbourX >= image.width || neighbourY < 0 || neighbourY >= image.height) {
          continue;
        }
        const index = neighbourY * image.width + neighbourX;
        if (accepted[index] === 0) {
          continue;
        }
        colours.push(
          this.readPixel(
            image,
            neighbourX,
            neighbourY
          )
        );
      }
    }
    let maximumSpread = 0;
    for (let first = 0; first < colours.length; first += 1) {
      for (let second = first + 1; second < colours.length; second += 1) {
        const distance = this.calculateRgbDistance(
          colours[first],
          colours[second]
        );
        if (distance > maximumSpread) {
          maximumSpread = distance;
        }
      }
    }
    return maximumSpread;
  }
  getLocalAcceptedColour(image, accepted, x, y) {
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let count = 0;
    for (let offsetY = -1; offsetY <= 1; offsetY += 1) {
      for (let offsetX = -1; offsetX <= 1; offsetX += 1) {
        if (offsetX === 0 && offsetY === 0) {
          continue;
        }
        const neighbourX = x + offsetX;
        const neighbourY = y + offsetY;
        if (neighbourX < 0 || neighbourX >= image.width || neighbourY < 0 || neighbourY >= image.height) {
          continue;
        }
        const index = neighbourY * image.width + neighbourX;
        if (accepted[index] === 0) {
          continue;
        }
        const colour = this.readPixel(
          image,
          neighbourX,
          neighbourY
        );
        redTotal += colour.r;
        greenTotal += colour.g;
        blueTotal += colour.b;
        count += 1;
      }
    }
    if (count === 0) {
      return this.readPixel(
        image,
        x,
        y
      );
    }
    return {
      r: redTotal / count,
      g: greenTotal / count,
      b: blueTotal / count
    };
  }
  calculateRgbDistance(first, second) {
    const red = first.r - second.r;
    const green = first.g - second.g;
    const blue = first.b - second.b;
    return Math.sqrt(
      red * red + green * green + blue * blue
    );
  }
  isGreenPixel(colour) {
    return colour.g >= 50 && colour.g - Math.max(
      colour.r,
      colour.b
    ) >= 10;
  }
  readContourPoints(contour) {
    const points = [];
    if (!contour.data32S || typeof contour.rows !== "number") {
      return points;
    }
    for (let row = 0; row < contour.rows; row += 1) {
      const offset = row * 2;
      points.push({
        x: contour.data32S[offset],
        y: contour.data32S[offset + 1]
      });
    }
    return points;
  }
  calculatePerimeter(points) {
    if (points.length < 2) {
      return 0;
    }
    let perimeter = 0;
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      const dx = next.x - current.x;
      const dy = next.y - current.y;
      perimeter += Math.sqrt(
        dx * dx + dy * dy
      );
    }
    return perimeter;
  }
  cleanSeedAwarePolygon(points, seed) {
    if (points.length < 5) {
      return [...points];
    }
    let cleaned = [...points];
    let changed = true;
    while (changed && cleaned.length >= 5) {
      changed = false;
      for (let index = 0; index < cleaned.length; index += 1) {
        if (this.isSuspiciousVertex(
          cleaned,
          index
        ) && this.isValidRemoval(
          cleaned,
          index,
          seed
        )) {
          cleaned = cleaned.filter(
            (_, candidateIndex) => candidateIndex !== index
          );
          changed = true;
          break;
        }
      }
    }
    return cleaned;
  }
  isSuspiciousVertex(points, index) {
    if (points.length < 3) {
      return false;
    }
    const previous = points[(index - 1 + points.length) % points.length];
    const current = points[index];
    const next = points[(index + 1) % points.length];
    const lineX = next.x - previous.x;
    const lineY = next.y - previous.y;
    const lineLength = Math.sqrt(
      lineX * lineX + lineY * lineY
    );
    if (lineLength === 0) {
      return false;
    }
    const pointX = current.x - previous.x;
    const pointY = current.y - previous.y;
    const perpendicularDistance2 = Math.abs(
      lineX * pointY - lineY * pointX
    ) / lineLength;
    const previousLength = Math.sqrt(
      pointX * pointX + pointY * pointY
    );
    const nextX = next.x - current.x;
    const nextY = next.y - current.y;
    const nextLength = Math.sqrt(
      nextX * nextX + nextY * nextY
    );
    if (previousLength < 3 || nextLength < 3) {
      return false;
    }
    return perpendicularDistance2 <= 1.5;
  }
  isValidRemoval(points, index, seed) {
    if (points.length <= 3) {
      return false;
    }
    const candidate = points.filter(
      (_, candidateIndex) => candidateIndex !== index
    );
    if (this.hasDuplicatePoints(
      candidate
    )) {
      return false;
    }
    if (!this.isPointInsidePolygon(
      seed,
      candidate
    )) {
      return false;
    }
    const originalArea = this.calculatePolygonArea(
      points
    );
    const candidateArea = this.calculatePolygonArea(
      candidate
    );
    if (originalArea === 0) {
      return false;
    }
    const relativeAreaChange = Math.abs(
      candidateArea - originalArea
    ) / originalArea;
    if (relativeAreaChange > 0.1) {
      return false;
    }
    return candidate.length >= 3;
  }
  hasDuplicatePoints(points) {
    const seen = /* @__PURE__ */ new Set();
    for (const point of points) {
      const key = `${point.x}:${point.y}`;
      if (seen.has(key)) {
        return true;
      }
      seen.add(key);
    }
    return false;
  }
  isPointInsidePolygon(point, polygon) {
    let inside = false;
    for (let index = 0; index < polygon.length; index += 1) {
      const current = polygon[index];
      const previous = polygon[(index - 1 + polygon.length) % polygon.length];
      const intersects = current.y > point.y !== previous.y > point.y && point.x < (previous.x - current.x) * (point.y - current.y) / (previous.y - current.y) + current.x;
      if (intersects) {
        inside = !inside;
      }
    }
    return inside;
  }
  calculatePolygonArea(points) {
    if (points.length < 3) {
      return 0;
    }
    let area = 0;
    for (let index = 0; index < points.length; index += 1) {
      const current = points[index];
      const next = points[(index + 1) % points.length];
      area += current.x * next.y - next.x * current.y;
    }
    return Math.abs(area) / 2;
  }
  getPointBounds(points) {
    if (points.length === 0) {
      return null;
    }
    let minX = points[0].x;
    let maxX = points[0].x;
    let minY = points[0].y;
    let maxY = points[0].y;
    for (const point of points) {
      minX = Math.min(
        minX,
        point.x
      );
      maxX = Math.max(
        maxX,
        point.x
      );
      minY = Math.min(
        minY,
        point.y
      );
      maxY = Math.max(
        maxY,
        point.y
      );
    }
    return {
      minX,
      maxX,
      minY,
      maxY
    };
  }
  logRawContourDiagnostic(points) {
    console.log(
      "[RawContourDiagnostic]",
      {
        pointCount: points.length,
        bounds: this.getPointBounds(
          points
        )
      }
    );
  }
  logApproximatedContourDiagnostic(points, epsilon) {
    console.log(
      "[ApproximatedContourDiagnostic]",
      {
        pointCount: points.length,
        epsilon,
        bounds: this.getPointBounds(
          points
        )
      }
    );
  }
  normalizeImage(image) {
    if (image && Number.isInteger(
      image.width
    ) && Number.isInteger(
      image.height
    ) && image.data) {
      return image;
    }
    const mat = image;
    if (mat && Number.isInteger(mat.cols) && Number.isInteger(mat.rows) && typeof mat.ucharPtr === "function") {
      const width = mat.cols;
      const height = mat.rows;
      const data = new Uint8ClampedArray(
        width * height * 4
      );
      for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
          const pixel = mat.ucharPtr(y, x);
          const index = (y * width + x) * 4;
          data[index] = pixel[0] ?? 0;
          data[index + 1] = pixel[1] ?? 0;
          data[index + 2] = pixel[2] ?? 0;
          data[index + 3] = pixel[3] ?? 255;
        }
      }
      return {
        width,
        height,
        data
      };
    }
    return image;
  }
  validateImage(image) {
    if (!image || !Number.isInteger(
      image.width
    ) || !Number.isInteger(
      image.height
    ) || image.width <= 0 || image.height <= 0) {
      throw new Error(
        "Invalid image dimensions."
      );
    }
    const expectedLength = image.width * image.height * 4;
    if (image.data.length !== expectedLength) {
      throw new Error(
        "Image data length does not match image dimensions."
      );
    }
  }
};

// src/application/geometry/simplify.ts
function simplifyPolygon(points, epsilon) {
  if (points.length < 3) return [...points];
  let maxDist = 0;
  let idx = 0;
  const first = points[0];
  const last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i += 1) {
    const d = perpendicularDistance(points[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  if (maxDist > epsilon) {
    const left = simplifyPolygon(points.slice(0, idx + 1), epsilon);
    const right = simplifyPolygon(points.slice(idx), epsilon);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}
function perpendicularDistance(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) {
    const ex = p.x - a.x;
    const ey = p.y - a.y;
    return Math.sqrt(ex * ex + ey * ey);
  }
  return Math.abs((p.x - a.x) * dy - (p.y - a.y) * dx) / len;
}

// src/application/geometry/removeSharpCorners.ts
function removeSharpCorners(points, minAngleDeg = 150) {
  if (points.length < 4) return [...points];
  const minAngle = minAngleDeg * Math.PI / 180;
  const result = [];
  for (let i = 0; i < points.length; i += 1) {
    const prev = points[(i - 1 + points.length) % points.length];
    const curr = points[i];
    const next = points[(i + 1) % points.length];
    const v1x = prev.x - curr.x;
    const v1y = prev.y - curr.y;
    const v2x = next.x - curr.x;
    const v2y = next.y - curr.y;
    const dot = v1x * v2x + v1y * v2y;
    const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
    const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);
    if (mag1 === 0 || mag2 === 0) {
      result.push(curr);
      continue;
    }
    const cosAngle = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
    const angle = Math.acos(cosAngle);
    if (angle >= minAngle) result.push(curr);
  }
  if (result.length < 4) return [...points];
  return result;
}

// src/application/geometry/catmullRom.ts
function catmullRomToPolygon(points, segments = 8) {
  if (points.length < 3) return [...points];
  const result = [];
  const n = points.length;
  for (let i = 0; i < n; i += 1) {
    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];
    for (let s = 0; s <= segments; s += 1) {
      const t = s / segments;
      const t2 = t * t;
      const t3 = t2 * t;
      const x = 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
      const y = 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
      if (i === 0 && s === 0) continue;
      result.push({ x, y });
    }
  }
  return result;
}

// src/application/geometry/smoothPolygon.ts
var DEFAULT_SMOOTH_OPTIONS = {
  enabled: true,
  epsilon: 2,
  splineSegments: 8,
  angleFilter: true,
  minAngle: 150
};
function smoothPolygon(rawPoly, options = DEFAULT_SMOOTH_OPTIONS) {
  if (!options.enabled || rawPoly.length < 4) return [...rawPoly];
  let poly = simplifyPolygon(rawPoly, options.epsilon);
  if (options.angleFilter) {
    poly = removeSharpCorners(poly, options.minAngle);
  }
  poly = catmullRomToPolygon(poly, options.splineSegments);
  poly = simplifyPolygon(poly, options.epsilon * 0.5);
  return poly;
}

// src/application/sam/maskToPolygon.ts
function maskToPolygon(mask, threshold = 0.5) {
  const w = mask.width;
  const h = mask.height;
  const data = mask.data;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const idx = (y * w + x) * 4;
      if (data[idx] > threshold * 255) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (minX > maxX || minY > maxY) return [];
  const cropW = maxX - minX + 1;
  const cropH = maxY - minY + 1;
  const binary = new Uint8Array(cropW * cropH);
  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const idx = (y * w + x) * 4;
      binary[(y - minY) * cropW + (x - minX)] = data[idx] > threshold * 255 ? 1 : 0;
    }
  }
  const contour = traceContour(binary, cropW, cropH);
  return contour.map((p) => ({ x: p.x + minX, y: p.y + minY }));
}
function traceContour(binary, w, h) {
  let startX = -1;
  let startY = -1;
  for (let y = 0; y < h && startX < 0; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (binary[y * w + x] === 1 && isEdge(binary, w, h, x, y)) {
        startX = x;
        startY = y;
        break;
      }
    }
  }
  if (startX < 0) return [];
  const contour = [];
  let cx = startX;
  let cy = startY;
  let dir = 0;
  const dirs = [
    [1, 0],
    [1, 1],
    [0, 1],
    [-1, 1],
    [-1, 0],
    [-1, -1],
    [0, -1],
    [1, -1]
  ];
  const maxIter = w * h * 4;
  let iter = 0;
  do {
    contour.push({ x: cx, y: cy });
    let found = false;
    for (let i = 0; i < 8; i += 1) {
      const nd = (dir + i) % 8;
      const [dx, dy] = dirs[nd];
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && binary[ny * w + nx] === 1 && isEdge(binary, w, h, nx, ny)) {
        cx = nx;
        cy = ny;
        dir = (nd + 5) % 8;
        found = true;
        break;
      }
    }
    if (!found) break;
    iter += 1;
  } while ((cx !== startX || cy !== startY) && iter < maxIter);
  return contour;
}
function isEdge(binary, w, h, x, y) {
  const dirs = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1]
  ];
  for (const [dx, dy] of dirs) {
    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= w || ny < 0 || ny >= h) return true;
    if (binary[ny * w + nx] === 0) return true;
  }
  return false;
}

// src/browser/detectFeature.ts
function detectFeatureColour(cv, imageData, seed, featureType) {
  const adapter = new OpenCvJsAdapter(cv);
  const options = featureType === "bunker" ? BUNKER_MASK_OPTIONS : GREEN_MASK_OPTIONS;
  const rawMask = adapter.createSeedGuidedRegionMaskForDiagnostics(
    imageData,
    seed,
    options
  );
  try {
    return adapter.extractBoundaryFromMask(rawMask, 14);
  } finally {
    if (typeof rawMask.delete === "function") rawMask.delete();
  }
}
function detectFeatureFromMask(mask) {
  return maskToPolygon(mask, 0.4);
}
function applySmoothing(points, options) {
  return smoothPolygon(points, { ...DEFAULT_SMOOTH_OPTIONS, ...options });
}
function detectFeature(cv, imageData, seed, featureType) {
  return detectFeatureColour(cv, imageData, seed, featureType);
}
export {
  applySmoothing,
  detectFeature,
  detectFeatureColour,
  detectFeatureFromMask
};
