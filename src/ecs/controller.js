import * as ecsChanges from './changes';

const ECSController = {
  [ecsChanges.ENTITY_CREATE]: (change, store, notify) => {
    const { id, template } = change.data;
    // Manipulate change data to include entity data
    change.data.entity = store.state.create(id, template);
    notify(change);
  },
  [ecsChanges.ENTITY_REMOVE]: (change, store, notify) => {
    notify();
    store.state.remove(change.data);
  },
  [ecsChanges.SET]: (change) => {
    const { entity, key, value } = change.data;
    entity.set(key, value);
  },
  [ecsChanges.REMOVE]: (change) => {
    const { entity, key } = change.data;
    entity.remove(key);
  }
};

export default ECSController;
