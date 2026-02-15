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
    expect(vpt[0]).toBeCloseTo(1);  // scaleX
    expect(vpt[1]).toBeCloseTo(0);  // skewY (no rotation)
    expect(vpt[2]).toBeCloseTo(0);  // skewX (no rotation)
    expect(vpt[3]).toBeCloseTo(1);  // scaleY
    expect(vpt[4]).toBeCloseTo(0);  // tx
    expect(vpt[5]).toBeCloseTo(0);  // ty
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

    expect(vpt[0]).toBeCloseTo(3);   // scaleX
    expect(vpt[1]).toBeCloseTo(0);
    expect(vpt[2]).toBeCloseTo(0);
    expect(vpt[3]).toBeCloseTo(3);   // scaleY
    expect(vpt[4]).toBeCloseTo(100); // tx
    expect(vpt[5]).toBeCloseTo(-50); // ty
  });

  it('returns correct matrix with 90-degree rotation', () => {
    const viewer = createMockViewer({ scale: 1, offsetX: 0, offsetY: 0, rotationDeg: 90 });
    const vpt = computeViewportTransform(viewer);

    // cos(90°) ≈ 0, sin(90°) = 1
    expect(vpt[0]).toBeCloseTo(0);   // cos * scale
    expect(vpt[1]).toBeCloseTo(1);   // sin * scale
    expect(vpt[2]).toBeCloseTo(-1);  // -sin * scale
    expect(vpt[3]).toBeCloseTo(0);   // cos * scale
    expect(vpt[4]).toBeCloseTo(0);
    expect(vpt[5]).toBeCloseTo(0);
  });

  it('returns correct matrix with 45-degree rotation and 2x zoom', () => {
    const viewer = createMockViewer({ scale: 2, offsetX: 50, offsetY: 50, rotationDeg: 45 });
    const vpt = computeViewportTransform(viewer);

    const cos45 = Math.cos(Math.PI / 4);
    const sin45 = Math.sin(Math.PI / 4);

    expect(vpt[0]).toBeCloseTo(cos45 * 2);  // a = cos * scale
    expect(vpt[1]).toBeCloseTo(sin45 * 2);  // b = sin * scale
    expect(vpt[2]).toBeCloseTo(-sin45 * 2); // c = -sin * scale
    expect(vpt[3]).toBeCloseTo(cos45 * 2);  // d = cos * scale
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
    const expected = viewer.viewport.imageToViewerElementCoordinates({ x: imgX, y: imgY } as OpenSeadragon.Point);
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
