/* @flow */

// Not sure if circular reference is okay.
import Engine from './engine';

export default class Entity {
  engine: Engine;
  id: number;
  constructor(engine: Engine, id: number) {
    this.engine = engine;
    this.id = id;
  }

  isValid(): boolean {
    return this.engine.state.id[this.id] !== undefined;
  }

  checkValidity(): void {
    if (!this.isValid()) throw new Error('Specified entity does not exist.');
  }

  get(key: string): any {
    this.checkValidity();
    let component = this.engine.state[key];
    // 'meta' component shouldn't be accessed, as it can cause an error.
    if (key === 'meta') throw new Error(`'meta' component is reserved`);
    if (component === undefined) {
      throw new Error(`The component ${key} is not defined`);
    }
    return component[this.id];
  }

  set(key: string, value: any): void {
    this.checkValidity();
    // STOP if engine is locked.
    if (!this.engine.unlocked) throw new Error('Engine is locked');
    // 'id' component is reserved; deny overriding it.
    if (key === 'id') throw new Error(`'id' component is reserved`);
    // 'meta' component is reserved too.
    if (key === 'meta') throw new Error(`'meta' component is reserved`);
    let component = this.engine.state[key];
    if (component === undefined) {
      throw new Error(`The component ${key} is not defined`);
    }
    // Issue the change event...
    this.engine.notifyChange(this.id, key, component[this.id]);
    // And update the component.
    component[this.id] = value;
  }

  remove(key: string): void {
    this.checkValidity();
    // STOP if engine is locked.
    if (!this.engine.unlocked) throw new Error('Engine is locked');
    // 'id' component is reserved; deny overriding it.
    // FYI: deleting 'id' component will make the engine think the entity is
    // not available. Since it can lead to memory leak, it should be prevented.
    if (key === 'id') throw new Error(`'id' component is reserved`);
    // 'meta' component is reserved too.
    if (key === 'meta') throw new Error(`'meta' component is reserved`);
    let component = this.engine.state[key];
    if (component === undefined) {
      throw new Error(`The component ${key} is not defined`);
    }
    // Issue the change event...
    this.engine.notifyChange(this.id, key, component[this.id]);
    // And remove the component.
    delete component[this.id];
  }

  observe(observer: Function): void {
    this.engine.entityQueue.observe(this.id, observer);
  }

  unobserve(observer: Function): void {
    this.engine.entityQueue.unobserve(this.id, observer);
  }
}
