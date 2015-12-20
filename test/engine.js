import Engine from '../src/engine';
import expect from 'expect';

describe('Engine', () => {
  let engine;
  describe('#constructor()', () => {
    it('shouldn\'t initalize without proper arguments', () => {
      expect(() => new Engine()).toThrow();
    });
    it('should have \'id\' component after initalization', () => {
      engine = new Engine([], [], []);
      expect(engine.state).toEqual({
        id: {}
      });
    });
    it('should override state if given', () => {
      engine = new Engine([], [], [], {id: {test: 'eee'}});
      expect(engine.state).toEqual({
        id: {
          test: 'eee'
        }
      });
    });
    it('should throw error if components and state mismatches', () => {
      expect(() => new Engine([], [], ['hey'], {id: {test: 'eee'}})).toThrow();
      expect(() => new Engine([], [], [], {id: {}, apple: {}})).toThrow();
    });
  });
  describe('#dispatch()', () => {
    it('should run middlewares in order', () => {
      let order = 1;
      engine = new Engine([
        (engine, action, next) => {
          if (action.type === '@@engine/init') return action;
          expect(order).toBe(1);
          order = 2;
          return next(action);
        },
        () => {
          expect(order).toBe(2);
          order = 3;
        },
        () => {
          throw new Error('should not reach here');
        }
      ], [
        () => {
          throw new Error('should not reach here');
        }
      ], []);
      engine.dispatch({
        type: 'test/test'
      });
      expect(order).toBe(3);
    });
    it('should be able to call dispatch in middleware', () => {
      let triggered = false;
      engine = new Engine([
        (engine, action, next) => {
          if (action.type === '@@engine/init') return action;
          if (action.type === 'test/test') {
            engine.dispatch({
              type: 'test/target'
            });
          }
          return next(action);
        }
      ], [
        (engine, action) => {
          if (action.type === 'test/target') triggered = true;
        }
      ], []);
      engine.dispatch({
        type: 'test/test'
      });
      expect(triggered).toBe(true);
    });
    it('should finally call systems in middleware chain', () => {
      let triggered = false;
      engine = new Engine([
        (engine, action, next) => { next(action); }
      ], [
        () => { triggered = true; }
      ], []);
      expect(triggered).toBe(true);
    });
    it('should call all systems', () => {
      let count = 0;
      engine = new Engine([], [
        () => count++,
        () => count++,
        () => count++
      ], []);
      expect(count).toBe(3);
    });
    it('should prevent systems dispatching another action', () => {
      expect(() => new Engine([], [
        (engine) => engine.dispatch({
          type: 'test/test'
        })
      ], [])).toThrow();
    });
  });
  describe('#get', () => {
    it('should return the Entity linked with the ID');
    it('should throw error if entity is not found');
  });
  describe('#create', () => {
    it('should return new Entity object');
    it('should throw error if state is locked');
    it('should throw error if entity already exists');
    it('should automatically assign entity ID if not given');
    it('should set component state to given value');
    it('should emit an event');
  });
  describe('#remove', () => {
    it('should accept an Entity object');
    it('should accept an ID');
    it('should throw error if state is locked');
    it('should throw error if entity doesn\'t exists');
    it('should delete from component state');
    it('should emit an event');
  });
});
