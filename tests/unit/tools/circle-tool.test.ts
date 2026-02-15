import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CircleTool } from '../../../src/core/tools/circle-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { actions, contextState, annotationState } from '../../../src/state/store.js';
import { createAnnotationContextId, createImageId, ImageId, AnnotationContextId } from '../../../src/core/types.js';
import { Circle } from 'fabric';

describe('CircleTool', () => {
  let tool: CircleTool;
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
        { type: 'circle' }
      ]
    }]);
    actions.setActiveContext(contextId);
  });

  it('should create a preview circle on pointer down', () => {
    tool = new CircleTool();
    tool.activate(mockOverlay, imageId);

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
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const preview = mockCanvas.add.mock.calls[0][0];

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 30 }); // radius sqrt(20^2 + 20^2)

    expect(preview.radius).toBeGreaterThan(0);
    expect(mockCanvas.requestRenderAll).toHaveBeenCalled();
  });

  it('should create annotation on pointer up', () => {
    tool = new CircleTool();
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 30 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 30, y: 30 });

    const imageAnns = annotationState.byImage[imageId];
    expect(imageAnns).toBeDefined();

    const keys = Object.keys(imageAnns);
    const ann = imageAnns[keys[keys.length - 1]];

    expect(ann.geometry.type).toBe('circle');
    if (ann.geometry.type === 'circle') {
        expect(ann.geometry.radius).toBeGreaterThan(0);
        expect(ann.geometry.center.x).toBe(10);
        expect(ann.geometry.center.y).toBe(10);
    }

    expect(mockCanvas.remove).toHaveBeenCalled();
  });
});
