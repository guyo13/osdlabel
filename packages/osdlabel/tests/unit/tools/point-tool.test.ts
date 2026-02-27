import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PointTool } from '../../../src/core/tools/point-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { ToolCallbacks, AddAnnotationParams } from '../../../src/core/tools/base-tool.js';
import {
  createAnnotationContextId,
  createImageId,
  KeyboardShortcutMap,
} from '../../../src/core/types.js';
import { Circle } from 'fabric';
import { DEFAULT_KEYBOARD_SHORTCUTS } from '../../../src/hooks/useKeyboard.js';

describe('PointTool', () => {
  let tool: PointTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    requestRenderAll: ReturnType<typeof vi.fn>;
    getZoom: ReturnType<typeof vi.fn>;
  };
  let mockCallbacks: ToolCallbacks;
  let addedParams: AddAnnotationParams[];
  const imageId = createImageId('test-image');
  const contextId = createAnnotationContextId('test-context');
  const mockShortcuts: KeyboardShortcutMap = { ...DEFAULT_KEYBOARD_SHORTCUTS };

  beforeEach(() => {
    vi.clearAllMocks();
    addedParams = [];

    mockCanvas = {
      add: vi.fn(),
      remove: vi.fn(),
      requestRenderAll: vi.fn(),
      getZoom: vi.fn().mockReturnValue(1),
    };

    mockOverlay = {
      canvas: mockCanvas,
    } as unknown as FabricOverlay;

    mockCallbacks = {
      getActiveContextId: () => contextId,
      getToolConstraint: (type) => ({ type }),
      canAddAnnotation: () => true,
      addAnnotation: (params) => {
        addedParams.push(params);
      },
      updateAnnotation: vi.fn(),
      deleteAnnotation: vi.fn(),
      setSelectedAnnotation: vi.fn(),
      getAnnotation: vi.fn().mockReturnValue(undefined),
    };
  });

  it('should create preview on pointer down and add to canvas', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 30, y: 30 });

    // Preview is added to canvas
    expect(mockCanvas.add).toHaveBeenCalled();
    const preview = mockCanvas.add.mock.calls[0][0];
    expect(preview).toBeInstanceOf(Circle);
    expect(preview.left).toBe(30);
    expect(preview.top).toBe(30);

    // Not committed yet — committed on pointer up
    expect(addedParams).toHaveLength(0);
  });

  it('should update position on pointer move (drag)', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 30, y: 30 });

    expect(preview.left).toBe(30);
    expect(preview.top).toBe(30);
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should commit annotation on pointer up with fabricObject', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 30, y: 30 });
    tool.onPointerUp({ type: 'pointerup' } as PointerEvent, { x: 30, y: 30 });

    expect(addedParams).toHaveLength(1);
    const params = addedParams[0]!;

    expect(params.type).toBe('point');
    expect(params.imageId).toBe(imageId);
    expect(params.contextId).toBe(contextId);
    expect(params.fabricObject).toBeInstanceOf(Circle);

    // Object stays on canvas
    expect(mockCanvas.remove).not.toHaveBeenCalled();
  });

  it('should allow drag-to-reposition before commit', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerUp({ type: 'pointerup' } as PointerEvent, { x: 50, y: 50 });

    expect(addedParams).toHaveLength(1);
    const preview = mockCanvas.add.mock.calls[0][0];
    expect(preview.left).toBe(50);
    expect(preview.top).toBe(50);
  });

  it('should not create annotation when no active context', () => {
    const noContextCallbacks: ToolCallbacks = {
      ...mockCallbacks,
      getActiveContextId: () => null,
    };

    tool = new PointTool();
    tool.activate(mockOverlay, imageId, noContextCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 30, y: 30 });

    expect(addedParams).toHaveLength(0);
    expect(mockCanvas.add).not.toHaveBeenCalled();
  });

  it('should cancel and remove preview on cancel()', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 30, y: 30 });
    expect(mockCanvas.add).toHaveBeenCalled();

    tool.cancel();
    expect(mockCanvas.remove).toHaveBeenCalled();
    expect(addedParams).toHaveLength(0);
  });
});
