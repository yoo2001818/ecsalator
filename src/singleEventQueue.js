/* @flow */

// Single event queue, queues the event but it is not two-dimensional,
// one key has only one previous value.

export default class SingleEventQueue {
  engine: any;
  type: string;
  queue: Map<string, any>;
  observers: Map<string, Set<Function>>;

  constructor(engine: any, type: string) {
    this.engine = engine;
    this.queue = new Map();
    this.observers = new Map();
    this.type = type;
  }

  observe(key: string, observer: Function): void {
    let observers = this.observers.get(key);
    if (observers === undefined) {
      observers = new Set();
      this.observers.set(key, observers);
    }
    observers.add(observer);
  }

  unobserve(key: string, observer: Function): void {
    let observers = this.observers.get(key);
    if (observers === undefined) return;
    observers.delete(observer);
    if (observers.size === 0) {
      this.observers.delete(key);
    }
  }

  // Push new event to the queue. If the event is already created, it'll be
  // ignored.
  push(key: string, previous: any): void {
    if (this.observers.has(key)) {
      let diff = this.queue.get(key);
      if (diff === undefined) {
        diff = previous;
        this.queue.set(key, diff);
      }
    }
  }

  // Iterate through event queue and notify the observers.
  notify(): void {
    const { engine, type } = this;
    for (let key: string of this.queue.keys()) {
      const value = this.queue.get(key);
      let observers = this.observers.get(key);
      if (observers === undefined) continue;
      let event = { type, key, value, engine };
      for (let observer of observers.values()) {
        observer(event);
      }
    }
    // Empty the event queue.
    this.queue.clear();
  }

}
