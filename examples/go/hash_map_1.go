package main

import "fmt"

func main() {
	m := make(map[string]int)
	m["a"] = 1
	m["b"] = 2
	m["c"] = 3
	fmt.Println(m["b"])
	delete(m, "a")
	for k, v := range m {
		fmt.Println(k, v)
	}
}
