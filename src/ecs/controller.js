import * as ecsChanges from './changes';

const ECSController = {
  [ecsChanges.ENTITY_CREATE]: (change, store) => {
    const { id, template } = change.data;
    store.state.create(id, template);
  },
  [ecsChanges.ENTITY_REMOVE]: (change, store) => {
    store.state.remove(change.data);
  },
  [ecsChanges.SET]: (change, store) => {
    const { id, key, value } = change.data;
    store.state.get(id).set(key, value);
  },
  [ecsChanges.REMOVE]: (change, store) => {
    const { id, key } = change.data;
    store.state.get(id).remove(key);
  }
};

export default ECSController;
