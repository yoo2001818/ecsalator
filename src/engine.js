/* @flow */

import Entity from './entity';
import EventQueue from './eventQueue';

const INIT = '@@engine/init';
const UPDATE = '@@engine/update';

type ComponentHolder = { [key: number]: any };
type State = { id: ComponentHolder, [key: string]: ComponentHolder };
type Action = { type: string, payload?: Object, meta?: Object };
type Middleware = ((engine: Engine, action: Action, next: Function) => any);
type System = ((engine: Engine, action: Action) => any);

function setupMiddlewares(
  middlewares: Array<Middleware>,
  final: ((engine: Engine, action: Action) => any)
): ((engine: Engine, action: Action) => any) {
  let next = final;
  for (let middleware: Middleware of middlewares.reverse()) {
    const localNext = next;
    next = (engine: Engine, action: Action) => middleware(engine, action,
      action => localNext(engine, action)
    );
  }
  return next;
}

export default class Engine {
  state: State;
  systems: Array<System>;
  dispatch: ((action: Action) => any);
  unlocked: boolean;
  entityQueue: EventQueue<number, string>;
  componentQueue: EventQueue<string, number>;
  constructor(
    middlewares: Array<Middleware>,
    systems: Array<System>,
    components: Array<string>,
    state: ?State
  ) {
    // Init event queue.
    this.entityQueue = new EventQueue(this, 'entity');
    this.componentQueue = new EventQueue(this, 'component');
    // Set up the state.
    //
    // First, check if 'id' component is occupied; This component is reserved
    // for ID checking.
    if (components.indexOf('id') !== -1) {
      throw new Error(`'id' component is reserved by the engine`);
    }
    // If state is provided, Just overwrite current state to it.
    // Although we need to check every component in the components array is
    // present.
    if (state != null) {
      const stateKeys = Object.keys(state);
      const componentKeys = components.concat(['id']);
      // Compare the keys.
      let surplus = stateKeys.filter(
        name => componentKeys.indexOf(name) === -1
      );
      let deficient = componentKeys.filter(
        name => stateKeys.indexOf(name) === -1
      );
      // If keys don't match, throw an error.
      if (surplus.length !== 0 || deficient.length !== 0) {
        throw new Error(
          'State and components array should match;\n' +
          `+: ${surplus.join(',')}\n` +
          `-: ${deficient.join(',')}`
        );
      }
      // Overwrite the state.
      this.state = state;
    } else {
      // Set up the state according to the components array.
      this.state = {id: {}};
      for (let component: string of components) {
        this.state[component] = {};
      }
    }
    // Configure systems and middleware chain.
    //
    // Systems don't need 'next' functions - we can just put them in an array
    // and call them.
    this.systems = systems;
    // Middlewares are different - we need to wrap the 'dispatch' function,
    // which actually dispatches the action to the systems.
    let combinedDispatch = setupMiddlewares(middlewares,
      (engine, action) => engine._dispatchToSystems(action)
    );

    this.dispatch = action => {
      // Check if it's unlocked - State will be unlocked only in
      // systems stage, however systems are not allowed to dispatch another
      // action.
      if (this.unlocked) {
        throw new Error('Systems cannot dispatch an action');
      }
      return combinedDispatch(this, action);
    };

    // Lock the state to prevent mutation.
    this.unlocked = false;

    // Dispatch init action to initialize the engine state.
    this.dispatch({ type: INIT });
  }

  _dispatchToSystems(action: Action): Action {
    // Check if it's unlocked again, though I don't think this is required.
    if (this.unlocked) {
      throw new Error('Systems cannot dispatch an action');
    }
    // Unlock the state.
    this.unlocked = true;
    // Try ... catch ... finally will cause optimization problem in V8 engine.
    // TODO optimization
    try {
      // Iterate through systems
      // Although systems have 'actions' property, we'll skip that for now.
      for (let system of this.systems) {
        system(this, action);
      }
    } finally {
      // Lock the state even if the running action has failed;
      // If we don't do this, engine will be locked forever!
      this.unlocked = false;
    }
    // If running the action was successful, notify the changes to the
    // observers.
    this.componentQueue.notify();
    this.entityQueue.notify();
    return action;
  }

  // An utility function to generate 'update' action.
  update(delta: number = 0): void {
    this.dispatch({
      type: UPDATE,
      payload: { delta }
    });
  }

  get(id: number): ?Entity {
    // Validate if the entity exists
    if (this.state.id[id] === undefined) return null;
    return new Entity(this, id);
  }

  create(id: ?number, template: ?Object): Entity {
    // Check if the engine is locked.
    if (!this.unlocked) throw new Error('Engine is locked');
    // Auto increment entity creation.
    if (id == null) {
      throw new Error('Not implemented yet');
    }
    // Validate if the entity exists
    if (this.state.id[id] !== undefined) {
      throw new Error('Entity already exists');
    }
    // Otherwise create the entity.
    let entity = new Entity(this, id);
    // And set the state to make it 'alive'.
    this.state.id[id] = 1;
    // If template is given, try to override to them.
    if (template != null) {
      for (let key of Object.keys(template)) {
        entity.set(key, template[key]);
      }
    }
    return entity;
  }

  remove(object: number | Entity): void {
    // Check if the engine is locked.
    if (!this.unlocked) throw new Error('Engine is locked');
    let id;
    // Try to match raw number.
    if (typeof object === 'number') id = object;
    // Try to match entity object.
    if (object.id !== undefined) id = object.id;
    // Validate if the entity doesn't exists
    if (this.state.id[id] === undefined) {
      throw new Error('Entity does not exists');
    }
    // And delete all the components from the entity.
    for (let key of Object.keys(this.state)) {
      let component = this.state[key][id];
      if (component !== undefined) {
        this.notifyChange(id, key, component);
      }
      delete this.state[key][id];
    }
  }

  notifyChange(entity: number, component: string, previous: any): void {
    this.componentQueue.push(component, entity, previous);
    this.entityQueue.push(entity, component, previous);
  }

  observe(component: string, observer: Function): void {
    this.componentQueue.observe(component, observer);
  }

  unobserve(component: string, observer: Function): void {
    this.componentQueue.unobserve(component, observer);
  }

}
