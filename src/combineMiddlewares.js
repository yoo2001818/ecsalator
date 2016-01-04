/* @flow */

// Engine and Action are not known yet, so we have to use a placeholder
// in order to make this run.
type Engine = any;
type Action = any;

type Middleware = ((
  engine: Engine,
  action: Action,
  next: ((action: Action) => any)
) => any);

export default function combineMiddlewares(
  middlewares: Array<Middleware>
): Middleware {
  // I know this isn't a really good method, but I can't think a better way to
  // do it. Please let me know if there is a better way.
  return (engine, action, last = action => action): any => {
    let i = -1;
    const processNext = action => {
      i++;
      if (i >= middlewares.length) {
        return last(action);
      }
      let current = middlewares[i];
      return current(engine, action, processNext);
    };
    return processNext(action);
  };
}
