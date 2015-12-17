/* @flow */

const INIT = '@@engine/init';
const UPDATE = '@@engine/update';

type ComponentHolder = { [key: Number]: any };
type State = { id: ComponentHolder, [key: String]: ComponentHolder };
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
  constructor(
    middlewares: Array<Middleware>,
    systems: Array<System>,
    components: Array<string>,
    state: ?State
  ) {
    // Set up the state.
    //
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

    this.dispatch = action => combinedDispatch(this, action);

    // Dispatch init action to initialize the engine state.
    this.dispatch({ type: INIT });
  }

  _dispatchToSystems(action: Action): Action {
    // Iterate through systems
    // Although systems have 'actions' property, we'll skip that for now.
    for (let system of this.systems) {
      system(this, action);
    }
    return action;
  }

  // An utility function to generate 'update' action.
  update(delta: number = 0) {
    this.dispatch({
      type: UPDATE,
      payload: { delta }
    });
  }
}
