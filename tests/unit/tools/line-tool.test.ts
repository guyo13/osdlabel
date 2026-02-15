import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LineTool } from '../../../src/core/tools/line-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { actions, contextState, annotationState } from '../../../src/state/store.js';
import { createAnnotationContextId, createImageId, ImageId, AnnotationContextId } from '../../../src/core/types.js';
import { Line } from 'fabric';

describe('LineTool', () => {
  let tool: LineTool;
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
        { type: 'line' }
      ]
    }]);
    actions.setActiveContext(contextId);
  });

  it('should create a preview line on pointer down', () => {
    tool = new LineTool();
    tool.activate(mockOverlay, imageId);

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
    tool.activate(mockOverlay, imageId);

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
    tool.activate(mockOverlay, imageId);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 50, y: 50 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 50, y: 50 });

    const imageAnns = annotationState.byImage[imageId];
    expect(imageAnns).toBeDefined();

    const keys = Object.keys(imageAnns);
    const ann = imageAnns[keys[keys.length - 1]];

    expect(ann.geometry.type).toBe('line');
    if (ann.geometry.type === 'line') {
        expect(ann.geometry.start.x).toBe(10);
        expect(ann.geometry.start.y).toBe(10);
        expect(ann.geometry.end.x).toBe(50);
        expect(ann.geometry.end.y).toBe(50);
    }

    expect(mockCanvas.remove).toHaveBeenCalled();
  });
});
