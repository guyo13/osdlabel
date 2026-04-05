import type { Annotation } from '@osdlabel/annotation';
import type { ContextFields } from '@osdlabel/annotation-context';
import type { FabricFields } from '@osdlabel/fabric-annotations';
import type { ImageIdFields } from '@osdlabel/viewer-api';

/** OSD-specific extension fields (imageId + context + Fabric) */
export type OsdFields = ImageIdFields & ContextFields & FabricFields;

/** Full annotation type used in osdlabel — includes both context and Fabric fields */
export type OsdAnnotation = Annotation<OsdFields>;
