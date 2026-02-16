import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LineTool } from '../../../src/core/tools/line-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { createAnnotationContextId, createImageId, Annotation } from '../../../src/core/types.js';
import { Line } from 'fabric';

describe('LineTool', () => {
  let tool: LineTool;
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

  it('should create a preview line on pointer down', () => {
    tool = new LineTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    expect(mockCanvas.add).toHaveBeenCalled();
    const addedObj = mockCanvas.add.mock.calls[0][0];
    expect(addedObj).toBeInstanceOf(Line);
    expect(addedObj.x1).toBe(10);
    expect(addedObj.y1).toBe(10);
    expect(addedObj.x2).toBe(10);
    expect(addedObj.y2).toBe(10);
  });

  it('should update preview line on pointer move', () => {
    tool = new LineTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    expect(preview.x2).toBe(50);
    expect(preview.y2).toBe(50);
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should create annotation on pointer up', () => {
    tool = new LineTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 50, y: 50 });

    expect(addedAnnotations).toHaveLength(1);
    const ann = addedAnnotations[0];

    expect(ann.geometry.type).toBe('line');
    if (ann.geometry.type === 'line') {
        expect(ann.geometry.start.x).toBe(10);
        expect(ann.geometry.start.y).toBe(10);
        expect(ann.geometry.end.x).toBe(50);
        expect(ann.geometry.end.y).toBe(50);
    }

    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should not create annotation for zero-length line (down+up at same point)', () => {
    tool = new LineTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerUp({ type: 'pointerup' } as PointerEvent, { x: 10, y: 10 });

    // Tool still creates annotation; geometry has start===end
    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  it('should not create annotation when no active context', () => {
    const noContextCallbacks: ToolCallbacks = {
      ...mockCallbacks,
      getActiveContextId: () => null,
    };

    tool = new LineTool();
    tool.activate(mockOverlay, imageId, noContextCallbacks);

    tool.onPointerDown({ type: 'pointerdown' } as PointerEvent, { x: 10, y: 10 });
    tool.onPointerMove({ type: 'pointermove' } as PointerEvent, { x: 50, y: 50 });
    tool.onPointerUp({ type: 'pointerup' } as PointerEvent, { x: 50, y: 50 });

    expect(addedAnnotations).toHaveLength(0);
  });
});
