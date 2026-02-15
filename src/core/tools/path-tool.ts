import { Polyline } from 'fabric';
import { BaseTool, createAnnotationFromFabricObject } from './base-tool.js';
import { AnnotationType, Point } from '../types.js';

export class PathTool extends BaseTool {
  readonly type: AnnotationType = 'path';
  private preview: Polyline | null = null;

  onPointerDown(event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay) return;

    // Handle double click to finish
    if (event.detail === 2) {
        this.finish();
        return;
    }

    if (!this.preview) {
        // Start new path
        this.preview = new Polyline([imagePoint, { ...imagePoint }], {
            fill: 'transparent',
            stroke: 'rgba(0,0,0,0.5)',
            strokeWidth: 2 / this.overlay.canvas.getZoom(),
            strokeDashArray: [5 / this.overlay.canvas.getZoom(), 5 / this.overlay.canvas.getZoom()],
            selectable: false,
            evented: false,
            objectCaching: false,
        });
        this.overlay.canvas.add(this.preview);
    } else {
        // Add point
        const points = this.preview.points || [];
        points.push({ ...imagePoint });

        // Force update points
        this.preview.set({ points: [...points] });
    }

    this.overlay.canvas.requestRenderAll();
  }

  onPointerMove(_event: PointerEvent, imagePoint: Point): void {
    if (!this.overlay || !this.preview) return;

    const points = this.preview.points;
    if (!points || points.length === 0) return;

    // Update last point (rubber band end)
    const lastPoint = points[points.length - 1];
    if (lastPoint) {
      lastPoint.x = imagePoint.x;
      lastPoint.y = imagePoint.y;
    }

    this.preview.set({ dirty: true });
    this.overlay.canvas.requestRenderAll();
  }

  onPointerUp(_event: PointerEvent, _imagePoint: Point): void {
    // No-op
  }

  onKeyDown(event: KeyboardEvent): void {
      if (event.key === 'Enter') {
          this.finish();
      } else if (event.key === 'Escape') {
          this.cancel();
      }
  }

  private finish() {
      if (!this.overlay || !this.preview || !this.imageId || !this.callbacks) {
          this.cancel();
          return;
      }

      const points = this.preview.points || [];
      // Need at least 2 distinct points. But wait, `Polyline` constructor initializes with 2 points: start and current (same).
      // So length is always >= 2 if created.
      // We want to check if they are effectively the same point (distance ~0).

      // If we only clicked once and pressed enter: points = [start, start]
      // We should discard this.

      if (points.length < 2) {
          this.cancel();
          return;
      }

      // Simple check for now: if all points are at same location, discard.
      // Or check length > 2? Double click adds point.
      // Let's rely on consumer for strict validation, but here check minimal effective geometry.

      const p1 = points[0];
      const p2 = points[points.length - 1];

      if (p1 && p2) {
          const dist = Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

          // If only 2 points and dist is small -> cancel
          if (points.length === 2 && dist < 1) {
              this.cancel();
              return;
          }
      } else {
          // Should not happen if length >= 2
          this.cancel();
          return;
      }

      const activeContextId = this.callbacks.getActiveContextId();
      if (!activeContextId) {
        console.warn('No active context, cannot create annotation');
        this.cancel();
        return;
      }

      const style = this.callbacks.getAnnotationStyle(this.type);

      const annotation = createAnnotationFromFabricObject(
        this.preview,
        this.imageId,
        activeContextId,
        style,
        this.type
      );

      this.overlay.canvas.remove(this.preview);
      this.preview = null;
      this.overlay.canvas.requestRenderAll();

      if (annotation) {
        this.callbacks.addAnnotation(annotation);
      }
  }

  cancel(): void {
    if (this.overlay && this.preview) {
      this.overlay.canvas.remove(this.preview);
      this.overlay.canvas.requestRenderAll();
    }
    this.preview = null;
  }
}
