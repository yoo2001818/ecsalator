/* @flow */

// Queues the events and emits them once after the action has processed.

export default class EventQueue<K: number | string, V: number | string> {
  engine: any;
  queue: Map<K, Object>;
  observers: Map<K, Set<Function>>;

  constructor(engine: any) {
    this.engine = engine;
    this.queue = new Map();
    this.observers = new Map();
  }

  observe(key: K, observer: Function): void {
    let observers = this.observers.get(key);
    if (observers === undefined) {
      observers = new Set();
      this.observers.set(key, observers);
    }
    observers.add(observer);
  }

  unobserve(key: K, observer: Function): void {
    let observers = this.observers.get(key);
    if (observers === undefined) return;
    observers.delete(observer);
    if (observers.size === 0) {
      this.observers.delete(key);
    }
  }

  // Push new event to the queue. If the event is already created, it'll be
  // ignored.
  push(key: K, value: V, previous: any): void {
    if (this.observers.has(key)) {
      let diff = this.queue.get(key);
      if (diff === undefined) {
        diff = {};
        this.queue.set(key, diff);
      }
      if (diff[value] === undefined) {
        diff[value] = previous;
      }
    }
  }

  // Iterate through event queue and notify the observers.
  notify(): void {
    const { engine } = this;
    for (let key: K of this.observers.keys()) {
      const values = this.queue.get(key);
      let observers = this.observers.get(key);
      if (observers === undefined) continue;
      for (let observer of observers.values()) {
        observer({
          type: 'entity',
          key, values, engine
        });
      }
    }
  }
}
