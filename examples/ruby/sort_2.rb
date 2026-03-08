def insertion_sort(arr)
  (1...arr.size).each do |i|
    key = arr[i]
    j = i - 1
    while j >= 0 && arr[j] > key
      arr[j + 1] = arr[j]
      j -= 1
    end
    arr[j + 1] = key
  end
  arr
end

data = [64, 34, 25, 12, 22]
puts insertion_sort(data.dup).inspect
