/**
 * The bit size of a single word, which is uint32.
 * @readonly
 * @static
 */
const BITS_PER_WORD = 32;
/**
 * The hamming table used for cardinality calculation.
 * @readonly
 * @static
 */
const HAMMING_TABLE = [
  0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4
];

/**
 * Implements an array of bits that grows by itself. Each bit is a boolean,
 * and its index is non-negative integer.
 * Basically it's Javascript implementation of Java's BitSet.
 * @constructor
 * @param [value] - Initial value for the BitSet.
 */
export default class BitSet {
  words: Uint32Array;
  constructor(value: BitSet | ?number) {
    if (value instanceof BitSet) {
      this.words = new Uint32Array(value.words);
    } else if (value != null) {
      this.words = new Uint32Array(Math.ceil(value / BITS_PER_WORD));
    } else {
      this.words = new Uint32Array(1);
    }
  }
  checkBounds(pos: number): void {
    if (pos < 0 || pos >= this.words.length * BITS_PER_WORD) {
      // throw new Error('BitSet pos ' + pos + ' is out of bounds');
      let newWords = new Uint32Array(Math.ceil((pos + 1) / BITS_PER_WORD));
      newWords.set(this.words);
      this.words = newWords;
    }
  }
  /**
   * Returns BitSet's allocated size in bits.
   * @returns {Number} allocated size in bits.
   */
  size(): number {
    return this.words.length * BITS_PER_WORD;
  }
  /**
   * Sets specified bit to false.
   * @param pos {Number} - The bit position to set to false.
   * @see {@link BitSet#set}
   */
  clear(pos: number): void {
    this.set(pos, false);
  }
  /**
   * Sets specified range of bits to false.
   * @param from {Number} - The start bit position.
   * @param to {Number} - The end bit position.
   * @see {@link BitSet#setRange}
   */
  clearRange(from: number, to: number): void {
    this.setRange(from, to, false);
  }
  /**
   * Sets all bits to false.
   * @see {@link BitSet#setAll}
   */
  clearAll(): void {
    this.setAll(false);
  }
  /**
   * Sets specified bit.
   * @param pos {Number} - The bit position to set.
   * @param set {Boolean} - The value to set.
   */
  set(pos: number, set: number | boolean = true): void {
    this.checkBounds(pos);
    let wordPos = pos / BITS_PER_WORD | 0;
    let shiftPos = (pos % BITS_PER_WORD);
    if (set) {
      this.words[wordPos] |= 1 << shiftPos;
    } else {
      this.words[wordPos] &= ~(1 << shiftPos);
    }
  }
  /**
   * Sets specified range of bits.
   * @param from {Number} - The start bit position.
   * @param to {Number} - The end bit position.
   * @param set {Boolean} - The value to set.
   */
  setRange(from: number, to: number, set: number | boolean = true): void {
    this.checkBounds(to);
    for (let i = from; i <= to; ++i) {
      let wordPos = i / BITS_PER_WORD | 0;
      let shiftPos = (i % BITS_PER_WORD);
      if (set) {
        this.words[wordPos] |= 1 << shiftPos;
      } else {
        this.words[wordPos] &= ~(1 << shiftPos);
      }
    }
  }
  /**
   * Sets all bits.
   * @param set {Boolean} - The value to set.
   */
  setAll(set: number | boolean = true): void {
    let val = 0;
    if (set) val = ~0;
    for (let i = 0; i < this.words.length; ++i) {
      this.words[i] = val;
    }
  }
  /**
   * Returns the value of specified bit.
   * @param pos {Number} - The bit position.
   * @returns {Boolean} Whether if the bit is set or not.
   */
  get(pos: number): boolean {
    this.checkBounds(pos);
    let wordPos = pos / BITS_PER_WORD | 0;
    let shiftPos = (pos % BITS_PER_WORD);
    return (this.words[wordPos] & (1 << shiftPos)) !== 0;
  }
  /**
   * Performs AND logical operation on two BitSet.
   * That means it will be set to 1 if both are 1, 0 otherwise.
   * The result will be applied to this BitSet.
   * @param set {BitSet} - The other BitSet.
   */
  and(set: ?BitSet): void {
    if (set == null) return this.clearAll();
    let intersectSize = Math.min(this.words.length, set.words.length);
    let unionSize = Math.max(this.words.length, set.words.length);
    this.checkBounds(unionSize * BITS_PER_WORD - 1);
    for (let i = 0; i < unionSize; ++i) {
      if (i > intersectSize) {
        this.words[i] = 0;
      } else {
        this.words[i] &= set.words[i];
      }
    }
  }
  /**
   * Performs OR logical operation on two BitSet.
   * That means it will be set to 1 if one of them is 1, 0 if both are 0.
   * The result will be applied to this BitSet.
   * @param set {BitSet} - The other BitSet.
   */
  or(set: ?BitSet): void {
    if (set == null) return;
    let unionSize = Math.max(this.words.length, set.words.length);
    this.checkBounds(unionSize * BITS_PER_WORD - 1);
    for (let i = 0; i < unionSize; ++i) this.words[i] |= set.words[i];
  }
  /**
   * Performs XOR logical operation on two BitSet.
   * That means it will be set to 1 if the bits are different, 0 if same.
   * The result will be applied to this BitSet.
   * @param set {BitSet} - The other BitSet.
   */
  xor(set: ?BitSet): void {
    if (set == null) return;
    let unionSize = Math.max(this.words.length, set.words.length);
    this.checkBounds(unionSize * BITS_PER_WORD - 1);
    for (let i = 0; i < unionSize; ++i) this.words[i] ^= set.words[i];
  }
  /**
   * Performs NOT logical operation on the BitSet.
   * That means it will be set to 1 if bit is 0, 0 otherwise.
   * The result will be applied to this BitSet.
   */
  not(): void {
    for (let i = 0; i < this.words.length; ++i) {
      this.words[i] = ~this.words[i];
    }
  }
  /**
   * Checkes whether the BitSet is filled with 0.
   * This function will return false if the BitSet has any bit that is set to 1.
   * @returns {Boolean} Whether if the BitSet is empty.
   */
  isEmpty(): boolean {
    for (let i = 0; i < this.words.length; ++i) {
      if (this.words[i]) return false;
    }
    return true;
  }
  /**
   * Checks if two BitSet has a same bit to set to 1.
   * This function will return true if they have matching part, false otherwise.
   * @param set - The other BitSet.
   * @returns {Boolean} Whether if two BitSet intersects.
   */
  intersects(set: ?BitSet): boolean {
    if (set == null) return false;
    let intersectSize = Math.min(this.words.length, set.words.length);
    for (let i = 0; i < intersectSize; ++i) {
      if (this.words[i] & set.words[i]) return true;
    }
    return false;
  }
  /**
   * Checks if this BitSet contains all the bits from the other BitSet.
   * @param set - The other BitSet.
   * @returns {Boolean} Whether if two BitSet intersects.
   */
  contains(set: ?BitSet): boolean {
    if (set == null) return false;
    let intersectSize = Math.min(this.words.length, set.words.length);
    for (let i = 0; i < intersectSize; ++i) {
      if ((this.words[i] & set.words[i]) !== set.words[i]) return false;
    }
    return true;
  }
  /**
   * Checks if two BitSet is same.
   * This function will return true if they are same, false otherwise.
   * @param set - The other BitSet.
   * @returns {Boolean} Whether if two BitSet equals.
   */
  equals(set: ?BitSet): boolean {
    if (set == null || !(set instanceof BitSet)) return false;
    let intersectSize = Math.min(this.words.length, set.words.length);
    let unionSize = Math.max(this.words.length, set.words.length);
    for (let i = 0; i < unionSize; ++i) {
      if (i > intersectSize) {
        if (set.words[i] || this.words[i]) return false;
      } else {
        if (this.words[i] !== set.words[i]) return false;
      }
    }
    return true;
  }
  /**
   * Returns the number of bits that has set to true in this BitSet.
   * @returns {Number} The number of bits that has set to true.
   */
  cardinality(): number {
    let count = 0;
    for (let i = 0; i < this.words.length; ++i) {
      let word = this.words[i];
      count += HAMMING_TABLE[word & 0xF];
      count += HAMMING_TABLE[(word >>> 4) & 0xF];
      count += HAMMING_TABLE[(word >>> 8) & 0xF];
      count += HAMMING_TABLE[(word >>> 12) & 0xF];
      count += HAMMING_TABLE[(word >>> 16) & 0xF];
      count += HAMMING_TABLE[(word >>> 20) & 0xF];
      count += HAMMING_TABLE[(word >>> 24) & 0xF];
      count += HAMMING_TABLE[(word >>> 28) & 0xF];
    }
    return count;
  }
  /**
   * Changes the BitSet to String form.
   * @param {Number} [redix=2] - The redix to use.
   * @returns {String} The stringified BitSet.
   */
  toString(redix: number): string {
    var map = [];
    for (let i = 0; i < this.words.length; ++i) {
      var value = this.words[i];
      map.push(value.toString(redix || 2));
    }
    return map.reverse().join(' ');
  }
}
