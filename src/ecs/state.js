import Store from '../store';
import Entity from '../entity';

// An Entity-Component State implementation
export default class State {
  components: { [key: string]: Map<number, Object> };
  componentList: Array<string>;
  globals: Object;
  store: ?Store;
  constructor(componentList: Array<string>) {
    this.componentList = componentList;
    this.components = {};
    componentList.forEach(name => this.components[name] = new Map());
    this.entities = new Map();
    this.globals = {};
  }
  onMount(store: Store) {
    this.store = store;
  }
  get(id: number): ?Entity {
    return new Entity(this, id);
  }
}
