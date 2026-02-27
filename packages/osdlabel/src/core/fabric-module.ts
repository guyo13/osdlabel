import { FabricObject } from 'fabric';

declare module 'fabric' {
  interface FabricObject {
    id?: string;
  }
  interface SerializedObjectProps {
    id?: string;
  }
}

// Register 'id' so toObject() includes it automatically
FabricObject.customProperties = ['id'];
