import * as ecsChanges from './changes';

const ECSController = {
  [ecsChanges.ENTITY_CREATE]: (change, store, notify) => {
    const { id, template } = change.data;
    // Manipulate change data to include entity data
    let entity = store.state.create(id);
    change.data.entity = entity;
    for (let name in template) {
      // Use template to call SET change event
      store.changes.unshift(ecsChanges.set(entity, name, template[name]));
    }
    notify(change);
  },
  [ecsChanges.ENTITY_REMOVE]: (change, store, notify) => {
    notify();
    store.state.remove(change.data);
  },
  [ecsChanges.SET]: (change) => {
    const { entity, key, value } = change.data;
    // notify();
    entity.set(key, value);
  },
  [ecsChanges.REMOVE]: (change) => {
    const { entity, key } = change.data;
    // notify();
    entity.remove(key);
  }
};

export default ECSController;
