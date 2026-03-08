def heap_insert(heap, x):
    heap.append(x)
    i = len(heap) - 1
    while i > 0:
        p = (i - 1) // 2
        if heap[p] <= heap[i]:
            break
        heap[p], heap[i] = heap[i], heap[p]
        i = p


def heap_extract(heap):
    if not heap:
        return None
    top = heap[0]
    heap[0] = heap.pop()
    i, n = 0, len(heap)
    while True:
        smallest = i
        l, r = 2 * i + 1, 2 * i + 2
        if l < n and heap[l] < heap[smallest]:
            smallest = l
        if r < n and heap[r] < heap[smallest]:
            smallest = r
        if smallest == i:
            break
        heap[i], heap[smallest] = heap[smallest], heap[i]
        i = smallest
    return top


if __name__ == "__main__":
    h = []
    heap_insert(h, 5)
    heap_insert(h, 2)
    heap_insert(h, 8)
    print(heap_extract(h))
    print(heap_extract(h))
