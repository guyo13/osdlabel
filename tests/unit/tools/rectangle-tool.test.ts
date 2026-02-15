import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RectangleTool } from '../../../src/core/tools/rectangle-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { createImageId, AnnotationType } from '../../../src/core/types.js';
import { Rect } from 'fabric';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { DEFAULT_ANNOTATION_STYLE } from '../../../src/core/constants.js';
import { createAnnotationContextId } from '../../../src/core/types.js';

describe('RectangleTool', () => {
  let tool: RectangleTool;
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

  it('should create a preview rectangle on pointer down', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    expect(mockCanvas.add).toHaveBeenCalled();
    const addedObj = mockCanvas.add.mock.calls[0][0];
    expect(addedObj).toBeInstanceOf(Rect);
    expect(addedObj.left).toBe(10);
    expect(addedObj.top).toBe(10);
    expect(addedObj.width).toBe(0);
  });

  it('should update preview rectangle on pointer move', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 40 }); // width 20, height 30

    expect(preview.width).toBe(20);
    expect(preview.height).toBe(30);
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should create annotation on pointer up', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 40 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 30, y: 40 });

    expect(mockCallbacks.addAnnotation).toHaveBeenCalled();
    const ann = (mockCallbacks.addAnnotation as any).mock.calls[0][0];

    expect(ann.geometry.type).toBe('rectangle');
    expect(ann.geometry.width).toBe(20);
    expect(ann.geometry.height).toBe(30);

    expect(mockCanvas.remove).toHaveBeenCalled(); // Preview removed
  });

  it('should handle negative drag direction', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 30, y: 40 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 10, y: 10 }); // drag up-left

    expect(preview.width).toBe(20);
    expect(preview.height).toBe(30);
    expect(preview.left).toBe(10);
    expect(preview.top).toBe(10);
  });

  // Edge cases
  it('should not create annotation if size is too small (click without drag)', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 10, y: 10 }); // 0 size

    expect(mockCallbacks.addAnnotation).not.toHaveBeenCalled();
    expect(mockCanvas.remove).toHaveBeenCalled();
  });
});
