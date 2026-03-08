def heap_insert(heap, x)
  heap << x
  i = heap.size - 1
  while i > 0
    p = (i - 1) / 2
    break if heap[p] <= heap[i]
    heap[p], heap[i] = heap[i], heap[p]
    i = p
  end
end

def heap_extract(heap)
  return nil if heap.empty?
  top = heap[0]
  heap[0] = heap.pop
  i, n = 0, heap.size
  loop do
    smallest = i
    l, r = 2 * i + 1, 2 * i + 2
    smallest = l if l < n && heap[l] < heap[smallest]
    smallest = r if r < n && heap[r] < heap[smallest]
    break if smallest == i
    heap[i], heap[smallest] = heap[smallest], heap[i]
    i = smallest
  end
  top
end

h = []
heap_insert(h, 5)
heap_insert(h, 2)
heap_insert(h, 8)
puts heap_extract(h)
puts heap_extract(h)
