import EventQueue from '../src/eventQueue';
import expect from 'expect';

describe('EventQueue', () => {
  let queue;
  beforeEach('initalize EventQueue', () => {
    queue = new EventQueue(null, 'entity');
  });
  describe('#observe', () => {
    it('should register observer', () => {
      let passed = false;
      queue.observe(3, () => {
        passed = true;
      });
      queue.push(3, 'value', {});
      queue.notify();
      expect(passed).toBe(true);
    });
    it('should not register same observer twice', () => {
      let passed = 0;
      const observer = () => {
        passed++;
      };
      queue.observe(3, observer);
      queue.observe(3, observer);
      queue.push(3, 'value', {});
      queue.notify();
      expect(passed).toBe(1);
    });
  });
  describe('#unobserve', () => {
    it('should unregister observer', () => {
      let passed = 0;
      const observer = () => {
        passed++;
      };
      queue.observe(3, observer);
      queue.unobserve(3, observer);
      queue.push(3, 'value', {});
      queue.notify();
      expect(passed).toBe(0);
    });
    it('should not unregister other observers', () => {
      let passed = 0;
      const observer = () => {
        passed++;
      };
      queue.observe(3, () => passed--);
      queue.observe(3, observer);
      queue.unobserve(3, observer);
      queue.push(3, 'value', {});
      queue.notify();
      expect(passed).toBe(-1);
    });
  });
  describe('#notify', () => {
    it('should notify all the observers', () => {
      let passed = 0;
      queue.observe(3, () => {
        passed++;
      });
      queue.observe(3, () => {
        passed++;
      });
      queue.push(3, 'value', {});
      queue.notify();
      expect(passed).toBe(2);
    });
    it('should notify all the observers of all pushed keys', () => {
      let passed = 0;
      for (let key = 1; key <= 2; ++key) {
        for (let i = 0; i < 2; ++i) {
          queue.observe(key, () => passed++);
        }
      }
      queue.push(1, 'value', {});
      queue.push(2, 'value', {});
      queue.notify();
      expect(passed).toBe(4);
    });
    it('should not notify wrong observer', () => {
      let passed = false;
      queue.observe(5, () => {
        throw new Error('Should not reach here');
      });
      queue.observe(3, () => {
        passed = true;
      });
      queue.push(3, 'value', {});
      queue.notify();
      expect(passed).toBe(true);
    });
    it('should merge events to single event', () => {
      let passed = 0;
      queue.observe(3, event => {
        passed++;
        expect(event).toEqual({
          engine: null,
          type: 'entity',
          key: 3,
          values: {
            meow: 'woof',
            nyan: 'cat'
          }
        });
      });
      queue.push(3, 'meow', 'woof');
      queue.push(3, 'nyan', 'cat');
      queue.notify();
    });
    it('should empty the event queue', () => {
      let passed = 0;
      queue.observe(3, () => {
        passed++;
      });
      queue.push(3, 'value', {});
      queue.notify();
      queue.notify();
      expect(passed).toBe(1);
    });
    it('should be able to set engine and type', () => {
      queue = new EventQueue('hello', 'world');
      queue.observe(3, event => {
        expect(event).toEqual({
          engine: 'hello',
          type: 'world',
          key: 3,
          values: {
            so: 'awesome'
          }
        });
      });
      queue.push(3, 'so', 'awesome');
      queue.notify();
    });
  });
});
