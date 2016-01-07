import expect from 'expect';
import range from 'lodash.range';

import combineSystems from '../src/combineSystems';

describe('combineSystems', () => {
  it('should return a function', () => {
    let result = combineSystems([]);
    expect(result).toBeA('function');
  });
  it('should call next function', () => {
    let ran = false;
    let systems = combineSystems([]);
    systems(3, 3, () => {
      expect(ran).toBe(false);
      ran = true;
    });
    expect(ran).toBe(true);
  });
  it('should return with the value', () => {
    let systems = combineSystems([]);
    let returned = systems(null, 33, (action) => action);
    expect(returned).toBe(33);
  });
  it('should call all the systems in order', () => {
    let order = 0;
    let systems = combineSystems(
      range(0, 4).map(v => () => {
        expect(order).toBe(v);
        order++;
      }
    ));
    systems(null, null, () => {
      expect(order).toBe(4);
      order++;
    });
    expect(order).toBe(5);
  });
});
