import { describe, it, expect } from 'vitest';
import {
  sanitizeFabricData,
  normalizeFabricType,
  SUPPORTED_FABRIC_TYPES,
  isFiniteNumber,
  isObject,
  validatePointValue,
  isBoundedNumber,
  MAX_COORDINATE,
  MAX_DIMENSION,
  MAX_SCALE,
  MAX_ANGLE,
  MAX_STROKE_WIDTH,
  MAX_STRING_LENGTH,
  MAX_POINTS_COUNT,
  MAX_STROKE_DASH_ARRAY_LENGTH,
} from '../../../src/core/fabric-data-sanitizer';

describe('fabric-data-sanitizer', () => {
  describe('SUPPORTED_FABRIC_TYPES', () => {
    it('should contain the 5 canonical capitalized types', () => {
      expect(SUPPORTED_FABRIC_TYPES).toContain('Rect');
      expect(SUPPORTED_FABRIC_TYPES).toContain('Circle');
      expect(SUPPORTED_FABRIC_TYPES).toContain('Line');
      expect(SUPPORTED_FABRIC_TYPES).toContain('Polyline');
      expect(SUPPORTED_FABRIC_TYPES).toContain('Polygon');
      expect(SUPPORTED_FABRIC_TYPES).toHaveLength(5);
    });
  });

  describe('normalizeFabricType', () => {
    it('should return canonical capitalized type for lowercase input', () => {
      expect(normalizeFabricType('rect')).toBe('Rect');
      expect(normalizeFabricType('circle')).toBe('Circle');
      expect(normalizeFabricType('line')).toBe('Line');
      expect(normalizeFabricType('polyline')).toBe('Polyline');
      expect(normalizeFabricType('polygon')).toBe('Polygon');
    });

    it('should return canonical type for already-capitalized input', () => {
      expect(normalizeFabricType('Rect')).toBe('Rect');
      expect(normalizeFabricType('Circle')).toBe('Circle');
      expect(normalizeFabricType('Line')).toBe('Line');
      expect(normalizeFabricType('Polyline')).toBe('Polyline');
      expect(normalizeFabricType('Polygon')).toBe('Polygon');
    });

    it('should normalize ALLCAPS input', () => {
      expect(normalizeFabricType('RECT')).toBe('Rect');
      expect(normalizeFabricType('CIRCLE')).toBe('Circle');
      expect(normalizeFabricType('POLYGON')).toBe('Polygon');
    });

    it('should return null for unknown types', () => {
      expect(normalizeFabricType('unknown')).toBeNull();
      expect(normalizeFabricType('path')).toBeNull();
      expect(normalizeFabricType('image')).toBeNull();
      expect(normalizeFabricType('group')).toBeNull();
    });

    it('should return null for empty string', () => {
      expect(normalizeFabricType('')).toBeNull();
    });
  });

  describe('sanitizeFabricData', () => {
    describe('happy path — valid data for each type', () => {
      it('should sanitize valid Rect data', () => {
        const input = {
          type: 'Rect',
          left: 10,
          top: 20,
          width: 100,
          height: 50,
          fill: 'red',
          stroke: 'blue',
          strokeWidth: 2,
          opacity: 0.8,
          angle: 45,
          id: 'ann-1',
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Rect');
        expect(result?.left).toBe(10);
        expect(result?.top).toBe(20);
        expect(result?.width).toBe(100);
        expect(result?.height).toBe(50);
        expect(result?.fill).toBe('red');
        expect(result?.opacity).toBe(0.8);
        expect(result?.id).toBe('ann-1');
      });

      it('should sanitize valid Circle data', () => {
        const input = {
          type: 'Circle',
          left: 50,
          top: 60,
          radius: 30,
          fill: 'rgba(0,0,255,0.3)',
          stroke: 'black',
          strokeWidth: 2,
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Circle');
        expect(result?.radius).toBe(30);
      });

      it('should sanitize valid Line data', () => {
        const input = {
          type: 'Line',
          x1: 0,
          y1: 0,
          x2: 100,
          y2: 100,
          stroke: 'red',
          strokeWidth: 3,
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Line');
        expect(result?.x1).toBe(0);
        expect(result?.y1).toBe(0);
        expect(result?.x2).toBe(100);
        expect(result?.y2).toBe(100);
      });

      it('should sanitize valid Polyline data', () => {
        const input = {
          type: 'Polyline',
          points: [
            { x: 0, y: 0 },
            { x: 50, y: 100 },
            { x: 100, y: 0 },
          ],
          stroke: 'green',
          strokeWidth: 2,
          fill: null,
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Polyline');
        expect(Array.isArray(result?.points)).toBe(true);
        expect((result?.points as unknown[]).length).toBe(3);
      });

      it('should sanitize valid Polygon data', () => {
        const input = {
          type: 'Polygon',
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 50, y: 100 },
          ],
          fill: 'yellow',
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Polygon');
        expect(Array.isArray(result?.points)).toBe(true);
      });
    });

    describe('type normalization', () => {
      it('should accept lowercase type and normalize to capitalized', () => {
        const result = sanitizeFabricData({ type: 'rect', width: 10, height: 20 });
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Rect');
      });

      it('should accept ALLCAPS type and normalize', () => {
        const result = sanitizeFabricData({ type: 'CIRCLE', radius: 5 });
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Circle');
      });

      it('should accept mixed-case type and normalize', () => {
        const result = sanitizeFabricData({
          type: 'PoLyGoN',
          points: [
            { x: 0, y: 0 },
            { x: 1, y: 1 },
          ],
        });
        expect(result).not.toBeNull();
        expect(result?.type).toBe('Polygon');
      });
    });

    describe('allowlist enforcement', () => {
      it('should strip unknown keys from output', () => {
        const input = {
          type: 'Rect',
          width: 100,
          height: 50,
          malicious: 'payload',
          customData: { nested: 'object' },
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect('malicious' in (result ?? {})).toBe(false);
        expect('customData' in (result ?? {})).toBe(false);
      });

      it('should force shadow to null even when input has a shadow object', () => {
        const input = {
          type: 'Rect',
          width: 100,
          height: 50,
          shadow: { color: '#000', blur: 10, offsetX: 5, offsetY: 5 },
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect(result?.shadow).toBeNull();
      });

      it('should force clipPath to null even when input has a clipPath object', () => {
        const input = {
          type: 'Rect',
          width: 100,
          height: 50,
          clipPath: { type: 'Rect', width: 10, height: 10, left: 0, top: 0 },
        };
        const result = sanitizeFabricData(input);
        expect(result).not.toBeNull();
        expect(result?.clipPath).toBeNull();
      });

      it('should preserve allowed base properties', () => {
        const input = {
          type: 'Rect',
          width: 80,
          height: 60,
          left: 5,
          top: 10,
          angle: 30,
          scaleX: 1.5,
          scaleY: 2,
          flipX: true,
          flipY: false,
          visible: true,
          strokeUniform: true,
        };
        const result = sanitizeFabricData(input);
        expect(result?.left).toBe(5);
        expect(result?.angle).toBe(30);
        expect(result?.scaleX).toBe(1.5);
        expect(result?.flipX).toBe(true);
        expect(result?.visible).toBe(true);
      });

      it('should accept null fill and stroke', () => {
        const result = sanitizeFabricData({
          type: 'Rect',
          width: 10,
          height: 10,
          fill: null,
          stroke: null,
        });
        expect(result).not.toBeNull();
        expect(result?.fill).toBeNull();
        expect(result?.stroke).toBeNull();
      });
    });

    describe('bounds checking', () => {
      it('should accept coordinate values at exactly MAX_COORDINATE', () => {
        const result = sanitizeFabricData({
          type: 'Rect',
          width: 10,
          height: 10,
          left: MAX_COORDINATE,
          top: -MAX_COORDINATE,
        });
        expect(result).not.toBeNull();
        expect(result?.left).toBe(MAX_COORDINATE);
        expect(result?.top).toBe(-MAX_COORDINATE);
      });

      it('should reject coordinate values exceeding MAX_COORDINATE', () => {
        expect(
          sanitizeFabricData({
            type: 'Rect',
            width: 10,
            height: 10,
            left: MAX_COORDINATE + 1,
          }),
        ).toBeNull();
      });

      it('should reject negative left coordinate beyond MAX_COORDINATE', () => {
        expect(
          sanitizeFabricData({
            type: 'Rect',
            width: 10,
            height: 10,
            top: -(MAX_COORDINATE + 1),
          }),
        ).toBeNull();
      });

      it('should reject negative width', () => {
        expect(sanitizeFabricData({ type: 'Rect', width: -10, height: 50 })).toBeNull();
      });

      it('should reject negative height', () => {
        expect(sanitizeFabricData({ type: 'Rect', width: 100, height: -1 })).toBeNull();
      });

      it('should reject opacity below 0', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, opacity: -0.1 }),
        ).toBeNull();
      });

      it('should reject opacity above 1', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, opacity: 1.1 }),
        ).toBeNull();
      });

      it('should accept opacity at boundary values 0 and 1', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, opacity: 0 }),
        ).not.toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, opacity: 1 }),
        ).not.toBeNull();
      });

      it('should reject scale exceeding MAX_SCALE', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, scaleX: MAX_SCALE + 1 }),
        ).toBeNull();
      });

      it('should reject angle exceeding MAX_ANGLE', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, angle: MAX_ANGLE + 1 }),
        ).toBeNull();
      });

      it('should accept negative angle within bounds', () => {
        const result = sanitizeFabricData({ type: 'Rect', width: 10, height: 10, angle: -90 });
        expect(result).not.toBeNull();
        expect(result?.angle).toBe(-90);
      });

      it('should reject NaN in numeric fields', () => {
        expect(sanitizeFabricData({ type: 'Rect', width: NaN, height: 10 })).toBeNull();
        expect(sanitizeFabricData({ type: 'Rect', width: 10, height: 10, left: NaN })).toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, opacity: NaN }),
        ).toBeNull();
      });

      it('should reject Infinity in numeric fields', () => {
        expect(sanitizeFabricData({ type: 'Rect', width: 10, height: Infinity })).toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, left: Infinity }),
        ).toBeNull();
      });

      it('should reject negative Infinity', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, top: -Infinity }),
        ).toBeNull();
      });

      it('should reject negative radius for Circle', () => {
        expect(sanitizeFabricData({ type: 'Circle', radius: -1 })).toBeNull();
      });

      it('should accept zero radius for Circle', () => {
        expect(sanitizeFabricData({ type: 'Circle', radius: 0 })).not.toBeNull();
      });
    });

    describe('required fields', () => {
      it('should reject Rect missing width', () => {
        expect(sanitizeFabricData({ type: 'Rect', height: 50 })).toBeNull();
      });

      it('should reject Rect missing height', () => {
        expect(sanitizeFabricData({ type: 'Rect', width: 100 })).toBeNull();
      });

      it('should reject Circle missing radius', () => {
        expect(sanitizeFabricData({ type: 'Circle' })).toBeNull();
      });

      it('should reject Line missing x1', () => {
        expect(sanitizeFabricData({ type: 'Line', y1: 0, x2: 10, y2: 10 })).toBeNull();
      });

      it('should reject Line missing y1', () => {
        expect(sanitizeFabricData({ type: 'Line', x1: 0, x2: 10, y2: 10 })).toBeNull();
      });

      it('should reject Polyline missing points', () => {
        expect(sanitizeFabricData({ type: 'Polyline' })).toBeNull();
      });

      it('should reject Polygon missing points', () => {
        expect(sanitizeFabricData({ type: 'Polygon' })).toBeNull();
      });

      it('should reject Polyline with only 1 point', () => {
        expect(sanitizeFabricData({ type: 'Polyline', points: [{ x: 0, y: 0 }] })).toBeNull();
      });

      it('should reject Polygon with only 1 point', () => {
        expect(sanitizeFabricData({ type: 'Polygon', points: [{ x: 0, y: 0 }] })).toBeNull();
      });

      it('should accept Polyline with exactly 2 points', () => {
        expect(
          sanitizeFabricData({
            type: 'Polyline',
            points: [
              { x: 0, y: 0 },
              { x: 10, y: 10 },
            ],
          }),
        ).not.toBeNull();
      });
    });

    describe('array limits', () => {
      it('should reject points array exceeding MAX_POINTS_COUNT', () => {
        const hugePoints = Array.from({ length: MAX_POINTS_COUNT + 1 }, (_, i) => ({ x: i, y: i }));
        expect(sanitizeFabricData({ type: 'Polyline', points: hugePoints })).toBeNull();
      });

      it('should accept points array at exactly MAX_POINTS_COUNT', () => {
        const maxPoints = Array.from({ length: MAX_POINTS_COUNT }, (_, i) => ({
          x: i % 1000,
          y: i % 1000,
        }));
        expect(sanitizeFabricData({ type: 'Polyline', points: maxPoints })).not.toBeNull();
      });

      it('should reject strokeDashArray exceeding MAX_STROKE_DASH_ARRAY_LENGTH', () => {
        const hugeDash = Array.from({ length: MAX_STROKE_DASH_ARRAY_LENGTH + 1 }, (_, i) => i + 1);
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, strokeDashArray: hugeDash }),
        ).toBeNull();
      });

      it('should accept null strokeDashArray', () => {
        const result = sanitizeFabricData({
          type: 'Rect',
          width: 10,
          height: 10,
          strokeDashArray: null,
        });
        expect(result).not.toBeNull();
        expect(result?.strokeDashArray).toBeNull();
      });

      it('should reject points with non-numeric coordinates', () => {
        expect(
          sanitizeFabricData({
            type: 'Polyline',
            points: [
              { x: 'bad', y: 0 },
              { x: 10, y: 10 },
            ],
          }),
        ).toBeNull();
      });

      it('should reject points with coordinates exceeding MAX_COORDINATE', () => {
        expect(
          sanitizeFabricData({
            type: 'Polyline',
            points: [
              { x: MAX_COORDINATE + 1, y: 0 },
              { x: 10, y: 10 },
            ],
          }),
        ).toBeNull();
      });
    });

    describe('string length limits', () => {
      it('should reject fill string exceeding MAX_STRING_LENGTH', () => {
        const longFill = 'a'.repeat(MAX_STRING_LENGTH + 1);
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, fill: longFill }),
        ).toBeNull();
      });

      it('should accept fill string at exactly MAX_STRING_LENGTH', () => {
        const maxFill = 'a'.repeat(MAX_STRING_LENGTH);
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, fill: maxFill }),
        ).not.toBeNull();
      });

      it('should reject stroke string exceeding MAX_STRING_LENGTH', () => {
        const longStroke = 'b'.repeat(MAX_STRING_LENGTH + 1);
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, stroke: longStroke }),
        ).toBeNull();
      });

      it('should accept null fill and stroke', () => {
        const result = sanitizeFabricData({
          type: 'Rect',
          width: 10,
          height: 10,
          fill: null,
          stroke: null,
        });
        expect(result).not.toBeNull();
      });

      it('should reject id string exceeding MAX_STRING_LENGTH', () => {
        const longId = 'x'.repeat(MAX_STRING_LENGTH + 1);
        expect(sanitizeFabricData({ type: 'Rect', width: 10, height: 10, id: longId })).toBeNull();
      });
    });

    describe('rejection — invalid input', () => {
      it('should return null for unknown type', () => {
        expect(sanitizeFabricData({ type: 'image' })).toBeNull();
        expect(sanitizeFabricData({ type: 'group' })).toBeNull();
        expect(sanitizeFabricData({ type: 'path' })).toBeNull();
      });

      it('should return null when type is missing', () => {
        expect(sanitizeFabricData({ left: 0, top: 0 })).toBeNull();
      });

      it('should return null when type is not a string', () => {
        expect(sanitizeFabricData({ type: 42 })).toBeNull();
        expect(sanitizeFabricData({ type: null })).toBeNull();
        expect(sanitizeFabricData({ type: {} })).toBeNull();
      });

      it('should return null for non-boolean field given a non-boolean value', () => {
        expect(sanitizeFabricData({ type: 'Rect', width: 10, height: 10, flipX: 1 })).toBeNull();
      });

      it('should return null for invalid paintFirst value', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, paintFirst: 'invalid' }),
        ).toBeNull();
      });

      it('should return null for invalid lineCap value', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, strokeLineCap: 'invalid' }),
        ).toBeNull();
      });
    });

    describe('enum field validation', () => {
      it('should accept valid paintFirst values', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, paintFirst: 'fill' }),
        ).not.toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, paintFirst: 'stroke' }),
        ).not.toBeNull();
      });

      it('should accept valid fillRule values', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, fillRule: 'nonzero' }),
        ).not.toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, fillRule: 'evenodd' }),
        ).not.toBeNull();
      });

      it('should accept valid strokeLineCap values', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, strokeLineCap: 'butt' }),
        ).not.toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, strokeLineCap: 'round' }),
        ).not.toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, strokeLineCap: 'square' }),
        ).not.toBeNull();
      });

      it('should accept valid strokeLineJoin values', () => {
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, strokeLineJoin: 'bevel' }),
        ).not.toBeNull();
        expect(
          sanitizeFabricData({ type: 'Rect', width: 10, height: 10, strokeLineJoin: 'miter' }),
        ).not.toBeNull();
      });
    });
  });

  describe('shared primitive validators', () => {
    describe('isFiniteNumber', () => {
      it('should return true for finite numbers', () => {
        expect(isFiniteNumber(0)).toBe(true);
        expect(isFiniteNumber(-1.5)).toBe(true);
        expect(isFiniteNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
        expect(isFiniteNumber(0.001)).toBe(true);
      });

      it('should return false for NaN', () => {
        expect(isFiniteNumber(NaN)).toBe(false);
      });

      it('should return false for Infinity', () => {
        expect(isFiniteNumber(Infinity)).toBe(false);
        expect(isFiniteNumber(-Infinity)).toBe(false);
      });

      it('should return false for non-number types', () => {
        expect(isFiniteNumber('5')).toBe(false);
        expect(isFiniteNumber(null)).toBe(false);
        expect(isFiniteNumber(undefined)).toBe(false);
        expect(isFiniteNumber({})).toBe(false);
      });
    });

    describe('isObject', () => {
      it('should return true for plain objects', () => {
        expect(isObject({})).toBe(true);
        expect(isObject({ x: 1 })).toBe(true);
      });

      it('should return false for null', () => {
        expect(isObject(null)).toBe(false);
      });

      it('should return false for arrays', () => {
        expect(isObject([])).toBe(false);
        expect(isObject([1, 2])).toBe(false);
      });

      it('should return false for primitives', () => {
        expect(isObject('string')).toBe(false);
        expect(isObject(42)).toBe(false);
        expect(isObject(true)).toBe(false);
      });
    });

    describe('validatePointValue', () => {
      it('should return true for valid points', () => {
        expect(validatePointValue({ x: 0, y: 0 })).toBe(true);
        expect(validatePointValue({ x: -5.5, y: 100.25 })).toBe(true);
      });

      it('should return false for NaN coordinates', () => {
        expect(validatePointValue({ x: NaN, y: 0 })).toBe(false);
        expect(validatePointValue({ x: 0, y: NaN })).toBe(false);
      });

      it('should return false for Infinity coordinates', () => {
        expect(validatePointValue({ x: Infinity, y: 0 })).toBe(false);
      });

      it('should return false for missing y', () => {
        expect(validatePointValue({ x: 0 })).toBe(false);
      });

      it('should return false for null', () => {
        expect(validatePointValue(null)).toBe(false);
      });

      it('should return false for arrays', () => {
        expect(validatePointValue([0, 0])).toBe(false);
      });
    });

    describe('isBoundedNumber', () => {
      it('should return true when within bounds', () => {
        expect(isBoundedNumber(0, 0, 1)).toBe(true);
        expect(isBoundedNumber(0.5, 0, 1)).toBe(true);
        expect(isBoundedNumber(1, 0, 1)).toBe(true);
      });

      it('should return false when out of bounds', () => {
        expect(isBoundedNumber(-0.1, 0, 1)).toBe(false);
        expect(isBoundedNumber(1.1, 0, 1)).toBe(false);
      });

      it('should return false for NaN or Infinity', () => {
        expect(isBoundedNumber(NaN, 0, 1)).toBe(false);
        expect(isBoundedNumber(Infinity, 0, Infinity)).toBe(false);
      });
    });
  });

  describe('exported constants are reasonable', () => {
    it('MAX_COORDINATE should be a large positive number', () => {
      expect(MAX_COORDINATE).toBeGreaterThan(0);
      expect(Number.isFinite(MAX_COORDINATE)).toBe(true);
    });

    it('MAX_DIMENSION should equal MAX_COORDINATE', () => {
      expect(MAX_DIMENSION).toBe(MAX_COORDINATE);
    });

    it('MAX_SCALE should be far less than MAX_COORDINATE', () => {
      expect(MAX_SCALE).toBeLessThan(MAX_COORDINATE);
    });

    it('MAX_ANGLE should be 360', () => {
      expect(MAX_ANGLE).toBe(360);
    });

    it('MAX_STRING_LENGTH should be a reasonable limit', () => {
      expect(MAX_STRING_LENGTH).toBeGreaterThan(0);
      expect(MAX_STRING_LENGTH).toBeLessThan(10_000);
    });

    it('MAX_POINTS_COUNT should be a reasonable limit', () => {
      expect(MAX_POINTS_COUNT).toBeGreaterThan(1);
    });

    it('MAX_STROKE_DASH_ARRAY_LENGTH should be reasonable', () => {
      expect(MAX_STROKE_DASH_ARRAY_LENGTH).toBeGreaterThan(0);
      expect(MAX_STROKE_DASH_ARRAY_LENGTH).toBeLessThan(MAX_POINTS_COUNT);
    });

    it('MAX_STROKE_WIDTH should be reasonable', () => {
      expect(MAX_STROKE_WIDTH).toBeGreaterThan(0);
    });
  });
});
