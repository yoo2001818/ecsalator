import expect from 'expect';

import Engine from '../src/engine';
import Entity from '../src/entity';

describe('Entity', () => {
  let engine, entity;
  // Action create functions.
  const set = (entity, key, value) => ({
    type: 'set',
    payload: {
      entity, key, value
    },
    meta: {}
  });
  const remove = (entity, key) => ({
    type: 'remove',
    payload: {
      entity, key
    },
    meta: {}
  });
  // Since Entity works with the engine, we need to initialize the engine too.
  beforeEach('initialize engine with entities', () => {
    engine = new Engine([], [
      // We can't directly mutate the engine; we need to use a system
      // to mutate it.
      (engine, action) => {
        const { type, payload } = action;
        if (type === 'set') {
          const { entity, key, value } = payload;
          entity.set(key, value);
        }
        if (type === 'remove') {
          const { entity, key } = payload;
          entity.remove(key);
        }
      }
    ], ['test'], {
      id: {
        1: 1
      },
      test: {
        1: 'sleepy'
      },
      meta: {}
    });
    entity = engine.get(1);
  });
  describe('#get', () => {
    it('should return a component', () => {
      expect(entity.get('test')).toBe('sleepy');
    });
    it('should throw error when component is invalid', () => {
      expect(() => entity.get('never')).toThrow();
    });
    it('should throw error when accessing meta component', () => {
      expect(() => entity.get('meta')).toThrow();
    });
    it('should throw error when entity is invalid', () => {
      entity = new Entity(engine, 32767);
      expect(() => entity.get('test')).toThrow();
    });
  });
  describe('#set', () => {
    it('should set a component', () => {
      engine.dispatch(set(entity, 'test', '2spooky4me'));
      expect(entity.get('test')).toBe('2spooky4me');
    });
    it('should prevent overriding id component', () => {
      expect(() => engine.dispatch(set(entity, 'id', 'nope'))).toThrow();
    });
    it('should prevent overriding meta component', () => {
      expect(() => engine.dispatch(set(entity, 'meta', 'noooo'))).toThrow();
    });
    it('should throw error when component is invalid', () => {
      expect(() => engine.dispatch(set(entity, 'tera', 'byte'))).toThrow();
    });
    it('should throw error when entity is invalid', () => {
      entity = new Entity(engine, 32767);
      expect(() => engine.dispatch(set(entity, 'test', 'nevermind'))).toThrow();
    });
    it('should emit an event', () => {
      // Here, Set up the observer to verify if the event has succeeded.
      let count = 0;
      engine.observe('test', () => count++);
      entity.observe(() => count++);
      engine.dispatch(set(entity, 'test', 'probably'));
      expect(count).toBe(2);
    });
    it('should have previous state in events', () => {
      engine.observe('test', event => {
        expect(event.type).toBe('component');
        expect(event.key).toBe('test');
        expect(event.values[1]).toBe('sleepy');
      });
      entity.observe(event => {
        expect(event.type).toBe('entity');
        expect(event.key).toBe(1);
        expect(event.values['test']).toBe('sleepy');
      });
      engine.dispatch(set(entity, 'test', 'yes'));
    });
  });
  describe('#remove', () => {
    it('should remove a component', () => {
      engine.dispatch(remove(entity, 'test'));
      expect(entity.get('test')).toEqual(undefined);
    });
    it('should prevent removing id component', () => {
      expect(() => engine.dispatch(remove(entity, 'id'))).toThrow();
    });
    it('should prevent removing meta component', () => {
      expect(() => engine.dispatch(remove(entity, 'meta'))).toThrow();
    });
    it('should throw error when component is invalid', () => {
      expect(() => engine.dispatch(remove(entity, 'giga'))).toThrow();
    });
    it('should throw error when entity is invalid', () => {
      entity = new Entity(engine, 32767);
      expect(() => engine.dispatch(remove(entity, 'test'))).toThrow();
    });
    it('should emit an event', () => {
      // Here, Set up the observer to verify if the event has succeeded.
      let count = 0;
      engine.observe('test', () => count++);
      entity.observe(() => count++);
      engine.dispatch(remove(entity, 'test'));
      expect(count).toBe(2);
    });
    it('should have previous state in events', () => {
      engine.observe('test', event => {
        expect(event.type).toBe('component');
        expect(event.key).toBe('test');
        expect(event.values[1]).toBe('sleepy');
      });
      entity.observe(event => {
        expect(event.type).toBe('entity');
        expect(event.key).toBe(1);
        expect(event.values['test']).toBe('sleepy');
      });
      engine.dispatch(remove(entity, 'test'));
    });
  });
});
