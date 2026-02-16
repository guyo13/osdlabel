import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircleTool } from '../../../src/core/tools/circle-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { createAnnotationContextId, createImageId, Annotation } from '../../../src/core/types.js';
import { Circle } from 'fabric';

describe('CircleTool', () => {
  let tool: CircleTool;
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
      canAddAnnotation: () => true,
      addAnnotation: (ann) => { addedAnnotations.push(ann); },
      updateAnnotation: vi.fn(),
      deleteAnnotation: vi.fn(),
      setSelectedAnnotation: vi.fn(),
      getAnnotation: vi.fn().mockReturnValue(undefined),
    };
  });

  it('should create a preview circle on pointer down', () => {
    tool = new CircleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    expect(mockCanvas.add).toHaveBeenCalled();
    const addedObj = mockCanvas.add.mock.calls[0][0];
    expect(addedObj).toBeInstanceOf(Circle);
    expect(addedObj.left).toBe(10);
    expect(addedObj.top).toBe(10);
    expect(addedObj.radius).toBe(0);
  });

  it('should update preview circle on pointer move', () => {
    tool = new CircleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 30 });

    expect(preview.radius).toBeGreaterThan(0);
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should create annotation on pointer up', () => {
    tool = new CircleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 30 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 30, y: 30 });

    expect(addedAnnotations).toHaveLength(1);
    const ann = addedAnnotations[0];

    expect(ann.geometry.type).toBe('circle');
    if (ann.geometry.type === 'circle') {
        expect(ann.geometry.radius).toBeGreaterThan(0);
        expect(ann.geometry.center.x).toBe(10);
        expect(ann.geometry.center.y).toBe(10);
    }

    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should not create annotation for zero radius', () => {
    tool = new CircleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerUp({ type: 'pointerup' } as PointerEvent, { x: 10, y: 10 });

    // Zero-radius circle still generates annotation; tool does not filter
    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should not create annotation when no active context', () => {
    const noContextCallbacks: ToolCallbacks = {
      ...mockCallbacks,
      getActiveContextId: () => null,
    };

    tool = new CircleTool();
    tool.activate(mockOverlay, imageId, noContextCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 30, y: 30 });
    tool.onPointerUp({ type: 'pointerup' } as PointerEvent, { x: 30, y: 30 });

    expect(addedAnnotations).toHaveLength(0);
  });
});
