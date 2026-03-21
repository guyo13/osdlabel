import {
  serialize as baseSerialize,
  deserialize as baseDeserialize,
} from '@osdlabel/annotation';
import type { AnnotationState, AnnotationDocument, DeserializeResult, ImageSource } from '@osdlabel/annotation';
import { validateOsdFields } from './validator.js';
import type { OsdFields } from './types.js';

/** Serialize OSD annotation state into a portable JSON document */
export function serialize(
  state: AnnotationState<OsdFields>,
  images: readonly ImageSource[],
): AnnotationDocument<OsdFields> {
  return baseSerialize(state, images);
}

/** Deserialize with OSD field validation (contextId + rawAnnotationData) */
export function deserialize(doc: unknown): DeserializeResult<OsdFields> {
  return baseDeserialize(doc, validateOsdFields);
}
