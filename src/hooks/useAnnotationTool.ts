import { createEffect, onCleanup } from 'solid-js';
import type { FabricObject } from 'fabric';
import type { FabricOverlay } from '../overlay/fabric-overlay.js';
import { AnnotationTool, ToolCallbacks, AddAnnotationParams } from '../core/tools/base-tool.js';
import { RectangleTool } from '../core/tools/rectangle-tool.js';
import { CircleTool } from '../core/tools/circle-tool.js';
import { LineTool } from '../core/tools/line-tool.js';
import { PointTool } from '../core/tools/point-tool.js';
import { PathTool } from '../core/tools/path-tool.js';
import { SelectTool } from '../core/tools/select-tool.js';
import { useAnnotator } from '../state/annotator-context.js';
import { AnnotationId, ImageId, Point, AnnotationType } from '../core/types.js';
import { getGeometryFromFabricObject, serializeFabricObject } from '../core/fabric-utils.js';
import '../core/fabric-module.js';

interface FabricPointerEvent {
  readonly e: MouseEvent | PointerEvent | TouchEvent;
  readonly scenePoint?: { readonly x: number; readonly y: number };
  readonly absolutePointer?: { readonly x: number; readonly y: number };
  readonly target?: FabricObject | null;
}

export function useAnnotationTool(
  overlay: () => FabricOverlay | undefined,
  imageId: () => ImageId | undefined,
  isActive: () => boolean
) {
  const { uiState, contextState, annotationState, constraintStatus, actions, activeToolKeyHandlerRef, shortcuts } = useAnnotator();

  // Auto-switch to select tool when active drawing tool becomes disabled (limit reached)
  createEffect(() => {
    const tool = uiState.activeTool;
    if (tool && tool !== 'select') {
      const status = constraintStatus();
      if (!status[tool as AnnotationType].enabled) {
        actions.setActiveTool('select');
      }
    }
  });

  // Handle object modification (resize, rotate, move) globally
  // This ensures updates are recorded regardless of which tool is active
  createEffect(() => {
    const ov = overlay();
    const imgId = imageId();

    if (!ov || !imgId) return;

    const handleObjectModified = (e: { target: FabricObject }) => {
      const obj = e.target;
      if (!obj || !obj.id) return;

      const annotationId = obj.id as AnnotationId;

      // Look up current annotation to get geometry type
      const currentAnnotation = annotationState.byImage[imgId]?.[annotationId];
      if (!currentAnnotation) return;

      const geometry = getGeometryFromFabricObject(obj, currentAnnotation.geometry.type);
      if (!geometry) return;

      const rawAnnotationData = serializeFabricObject(obj);

      actions.updateAnnotation(annotationId, imgId, { geometry, rawAnnotationData });
    };

    ov.canvas.on('object:modified', handleObjectModified);
    onCleanup(() => {
      ov.canvas.off('object:modified', handleObjectModified);
    });
  });

  createEffect(() => {
    const ov = overlay();
    const active = isActive();
    const type = uiState.activeTool;
    const imgId = imageId();

    if (!ov || !imgId) {
        return;
    }

    if (!active || !type) {
        ov.setMode('navigation');
        return;
    }

    // Determine tool type
    let tool: AnnotationTool | null = null;
    switch (type) {
      case 'rectangle': tool = new RectangleTool(); break;
      case 'circle': tool = new CircleTool(); break;
      case 'line': tool = new LineTool(); break;
      case 'point': tool = new PointTool(); break;
      case 'path': tool = new PathTool(); break;
      case 'select': tool = new SelectTool(); break;
      default: tool = null;
    }

    if (!tool) {
        ov.setMode('navigation');
        return;
    }

    // Construct callbacks from context
    const callbacks: ToolCallbacks = {
      getActiveContextId: () => contextState.activeContextId,
      getToolConstraint: (toolType) => {
        const activeContextId = contextState.activeContextId;
        if (!activeContextId) return undefined;
        const activeContext = contextState.contexts.find(c => c.id === activeContextId);
        return activeContext?.tools.find(t => t.type === toolType);
      },
      canAddAnnotation: (toolType: AnnotationType) => {
        const status = constraintStatus();
        return status[toolType].enabled;
      },
      addAnnotation: (params: AddAnnotationParams) => {
        const { fabricObject, imageId: imgIdParam, contextId, type: annType, label, metadata } = params;

        // Read the annotation ID set by the tool via module augmentation
        const id = fabricObject.id as AnnotationId;

        // Derive geometry from the Fabric object
        const geometry = getGeometryFromFabricObject(fabricObject, annType);
        if (!geometry) {
          console.warn('Could not extract geometry from Fabric object');
          return;
        }

        // Serialize the Fabric object
        const rawAnnotationData = serializeFabricObject(fabricObject);

        actions.addAnnotation({
          id,
          imageId: imgIdParam,
          contextId,
          geometry,
          rawAnnotationData,
          label,
          metadata,
        });
      },
      updateAnnotation: (id: AnnotationId, imageIdArg: ImageId, fabricObject: FabricObject) => {
        // Look up current annotation to get geometry type
        const currentAnnotation = annotationState.byImage[imageIdArg]?.[id];
        if (!currentAnnotation) return;

        const geometry = getGeometryFromFabricObject(fabricObject, currentAnnotation.geometry.type);
        if (!geometry) return;

        const rawAnnotationData = serializeFabricObject(fabricObject);

        actions.updateAnnotation(id, imageIdArg, { geometry, rawAnnotationData });
      },
      deleteAnnotation: (id, imageIdArg) => actions.deleteAnnotation(id, imageIdArg),
      setSelectedAnnotation: (id) => actions.setSelectedAnnotation(id),
      getAnnotation: (id, imageIdArg) => {
        const imageAnns = annotationState.byImage[imageIdArg];
        return imageAnns?.[id];
      },
    };

    // Activate tool
    ov.setMode('annotation');
    tool.activate(ov, imgId, callbacks, shortcuts);

    const keyHandler = (e: KeyboardEvent) => tool!.onKeyDown(e);
    activeToolKeyHandlerRef.handler = keyHandler;

    const isDrawingTool = type !== 'select';

    // Track whether we suppressed mouse:down so we also suppress mouse:up
    let suppressedDown = false;

    // Handlers
    const handleDown = (opt: FabricPointerEvent) => {
        if (!tool) return;

        // For drawing tools, skip if the click landed on an existing annotation object.
        if (isDrawingTool && opt.target) {
            if (opt.target.id) {
                suppressedDown = true;
                return;
            }
        }

        suppressedDown = false;
        const p = getScenePoint(ov, opt);
        tool.onPointerDown(opt.e as PointerEvent, p);
    };

    const handleMove = (opt: FabricPointerEvent) => {
        if (!tool || suppressedDown) return;
        const p = getScenePoint(ov, opt);
        tool.onPointerMove(opt.e as PointerEvent, p);
    };

    const handleUp = (opt: FabricPointerEvent) => {
        if (!tool || suppressedDown) {
            suppressedDown = false;
            return;
        }
        const p = getScenePoint(ov, opt);
        tool.onPointerUp(opt.e as PointerEvent, p);
    };

    ov.canvas.on('mouse:down', handleDown);
    ov.canvas.on('mouse:move', handleMove);
    ov.canvas.on('mouse:up', handleUp);

    onCleanup(() => {
        if (activeToolKeyHandlerRef.handler === keyHandler) {
            activeToolKeyHandlerRef.handler = null;
        }
        ov.canvas.off('mouse:down', handleDown);
        ov.canvas.off('mouse:move', handleMove);
        ov.canvas.off('mouse:up', handleUp);
        if (tool) {
            tool.deactivate();
        }
    });
  });
}

function getScenePoint(overlay: FabricOverlay, opt: FabricPointerEvent): Point {
    if (opt.scenePoint) {
        return opt.scenePoint;
    }
    if (opt.absolutePointer) {
        return opt.absolutePointer;
    }
    const mouseEvent = opt.e as MouseEvent;
    return overlay.screenToImage({ x: mouseEvent.offsetX, y: mouseEvent.offsetY });
}
