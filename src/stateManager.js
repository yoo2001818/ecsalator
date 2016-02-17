/* @flow */
type Event = {
  type: string;
  data?: any;
};
import EventEmitter from './eventEmitter';

export default class StateManager extends EventEmitter {
  queue: Array<Event>;
  finalizer: (event: Event) => any;
  constructor(finalizer: (event: Event) => any) {
    super();
    this.queue = [];
    this.finalizer = finalizer;
  }
  push(event: Event): void {
    this.queue.push(event);
  }
  unshift(event: Event): void {
    this.queue.unshift(event);
  }
  commit(): void {
    // Commit remaining data from the cache
    while (this.queue.length > 0) {
      let event = this.queue.shift();
      // Pass to event listeners..
      this.emit(event.type, event);
      // Finalize
      this.finalizer(event);
    }
  }
}
