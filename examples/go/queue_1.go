package main

import "fmt"

type Queue []int

func (q *Queue) Enqueue(v int) {
	*q = append(*q, v)
}

func (q *Queue) Dequeue() int {
	v := (*q)[0]
	*q = (*q)[1:]
	return v
}

func main() {
	var q Queue
	q.Enqueue(1)
	q.Enqueue(2)
	q.Enqueue(3)
	fmt.Println(q.Dequeue(), q.Dequeue(), q.Dequeue())
}
