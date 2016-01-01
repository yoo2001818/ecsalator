import expect from 'expect';
import Engine from '../src/engine';

describe('FilteredEntities', () => {
  // Some modify actions
  const spawn = (id, template) => ({
    type: 'spawn',
    payload: {
      id, template
    },
    meta: {}
  });
  const removeEntity = (key) => ({
    type: 'removeEntity',
    payload: {
      key
    },
    meta: {}
  });
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
  let engine, filter;
  // Since Engine is supposed to create the FilteredEntities object,
  // we expect Engine.filter() method to work.
  beforeEach('initialize engine', () => {
    engine = new Engine([], [
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
      },
      (engine, action) => {
        const { type, payload } = action;
        if (type === 'spawn') {
          const { id, template } = payload;
          engine.create(id, template);
        }
        if (type === 'removeEntity') {
          engine.remove(payload.key);
        }
      }
    ], ['pos', 'vel']);
    engine.dispatch(spawn(1, { pos: 1, vel: 1 }));
    engine.dispatch(spawn(2, { pos: 1 }));
    engine.dispatch(spawn(3, { vel: 1 }));
    engine.dispatch(spawn(4));
    engine.dispatch(spawn(5, { pos: 1, vel: 1 }));
  });
  it('should initialize with correct data', () => {
    filter = engine.filter('pos', 'vel');
    expect(filter.get()).toEqual([1, 5]);
    filter = engine.filter('pos');
    expect(filter.get()).toEqual([1, 2, 5]);
    filter = engine.filter('vel');
    expect(filter.get()).toEqual([1, 3, 5]);
  });
  it('should change when entity is removed', () => {
    filter = engine.filter('pos');
    expect(filter.get()).toEqual([1, 2, 5]);
    engine.dispatch(removeEntity(engine.get(2)));
    expect(filter.get()).toEqual([1, 5]);
  });
  it('should change when entity is added', () => {
    filter = engine.filter('pos');
    expect(filter.get()).toEqual([1, 2, 5]);
    engine.dispatch(spawn(6, { pos: 'yes' }));
    expect(filter.get()).toEqual([1, 2, 5, 6]);
  });
  it('should change when component is removed', () => {
    filter = engine.filter('vel');
    expect(filter.get()).toEqual([1, 3, 5]);
    engine.dispatch(remove(engine.get(5), 'vel'));
    expect(filter.get()).toEqual([1, 3]);
  });
  it('should change when component is added', () => {
    filter = engine.filter('vel');
    expect(filter.get()).toEqual([1, 3, 5]);
    engine.dispatch(set(engine.get(4), 'vel', 'eee'));
    // Does the ordering matter? I suppose it doesn't.
    expect(filter.get()).toEqual([1, 3, 5, 4]);
  });
  it('should not change when component is updated', () => {
    filter = engine.filter('vel');
    expect(filter.get()).toEqual([1, 3, 5]);
    engine.dispatch(set(engine.get(1), 'vel', 'eee'));
    expect(filter.get()).toEqual([1, 3, 5]);
  });
});
