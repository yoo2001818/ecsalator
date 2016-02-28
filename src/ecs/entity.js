import State from './state';

export default class Entity {
  state: State;
  id: number;
  constructor(state: State, id: number) {
    this.state = state;
    this.id = id;
  }
  isValid(): boolean {
    return this.state.entities.has(this.id);
  }
  checkValidity(): void {
    if (!this.isValid()) throw new Error('Specified entity does not exist.');
  }
  get(key: string): any {
    this.checkValidity();
    let component = this.state.components[key];
    if (component === undefined) {
      throw new Error(`The component ${key} is not defined`);
    }
    return component.get(this.id);
  }
  set(key: string, value: any): void {
    this.checkValidity();
    let component = this.state.components[key];
    if (component === undefined) {
      throw new Error(`The component ${key} is not defined`);
    }
    component.set(this.id, value);
  }

  remove(key: string): void {
    this.checkValidity();
    let component = this.state.components[key];
    if (component === undefined) {
      throw new Error(`The component ${key} is not defined`);
    }
    component.delete(this.id);
  }

}
