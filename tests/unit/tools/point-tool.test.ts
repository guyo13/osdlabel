import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PointTool } from '../../../src/core/tools/point-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { createImageId, createAnnotationContextId, AnnotationType } from '../../../src/core/types.js';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { DEFAULT_ANNOTATION_STYLE } from '../../../src/core/constants.js';

describe('PointTool', () => {
  let tool: PointTool;
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

  it('should create annotation on pointer down', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 30, y: 30 });

    expect(mockCallbacks.addAnnotation).toHaveBeenCalled();
    const ann = (mockCallbacks.addAnnotation as any).mock.calls[0][0];

    expect(ann.geometry.type).toBe('point');
    expect(ann.geometry.position.x).toBe(30);
    expect(ann.geometry.position.y).toBe(30);

    // PointTool does not add preview
    expect(mockCanvas.add).not.toHaveBeenCalled();
  });

  it('should ignore pointer move', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const moveEvent = { type: 'pointermove' } as PointerEvent;
    tool.onPointerMove(moveEvent, { x: 30, y: 30 }); // Should do nothing

    expect(mockCanvas.requestRenderAll).not.toHaveBeenCalled();
  });

  it('should ignore pointer up', () => {
    tool = new PointTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const event = { type: 'pointerdown' } as PointerEvent;
    tool.onPointerDown(event, { x: 10, y: 10 });

    const upEvent = { type: 'pointerup' } as PointerEvent;
    tool.onPointerUp(upEvent, { x: 10, y: 10 }); // Should do nothing
  });
});
