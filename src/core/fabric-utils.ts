import { Rect, Circle, Line, Polyline, Polygon, util, FabricObject, Color } from 'fabric';
import { Annotation, AnnotationStyle, Geometry, AnnotationType } from './types.js';

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
        strokeDashArray: style.strokeDashArray ? [...style.strokeDashArray] : null,
        opacity: style.opacity,
        annotationId: id,
        strokeUniform: true, // Constant screen-width strokes regardless of zoom level
    };
}

export function getGeometryFromFabricObject(obj: FabricObject, type: AnnotationType): Geometry | null {
  if (type === 'rectangle' && obj instanceof Rect) {
    const width = obj.width * obj.scaleX;
    const height = obj.height * obj.scaleY;
    const left = obj.left;
    const top = obj.top;

    return {
      type: 'rectangle',
      origin: { x: left, y: top },
      width: width,
      height: height,
      rotation: obj.angle,
    };
  }

  if (type === 'circle' && obj instanceof Circle) {
      const radius = obj.radius * Math.max(Math.abs(obj.scaleX), Math.abs(obj.scaleY));
      const center = obj.getCenterPoint();
      return {
          type: 'circle',
          center: { x: center.x, y: center.y },
          radius: radius,
      };
  }

  if (type === 'line' && obj instanceof Line) {
      const matrix = obj.calcTransformMatrix();
      const cx = (obj.x1 + obj.x2) / 2;
      const cy = (obj.y1 + obj.y2) / 2;
      const p1 = util.transformPoint({ x: obj.x1 - cx, y: obj.y1 - cy }, matrix);
      const p2 = util.transformPoint({ x: obj.x2 - cx, y: obj.y2 - cy }, matrix);
      return {
          type: 'line',
          start: { x: p1.x, y: p1.y },
          end: { x: p2.x, y: p2.y },
      };
  }

  if (type === 'point' && obj instanceof Circle) {
      const center = obj.getCenterPoint();
      return {
          type: 'point',
          position: { x: center.x, y: center.y },
      };
  }

  if (type === 'path') {
      // Polygon extends Polyline in Fabric, so instanceof Polyline matches both
      if (obj instanceof Polyline) {
          const matrix = obj.calcTransformMatrix();
          const pathOffset = obj.pathOffset || { x: 0, y: 0 };
          const points = (obj.points || []).map(p => {
              const centeredP = { x: p.x - pathOffset.x, y: p.y - pathOffset.y };
              const tp = util.transformPoint(centeredP, matrix);
              return { x: tp.x, y: tp.y };
          });
          return {
              type: 'path',
              points: points,
              closed: obj instanceof Polygon,
          };
      }
  }

  return null;
}
