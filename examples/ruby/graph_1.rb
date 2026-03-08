def dfs(graph, start, visited = {})
  return [] if visited[start]
  visited[start] = true
  result = [start]
  (graph[start] || []).each { |u| result += dfs(graph, u, visited) }
  result
end

g = { 0 => [1, 2], 1 => [2], 2 => [0, 3], 3 => [3] }
puts dfs(g, 2).inspect
