/* @flow */

import EventEmitter from './eventEmitter';
import StateManager from './stateManager';

type Action = {
  type: string;
  payload?: any;
  meta?: any;
};

type Event = {
  type: string;
  data?: any;
};

// V8 Engine can't optimize functions with try...catch...finally.
// So this function wraps them in order to minimize the effect of optimization
// failure.
function tryFinally(tryCall, finallyCall) {
  try {
    return tryCall();
  } finally {
    finallyCall();
  }
}

export default class Store {
  actions: EventEmitter;
  changes: StateManager;
  state: any;
  systems: { [key: string]: Object };
  controllers: { [key: string]: Object };
  canDispatch: boolean;
  canEdit: boolean;
  constructor() {
    this.canDispatch = true;
    this.canEdit = false;
  }
  dispatch(action: Action) {
    // Middlewares are not implemented yet
    return this.handleAction(action);
  }
  handleAction(action: Action): void {
    // Lock dispatch and reset changes.
    this.canDispatch = false;
    this.changes.reset();
    tryFinally(() => {
      // Notify the action to the systems.
      this.actions.emit(action.type, action);
      this.actions.emit('all', action);
      // Commit changes.
      this.canEdit = true;
      tryFinally(() => {
        this.changes.commit();
      }, () => {
        this.canEdit = true;
      });
    }, () => {
      // Unlock the dispatch regardless if it has failed or not.
      this.canDispatch = true;
    });
  }
  handleChange(event: Event): void {
    // Traverse controllers and notify if it listens to the event.
    for (let name in this.controllers) {
      let controller = this.controllers[name];
      if (typeof controller[event.type] === 'function') {
        // Notify the controller and the view... TODO
        controller[event.type](event);
      }
    }
  }
}
