import { useAnnotator } from '../state/annotator-context.js';
import type { ToolType } from '@osdlabel/annotation';

export function useConstraints() {
  const { constraintStatus } = useAnnotator();

  const isToolEnabled = (type: ToolType): boolean => {
    const status = constraintStatus();
    return status[type].enabled;
  };

  const canAddAnnotation = (type: ToolType): boolean => {
    const status = constraintStatus();
    return status[type].enabled;
  };

  return { isToolEnabled, canAddAnnotation };
}
