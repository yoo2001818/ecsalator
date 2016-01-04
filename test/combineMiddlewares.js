import expect from 'expect';
import range from 'lodash.range';

import combineMiddlewares from '../src/combineMiddlewares';

// Middleware signature is (engine, action, next).

describe('combineMiddlewares', () => {
  it('should return a function', () => {
    // Pass empty array. It should return a function even if it's an empty
    // array.
    let result = combineMiddlewares([]);
    expect(result).toBeA('function');
  });
  it('should return with action by default', () => {
    let middleware = combineMiddlewares([
      (engine, action, next) => {
        return next(action);
      }
    ]);
    // next function is not set; It's no-op by default.
    // action => action
    let returned = middleware(null, 33);
    expect(returned).toBe(33);
  });
  it('should return with the provided value if given', () => {
    let middleware = combineMiddlewares([
      (engine, action, next) => {
        return next(action);
      }
    ]);
    let returned = middleware(null, null, () => 'lol');
    expect(returned).toBe('lol');
  });
  it('should run every middleware in series', () => {
    let order = 0;
    let middleware = combineMiddlewares(
      range(0, 4).map(v => (engine, action, next) => {
        expect(order).toBe(v);
        order++;
        return next(action);
      }
    ));
    middleware(null, null, () => {
      expect(order).toBe(4);
      order++;
    });
    expect(order).toBe(5);
  });
  it('should cut in the middle if next was not called', () => {
    let order = 0;
    let middleware = combineMiddlewares(
      (range(0, 4).map(v => (engine, action, next) => {
        expect(order).toBe(v);
        order++;
        return next(action);
      }).concat([
        // no-op
        () => {}
      ])
    ));
    middleware(null, null, () => {
      throw new Error('Should not reach here');
    });
    expect(order).toBe(4);
  });
  it('should change the action in the middle if given', () => {
    let order = 0;
    let middleware = combineMiddlewares(
      range(0, 4).map(v => (engine, action, next) => {
        expect(order).toBe(v);
        order++;
        return next(v);
      }
    ));
    middleware(null, null, action => {
      expect(order).toBe(4);
      order++;
      expect(action).toBe(3);
    });
    expect(order).toBe(5);
  });
  it('should persist engine object', () => {
    let topEngine = {};
    let middleware = combineMiddlewares([
      (engine, action, next) => {
        expect(engine).toBe(topEngine);
        return next(action);
      }
    ]);
    middleware(topEngine, null);
  });
});
