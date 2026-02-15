import { Rect, Circle, Line, Polyline, FabricObject, Color } from 'fabric';
import { Annotation, AnnotationStyle } from './types.js';

export function createFabricObjectFromAnnotation(annotation: Annotation): FabricObject | null {
  const { geometry, style } = annotation;
  let obj: FabricObject | null = null;

  const options = getFabricOptions(style, annotation.id);

  switch (geometry.type) {
    case 'rectangle':
      obj = new Rect({
        ...options,
        left: geometry.origin.x,
        top: geometry.origin.y,
        width: geometry.width,
        height: geometry.height,
        angle: geometry.rotation,
      });
      break;
    case 'circle':
      obj = new Circle({
        ...options,
        left: geometry.center.x,
        top: geometry.center.y,
        radius: geometry.radius,
        originX: 'center',
        originY: 'center',
      });
      break;
    case 'line':
      obj = new Line([geometry.start.x, geometry.start.y, geometry.end.x, geometry.end.y], {
        ...options,
        originX: 'left',
        originY: 'top',
      });
      break;
    case 'point':
       obj = new Circle({
           ...options,
           left: geometry.position.x,
           top: geometry.position.y,
           radius: 5,
           originX: 'center',
           originY: 'center',
       });
       break;
    case 'path':
       obj = new Polyline(geometry.points.map(p => ({ x: p.x, y: p.y })), {
           ...options,
           fill: 'transparent',
       });
       break;
  }

  return obj;
}

export function updateFabricObjectFromAnnotation(obj: FabricObject, annotation: Annotation): void {
    const { geometry, style } = annotation;
    const options = getFabricOptions(style, annotation.id);

    // Update common style properties
    obj.set(options);

    // Update geometry
    switch (geometry.type) {
        case 'rectangle':
            if (obj instanceof Rect) {
                obj.set({
                    left: geometry.origin.x,
                    top: geometry.origin.y,
                    width: geometry.width,
                    height: geometry.height,
                    angle: geometry.rotation,
                });
            }
            break;
        case 'circle':
            if (obj instanceof Circle) {
                 // Check if it's a point or circle annotation
                 // Point is also represented as Circle in Fabric
                 if (annotation.geometry.type === 'point') {
                     // Handled below
                 } else {
                    obj.set({
                        left: geometry.center.x,
                        top: geometry.center.y,
                        radius: geometry.radius,
                    });
                 }
            }
            break;
        case 'point':
            if (obj instanceof Circle) {
                 obj.set({
                    left: geometry.position.x,
                    top: geometry.position.y,
                 });
            }
            break;
        case 'line':
            if (obj instanceof Line) {
                obj.set({
                    x1: geometry.start.x,
                    y1: geometry.start.y,
                    x2: geometry.end.x,
                    y2: geometry.end.y,
                });
            }
            break;
        case 'path':
            if (obj instanceof Polyline) {
                // Update points
                // Need to replace points array
                obj.set({
                    points: geometry.points.map(p => ({ x: p.x, y: p.y }))
                });
                // Recalculate dimensions? Fabric usually handles it on set('points')
            }
            break;
    }

    obj.setCoords();
}

function getFabricOptions(style: AnnotationStyle, id: string) {
    const fill = new Color(style.fillColor);
    // Apply fillOpacity if needed.
    // Fabric's `fill` property can be a color string.
    // If we want opacity, we can use `fill: rgba(...)`.
    // AnnotationStyle `fillOpacity` is separate.
    if (style.fillOpacity !== undefined) {
        fill.setAlpha(style.fillOpacity);
    }

    return {
        fill: fill.toRgba(),
        stroke: style.strokeColor,
        strokeWidth: style.strokeWidth,
        opacity: style.opacity,
        annotationId: id,
        strokeUniform: true, // Let's keep stroke consistent? Or false?
        // If false, stroke scales with zoom.
        // If true, stroke is constant screen width.
        // AnnotationStyle usually implies "stroke width in image units".
        // So strokeUniform: false (default).
        // If style.strokeWidth = 2, it is 2 image pixels.
    };
}
