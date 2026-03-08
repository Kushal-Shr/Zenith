package main

import "fmt"

type Node struct {
	val  int
	next *Node
}

func (n *Node) append(v int) *Node {
	if n.next == nil {
		n.next = &Node{val: v}
		return n.next
	}
	return n.next.append(v)
}

func (n *Node) print() {
	if n == nil {
		return
	}
	fmt.Println(n.val)
	n.next.print()
}

func main() {
	head := &Node{val: 1}
	head.append(2).append(3)
	head.print()
}
