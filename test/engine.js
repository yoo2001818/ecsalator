import Engine from '../src/engine';
import expect from 'expect';

describe('Engine', () => {
  let engine;
  describe('#constructor', () => {
    it('shouldn\'t initalize without proper arguments', () => {
      expect(() => new Engine()).toThrow();
    });
    it('should have \'id\' component after initalization', () => {
      engine = new Engine([], [], []);
      expect(engine.state).toEqual({
        id: {}
      });
    });
    it('should override state if given', () => {
      engine = new Engine([], [], [], {id: {test: 'eee'}});
      expect(engine.state).toEqual({
        id: {
          test: 'eee'
        }
      });
    });
    it('should throw error if components and state mismatches', () => {
      expect(() => new Engine([], [], ['hey'], {id: {test: 'eee'}})).toThrow();
      expect(() => new Engine([], [], [], {id: {}, apple: {}})).toThrow();
    });
    it('should throw error if components and state mismatches', () => {
      expect(() => new Engine([], [], ['hey'], {id: {test: 'eee'}})).toThrow();
      expect(() => new Engine([], [], [], {id: {}, apple: {}})).toThrow();
    });
  });
});
