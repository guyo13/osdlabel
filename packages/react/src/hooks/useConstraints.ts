import { useAnnotator } from '../state/annotator-context.js';
import type { ToolType } from '@osdlabel/annotation';

export function useConstraints() {
  const { constraintStatus } = useAnnotator();

  const isToolEnabled = (type: ToolType): boolean => {
    return constraintStatus[type].enabled;
  };

  const canAddAnnotation = (type: ToolType): boolean => {
    return constraintStatus[type].enabled;
  };

  return { isToolEnabled, canAddAnnotation };
}
