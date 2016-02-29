export default class Entity {
  id: number;
  constructor(id: number) {
    this.id = id;
  }
  // Entity literally does nothing. really. It can be a plain old JavaScript
  // object if there were no interface methods.
  get(key: string): any {
    return this[key];
  }
  has(key: string): boolean {
    return this[key] !== undefined;
  }
  set(key: string, value: any): void {
    // Currently this doesn't explictly check if the component exists.
    this[key] = value;
  }
  remove(key: string): void {
    delete this[key];
  }
}
