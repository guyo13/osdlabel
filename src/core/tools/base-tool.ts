import { FabricObject } from 'fabric';
import type { FabricOverlay } from '../../overlay/fabric-overlay.js';
import {
  AnnotationType,
  Point,
  ImageId,
  AnnotationContextId,
  AnnotationId,
  ToolConstraint,
  KeyboardShortcutMap,
} from '../types.js';
import '../fabric-module.js';

/** Parameters for adding an annotation via a tool */
export interface AddAnnotationParams {
  readonly fabricObject: FabricObject;
  readonly imageId: ImageId;
  readonly contextId: AnnotationContextId;
  readonly type: AnnotationType;
  readonly label?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Framework-agnostic callbacks that tools use to interact with application state */
export interface ToolCallbacks {
  readonly getActiveContextId: () => AnnotationContextId | null;
  readonly getToolConstraint: (type: AnnotationType) => ToolConstraint | undefined;
  readonly canAddAnnotation: (type: AnnotationType) => boolean;
  readonly addAnnotation: (params: AddAnnotationParams) => void;
  readonly updateAnnotation: (
    id: AnnotationId,
    imageId: ImageId,
    fabricObject: FabricObject,
  ) => void;
  readonly deleteAnnotation: (id: AnnotationId, imageId: ImageId) => void;
  readonly setSelectedAnnotation: (id: AnnotationId | null) => void;
  readonly getAnnotation: (
    id: AnnotationId,
    imageId: ImageId,
  ) => import('../types.js').Annotation | undefined;
}

export interface AnnotationTool {
  /** Tool identifier */
  readonly type: AnnotationType | 'select';

  /** Called when the tool becomes active */
  activate(
    overlay: FabricOverlay,
    imageId: ImageId,
    callbacks: ToolCallbacks,
    shortcuts: KeyboardShortcutMap,
  ): void;

  /** Called when the tool is deactivated */
  deactivate(): void;

  /** Handle pointer down — start drawing */
  onPointerDown(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer move — update drawing preview */
  onPointerMove(event: PointerEvent, imagePoint: Point): void;

  /** Handle pointer up — commit the annotation */
  onPointerUp(event: PointerEvent, imagePoint: Point): void;

  /** Handle key down - returns true if the key was consumed */
  onKeyDown(event: KeyboardEvent): boolean;

  /** Cancel the current drawing interaction */
  cancel(): void;
}

export abstract class BaseTool implements AnnotationTool {
  abstract readonly type: AnnotationType | 'select';
  protected overlay: FabricOverlay | null = null;
  protected imageId: ImageId | null = null;
  protected callbacks: ToolCallbacks | null = null;
  protected shortcuts: KeyboardShortcutMap | null = null;

  activate(
    overlay: FabricOverlay,
    imageId: ImageId,
    callbacks: ToolCallbacks,
    shortcuts: KeyboardShortcutMap,
  ): void {
    this.overlay = overlay;
    this.imageId = imageId;
    this.callbacks = callbacks;
    this.shortcuts = shortcuts;
  }

  onKeyDown(event: KeyboardEvent): boolean {
    if (
      this.shortcuts &&
      (event.key === this.shortcuts.delete || event.key === this.shortcuts.deleteAlt)
    ) {
      this.deleteSelected();
      return true;
    }
    return false;
  }

  deactivate(): void {
    this.cancel();
    this.overlay = null;
    this.imageId = null;
    this.callbacks = null;
    this.shortcuts = null;
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
      const annotationId = obj.id as AnnotationId | undefined;
      if (annotationId) {
        this.callbacks.deleteAnnotation(annotationId, this.imageId);
      }
    }
  }
}
