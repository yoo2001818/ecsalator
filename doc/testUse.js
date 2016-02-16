import { StoreFactory } from '../';

// Basic test - setting cursor position!

let factory = new StoreFactory();
// Setting state to raw object
factory.setState({});

// Add ChangeController
factory.addController('position', {
  positionSet: (store, event) => {
    store.state = event.data;
  }
});
// Alternatively...
factory.addController('position', class PositionController {
  onMount(store) {
    this.store = store;
  }
  positionSet(event) {
    this.store.state = event.data;
  }
});

// Then add systems
factory.addSystem('position', class PositionSystem {
  onMount(store) {
    this.store = store;
    store.actions.on('store/init', () => {
      store.changes.push('positionSet', {
        x: 0, y: 0
      });
    });
    store.actions.on('position/set', action => {
      store.changes.push('positionSet', action.payload);
      // Or....
      store.changes.push({
        type: 'positionSet',
        data: action.payload
      });
    });
  }
});

factory.addSystem('boundary', class BoundarySystem {
  onMount(store) {
    // We can listen to changes too
    store.changes.on('positionSet', event => {
      if (event.data.x < 0 || event.data.x > 100 ||
        event.data.y < 0 || event.data.y > 100
      ) {
        store.changes.push('postionSet', {
          x: Math.max(0, Math.min(100, event.data.x)),
          y: Math.max(0, Math.min(100, event.data.y))
        });
      }
    });
  }
});

// Create store

let store = factory.create();

let rect = document.createElement('div');
document.appendChild(rect);
rect.style.position = 'absolute';
rect.style.width = '10px';
rect.style.height = '10px';
rect.style.backgroundColor = '#ff0000';

window.addEventListener('mousemove', e => {
  store.dispatch({
    type: 'position/set',
    payload: {
      x: e.clientX, y: e.clientY
    }
  });
});

store.subscribe('position', () => {
  // Update DOM node
  rect.style.top = store.state.y + 'px';
  rect.style.left = store.state.x + 'px';
});
