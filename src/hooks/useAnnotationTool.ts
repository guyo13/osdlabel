import { createEffect, onCleanup } from 'solid-js';
import type { FabricObject } from 'fabric';
import type { FabricOverlay } from '../overlay/fabric-overlay.js';
import { AnnotationTool, ToolCallbacks, AnnotatedFabricObject } from '../core/tools/base-tool.js';
import { RectangleTool } from '../core/tools/rectangle-tool.js';
import { CircleTool } from '../core/tools/circle-tool.js';
import { LineTool } from '../core/tools/line-tool.js';
import { PointTool } from '../core/tools/point-tool.js';
import { PathTool } from '../core/tools/path-tool.js';
import { SelectTool } from '../core/tools/select-tool.js';
import { useAnnotator } from '../state/annotator-context.js';
import { ImageId, Point, AnnotationType } from '../core/types.js';

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
  const { uiState, contextState, annotationState, constraintStatus, actions } = useAnnotator();

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
      addAnnotation: (annotation) => actions.addAnnotation(annotation),
      updateAnnotation: (id, imageIdArg, patch) => actions.updateAnnotation(id, imageIdArg, patch),
      deleteAnnotation: (id, imageIdArg) => actions.deleteAnnotation(id, imageIdArg),
      setSelectedAnnotation: (id) => actions.setSelectedAnnotation(id),
      getAnnotation: (id, imageIdArg) => {
        const imageAnns = annotationState.byImage[imageIdArg];
        return imageAnns?.[id];
      },
    };

    // Activate tool
    ov.setMode('annotation');
    tool.activate(ov, imgId, callbacks);

    const isDrawingTool = type !== 'select';

    // Track whether we suppressed mouse:down so we also suppress mouse:up
    let suppressedDown = false;

    // Handlers
    const handleDown = (opt: FabricPointerEvent) => {
        if (!tool) return;

        // For drawing tools, skip if the click landed on an existing annotation object.
        // This allows Fabric's built-in selection/move to handle the interaction instead
        // of accidentally starting a new drawing on top of an existing annotation.
        if (isDrawingTool && opt.target) {
            const annotatedTarget = opt.target as AnnotatedFabricObject;
            if (annotatedTarget.annotationId) {
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

    const handleKeyDown = (e: KeyboardEvent) => {
        if (tool && tool.onKeyDown) {
            tool.onKeyDown(e);
        }
    };

    ov.canvas.on('mouse:down', handleDown);
    ov.canvas.on('mouse:move', handleMove);
    ov.canvas.on('mouse:up', handleUp);

    window.addEventListener('keydown', handleKeyDown);

    onCleanup(() => {
        ov.canvas.off('mouse:down', handleDown);
        ov.canvas.off('mouse:move', handleMove);
        ov.canvas.off('mouse:up', handleUp);
        window.removeEventListener('keydown', handleKeyDown);
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
