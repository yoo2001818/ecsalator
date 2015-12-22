/* @flow */

import Engine from './engine';

// Queues the events and emits them once after the action has processed.

export default class EventQueue {
  engine: ?Engine;
  entityQueue: Map<number, Object>;
  componentQueue: Map<string, Object>;
  entityListeners: Map<number, Set<Function>>;
  componentListeners: Map<string, Set<Function>>;

  constructor(engine: ?Engine) {
    this.engine = engine;
    this.entityQueue = new Map();
    this.componentQueue = new Map();
    this.entityListeners = new Map();
    this.componentListeners = new Map();
  }

  observeEntry(id: number, listener: Function): void {
    let listeners = this.entityListeners.get(id);
    if (listeners === undefined) {
      listeners = new Set();
      this.entityListeners.set(id, listeners);
    }
    listeners.add(listener);
  }

  unobserveEntry(id: number, listener: Function): void {
    let listeners = this.entityListeners.get(id);
    if (listeners === undefined) return;
    listeners.delete(listener);
    if (listeners.size === 0) {
      this.entityListeners.delete(id);
    }
  }

  observeComponent(name: string, listener: Function): void {
    let listeners = this.componentListeners.get(name);
    if (listeners === undefined) {
      listeners = new Set();
      this.componentListeners.set(name, listeners);
    }
    listeners.add(listener);
  }

  unobserveComponent(name: string, listener: Function): void {
    let listeners = this.componentListeners.get(name);
    if (listeners === undefined) return;
    listeners.delete(listener);
    if (listeners.size === 0) {
      this.componentListeners.delete(name);
    }
  }

  // Push new event to the queue. If the event is already created, it'll be
  // ignored.
  push(entity: number, component: string, previous: any): void {
    // Handle entity events...
    if (this.entityListeners.has(entity)) {
      let diff = this.entityQueue.get(entity);
      if (diff === undefined) {
        diff = {};
        this.entityQueue.set(entity, diff);
      }
      if (diff[component] === undefined) {
        diff[component] = previous;
      }
    }
    // Handle component events...
    if (this.componentListeners.has(component)) {
      let diff = this.componentQueue.get(component);
      if (diff === undefined) {
        diff = {};
        this.componentQueue.set(component, diff);
      }
      if (diff[entity] === undefined) {
        diff[entity] = previous;
      }
    }
  }

  // Iterate through event queue and notify the observers.
  notify(): void {
    const { engine } = this;
    // Notify entity listeners.
    for (let entity: number of this.entityQueue.keys()) {
      const components = this.entityQueue.get(entity);
      let listeners = this.entityListeners.get(entity);
      if (listeners === undefined) continue;
      for (let listener of listeners.values()) {
        listener({
          type: 'entity',
          entity, components, engine
        });
      }
    }
    // Notify component listeners.
    for (let component: string of this.componentQueue.keys()) {
      const entities = this.componentQueue.get(component);
      let listeners = this.componentListeners.get(component);
      if (listeners === undefined) continue;
      for (let listener of listeners.values()) {
        listener({
          type: 'component',
          component, entities, engine
        });
      }
    }
  }
}
