/* @flow */

type Engine = any;
type Action = any;

type System = ((engine: Engine, action: Action) => any);

type Middleware = ((
  engine: Engine,
  action: Action,
  next: ((action: Action) => any)
) => any);

export default function combineSystems(
  systems: Array<System>
): Middleware {
  return (engine, action, next) => {
    for (let system: System of systems) {
      system.call(system, engine, action);
    }
    return next(action);
  };
}
