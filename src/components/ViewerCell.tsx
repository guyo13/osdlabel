import { onMount, onCleanup, createEffect, on } from 'solid-js';
import type { Component } from 'solid-js';
import OpenSeadragon from 'openseadragon';
import { createFabricOverlay } from '../overlay/fabric-overlay.js';
import type { FabricOverlay, OverlayMode } from '../overlay/fabric-overlay.js';
import type { ImageSource } from '../core/types.js';

export interface ViewerCellProps {
  readonly imageSource: ImageSource | undefined;
  readonly isActive: boolean;
  readonly mode?: OverlayMode;
  readonly onActivate: () => void;
  readonly onOverlayReady?: (overlay: FabricOverlay) => void;
}

const ViewerCell: Component<ViewerCellProps> = (props) => {
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
    });

    viewer.addHandler('open', () => {
      if (!viewer || overlay) return;
      overlay = createFabricOverlay(viewer);
      // Apply current mode
      overlay.setMode(props.mode ?? 'navigation');
      props.onOverlayReady?.(overlay);
    });

    // Open initial image if provided
    if (props.imageSource) {
      openImage(viewer, props.imageSource);
    }
  });

  onCleanup(() => {
    overlay?.destroy();
    overlay = undefined;
    viewer?.destroy();
    viewer = undefined;
  });

  // Watch for image source changes
  createEffect(on(
    () => props.imageSource?.dziUrl,
    (url, prevUrl) => {
      if (url !== prevUrl && viewer) {
        viewer.close();
        if (props.imageSource) {
          openImage(viewer, props.imageSource);
        }
      }
    },
    { defer: true },
  ));

  // Watch for mode changes
  createEffect(() => {
    const mode = props.mode ?? 'navigation';
    overlay?.setMode(mode);
  });

  return (
    <div
      ref={containerRef}
      onClick={() => props.onActivate()}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        'box-sizing': 'border-box',
        border: props.isActive ? '2px solid #2196F3' : '2px solid transparent',
      }}
    />
  );
};

function openImage(viewer: OpenSeadragon.Viewer, source: ImageSource): void {
  const url = source.dziUrl;
  // If URL ends with .dzi, use it directly; otherwise use type: 'image'
  if (url.endsWith('.dzi')) {
    viewer.open(url);
  } else {
    viewer.open({ type: 'image', url });
  }
}

export default ViewerCell;
