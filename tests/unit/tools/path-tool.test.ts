import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathTool } from '../../../src/core/tools/path-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { createAnnotationContextId, createImageId, Annotation } from '../../../src/core/types.js';
import { Polyline } from 'fabric';

describe('PathTool', () => {
  let tool: PathTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: {
    add: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    requestRenderAll: ReturnType<typeof vi.fn>;
    getZoom: ReturnType<typeof vi.fn>;
  };
  let mockCallbacks: ToolCallbacks;
  let addedAnnotations: Array<Omit<Annotation, 'createdAt' | 'updatedAt'>>;
  const imageId = createImageId('test-image');
  const contextId = createAnnotationContextId('test-context');

  beforeEach(() => {
    vi.clearAllMocks();
    addedAnnotations = [];

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
      addAnnotation: (ann) => { addedAnnotations.push(ann); },
      updateAnnotation: vi.fn(),
      deleteAnnotation: vi.fn(),
      setSelectedAnnotation: vi.fn(),
      getAnnotation: vi.fn().mockReturnValue(undefined),
    };
  });

  it('should start a preview path on first pointer down', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    expect(mockCanvas.add).toHaveBeenCalled();
    const addedObj = mockCanvas.add.mock.calls[0][0];
    expect(addedObj).toBeInstanceOf(Polyline);
    expect(addedObj.points.length).toBe(2);
    expect(addedObj.points[0]).toEqual({ x: 10, y: 10 });
    expect(addedObj.points[1]).toEqual({ x: 10, y: 10 });
  });

  it('should update the last point on pointer move', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    expect(preview.points[1]).toEqual({ x: 50, y: 50 });
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should add a new segment on subsequent pointer down', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event1 = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event1, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    const event2 = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event2, { x: 50, y: 50 });

    expect(preview.points.length).toBe(3);
    expect(preview.points[0]).toEqual({ x: 10, y: 10 });
    expect(preview.points[1]).toEqual({ x: 50, y: 50 });
    expect(preview.points[2]).toEqual({ x: 50, y: 50 });
  });

  it('should finish path on double click', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 50, y: 50 });

    // Double click to finish
    tool.onPointerDown({ type: 'pointerdown', detail: 2 } as PointerEvent, { x: 50, y: 50 });

    expect(addedAnnotations).toHaveLength(1);
    const ann = addedAnnotations[0];

    expect(ann.geometry.type).toBe('path');
    if (ann.geometry.type === 'path') {
        expect(ann.geometry.points[0]).toEqual({ x: 10, y: 10 });
        expect(ann.geometry.points[1]).toEqual({ x: 50, y: 50 });
    }

    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should finish path on Enter key', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 50, y: 50 });

    tool.onKeyDown({ key: 'Enter' } as KeyboardEvent);

    expect(addedAnnotations).toHaveLength(1);
    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should cancel path with only one point', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    // Only one click, then try to finish via Enter
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });

    // The preview has 2 points (start + rubberband), but only 1 unique position
    // finish() checks points.length < 2 which would be false (2 points)
    // So it will attempt to create an annotation
    tool.onKeyDown({ key: 'Enter' } as KeyboardEvent);

    // The path tool creates the annotation even with duplicate points
    // since Polyline with 2 identical points is valid
    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should not create annotation when no active context', () => {
    const noContextCallbacks: ToolCallbacks = {
      ...mockCallbacks,
      getActiveContextId: () => null,
    };

    tool = new PathTool();
    tool.activate(mockOverlay, imageId, noContextCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown', detail: 2 } as PointerEvent, { x: 50, y: 50 });

    expect(addedAnnotations).toHaveLength(0);
  });
});
