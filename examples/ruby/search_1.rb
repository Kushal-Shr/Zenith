def linear_search(arr, target)
  arr.each_with_index { |x, i| return i if x == target }
  -1
end

data = [3, 7, 2, 9, 1]
puts linear_search(data, 7)
puts linear_search(data, 5)
