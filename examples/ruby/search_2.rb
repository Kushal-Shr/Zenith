def binary_search(arr, target)
  lo, hi = 0, arr.size - 1
  while lo <= hi
    mid = (lo + hi) / 2
    return mid if arr[mid] == target
    arr[mid] < target ? lo = mid + 1 : hi = mid - 1
  end
  -1
end

data = [1, 3, 5, 7, 9]
puts binary_search(data, 5)
puts binary_search(data, 4)
