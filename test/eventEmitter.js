import EventEmitter from '../src/eventEmitter';
import expect from 'expect';

describe('EventEmitter', () => {
  let eventEmitter;
  beforeEach('initalize EventEmitter', () => {
    eventEmitter = new EventEmitter();
  });
  describe('#on', () => {
    it('should register listener', () => {
      let ok = false;
      expect(eventEmitter.on('dummy', () => ok = true)).toBe(true);
      eventEmitter.emit('dummy');
      expect(ok).toBe(true);
    });
    it('should register listeners', () => {
      let ok = 0;
      expect(eventEmitter.on('dummy', () => ok++)).toBe(true);
      expect(eventEmitter.on('dummy', () => ok++)).toBe(true);
      eventEmitter.emit('dummy');
      expect(ok).toBe(2);
    });
    it('should not register same listener twice', () => {
      let ok = 0;
      let listener = () => ok++;
      expect(eventEmitter.on('dummy', listener)).toBe(true);
      expect(eventEmitter.on('dummy', listener)).toBe(false);
      eventEmitter.emit('dummy');
      expect(ok).toBe(1);
    });
  });
  describe('#addListener', () => {
    it('should be same as on()', () => {
      let ok = false;
      eventEmitter.addListener('dummy', () => ok = true);
      eventEmitter.emit('dummy');
      expect(ok).toBe(true);
    });
  });
  describe('#listeners', () => {
    it('should return array of listeners', () => {
      let listener = () => {};
      eventEmitter.addListener('dummy', listener);
      expect(eventEmitter.listeners('dummy')).toEqual([
        listener
      ]);
    });
    it('should return empty array if not exists', () => {
      expect(eventEmitter.listeners('test')).toEqual([]);
    });
  });
  describe('#removeAllListeners', () => {
    it('should remove all listeners', () => {
      eventEmitter.on('test', () => {});
      expect(eventEmitter.removeAllListeners('test')).toBe(true);
      expect(eventEmitter.listeners('test')).toEqual([]);
    });
    it('should return false if not exists', () => {
      expect(eventEmitter.removeAllListeners('test')).toBe(false);
    });
  });
  describe('#removeListener', () => {
    it('should remove listener', () => {
      let listener = () => {};
      eventEmitter.addListener('test', listener);
      expect(eventEmitter.removeListener('test', listener)).toBe(true);
      expect(eventEmitter.listeners('test')).toEqual([]);
    });
    it('should return false if group does not exists', () => {
      expect(eventEmitter.removeListener('test', () => {})).toBe(false);
    });
    it('should return false if listener does not exists', () => {
      let listener = () => {};
      eventEmitter.addListener('test', listener);
      expect(eventEmitter.removeListener('test', () => {})).toBe(false);
    });
  });
  describe('#emit', () => {
    it('should call listeners with arguments', () => {
      let ok = false;
      eventEmitter.on('dummy', (a, b) => {
        expect(a).toBe(33);
        expect(b).toBe(53);
        ok = true;
      });
      eventEmitter.emit('dummy', 33, 53);
      expect(ok).toBe(true);
    });
    it('should ignore if group does not exists', () => {
      eventEmitter.emit('dummy');
    });
  });
});
