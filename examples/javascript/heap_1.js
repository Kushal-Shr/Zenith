class MinHeap {
  constructor() { this.arr = []; }
  insert(val) {
    this.arr.push(val);
    let i = this.arr.length - 1;
    while (i > 0) {
      const p = Math.floor((i - 1) / 2);
      if (this.arr[p] <= this.arr[i]) break;
      [this.arr[p], this.arr[i]] = [this.arr[i], this.arr[p]];
      i = p;
    }
  }
  extractMin() {
    if (this.arr.length === 0) return null;
    const min = this.arr[0];
    this.arr[0] = this.arr.pop();
    let i = 0;
    while (true) {
      if (2 * i + 1 >= this.arr.length) break;
      let c = 2 * i + 1;
      if (2 * i + 2 < this.arr.length && this.arr[2 * i + 2] < this.arr[c]) c = 2 * i + 2;
      if (this.arr[i] <= this.arr[c]) break;
      [this.arr[i], this.arr[c]] = [this.arr[c], this.arr[i]];
      i = c;
    }
    return min;
  }
}

const heap = new MinHeap();
heap.insert(5); heap.insert(2); heap.insert(8); heap.insert(1);
console.log(heap.extractMin());
console.log(heap.extractMin());
