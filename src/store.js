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

export function applyMiddleware(
  middlewares: Array<Function>, store: Object
): void {
  let next = store.dispatch.bind(store);
  middlewares.reverse().forEach(middleware => {
    next = middleware(store)(next);
  });
  // Wrap the store object
  store.dispatch = next;
}

export default class Store {
  actions: EventEmitter;
  changes: StateManager;
  state: any;
  systems: { [key: string]: Object };
  controllers: { [key: string]: Object };
  controllerHandlers: { [key: string]: { name: string, handler: Function} };
  canDispatch: boolean;
  canEdit: boolean;
  actionQueue: Array<Action>;
  subscribers: EventEmitter;
  subscribeQueue: { [key: string]: boolean };

  constructor(
    systems: { [key: string]: Object },
    controllers: { [key: string]: Object },
    state: any
  ) {
    this.canDispatch = true;
    this.canEdit = false;
    this.subscribers = new EventEmitter();
    this.subscribeQueue = {};
    this.actions = new EventEmitter();
    this.changes = new StateManager(this.handleChange.bind(this));
    this.actionQueue = [];

    this.state = state;
    if (state && typeof(state.onMount) === 'function') {
      state.onMount(this);
    }

    this.systems = systems;
    for (let name in systems) {
      let system = systems[name];
      if (system && typeof(system.onMount) === 'function') {
        system.onMount(this);
      }
    }

    this.controllers = controllers;
    this.controllerHandlers = {};
    for (let name in controllers) {
      let controller = controllers[name];
      for (let eventName in controller) {
        if (eventName === 'onMount') continue;
        if (this.controllerHandlers[eventName] != null) {
          throw new Error('Controller event ' + eventName + ' conflicts');
        }
        this.controllerHandlers[eventName] = {
          handler: controller[eventName], name
        };
      }
      if (controller && typeof(controller.onMount) === 'function') {
        controller.onMount(this);
      }
    }
  }
  dispatch(action: Action) {
    // Middlewares are not implemented yet
    return this.handleAction(action);
  }
  queueAction(action: Action): void {
    this.actionQueue.push(action);
  }
  // private
  handleAction(action: Action): void {
    if (!this.canDispatch) return this.queueAction(action);
    // Lock dispatch and reset changes.
    this.canDispatch = false;
    this.changes.reset();
    tryFinally(() => {
      this.processAction(action);
      this.commitAction();
      this.commitSubscribers();
    }, () => {
      // Unlock the dispatch regardless if it has failed or not.
      this.canDispatch = true;
      // Clear the remaining action queue. Not sure if this is good. TODO
      if (this.actionQueue.length > 0) this.actionQueue = [];
    });
  }
  // private
  processAction(action: Action): void {
    this.changes.reset();
    this.actions.emit(action.type, action);
    this.actions.emit('all', action);
    // Commit changes.
    this.canEdit = true;
    tryFinally(() => {
      this.changes.commit();
    }, () => {
      this.canEdit = false;
    });
  }
  // private
  commitAction(): void {
    // Then resolve the remaining actions.
    while (this.actionQueue.length > 0) {
      let action = this.actionQueue.shift();
      this.processAction(action);
    }
  }
  // private
  commitSubscribers(): void {
    let emitted = false;
    for (let name in this.subscribeQueue) {
      this.subscribers.emit(name);
      emitted = true;
    }
    if (emitted) this.subscribers.emit('all');
    this.subscribeQueue = {};
  }
  // internal
  handleChange(event: Event, notify: Function): void {
    let controller = this.controllerHandlers[event.type];
    if (controller == null) return;
    controller.handler.call(this.controllers[controller.name],
      event, this, notify);
    this.subscribeQueue[controller.name] = true;
  }
  subscribe(name: string, callback: Function): void {
    this.subscribers.on(name, callback);
  }
  unsubscribe(name: string, callback: Function): void {
    this.subscribers.removeListener(name, callback);
  }
}
