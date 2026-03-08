from collections import deque


class Queue:
    def __init__(self):
        self._data = deque()

    def enqueue(self, x):
        self._data.append(x)

    def dequeue(self):
        return self._data.popleft() if self._data else None


if __name__ == "__main__":
    q = Queue()
    q.enqueue(1)
    q.enqueue(2)
    print(q.dequeue())
    print(q.dequeue())
