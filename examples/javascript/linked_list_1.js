class Node {
  constructor(val) { this.val = val; this.next = null; }
}

class LinkedList {
  constructor() { this.head = null; }
  append(val) {
    const node = new Node(val);
    if (!this.head) { this.head = node; return; }
    let curr = this.head;
    while (curr.next) curr = curr.next;
    curr.next = node;
  }
  print() {
    const vals = [];
    let curr = this.head;
    while (curr) { vals.push(curr.val); curr = curr.next; }
    console.log(vals.join(" -> "));
  }
}

const list = new LinkedList();
list.append(1); list.append(2); list.append(3);
list.print();
