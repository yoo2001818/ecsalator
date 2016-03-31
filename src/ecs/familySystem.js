import * as ecsChanges from './changes';
import BitSet from '../util/bitSet';

export class Family {
  constructor(id, pattern) {
    this.id = id;
    this.pattern = pattern;
    this.entities = [];
  }
  match(entityPattern) {
    return entityPattern.contains(this.pattern);
  }
  add(entity) {
    this.entities.push(entity);
  }
  remove(entity) {
    this.entities.splice(this.entities.indexOf(entity), 1);
  }
}

export default class FamilySystem {
  constructor() {
    this.families = [];
    this.entityComponents = [];
    this.entityFamilies = [];
  }
  onMount(store) {
    this.store = store;
    // Register changes
    store.changes.on(ecsChanges.ENTITY_CREATE, change => {
      const { entity, template } = change.data;
      let pattern = this.createBitSet();
      // Iterate through and push all components
      for (let name in template) {
        pattern.set(this.getPos(name));
      }
      this.entityComponents[entity.id] = pattern;
      this.entityFamilies[entity.id] = new BitSet();
      // Update the entity
      this.updateEntity(entity);
    });
    store.changes.on(ecsChanges.ENTITY_REMOVE, change => {
      const entity = change.data;
      const familyPattern = this.entityFamilies[entity.id];
      if (familyPattern == null) return;
      // Remove from all families
      for (let i = 0; i < this.families.length; ++i) {
        let family = this.families[i];
        if (familyPattern.get(family.id)) {
          family.remove(entity);
        }
      }
      // Done!
      delete this.entityFamilies[entity.id];
      delete this.entityComponents[entity.id];
    });
    store.changes.on(ecsChanges.SET, change => {
      const { entity, key } = change.data;
      if (this.entityComponents[entity.id] == null) return;
      // Skip if entity already have the component
      if (this.entityComponents[entity.id].get(this.getPos(key))) return;
      this.entityComponents[entity.id].set(this.getPos(key));
      this.updateEntity(entity);
    });
    store.changes.on(ecsChanges.REMOVE, change => {
      const { entity, key } = change.data;
      if (this.entityComponents[entity.id] == null) return;
      this.entityComponents[entity.id].clear(this.getPos(key));
      this.updateEntity(entity);
    });
  }
  get(components) {
    let pattern = this.createBitSet();
    for (let i = 0; i < components.length; ++i) {
      pattern.set(this.getPos(components[i]));
    }
    // Iterate and find matching family
    for (let i = 0; i < this.families.length; ++i) {
      let family = this.families[i];
      if (family.pattern.equals(pattern)) return family;
    }
    // Create if it doesn't exist
    let family = new Family(this.families.length, pattern);
    this.families.push(family);
    // Iterate and add all matching entities
    for (let i = 0; i < this.store.state.entityList.length; ++i) {
      let entity = this.store.state.entityList[i];
      let pattern = this.entityComponents[entity.id];
      let familyPattern = this.entityFamilies[entity.id];
      if (family.match(pattern)) {
        familyPattern.set(family.id);
        family.add(entity);
      }
    }
    return family;
  }
  updateEntity(entity) {
    let pattern = this.entityComponents[entity.id];
    let familyPattern = this.entityFamilies[entity.id];
    for (let i = 0; i < this.families.length; ++i) {
      let family = this.families[i];
      let current = family.match(pattern);
      let previous = familyPattern.get(family.id);
      if (current !== previous) {
        familyPattern.set(family.id, current);
        if (current) {
          family.add(entity);
        } else {
          family.remove(entity);
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
