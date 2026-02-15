import { render } from 'solid-js/web';
import { onMount, onCleanup } from 'solid-js';
import OpenSeadragon from 'openseadragon';
import { Rect, Circle, Line, Polyline } from 'fabric';
import { createFabricOverlay } from '../src/overlay/fabric-overlay.js';
import type { FabricOverlay } from '../src/overlay/fabric-overlay.js';

function App() {
  let containerRef: HTMLDivElement | undefined;
  let viewer: OpenSeadragon.Viewer | undefined;
  let overlay: FabricOverlay | undefined;

  onMount(() => {
    if (!containerRef) return;

    viewer = OpenSeadragon({
      element: containerRef,
      prefixUrl: '',
      showNavigationControl: false,
      animationTime: 0.3,
      minZoomLevel: 0.5,
      maxZoomLevel: 40,
      visibilityRatio: 0.5,
      constrainDuringPan: true,
      tileSources: 'https://openseadragon.github.io/example-images/highsmith/highsmith.dzi',
    });

    viewer.addHandler('open', () => {
      if (!viewer) return;

      overlay = createFabricOverlay(viewer);

      // ── Rectangle (top-left area) ──────────────────────────────────
      const rect1 = new Rect({
        left: 500,
        top: 400,
        width: 600,
        height: 400,
        fill: 'rgba(255, 0, 0, 0.2)',
        stroke: '#ff0000',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });

      // ── Large rectangle (center area) ─────────────────────────────
      const rect2 = new Rect({
        left: 2000,
        top: 1500,
        width: 1200,
        height: 800,
        fill: 'rgba(0, 100, 255, 0.15)',
        stroke: '#0064ff',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });

      // ── Small rectangle (detail annotation) ───────────────────────
      const rect3 = new Rect({
        left: 4000,
        top: 500,
        width: 300,
        height: 200,
        fill: 'rgba(255, 165, 0, 0.2)',
        stroke: '#ffa500',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      // ── Circle annotations ─────────────────────────────────────────
      const circle1 = new Circle({
        left: 1500,
        top: 800,
        radius: 200,
        fill: 'rgba(0, 200, 0, 0.15)',
        stroke: '#00c800',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });

      const circle2 = new Circle({
        left: 3500,
        top: 2000,
        radius: 150,
        fill: 'rgba(200, 0, 200, 0.15)',
        stroke: '#c800c8',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      const circle3 = new Circle({
        left: 800,
        top: 2200,
        radius: 100,
        fill: 'rgba(255, 255, 0, 0.2)',
        stroke: '#cccc00',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      // ── Line annotations ───────────────────────────────────────────
      const line1 = new Line([1000, 300, 2500, 1200], {
        stroke: '#ff4444',
        strokeWidth: 3,
        selectable: false,
        evented: false,
      });

      const line2 = new Line([3000, 600, 4500, 2500], {
        stroke: '#4444ff',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      // ── Polyline (open path) ───────────────────────────────────────
      const polyline1 = new Polyline(
        [
          { x: 200, y: 1500 },
          { x: 600, y: 1200 },
          { x: 1000, y: 1600 },
          { x: 1400, y: 1300 },
          { x: 1800, y: 1700 },
        ],
        {
          fill: 'transparent',
          stroke: '#00cccc',
          strokeWidth: 3,
          selectable: false,
          evented: false,
        },
      );

      // ── Scattered small markers (simulating point-like annotations) ─
      const markers = [
        { x: 600, y: 600 },
        { x: 1800, y: 400 },
        { x: 3200, y: 1000 },
        { x: 4200, y: 1800 },
        { x: 2500, y: 2500 },
        { x: 1000, y: 2800 },
        { x: 3800, y: 300 },
        { x: 700, y: 1800 },
      ].map(
        (pt) =>
          new Circle({
            left: pt.x - 15,
            top: pt.y - 15,
            radius: 15,
            fill: 'rgba(255, 100, 0, 0.6)',
            stroke: '#ff6400',
            strokeWidth: 2,
            selectable: false,
            evented: false,
          }),
      );

      // Add all annotations to canvas
      overlay.canvas.add(
        rect1, rect2, rect3,
        circle1, circle2, circle3,
        line1, line2,
        polyline1,
        ...markers,
      );
      overlay.canvas.requestRenderAll();
    });
  });

  onCleanup(() => {
    overlay?.destroy();
    viewer?.destroy();
  });

  return (
    <div style={{ width: '100vw', height: '100vh', margin: '0', padding: '0' }}>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '100%', position: 'relative' }}
      />
    </div>
  );
}

const root = document.getElementById('app');
if (root) {
  render(() => <App />, root);
}
