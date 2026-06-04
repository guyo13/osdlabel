import { Circle, FabricObject } from 'fabric';

FabricObject.customProperties = ['hasControls'];
const c = new Circle({ radius: 5, hasControls: false, lockScalingX: true, lockScalingY: true });
const obj = c.toObject();
console.log("serialized lockScalingX:", obj.lockScalingX);
