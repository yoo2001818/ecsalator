/* @flow */
type Event = {
  type: string;
  data?: any;
};
import EventEmitter from './eventEmitter';

export default class StateManager extends EventEmitter {
  queue: Array<Event>;
  finalizer: (event: Event, notify: () => void) => any;
  notify: () => void;
  recentEvent: ?Event;
  constructor(finalizer: (event: Event) => any) {
    super();
    this.queue = [];
    this.finalizer = finalizer;
    // Wrap notify function with this scope
    this.notify = this.notify.bind(this);
    this.recentEvent = null;
  }
  notify(): void {
    if (this.recentEvent == null) {
      throw new Error('There is no event to notify');
    }
    this.emit(this.recentEvent.type, this.recentEvent);
    this.recentEvent = null;
  }
  push(event: Event | string, data: ?any): void {
    if (typeof event === 'string') {
      this.queue.push({
        type: event, data
      });
      return;
    }
    this.queue.push(event);
  }
  unshift(event: Event | string, data: ?any): void {
    if (typeof event === 'string') {
      this.queue.unshift({
        type: event, data
      });
      return;
    }
    this.queue.unshift(event);
  }
  commit(): void {
    // Commit remaining data from the cache
    while (this.queue.length > 0) {
      let event = this.queue.shift();
      this.recentEvent = event;
      // Finalize
      this.finalizer(event, this.notify);
      // Notify action if finalizer hasn't processed it yet.
      if (this.recentEvent != null) this.notify();
    }
  }
  reset(): void {
    if (this.queue.length > 0) this.queue = [];
  }
}
