class HashMap:
    def __init__(self, size=16):
        self._buckets = [[] for _ in range(size)]
        self._size = size

    def _hash(self, key):
        return hash(key) % self._size

    def put(self, key, value):
        h = self._hash(key)
        for i, (k, _) in enumerate(self._buckets[h]):
            if k == key:
                self._buckets[h][i] = (key, value)
                return
        self._buckets[h].append((key, value))

    def get(self, key):
        h = self._hash(key)
        for k, v in self._buckets[h]:
            if k == key:
                return v
        return None


if __name__ == "__main__":
    m = HashMap()
    m.put("a", 1)
    m.put("b", 2)
    print(m.get("a"))
    print(m.get("c"))
