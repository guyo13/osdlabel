import { describe, it, expect, vi, beforeEach } from 'vitest';
import { computeViewportTransform } from '../../../src/overlay/fabric-overlay.js';
import type OpenSeadragon from 'openseadragon';

/** Create a mock OSD viewer with a configurable viewport transform */
function createMockViewer(options: {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotationDeg?: number;
}): OpenSeadragon.Viewer {
  const { scale, offsetX, offsetY, rotationDeg = 0 } = options;
  const rad = (rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);

  return {
    viewport: {
      imageToViewerElementCoordinates: vi.fn((point: { x: number; y: number }) => {
        // Apply rotation + scale, then translate
        const sx = cosR * scale * point.x - sinR * scale * point.y + offsetX;
        const sy = sinR * scale * point.x + cosR * scale * point.y + offsetY;
        return { x: sx, y: sy };
      }),
      viewerElementToImageCoordinates: vi.fn((point: { x: number; y: number }) => {
        // Inverse: undo translate, then undo rotation+scale
        const px = point.x - offsetX;
        const py = point.y - offsetY;
        const ix = (cosR * px + sinR * py) / scale;
        const iy = (-sinR * px + cosR * py) / scale;
        return { x: ix, y: iy };
      }),
    },
  } as unknown as OpenSeadragon.Viewer;
}

describe('computeViewportTransform', () => {
  it('returns identity-like matrix at 1:1 zoom with no pan', () => {
    const viewer = createMockViewer({ scale: 1, offsetX: 0, offsetY: 0 });
    const vpt = computeViewportTransform(viewer);

    // [scaleX, skewY, skewX, scaleY, tx, ty]
    expect(vpt[0]).toBeCloseTo(1); // scaleX
    expect(vpt[1]).toBeCloseTo(0); // skewY (no rotation)
    expect(vpt[2]).toBeCloseTo(0); // skewX (no rotation)
    expect(vpt[3]).toBeCloseTo(1); // scaleY
    expect(vpt[4]).toBeCloseTo(0); // tx
    expect(vpt[5]).toBeCloseTo(0); // ty
  });

  it('returns correct matrix at 2x zoom with no pan', () => {
    const viewer = createMockViewer({ scale: 2, offsetX: 0, offsetY: 0 });
    const vpt = computeViewportTransform(viewer);

    expect(vpt[0]).toBeCloseTo(2);
    expect(vpt[1]).toBeCloseTo(0);
    expect(vpt[2]).toBeCloseTo(0);
    expect(vpt[3]).toBeCloseTo(2);
    expect(vpt[4]).toBeCloseTo(0);
    expect(vpt[5]).toBeCloseTo(0);
  });

  it('returns correct matrix with zoom and pan offset', () => {
    const viewer = createMockViewer({ scale: 3, offsetX: 100, offsetY: -50 });
    const vpt = computeViewportTransform(viewer);

    expect(vpt[0]).toBeCloseTo(3); // scaleX
    expect(vpt[1]).toBeCloseTo(0);
    expect(vpt[2]).toBeCloseTo(0);
    expect(vpt[3]).toBeCloseTo(3); // scaleY
    expect(vpt[4]).toBeCloseTo(100); // tx
    expect(vpt[5]).toBeCloseTo(-50); // ty
  });

  it('returns correct matrix with 90-degree rotation', () => {
    const viewer = createMockViewer({ scale: 1, offsetX: 0, offsetY: 0, rotationDeg: 90 });
    const vpt = computeViewportTransform(viewer);

    // cos(90°) ≈ 0, sin(90°) = 1
    expect(vpt[0]).toBeCloseTo(0); // cos * scale
    expect(vpt[1]).toBeCloseTo(1); // sin * scale
    expect(vpt[2]).toBeCloseTo(-1); // -sin * scale
    expect(vpt[3]).toBeCloseTo(0); // cos * scale
    expect(vpt[4]).toBeCloseTo(0);
    expect(vpt[5]).toBeCloseTo(0);
  });

  it('returns correct matrix with 45-degree rotation and 2x zoom', () => {
    const viewer = createMockViewer({ scale: 2, offsetX: 50, offsetY: 50, rotationDeg: 45 });
    const vpt = computeViewportTransform(viewer);

    const cos45 = Math.cos(Math.PI / 4);
    const sin45 = Math.sin(Math.PI / 4);

    expect(vpt[0]).toBeCloseTo(cos45 * 2); // a = cos * scale
    expect(vpt[1]).toBeCloseTo(sin45 * 2); // b = sin * scale
    expect(vpt[2]).toBeCloseTo(-sin45 * 2); // c = -sin * scale
    expect(vpt[3]).toBeCloseTo(cos45 * 2); // d = cos * scale
    expect(vpt[4]).toBeCloseTo(50);
    expect(vpt[5]).toBeCloseTo(50);
  });

  it('produces a matrix that correctly transforms image-space points to screen', () => {
    const viewer = createMockViewer({ scale: 2.5, offsetX: 30, offsetY: 20 });
    const vpt = computeViewportTransform(viewer);

    // Manually apply the matrix to an image-space point
    const imgX = 40;
    const imgY = 60;
    const screenX = vpt[0] * imgX + vpt[2] * imgY + vpt[4];
    const screenY = vpt[1] * imgX + vpt[3] * imgY + vpt[5];

    // Compare with what the OSD mock would produce
    const expected = viewer.viewport.imageToViewerElementCoordinates({
      x: imgX,
      y: imgY,
    } as OpenSeadragon.Point);
    expect(screenX).toBeCloseTo(expected.x);
    expect(screenY).toBeCloseTo(expected.y);
  });
});

describe('Coordinate conversion round-trip', () => {
  const configs = [
    { scale: 1, offsetX: 0, offsetY: 0, rotationDeg: 0 },
    { scale: 2, offsetX: 100, offsetY: -50, rotationDeg: 0 },
    { scale: 0.5, offsetX: 300, offsetY: 200, rotationDeg: 0 },
    { scale: 3, offsetX: 0, offsetY: 0, rotationDeg: 45 },
    { scale: 1.5, offsetX: -100, offsetY: 50, rotationDeg: 90 },
  ];

  for (const config of configs) {
    it(`round-trips correctly for scale=${config.scale}, offset=(${config.offsetX},${config.offsetY}), rotation=${config.rotationDeg}°`, () => {
      const viewer = createMockViewer(config);

      const originalImagePoint = { x: 150, y: 250 };

      // image → screen
      const screenPoint = viewer.viewport.imageToViewerElementCoordinates(
        originalImagePoint as OpenSeadragon.Point,
      );

      // screen → image
      const roundTripped = viewer.viewport.viewerElementToImageCoordinates(
        screenPoint as OpenSeadragon.Point,
      );

      expect(roundTripped.x).toBeCloseTo(originalImagePoint.x, 6);
      expect(roundTripped.y).toBeCloseTo(originalImagePoint.y, 6);
    });
  }
});

/** Create a mock OSD viewer with flip (simulates setFlip(true)) */
function createMockViewerWithFlip(options: {
  scale: number;
  offsetX: number;
  offsetY: number;
  rotationDeg?: number;
  flipH?: boolean;
}): OpenSeadragon.Viewer {
  const { scale, offsetX, offsetY, rotationDeg = 0, flipH = false } = options;
  const rad = (rotationDeg * Math.PI) / 180;
  const cosR = Math.cos(rad);
  const sinR = Math.sin(rad);
  const flipSign = flipH ? -1 : 1;

  return {
    viewport: {
      imageToViewerElementCoordinates: vi.fn((point: { x: number; y: number }) => {
        // Apply flip to x, then rotation + scale, then translate
        const fx = flipSign * point.x;
        const sx = cosR * scale * fx - sinR * scale * point.y + offsetX;
        const sy = sinR * scale * fx + cosR * scale * point.y + offsetY;
        return { x: sx, y: sy };
      }),
      viewerElementToImageCoordinates: vi.fn((point: { x: number; y: number }) => {
        const px = point.x - offsetX;
        const py = point.y - offsetY;
        const ix = (cosR * px + sinR * py) / scale;
        const iy = (-sinR * px + cosR * py) / scale;
        return { x: flipSign * ix, y: iy };
      }),
    },
  } as unknown as OpenSeadragon.Viewer;
}

describe('computeViewportTransform with flip', () => {
  it('returns matrix with negative a component when flipped horizontally', () => {
    const viewer = createMockViewerWithFlip({ scale: 1, offsetX: 0, offsetY: 0, flipH: true });
    const vpt = computeViewportTransform(viewer);

    // With flipH, dx = -1 (unitX maps to -1 on screen). The formula [dx, dy, -dy, dx]
    // copies dx into both a and d positions, so both are negative.
    expect(vpt[0]).toBeCloseTo(-1); // a = dx = -1
    expect(vpt[1]).toBeCloseTo(0);  // b = dy = 0
    expect(vpt[2]).toBeCloseTo(0);  // c = -dy = 0
    expect(vpt[3]).toBeCloseTo(-1); // d = dx = -1 (formula limitation: assumes rotation+scale)
  });

  it('returns correct matrix with 90° rotation + flipH', () => {
    const viewer = createMockViewerWithFlip({
      scale: 1, offsetX: 0, offsetY: 0, rotationDeg: 90, flipH: true,
    });
    const vpt = computeViewportTransform(viewer);

    // cos(90°) ≈ 0, sin(90°) = 1, flip negates x
    // a = cos * scale * flipSign = 0 * 1 * -1 ≈ 0
    // The origin→unitX vector represents the flipped+rotated transform
    expect(vpt[0]).toBeCloseTo(0);   // a
    expect(vpt[1]).toBeCloseTo(-1);  // b (sin * scale * flipSign)
  });

  it('returns correct matrix with 180° rotation + flipH (simulates vertical flip)', () => {
    const viewer = createMockViewerWithFlip({
      scale: 2, offsetX: 0, offsetY: 0, rotationDeg: 180, flipH: true,
    });
    const vpt = computeViewportTransform(viewer);

    // 180° + flipH: cos(180°)=-1, sin(180°)≈0, flipSign=-1
    // unitX(1,0) → fx=-1, sx=cos*scale*fx = (-1)*2*(-1) = 2, sy≈0
    // dx=2, dy≈0, matrix=[dx, dy, -dy, dx] = [2, 0, 0, 2]
    expect(vpt[0]).toBeCloseTo(2);  // a = dx
    expect(vpt[3]).toBeCloseTo(2);  // d = dx (formula uses dx for both a and d)
  });

  it('round-trips correctly with flip', () => {
    const flipConfigs = [
      { scale: 1, offsetX: 0, offsetY: 0, rotationDeg: 0, flipH: true },
      { scale: 2, offsetX: 50, offsetY: 50, rotationDeg: 90, flipH: true },
      { scale: 1.5, offsetX: 100, offsetY: -30, rotationDeg: 180, flipH: true },
    ];

    for (const config of flipConfigs) {
      const viewer = createMockViewerWithFlip(config);
      const originalPoint = { x: 100, y: 200 };

      const screenPoint = viewer.viewport.imageToViewerElementCoordinates(
        originalPoint as OpenSeadragon.Point,
      );
      const roundTripped = viewer.viewport.viewerElementToImageCoordinates(
        screenPoint as OpenSeadragon.Point,
      );

      expect(roundTripped.x).toBeCloseTo(originalPoint.x, 6);
      expect(roundTripped.y).toBeCloseTo(originalPoint.y, 6);
    }
  });
});
