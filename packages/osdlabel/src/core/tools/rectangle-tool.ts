import { Rect } from 'fabric';
import { ShapeTool } from './shape-tool.js';
import { FabricShapeOptions } from '../fabric-utils.js';
import { AnnotationType, Point } from '../types.js';

export class RectangleTool extends ShapeTool<Rect> {
  readonly type: AnnotationType = 'rectangle';

  protected createPreview(imagePoint: Point, options: FabricShapeOptions): Rect {
    return new Rect({
      ...options,
      left: imagePoint.x,
      top: imagePoint.y,
      width: 0,
      height: 0,
      selectable: false,
      evented: false,
    });
  }

  protected updatePreview(imagePoint: Point, startPoint: Point): void {
    if (!this.preview) return;

    const width = imagePoint.x - startPoint.x;
    const height = imagePoint.y - startPoint.y;

    this.preview.set({
      width: Math.abs(width),
      height: Math.abs(height),
      left: width < 0 ? imagePoint.x : startPoint.x,
      top: height < 0 ? imagePoint.y : startPoint.y,
    });
  }
}
