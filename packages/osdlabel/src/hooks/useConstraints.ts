import { useAnnotator } from '../state/annotator-context.js';
import type { ToolType } from '@osdlabel/annotation';

export function useConstraints() {
  const { constraintStatus } = useAnnotator();

  /**
   * Returns whether a given annotation type tool is enabled
   * (i.e. the active context allows it and its limit hasn't been reached).
   */
  const isToolEnabled = (type: ToolType): boolean => {
    const status = constraintStatus();
    return status[type].enabled;
  };

  /**
   * Returns whether a new annotation of the given type can be added.
   * Same check as isToolEnabled — used by tools as a safety net before committing.
   */
  const canAddAnnotation = (type: ToolType): boolean => {
    const status = constraintStatus();
    return status[type].enabled;
  };

  return { isToolEnabled, canAddAnnotation };
}
