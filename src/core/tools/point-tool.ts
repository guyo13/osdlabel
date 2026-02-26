import { Circle } from 'fabric';
import { ShapeTool } from './shape-tool.js';
import { FabricShapeOptions } from '../fabric-utils.js';
import { AnnotationType, Point } from '../types.js';

export class PointTool extends ShapeTool<Circle> {
  readonly type: AnnotationType = 'point';

  protected createPreview(imagePoint: Point, options: FabricShapeOptions): Circle {
    return new Circle({
      ...options,
      left: imagePoint.x,
      top: imagePoint.y,
      radius: 5,
      originX: 'center',
      originY: 'center',
      selectable: false,
      evented: false,
    });
  }

  protected updatePreview(imagePoint: Point, _startPoint: Point): void {
    if (!this.preview) return;

    this.preview.set({
      left: imagePoint.x,
      top: imagePoint.y,
    });
  }
}
