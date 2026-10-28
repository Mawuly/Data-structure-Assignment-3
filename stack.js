// Stack data structure (Last-In, First-Out). push, pop and peek all take O(1) time.
class Stack {
  constructor() { this.items = []; }

  push(value) { this.items.push(value); }

  pop() { return this.items.length ? this.items.pop() : null; }

  peek() { return this.items.length ? this.items[this.items.length - 1] : null; }

  isEmpty() { return this.items.length === 0; }

  get size() { return this.items.length; }

  clear() { this.items = []; }

  // Returns the items with the top of the stack first (used for display)
  toArray() { return [...this.items].reverse(); }
}
