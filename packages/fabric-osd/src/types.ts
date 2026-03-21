import type { RawAnnotationData } from '@osdlabel/annotation';

/** Extension fields added by the Fabric rendering layer */
export interface FabricFields {
  readonly rawAnnotationData: RawAnnotationData;
}
