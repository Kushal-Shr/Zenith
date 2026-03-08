package main

import "fmt"

type TreeNode struct {
	val   int
	left  *TreeNode
	right *TreeNode
}

func (t *TreeNode) insert(v int) *TreeNode {
	if t == nil {
		return &TreeNode{val: v}
	}
	if v < t.val {
		t.left = t.left.insert(v)
	} else {
		t.right = t.right.insert(v)
	}
	return t
}

func inorder(t *TreeNode) {
	if t == nil {
		return
	}
	inorder(t.left)
	fmt.Println(t.val)
	inorder(t.right)
}

func main() {
	var root *TreeNode
	for _, v := range []int{5, 3, 7, 1, 9} {
		root = root.insert(v)
	}
	inorder(root)
}
