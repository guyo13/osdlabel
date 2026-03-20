import type { ExtensionValidator } from '@osdlabel/annotation';
import { validateRawAnnotationData } from '@osdlabel/annotation';
import type { FabricFields } from './types.js';

/** Validates the Fabric extension fields (rawAnnotationData) */
export const validateFabricFields: ExtensionValidator<FabricFields> = (
  value: unknown,
): value is FabricFields => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return validateRawAnnotationData(v.rawAnnotationData);
};
