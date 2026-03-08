package main

import "fmt"

func dfs(graph map[int][]int, start int, visited map[int]bool) {
	if visited[start] {
		return
	}
	visited[start] = true
	fmt.Println(start)
	for _, n := range graph[start] {
		dfs(graph, n, visited)
	}
}

func main() {
	graph := map[int][]int{
		0: {1, 2},
		1: {2},
		2: {0, 3},
		3: {3},
	}
	visited := make(map[int]bool)
	dfs(graph, 2, visited)
}
