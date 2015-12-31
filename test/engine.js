import Engine from '../src/engine';
import Entity from '../src/entity';
import FilteredEntities from '../src/filteredEntities';
import expect from 'expect';

describe('Engine', () => {
  let engine;
  describe('#constructor()', () => {
    it('shouldn\'t initalize without proper arguments', () => {
      expect(() => new Engine()).toThrow();
    });
    it('should have \'id\', \'meta\' component after initalization', () => {
      engine = new Engine([], [], []);
      expect(engine.state).toEqual({
        id: {},
        meta: {}
      });
    });
    it('should override state if given', () => {
      engine = new Engine([], [], [], {id: {test: 'eee'}, meta: {}});
      expect(engine.state).toEqual({
        id: {
          test: 'eee'
        },
        meta: {}
      });
    });
    it('should throw error if components and state mismatches', () => {
      expect(() => new Engine([], [], ['hey'], {id: {test: 'eee'}, meta: {}}))
        .toThrow();
      expect(() => new Engine([], [], [], {id: {}, apple: {}, meta: {}}))
        .toThrow();
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
    beforeEach('spawn engine with entities', () => {
      engine = new Engine([], [], ['test'], {
        id: {
          1: 1
        },
        test: {
          1: 'sleepy'
        },
        meta: {}
      });
    });
    it('should return the Entity linked with the ID', () => {
      let entity = engine.get(1);
      expect(entity).toBeA(Entity);
      expect(entity.id).toBe(1);
      expect(entity.engine).toBe(engine);
    });
    it('should return null if entity is not found', () => {
      expect(engine.get(2)).toEqual(null);
    });
  });
  describe('#create', () => {
    // Here, we create delegation systems because we can't mutate the entity
    // if the engine is locked.
    //
    // Action creation function;
    const spawn = (id, template) => ({
      type: 'spawn',
      payload: {
        id, template
      },
      meta: {}
    });
    // We use this variable to look up the returned value.
    let returned;
    beforeEach('initialize engine', () => {
      engine = new Engine([], [
        // The 'spawner' system.
        (engine, action) => {
          const { type, payload } = action;
          if (type === 'spawn') {
            const { id, template } = payload;
            returned = engine.create(id, template);
          }
        }
      ], ['test']);
    });
    it('should return new Entity object', () => {
      engine.dispatch(spawn(3));
      expect(returned).toBeA(Entity);
      expect(returned.id).toBe(3);
      expect(returned.engine).toBe(engine);
    });
    it('should throw error if state is locked', () => {
      expect(() => engine.create(2)).toThrow();
    });
    it('should throw error if entity already exists', () => {
      engine.dispatch(spawn(2));
      expect(() => engine.dispatch(spawn(2))).toThrow();
    });
    // I'm not sure how I should implement this. Maybe 'meta' entities can help?
    // TODO Think a way to implement this.
    it('should automatically assign entity ID if not given');
    it('should set component state to the template', () => {
      engine.dispatch(spawn(3, {
        test: {
          hello: 'world',
          random: 'text'
        }
      }));
      const entity = engine.get(3);
      expect(entity).toBeA(Entity);
      expect(entity.get('test')).toEqual({
        hello: 'world',
        random: 'text'
      });
    });
    it('should throw an error if template has id component', () => {
      expect(() => engine.dispatch(spawn(3, {
        id: 'nopenopenope'
      }))).toThrow();
    });
    it('should throw an error if template has meta component', () => {
      expect(() => engine.dispatch(spawn(3, {
        meta: 'nope too'
      }))).toThrow();
    });
    it('should throw an error if template has wrong component', () => {
      expect(() => engine.dispatch(spawn(3, {
        rainbow: 'spectrum'
      }))).toThrow();
    });
    it('should emit an event', () => {
      // Here, Set up the observer to verify if the event has succeeded.
      // Entity events won't be issued because entity doesn't exist at that
      // time.
      let count = 0;
      engine.observe('test', () => count++);
      engine.dispatch(spawn(3, {
        test: 'hey!'
      }));
      expect(count).toBe(1);
    });
    it('should have null in events', () => {
      // Event should have null in previous value, indicating that the entity
      // didn't exist at the time.
      engine.observe('test', event => {
        expect(event.type).toBe('component');
        expect(event.key).toBe('test');
        expect(event.values[3]).toEqual(null);
      });
      engine.dispatch(spawn(3, {
        test: 'hey!'
      }));
    });
  });
  describe('#remove', () => {
    // Here, we create delegation systems because we can't mutate the entity
    // if the engine is locked.
    //
    // Action creation function;
    const remove = id => ({
      type: 'remove',
      payload: {
        entity: id
      },
      meta: {}
    });
    beforeEach('initialize engine', () => {
      engine = new Engine([], [
        // The 'remover' system.
        (engine, action) => {
          const { type, payload } = action;
          if (type === 'remove') {
            engine.remove(payload.entity);
          }
        }
      ], ['test'], {
        // Initialize with some default entities.
        id: {
          1: 1,
          2: 2
        },
        test: {
          2: 'yup'
        },
        meta: {}
      });
    });
    it('should accept an Entity object', () => {
      // Pass the entity to the system and check its presence.
      // However, we really shouldn't pass non-POJO action to the system.
      // This is fine because nothing in the engine serializes the action.
      engine.dispatch(remove(engine.get(1)));
      expect(engine.get(1)).toBe(null);
    });
    it('should accept an ID', () => {
      engine.dispatch(remove(1));
      expect(engine.get(1)).toBe(null);
    });
    it('should throw error if state is locked', () => {
      expect(() => engine.remove(1)).toThrow();
    });
    it('should throw error if entity doesn\'t exists', () => {
      expect(() => engine.dispatch(remove(404))).toThrow();
    });
    it('should delete all the components', () => {
      engine.dispatch(remove(2));
      // Check presence of entity #2's 'test' component.
      expect(engine.state.test[2]).toEqual(undefined);
    });
    it('should emit an event', () => {
      // Here, Set up the observer to verify if the event has succeeded.
      let count = 0;
      engine.observe('test', () => count++);
      engine.get(2).observe(() => count++);
      engine.dispatch(remove(2));
      expect(count).toBe(2);
    });
    it('should have previous state in events', () => {
      engine.observe('test', event => {
        expect(event.type).toBe('component');
        expect(event.key).toBe('test');
        expect(event.values[2]).toBe('yup');
      });
      engine.get(2).observe(event => {
        expect(event.type).toBe('entity');
        expect(event.key).toBe(2);
        expect(event.values['test']).toBe('yup');
      });
      engine.dispatch(remove(2));
    });
  });
  describe('#observe', () => {
    let entity;
    const set = (entity, key, value) => ({
      type: 'set',
      payload: {
        entity, key, value
      },
      meta: {}
    });
    // We need to initialize engine with some entities to issue events.
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
    it('should register component observers', () => {
      let count = 0;
      // Register component observer first.
      engine.observe('test', () => {
        count++;
      });
      engine.dispatch(set(entity, 'test', 'nope'));
      expect(count).toBe(1);
    });
    it('should register global observers', () => {
      let count = 0;
      engine.observe(() => {
        count++;
      });
      engine.update();
      expect(count).toBe(1);
    });
    it('should be able to unobserve component observers', () => {
      let count = 0;
      let observer = () => {
        count++;
      };
      engine.observe('test', observer);
      engine.unobserve('test', observer);
      engine.dispatch(set(entity, 'test', 'nope'));
      expect(count).toBe(0);
    });
    it('should be able to unobserve global observers', () => {
      let count = 0;
      let observer = () => {
        count++;
      };
      engine.observe(observer);
      engine.unobserve(observer);
      engine.dispatch(set(entity, 'test', 'nope'));
      expect(count).toBe(0);
    });
  });
  describe('#setMeta', () => {
    const set = (key, value) => ({
      type: 'set',
      payload: {
        key, value
      },
      meta: {}
    });
    beforeEach('initialize engine', () => {
      engine = new Engine([], [
        // We can't directly mutate the engine; we need to use a system
        // to mutate it.
        (engine, action) => {
          const { type, payload } = action;
          if (type === 'set') {
            const { key, value } = payload;
            engine.setMeta(key, value);
          }
        }
      ], [], {
        id: {},
        meta: {}
      });
    });
    it('should apply metadata', () => {
      engine.dispatch(set('hello', 'world'));
      engine.dispatch(set('great', 'I suppose'));
      expect(engine.state.meta.hello).toBe('world');
      expect(engine.state.meta.great).toBe('I suppose');
    });
    it('should throw error if state is locked', () => {
      expect(() => engine.setMeta('hello', 'world')).toThrow();
    });
    it('should emit an event', () => {
      let count = 0;
      engine.observeMeta('test', event => {
        expect(event.type).toBe('meta');
        expect(event.engine).toBe(engine);
        expect(event.key).toBe('test');
        expect(event.value).toBe(undefined);
        count++;
      });
      engine.dispatch(set('test', 'nope'));
      expect(count).toBe(1);
    });
  });
  describe('#removeMeta', () => {
    const remove = (key) => ({
      type: 'remove',
      payload: {
        key
      },
      meta: {}
    });
    beforeEach('initialize engine', () => {
      engine = new Engine([], [
        (engine, action) => {
          const { type, payload } = action;
          if (type === 'remove') {
            const { key } = payload;
            engine.removeMeta(key);
          }
        }
      ], [], {
        id: {},
        meta: {
          hello: 'world',
          nice: 'day'
        }
      });
    });
    it('should remove metadata', () => {
      engine.dispatch(remove('nice'));
      expect(engine.state.meta).toEqual({
        hello: 'world'
      });
    });
    it('should throw error if state is locked', () => {
      expect(() => engine.removeMeta('hello')).toThrow();
    });
    it('should emit an event', () => {
      let count = 0;
      // Register meta observer first.
      engine.observeMeta('hello', event => {
        expect(event.type).toBe('meta');
        expect(event.engine).toBe(engine);
        expect(event.key).toBe('hello');
        expect(event.value).toBe('world');
        count++;
      });
      engine.dispatch(remove('hello'));
      expect(count).toBe(1);
    });
  });
  describe('#getMeta', () => {
    beforeEach('initialize engine', () => {
      engine = new Engine([], [], [], {
        id: {},
        meta: {
          hello: 'world',
          nice: 'day'
        }
      });
    });
    it('should return metadata', () => {
      expect(engine.getMeta('hello')).toBe('world');
      expect(engine.getMeta('nice')).toBe('day');
    });
  });
  describe('#unobserveMeta', () => {
    const set = (key, value) => ({
      type: 'set',
      payload: {
        key, value
      },
      meta: {}
    });
    beforeEach('initialize engine', () => {
      engine = new Engine([], [
        // We can't directly mutate the engine; we need to use a system
        // to mutate it.
        (engine, action) => {
          const { type, payload } = action;
          if (type === 'set') {
            const { key, value } = payload;
            engine.setMeta(key, value);
          }
        }
      ], [], {
        id: {},
        meta: {}
      });
    });
    it('should be able to unobserve a component', () => {
      let count = 0;
      let observer = () => {
        count++;
      };
      engine.observeMeta('test', observer);
      engine.unobserveMeta('test', observer);
      engine.dispatch(set('test', 'nope'));
      expect(count).toBe(0);
    });
  });
  describe('#filter', () => {
    beforeEach('initialize engine', () => {
      engine = new Engine([], [], ['test', 'boop', 'boom']);
    });
    // Any other checks will be done in 'filteredEntities.js'.
    // This simply check if it returns a valid object.
    it('should return a FilteredEntities object', () => {
      let filter = engine.filter('test');
      expect(filter).toBeA(FilteredEntities);
    });
    it('should accept an array', () => {
      let filter = engine.filter(['boop', 'boom']);
      expect(filter).toBeA(FilteredEntities);
    });
    it('should accept arguments', () => {
      let filter = engine.filter('boop', 'boom');
      expect(filter).toBeA(FilteredEntities);
    });
  });
});
