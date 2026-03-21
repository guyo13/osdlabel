import type { ExtensionValidator } from '@osdlabel/annotation';
import type { ContextFields } from './types.js';

/** Validates the context extension fields (contextId) */
export const validateContextFields: ExtensionValidator<ContextFields> = (
  value: unknown,
): value is ContextFields => {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.contextId === 'string' && v.contextId !== '';
};
