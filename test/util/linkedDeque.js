import LinkedDeque from '../../src/util/linkedDeque';
import expect from 'expect';

describe('LinkedDeque', () => {
  let linkedDeque;
  beforeEach('initalize LinkedDeque', () => {
    linkedDeque = new LinkedDeque();
  });
  describe('#push', () => {
    it('should set length', () => {
      linkedDeque.push(1);
      expect(linkedDeque.length).toBe(1);
    });
    it('should add item', () => {
      for (let i = 0; i < 10; ++i) linkedDeque.push(i);
      for (let i = 9; i >= 5; --i) expect(linkedDeque.pop()).toBe(i);
      for (let i = 0; i < 5; ++i) expect(linkedDeque.shift()).toBe(i);
    });
  });
  describe('#unshift', () => {
    it('should set length', () => {
      linkedDeque.unshift(1);
      expect(linkedDeque.length).toBe(1);
    });
    it('should add item', () => {
      for (let i = 9; i >= 0; --i) linkedDeque.unshift(i);
      for (let i = 0; i < 5; ++i) expect(linkedDeque.shift()).toBe(i);
      for (let i = 9; i >= 5; --i) expect(linkedDeque.pop()).toBe(i);
    });
  });
  describe('#pop', () => {
    it('should return null if empty', () => {
      expect(linkedDeque.pop()).toBe(null);
    });
  });
  describe('#shift', () => {
    it('should return null if empty', () => {
      expect(linkedDeque.shift()).toBe(null);
    });
  });
});
