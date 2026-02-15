import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PathTool } from '../../../src/core/tools/path-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { createImageId, createAnnotationContextId, AnnotationType } from '../../../src/core/types.js';
import { Polyline } from 'fabric';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { DEFAULT_ANNOTATION_STYLE } from '../../../src/core/constants.js';

describe('PathTool', () => {
  let tool: PathTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: any;
  let mockCallbacks: ToolCallbacks;
  const imageId = createImageId('test-image');
  const contextId = createAnnotationContextId('test-context');

  beforeEach(() => {
    vi.clearAllMocks();

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
        addAnnotation: vi.fn(),
        updateAnnotation: vi.fn(),
        deleteAnnotation: vi.fn(),
        getActiveContextId: vi.fn().mockReturnValue(contextId),
        getAnnotationStyle: vi.fn().mockReturnValue(DEFAULT_ANNOTATION_STYLE),
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
    // Should have 2 points: start and current pointer
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

    // First click
    const event1 = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event1, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    // Move
    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    // Second click (adds point at 50,50 and starts new segment)
    const event2 = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event2, { x: 50, y: 50 });

    expect(preview.points.length).toBe(3);
    expect(preview.points[0]).toEqual({ x: 10, y: 10 });
    expect(preview.points[1]).toEqual({ x: 50, y: 50 });
    expect(preview.points[2]).toEqual({ x: 50, y: 50 }); // New segment start
  });

  it('should finish path on double click', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    // Start
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });

    // Move and Click
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 50, y: 50 });

    // Double click to finish
    tool.onPointerDown({ type: 'pointerdown', detail: 2 } as PointerEvent, { x: 50, y: 50 });

    expect(mockCallbacks.addAnnotation).toHaveBeenCalled();
    const ann = (mockCallbacks.addAnnotation as any).mock.calls[0][0];

    expect(ann.geometry.type).toBe('path');
    expect(ann.geometry.points[0]).toEqual({ x: 10, y: 10 });
    expect(ann.geometry.points[1]).toEqual({ x: 50, y: 50 });

    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should finish path on Enter key', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 50, y: 50 });

    tool.onKeyDown({ key: 'Enter' } as KeyboardEvent);

    expect(mockCallbacks.addAnnotation).toHaveBeenCalled();
    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  // Edge cases
  it('should cancel path if only one point', () => {
    tool = new PathTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onKeyDown({ key: 'Enter' } as KeyboardEvent);

    expect(mockCallbacks.addAnnotation).not.toHaveBeenCalled();
    expect(mockCanvas.remove).toHaveBeenCalled();
  });
});
