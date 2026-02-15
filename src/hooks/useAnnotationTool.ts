import { createSignal, createEffect, onCleanup } from 'solid-js';
import type { FabricOverlay } from '../overlay/fabric-overlay.js';
import type { AnnotationType, ImageId } from '../core/types.js';
import { BaseTool, ToolCallbacks } from '../core/tools/base-tool.js';
import { RectangleTool } from '../core/tools/rectangle-tool.js';
import { CircleTool } from '../core/tools/circle-tool.js';
import { LineTool } from '../core/tools/line-tool.js';
import { PointTool } from '../core/tools/point-tool.js';
import { PathTool } from '../core/tools/path-tool.js';
import { SelectTool } from '../core/tools/select-tool.js';
import { TPointerEventInfo } from 'fabric';

export function useAnnotationTool(
  overlay: () => FabricOverlay | undefined,
  activeToolType: () => AnnotationType | 'select' | null,
  imageId: () => ImageId | undefined,
  callbacks: ToolCallbacks
) {
  const [activeTool, setActiveTool] = createSignal<BaseTool | null>(null);

  createEffect(() => {
    const type = activeToolType();
    const ov = overlay();
    const imgId = imageId();

    activeTool()?.deactivate();
    setActiveTool(null);

    if (!type || !ov || !imgId) {
      ov?.setMode('navigation');
      return;
    }

    let tool: BaseTool | null = null;
    switch (type) {
      case 'rectangle':
        tool = new RectangleTool();
        break;
      case 'circle':
        tool = new CircleTool();
        break;
      case 'line':
        tool = new LineTool();
        break;
      case 'point':
        tool = new PointTool();
        break;
      case 'path':
        tool = new PathTool();
        break;
      case 'select':
        tool = new SelectTool();
        break;
    }

    if (tool) {
      tool.activate(ov, imgId, callbacks);
      setActiveTool(tool);
      ov.setMode('annotation');
    }
  });

  createEffect(() => {
    const tool = activeTool();
    const ov = overlay();

    if (!tool || !ov) return;

    const handleDown = (opt: TPointerEventInfo) => {
        // Fabric 6/7 Canvas has getPointer
        const pointer = (ov.canvas as any).getPointer(opt.e);
        tool.onPointerDown(opt.e as PointerEvent, { x: pointer.x, y: pointer.y });
    };

    const handleMove = (opt: TPointerEventInfo) => {
        const pointer = (ov.canvas as any).getPointer(opt.e);
        tool.onPointerMove(opt.e as PointerEvent, { x: pointer.x, y: pointer.y });
    };

    const handleUp = (opt: TPointerEventInfo) => {
        const pointer = (ov.canvas as any).getPointer(opt.e);
        tool.onPointerUp(opt.e as PointerEvent, { x: pointer.x, y: pointer.y });
    };

    ov.canvas.on('mouse:down', handleDown);
    ov.canvas.on('mouse:move', handleMove);
    ov.canvas.on('mouse:up', handleUp);

    onCleanup(() => {
        ov.canvas.off('mouse:down', handleDown);
        ov.canvas.off('mouse:move', handleMove);
        ov.canvas.off('mouse:up', handleUp);
    });
  });

  createEffect(() => {
      const tool = activeTool();
      if (!tool) return;

      const handleKeyDown = (e: KeyboardEvent) => {
          tool.onKeyDown(e);
      };

      window.addEventListener('keydown', handleKeyDown);
      onCleanup(() => window.removeEventListener('keydown', handleKeyDown));
  });

  return activeTool;
}
