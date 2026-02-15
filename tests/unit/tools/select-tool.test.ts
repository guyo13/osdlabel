import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SelectTool, FabricAnnotationObject } from '../../../src/core/tools/select-tool.js';
import { FabricOverlay } from '../../../src/overlay/fabric-overlay.js';
import { createImageId, createAnnotationContextId, AnnotationType } from '../../../src/core/types.js';
import { ToolCallbacks } from '../../../src/core/tools/base-tool.js';
import { DEFAULT_ANNOTATION_STYLE } from '../../../src/core/constants.js';
import { Rect } from 'fabric';

describe('SelectTool', () => {
  let tool: SelectTool;
  let mockOverlay: FabricOverlay;
  let mockCanvas: any;
  let mockCallbacks: ToolCallbacks;
  const imageId = createImageId('test-image');
  const contextId = createAnnotationContextId('test-context');

  beforeEach(() => {
    vi.clearAllMocks();

    mockCanvas = {
      selection: false,
      defaultCursor: '',
      hoverCursor: '',
      getObjects: vi.fn().mockReturnValue([]),
      getActiveObjects: vi.fn().mockReturnValue([]),
      discardActiveObject: vi.fn(),
      requestRenderAll: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
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

  it('should enable canvas selection on activate', () => {
    tool = new SelectTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    expect(mockCanvas.selection).toBe(true);
    expect(mockCanvas.defaultCursor).toBe('default');
    expect(mockCanvas.on).toHaveBeenCalledWith('selection:created', expect.any(Function));
    expect(mockCanvas.on).toHaveBeenCalledWith('object:modified', expect.any(Function));
  });

  it('should disable canvas selection on deactivate', () => {
    tool = new SelectTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);
    tool.deactivate();

    expect(mockCanvas.selection).toBe(false);
    expect(mockCanvas.off).toHaveBeenCalledWith('selection:created', expect.any(Function));
    expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
  });

  it('should delete selected annotation on Backspace', () => {
    tool = new SelectTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const mockObj = { annotationId: 'ann-1' } as FabricAnnotationObject;
    mockCanvas.getActiveObjects.mockReturnValue([mockObj]);

    tool.onKeyDown({ key: 'Backspace' } as KeyboardEvent);

    expect(mockCallbacks.deleteAnnotation).toHaveBeenCalledWith('ann-1');
    expect(mockCanvas.remove).toHaveBeenCalledWith(mockObj);
    expect(mockCanvas.discardActiveObject).toHaveBeenCalled();
  });

  it('should update annotation on object modified', () => {
    tool = new SelectTool();
    tool.activate(mockOverlay, imageId, mockCallbacks);

    const objectModifiedHandler = mockCanvas.on.mock.calls.find((c: any) => c[0] === 'object:modified')?.[1];
    expect(objectModifiedHandler).toBeDefined();

    // Use a real Rect object to satisfy `instanceof Rect` check in getGeometryFromFabricObject
    const mockObj = new Rect({
        width: 10,
        height: 10,
        left: 10,
        top: 10,
        angle: 0
    }) as unknown as FabricAnnotationObject;

    mockObj.annotationId = 'ann-1';
    mockObj.annotationType = 'rectangle';

    objectModifiedHandler({ target: mockObj });

    expect(mockCallbacks.updateAnnotation).toHaveBeenCalledWith('ann-1', expect.objectContaining({
        geometry: expect.objectContaining({
            type: 'rectangle',
            width: 10,
            height: 10
        })
    }));
  });
});
