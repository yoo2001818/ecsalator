/* @flow */

import Store, { applyMiddleware } from './store';

export default class StoreFactory {
  state: any;
  systems: { [key: string]: Object };
  controllers: { [key: string]: Object };
  middlewares: Array<Function>;
  constructor() {
    this.systems = {};
    this.controllers = {};
    this.middlewares = [];
  }
  create(): Store {
    let store = new Store(
      this.systems, this.controllers, this.state
    );
    applyMiddleware(this.middlewares, store);
    return store;
  }
  setState(state: any): void {
    this.state = state;
  }
  addController(name: string, controller: Object | Function): void {
    if (this.controllers[name] != null) {
      throw new Error(`Controller ${name} already occupied`);
    }
    if (typeof controller === 'function') {
      this.controllers[name] = new controller();
    } else {
      this.controllers[name] = controller;
    }
  }
  addSystem(name: string, system: Object | Function): void {
    if (this.systems[name] != null) {
      throw new Error(`System ${name} already occupied`);
    }
    if (typeof system === 'function') {
      this.systems[name] = new system();
    } else {
      this.systems[name] = system;
    }
  }
  addMiddleware(middleware: Function): void {
    this.middlewares.push(middleware);
  }
}
