import Store from '../store';
// An Entity-Component State implementation
export default class State {
  components: any;
  componentConstructors: any;
  componentList: any;
  entities: any;
  store: ?Store;
  constructor() {

  }
  onMount(store: Store) {
    this.store = store;
  }
}
