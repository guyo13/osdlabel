import { Rect, Circle, Line, Polyline, Polygon, FabricObject, Color } from 'fabric';
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
    case 'path': {
       const pts = geometry.points.map(p => ({ x: p.x, y: p.y }));
       if (geometry.closed) {
         obj = new Polygon(pts, {
           ...options,
         });
       } else {
         obj = new Polyline(pts, {
           ...options,
           fill: 'transparent',
         });
       }
       break;
    }
  }

  return obj;
}

/**
 * Update a Fabric object's properties to match the annotation geometry.
 * Returns true if the object was updated in-place, false if it needs
 * to be replaced (e.g. path closed state changed).
 */
export function updateFabricObjectFromAnnotation(obj: FabricObject, annotation: Annotation): boolean {
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
                obj.set({
                    left: geometry.center.x,
                    top: geometry.center.y,
                    radius: geometry.radius,
                });
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
        case 'path': {
            // Check if the closed state changed — if so, we need to replace
            // the object (Polyline vs Polygon) rather than update in-place.
            const isClosed = geometry.closed;
            const isCurrentlyPolygon = obj instanceof Polygon;
            if (isClosed !== isCurrentlyPolygon) {
                // Signal that the object needs replacement
                obj.setCoords();
                return false;
            }

            if (obj instanceof Polyline) {
                // Reset transform to identity before setting new absolute points.
                // This avoids the pathOffset mismatch that causes the
                // "moving inside bounding box" visual glitch.
                const pts = geometry.points.map(p => ({ x: p.x, y: p.y }));
                obj.set({
                    points: pts,
                    scaleX: 1,
                    scaleY: 1,
                    angle: 0,
                    skewX: 0,
                    skewY: 0,
                });
                // Force Fabric to recalculate pathOffset and dimensions from the new points
                obj.setBoundingBox(true);
            }
            break;
        }
    }

    obj.setCoords();
    return true;
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
        strokeUniform: true, // Constant screen-width strokes regardless of zoom level
    };
}
