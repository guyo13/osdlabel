import type { Annotation } from '@osdlabel/annotation';
import type { ContextFields } from '@osdlabel/annotation-context';
import type { FabricFields } from '@osdlabel/fabric-annotations';

/** OSD-specific extension fields (context + Fabric) */
export type OsdFields = ContextFields & FabricFields;

/** Full annotation type used in osdlabel — includes both context and Fabric fields */
export type OsdAnnotation = Annotation<OsdFields>;
