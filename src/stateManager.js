/* @flow */
type Event = {
  type: string;
  data?: any;
};
import EventEmitter from './eventEmitter';
import LinkedDeque from './util/linkedDeque';

export default class StateManager extends EventEmitter {
  queue: LinkedDeque;
  finalizer: (event: Event, notify: (event: ?Event) => void) => any;
  notify: (event: ?Event) => void;
  recentEvent: ?Event;
  constructor(finalizer: (event: Event) => any) {
    super();
    this.queue = new LinkedDeque();
    this.finalizer = finalizer;
    // Wrap notify function with this scope
    this.notify = this.notify.bind(this);
    this.recentEvent = null;
  }
  notify(event: ?Event): void {
    if (this.recentEvent == null) {
      throw new Error('There is no event to notify');
    }
    if (event != null) {
      this.emit(event.type, event);
    } else {
      this.emit(this.recentEvent.type, this.recentEvent);
    }
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
