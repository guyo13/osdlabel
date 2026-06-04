import { Circle } from 'fabric';

const c = new Circle({ radius: 5, hasControls: false });
console.log(c.toObject());
