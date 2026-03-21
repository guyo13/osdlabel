import * as v from 'valibot';
import { createAnnotationValidator } from '@osdlabel/annotation';
import type { ExtensionValidatorFn } from '@osdlabel/annotation';
import { RawAnnotationDataSchema } from '@osdlabel/validation';
import type { OsdFields } from './types.js';

const OsdFieldsSchema = v.object({
  contextId: v.pipe(v.string(), v.minLength(1)),
  rawAnnotationData: RawAnnotationDataSchema,
});

/** Validates both context and Fabric extension fields */
export const validateOsdFields: ExtensionValidatorFn<OsdFields> = (
  value: unknown,
): value is OsdFields => {
  return v.safeParse(OsdFieldsSchema, value).success;
};

/** Pre-configured validator for OsdAnnotation */
export const validateOsdAnnotation = createAnnotationValidator(validateOsdFields);
