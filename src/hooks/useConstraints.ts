import { useAnnotator } from '../state/annotator-context.js';
import { AnnotationType } from '../core/types.js';

export function useConstraints() {
  const { constraintStatus } = useAnnotator();

  /**
   * Returns whether a given annotation type tool is enabled
   * (i.e. the active context allows it and its limit hasn't been reached).
   */
  const isToolEnabled = (type: AnnotationType): boolean => {
    const status = constraintStatus();
    return status[type].enabled;
  };

  /**
   * Returns whether a new annotation of the given type can be added.
   * Same check as isToolEnabled — used by tools as a safety net before committing.
   */
  const canAddAnnotation = (type: AnnotationType): boolean => {
    const status = constraintStatus();
    return status[type].enabled;
  };

  return { isToolEnabled, canAddAnnotation };
}
