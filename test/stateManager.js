import StateManager from '../src/stateManager';
import expect from 'expect';

describe('StateManager', () => {
  let stateManager, finalizer;
  beforeEach('initalize StateManager', () => {
    finalizer = () => {};
    stateManager = new StateManager(event => finalizer(event));
  });
  describe('#push', () => {
    it('should push event to the queue', () => {
      let count = 1;
      finalizer = event => {
        expect(event.data).toBe(count);
        count ++;
      };
      stateManager.push('test', 1);
      stateManager.push('test', 2);
      stateManager.commit();
      expect(count).toBe(3);
    });
    it('should accept event object', () => {
      let originalEvent = {
        type: 'test', data: 53
      };
      finalizer = event => expect(event).toBe(originalEvent);
      stateManager.push(originalEvent);
      stateManager.commit();
    });
  });
  describe('#unshift', () => {
    it('should unshift event to the queue', () => {
      let count = 2;
      finalizer = event => {
        expect(event.data).toBe(count);
        count --;
      };
      stateManager.unshift('test', 1);
      stateManager.unshift('test', 2);
      stateManager.commit();
      expect(count).toBe(0);
    });
    it('should accept event object', () => {
      let originalEvent = {
        type: 'test', data: 53
      };
      finalizer = event => expect(event).toBe(originalEvent);
      stateManager.unshift(originalEvent);
      stateManager.commit();
    });
  });
  describe('#commit', () => {
    it('should call finalizer', () => {
      let result = false;
      finalizer = () => result = true;
      stateManager.push('test', 1);
      stateManager.commit();
      expect(result).toBe(true);
    });
    it('should call event listeners', () => {
      let result = false;
      stateManager.on('test', () => result = true);
      stateManager.push('test', 1);
      stateManager.commit();
      expect(result).toBe(true);
    });
  });
  describe('#reset', () => {
    it('should reset queue', () => {
      let result = false;
      finalizer = () => result = true;
      stateManager.reset();
      stateManager.push('test', 1);
      stateManager.reset();
      stateManager.commit();
      expect(result).toBe(false);
    });
  });
});
