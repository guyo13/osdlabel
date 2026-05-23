import { describe, expect, it } from 'vitest';
import { formatMeasurement, toPhysicalArea, toPhysicalLength } from '../../src/measurement.js';

describe('toPhysicalLength', () => {
  it('returns pixels when no spacing is provided', () => {
    expect(toPhysicalLength(100, undefined)).toEqual({ value: 100, unit: 'px' });
  });
  it('uses mean spacing by default', () => {
    expect(toPhysicalLength(10, { x: 0.5, y: 0.7, unit: 'mm' })).toEqual({
      value: 6,
      unit: 'mm',
    });
  });
  it('honors axis="x"', () => {
    expect(toPhysicalLength(10, { x: 0.5, y: 0.7, unit: 'mm' }, 'x')).toEqual({
      value: 5,
      unit: 'mm',
    });
  });
  it('honors axis="y"', () => {
    expect(toPhysicalLength(10, { x: 0.5, y: 0.7, unit: 'mm' }, 'y')).toEqual({
      value: 7,
      unit: 'mm',
    });
  });
});

describe('toPhysicalArea', () => {
  it('returns px² when no spacing is provided', () => {
    expect(toPhysicalArea(50, undefined)).toEqual({ value: 50, unit: 'px²' });
  });
  it('multiplies by x*y product (anisotropic-safe)', () => {
    expect(toPhysicalArea(100, { x: 0.5, y: 0.4, unit: 'mm' })).toEqual({
      value: 20,
      unit: 'mm²',
    });
  });
});

describe('formatMeasurement', () => {
  it('default precision is 2 with a space separator', () => {
    expect(formatMeasurement({ value: 12.34567, unit: 'mm' })).toBe('12.35 mm');
  });
  it('honors precision option', () => {
    expect(formatMeasurement({ value: 1 / 3, unit: 'mm' }, { precision: 4 })).toBe('0.3333 mm');
  });
  it('honors unitSeparator', () => {
    expect(formatMeasurement({ value: 5, unit: 'px' }, { unitSeparator: '' })).toBe('5.00px');
  });
});
