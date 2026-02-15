import { createEffect, onCleanup } from 'solid-js';
import type { FabricOverlay } from '../overlay/fabric-overlay.js';
import { AnnotationTool } from '../core/tools/base-tool.js';
import { RectangleTool } from '../core/tools/rectangle-tool.js';
import { CircleTool } from '../core/tools/circle-tool.js';
import { LineTool } from '../core/tools/line-tool.js';
import { PointTool } from '../core/tools/point-tool.js';
import { PathTool } from '../core/tools/path-tool.js';
import { SelectTool } from '../core/tools/select-tool.js';
import { uiState } from '../state/store.js';
import { ImageId, Point } from '../core/types.js';

export function useAnnotationTool(
  overlay: () => FabricOverlay | undefined,
  imageId: () => ImageId | undefined,
  isActive: () => boolean
) {
  createEffect(() => {
    const ov = overlay();
    const active = isActive();
    const type = uiState.activeTool; // Read from store
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

    // Activate tool
    ov.setMode('annotation');
    tool.activate(ov, imgId);

    // Handlers
    const handleDown = (opt: any) => {
        if (!tool) return;
        const p = getScenePoint(ov, opt);
        tool.onPointerDown(opt.e, p);
    };

    const handleMove = (opt: any) => {
        if (!tool) return;
        const p = getScenePoint(ov, opt);
        tool.onPointerMove(opt.e, p);
    };

    const handleUp = (opt: any) => {
        if (!tool) return;
        const p = getScenePoint(ov, opt);
        tool.onPointerUp(opt.e, p);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (tool && tool.onKeyDown) {
            tool.onKeyDown(e);
        }
    };

    ov.canvas.on('mouse:down', handleDown);
    ov.canvas.on('mouse:move', handleMove);
    ov.canvas.on('mouse:up', handleUp);

    // Attach keydown to window (or verify if we need to scope it)
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

function getScenePoint(overlay: FabricOverlay, opt: any): Point {
    // Fabric v6+ provides scenePoint (absolutePointer in image coordinates if viewportTransform is set)
    if (opt.scenePoint) {
        return opt.scenePoint;
    }
    // Fallback if scenePoint is missing (older fabric or different event)
    // opt.absolutePointer usually holds the point in scene coordinates (transformed by viewportTransform)
    if (opt.absolutePointer) {
        return opt.absolutePointer;
    }

    // Final fallback: use overlay.screenToImage with clientX/Y
    // But we need coordinate relative to viewer element.
    // Fabric event has e.offsetX/Y which are relative to canvas.
    // Since canvas matches viewer element, offsetX/Y are viewer element coordinates.
    // screenToImage expects viewer element coordinates?
    // FabricOverlay.screenToImage expects "screenPoint".
    // "screenToImage(screenPoint: Point): Point { ... viewerElementToImageCoordinates ... }"
    // OSD `viewerElementToImageCoordinates` expects coordinates relative to the viewer element.
    // So if we pass {x: opt.e.offsetX, y: opt.e.offsetY}, it should work.
    // Unless Fabric uses different offsets.

    return overlay.screenToImage({ x: opt.e.offsetX, y: opt.e.offsetY });
}
