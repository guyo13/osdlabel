import { onMount, onCleanup, createEffect, on, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import OpenSeadragon from 'openseadragon';
import { FabricOverlay } from '../overlay/fabric-overlay.js';
import type { OverlayMode } from '../overlay/fabric-overlay.js';
import type { ImageSource } from '../core/types.js';
import { useAnnotationTool } from '../hooks/useAnnotationTool.js';
import { useAnnotator } from '../state/annotator-context.js';
import { createFabricObjectFromRawData } from '../core/fabric-utils.js';
import '../core/fabric-module.js';

export interface ViewerCellProps {
  readonly imageSource: ImageSource | undefined;
  readonly isActive: boolean;
  readonly mode?: OverlayMode;
  readonly onActivate: () => void;
  readonly onOverlayReady?: (overlay: FabricOverlay) => void;
}

const ViewerCell: Component<ViewerCellProps> = (props) => {
  const { annotationState, contextState } = useAnnotator();
  let containerRef: HTMLDivElement | undefined;
  let viewer: OpenSeadragon.Viewer | undefined;
  const [overlay, setOverlay] = createSignal<FabricOverlay>();

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
      if (!viewer || overlay()) return;
      const ov = new FabricOverlay(viewer);
      setOverlay(ov);
      props.onOverlayReady?.(ov);
    });

    // Open initial image if provided
    if (props.imageSource) {
      openImage(viewer, props.imageSource);
    }
  });

  onCleanup(() => {
    const ov = overlay();
    ov?.destroy();
    setOverlay(undefined);
    viewer?.destroy();
    viewer = undefined;
  });

  // Watch for image source changes
  createEffect(
    on(
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
    ),
  );

  // Use annotation tool hook
  useAnnotationTool(
    overlay,
    () => props.imageSource?.id,
    () => props.isActive,
  );

  // Sync annotations from state to canvas (full clear-and-reload)
  createEffect(() => {
    const ov = overlay();
    const imageId = props.imageSource?.id;
    const contextId = contextState.activeContextId;
    // Track these as reactive dependencies so the effect re-runs
    void props.isActive;
    void annotationState.reloadGeneration;

    if (!ov || !imageId) return;

    // Filter annotations by imageId + contextId
    const imageAnns = annotationState.byImage[imageId] || {};
    const matching = contextId
      ? Object.values(imageAnns).filter((a) => a.contextId === contextId)
      : Object.values(imageAnns);

    // Clear all existing annotation objects from canvas
    const toRemove = ov.canvas.getObjects().filter((obj) => obj.id);
    if (toRemove.length > 0) ov.canvas.remove(...toRemove);

    // Async load from rawAnnotationData
    const capturedImageId = imageId;
    void (async () => {
      const promises = matching.map((ann) => createFabricObjectFromRawData(ann));
      const objects = await Promise.all(promises);

      if (props.imageSource?.id !== capturedImageId) return; // stale check

      const validObjects = objects.filter((obj) => obj !== null);
      if (validObjects.length > 0) {
        ov.canvas.add(...validObjects);
      }
      ov.canvas.requestRenderAll();
    })();
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
  const isSimpleImage = /\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(url);

  if (isSimpleImage) {
    viewer.open({ type: 'image', url });
  } else {
    viewer.open(url);
  }
}

export default ViewerCell;
