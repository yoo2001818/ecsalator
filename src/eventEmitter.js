/* @flow */

// Simplified EventEmitter implementation
export default class EventEmitter {
  listenerData: { [name: string]: Array<Function> };
  constructor() {
    this.listenerData = {};
  }
  emit(event: string, ...args: Array<any>): void {
    let group = this.listenerData[event];
    if (group == null) return;
    group.forEach(listener => listener.apply(null, args));
  }
  on(event: string, listener: Function): boolean {
    // Init event group if not exists
    if (this.listenerData[event] == null) {
      this.listenerData[event] = [listener];
      return true;
    }
    // Or check if it already exists
    let group = this.listenerData[event];
    if (group.indexOf(listener) !== -1) return false;
    group.push(listener);
    return true;
  }
  addListener(event: string, listener: Function): boolean {
    return this.on(event, listener);
  }
  listeners(event: string): Array<Function> {
    return this.listenerData[event] || [];
  }
  removeAllListeners(event: string): boolean {
    // Clear the whole event group
    if (this.listenerData[event] == null) return false;
    delete this.listenerData[event];
    return true;
  }
  removeListener(event: string, listener: Function): boolean {
    // Or check if it already exists
    let group = this.listenerData[event];
    if (group == null) return false;
    let index = group.indexOf(listener);
    if (index === -1) return false;
    group.splice(index, 1);
    return true;
  }
}
