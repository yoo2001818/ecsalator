import BitSet from '../../src/util/bitSet';
import expect from 'expect';

describe('BitSet', () => {
  let bitSet, otherSet;
  beforeEach('initalize BitSet', () => {
    bitSet = new BitSet();
    bitSet.set(1);
    bitSet.set(5);
    bitSet.set(9);
    otherSet = new BitSet();
    otherSet.set(1);
    otherSet.set(5);
  });
  describe('#constructor', () => {
    it('should copy bitset if bitset is given', () => {
      expect(new BitSet(bitSet)).toEqual(bitSet);
    });
  });
  describe('#size', () => {
    it('should return valid size in bits', () => {
      expect(bitSet.size()).toBe(32);
    });
  });
  describe('#clear', () => {
    it('should clear specified bit', () => {
      expect(bitSet.get(1)).toBe(true);
      bitSet.clear(1);
      expect(bitSet.get(1)).toBe(false);
    });
  });
  describe('#clearRange', () => {
    it('should clear bit range', () => {
      bitSet.clearRange(1, 5);
      for (let i = 1; i <= 5; ++i) expect(bitSet.get(i)).toBe(false);
    });
  });
  describe('#clearAll', () => {
    it('should clear all the bits', () => {
      bitSet.clearAll();
      for (let i = 0; i < 32; ++i) expect(bitSet.get(i)).toBe(false);
    });
  });
  describe('#set', () => {
    it('should set specified bit', () => {
      bitSet.set(2);
      expect(bitSet.get(2)).toBe(true);
    });
  });
  describe('#setRange', () => {
    it('should set bit range', () => {
      bitSet.setRange(1, 5);
      for (let i = 1; i <= 5; ++i) expect(bitSet.get(i)).toBe(true);
    });
  });
  describe('#setAll', () => {
    it('should set all the bits', () => {
      bitSet.setAll();
      for (let i = 0; i < 32; ++i) expect(bitSet.get(i)).toBe(true);
    });
  });
  describe('#and', () => {
    it('should clear all the bits if target is not provided', () => {
      bitSet.and();
      for (let i = 0; i < 32; ++i) expect(bitSet.get(i)).toBe(false);
    });
    it('should compute and correctly', () => {
      bitSet.setRange(0, 16);
      bitSet.and(otherSet);
      for (let i = 0; i <= 16; ++i) {
        expect(bitSet.get(i)).toBe(otherSet.get(i));
      }
    });
    it('should set excess bits to 0', () => {
      bitSet.setRange(0, 128);
      bitSet.and(otherSet);
      for (let i = 64; i <= 128; ++i) {
        expect(bitSet.get(i)).toBe(false);
      }
    });
  });
  describe('#or', () => {
    it('should do nothing if target is not provided', () => {
      bitSet.setRange(0, 16);
      bitSet.or();
      for (let i = 0; i <= 16; ++i) {
        expect(bitSet.get(i)).toBe(true);
      }
    });
    it('should compute or correctly', () => {
      bitSet.setRange(0, 16, false);
      bitSet.or(otherSet);
      for (let i = 0; i <= 16; ++i) {
        expect(bitSet.get(i)).toBe(otherSet.get(i));
      }
    });
    it('should set excess bits to bigger one', () => {
      bitSet.setRange(0, 128);
      bitSet.or(otherSet);
      for (let i = 0; i <= 128; ++i) {
        expect(bitSet.get(i)).toBe(true);
      }
    });
  });
  describe('#xor', () => {
    it('should do nothing if target is not provided', () => {
      bitSet.setRange(0, 16);
      bitSet.xor();
      for (let i = 0; i <= 16; ++i) {
        expect(bitSet.get(i)).toBe(true);
      }
    });
    it('should compute xor correctly', () => {
      bitSet.setRange(0, 16, true);
      bitSet.xor(otherSet);
      for (let i = 0; i <= 16; ++i) {
        expect(bitSet.get(i)).toBe(!otherSet.get(i));
      }
    });
    it('should set excess bits to bigger one', () => {
      bitSet.setRange(0, 128);
      bitSet.xor(otherSet);
      for (let i = 64; i <= 128; ++i) {
        expect(bitSet.get(i)).toBe(true);
      }
    });
  });
  describe('#not', () => {
    it('should compute not correctly', () => {
      let copy = new BitSet(bitSet);
      bitSet.not();
      for (let i = 0; i < 32; ++i) {
        expect(bitSet.get(i)).toBe(!copy.get(i));
      }
    });
  });
  describe('#isEmpty', () => {
    it('should return correct value', () => {
      expect(bitSet.isEmpty()).toBe(false);
      expect(new BitSet().isEmpty()).toBe(true);
    });
  });
});
