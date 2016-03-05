// A simple linked deque to reduce time complexity of queue using array.
// [entry, prev, next]
export default class LinkedDeque {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }
  push(entry) {
    let prevTail = this.tail;
    this.tail = [entry, prevTail, null];
    if (prevTail) prevTail[2] = this.tail;
    if (this.head == null) this.head = this.tail;
    this.length ++;
  }
  unshift(entry) {
    let prevHead = this.head;
    this.head = [entry, null, prevHead];
    if (prevHead) prevHead[1] = this.head;
    if (this.tail == null) this.tail = this.head;
    this.length ++;
  }
  shift() {
    let prevHead = this.head;
    if (prevHead == null) return null;
    this.head = prevHead[2];
    if (this.head) this.head[1] = null;
    if (this.head == null) this.tail = null;
    this.length --;
    return prevHead[0];
  }
  pop() {
    let prevTail = this.tail;
    if (prevTail == null) return null;
    this.tail = prevTail[1];
    if (this.tail) this.tail[2] = null;
    if (this.tail == null) this.head = null;
    this.length --;
    return prevTail[0];
  }
}
