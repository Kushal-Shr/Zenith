class Queue {
  constructor() { this.items = []; }
  enqueue(val) { this.items.push(val); }
  dequeue() { return this.items.shift(); }
  front() { return this.items[0]; }
  isEmpty() { return this.items.length === 0; }
}

const queue = new Queue();
queue.enqueue(5); queue.enqueue(10); queue.enqueue(15);
console.log(queue.dequeue());
console.log(queue.front());
console.log(queue.dequeue());
