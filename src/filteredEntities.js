/* @flow */

import Engine from './engine';

export default class FilteredEntities {
  engine: Engine;
  keys: Array<string>;
  entities: Array<number>;
  listener: Function;
  constructor(engine: Engine, keys: Array<string>) {
    this.engine = engine;
    this.keys = keys;
    this.listener = this.handleEvent.bind(this);
    // Populate the entities array.
    this.reset();
    this.attach();
  }
  reset() {
    // Reset the entities array and refilter the entities out.
    // TODO This is ridiculously slow method. Seriously.
    // We definitely use faster method, such as BitSet, etc.
    if (this.keys.length === 0) {
      this.entities = [];
      throw new Error('Filter should have at least 1 keys');
    }
    // Pop one key out and populate the array.
    let entityCache = Object.keys(this.engine.state[this.keys[0]]);
    for (let i = 1; i < this.keys.length; ++i) {
      // Filter them out.
      let target = Object.keys(this.engine.state[this.keys[i]]);
      // Calculate intersection; Also this is awkwardly slow.
      entityCache = entityCache.filter(value => target.indexOf(value) !== -1);
    }
    // Finally, parse the strings to numbers.
    entityCache = entityCache.map(value => parseInt(value));
  }
  attach() {
    for (let key of this.keys) {
      // Attach the event listeners.
      this.engine.observe(key, this.listener);
    }
  }
  detach() {
    for (let key of this.keys) {
      // Detach the event listeners.
      this.engine.unobserve(key, this.listener);
    }
  }
  clear() {
    this.detach();
  }
  get(): Array<number> {
    return this.entities;
  }
  handleEvent(e: Object): void {
    // Ignore entity events.
    if (e.type !== 'component') return;
    const { key, values } = e;
    // TODO Also, this is slow as hell because string -> number.
    for (let id in values) {
      const entity = this.engine.get(parseInt(id));
      if (values[id] == null) {
        if (entity == null) continue;
        // This means the entity just got the component - Run insertion check.
        let valid = true;
        for (let component of this.keys) {
          if (!entity || entity.get(component) == null) {
            valid = false;
            break;
          }
        }
        // Insert to the entity list.
        if (valid && entity) this.entities.push(entity.id);
      } else {
        let index = this.entities.indexOf(parseInt(id));
        // Check if entity belongs to us.
        if (index === -1) continue;
        // If entity or specified component is deleted, just delete it.
        if (entity == null || entity.get(key) == null) {
          this.entities.splice(index, 1);
          continue;
        }
      }
    }
  }
}
