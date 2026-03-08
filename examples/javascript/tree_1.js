class TreeNode {
  constructor(val) { this.val = val; this.left = null; this.right = null; }
}

class BST {
  constructor() { this.root = null; }
  insert(val) {
    const node = new TreeNode(val);
    if (!this.root) { this.root = node; return; }
    let curr = this.root;
    while (true) {
      if (val < curr.val) {
        if (!curr.left) { curr.left = node; return; }
        curr = curr.left;
      } else {
        if (!curr.right) { curr.right = node; return; }
        curr = curr.right;
      }
    }
  }
  inorder(node = this.root) {
    if (!node) return [];
    return [...this.inorder(node.left), node.val, ...this.inorder(node.right)];
  }
}

const bst = new BST();
[5, 2, 8, 1, 3, 7, 9].forEach(v => bst.insert(v));
console.log(bst.inorder());
