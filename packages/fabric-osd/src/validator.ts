import * as v from 'valibot';
import type { ExtensionValidatorFn } from '@osdlabel/annotation';
import { RawAnnotationDataSchema } from '@osdlabel/validation';
import type { FabricFields } from '@osdlabel/fabric-annotations';

const FabricFieldsSchema = v.pipe(
  v.object({
    rawAnnotationData: RawAnnotationDataSchema,
  }),
  // Pass through extra properties (contextId, etc.)
);

/** Validates the Fabric extension fields (rawAnnotationData) */
export const validateFabricFields: ExtensionValidatorFn<FabricFields> = (
  value: unknown,
): value is FabricFields => {
  return v.safeParse(FabricFieldsSchema, value).success;
};
