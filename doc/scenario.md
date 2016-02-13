# Basic concepts
Ecsalator has various components, and those work together to create a game
engine.

## Action
Action is an event that notifies something - A timer event, A mouse click event,
key event, or even a network event, anything! Basically its idea is as same as
[Flux's action][flux-action].

Action can contain payloads - as long as it's JSON-compatiable. Ecsalator
follows [Flux standard action][flux-standard-action], however you don't have to
strictly follow this. However you still need to use `type` field.

If an action is dispatched to the store, store will process it.

## Store
Store hooks everything up - it stores the game state (kinda obvious),
manages systems and middlewares, etc. Basically it is the root object of the
game - Everything belongs to it.

If an action were dispatched to the store, store will pass it to the middleware
chain, then systems, then state manager will commit the changes. We'll talk
about this later!

## Middleware
Middleware intercepts the action, so you can alter, stop, dispatch the action.

Middlewares are chained - first middleware executes first, then next, next,
eventually it'll reach the store's dispatch function and system's job starts.

Middleware can be useful for logging, injecting random value in multiplayer
games, or sending the action to the multiplayer server.

## System
System reads the action and the state. Then it emits change events - which will
be queued to the StateManager and committed. System is NOT allowed to dispatch
another action, or directly modify the state.

Systems can listen on change event, and emit change events. This can lead to
infinite loop if care is not given. However systems can't cancel the change
events.

If system throws an error, whole change event queue will be discarded, which
can be used to avoid desync error. However if an error occurs while committing
the changes, the engine will fail prematurely, which will lead to desync error.

So try to keep the validation routine in the main system function if possible.

## StateManager
StateManager queues change events and commits them. Systems and
ChangeControllers can register event listeners to it.

## ChangeController
ChangeController actually commits the change event to the state - only
ChangeController can change the state.

## State
State actually stores the game information, and it's readable by everyone.
State can be anything - however it must implement fromJSON, toJSON for
serialization.

# Initialization
Store receives quite many arguments, so StoreFactory class is available to
make creating the store instance easier.

Store have following arguments:

- `middlewares` - An array of middlewares.
- `systems` - An array of systems.
- `changeControllers` - An array of change controllers.
- `state` - A state object.

[flux-action]: https://facebook.github.io/flux/docs/overview.html#actions
[flux-standard-action]: https://github.com/acdlite/flux-standard-action
