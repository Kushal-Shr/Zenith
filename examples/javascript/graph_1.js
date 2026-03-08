class Graph {
  constructor() { this.adj = new Map(); }
  addVertex(v) { if (!this.adj.has(v)) this.adj.set(v, []); }
  addEdge(u, v) {
    this.addVertex(u); this.addVertex(v);
    this.adj.get(u).push(v);
  }
  dfs(start, visited = new Set()) {
    visited.add(start);
    console.log(start);
    for (const n of this.adj.get(start) || []) {
      if (!visited.has(n)) this.dfs(n, visited);
    }
  }
}

const g = new Graph();
g.addEdge(0, 1); g.addEdge(0, 2); g.addEdge(1, 2); g.addEdge(2, 0); g.addEdge(2, 3);
g.dfs(2);
