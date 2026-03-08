from collections import deque


def bfs(graph, start):
    visited = set()
    q = deque([start])
    result = []
    while q:
        v = q.popleft()
        if v in visited:
            continue
        visited.add(v)
        result.append(v)
        for u in graph.get(v, []):
            if u not in visited:
                q.append(u)
    return result


if __name__ == "__main__":
    g = {0: [1, 2], 1: [2], 2: [0, 3], 3: [3]}
    print(bfs(g, 2))
