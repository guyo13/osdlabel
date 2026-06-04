import { Circle, FabricObject } from 'fabric';

FabricObject.customProperties = ['hasControls'];
const c = new Circle({ radius: 5, hasControls: false });
console.log("hasControls before:", c.hasControls);
const obj = c.toObject();
console.log("serialized:", obj.hasControls);

const c2 = await Circle.fromObject(obj);
console.log("hasControls after:", c2.hasControls);
