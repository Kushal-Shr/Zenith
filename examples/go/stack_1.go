package main

import "fmt"

type Stack []int

func (s *Stack) Push(v int) {
	*s = append(*s, v)
}

func (s *Stack) Pop() int {
	n := len(*s) - 1
	v := (*s)[n]
	*s = (*s)[:n]
	return v
}

func main() {
	var s Stack
	s.Push(1)
	s.Push(2)
	s.Push(3)
	fmt.Println(s.Pop(), s.Pop(), s.Pop())
}
