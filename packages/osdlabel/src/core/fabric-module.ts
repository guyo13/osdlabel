// This import is required for module augmentation to work (makes this file a module).
import type {} from 'fabric';

declare module 'fabric' {
  interface FabricObject {
    id?: string;
    /** When true, setMode('annotation') will not make this object interactive. Not serialized. */
    _readOnly?: boolean;
  }
  interface SerializedObjectProps {
    id?: string;
  }
}

// Runtime registration of 'id' as a custom property has been moved to
// fabric-utils.ts so it survives tree-shaking (this file has no exports
// and is dropped by bundlers when "sideEffects": false is set).
