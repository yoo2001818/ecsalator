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
  actionQueue: Array<Action>;
  subscribers: EventEmitter;
  subscribeQueue: { [key: string]: boolean };

  constructor() {
    this.canDispatch = true;
    this.canEdit = false;
    this.subscribers = new EventEmitter();
    this.subscribeQueue = {};
    this.actions = new EventEmitter();
    this.changes = new StateManager(this.handleChange.bind(this));
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
  commitAction(): void {
    // Then resolve the remaining actions.
    while (this.actionQueue.length > 0) {
      let action = this.actionQueue.shift();
      this.dispatch(action);
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
  handleChange(event: Event): void {
    // Traverse controllers and notify if it listens to the event.
    for (let name in this.controllers) {
      let controller = this.controllers[name];
      if (typeof controller[event.type] === 'function') {
        // Notify the controller and set subscribe queue.
        this.subscribeQueue[name] = true;
        controller[event.type](event);
      }
    }
  }
  subscribe(name: string, callback: Function): void {
    this.subscribers.on(name, callback);
  }
  unsubscribe(name: string, callback: Function): void {
    this.subscribers.removeListener(name, callback);
  }
}
