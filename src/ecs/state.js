import Store from '../store';
import Entity from '../entity';

// An Entity-Component State implementation
export default class State {
  entities: Array<Entity>;
  components: Array<string>;
  globals: Object;
  store: ?Store;
  constructor(components: Array<string>) {
    this.components = components.concat(['id']);
    this.entities = new Map();
    this.globals = {
      nextId: 0
    };
  }
  onMount(store: Store) {
    this.store = store;
  }
  get(id: number): ?Entity {
    return this.entities[id];
  }
  create(id: ?number = this.globals.nextId, template: ?Object) {
    if (this.entities[id] !== undefined) {
      throw new Error('Entity already exists');
    }
    let entity = new Entity(id);
    this.globals.nextId = Math.max(id + 1, this.globals.nextId);
    if (template != null) {
      // Or we can call entity.set.
      Object.assign(entity, template);
    }
    return entity;
  }
  remove(object: number | Entity): void {
    let id: number;
    if (typeof object === 'number') id = object;
    if (object.id !== undefined) id = object.id;
    if (this.entities[id] === undefined) {
      throw new Error('Entity does not exists');
    }
    delete this.entities[id];
  }
}
