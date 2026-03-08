package main

import "fmt"

func linearSearch(arr []int, target int) int {
	for i, v := range arr {
		if v == target {
			return i
		}
	}
	return -1
}

func main() {
	arr := []int{3, 7, 2, 9, 1, 5}
	fmt.Println(linearSearch(arr, 9))
	fmt.Println(linearSearch(arr, 4))
}
