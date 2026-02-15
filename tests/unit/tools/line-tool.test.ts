import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LineTool } from '../../../src/core/tools/line-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { createImageId, createAnnotationContextId, AnnotationType } from '../../../src/core/types.js';
import { Line } from 'fabric';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { DEFAULT_ANNOTATION_STYLE } from '../../../src/core/constants.js';

describe('LineTool', () => {
  let tool: LineTool;
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

    expect(mockCallbacks.addAnnotation).toHaveBeenCalled();
    const ann = (mockCallbacks.addAnnotation as any).mock.calls[0][0];

    expect(ann.geometry.type).toBe('line');
    // For a line created from 10,10 to 50,50:
    // cx, cy = 30, 30
    // x1, y1 = 10, 10
    // x2, y2 = 50, 50
    // If not transformed, start should be 10,10 end 50,50
    expect(ann.geometry.start.x).toBe(10);
    expect(ann.geometry.start.y).toBe(10);
    expect(ann.geometry.end.x).toBe(50);
    expect(ann.geometry.end.y).toBe(50);

    expect(mockCanvas.remove).toHaveBeenCalled();
  });

  // Edge cases
  it('should not create annotation if length is zero', () => {
    tool = new LineTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 10, y: 10 });

    expect(mockCallbacks.addAnnotation).not.toHaveBeenCalled();
    expect(mockCanvas.remove).toHaveBeenCalled();
  });
});
