import { FabricObject } from 'fabric';

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

// Register 'id' so toObject() includes it automatically.
// _readOnly is intentionally NOT registered — it is transient display state, not persisted.
FabricObject.customProperties = ['id'];
