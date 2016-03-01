import createChange from '../util/createChange';

export const ENTITY_CREATE = 'ecs/entityCreate';
export const ENTITY_REMOVE = 'ecs/entityRemove';
export const SET = 'ecs/set';
export const REMOVE = 'ecs/remove';

export const entityCreate = createChange(ENTITY_CREATE,
  (id, template) => ({ id, template })
);
export const entityRemove = createChange(ENTITY_REMOVE);
export const set = createChange(SET,
  (id, key, value) => ({ id, key, value })
);
export const remove = createChange(REMOVE,
  (id, key) => ({ id, key })
);
