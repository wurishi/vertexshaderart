import { iSub } from '../lib';
import { createCanvas } from '../webgl-utils';

const vertex = `
void main() {
  
}
`;

export default class implements iSub {
  name() {
    return 'empty';
  }
  key() {
    return '';
  }
  sort() {
    return 10;
  }
  main() {
    return createCanvas({ bg: 'black' });
  }
  userVertex() {
    return vertex;
  }
}
