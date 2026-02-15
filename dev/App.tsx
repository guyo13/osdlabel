import { render } from 'solid-js/web';
import { onMount, onCleanup } from 'solid-js';
import OpenSeadragon from 'openseadragon';
import { Rect } from 'fabric';
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
      tileSources: {
        type: 'image',
        url: '/sample-data/test-image.jpg',
      },
    });

    viewer.addHandler('open', () => {
      if (!viewer) return;

      overlay = createFabricOverlay(viewer);

      // Add a hardcoded red rectangle at image-space coordinates
      const rect = new Rect({
        left: 100,
        top: 100,
        width: 200,
        height: 200,
        fill: 'rgba(255, 0, 0, 0.3)',
        stroke: '#ff0000',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      });

      overlay.canvas.add(rect);
      overlay.canvas.requestRenderAll();
    });
  });

  onCleanup(() => {
    overlay?.destroy();
    viewer?.destroy();
  });

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
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
