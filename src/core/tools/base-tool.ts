import { FabricObject } from 'fabric';
import type { FabricOverlay } from '../../overlay/fabric-overlay.js';
import { Annotation, AnnotationType, Point, AnnotationStyle, ImageId, AnnotationContextId, AnnotationId, ToolConstraint, createAnnotationId } from '../types.js';
import { generateId } from '../../utils/id.js';
import { getGeometryFromFabricObject } from '../fabric-utils.js';

/** Framework-agnostic callbacks that tools use to interact with application state */
export interface ToolCallbacks {
  readonly getActiveContextId: () => AnnotationContextId | null;
  readonly getToolConstraint: (type: AnnotationType) => ToolConstraint | undefined;
  readonly canAddAnnotation: (type: AnnotationType) => boolean;
  readonly addAnnotation: (annotation: Omit<Annotation, 'createdAt' | 'updatedAt'>) => void;
  readonly updateAnnotation: (id: AnnotationId, imageId: ImageId, patch: Partial<Omit<Annotation, 'id' | 'imageId' | 'createdAt' | 'updatedAt'>>) => void;
  readonly deleteAnnotation: (id: AnnotationId, imageId: ImageId) => void;
  readonly setSelectedAnnotation: (id: AnnotationId | null) => void;
  readonly getAnnotation: (id: AnnotationId, imageId: ImageId) => Annotation | undefined;
}

/** A Fabric object that may be associated with an annotation */
export interface AnnotatedFabricObject extends FabricObject {
  annotationId?: AnnotationId;
  updatedAt?: string;
}

export interface AnnotationTool {
  /** Tool identifier */
  readonly type: AnnotationType | 'select';

  /** Called when the tool becomes active */
  activate(overlay: FabricOverlay, imageId: ImageId, callbacks: ToolCallbacks): void;

  /** Called when the tool is deactivated */
  deactivate(): void;

  /** Handle pointer down — start drawing */
  onPointerDown(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer move — update drawing preview */
  onPointerMove(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer up — commit the annotation */
  onPointerUp(event: PointerEvent, imagePoint: Point): void;

  /** Handle key down */
  onKeyDown(event: KeyboardEvent): void;

  /** Cancel the current drawing interaction */
  cancel(): void;
}

export abstract class BaseTool implements AnnotationTool {
  abstract readonly type: AnnotationType | 'select';
  protected overlay: FabricOverlay | null = null;
  protected imageId: ImageId | null = null;
  protected callbacks: ToolCallbacks | null = null;

  activate(overlay: FabricOverlay, imageId: ImageId, callbacks: ToolCallbacks): void {
    this.overlay = overlay;
    this.imageId = imageId;
    this.callbacks = callbacks;
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Delete' || event.key === 'Backspace') {
        this.deleteSelected();
    }
  }

  deactivate(): void {
    this.cancel();
    this.overlay = null;
    this.imageId = null;
    this.callbacks = null;
  }

  abstract onPointerDown(event: PointerEvent, imagePoint: Point): void;
  abstract onPointerMove(event: PointerEvent, imagePoint: Point): void;
  abstract onPointerUp(event: PointerEvent, imagePoint: Point): void;
  abstract cancel(): void;

  private deleteSelected() {
    if (!this.callbacks || !this.imageId || !this.overlay) return;
    const activeObjects = this.overlay.canvas.getActiveObjects().slice();
    if (!activeObjects || activeObjects.length === 0) return;

    // Discard selection first to prevent Fabric from errors when objects are removed
    this.overlay.canvas.discardActiveObject();
    this.overlay.canvas.requestRenderAll();

    for (const obj of activeObjects) {
        const annotationId = (obj as AnnotatedFabricObject).annotationId;
        if (annotationId) {
            this.callbacks.deleteAnnotation(annotationId, this.imageId);
        }
    }
  }
}

export function createAnnotationFromFabricObject(
  obj: FabricObject,
  imageId: ImageId,
  contextId: AnnotationContextId,
  style: AnnotationStyle,
  type: AnnotationType
): Omit<Annotation, 'createdAt' | 'updatedAt'> | null {
  const geometry = getGeometryFromFabricObject(obj, type);
  if (!geometry) return null;

  return {
    id: createAnnotationId(generateId()),
    imageId,
    contextId,
    geometry,
    style,
  };
}
