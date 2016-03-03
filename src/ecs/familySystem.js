import * as ecsChanges from './changes';
import BitSet from '../util/bitSet';

export class Family {
  constructor(id, pattern) {
    this.id = id;
    this.pattern = pattern;
    this.entities = [];
  }
  match(entityPattern) {
    return this.pattern.contains(entityPattern);
  }
  add(entity) {
    this.entities.push(entity);
  }
  remove(entity) {
    this.entities.splice(entity, 1);
  }
}

export default class FamilySystem {
  onMount(store) {
    this.store = store;
    this.families = [];
    this.entityComponents = [];
    this.entityFamilies = [];
    // Register changes
    store.changes.on(ecsChanges.ENTITY_CREATE, change => {
      const { id, template } = change.data;
      let pattern = this.createBitSet();
      // Iterate through and push all components
      for (let name in template) {
        pattern.set(this.getPos(name));
      }
      this.entityComponents[id] = pattern;
      this.entityFamilies[id] = new BitSet();
      // Update the entity
      this.updateEntity(id);
    });
    store.changes.on(ecsChanges.ENTITY_REMOVE, change => {
      const { id } = change.data;
      const familyPattern = this.entityFamilies[id];
      // Remove from all families
      for (let family of this.families) {
        if (familyPattern.get(family.id)) {
          family.remove(id);
        }
      }
      // Done!
      delete this.entityFamilies[id];
      delete this.entityComponents[id];
    });
    store.changes.on(ecsChanges.SET, change => {
      const { id, key } = change.data;
      this.entityComponents[id].set(this.getPos(key));
      this.updateEntity(id);
    });
    store.changes.on(ecsChanges.REMOVE, change => {
      const { id, key } = change.data;
      this.entityComponents[id].clear(this.getPos(key));
      this.updateEntity(id);
    });
  }
  updateEntity(id) {
    let pattern = this.entityComponents[id];
    let familyPattern = this.entityFamilies[id];
    for (let family of this.families) {
      let current = family.match(pattern);
      let previous = familyPattern.get(family.id);
      if (current !== previous) {
        familyPattern.set(family.id, current);
        if (current) {
          family.add(id);
        } else {
          family.remove(id);
        }
      }
    }
  }
  createBitSet() {
    return new BitSet(this.store.state.components.length);
  }
  getPos(component) {
    return this.store.state.components.indexOf(component);
  }
}
