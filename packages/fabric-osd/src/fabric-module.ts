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

/**
 * Registers custom properties on FabricObject so toObject() includes them.
 * Must be called once before any Fabric interaction.
 *
 * _readOnly is intentionally NOT registered — it is transient display state, not persisted.
 */
export function initFabricModule(): void {
  FabricObject.customProperties = ['id'];
}
