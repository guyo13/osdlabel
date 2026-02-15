import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RectangleTool } from '../../../src/core/tools/rectangle-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { actions, contextState, annotationState } from '../../../src/state/store.js';
import { createAnnotationContextId, createImageId, ImageId, AnnotationContextId } from '../../../src/core/types.js';
import { Rect } from 'fabric';

describe('RectangleTool', () => {
  let tool: RectangleTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: any;
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

    // Setup store
    actions.setContexts([{
      id: contextId,
      label: 'Test Context',
      tools: [
        { type: 'rectangle' }
      ]
    }]);
    actions.setActiveContext(contextId);

    // Reset annotations for image
    // Since we don't have clear action, we can't easily clear.
    // But we can check new annotations by count or ID.
  });

  it('should create a preview rectangle on pointer down', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId);

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
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    // Get the preview object (it was added to canvas)
    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 40 }); // width 20, height 30

    expect(preview.width).toBe(20);
    expect(preview.height).toBe(30);
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should create annotation on pointer up', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 40 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 30, y: 40 });

    // Check store
    const imageAnns = annotationState.byImage[imageId];
    expect(imageAnns).toBeDefined();

    // Find our annotation (last one)
    const keys = Object.keys(imageAnns);
    const ann = imageAnns[keys[keys.length - 1]];

    expect(ann.geometry.type).toBe('rectangle');
    if (ann.geometry.type === 'rectangle') {
        expect(ann.geometry.width).toBe(20);
        expect(ann.geometry.height).toBe(30);
    }

    expect(mockCanvas.remove).toHaveBeenCalled(); // Preview removed
  });

  it('should handle negative drag direction', () => {
    tool = new RectangleTool();
    tool.activate(mockOverlay, imageId);

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
});
