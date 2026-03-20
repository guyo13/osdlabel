import { createAnnotationValidator, validateRawAnnotationData } from '@osdlabel/annotation';
import type { ExtensionValidator } from '@osdlabel/annotation';
import type { OsdFields } from './types.js';

/** Validates both context and Fabric extension fields */
export const validateOsdFields: ExtensionValidator<OsdFields> = (
  value: unknown,
): value is OsdFields => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  if (typeof v.contextId !== 'string' || v.contextId === '') return false;
  if (!validateRawAnnotationData(v.rawAnnotationData)) return false;
  return true;
};

/** Pre-configured validator for OsdAnnotation */
export const validateOsdAnnotation = createAnnotationValidator(validateOsdFields);
