import { onMount, onCleanup, createEffect, on, createSignal } from 'solid-js';
import type { Component } from 'solid-js';
import OpenSeadragon from 'openseadragon';
import { FabricObject } from 'fabric';
import { FabricOverlay } from '../overlay/fabric-overlay.js';
import type { OverlayMode } from '../overlay/fabric-overlay.js';
import type { ImageSource } from '../core/types.js';
import { useAnnotationTool } from '../hooks/useAnnotationTool.js';
import { useAnnotator } from '../state/annotator-context.js';
import { AnnotatedFabricObject } from '../core/tools/base-tool.js';
import { createFabricObjectFromAnnotation, updateFabricObjectFromAnnotation } from '../core/fabric-utils.js';

export interface ViewerCellProps {
  readonly imageSource: ImageSource | undefined;
  readonly isActive: boolean;
  readonly mode?: OverlayMode;
  readonly onActivate: () => void;
  readonly onOverlayReady?: (overlay: FabricOverlay) => void;
}

const ViewerCell: Component<ViewerCellProps> = (props) => {
  const { annotationState } = useAnnotator();
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

  // Use annotation tool hook
  useAnnotationTool(
      overlay,
      () => props.imageSource?.id,
      () => props.isActive
  );

  // Sync annotations from state to canvas
  createEffect(() => {
      const ov = overlay();
      const imageId = props.imageSource?.id;
      if (!ov || !imageId) return;

      const imageAnns = annotationState.byImage[imageId] || {};
      const canvas = ov.canvas;

      // Map existing objects by annotationId
      const currentObjects = new Map<string, FabricObject>();
      const objectsToRemove: FabricObject[] = [];

      for (const obj of canvas.getObjects()) {
          const annotatedObj = obj as AnnotatedFabricObject;
          if (annotatedObj.annotationId) {
              currentObjects.set(annotatedObj.annotationId, obj);
          }
      }

      const activeIds = new Set<string>();

      // Update or create objects
      for (const ann of Object.values(imageAnns)) {
          activeIds.add(ann.id);
          const obj = currentObjects.get(ann.id);

          if (!obj) {
              // Create
              const newObj = createFabricObjectFromAnnotation(ann);
              if (newObj) {
                  (newObj as AnnotatedFabricObject).updatedAt = ann.updatedAt;
                  canvas.add(newObj);
              }
          } else {
              // Update if changed
              if ((obj as AnnotatedFabricObject).updatedAt !== ann.updatedAt) {
                   const updatedInPlace = updateFabricObjectFromAnnotation(obj, ann);
                   if (updatedInPlace) {
                       (obj as AnnotatedFabricObject).updatedAt = ann.updatedAt;
                       obj.setCoords();
                   } else {
                       // Object needs replacement (e.g. Polyline <-> Polygon switch)
                       canvas.remove(obj);
                       const newObj = createFabricObjectFromAnnotation(ann);
                       if (newObj) {
                           (newObj as AnnotatedFabricObject).updatedAt = ann.updatedAt;
                           canvas.add(newObj);
                       }
                   }
              }
          }
      }

      // Remove deleted objects
      for (const [id, obj] of currentObjects) {
          if (!activeIds.has(id)) {
              objectsToRemove.push(obj);
          }
      }

      if (objectsToRemove.length > 0) {
          canvas.remove(...objectsToRemove);
      }

      canvas.requestRenderAll();
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
  if (url.endsWith('.dzi')) {
    viewer.open(url);
  } else {
    viewer.open({ type: 'image', url });
  }
}

export default ViewerCell;
