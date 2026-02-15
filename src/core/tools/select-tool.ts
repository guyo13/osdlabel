import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { actions, annotationState } from '../../state/store.js';
import { AnnotationId, ImageId } from '../types.js';
import type { FabricOverlay } from '../../overlay/fabric-overlay.js';

export class SelectTool extends BaseTool {
  readonly type = 'select';

  // We need to bind methods to use as event listeners
  private readonly handleSelectionCreated = (e: any) => this.onSelectionCreated(e);
  private readonly handleSelectionCleared = (e: any) => this.onSelectionCleared(e);
  private readonly handleObjectModified = (e: any) => this.onObjectModified(e);

  activate(overlay: FabricOverlay, imageId: ImageId): void {
    super.activate(overlay, imageId);
    if (!this.overlay) return;

    this.overlay.canvas.on('selection:created', this.handleSelectionCreated);
    this.overlay.canvas.on('selection:updated', this.handleSelectionCreated);
    this.overlay.canvas.on('selection:cleared', this.handleSelectionCleared);
    this.overlay.canvas.on('object:modified', this.handleObjectModified);
  }

  deactivate(): void {
    if (this.overlay) {
        this.overlay.canvas.off('selection:created', this.handleSelectionCreated);
        this.overlay.canvas.off('selection:updated', this.handleSelectionCreated);
        this.overlay.canvas.off('selection:cleared', this.handleSelectionCleared);
        this.overlay.canvas.off('object:modified', this.handleObjectModified);

        this.overlay.canvas.discardActiveObject();
        this.overlay.canvas.requestRenderAll();
    }
    super.deactivate();
  }

  onPointerDown(_event: PointerEvent, _imagePoint: any): void {}
  onPointerMove(_event: PointerEvent, _imagePoint: any): void {}
  onPointerUp(_event: PointerEvent, _imagePoint: any): void {}

  cancel(): void {
      this.overlay?.canvas.discardActiveObject();
      this.overlay?.canvas.requestRenderAll();
  }

  onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Delete' || event.key === 'Backspace') {
          this.deleteSelected();
      }
  }

  private onSelectionCreated(e: any) {
      const selected = e.selected || [];
      if (selected.length === 1) {
          const obj = selected[0];
          const annotationId = (obj as any).annotationId as AnnotationId;
          if (annotationId) {
              actions.setSelectedAnnotation(annotationId);
          }
      } else {
          actions.setSelectedAnnotation(null);
      }
  }

  private onSelectionCleared(_e: any) {
      actions.setSelectedAnnotation(null);
  }

  private onObjectModified(e: any) {
      const obj = e.target;
      if (!obj || !this.imageId) return;

      const annotationId = (obj as any).annotationId as AnnotationId;
      if (!annotationId) return;

      const imageAnns = annotationState.byImage[this.imageId];
      const currentAnnotation = imageAnns?.[annotationId];
      if (!currentAnnotation) return;

      const newAnnotation = createAnnotationFromFabricObject(
          obj,
          this.imageId,
          currentAnnotation.contextId,
          currentAnnotation.style,
          currentAnnotation.geometry.type
      );

      if (newAnnotation) {
          actions.updateAnnotation(annotationId, this.imageId, {
              geometry: newAnnotation.geometry
          });
      }
  }

  private deleteSelected() {
      const activeObject = this.overlay?.canvas.getActiveObject();
      if (!activeObject || !this.imageId) return;

      let targets = [activeObject];
      if (activeObject.type === 'activeSelection') {
          // In Fabric v6+, getObjects() returns array
          targets = (activeObject as any).getObjects();
      }

      targets.forEach((obj: any) => {
          const annotationId = obj.annotationId as AnnotationId;
          if (annotationId && this.imageId) {
              actions.deleteAnnotation(annotationId, this.imageId);
          }
      });

      this.overlay?.canvas.discardActiveObject();
      this.overlay?.canvas.requestRenderAll();
  }
}
