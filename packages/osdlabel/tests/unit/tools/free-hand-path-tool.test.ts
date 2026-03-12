import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FreeHandPathTool } from '../../../src/core/tools/free-hand-path-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { ToolCallbacks, AddAnnotationParams } from '../../../src/core/tools/base-tool.js';
import {
  createAnnotationContextId,
  createImageId,
  KeyboardShortcutMap,
} from '../../../src/core/types.js';
import { Polyline, Polygon } from 'fabric';
import { DEFAULT_KEYBOARD_SHORTCUTS } from '../../../src/hooks/useKeyboard.js';

describe('FreeHandPathTool', () => {
  let tool: FreeHandPathTool;
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
  const mockShortcuts: KeyboardShortcutMap = {
    ...DEFAULT_KEYBOARD_SHORTCUTS,
  };

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
      imageToScreen: vi.fn((p: { x: number; y: number }) => p),
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

  it('should start a preview path on pointer down', () => {
    tool = new FreeHandPathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    expect(mockCanvas.add).toHaveBeenCalled();
    const addedObj = mockCanvas.add.mock.calls[0][0];
    expect(addedObj).toBeInstanceOf(Polyline);
    expect(addedObj.points.length).toBe(2);
    expect(addedObj.points[0]).toEqual({ x: 10, y: 10 });
    expect(addedObj.points[1]).toEqual({ x: 10, y: 10 });
  });

  it('should add points on pointer move when distance exceeds threshold', () => {
    tool = new FreeHandPathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    
    // Move slightly (within 3px threshold in mock)
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 11, y: 11 });
    const preview = mockCanvas.add.mock.calls[0][0];
    expect(preview.points.length).toBe(2);
    expect(preview.points[1]).toEqual({ x: 10, y: 10 }); // Still the initial point

    // Move further (exceeds 3px threshold)
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 20, y: 20 });
    expect(preview.points.length).toBe(2);
    expect(preview.points[0]).toEqual({ x: 10, y: 10 });
    expect(preview.points[1]).toEqual({ x: 20, y: 20 });

    // Move again
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 30, y: 30 });
    expect(preview.points.length).toBe(3);
    expect(preview.points[2]).toEqual({ x: 30, y: 30 });
  });

  it('should finish as Polygon (closed) by default on pointer up', () => {
    tool = new FreeHandPathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerUp({ type: 'pointerup', shiftKey: false } as PointerEvent, { x: 50, y: 50 });

    expect(addedParams).toHaveLength(1);
    const params = addedParams[0]!;
    expect(params.type).toBe('freeHandPath');
    expect(params.fabricObject).toBeInstanceOf(Polygon);
  });

  it('should finish as Polyline (open) if Shift is held on pointer up', () => {
    tool = new FreeHandPathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 10 });
    tool.onPointerUp({ type: 'pointerup', shiftKey: true } as PointerEvent, { x: 50, y: 10 });

    expect(addedParams).toHaveLength(1);
    const params = addedParams[0]!;
    expect(params.type).toBe('freeHandPath');
    expect(params.fabricObject).toBeInstanceOf(Polyline);
    expect(params.fabricObject).not.toBeInstanceOf(Polygon);
  });

  it('should cancel on Escape key while drawing', () => {
    tool = new FreeHandPathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    const result = tool.onKeyDown({ key: 'Escape' } as KeyboardEvent);
    expect(result).toBe(true);

    expect(addedParams).toHaveLength(0);
    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should not create annotation if too few points (closed case)', () => {
    tool = new FreeHandPathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    // Only two points
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 20, y: 20 });
    tool.onPointerUp({ type: 'pointerup', shiftKey: false } as PointerEvent, { x: 20, y: 20 });

    expect(addedParams).toHaveLength(0);
    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should create annotation with two points (open case)', () => {
    tool = new FreeHandPathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks, mockShortcuts);

    // Two points
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 20, y: 20 });
    tool.onPointerUp({ type: 'pointerup', shiftKey: true } as PointerEvent, { x: 20, y: 20 });

    expect(addedParams).toHaveLength(1);
    expect(addedParams[0]!.fabricObject).toBeInstanceOf(Polyline);
  });
});
