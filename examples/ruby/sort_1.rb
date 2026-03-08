def bubble_sort(arr)
  n = arr.size
  (0...n).each do |i|
    (0...n - 1 - i).each do |j|
      arr[j], arr[j + 1] = arr[j + 1], arr[j] if arr[j] > arr[j + 1]
    end
  end
  arr
end

data = [64, 34, 25, 12, 22]
puts bubble_sort(data.dup).inspect
