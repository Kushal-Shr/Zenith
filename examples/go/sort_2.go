package main

import "fmt"

func partition(arr []int, lo, hi int) int {
	pivot := arr[hi]
	i := lo - 1
	for j := lo; j < hi; j++ {
		if arr[j] <= pivot {
			i++
			arr[i], arr[j] = arr[j], arr[i]
		}
	}
	arr[i+1], arr[hi] = arr[hi], arr[i+1]
	return i + 1
}

func quickSort(arr []int, lo, hi int) {
	if lo < hi {
		p := partition(arr, lo, hi)
		quickSort(arr, lo, p-1)
		quickSort(arr, p+1, hi)
	}
}

func main() {
	arr := []int{64, 34, 25, 12, 22, 11, 90}
	quickSort(arr, 0, len(arr)-1)
	fmt.Println(arr)
}
