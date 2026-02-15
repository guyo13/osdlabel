import { Component, createSignal, createEffect, onCleanup } from 'solid-js';
import OpenSeadragon from 'openseadragon';
import { FabricOverlay } from '../overlay/fabric-overlay.js';
import { useAnnotationTool } from '../hooks/useAnnotationTool.js';
import { useAnnotator } from './AnnotatorProvider.js';
import { AnnotationType, ImageId, Annotation, createAnnotationId } from '../core/types.js';
import { ToolCallbacks } from '../core/tools/base-tool.js';

interface ViewerCellProps {
  imageId: ImageId;
  tileSource: string; // URL to DZI or image
}

export const ViewerCell: Component<ViewerCellProps> = (props) => {
  let containerRef: HTMLDivElement | undefined;

  // Use provider context
  const {
    state: annotationState,
    uiState,
    contextState,
    actions
  } = useAnnotator();

  const [overlay, setOverlay] = createSignal<FabricOverlay | undefined>(undefined);

  createEffect(() => {
    if (!containerRef) return;

    // Initialize OSD
    const osdViewer = OpenSeadragon({
      element: containerRef,
      tileSources: props.tileSource,
      prefixUrl: 'https://openseadragon.github.io/openseadragon/images/',
      showNavigationControl: false,
      animationTime: 0.5,
      blendTime: 0.1,
      constrainDuringPan: true,
      maxZoomPixelRatio: 2,
      minZoomImageRatio: 0.5,
      visibilityRatio: 1,
      zoomPerScroll: 1.2,
    });

    // Initialize Fabric Overlay
    const fabricOverlay = new FabricOverlay(osdViewer);
    setOverlay(fabricOverlay);

    onCleanup(() => {
      fabricOverlay.destroy();
      osdViewer.destroy();
    });
  });

  // Sync annotations from state to canvas
  createEffect(() => {
      const ov = overlay();
      const currentAnnotations = annotationState.byImage[props.imageId];

      if (!ov || !currentAnnotations) return;

      // Simple sync: clear and redraw (optimization: diffing)
      ov.canvas.clear();

      // TODO: Implement createFabricObjectFromAnnotation
      // Object.values(currentAnnotations).forEach(ann => {
      //    const obj = createFabricObjectFromAnnotation(ann);
      //    if (obj) ov.canvas.add(obj);
      // });

      ov.canvas.requestRenderAll();
  });

  // Define callbacks for tools
  const callbacks: ToolCallbacks = {
      addAnnotation: (annotationData: Omit<Annotation, 'createdAt' | 'updatedAt'>) => {
          const now = new Date().toISOString();
          const fullAnnotation: Annotation = {
              ...annotationData,
              createdAt: now,
              updatedAt: now,
          };
          actions.addAnnotation(fullAnnotation);
      },
      updateAnnotation: (id: string, patch: Partial<Annotation>) => {
          // Cast string to AnnotationId assuming tools pass valid IDs
          actions.updateAnnotation(createAnnotationId(id), props.imageId, patch);
      },
      deleteAnnotation: (id: string) => {
           // Cast string to AnnotationId
          actions.deleteAnnotation(createAnnotationId(id), props.imageId);
      },
      getActiveContextId: () => {
          return contextState.activeContextId;
      },
      getAnnotationStyle: (type: AnnotationType) => {
          const activeContextId = contextState.activeContextId;
          if (!activeContextId) {
            return { strokeColor: 'black', strokeWidth: 1, fillColor: 'transparent', fillOpacity: 0, opacity: 1 };
          }

          const context = contextState.contexts.find(c => c.id === activeContextId);
          const constraint = context?.tools.find(t => t.type === type);
          return {
              strokeColor: 'black',
              strokeWidth: 1,
              fillColor: 'transparent',
              fillOpacity: 0,
              opacity: 1,
              ...constraint?.defaultStyle
          };
      }
  };

  useAnnotationTool(
      overlay,
      () => uiState.activeTool,
      () => props.imageId,
      callbacks
  );

  return <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }} />;
};
